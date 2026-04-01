import { execFile } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { readFile, unlink, writeFile } from 'fs/promises';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

const SITE_NAME = 'yino.ai';
const LINE1 = `❤️ Thank you for trying ${SITE_NAME} ❤️`;
const LINE2 = 'Purchase to enjoy no watermark and support us';

function buildWatermarkSvg(width: number, height: number): string {
  const fontSize = Math.max(Math.floor(width * 0.03), 16);
  const lineHeight = fontSize * 1.5;

  return `
    <svg width="${width}" height="${height}">
      <style>
        .wm {
          font-family: 'Noto Sans CJK SC', Arial, sans-serif;
          font-size: ${fontSize}px;
          font-weight: 600;
          fill: white;
          fill-opacity: 0.6;
          text-anchor: middle;
        }
      </style>
      <text x="${width / 2}" y="${height / 2 - lineHeight / 2}" class="wm">${LINE1}</text>
      <text x="${width / 2}" y="${height / 2 + lineHeight / 2}" class="wm">${LINE2}</text>
    </svg>
  `;
}

/**
 * Add a centered semi-transparent watermark to an image buffer.
 */
export async function addImageWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 800;
  const height = metadata.height ?? 600;

  const svg = buildWatermarkSvg(width, height);

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .toBuffer();
}

/**
 * Add a centered semi-transparent watermark to a video buffer.
 * Requires ffmpeg + ffprobe on PATH.
 */
export async function addVideoWatermark(videoBuffer: Buffer): Promise<Buffer> {
  const id = `wm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inputPath = join(tmpdir(), `${id}-in.mp4`);
  const overlayPath = join(tmpdir(), `${id}-overlay.png`);
  const outputPath = join(tmpdir(), `${id}-out.mp4`);

  try {
    await writeFile(inputPath, videoBuffer);

    // Probe video dimensions
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'json',
      inputPath,
    ]);
    const probe = JSON.parse(stdout);
    const stream = probe.streams?.[0];
    const width = stream?.width || 1280;
    const height = stream?.height || 720;

    // Create watermark overlay PNG
    const svg = buildWatermarkSvg(width, height);
    const overlayBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(overlayPath, overlayBuffer);

    // Composite watermark onto video
    await execFileAsync('ffmpeg', [
      '-i',
      inputPath,
      '-i',
      overlayPath,
      '-filter_complex',
      'overlay=0:0',
      '-map',
      '0:a?',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '20',
      '-c:a',
      'copy',
      '-movflags',
      '+faststart',
      '-y',
      outputPath,
    ]);

    return await readFile(outputPath);
  } finally {
    await Promise.all(
      [inputPath, overlayPath, outputPath].map((p) => unlink(p).catch(() => {}))
    );
  }
}
