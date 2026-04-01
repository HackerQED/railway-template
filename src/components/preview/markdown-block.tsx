'use client';

import type { MarkdownBlock } from '@/lib/preview-blocks';
import type { BlockRenderContext } from './block-renderer';
import { CopyBlockButton } from './copy-block-button';

/**
 * Markdown block — always at top level (L1), large title style.
 */
export function MarkdownBlockView({
  block,
  ctx,
  path,
}: {
  block: MarkdownBlock;
  ctx: BlockRenderContext;
  path: string;
}) {
  return (
    <div>
      {block.title && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              {block.title}
            </h2>
            <CopyBlockButton path={path} title={block.title} ctx={ctx} />
          </div>
          {block.comment && (
            <p className="mt-1 text-sm text-muted-foreground">
              {block.comment}
            </p>
          )}
        </div>
      )}
      <div className="prose dark:prose-invert text-sm max-w-none">
        {block.content}
      </div>
    </div>
  );
}
