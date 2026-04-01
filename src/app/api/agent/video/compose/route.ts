import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import { resolveApiUser } from '@/lib/api-auth';
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api-response';
import { sanitizeErrorMessage } from '@/lib/sanitize-error';
import { uploadFile } from '@/storage';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';

const execFileAsync = promisify(execFile);
// Not registered in CAPABILITIES_MAP (mocked) — hardcode doc path
const DOC = '/docs/tools/video-compose.mdx';
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB per file
const DOWNLOAD_TIMEOUT = 60_000; // 60s per download

interface ClipInput {
  video_url: string;
  start_time: number;
  duration: number;
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok || !res.body) {
      throw new Error(`Download failed: ${res.status}`);
    }

    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${contentLength} bytes (max ${MAX_FILE_SIZE})`
      );
    }

    const ws = createWriteStream(destPath);
    await pipeline(Readable.fromWeb(res.body as never), ws);

    const fileStat = await stat(destPath);
    if (fileStat.size > MAX_FILE_SIZE) {
      throw new Error(`Downloaded file too large: ${fileStat.size} bytes`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  const user = await resolveApiUser(request);
  if (!user) return apiUnauthorized(DOC);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400, DOC);
  }

  if (!body.audio_url || typeof body.audio_url !== 'string') {
    return apiError(
      "missing required field 'audio_url' (string, URL of the audio track)",
      400,
      DOC
    );
  }
  if (!Array.isArray(body.clips) || body.clips.length === 0) {
    return apiError(
      "missing required field 'clips' (non-empty array of clip objects)",
      400,
      DOC
    );
  }
  if (body.clips.length > 50) {
    return apiError("'clips' must have at most 50 entries", 400, DOC);
  }

  const clips = body.clips as ClipInput[];
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    if (!c.video_url || typeof c.video_url !== 'string') {
      return apiError(`clips[${i}].video_url is required (string)`, 400, DOC);
    }
    if (typeof c.start_time !== 'number') {
      return apiError(
        `clips[${i}].start_time is required (number, seconds)`,
        400,
        DOC
      );
    }
    if (typeof c.duration !== 'number' || c.duration <= 0) {
      return apiError(
        `clips[${i}].duration is required (number, seconds, must be > 0)`,
        400,
        DOC
      );
    }
  }

  const workDir = join(tmpdir(), `compose-${nanoid()}-${Date.now()}`);

  try {
    await mkdir(workDir, { recursive: true });

    // Download all clips + audio in parallel
    const segmentPaths = clips.map((_, i) =>
      join(workDir, `seg_${String(i).padStart(3, '0')}.mp4`)
    );
    const musicPath = join(workDir, 'music.mp3');

    await Promise.all([
      ...clips.map((clip, i) => downloadFile(clip.video_url, segmentPaths[i])),
      downloadFile(body.audio_url as string, musicPath),
    ]);

    // FFmpeg concat
    const concatFile = join(workDir, 'concat.txt');
    const concatContent = segmentPaths.map((p) => `file '${p}'`).join('\n');
    await writeFile(concatFile, concatContent);

    const concatOutput = join(workDir, 'concat.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatFile,
      '-c',
      'copy',
      concatOutput,
    ]);

    // Overlay audio
    const finalOutput = join(workDir, 'final.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      concatOutput,
      '-i',
      musicPath,
      '-c:v',
      'copy',
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-shortest',
      finalOutput,
    ]);

    // Get video info
    const { stdout: probeOut } = await execFileAsync('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      finalOutput,
    ]);
    const probe = JSON.parse(probeOut);
    const duration = Math.round(Number(probe.format?.duration ?? 0));
    const videoStream = probe.streams?.find(
      (s: { codec_type: string }) => s.codec_type === 'video'
    );
    const resolution = videoStream
      ? `${videoStream.width}x${videoStream.height}`
      : '';

    // Upload to S3
    const finalBuffer = await readFile(finalOutput);
    const { url } = await uploadFile(
      finalBuffer,
      `compose-${nanoid()}.mp4`,
      'video/mp4',
      'compose'
    );

    return apiSuccess({ url, duration, resolution }, DOC);
  } catch (err) {
    console.error('[video/compose] Error:', err);
    const message = sanitizeErrorMessage(
      err instanceof Error ? err.message : String(err)
    );
    return apiError(message || 'Composition failed', 500, DOC);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
