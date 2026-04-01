'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { websiteConfig } from '@/config/website';
import { useCreditStats } from '@/hooks/use-credits';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import {
  CircleAlertIcon,
  ClockIcon,
  CoinsIcon,
  GemIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
  ShoppingBagIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CreditsBalanceButtonProps {
  userId?: string;
  className?: string;
}

export function CreditsBalanceButton({
  userId,
  className,
}: CreditsBalanceButtonProps) {
  const creditsEnabled = websiteConfig.credits.enableCredits;
  const t = useTranslations('Dashboard.settings.credits.balance');

  const { data: creditStats, isLoading } = useCreditStats(
    creditsEnabled ? userId : undefined
  );

  if (!creditsEnabled || !userId) {
    return null;
  }

  const creditBalance = creditStats?.creditBalance;
  const available = creditBalance?.available ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      {/* Top Up shortcut with discount badge */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-3 text-sm font-medium cursor-pointer rounded-full"
        asChild
      >
        <LocaleLink href={Routes.Pricing}>
          <PlusIcon className="h-3.5 w-3.5" />
          {t('topUp')}
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
            40% OFF
          </span>
        </LocaleLink>
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-3 text-sm font-medium cursor-pointer rounded-full transition-colors',
              'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20',
              className
            )}
          >
            <CoinsIcon className="h-3.5 w-3.5" />
            <span>
              {isLoading ? (
                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                available.toLocaleString()
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-3">
          <TooltipProvider delayDuration={200}>
            <div className="space-y-2">
              {creditBalance && (
                <>
                  <BalanceRow
                    icon={<GemIcon className="h-3.5 w-3.5 text-blue-500" />}
                    label={t('subscriptionBalance')}
                    value={creditBalance.subscriptionBalance}
                    tooltip={t('subscriptionTooltip')}
                  />
                  <BalanceRow
                    icon={
                      <ShoppingBagIcon className="h-3.5 w-3.5 text-emerald-500" />
                    }
                    label={t('purchasedBalance')}
                    value={creditBalance.balance}
                    tooltip={t('purchasedTooltip')}
                  />
                  {creditBalance.pendingBalance > 0 && (
                    <BalanceRow
                      icon={
                        <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                      }
                      label={t('pendingBalance')}
                      value={creditBalance.pendingBalance}
                      tooltip={t('pendingTooltip')}
                      className="text-amber-600"
                    />
                  )}
                </>
              )}

              <Separator />

              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 cursor-pointer" asChild>
                  <LocaleLink href={Routes.Pricing}>
                    <PlusIcon className="h-3.5 w-3.5" />
                    {t('topUp')}
                  </LocaleLink>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer px-2"
                  asChild
                >
                  <LocaleLink href={Routes.SettingsCredits}>
                    <SettingsIcon className="h-3.5 w-3.5" />
                  </LocaleLink>
                </Button>
              </div>
            </div>
          </TooltipProvider>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function BalanceRow({
  icon,
  label,
  value,
  tooltip,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tooltip: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn('flex items-center justify-between text-sm', className)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-muted-foreground">{label}</span>
            <CircleAlertIcon className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <span className="font-medium">{value.toLocaleString()}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-52">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
