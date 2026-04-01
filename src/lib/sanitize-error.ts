/**
 * Sanitize error objects/messages before returning to the client.
 * Strips references to upstream provider names (kie, seedream, fal, replicate, etc.)
 * and any other implementation details that should not be exposed.
 */

const PROVIDER_PATTERNS =
  /\b(kie|seedream|fal|replicate|stability|stabilityai|runway|midjourney|dall-?e|flux|openai|anthropic|veo|wavespeed|s3|cloudflare|r2)\b/gi;

export function sanitizeErrorMessage(message: string): string {
  return message.replace(PROVIDER_PATTERNS, '***');
}

export function sanitizeError(error: unknown): {
  code?: string;
  message: string;
} {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    const e = error as { code?: string; message: string };
    return {
      ...(e.code ? { code: sanitizeErrorMessage(e.code) } : {}),
      message: sanitizeErrorMessage(e.message),
    };
  }
  if (typeof error === 'string') {
    return { message: sanitizeErrorMessage(error) };
  }
  return { message: 'An error occurred during generation' };
}
