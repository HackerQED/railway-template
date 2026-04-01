'use client';

import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'promo_banner_dismissed_at';

/**
 * Timestamp used to re-show the banner after content updates.
 * Bump this date whenever the promotion copy changes.
 */
const BANNER_CREATED_AT = new Date('2026-03-27T00:00:00Z');

export function PromotionalBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const lastDismissed = localStorage.getItem(STORAGE_KEY);

    if (!lastDismissed) {
      setVisible(true);
      return;
    }

    // Re-show if banner content was updated after last dismissal
    if (BANNER_CREATED_AT > new Date(lastDismissed)) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-rose-500/90 text-white">
      <div className="flex items-center justify-center gap-3 px-10 py-2.5 text-sm font-medium">
        <ShoppingCart className="size-4 shrink-0" />
        <span className="text-center">
          <span className="font-semibold">Seedance 2.0 Launch Sale:</span> Get{' '}
          <span className="font-bold">40% OFF</span>
        </span>
        <LocaleLink
          href={Routes.Pricing}
          className="ml-1 inline-flex shrink-0 items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-600 transition-colors hover:bg-white/90"
        >
          Get 40% off
        </LocaleLink>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 size-6 text-white/80 hover:text-white hover:bg-white/10"
        onClick={handleClose}
        aria-label="Close promotion"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
