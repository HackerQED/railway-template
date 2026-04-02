'use client';

import { MODELS } from '@/config/models';
import { downloadFile } from '@/lib/download';
import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ImageIcon,
  Loader2Icon,
  VideoIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

export interface GenerationDetail {
  id: string;
  type: string;
  generatorId: string;
  status: string;
  input: { prompt?: string; [key: string]: unknown } | null;
  output: { url?: string; urls?: string[]; [key: string]: unknown } | null;
  error: { code?: string; message?: string } | null;
  comment: string | null;
  createdAt: string;
  completedAt: string | null;
}

const GENERATOR_LABELS: Record<string, string> = {};
for (const m of MODELS) {
  GENERATOR_LABELS[m.id] = m.name;
}

function getModelLabel(generatorId: string): string {
  return GENERATOR_LABELS[generatorId] || generatorId;
}

function getOutputUrl(gen: GenerationDetail): string | null {
  if (gen.status !== 'done' || !gen.output) return null;
  if (gen.output.urls?.[0]) return gen.output.urls[0];
  if (gen.output.url) return gen.output.url;
  return null;
}

function formatParamKey(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/25">
          Done
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/25">
          <Loader2Icon className="size-3 animate-spin" />
          Processing
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-500/15 text-yellow-500 border-yellow-500/25">
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <AlertCircleIcon className="size-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function isUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  return v.startsWith('http://') || v.startsWith('https://');
}

function ParamValue({ value }: { value: unknown }) {
  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-primary hover:text-primary/80"
        title={value}
      >
        <ExternalLinkIcon className="size-3.5" />
      </a>
    );
  }
  return <span className="font-medium truncate">{String(value)}</span>;
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      title="Click to copy ID"
    >
      <span>ID:</span>
      <span className="font-mono">{id}</span>
      {copied ? (
        <CheckIcon className="size-3" />
      ) : (
        <CopyIcon className="size-3" />
      )}
    </button>
  );
}

export function GenerationDetailSheet({
  gen,
  open,
  onOpenChange,
}: {
  gen: GenerationDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!gen) return null;

  const url = getOutputUrl(gen);
  const isVideo = gen.type === 'video';
  const input = gen.input;
  const error = gen.error;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {isVideo ? (
              <VideoIcon className="size-4" />
            ) : (
              <ImageIcon className="size-4" />
            )}
            {getModelLabel(gen.generatorId)}
          </SheetTitle>
          {gen.comment && <SheetDescription>{gen.comment}</SheetDescription>}
          <CopyableId id={gen.id} />
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          {/* Preview */}
          {url && (
            <div className="rounded-lg overflow-hidden bg-muted border">
              {/* biome-ignore lint/a11y/useMediaCaption: user-generated content */}
              {isVideo ? (
                <video
                  src={url}
                  className="w-full"
                  controls
                  preload="metadata"
                />
              ) : (
                <img src={url} alt="" className="w-full" loading="lazy" />
              )}
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusBadge status={gen.status} />
            <span className="text-xs text-muted-foreground">
              Created {timeAgo(gen.createdAt)}
            </span>
            {gen.completedAt && (
              <span className="text-xs text-muted-foreground">
                · Completed {timeAgo(gen.completedAt)}
              </span>
            )}
          </div>

          {/* Prompt */}
          {input?.prompt && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1.5">
                Prompt
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/50 border p-3">
                {input.prompt}
              </p>
            </div>
          )}

          {/* Parameters */}
          {input &&
            (() => {
              const entries = Object.entries(input).filter(
                ([k, v]) => k !== 'prompt' && v != null && v !== ''
              );
              if (entries.length === 0) return null;
              return (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1.5">
                    Parameters
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {entries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between gap-2 rounded-md bg-muted/50 border px-3 py-1.5 overflow-hidden"
                      >
                        <span className="text-muted-foreground shrink-0">
                          {formatParamKey(key)}
                        </span>
                        <ParamValue value={value} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          {/* Error */}
          {gen.status === 'failed' && error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <h4 className="text-sm font-medium text-destructive mb-1">
                Error
              </h4>
              <p className="text-sm text-destructive/80">
                {error.message || 'Unknown error'}
              </p>
            </div>
          )}

          {/* Download */}
          {url && (
            <Button
              className="w-full"
              onClick={() => {
                const ext = isVideo ? 'mp4' : 'png';
                downloadFile(url, `yino-${gen.id}.${ext}`);
              }}
            >
              <DownloadIcon className="size-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
