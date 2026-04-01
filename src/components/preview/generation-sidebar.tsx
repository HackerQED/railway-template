'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  IconAlertCircle,
  IconLoader2,
  IconPhoto,
  IconVideo,
} from '@tabler/icons-react';

export interface GenerationItem {
  id: string;
  type: string;
  status: string;
  comment: string | null;
  output: { url?: string; urls?: string[] } | null;
}

function getThumbnailUrl(gen: GenerationItem): string | null {
  if (gen.status !== 'done' || !gen.output) return null;
  if (gen.output.urls?.[0]) return gen.output.urls[0];
  if (gen.output.url) return gen.output.url;
  return null;
}

function GenerationThumbnail({
  gen,
  onClick,
}: { gen: GenerationItem; onClick?: () => void }) {
  const url = getThumbnailUrl(gen);
  const label = gen.comment || gen.id.slice(0, 8);

  const isPending = gen.status === 'pending' || gen.status === 'processing';
  const isFailed = gen.status === 'failed';
  const isVideo = gen.type === 'video';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="relative aspect-square w-full rounded-md overflow-hidden bg-muted border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        >
          {url ? (
            <>
              {isVideo ? (
                <video
                  src={url}
                  className="size-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={url}
                  alt={label}
                  className="size-full object-cover"
                  loading="lazy"
                />
              )}
              {/* type badge */}
              <div className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5">
                {isVideo ? (
                  <IconVideo className="size-3 text-white" />
                ) : (
                  <IconPhoto className="size-3 text-white" />
                )}
              </div>
            </>
          ) : isPending ? (
            <div className="flex size-full items-center justify-center">
              <IconLoader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : isFailed ? (
            <div className="flex size-full items-center justify-center">
              <IconAlertCircle className="size-6 text-destructive" />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center">
              {isVideo ? (
                <IconVideo className="size-6 text-muted-foreground" />
              ) : (
                <IconPhoto className="size-6 text-muted-foreground" />
              )}
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <div className="text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-muted-foreground">
            {gen.type} · {gen.status}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function GenerationSidebar({
  generations,
  onSelect,
}: {
  generations: GenerationItem[];
  onSelect?: (genId: string) => void;
}) {
  if (generations.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">Generations</h2>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3">
        {generations.length} items · Latest first
      </p>
      <div className="flex flex-col gap-2">
        {generations.map((gen) => (
          <GenerationThumbnail
            key={gen.id}
            gen={gen}
            onClick={onSelect ? () => onSelect(gen.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
