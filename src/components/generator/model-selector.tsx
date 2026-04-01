'use client';

import { ModelIcon } from '@/components/model-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MODELS, getChannels } from '@/config/models';
import { CheckIcon, ChevronsUpDownIcon, CoinsIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useGenerator } from './generator-context';

const CATEGORY_LABELS: Record<string, string> = {
  video: 'VIDEO',
  image: 'IMAGE',
};

export function ModelSelector() {
  const { model } = useGenerator();
  const [open, setOpen] = useState(false);

  // Deduplicate models that share a slug (channels) — show only the first
  const seen = new Set<string>();
  const deduped = MODELS.filter((m) => {
    if (seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  });

  const groupedModels = deduped.reduce(
    (groups, m) => {
      const cat = m.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
      return groups;
    },
    {} as Record<string, typeof MODELS>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <ModelIcon src={model.icon} name={model.name} />
            <span className="font-medium">
              {getChannels(model.slug).length > 1
                ? getChannels(model.slug)[0].name
                : model.name}
            </span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Browse Models</DialogTitle>
          <DialogDescription>
            Each model has its own capabilities and scenarios in which it
            excels.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          {Object.entries(groupedModels)
            .sort(([a], [b]) => {
              const order = ['video', 'image'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([category, models]) => (
              <div key={category}>
                <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  {CATEGORY_LABELS[category] ?? category}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {models.map((m) => {
                    const isSelected = m.slug === model.slug;
                    return (
                      <Link
                        key={m.id}
                        href={`/models/${m.slug}`}
                        onClick={() => setOpen(false)}
                        className={`relative flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent ${
                          isSelected
                            ? 'border-primary bg-accent'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <CheckIcon className="absolute top-3 right-3 size-4 text-primary" />
                        )}
                        <div className="flex items-center gap-2">
                          <ModelIcon src={m.icon} name={m.name} />
                          <span className="font-medium text-sm">{m.name}</span>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {m.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {m.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="px-1.5 py-0 text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          <span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
                            <CoinsIcon className="size-3" />
                            {m.creditCost}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
