import { NextResponse } from 'next/server';
import { sanitizeErrorMessage } from './sanitize-error';

/**
 * Standard success response.
 */
export function apiSuccess(data: unknown) {
  return NextResponse.json({ data });
}

/**
 * Standard error response. Sanitizes error messages to hide upstream provider details.
 */
export function apiError(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: sanitizeErrorMessage(message),
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
  fields: { name: string; type: string; description: string }[]
): NextResponse | null {
  for (const field of fields) {
    if (body[field.name] === undefined || body[field.name] === null) {
      return apiError(
        `missing required field '${field.name}' (${field.type}, ${field.description})`,
        400
      );
    }
  }
  return null;
}

/**
 * Unauthorized response.
 */
export function apiUnauthorized() {
  return apiError(
    'Authentication required. Use Authorization: Bearer <api-key> header or session cookie.',
    401
  );
}
