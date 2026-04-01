'use client';

import { websiteConfig } from '@/config/website';
import { trackConversion } from './gtag';

/**
 * Track begin_checkout conversion event for Google Ads.
 * Call this when user clicks a checkout button.
 */
export function trackBeginCheckout() {
  const googleAds = websiteConfig.analytics.googleAds;
  if (!googleAds?.googleAdsId || !googleAds?.beginCheckoutConversionLabel) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Google Ads] begin_checkout skipped: no config');
    }
    return;
  }

  trackConversion({
    label: googleAds.beginCheckoutConversionLabel,
    googleAdsId: googleAds.googleAdsId,
  });
}
