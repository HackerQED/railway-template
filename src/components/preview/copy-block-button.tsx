'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconAt } from '@tabler/icons-react';
import { toast } from 'sonner';
import type { BlockRenderContext } from './block-renderer';

export function CopyBlockButton({
  path,
  title,
  ctx,
}: {
  path: string;
  title?: string;
  ctx: BlockRenderContext;
}) {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lines = [`project: ${ctx.projectId}`, `block: ${path}`];
    if (title) lines.push(`title: ${title}`);
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    toast('Copied — paste it to your agent', {
      description: (
        <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
          {text}
        </pre>
      ),
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <IconAt className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Mention in Agent</TooltipContent>
    </Tooltip>
  );
}
