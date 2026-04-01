'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePricingDialogStore } from '@/stores/pricing-dialog-store';
import { SparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PricingTable } from './pricing-table';

/**
 * Global pricing dialog triggered when credits are insufficient (402).
 * Reuses the same PricingTable component as the /pricing page.
 */
export function PricingDialog() {
  const { open, closePricingDialog } = usePricingDialogStore();
  const t = useTranslations('PricingPage');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closePricingDialog()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center">
          <div className="flex justify-center mb-2">
            <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {t('certifiedPartnerBadge')}
            </span>
          </div>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <SparklesIcon className="size-5 text-amber-500" />
            40% OFF — Top Up Now
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('subheadline')}
          </DialogDescription>
        </DialogHeader>
        <PricingTable />
      </DialogContent>
    </Dialog>
  );
}
