const OMNI_EXTENSIONS = ['.mp4', '.mov', '.m4v', '.mp3', '.wav'];

/** Check if any media URLs contain video or audio (triggers omni-reference pricing) */
export function hasOmniMedia(urls?: string[]): boolean {
  if (!urls?.length) return false;
  return urls.some((url) => {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      return OMNI_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    } catch {
      return false;
    }
  });
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav'];

/** Classify media URLs into image/video/audio buckets */
export function classifyMedia(
  urls: string[],
  realPersonFlags?: Record<string, boolean>
): {
  imageUrls: { url: string; real_person?: boolean }[];
  videoUrls: string[];
  audioUrls: string[];
} {
  const imageUrls: { url: string; real_person?: boolean }[] = [];
  const videoUrls: string[] = [];
  const audioUrls: string[] = [];

  for (const url of urls) {
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      if (VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
        videoUrls.push(url);
      } else if (AUDIO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
        audioUrls.push(url);
      } else {
        const isRealPerson = realPersonFlags?.[url] ?? false;
        imageUrls.push(isRealPerson ? { url, real_person: true } : { url });
      }
    } catch {
      const isRealPerson = realPersonFlags?.[url] ?? false;
      imageUrls.push(isRealPerson ? { url, real_person: true } : { url });
    }
  }

  return { imageUrls, videoUrls, audioUrls };
}
