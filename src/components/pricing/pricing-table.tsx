'use client';

import { getCurrentPlanAction } from '@/actions/get-current-plan';
import { CreditPackages } from '@/components/settings/credits/credit-packages';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCreditPackages } from '@/config/credits-config';
import { usePricePlans } from '@/config/price-config';
import { websiteConfig } from '@/config/website';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useMounted } from '@/hooks/use-mounted';
import { cn } from '@/lib/utils';
import {
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
  type PricePlan,
} from '@/payment/types';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { PricingCard } from './pricing-card';

type BillingMode = 'month' | 'year' | 'one_time';

interface PricingTableProps {
  metadata?: Record<string, string>;
  currentPlan?: PricePlan | null;
  className?: string;
}

/**
 * Calculate the max yearly savings percentage across all subscription plans
 */
function calcMaxYearlySavingsPercent(plans: PricePlan[]): number {
  let maxPercent = 0;
  for (const plan of plans) {
    const monthlyPrice = plan.prices.find(
      (p) =>
        p.type === PaymentTypes.SUBSCRIPTION &&
        p.interval === PlanIntervals.MONTH
    );
    const yearlyPrice = plan.prices.find(
      (p) =>
        p.type === PaymentTypes.SUBSCRIPTION &&
        p.interval === PlanIntervals.YEAR
    );
    if (monthlyPrice && yearlyPrice) {
      const annualIfMonthly = monthlyPrice.amount * 12;
      const percent = Math.round(
        ((annualIfMonthly - yearlyPrice.amount) / annualIfMonthly) * 100
      );
      if (percent > maxPercent) maxPercent = percent;
    }
  }
  return maxPercent;
}

/**
 * Pricing Table Component
 *
 * 1. Displays all pricing plans with billing mode tabs (Monthly, Yearly, Pay Once)
 * 2. Dynamically calculates per-plan savings for yearly billing
 * 3. Shows max savings percentage on the yearly toggle badge
 */
export function PricingTable({
  metadata,
  currentPlan,
  className,
}: PricingTableProps) {
  const t = useTranslations('PricingPage');
  const mounted = useMounted();
  const currentUser = useCurrentUser();
  const pricePlans = usePricePlans();
  const plans = Object.values(pricePlans);
  const creditPackages = Object.values(useCreditPackages()).filter(
    (pkg) => !pkg.disabled && pkg.price.priceId
  );
  const hasCreditPackages =
    websiteConfig.credits.enableCredits && creditPackages.length > 0;

  // Fetch subscriber status for logged-in users
  const [fetchedPlan, setFetchedPlan] = useState<PricePlan | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [isSubscriberKnown, setIsSubscriberKnown] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    getCurrentPlanAction({ userId: currentUser.id }).then((result) => {
      if (result?.data?.success && result?.data?.data) {
        setFetchedPlan(result.data.data.currentPlan ?? null);
        setIsSubscriber(result.data.data.subscription !== null);
        setIsSubscriberKnown(true);
      }
    });
  }, [currentUser?.id]);

  const resolvedPlan = currentPlan ?? fetchedPlan;
  const currentPlanId = resolvedPlan?.id || null;

  // Filter plans by type
  const showFreePlan = websiteConfig.price.showFreePlan !== false;
  const freePlans = showFreePlan
    ? plans.filter((plan) => plan.isFree && !plan.disabled)
    : [];

  const subscriptionPlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some(
        (price) =>
          !price.disabled &&
          price.priceId &&
          price.type === PaymentTypes.SUBSCRIPTION
      )
  );

  const oneTimePlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some(
        (price) =>
          !price.disabled &&
          price.priceId &&
          price.type === PaymentTypes.ONE_TIME
      )
  );

  const hasMonthlyOption = subscriptionPlans.some((plan) =>
    plan.prices.some(
      (price) =>
        price.type === PaymentTypes.SUBSCRIPTION &&
        price.interval === PlanIntervals.MONTH
    )
  );

  const hasYearlyOption = subscriptionPlans.some((plan) =>
    plan.prices.some(
      (price) =>
        price.type === PaymentTypes.SUBSCRIPTION &&
        price.interval === PlanIntervals.YEAR
    )
  );

  const hasOneTimeOption = oneTimePlans.length > 0;

  // Calculate max yearly savings for the toggle badge
  // Prefer hardcoded yearlyDiscount from plans, fallback to dynamic calculation
  const maxYearlySavingsPercent = useMemo(() => {
    const maxHardcoded = Math.max(
      ...subscriptionPlans.map((p) => p.yearlyDiscount ?? 0)
    );
    return maxHardcoded > 0
      ? maxHardcoded
      : calcMaxYearlySavingsPercent(subscriptionPlans);
  }, [subscriptionPlans]);

  const defaultMode: BillingMode = hasYearlyOption
    ? 'year'
    : hasMonthlyOption
      ? 'month'
      : 'one_time';
  const [billingMode, setBillingMode] = useState<BillingMode>(defaultMode);

  const handleModeChange = (value: string) => {
    if (value) setBillingMode(value as BillingMode);
  };

  // Determine which plans to show based on billing mode
  const displayPlans =
    billingMode === 'one_time' ? oneTimePlans : subscriptionPlans;
  const interval: PlanInterval | undefined =
    billingMode === 'month'
      ? PlanIntervals.MONTH
      : billingMode === 'year'
        ? PlanIntervals.YEAR
        : undefined;
  const paymentType =
    billingMode === 'one_time'
      ? PaymentTypes.ONE_TIME
      : PaymentTypes.SUBSCRIPTION;

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      {/* Billing mode toggle */}
      {(hasMonthlyOption || hasYearlyOption || hasOneTimeOption) && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex justify-center">
            <ToggleGroup
              size="sm"
              type="single"
              value={billingMode}
              onValueChange={handleModeChange}
              className="border rounded-lg p-1"
            >
              {hasMonthlyOption && (
                <ToggleGroupItem
                  value="month"
                  className={cn(
                    'px-4 py-1 cursor-pointer text-sm rounded-md',
                    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                  )}
                >
                  {t('monthly')}
                </ToggleGroupItem>
              )}
              {hasYearlyOption && (
                <ToggleGroupItem
                  value="year"
                  className={cn(
                    'px-4 py-1 cursor-pointer text-sm rounded-md relative',
                    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                  )}
                >
                  <span className="whitespace-nowrap">{t('yearly')}</span>
                  {maxYearlySavingsPercent > 0 && (
                    <span className="absolute -top-3 -right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      {t('yearlySave', { percent: maxYearlySavingsPercent })}
                    </span>
                  )}
                </ToggleGroupItem>
              )}
              {hasOneTimeOption && (
                <ToggleGroupItem
                  value="one_time"
                  className={cn(
                    'px-4 py-1 cursor-pointer text-sm rounded-md',
                    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground'
                  )}
                >
                  {t('payOnce')}
                </ToggleGroupItem>
              )}
            </ToggleGroup>
          </div>
          <p className="text-sm text-muted-foreground">Pay per credit • Cancel anytime</p>
        </div>
      )}

      {/* Plans grid */}
      {(() => {
        const totalVisiblePlans = freePlans.length + displayPlans.length;
        return (
          <div
            className={cn(
              'grid gap-6',
              totalVisiblePlans === 1 && 'grid-cols-1 max-w-md mx-auto w-full',
              totalVisiblePlans === 2 &&
                'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto w-full',
              totalVisiblePlans >= 3 &&
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            )}
          >
            {/* Free plans */}
            {billingMode !== 'one_time' &&
              freePlans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  metadata={metadata}
                  isCurrentPlan={currentPlanId === plan.id}
                />
              ))}

            {/* Subscription or one-time plans */}
            {displayPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                interval={interval}
                paymentType={paymentType}
                metadata={metadata}
                isCurrentPlan={currentPlanId === plan.id}
                isSubscriber={isSubscriber}
                isSubscriberKnown={isSubscriberKnown}
              />
            ))}
          </div>
        );
      })()}

      {mounted && hasCreditPackages && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-center">{t('payOnce')}</h3>
          <CreditPackages
            variant="pricing"
            purchaseLabel={t('PricingCard.purchaseNow')}
            signInLabel={t('PricingCard.signInToPurchase')}
            subscribersOnlyLabel={t('PricingCard.subscribersOnly')}
          />
        </div>
      )}
    </div>
  );
}
