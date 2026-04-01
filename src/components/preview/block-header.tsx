import type { BlockRenderContext } from './block-renderer';
import { CopyBlockButton } from './copy-block-button';

export function BlockHeader({
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
  return (
    <div className="mb-2 flex items-start justify-between gap-2">
      <div className="min-w-0">
        {title && (
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        )}
        {comment && (
          <p className="mt-0.5 text-xs text-muted-foreground">{comment}</p>
        )}
      </div>
      <CopyBlockButton path={path} title={title} ctx={ctx} />
    </div>
  );
}
