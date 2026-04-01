/**
 * Block types for Preview — two-level structure.
 *
 * Level 1 (top): markdown | group
 * Level 2 (inside group): media (generation or url)
 *
 * Constraints:
 * - id: max 50 chars, agent-assigned semantic name (e.g. "shot-1")
 * - title: max 50 chars
 * - comment: max 100 chars
 */

export type Block = MarkdownBlock | MediaBlock | GroupBlock;

/** Top-level only — text/title content */
export interface MarkdownBlock {
  type: 'markdown';
  id: string;
  title?: string;
  comment?: string;
  content?: string;
}

/** Inside group only — references a generation or external URL */
export interface MediaBlock {
  type: 'media';
  id: string;
  title?: string;
  comment?: string;
  generationId?: string;
  url?: string;
}

/** Top-level only — contains media blocks */
export interface GroupBlock {
  type: 'group';
  id: string;
  title?: string;
  comment?: string;
  children: MediaBlock[];
}

const MAX_ID_LENGTH = 50;
const MAX_TITLE_LENGTH = 50;
const MAX_COMMENT_LENGTH = 100;

/**
 * Validate a top-level blocks array. Returns null if valid, or an error message string.
 */
export function validateBlocks(blocks: unknown): string | null {
  if (!Array.isArray(blocks)) {
    return "'blocks' must be an array";
  }
  if (blocks.length === 0) {
    return "'blocks' must not be empty";
  }

  for (let i = 0; i < blocks.length; i++) {
    const err = validateTopLevelBlock(blocks[i], `blocks[${i}]`);
    if (err) return err;
  }
  return null;
}

/**
 * Validate an update items array. Returns null if valid, or an error message string.
 */
export function validateUpdateItems(items: unknown): string | null {
  if (!Array.isArray(items)) {
    return "'update' must be an array";
  }
  if (items.length === 0) {
    return "'update' must not be empty";
  }

  for (let i = 0; i < items.length; i++) {
    const err = validateUpdateItem(items[i], `update[${i}]`);
    if (err) return err;
  }
  return null;
}

function validateUpdateItem(item: unknown, path: string): string | null {
  if (!item || typeof item !== 'object') {
    return `${path}: must be an object`;
  }

  const u = item as Record<string, unknown>;

  if (!u.id || typeof u.id !== 'string') {
    return `${path}.id: required (string)`;
  }
  if (u.id.length > MAX_ID_LENGTH) {
    return `${path}.id: must be at most ${MAX_ID_LENGTH} characters`;
  }

  // type cannot be changed
  if (u.type !== undefined) {
    return `${path}.type: cannot be changed via update`;
  }

  if (u.title !== undefined) {
    if (typeof u.title !== 'string') {
      return `${path}.title: must be a string`;
    }
    if (u.title.length > MAX_TITLE_LENGTH) {
      return `${path}.title: must be at most ${MAX_TITLE_LENGTH} characters`;
    }
  }

  if (u.comment !== undefined) {
    if (typeof u.comment !== 'string') {
      return `${path}.comment: must be a string`;
    }
    if (u.comment.length > MAX_COMMENT_LENGTH) {
      return `${path}.comment: must be at most ${MAX_COMMENT_LENGTH} characters`;
    }
  }

  if (u.content !== undefined && typeof u.content !== 'string') {
    return `${path}.content: must be a string`;
  }
  if (u.generationId !== undefined && typeof u.generationId !== 'string') {
    return `${path}.generationId: must be a string`;
  }
  if (u.url !== undefined && typeof u.url !== 'string') {
    return `${path}.url: must be a string`;
  }
  if (u.generationId && u.url) {
    return `${path}: cannot set both 'generationId' and 'url'`;
  }

  // children replacement must be valid media blocks (empty array is allowed for groups)
  if (u.children !== undefined) {
    if (!Array.isArray(u.children)) {
      return `${path}.children: must be an array`;
    }
    for (let i = 0; i < u.children.length; i++) {
      const childErr = validateMediaBlock(
        u.children[i],
        `${path}.children[${i}]`
      );
      if (childErr) return childErr;
    }
  }

  return null;
}

export interface BlockUpdate {
  id: string;
  title?: string;
  comment?: string;
  content?: string;
  generationId?: string;
  url?: string;
  children?: MediaBlock[];
}

/**
 * Apply updates to a blocks tree. Returns the new blocks array and a list of
 * ids that were not found.
 */
export function applyBlockUpdates(
  blocks: Block[],
  updates: BlockUpdate[]
): { blocks: Block[]; notFound: string[] } {
  const updateMap = new Map(updates.map((u) => [u.id, u]));
  const applied = new Set<string>();

  const result = blocks.map((block) => {
    const update = updateMap.get(block.id);
    let updated = block;

    if (update) {
      applied.add(block.id);
      updated = applyPatch(block, update);
    }

    // Check children of groups — but skip if children were fully replaced
    if (updated.type === 'group' && !(update?.children !== undefined)) {
      const newChildren = updated.children.map((child) => {
        const childUpdate = updateMap.get(child.id);
        if (!childUpdate) return child;
        applied.add(child.id);
        return applyPatch(child, childUpdate) as MediaBlock;
      });
      updated = { ...updated, children: newChildren } as GroupBlock;
    }

    return updated;
  });

  const notFound = updates.filter((u) => !applied.has(u.id)).map((u) => u.id);

  return { blocks: result, notFound };
}

function applyPatch(block: Block, update: BlockUpdate): Block {
  const patch: Record<string, unknown> = {};
  if (update.title !== undefined) patch.title = update.title;
  if (update.comment !== undefined) patch.comment = update.comment;
  if (update.content !== undefined && block.type === 'markdown')
    patch.content = update.content;
  if (update.generationId !== undefined && block.type === 'media')
    patch.generationId = update.generationId;
  if (update.url !== undefined && block.type === 'media')
    patch.url = update.url;
  if (update.children !== undefined && block.type === 'group')
    patch.children = update.children;
  return { ...block, ...patch } as Block;
}

function validateCommonFields(
  b: Record<string, unknown>,
  path: string
): string | null {
  if (!b.id || typeof b.id !== 'string') {
    return `${path}.id: required (string)`;
  }
  if (b.id.length > MAX_ID_LENGTH) {
    return `${path}.id: must be at most ${MAX_ID_LENGTH} characters`;
  }
  if (b.title !== undefined) {
    if (typeof b.title !== 'string') {
      return `${path}.title: must be a string`;
    }
    if (b.title.length > MAX_TITLE_LENGTH) {
      return `${path}.title: must be at most ${MAX_TITLE_LENGTH} characters`;
    }
  }
  if (b.comment !== undefined) {
    if (typeof b.comment !== 'string') {
      return `${path}.comment: must be a string`;
    }
    if (b.comment.length > MAX_COMMENT_LENGTH) {
      return `${path}.comment: must be at most ${MAX_COMMENT_LENGTH} characters`;
    }
  }
  return null;
}

function validateTopLevelBlock(block: unknown, path: string): string | null {
  if (!block || typeof block !== 'object') {
    return `${path}: must be an object`;
  }

  const b = block as Record<string, unknown>;
  const commonErr = validateCommonFields(b, path);
  if (commonErr) return commonErr;

  switch (b.type) {
    case 'markdown':
      if (b.content !== undefined && typeof b.content !== 'string') {
        return `${path}.content: must be a string`;
      }
      break;

    case 'group':
      if (!Array.isArray(b.children)) {
        return `${path}.children: required (array)`;
      }
      for (let i = 0; i < b.children.length; i++) {
        const err = validateMediaBlock(b.children[i], `${path}.children[${i}]`);
        if (err) return err;
      }
      break;

    default:
      return `${path}.type: must be 'markdown' or 'group' at top level`;
  }

  return null;
}

function validateMediaBlock(block: unknown, path: string): string | null {
  if (!block || typeof block !== 'object') {
    return `${path}: must be an object`;
  }

  const b = block as Record<string, unknown>;
  const commonErr = validateCommonFields(b, path);
  if (commonErr) return commonErr;

  if (b.type !== 'media') {
    return `${path}.type: must be 'media' inside a group`;
  }

  if (b.generationId && b.url) {
    return `${path}: media block must have either 'generationId' or 'url', not both`;
  }
  if (!b.generationId && !b.url) {
    return `${path}: media block must have 'generationId' or 'url'`;
  }
  if (b.generationId && typeof b.generationId !== 'string') {
    return `${path}.generationId: must be a string`;
  }
  if (b.url && typeof b.url !== 'string') {
    return `${path}.url: must be a string`;
  }

  return null;
}
