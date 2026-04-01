'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGenerator } from './generator-context';

export function PromptInput() {
  const { prompt, setPrompt, model } = useGenerator();

  const placeholder =
    model.category === 'video'
      ? 'A cinematic tracking shot through a misty forest at dawn...'
      : 'A beautiful landscape with mountains and lakes, photorealistic, 4K...';

  return (
    <div className="space-y-2">
      <Label htmlFor="generator-prompt">Prompt</Label>
      <Textarea
        id="generator-prompt"
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[100px] resize-none"
        required
      />
    </div>
  );
}
