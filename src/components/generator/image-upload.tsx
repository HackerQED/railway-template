'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/generation-client';
import {
  AlertCircleIcon,
  FolderIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useGenerator } from './generator-context';

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Single image input slot: text field for URL + upload button + preview.
 */
function ImageSlot({
  value,
  onChange,
  onRemove,
  showRemove,
  index,
}: {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  showRemove: boolean;
  index: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadFile(files[0]);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Input row: URL field + Upload button + Remove */}
      <div className="flex gap-2">
        <Input
          placeholder="Paste image URL or upload..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files)}
          className="hidden"
          aria-label={`Upload image ${index + 1}`}
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

      {/* Preview */}
      {value && isValidUrl(value) && (
        <div className="w-24 overflow-hidden rounded-md">
          <img
            src={value}
            alt={`Reference ${index + 1}`}
            className="aspect-square w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ImageUpload() {
  const { model, selectedMode, imageUrls, setImageUrls } = useGenerator();
  const currentMode = model.modes.find((m) => m.id === selectedMode);
  const maxImages = currentMode?.maxImages ?? 1;

  const slots = useMemo(
    () => (imageUrls.length === 0 ? [''] : imageUrls),
    [imageUrls]
  );

  const updateSlot = useCallback(
    (index: number, url: string) => {
      const newUrls = [...slots];
      newUrls[index] = url;
      // Filter empty strings for context, but keep slots for UI
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

  // Contextual labels per mode
  const isKeyframes = selectedMode === 'keyframes';
  const isReference = selectedMode === 'reference';

  const slotLabel = (index: number) => {
    if (isKeyframes) return index === 0 ? 'First Frame' : 'Last Frame';
    if (isReference) return `Reference Image ${index + 1}`;
    return `Image ${index + 1}`;
  };

  const filledCount = imageUrls.filter(Boolean).length;

  const sectionLabel = isKeyframes
    ? 'Keyframes'
    : isReference
      ? `Reference Images (${filledCount}/${maxImages})`
      : maxImages > 1
        ? `Images (${filledCount}/${maxImages})`
        : 'Image';

  // Keyframes mode: always show exactly 1 or 2 named slots (first frame required, last frame optional)
  const showAddButton = isKeyframes
    ? slots.length < 2
    : maxImages > 1 && slots.length < maxImages;

  const addLabel = isKeyframes
    ? 'Add Last Frame (optional)'
    : `Add Image (${slots.length}/${maxImages})`;

  return (
    <div className="space-y-3">
      <Label>{sectionLabel}</Label>

      <div className="space-y-3">
        {slots.map((url, i) => (
          <div key={`slot-${i}`} className="space-y-1">
            <span className="text-muted-foreground text-xs">
              {slotLabel(i)}
            </span>
            <ImageSlot
              value={url}
              onChange={(newUrl) => updateSlot(i, newUrl)}
              onRemove={() => removeSlot(i)}
              showRemove={isKeyframes ? i === 1 : slots.length > 1}
              index={i}
            />
          </div>
        ))}
      </div>

      {/* Add image button */}
      {showAddButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlot}
          className="w-full"
        >
          <PlusIcon className="mr-1.5 size-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
