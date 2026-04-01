'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MediaType } from '@/config/models';
import { uploadFile } from '@/lib/generation-client';
import {
  AlertCircleIcon,
  FileAudioIcon,
  FileVideoIcon,
  FolderIcon,
  ImageIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useGenerator } from './generator-context';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav'];

const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((e) => `image/${e.slice(1)}`).join(
  ','
);
const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-m4v';
const AUDIO_ACCEPT = 'audio/mpeg,audio/wav';

function getMediaTypeFromUrl(url: string): MediaType | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return 'image';
    if (VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return 'video';
    if (AUDIO_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return 'audio';
  } catch {
    // not a valid URL yet
  }
  return null;
}

function getMediaTypeFromFile(file: File): MediaType | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function MediaTypeIcon({ type }: { type: MediaType | null }) {
  switch (type) {
    case 'video':
      return <FileVideoIcon className="size-3.5" />;
    case 'audio':
      return <FileAudioIcon className="size-3.5" />;
    case 'image':
      return <ImageIcon className="size-3.5" />;
    default:
      return null;
  }
}

function MediaTypeLabel({ type }: { type: MediaType | null }) {
  switch (type) {
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'image':
      return 'Image';
    default:
      return 'Media';
  }
}

function MediaPreview({ url, type }: { url: string; type: MediaType | null }) {
  if (!url || !isValidUrl(url)) return null;

  if (type === 'video') {
    return (
      <div className="w-32 overflow-hidden rounded-md">
        {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded reference material */}
        <video
          src={url}
          className="aspect-video w-full object-cover"
          controls
          preload="metadata"
          onError={(e) => {
            (e.target as HTMLVideoElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div className="max-w-48">
        {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded reference material */}
        <audio
          src={url}
          controls
          preload="metadata"
          className="h-8 w-full"
          onError={(e) => {
            (e.target as HTMLAudioElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Default to image
  return (
    <div className="w-24 overflow-hidden rounded-md">
      <img
        src={url}
        alt="Reference"
        className="aspect-square w-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}

function MediaSlot({
  value,
  onChange,
  onRemove,
  showRemove,
  index,
  acceptedTypes,
  showRealPerson,
  isRealPerson,
  onRealPersonChange,
}: {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  showRemove: boolean;
  index: number;
  acceptedTypes: MediaType[];
  showRealPerson?: boolean;
  isRealPerson?: boolean;
  onRealPersonChange?: (value: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptAttr = useMemo(() => {
    const parts: string[] = [];
    if (acceptedTypes.includes('image')) parts.push(IMAGE_ACCEPT);
    if (acceptedTypes.includes('video')) parts.push(VIDEO_ACCEPT);
    if (acceptedTypes.includes('audio')) parts.push(AUDIO_ACCEPT);
    return parts.join(',');
  }, [acceptedTypes]);

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileType = getMediaTypeFromFile(file);
    if (fileType && !acceptedTypes.includes(fileType)) {
      setError(`Unsupported file type: ${file.type}`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const detectedType = value ? getMediaTypeFromUrl(value) : null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Paste media URL or upload..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          onChange={(e) => handleFile(e.target.files)}
          className="hidden"
          aria-label={`Upload media ${index + 1}`}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          title="Upload file"
        >
          {uploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <FolderIcon className="size-4" />
          )}
        </Button>
        {showRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            title="Remove"
          >
            <Trash2Icon className="size-4" />
          </Button>
        )}
        {!showRemove && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            title="Clear"
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-destructive text-xs">
          <AlertCircleIcon className="size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <MediaPreview url={value} type={detectedType ?? 'image'} />

      {/* Real-person toggle: only for images with a valid URL */}
      {showRealPerson &&
        value &&
        isValidUrl(value) &&
        detectedType !== 'video' &&
        detectedType !== 'audio' && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onRealPersonChange?.(!isRealPerson)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isRealPerson
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-muted-foreground/20 bg-muted/50 text-muted-foreground hover:border-muted-foreground/40'
              }`}
            >
              <UserIcon className="size-3" />
              {isRealPerson ? 'Real Person' : 'Mark as Real Person'}
            </button>
            {!isRealPerson && (
              <p className="text-muted-foreground text-[10px] leading-tight ml-1">
                Mark to bypass moderation for real human faces
              </p>
            )}
          </div>
        )}
    </div>
  );
}

export function MediaUpload() {
  const {
    model,
    selectedMode,
    imageUrls,
    setImageUrls,
    realPersonFlags,
    setRealPersonFlag,
  } = useGenerator();
  const currentMode = model.modes.find((m) => m.id === selectedMode);
  const maxMedia = currentMode?.maxMedia ?? currentMode?.maxImages ?? 1;
  const maxImages = currentMode?.maxImages ?? maxMedia;
  const acceptedTypes = currentMode?.acceptedMediaTypes ?? ['image'];

  const slots = useMemo(
    () => (imageUrls.length === 0 ? [''] : imageUrls),
    [imageUrls]
  );

  // Count media by type
  const typeCounts = useMemo(() => {
    const counts: Record<MediaType, number> = { image: 0, video: 0, audio: 0 };
    for (const url of imageUrls) {
      if (!url) continue;
      const t = getMediaTypeFromUrl(url);
      if (t) counts[t]++;
      else counts.image++; // default to image if unknown
    }
    return counts;
  }, [imageUrls]);

  const filledCount = imageUrls.filter(Boolean).length;

  const canAddMore = useCallback(
    (newType?: MediaType) => {
      if (filledCount >= maxMedia) return false;
      if (newType === 'image' && typeCounts.image >= maxImages) return false;
      return true;
    },
    [filledCount, maxMedia, maxImages, typeCounts]
  );

  const updateSlot = useCallback(
    (index: number, url: string) => {
      const newUrls = [...slots];
      newUrls[index] = url;
      setImageUrls(newUrls.filter(Boolean));
    },
    [slots, setImageUrls]
  );

  const removeSlot = useCallback(
    (index: number) => {
      const newUrls = slots.filter((_, i) => i !== index);
      setImageUrls(newUrls.filter(Boolean));
    },
    [slots, setImageUrls]
  );

  const addSlot = useCallback(() => {
    setImageUrls([...slots, '']);
  }, [slots, setImageUrls]);

  // Build section label with per-type counts
  const typeCountParts: string[] = [];
  if (typeCounts.image > 0)
    typeCountParts.push(
      `${typeCounts.image} image${typeCounts.image > 1 ? 's' : ''}`
    );
  if (typeCounts.video > 0)
    typeCountParts.push(
      `${typeCounts.video} video${typeCounts.video > 1 ? 's' : ''}`
    );
  if (typeCounts.audio > 0) typeCountParts.push(`${typeCounts.audio} audio`);
  const typeDetail =
    typeCountParts.length > 0 ? ` — ${typeCountParts.join(', ')}` : '';

  const sectionLabel = `Media (${filledCount}/${maxMedia})`;

  const slotLabel = (index: number) => {
    const url = slots[index];
    if (!url) return `Media ${index + 1}`;
    const t = getMediaTypeFromUrl(url);
    return t
      ? `${t.charAt(0).toUpperCase()}${t.slice(1)} ${index + 1}`
      : `Media ${index + 1}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <Label>{sectionLabel}</Label>
        {typeDetail && (
          <span className="text-muted-foreground text-xs">{typeDetail}</span>
        )}
      </div>

      {/* Format hints */}
      <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
        {acceptedTypes.includes('image') && (
          <span className="flex items-center gap-1">
            <ImageIcon className="size-3" />
            Images (max {maxImages}): JPG, PNG, WebP, GIF, BMP
          </span>
        )}
        {acceptedTypes.includes('video') && (
          <span className="flex items-center gap-1">
            <FileVideoIcon className="size-3" />
            Video (≤15s): MP4, MOV
          </span>
        )}
        {acceptedTypes.includes('audio') && (
          <span className="flex items-center gap-1">
            <FileAudioIcon className="size-3" />
            Audio (≤15s): MP3, WAV
          </span>
        )}
      </div>

      <div className="space-y-3">
        {slots.map((url, i) => (
          <div key={`slot-${i}`} className="space-y-1">
            <span className="flex items-center gap-1 text-muted-foreground text-xs">
              <MediaTypeIcon
                type={url ? (getMediaTypeFromUrl(url) ?? 'image') : null}
              />
              {slotLabel(i)}
            </span>
            <MediaSlot
              value={url}
              onChange={(newUrl) => updateSlot(i, newUrl)}
              onRemove={() => removeSlot(i)}
              showRemove={slots.length > 1}
              index={i}
              acceptedTypes={acceptedTypes}
              showRealPerson={currentMode?.showRealPerson}
              isRealPerson={url ? (realPersonFlags[url] ?? false) : false}
              onRealPersonChange={(val) => url && setRealPersonFlag(url, val)}
            />
          </div>
        ))}
      </div>

      {canAddMore() && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlot}
          className="w-full"
        >
          <PlusIcon className="mr-1.5 size-4" />
          Add Media ({slots.length}/{maxMedia})
        </Button>
      )}
    </div>
  );
}
