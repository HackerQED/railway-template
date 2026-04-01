'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveCreditCost } from '@/config/models';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { ChannelSelector } from './channel-selector';
import { GeneratorProvider, useGenerator } from './generator-context';
import { ImageUpload } from './image-upload';
import { MediaUpload } from './media-upload';
import { ModelSelector } from './model-selector';
import { ParamControls } from './param-controls';
import { PromptInput } from './prompt-input';
import { ResultDisplay } from './result-display';

// SubmitButton depends on client-side session — skip SSR to avoid hydration mismatch
const SubmitButton = dynamic(
  () => import('./submit-button').then((m) => m.SubmitButton),
  { ssr: false }
);

interface GeneratorProps {
  defaultModelId: string;
  defaultMode?: string;
}

export function Generator({ defaultModelId, defaultMode }: GeneratorProps) {
  return (
    <GeneratorProvider
      defaultModelId={defaultModelId}
      defaultMode={defaultMode}
    >
      <GeneratorInner />
    </GeneratorProvider>
  );
}

const OMNI_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.mp3', '.wav'];

function GeneratorInner() {
  const { model, selectedMode, setSelectedMode, paramValues, imageUrls } =
    useGenerator();
  const currentMode = model.modes.find((m) => m.id === selectedMode);

  const hasOmniMedia = useMemo(() => {
    return imageUrls.some((url) => {
      try {
        const pathname = new URL(url).pathname.toLowerCase();
        return OMNI_EXTENSIONS.some((ext) => pathname.endsWith(ext));
      } catch {
        return false;
      }
    });
  }, [imageUrls]);

  const creditCost = useMemo(
    () => resolveCreditCost(model, paramValues, hasOmniMedia),
    [model, paramValues, hasOmniMedia]
  );

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: Form controls */}
          <div className="space-y-4">
            <ModelSelector />

            <ChannelSelector />

            {/* Mode tabs */}
            {model.modes.length > 1 && (
              <Tabs value={selectedMode} onValueChange={setSelectedMode}>
                <TabsList
                  className={`grid w-full ${model.modes.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
                >
                  {model.modes.map((mode) => (
                    <TabsTrigger
                      key={mode.id}
                      value={mode.id}
                      className="flex-1"
                    >
                      {mode.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            <PromptInput />
            {currentMode?.acceptedMediaTypes ? (
              <MediaUpload />
            ) : (
              currentMode?.requiresImageUpload && <ImageUpload />
            )}
            <ParamControls />

            {/* Credit cost + Generate button — stacked vertically */}
            <div className="space-y-2">
              <p className="text-center text-muted-foreground text-sm">
                Credits required: {creditCost}
                {model.estimatedTime && (
                  <span className="ml-2">· Est. {model.estimatedTime}</span>
                )}
              </p>
              <SubmitButton />
            </div>
          </div>

          {/* Right: Result preview (sticky) */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ResultDisplay />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
