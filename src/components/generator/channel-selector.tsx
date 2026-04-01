'use client';

import { Badge } from '@/components/ui/badge';
import { ZapIcon } from 'lucide-react';
import { useGenerator } from './generator-context';

export function ChannelSelector() {
  const { model, channels, switchChannel } = useGenerator();

  // Only show when there are multiple channels
  if (channels.length <= 1) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {channels.map((ch) => {
        const isSelected = ch.id === model.id;
        const isExpress = ch.channelLabel === 'Express';
        return (
          <button
            key={ch.id}
            type="button"
            onClick={() => switchChannel(ch.id)}
            className={`relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {ch.channelLabel ?? ch.name}
              </span>
              {isExpress && (
                <Badge
                  variant="default"
                  className="bg-amber-500/90 px-1.5 py-0 text-[10px] hover:bg-amber-500"
                >
                  <ZapIcon className="mr-0.5 size-2.5" />
                  VIP
                </Badge>
              )}
            </div>
            {ch.channelDescription && (
              <p className="text-muted-foreground text-xs">
                {ch.channelDescription}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
