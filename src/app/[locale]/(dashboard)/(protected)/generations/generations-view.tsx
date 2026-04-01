'use client';

import {
  type GenerationDetail,
  GenerationDetailSheet,
} from '@/components/generation-detail-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MODELS } from '@/config/models';
import {
  AlertCircleIcon,
  DownloadIcon,
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  VideoIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GenerationItem = GenerationDetail;

const GENERATOR_LABELS: Record<string, string> = {};
for (const m of MODELS) {
  GENERATOR_LABELS[m.id] = m.name;
}

function getModelLabel(generatorId: string): string {
  return GENERATOR_LABELS[generatorId] || generatorId;
}

function getOutputUrl(gen: GenerationItem): string | null {
  if (gen.status !== 'done' || !gen.output) return null;
  if (gen.output.urls?.[0]) return gen.output.urls[0];
  if (gen.output.url) return gen.output.url;
  return null;
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

function OutputThumbnail({ gen }: { gen: GenerationItem }) {
  const url = getOutputUrl(gen);
  const isVideo = gen.type === 'video';
  const isPending = gen.status === 'pending' || gen.status === 'processing';
  const isFailed = gen.status === 'failed';

  if (url) {
    return (
      <div className="relative size-10 rounded overflow-hidden bg-muted shrink-0">
        {isVideo ? (
          <video
            src={url}
            className="size-full object-cover"
            muted
            preload="metadata"
          />
        ) : (
          <img
            src={url}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute bottom-0 right-0 rounded-tl bg-black/60 p-0.5">
          {isVideo ? (
            <VideoIcon className="size-2.5 text-white" />
          ) : (
            <ImageIcon className="size-2.5 text-white" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex size-10 items-center justify-center rounded bg-muted shrink-0">
      {isPending ? (
        <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
      ) : isFailed ? (
        <AlertCircleIcon className="size-4 text-destructive" />
      ) : isVideo ? (
        <VideoIcon className="size-4 text-muted-foreground" />
      ) : (
        <ImageIcon className="size-4 text-muted-foreground" />
      )}
    </div>
  );
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

export function GenerationsView({
  initialItems,
  initialNextCursor,
}: {
  initialItems: GenerationItem[];
  initialNextCursor: string | null;
}) {
  const [items, setItems] = useState<GenerationItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail sheet
  const [selectedGen, setSelectedGen] = useState<GenerationItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchItems = useCallback(
    async (cursor: string | null) => {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/generations?${params.toString()}`);
      if (!res.ok) return null;
      return res.json();
    },
    [statusFilter]
  );

  // Re-fetch when statusFilter or committedSearch changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchItems(null).then((data) => {
      if (cancelled) return;
      if (data) {
        setItems(data.items);
        setNextCursor(data.nextCursor);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchItems]);

  // Auto-poll when there are pending/processing items
  const hasInFlightItems = items.some(
    (item) => item.status === 'pending' || item.status === 'processing'
  );
  useEffect(() => {
    if (!hasInFlightItems) return;
    const interval = setInterval(async () => {
      const data = await fetchItems(null);
      if (data) {
        setItems(data.items);
        setNextCursor(data.nextCursor);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [hasInFlightItems, fetchItems]);

  const loadMore = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    const data = await fetchItems(nextCursor);
    if (data) {
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    }
    setLoading(false);
  };

  const handleRowClick = (gen: GenerationItem) => {
    setSelectedGen(gen);
    setSheetOpen(true);
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const data = await fetchItems(null);
            if (data) {
              setItems(data.items);
              setNextCursor(data.nextCursor);
            }
            setLoading(false);
          }}
        >
          <RefreshCwIcon
            className={`size-4 ${loading ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          {loading ? (
            <Loader2Icon className="size-6 animate-spin" />
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium">No generations yet</p>
              <p className="text-xs mt-1">
                Use the model pages or Agent API to create your first generation
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Output</TableHead>
                  <TableHead className="w-[120px]">Model</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                  <TableHead className="w-[100px]">Created</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((gen) => {
                  const url = getOutputUrl(gen);
                  const prompt = gen.input?.prompt || '';
                  return (
                    <TableRow
                      key={gen.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(gen)}
                    >
                      <TableCell>
                        <OutputThumbnail gen={gen} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {getModelLabel(gen.generatorId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {prompt.length > 80
                          ? `${prompt.slice(0, 80)}...`
                          : prompt}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={gen.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timeAgo(gen.createdAt)}
                      </TableCell>
                      <TableCell>
                        {url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(url, '_blank');
                            }}
                          >
                            <DownloadIcon className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Load more */}
          {nextCursor && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <Loader2Icon className="size-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Sheet */}
      <GenerationDetailSheet
        gen={selectedGen}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
