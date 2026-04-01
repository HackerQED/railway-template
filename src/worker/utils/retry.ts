const NETWORK_ERROR_PATTERNS = [
  'fetch failed',
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'UND_ERR_CONNECT_TIMEOUT',
  'socket hang up',
  'timeout',
  'timed out',
  'network',
];

function isNetworkError(err: unknown): boolean {
  // Check undici/fetch cause code (e.g. UND_ERR_CONNECT_TIMEOUT)
  if (
    err instanceof Error &&
    (err as NodeJS.ErrnoException).cause &&
    typeof ((err as any).cause as any)?.code === 'string'
  ) {
    const causeCode: string = ((err as any).cause as any).code;
    if (
      NETWORK_ERROR_PATTERNS.some((p) =>
        causeCode.toLowerCase().includes(p.toLowerCase())
      )
    ) {
      return true;
    }
  }

  const msg = err instanceof Error ? err.message : String(err);
  return NETWORK_ERROR_PATTERNS.some((p) =>
    msg.toLowerCase().includes(p.toLowerCase())
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 2000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isNetworkError(err)) {
        const delay = baseDelay * 2 ** attempt;
        console.warn(
          `[retry] attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
