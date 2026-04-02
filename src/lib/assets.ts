/**
 * Public assets base URL — configurable via NEXT_PUBLIC_ASSETS_URL.
 * Set this env var to your own CDN/S3 bucket URL.
 */
export const ASSETS_BASE_URL =
  process.env.NEXT_PUBLIC_ASSETS_URL || '';

/**
 * Build a full URL for a public asset.
 * @param path — path starting with `/`, e.g. `/sample/hero.mp4`
 */
export function assetUrl(path: string): string {
  return `${ASSETS_BASE_URL}${path}`;
}

/**
 * Extract hostname from ASSETS_BASE_URL — used by next.config.ts image domains.
 */
export function assetsHostname(): string {
  try {
    return new URL(ASSETS_BASE_URL).hostname;
  } catch {
    return '';
  }
}
