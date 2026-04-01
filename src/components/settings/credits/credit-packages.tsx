'use client';

import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCreditPackages } from '@/config/credits-config';
import { websiteConfig } from '@/config/website';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentPlan } from '@/hooks/use-payment';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { formatPrice } from '@/lib/formatter';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { CircleCheckBigIcon, CoinsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CreditCheckoutButton } from './credit-checkout-button';

interface CreditPackagesProps {
  variant?: 'dashboard' | 'pricing';
  className?: string;
  purchaseLabel?: string;
  signInLabel?: string;
  subscribersOnlyLabel?: string;
}

/**
 * Credit packages component
 */
export function CreditPackages({
  variant = 'dashboard',
  className,
  purchaseLabel,
  signInLabel,
  subscribersOnlyLabel,
}: CreditPackagesProps) {
  // Check if credits are enabled - move this check before any hooks
  if (!websiteConfig.credits.enableCredits) {
    return null;
  }

  const t = useTranslations('Dashboard.settings.credits.packages');
  const isPricing = variant === 'pricing';

  // Get current user and payment info
  const currentUser = useCurrentUser();
  const { data: paymentData, isLoading: isLoadingPayment } = useCurrentPlan(
    currentUser?.id
  );
  const currentPlan = paymentData?.currentPlan;
  const currentPath = useLocalePathname();

  // Get credit packages with translations - must be called here to maintain hook order
  // This function contains useTranslations hook, so it must be called before any conditional returns
  const creditPackages = Object.values(useCreditPackages()).filter(
    (pkg) => !pkg.disabled && pkg.price.priceId
  );

  // Don't render anything while loading to prevent flash
  if (isLoadingPayment) {
    return null;
  }

  // Don't render anything if we don't have payment data yet for logged-in users
  if (currentUser && !paymentData) {
    return null;
  }

  // Check if user is on free plan and enablePackagesForFreePlan is false
  const isFreePlan = currentPlan?.isFree === true;
  const hasActiveSubscription = Boolean(paymentData?.subscription);
  const hasLifetimeAccess = currentPlan?.isLifetime === true;
  const hasPaidAccess = hasActiveSubscription || hasLifetimeAccess;
  const requiresSubscription = !websiteConfig.credits.enablePackagesForFreePlan;
  const shouldDisableForNonSubscribers = requiresSubscription && !hasPaidAccess;

  // Check if user is on free plan and enablePackagesForFreePlan is false
  if (
    !isPricing &&
    isFreePlan &&
    !websiteConfig.credits.enablePackagesForFreePlan
  ) {
    return null;
  }

  const totalPackages = creditPackages.length;

  return (
    <div
      className={cn(
        'grid gap-6',
        totalPackages === 1 && 'grid-cols-1 max-w-md mx-auto w-full',
        totalPackages === 2 &&
          'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto w-full',
        totalPackages === 3 &&
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto w-full',
        totalPackages >= 4 &&
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto w-full',
        className
      )}
    >
      {creditPackages.map((creditPackage) => (
        <Card
          key={creditPackage.id}
          className={cn(
            `relative ${creditPackage.popular ? 'border-primary' : ''}`,
            'shadow-none border-1 border-border'
          )}
        >
          {creditPackage.popular && (
            <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
              <Badge
                variant="default"
                className="bg-primary text-primary-foreground"
              >
                {t('popular')}
              </Badge>
            </div>
          )}

          <CardContent className="space-y-4">
            {/* Price and Credits - Left/Right Layout */}
            <div className="flex items-center justify-between py-2">
              <div className="text-left">
                <div className="text-2xl font-semibold flex items-center gap-2">
                  <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                  {creditPackage.amount.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(
                    creditPackage.price.amount,
                    creditPackage.price.currency
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-left py-2 flex items-center gap-2">
              <CircleCheckBigIcon className="h-4 w-4 text-green-500" />
              {creditPackage.description}
            </div>

            {/* purchase button using checkout */}
            {currentUser ? (
              shouldDisableForNonSubscribers ? (
                <Button
                  asChild
                  className="w-full mt-2"
                  variant={creditPackage.popular ? 'default' : 'outline'}
                >
                  <LocaleLink href={Routes.Pricing}>
                    {subscribersOnlyLabel ?? t('subscribeToPurchase')}
                  </LocaleLink>
                </Button>
              ) : (
                <CreditCheckoutButton
                  userId={currentUser.id}
                  packageId={creditPackage.id}
                  priceId={creditPackage.price.priceId}
                  className="w-full cursor-pointer mt-2"
                  variant={creditPackage.popular ? 'default' : 'outline'}
                  disabled={!creditPackage.price.priceId}
                >
                  {purchaseLabel ?? t('purchase')}
                </CreditCheckoutButton>
              )
            ) : (
              <GoogleLoginButton
                variant={creditPackage.popular ? 'default' : 'outline'}
                className="w-full mt-2"
                callbackUrl={currentPath}
              >
                {signInLabel ?? t('purchase')}
              </GoogleLoginButton>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
