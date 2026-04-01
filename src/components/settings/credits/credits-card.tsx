'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { websiteConfig } from '@/config/website';
import { useCreditStats } from '@/hooks/use-credits';
import { useMounted } from '@/hooks/use-mounted';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { CircleAlertIcon, RefreshCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

export default function CreditsCard() {
  if (!websiteConfig.credits.enableCredits) {
    return null;
  }

  const t = useTranslations('Dashboard.settings.credits.balance');
  const mounted = useMounted();

  const { data: session } = authClient.useSession();
  const currentUser = session?.user;

  const {
    data: creditStats,
    isLoading,
    error,
    refetch,
  } = useCreditStats(currentUser?.id);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!mounted || isLoading) {
    return (
      <Card className={cn('w-full overflow-hidden pt-6 pb-0 flex flex-col')}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <Skeleton className="h-9 w-1/5" />
        </CardContent>
        <CardFooter className="px-6 py-4 flex justify-between items-center bg-muted rounded-none">
          <Skeleton className="h-4 w-3/5" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full overflow-hidden pt-6 pb-0 flex flex-col')}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="text-destructive text-sm">{error.message}</div>
        </CardContent>
        <CardFooter className="mt-2 px-6 py-4 flex justify-end items-center bg-muted rounded-none">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleRetry}
          >
            <RefreshCwIcon className="size-4 mr-1" />
            {t('retry')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const creditBalance = creditStats?.creditBalance;
  const available = creditBalance?.available ?? 0;

  return (
    <Card className={cn('w-full overflow-hidden pt-6 pb-0 flex flex-col')}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-3xl font-medium">{available.toLocaleString()}</div>
      </CardContent>
      <CardFooter className="px-6 py-4 flex justify-between items-center bg-muted rounded-none">
        {creditBalance && (
          <TooltipProvider delayDuration={200}>
            <div className="text-sm text-muted-foreground flex gap-4">
              <BalanceLabel
                label={t('subscriptionBalance')}
                value={creditBalance.subscriptionBalance}
                tooltip={t('subscriptionTooltip')}
              />
              <BalanceLabel
                label={t('purchasedBalance')}
                value={creditBalance.balance}
                tooltip={t('purchasedTooltip')}
              />
              {creditBalance.pendingBalance > 0 && (
                <BalanceLabel
                  label={t('pendingBalance')}
                  value={creditBalance.pendingBalance}
                  tooltip={t('pendingTooltip')}
                  className="text-amber-600"
                />
              )}
            </div>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}

function BalanceLabel({
  label,
  value,
  tooltip,
  className,
}: {
  label: string;
  value: number;
  tooltip: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 cursor-default',
            className
          )}
        >
          {label}: {value.toLocaleString()}
          <CircleAlertIcon className="h-3 w-3 text-muted-foreground/50" />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
