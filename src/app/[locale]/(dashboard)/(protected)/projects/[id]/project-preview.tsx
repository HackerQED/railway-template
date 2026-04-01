'use client';

import {
  type GenerationDetail,
  GenerationDetailSheet,
} from '@/components/generation-detail-sheet';
import {
  BlockList,
  type BlockRenderContext,
} from '@/components/preview/block-renderer';
import {
  type GenerationItem,
  GenerationSidebar,
} from '@/components/preview/generation-sidebar';
import { ProjectMentionButton } from '@/components/preview/project-mention-button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import type { Block } from '@/lib/preview-blocks';
import { IconLayoutGrid, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

interface ProjectPreviewProps {
  project: {
    id: string;
    title: string;
    createdAt: Date;
  };
  blocks?: unknown[];
  generations: (GenerationItem & GenerationDetail)[];
}

const POLL_INTERVAL_MS = 10_000;

export function ProjectPreview({
  project,
  blocks,
  generations,
}: ProjectPreviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detail sheet state
  const [selectedGen, setSelectedGen] = useState<GenerationDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const generationDetailMap = new Map(generations.map((g) => [g.id, g]));

  const handleSelectGeneration = useCallback(
    (genId: string) => {
      const gen = generationDetailMap.get(genId);
      if (gen) {
        setSelectedGen(gen);
        setSheetOpen(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generations]
  );

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Auto-polling
  useEffect(() => {
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh]);

  const generationsMap = new Map(generations.map((g) => [g.id, g]));

  const ctx: BlockRenderContext = {
    projectId: project.id,
    generations: generationsMap,
    onSelectGeneration: handleSelectGeneration,
  };

  return (
    <div className="relative px-6 py-6">
      {/* Content area — centered */}
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/projects">Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              {project.title}
            </h1>
            <ProjectMentionButton
              projectId={project.id}
              title={project.title}
            />
            <button
              type="button"
              onClick={refresh}
              disabled={isPending}
              className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <IconRefresh
                className={`size-4 ${isPending ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.createdAt.toISOString().slice(0, 10)}
          </p>
        </div>

        {blocks && blocks.length > 0 ? (
          <BlockList blocks={blocks as Block[]} ctx={ctx} />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            No preview yet
          </div>
        )}
      </div>

      {/* Desktop sidebar — fixed right, sticky */}
      {generations.length > 0 && (
        <aside className="hidden lg:block fixed right-6 top-20 w-28">
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <GenerationSidebar
              generations={generations}
              onSelect={handleSelectGeneration}
            />
          </div>
        </aside>
      )}

      {/* Mobile drawer trigger — fixed bottom */}
      {generations.length > 0 && (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Drawer>
            <DrawerTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-lg hover:bg-muted transition-colors"
              >
                <IconLayoutGrid className="size-4" />
                <span>Generations ({generations.length})</span>
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Generations ({generations.length})</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 overflow-x-auto">
                <div className="flex gap-3">
                  {generations.map((gen) => (
                    <MobileGenerationThumbnail
                      key={gen.id}
                      gen={gen}
                      onClick={() => handleSelectGeneration(gen.id)}
                    />
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}

      {/* Generation Detail Sheet */}
      <GenerationDetailSheet
        gen={selectedGen}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

function MobileGenerationThumbnail({
  gen,
  onClick,
}: { gen: GenerationItem; onClick?: () => void }) {
  const url = gen.output?.urls?.[0] ?? gen.output?.url ?? null;
  const label = gen.comment || gen.id.slice(0, 8);
  const isVideo = gen.type === 'video';
  const isPending = gen.status === 'pending' || gen.status === 'processing';

  return (
    <button type="button" onClick={onClick} className="shrink-0 w-20 text-left">
      <div className="size-20 rounded-md overflow-hidden bg-muted border hover:ring-2 hover:ring-primary/50 transition-all">
        {url ? (
          isVideo ? (
            <video
              src={url}
              className="size-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <img
              src={url}
              alt={label}
              className="size-full object-cover"
              loading="lazy"
            />
          )
        ) : isPending ? (
          <div className="flex size-full items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            {gen.status}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground truncate text-center">
        {label}
      </p>
    </button>
  );
}
