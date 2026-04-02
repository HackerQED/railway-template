/**
 * Centralized storage configuration.
 *
 * All storage paths and public URL logic live here.
 * To see where files are stored, look at FOLDERS below.
 */

// ---------------------------------------------------------------------------
// Public URL — single source of truth
// ---------------------------------------------------------------------------

/**
 * Public base URL for all stored files (R2/S3).
 * Set via NEXT_PUBLIC_STORAGE_PUBLIC_URL env var, e.g. "https://assets1.onesite.dev"
 *
 * Used for:
 * - Generated results (images/videos)
 * - User uploads
 * - Static sample media
 */
export const STORAGE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL ?? '';

// ---------------------------------------------------------------------------
// Folder prefixes — every storage path is defined here
// ---------------------------------------------------------------------------

export const FOLDERS = {
  /** AI-generated images and videos (written by worker after model completes) */
  GENERATION: 'generation',
  /** User-uploaded files (images, videos, audio via /api/upload) */
  UPLOADS: 'uploads',
  /** Static sample media for model cards (sample images/videos) */
  SAMPLE: 'sample',
} as const;

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Build a full public URL for a stored file.
 * @param path — path with leading `/`, e.g. `/sample/seedream4.5-1.png`
 */
export function storageUrl(path: string): string {
  return `${STORAGE_PUBLIC_URL}${path}`;
}

/**
 * Extract hostname from STORAGE_PUBLIC_URL — used by next.config.ts image domains.
 */
export function storageHostname(): string {
  try {
    return new URL(STORAGE_PUBLIC_URL).hostname;
  } catch {
    return '';
  }
}
