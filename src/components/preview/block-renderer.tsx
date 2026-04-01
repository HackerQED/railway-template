'use client';

import type { Block } from '@/lib/preview-blocks';
import { GroupBlockView } from './group-block';
import { MarkdownBlockView } from './markdown-block';

interface GenerationData {
  id: string;
  type: string;
  status: string;
  output: { url?: string } | null;
}

export interface BlockRenderContext {
  projectId: string;
  generations: Map<string, GenerationData>;
  onSelectGeneration?: (genId: string) => void;
}

export function buildBlockPath(parentPath: string, block: Block): string {
  return parentPath ? `${parentPath}/${block.id}` : block.id;
}

/**
 * Render a top-level block (markdown or group).
 */
export function BlockRenderer({
  block,
  ctx,
  path,
}: {
  block: Block;
  ctx: BlockRenderContext;
  path: string;
}) {
  switch (block.type) {
    case 'markdown':
      return <MarkdownBlockView block={block} ctx={ctx} path={path} />;
    case 'group':
      return <GroupBlockView block={block} ctx={ctx} path={path} />;
    default:
      return null;
  }
}

export function BlockList({
  blocks,
  ctx,
  parentPath = '',
}: {
  blocks: Block[];
  ctx: BlockRenderContext;
  parentPath?: string;
}) {
  return (
    <div className="flex flex-col">
      {blocks.map((block, i) => {
        const path = buildBlockPath(parentPath, block);
        return (
          <div key={block.id ?? i}>
            {i > 0 && <hr className="my-8 border-border" />}
            <div id={path}>
              <BlockRenderer block={block} ctx={ctx} path={path} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
