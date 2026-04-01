'use client';

import type { ModelConfig } from '@/config/models';
import { MODELS_MAP, getChannels } from '@/config/models';
import { creditsKeys } from '@/hooks/use-credits';
import type { GenerationStatus } from '@/lib/generation-client';
import {
  GenerationApiError,
  fetchGenerationStatus,
  submitGeneration,
} from '@/lib/generation-client';
import { usePricingDialogStore } from '@/stores/pricing-dialog-store';
import { useQueryClient } from '@tanstack/react-query';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

export type GeneratorState =
  | 'idle'
  | 'submitting'
  | 'polling'
  | 'done'
  | 'failed';

interface GeneratorContextValue {
  model: ModelConfig;
  /** All channels sharing the same slug (empty if no channels) */
  channels: ModelConfig[];
  /** Switch to a different channel by model id */
  switchChannel: (modelId: string) => void;
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  paramValues: Record<string, string>;
  setParamValue: (id: string, value: string) => void;
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  /** Per-image real-person flags (keyed by URL) */
  realPersonFlags: Record<string, boolean>;
  setRealPersonFlag: (url: string, value: boolean) => void;
  state: GeneratorState;
  /** Whether the submit API call is in flight (button should be disabled) */
  isSubmitting: boolean;
  /** The task ID returned after successful submission */
  taskId: string | null;
  result: GenerationStatus | null;
  error: string | null;
  submit: () => Promise<void>;
  reset: () => void;
}

const GeneratorContext = createContext<GeneratorContextValue | null>(null);

export function useGenerator(): GeneratorContextValue {
  const ctx = useContext(GeneratorContext);
  if (!ctx)
    throw new Error('useGenerator must be used within GeneratorProvider');
  return ctx;
}

function getDefaultParams(m: ModelConfig): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const p of m.params) {
    defaults[p.id] = String(p.default);
  }
  return defaults;
}

interface GeneratorProviderProps {
  defaultModelId: string;
  defaultMode?: string;
  children: ReactNode;
}

export function GeneratorProvider({
  defaultModelId,
  defaultMode,
  children,
}: GeneratorProviderProps) {
  const initialModel = MODELS_MAP.get(defaultModelId);
  if (!initialModel) throw new Error(`Unknown model: ${defaultModelId}`);

  const [model, setModel] = useState<ModelConfig>(initialModel);
  const channels = getChannels(model.slug);

  const switchChannel = useCallback((modelId: string) => {
    const next = MODELS_MAP.get(modelId);
    if (!next) return;
    setModel(next);
    // Reset params to new model's defaults
    setParamValues(getDefaultParams(next));
    // Reset mode to new model's first mode
    setSelectedMode(next.modes[0].id);
    // Reset media since constraints may differ
    setImageUrls([]);
    setRealPersonFlags({});
  }, []);

  const [selectedMode, setSelectedMode] = useState(
    defaultMode || model.modes[0].id
  );
  const [prompt, setPrompt] = useState('');
  const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
    getDefaultParams(model)
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [realPersonFlags, setRealPersonFlags] = useState<
    Record<string, boolean>
  >({});
  const setRealPersonFlag = useCallback((url: string, value: boolean) => {
    setRealPersonFlags((prev) => ({ ...prev, [url]: value }));
  }, []);
  const [state, setState] = useState<GeneratorState>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const invalidateCredits = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: creditsKeys.all });
  }, [queryClient]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retriesRef = useRef(0);
  const MAX_POLL_RETRIES = 60; // 60 × 3s = 3 minutes

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    retriesRef.current = 0;
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const setParamValue = useCallback((id: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const startPolling = useCallback(
    (taskId: string) => {
      stopPolling();
      setState('polling');
      retriesRef.current = 0;

      const poll = async () => {
        try {
          const statuses = await fetchGenerationStatus([taskId]);
          const gen = statuses.find((s) => s.id === taskId);
          if (!gen) return;

          if (gen.status === 'done') {
            setResult(gen);
            setState('done');
            stopPolling();
            invalidateCredits();
          } else if (gen.status === 'failed') {
            const rawError = gen.error;
            const errorMsg =
              typeof rawError === 'string'
                ? rawError
                : rawError && typeof rawError === 'object' && 'message' in rawError
                  ? rawError.message
                  : 'Generation failed';
            setError(errorMsg);
            setState('failed');
            stopPolling();
            invalidateCredits();
            toast.error(errorMsg);
          }
        } catch {
          retriesRef.current += 1;
          if (retriesRef.current >= MAX_POLL_RETRIES) {
            const errorMsg = 'Generation timed out. Please try again.';
            setError(errorMsg);
            setState('failed');
            stopPolling();
            toast.error(errorMsg);
          }
        }
      };

      poll();
      pollingRef.current = setInterval(poll, 3000);
    },
    [stopPolling, invalidateCredits]
  );

  const openPricingDialog = usePricingDialogStore((s) => s.openPricingDialog);

  const submit = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    setState('submitting');
    setError(null);
    setResult(null);
    setTaskId(null);

    try {
      const currentMode = model.modes.find((m) => m.id === selectedMode);
      const params: Record<string, unknown> = { prompt: prompt.trim() };

      for (const p of model.params) {
        if (paramValues[p.id] !== undefined) {
          params[p.id] = paramValues[p.id];
        }
      }

      if (imageUrls.length > 0) {
        if (selectedMode === 'keyframes') {
          params.first_frame_url = imageUrls[0];
          if (imageUrls[1]) params.last_frame_url = imageUrls[1];
        } else if (selectedMode === 'reference') {
          params.reference_urls = imageUrls;
        } else if (
          currentMode?.acceptedMediaTypes &&
          currentMode.acceptedMediaTypes.length > 1
        ) {
          // Multi-media mode (e.g. Seedance 2.0): images, videos, audio
          params.media_urls = imageUrls;
        } else {
          // Generic fallback (e.g. seedream image editing)
          params.image_urls = imageUrls;
        }

        // Pass per-image real-person flags when the mode supports it
        if (currentMode?.showRealPerson) {
          const flags: Record<string, boolean> = {};
          for (const url of imageUrls) {
            if (url && realPersonFlags[url]) {
              flags[url] = true;
            }
          }
          if (Object.keys(flags).length > 0) {
            params.real_person_flags = flags;
          }
        }
      }

      // Reference mode forces fast
      if (selectedMode === 'reference') {
        params.model = 'fast';
      }

      const { task_id } = await submitGeneration(
        model.endpoint,
        params as unknown as Parameters<typeof submitGeneration>[1]
      );

      setTaskId(task_id);
      setIsSubmitting(false);
      invalidateCredits();
      startPolling(task_id);
    } catch (err) {
      setIsSubmitting(false);
      // Insufficient credits: show pricing dialog instead of generic error toast
      if (err instanceof GenerationApiError && err.status === 402) {
        setError('Insufficient credits');
        setState('failed');
        openPricingDialog();
        return;
      }

      const errorMsg = err instanceof Error ? err.message : 'Submit failed';
      setError(errorMsg);
      setState('failed');
      toast.error(errorMsg);
    }
  }, [
    prompt,
    model,
    selectedMode,
    paramValues,
    imageUrls,
    realPersonFlags,
    startPolling,
    invalidateCredits,
    openPricingDialog,
  ]);

  const reset = useCallback(() => {
    stopPolling();
    setIsSubmitting(false);
    setState('idle');
    setTaskId(null);
    setResult(null);
    setError(null);
  }, [stopPolling]);

  return (
    <GeneratorContext.Provider
      value={{
        model,
        channels,
        switchChannel,
        selectedMode,
        setSelectedMode,
        prompt,
        setPrompt,
        paramValues,
        setParamValue,
        imageUrls,
        setImageUrls,
        realPersonFlags,
        setRealPersonFlag,
        state,
        isSubmitting,
        taskId,
        result,
        error,
        submit,
        reset,
      }}
    >
      {children}
    </GeneratorContext.Provider>
  );
}
