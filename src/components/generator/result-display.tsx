'use client';

import { RotatingTips } from '@/components/rotating-tips';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { downloadFile } from '@/lib/download';
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LinkIcon,
  Loader2Icon,
  MailIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGenerator } from './generator-context';

const LOADING_TIPS = [
  '📊 Track all progress in Creation History 🎯',
  '💌 Need help? Contact us anytime 🚀',
  '✨ You can submit another generation while waiting ⚡',
  '🎬 Higher resolution takes longer to generate 🖼️',
];
const TIP_INTERVAL = 4000;

function ContactUsLink() {
  const supportEmail = websiteConfig.mail.supportEmail;
  const emailAddress = supportEmail?.match(/<(.+)>/)?.[1] ?? supportEmail;
  if (!emailAddress) return null;

  return (
    <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
      <a href={`mailto:${emailAddress}`}>
        <MailIcon className="size-4" />
        <span>Contact Us</span>
      </a>
    </Button>
  );
}

function GenerationIdBar({ taskId }: { taskId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(taskId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Generation ID:</span>
        <span className="font-mono">{taskId}</span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        title="Copy ID"
      >
        {copied ? (
          <CheckIcon className="size-3.5" />
        ) : (
          <CopyIcon className="size-3.5" />
        )}
      </button>
    </div>
  );
}

export function ResultDisplay() {
  const { state, result, error, reset, model, taskId } = useGenerator();

  const isVideo = model.category === 'video';
  const minHeight = isVideo
    ? 'min-h-[250px] md:min-h-[350px]'
    : 'min-h-[300px] md:min-h-[400px]';

  // Auto-scroll to result area when generation starts
  const resultRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (
      prev === 'idle' &&
      (state === 'submitting' || state === 'polling' || state === 'done')
    ) {
      resultRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [state]);

  return (
    <div className="space-y-3">
      {/* Top action bar — always visible */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
          <a href="/generations" target="_blank" rel="noreferrer">
            <ExternalLinkIcon className="size-4" />
            <span>Creation History</span>
          </a>
        </Button>
        <ContactUsLink />
      </div>

      {/* Main content area */}
      <div ref={resultRef}>
        <ResultContent
          state={state}
          result={result}
          error={error}
          reset={reset}
          model={model}
          isVideo={isVideo}
          minHeight={minHeight}
        />
      </div>

      {/* Generation ID — at the bottom */}
      {taskId && <GenerationIdBar taskId={taskId} />}
    </div>
  );
}

function ResultContent({
  state,
  result,
  error,
  reset,
  model,
  isVideo,
  minHeight,
}: {
  state: ReturnType<typeof useGenerator>['state'];
  result: ReturnType<typeof useGenerator>['result'];
  error: ReturnType<typeof useGenerator>['error'];
  reset: ReturnType<typeof useGenerator>['reset'];
  model: ReturnType<typeof useGenerator>['model'];
  isVideo: boolean;
  minHeight: string;
}) {
  // Idle: show sample media
  if (state === 'idle') {
    return (
      <div
        className={`${minHeight} w-full overflow-hidden rounded-lg border bg-muted`}
      >
        {model.sampleMedia ? (
          isVideo ? (
            <video
              src={model.sampleMedia}
              autoPlay
              muted
              loop
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <img
              src={model.sampleMedia}
              alt={`${model.name} sample`}
              className="size-full object-cover"
            />
          )
        ) : (
          <div className="flex size-full items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Your generated {isVideo ? 'video' : 'image'} will appear here
            </p>
          </div>
        )}
      </div>
    );
  }

  // Loading
  if (state === 'submitting' || state === 'polling') {
    return (
      <div
        className={`flex ${minHeight} w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border bg-muted`}
      >
        <Loader2Icon className="size-8 animate-spin text-gray-500" />
        <p className="text-gray-500 text-sm">
          {state === 'submitting' ? 'Submitting...' : 'Generating...'}
        </p>
        {state === 'polling' && (
          <RotatingTips
            tips={LOADING_TIPS}
            interval={TIP_INTERVAL}
            className="h-6 text-sm text-muted-foreground px-4"
          />
        )}
      </div>
    );
  }

  // Error
  if (state === 'failed') {
    return (
      <div
        className={`flex ${minHeight} w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border bg-muted`}
      >
        <p className="text-red-500 text-sm">{error || 'Generation failed'}</p>
        <p className="text-red-400 text-xs">Please try again</p>
        <Button variant="outline" size="sm" onClick={reset} className="mt-2">
          <RefreshCwIcon className="mr-1.5 size-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Done
  if (state === 'done' && result) {
    const output = result.output as Record<string, string> | null;
    const outputUrl = output?.url || output?.video_url || output?.image_url;

    if (!outputUrl) {
      return (
        <div
          className={`flex ${minHeight} w-full items-center justify-center overflow-hidden rounded-lg border bg-muted`}
        >
          <p className="text-muted-foreground text-sm">
            Generation complete but no output URL found
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          {result.type === 'video' ? (
            <video
              src={outputUrl}
              controls
              autoPlay
              loop
              muted
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={outputUrl}
              alt="Generated result"
              className="w-full rounded-md"
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-1 items-center justify-center gap-2"
            onClick={() => {
              const ext = result.type === 'video' ? 'mp4' : 'png';
              downloadFile(outputUrl, `yino-${Date.now()}.${ext}`);
            }}
          >
            <DownloadIcon className="size-4" />
            <span>Download</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-1 items-center justify-center gap-2"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(outputUrl);
                toast.success('Link copied to clipboard');
              } catch {
                toast.error('Failed to copy link');
              }
            }}
          >
            <LinkIcon className="size-4" />
            <span>Copy Link</span>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
