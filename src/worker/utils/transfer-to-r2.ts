import { FOLDERS } from '@/config/storage';
import { isMocked } from '@/lib/mock';
import { uploadFile } from '@/storage';
import { nanoid } from 'nanoid';
import { addImageWatermark, addVideoWatermark } from './watermark';

function extFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const dot = pathname.lastIndexOf('.');
    if (dot !== -1) {
      const ext = pathname
        .slice(dot + 1)
        .toLowerCase()
        .split('?')[0];
      if (ext.length <= 5) return ext;
    }
  } catch {}
  return 'bin';
}

export interface TransferOptions {
  /** Apply watermark to the content before uploading */
  addWatermark?: boolean;
  /** Content type, needed when addWatermark is true */
  contentType?: 'image' | 'video';
}

/**
 * Download a remote URL and upload it to our R2 storage.
 * Optionally applies a watermark before uploading.
 */
export async function transferToR2(
  remoteUrl: string,
  options?: TransferOptions
): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) {
    throw new Error(`Failed to download: ${res.status}`);
  }

  let buffer = Buffer.from(await res.arrayBuffer());
  const ext = extFromUrl(remoteUrl);
  const mimeType =
    res.headers.get('content-type') || 'application/octet-stream';

  if (options?.addWatermark) {
    try {
      if (options.contentType === 'image') {
        buffer = (await addImageWatermark(buffer)) as typeof buffer;
      } else if (options.contentType === 'video') {
        buffer = (await addVideoWatermark(buffer)) as typeof buffer;
      }
    } catch (err) {
      console.error(
        `[transfer] Watermark failed for ${options.contentType}, uploading without watermark`,
        err
      );
    }
  }

  const filename = `${nanoid()}.${ext}`;
  const result = await uploadFile(buffer, filename, mimeType, FOLDERS.GENERATION);
  return result.url;
}

/**
 * Transfer multiple URLs to R2. On failure, fall back to the original URL.
 * In mock mode, skip transfer entirely.
 */
export async function transferUrlsToR2(
  urls: string[],
  options?: TransferOptions
): Promise<string[]> {
  if (isMocked() && !options?.addWatermark) return urls;

  return Promise.all(
    urls.map(async (url) => {
      try {
        return await transferToR2(url, options);
      } catch (err) {
        console.error(
          `[transfer] Failed to transfer ${url.slice(0, 80)}..., using original`,
          err
        );
        return url;
      }
    })
  );
}
