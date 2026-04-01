/**
 * Max image file size (4MB)
 */
export const MAX_FILE_SIZE = 4 * 1024 * 1024;

/**
 * Max agent upload file size (10MB)
 */
export const MAX_AGENT_UPLOAD_SIZE = 10 * 1024 * 1024;

/**
 * Allowed audio MIME types
 */
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/webm',
];

/**
 * Allowed video MIME types for media upload
 */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
];

/**
 * Polling interval (2 seconds)
 */
export const PAYMENT_POLL_INTERVAL = 2000;

/**
 * Max polling time (1 minute)
 */
export const PAYMENT_MAX_POLL_TIME = 60000;

/**
 * Max retry attempts for finding payment records
 */
export const PAYMENT_RECORD_RETRY_ATTEMPTS = 30;

/**
 * Retry delay between attempts (2 seconds)
 */
export const PAYMENT_RECORD_RETRY_DELAY = 2000;
