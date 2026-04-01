'use client';

import type { GroupBlock } from '@/lib/preview-blocks';
import { BlockHeader } from './block-header';
import { type BlockRenderContext, buildBlockPath } from './block-renderer';
import { CopyBlockButton } from './copy-block-button';
import { MediaBlockView } from './media-block';

function EmptyGroupPlaceholder() {
  return (
    <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-sm text-muted-foreground">
      Empty group
    </div>
  );
}

export function GroupBlockView({
  block,
  ctx,
  path,
}: {
  block: GroupBlock;
  ctx: BlockRenderContext;
  path: string;
}) {
  return (
    <div>
      <L1Header
        title={block.title}
        comment={block.comment}
        path={path}
        ctx={ctx}
      />
      {block.children.length === 0 ? (
        <EmptyGroupPlaceholder />
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {block.children.map((child, i) => {
            const childPath = buildBlockPath(path, child);
            return (
              <div key={child.id ?? i} id={childPath}>
                <MediaBlockView block={child} ctx={ctx} path={childPath} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function L1Header({
  title,
  comment,
  path,
  ctx,
}: {
  title?: string;
  comment?: string;
  path: string;
  ctx: BlockRenderContext;
}) {
  if (!title && !comment) return null;

  return (
    <div className="mb-4">
      {title && (
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <CopyBlockButton path={path} title={title} ctx={ctx} />
        </div>
      )}
      {comment && (
        <p className="mt-1 text-sm text-muted-foreground">{comment}</p>
      )}
    </div>
  );
}
