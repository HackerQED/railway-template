import { apiError } from '@/lib/api-response';
import type { NextRequest } from 'next/server';

function handle(request: NextRequest) {
  const path = request.nextUrl.pathname;
  return apiError(
    `Endpoint '${path}' does not exist`,
    404,
    '/api/agent/capabilities',
    {
      hint: 'Use GET /api/agent/capabilities to discover all available endpoints, or GET /llms.txt for a human-readable overview.',
    }
  );
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
