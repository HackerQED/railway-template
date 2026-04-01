import { NextResponse } from 'next/server';
import { sanitizeErrorMessage } from './sanitize-error';

/**
 * Standard success response. All agent-facing API responses include a `doc` link.
 */
export function apiSuccess(data: unknown, doc?: string) {
  return NextResponse.json({ data, ...(doc ? { doc } : {}) });
}

/**
 * Standard error response. Sanitizes error messages to hide upstream provider details.
 */
export function apiError(
  message: string,
  status: number,
  doc?: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: sanitizeErrorMessage(message),
      ...(doc ? { doc } : {}),
      ...extra,
    },
    { status }
  );
}

/**
 * Validate required fields in request body.
 * Returns an error response if validation fails, or null if all fields are present.
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: { name: string; type: string; description: string }[],
  doc: string
): NextResponse | null {
  for (const field of fields) {
    if (body[field.name] === undefined || body[field.name] === null) {
      return apiError(
        `missing required field '${field.name}' (${field.type}, ${field.description})`,
        400,
        doc
      );
    }
  }
  return null;
}

/**
 * Unauthorized response for agent API endpoints.
 */
export function apiUnauthorized(doc?: string) {
  return apiError(
    'Authentication required. Use Authorization: Bearer <api-key> header or session cookie.',
    401,
    doc || '/api/agent/capabilities'
  );
}
