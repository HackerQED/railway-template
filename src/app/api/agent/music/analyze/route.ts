import { analyzeMusic } from '@/ai/analysis/service';
import { resolveApiUser } from '@/lib/api-auth';
import {
  apiError,
  apiSuccess,
  apiUnauthorized,
  validateRequired,
} from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import type { NextRequest } from 'next/server';

// Not registered in CAPABILITIES_MAP (mocked) — hardcode doc path
const DOC = '/docs/tools/music-analyze.mdx';

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized(DOC);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400, DOC);
  }

  const validation = validateRequired(
    body,
    [
      {
        name: 'audio_url',
        type: 'string',
        description: 'URL of the audio file',
      },
    ],
    DOC
  );
  if (validation) return validation;

  const audioUrl = body.audio_url as string;
  const duration = typeof body.duration === 'number' ? body.duration : 0;

  if (duration <= 0) {
    return apiError(
      "missing or invalid 'duration' (number, audio duration in seconds, must be > 0)",
      400,
      DOC
    );
  }

  try {
    const analysis = await analyzeMusic(audioUrl, duration);
    return apiSuccess(analysis, DOC);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[music/analyze] Error:', message);
    return apiError(
      sanitizeErrorMessage(message) || 'Music analysis failed',
      500,
      DOC
    );
  }
}
