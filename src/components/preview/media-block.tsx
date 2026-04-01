'use client';

import type { MediaBlock } from '@/lib/preview-blocks';
import { IconInfoCircle } from '@tabler/icons-react';
import { BlockHeader } from './block-header';
import type { BlockRenderContext } from './block-renderer';

function inferMediaType(url: string): 'image' | 'video' | 'audio' {
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (!ext) return 'image';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) return 'audio';
  return 'image';
}

type ResolvedMedia =
  | { state: 'ready'; url: string; mediaType: 'image' | 'video' | 'audio' }
  | { state: 'loading' }
  | { state: 'failed' }
  | { state: 'unavailable' };

function resolveMedia(
  block: MediaBlock,
  ctx: BlockRenderContext
): ResolvedMedia {
  if (block.generationId) {
    const gen = ctx.generations.get(block.generationId);
    if (!gen) return { state: 'unavailable' };
    if (gen.status === 'pending' || gen.status === 'processing')
      return { state: 'loading' };
    if (gen.status === 'failed') return { state: 'failed' };
    if (!gen.output || !('url' in gen.output) || !gen.output.url)
      return { state: 'unavailable' };
    const mediaType =
      gen.type === 'video' ? 'video' : gen.type === 'audio' ? 'audio' : 'image';
    return { state: 'ready', url: gen.output.url, mediaType };
  }
  if (block.url) {
    return {
      state: 'ready',
      url: block.url,
      mediaType: inferMediaType(block.url),
    };
  }
  return { state: 'unavailable' };
}

/**
 * Media block — always rendered as a card inside a group grid.
 */
export function MediaBlockView({
  block,
  ctx,
  path,
}: {
  block: MediaBlock;
  ctx: BlockRenderContext;
  path: string;
}) {
  const media = resolveMedia(block, ctx);
  const canShowDetail = block.generationId && ctx.onSelectGeneration;

  return (
    <div className="group/block rounded-lg border bg-card overflow-hidden">
      {(block.title || block.comment || canShowDetail) && (
        <div className="flex items-start justify-between p-3 pb-0">
          <div className="flex-1 min-w-0">
            <BlockHeader
              title={block.title}
              comment={block.comment}
              path={path}
              ctx={ctx}
            />
          </div>
          {canShowDetail && (
            <button
              type="button"
              onClick={() => ctx.onSelectGeneration!(block.generationId!)}
              className="shrink-0 ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Details"
            >
              <IconInfoCircle className="size-3.5" />
              <span className="hidden sm:inline">Details</span>
            </button>
          )}
        </div>
      )}
      <div className="p-3">
        <MediaContent media={media} alt={block.title} />
      </div>
    </div>
  );
}

function MediaContent({
  media,
  alt,
}: {
  media: ResolvedMedia;
  alt?: string;
}) {
  const containerClass = 'h-48 rounded-md bg-muted';

  if (media.state === 'loading') {
    return (
      <div
        className={`flex items-center justify-center text-sm text-muted-foreground gap-2 ${containerClass}`}
      >
        <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        Generating…
      </div>
    );
  }
  if (media.state === 'failed') {
    return (
      <div
        className={`flex items-center justify-center text-sm text-destructive ${containerClass}`}
      >
        Generation failed
      </div>
    );
  }
  if (media.state === 'unavailable') {
    return (
      <div
        className={`flex items-center justify-center text-sm text-muted-foreground ${containerClass}`}
      >
        Media unavailable
      </div>
    );
  }
  if (media.mediaType === 'video') {
    return (
      <div className={`${containerClass} flex items-center justify-center`}>
        {/* biome-ignore lint/a11y/useMediaCaption: user-generated content */}
        <video
          src={media.url}
          controls
          className="h-full w-full rounded-md object-contain"
          preload="metadata"
        />
      </div>
    );
  }
  if (media.mediaType === 'audio') {
    return (
      // biome-ignore lint/a11y/useMediaCaption: user-generated content
      <audio src={media.url} controls className="w-full" preload="metadata" />
    );
  }
  return (
    <div className={`${containerClass} flex items-center justify-center`}>
      <img
        src={media.url}
        alt={alt || ''}
        className="h-full w-full rounded-md object-contain"
        loading="lazy"
      />
    </div>
  );
}
