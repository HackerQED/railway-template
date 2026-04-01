'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMounted } from '@/hooks/use-mounted';
import { useLocalePathname } from '@/i18n/navigation';
import { formatPrice } from '@/lib/formatter';
import { cn } from '@/lib/utils';
import {
  type PaymentType,
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
  type Price,
  type PricePlan,
} from '@/payment/types';
import {
  CheckCircleIcon,
  SparklesIcon,
  StarIcon,
  XCircleIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GoogleLoginButton } from '../auth/google-login-button';
import { Badge } from '../ui/badge';
import { CheckoutButton } from './create-checkout-button';
import { CustomerPortalButton } from './customer-portal-button';

interface PricingCardProps {
  plan: PricePlan;
  interval?: PlanInterval;
  paymentType?: PaymentType;
  metadata?: Record<string, string>;
  className?: string;
  isCurrentPlan?: boolean;
  isSubscriber?: boolean;
  isSubscriberKnown?: boolean;
}

function getPriceForPlan(
  plan: PricePlan,
  interval?: PlanInterval,
  paymentType?: PaymentType
): Price | undefined {
  if (plan.isFree) return undefined;

  return plan.prices.find((price) => {
    if (paymentType === PaymentTypes.ONE_TIME) {
      return price.type === PaymentTypes.ONE_TIME;
    }
    return (
      price.type === PaymentTypes.SUBSCRIPTION && price.interval === interval
    );
  });
}

/**
 * Calculate per-plan yearly savings dynamically
 */
function calcPlanSavings(plan: PricePlan, yearlyPrice: Price) {
  const monthlyPrice = plan.prices.find(
    (p) =>
      p.type === PaymentTypes.SUBSCRIPTION && p.interval === PlanIntervals.MONTH
  );
  if (!monthlyPrice) return { savingsPercent: 0, savingsAmount: 0 };

  const annualIfMonthly = monthlyPrice.amount * 12;
  const savings = annualIfMonthly - yearlyPrice.amount;
  if (savings <= 0) return { savingsPercent: 0, savingsAmount: 0 };

  return {
    savingsPercent: Math.round((savings / annualIfMonthly) * 100),
    savingsAmount: savings,
  };
}

export function PricingCard({
  plan,
  interval,
  paymentType,
  metadata,
  className,
  isCurrentPlan = false,
  isSubscriber,
  isSubscriberKnown,
}: PricingCardProps) {
  const t = useTranslations('PricingPage.PricingCard');
  const price = getPriceForPlan(plan, interval, paymentType);
  const currentUser = useCurrentUser();
  const currentPath = useLocalePathname();
  const mounted = useMounted();

  const isOneTime = paymentType === PaymentTypes.ONE_TIME;

  // Price display
  let formattedPrice = '';
  let priceLabel = '';
  let monthlyEquivalent = '';
  let originalMonthlyPrice = '';
  if (plan.isFree) {
    formattedPrice = t('freePrice');
  } else if (price && price.amount > 0) {
    if (interval === PlanIntervals.YEAR) {
      const monthlyAmount = Math.round(price.amount / 12);
      formattedPrice = formatPrice(monthlyAmount, price.currency);
      priceLabel = t('perMonth');
      monthlyEquivalent = formatPrice(price.amount, price.currency);
      // Show original monthly price as strikethrough
      const mp = plan.prices.find(
        (p) =>
          p.type === PaymentTypes.SUBSCRIPTION &&
          p.interval === PlanIntervals.MONTH
      );
      if (mp) {
        originalMonthlyPrice = formatPrice(mp.amount, mp.currency);
      }
    } else {
      formattedPrice = formatPrice(price.amount, price.currency);
      if (interval === PlanIntervals.MONTH) {
        priceLabel = t('perMonth');
      }
    }
  } else {
    formattedPrice = t('notAvailable');
  }

  // Yearly savings display
  let savingsPercent = 0;
  let savingsAmount = '';
  if (!plan.isFree && interval === PlanIntervals.YEAR && price) {
    const savings = calcPlanSavings(plan, price);
    savingsPercent = plan.yearlyDiscount ?? savings.savingsPercent;
    if (savings.savingsAmount > 0) {
      savingsAmount = formatPrice(savings.savingsAmount, price.currency);
    }
  }

  // Credits info
  const credits = plan.credits;
  const hasCredits = credits?.enable && credits.amount > 0;
  let totalCredits = 0;
  let creditsIntervalLabel = '';
  let costPer100Credits = '';
  if (hasCredits && price) {
    if (interval === PlanIntervals.YEAR) {
      totalCredits = credits.amount * 12;
      creditsIntervalLabel = t('perYear');
    } else if (isOneTime) {
      totalCredits = credits.amount;
      creditsIntervalLabel = '';
    } else {
      totalCredits = credits.amount;
      creditsIntervalLabel = t('perMonth');
    }
    const totalPrice = price.amount;
    const totalCreds =
      interval === PlanIntervals.YEAR ? credits.amount * 12 : credits.amount;
    if (totalCreds > 0) {
      const costPer100 = (totalPrice / totalCreds) * 100;
      costPer100Credits = formatPrice(Math.round(costPer100), price.currency);
    }
  }

  const formatCredits = (num: number) => {
    if (num >= 1000) {
      const k = num / 1000;
      return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
    }
    return num.toString();
  };

  const isPaidPlan = !plan.isFree && !!price;
  const hasTrialPeriod = price?.trialPeriodDays && price.trialPeriodDays > 0;
  const oneTimeRequiresSubscriber =
    isOneTime && currentUser && isSubscriberKnown && !isSubscriber;

  const shouldShowPortal =
    isSubscriber && isSubscriberKnown && !isCurrentPlan && !isOneTime;
  const purchaseLabel = isOneTime ? t('buyNow') : t('purchaseNow');

  return (
    <div
      className={cn(
        'relative rounded-xl',
        plan.popular &&
          'p-[2px] bg-gradient-to-b from-purple-500 via-pink-500 to-orange-400',
        !plan.popular && 'p-0',
        className
      )}
    >
      <Card
        className={cn(
          'flex flex-col h-full rounded-xl border-0',
          plan.popular && 'relative shadow-lg shadow-purple-500/10',
          !plan.popular && 'border',
          isCurrentPlan &&
            'border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
        )}
      >
        {/* Popular badge */}
        {plan.popular && (
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 z-10">
            <Badge
              variant="default"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-md px-3 py-1 gap-1"
            >
              <StarIcon className="size-3 fill-current" />
              {t('popular')}
            </Badge>
          </div>
        )}

        {/* Current plan badge */}
        {isCurrentPlan && (
          <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
            <Badge
              variant="default"
              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800"
            >
              {t('currentPlan')}
            </Badge>
          </div>
        )}

        <CardHeader>
          <CardTitle>
            <h3 className="font-medium">{plan.name}</h3>
          </CardTitle>

          {/* Price display */}
          <div className="flex items-baseline gap-1">
            <span className="my-4 block text-4xl font-semibold">
              {formattedPrice}
            </span>
            {originalMonthlyPrice && interval === PlanIntervals.YEAR && (
              <span className="text-lg text-muted-foreground line-through">
                {originalMonthlyPrice}
              </span>
            )}
            {priceLabel && (
              <span className="text-muted-foreground text-lg">
                {priceLabel}
              </span>
            )}
          </div>

          {/* Billed annually + savings detail */}
          {interval === PlanIntervals.YEAR && monthlyEquivalent && (
            <div className="flex flex-col gap-1.5 -mt-2 mb-1">
              <span className="text-sm text-muted-foreground">
                {t('billedAnnually', { amount: monthlyEquivalent })}
              </span>
              {savingsPercent > 0 && savingsAmount && (
                <span className="inline-flex items-center gap-1 w-fit rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 px-3 py-1 text-xs font-semibold">
                  {t('yearlySavings', {
                    amount: savingsAmount,
                    percent: savingsPercent,
                  })}
                </span>
              )}
            </div>
          )}

          {/* Credits info box */}
          {hasCredits && price && (
            <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <SparklesIcon className="size-3.5 text-amber-500" />
                  {formatCredits(totalCredits)}
                </span>
                {creditsIntervalLabel && (
                  <span className="text-xs text-muted-foreground">
                    {creditsIntervalLabel}
                  </span>
                )}
              </div>
              {costPer100Credits && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('costPer100Credits')}</span>
                  <span className="font-semibold text-foreground">
                    {costPer100Credits}
                  </span>
                </div>
              )}
            </div>
          )}

          <CardDescription>
            <p className="text-sm">{plan.description}</p>
          </CardDescription>

          {/* Action buttons */}
          {plan.isFree ? (
            mounted && currentUser ? (
              <Button variant="outline" className="mt-4 w-full disabled">
                {t('getStartedForFree')}
              </Button>
            ) : (
              <GoogleLoginButton
                variant="outline"
                className="mt-4 w-full"
                callbackUrl={currentPath}
              >
                {t('getStartedForFree')}
              </GoogleLoginButton>
            )
          ) : isCurrentPlan ? (
            <Button
              disabled
              className="mt-4 w-full bg-blue-100 dark:bg-blue-800
            text-blue-700 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-800 border border-blue-200 dark:border-blue-700"
            >
              {t('yourCurrentPlan')}
            </Button>
          ) : isPaidPlan ? (
            mounted && currentUser ? (
              oneTimeRequiresSubscriber ? (
                <Button disabled className="mt-4 w-full">
                  {t('subscribersOnly')}
                </Button>
              ) : shouldShowPortal ? (
                <CustomerPortalButton
                  userId={currentUser.id}
                  className={cn(
                    'mt-4 w-full cursor-pointer',
                    plan.popular &&
                      'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0'
                  )}
                >
                  {t('managePlan')}
                </CustomerPortalButton>
              ) : (
                <CheckoutButton
                  userId={currentUser.id}
                  planId={plan.id}
                  priceId={price.priceId}
                  metadata={metadata}
                  className={cn(
                    'mt-4 w-full cursor-pointer',
                    plan.popular &&
                      'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0'
                  )}
                >
                  {purchaseLabel}
                </CheckoutButton>
              )
            ) : (
              <GoogleLoginButton
                variant="default"
                className={cn(
                  'mt-4 w-full',
                  plan.popular &&
                    'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0'
                )}
                callbackUrl={currentPath}
              >
                {t('signInToPurchase')}
              </GoogleLoginButton>
            )
          ) : (
            <Button disabled className="mt-4 w-full">
              {t('notAvailable')}
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <hr className="border-dashed" />

          {/* Trial period */}
          {hasTrialPeriod && (
            <div className="my-4">
              <span
                className="inline-block px-2.5 py-1.5 text-xs font-medium rounded-md
              bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-sm"
              >
                {t('daysTrial', { days: price.trialPeriodDays as number })}
              </span>
            </div>
          )}

          {/* What's Included */}
          <p className="text-sm font-semibold">{t('whatsIncluded')}</p>

          <ul className="list-outside space-y-3 text-sm">
            {interval === PlanIntervals.YEAR && !plan.isFree && (
              <li className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 shrink-0 text-green-500 dark:text-green-400" />
                <span className="font-medium">{t('yearlyCreditsUpfront')}</span>
              </li>
            )}
            {(interval === PlanIntervals.MONTH && plan.monthlyFeatures
              ? plan.monthlyFeatures
              : plan.features
            )?.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 shrink-0 text-green-500 dark:text-green-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <ul className="list-outside space-y-3 text-sm">
            {plan.limits?.map((limit, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <XCircleIcon className="size-4 shrink-0 text-gray-400 dark:text-gray-500" />
                <span className="line-through">{limit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
