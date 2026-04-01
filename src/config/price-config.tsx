'use client';

import type { PricePlan } from '@/payment/types';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * Get price plans with translations for client components
 *
 * NOTICE: This function should only be used in client components.
 * If you need to get the price plans in server components, use getAllPricePlans instead.
 * Use this function when showing the pricing table or the billing card to the user.
 *
 * docs:
 * https://mksaas.com/docs/config/price
 *
 * @returns The price plans with translated content
 */
export function usePricePlans(): Record<string, PricePlan> {
  const t = useTranslations('PricePlans');
  const priceConfig = websiteConfig.price;
  const plans: Record<string, PricePlan> = {};

  // Add translated content to each plan
  if (priceConfig.plans.free) {
    plans.free = {
      ...priceConfig.plans.free,
      name: t('free.name'),
      description: t('free.description'),
      features: [
        t('free.features.feature-1'),
        t('free.features.feature-2'),
        t('free.features.feature-3'),
        t('free.features.feature-4'),
      ],
      limits: [
        t('free.limits.limit-1'),
        t('free.limits.limit-2'),
      ],
    };
  }

  if (priceConfig.plans.basic) {
    plans.basic = {
      ...priceConfig.plans.basic,
      name: t('basic.name'),
      description: t('basic.description'),
      features: [
        t('basic.features.feature-1'),
        t('basic.features.feature-2'),
        t('basic.features.feature-3'),
        t('basic.features.feature-4'),
        t('basic.features.feature-5'),
        t('basic.features.feature-6'),
      ],
      monthlyFeatures: [
        t('basic.monthlyFeatures.feature-1'),
        t('basic.monthlyFeatures.feature-2'),
        t('basic.monthlyFeatures.feature-3'),
        t('basic.monthlyFeatures.feature-4'),
        t('basic.monthlyFeatures.feature-5'),
        t('basic.monthlyFeatures.feature-6'),
      ],
      limits: [t('basic.limits.limit-1')],
    };
  }

  if (priceConfig.plans.pro) {
    plans.pro = {
      ...priceConfig.plans.pro,
      name: t('pro.name'),
      description: t('pro.description'),
      features: [
        t('pro.features.feature-1'),
        t('pro.features.feature-2'),
        t('pro.features.feature-3'),
        t('pro.features.feature-4'),
        t('pro.features.feature-5'),
        t('pro.features.feature-6'),
        t('pro.features.feature-7'),
        t('pro.features.feature-8'),
      ],
      monthlyFeatures: [
        t('pro.monthlyFeatures.feature-1'),
        t('pro.monthlyFeatures.feature-2'),
        t('pro.monthlyFeatures.feature-3'),
        t('pro.monthlyFeatures.feature-4'),
        t('pro.monthlyFeatures.feature-5'),
        t('pro.monthlyFeatures.feature-6'),
        t('pro.monthlyFeatures.feature-7'),
        t('pro.monthlyFeatures.feature-8'),
      ],
      limits: [],
    };
  }

  if (priceConfig.plans.premium) {
    plans.premium = {
      ...priceConfig.plans.premium,
      name: t('premium.name'),
      description: t('premium.description'),
      features: [
        t('premium.features.feature-1'),
        t('premium.features.feature-2'),
        t('premium.features.feature-3'),
        t('premium.features.feature-4'),
        t('premium.features.feature-5'),
        t('premium.features.feature-6'),
        t('premium.features.feature-7'),
        t('premium.features.feature-8'),
      ],
      monthlyFeatures: [
        t('premium.monthlyFeatures.feature-1'),
        t('premium.monthlyFeatures.feature-2'),
        t('premium.monthlyFeatures.feature-3'),
        t('premium.monthlyFeatures.feature-4'),
        t('premium.monthlyFeatures.feature-5'),
        t('premium.monthlyFeatures.feature-6'),
        t('premium.monthlyFeatures.feature-7'),
        t('premium.monthlyFeatures.feature-8'),
      ],
      limits: [],
    };
  }

  if (priceConfig.plans.onetime) {
    plans.onetime = {
      ...priceConfig.plans.onetime,
      name: t('onetime.name'),
      description: t('onetime.description'),
      features: [
        t('onetime.features.feature-1'),
        t('onetime.features.feature-2'),
        t('onetime.features.feature-3'),
      ],
      limits: [],
    };
  }

  return plans;
}
