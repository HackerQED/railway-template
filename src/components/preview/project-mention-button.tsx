'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconAt } from '@tabler/icons-react';
import { toast } from 'sonner';

export function ProjectMentionButton({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  const handleCopy = () => {
    const text = `project: ${projectId}\ntitle: ${title}`;
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
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <IconAt className="size-3.5" />
          <span>Mention in Agent</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Copy project reference</TooltipContent>
    </Tooltip>
  );
}
