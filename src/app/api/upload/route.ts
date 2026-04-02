import { FOLDERS } from '@/config/storage';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_AGENT_UPLOAD_SIZE,
} from '@/lib/constants';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import { uploadFile } from '@/storage';
import type { NextRequest } from 'next/server';

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized();

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return apiError('Expected multipart/form-data with a "file" field', 400);
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return apiError("missing required field 'file' (File)", 400);
  }

  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isAudio && !isVideo) {
    return apiError(
      `Unsupported file type: ${file.type}. Supported: ${[...SUPPORTED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES].join(', ')}`,
      400
    );
  }

  if (file.size > MAX_AGENT_UPLOAD_SIZE) {
    return apiError('File size exceeds the 10MB limit', 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(
      buffer,
      file.name,
      file.type,
      FOLDERS.UPLOADS
    );
    return apiSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return apiError(sanitizeErrorMessage(message) || 'Upload failed', 500);
  }
}
