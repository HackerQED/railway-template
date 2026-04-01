import { LocaleLink } from '@/i18n/navigation';
import { Info } from 'lucide-react';

export function SeedanceBanner() {
  return (
    <div className="mb-4">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-muted-foreground text-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Info className="size-4 shrink-0 text-amber-500" />
          <span className="font-medium text-foreground">
            Real-Person Video Tips
          </span>
        </div>
        <ul className="space-y-1 ml-6">
          <li>
            When uploading reference images with real human faces, use the{' '}
            <strong className="text-foreground">Mark as Real Person</strong>{' '}
            button to bypass content moderation and get better results.
          </li>
          <li>
            Need an alternative?{' '}
            <LocaleLink
              href="/models/seedance-1-5"
              className="font-medium text-primary underline underline-offset-2"
            >
              Seedance 1.5
            </LocaleLink>{' '}
            offers{' '}
            <strong className="text-foreground">no moderation</strong>, lower
            price, and faster generation.
          </li>
        </ul>
      </div>
    </div>
  );
}
