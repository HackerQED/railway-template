import { websiteConfig } from '@/config/website';
import { ConversionTracker } from '@/lib/google-ads/conversion-tracker';
import SourceCapture from '@/lib/google-ads/source-capture';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { AhrefsAnalytics } from './ahrefs-analytics';
import ClarityAnalytics from './clarity-analytics';
import DataFastAnalytics from './data-fast-analytics';
import GoogleAdsTag from './google-ads-tag';
import GoogleAnalytics from './google-analytics';
import OpenPanelAnalytics from './open-panel-analytics';
import { PlausibleAnalytics } from './plausible-analytics';
import { SelineAnalytics } from './seline-analytics';
import { UmamiAnalytics } from './umami-analytics';

/**
 * Google Ads conversion tracking components.
 * Works in both development (logs only) and production (real tracking).
 * - GoogleAdsTag: loads gtag.js
 * - SourceCapture: captures gclid/utm from URL to localStorage
 * - ConversionTracker: unified signup + purchase conversion reporting via DB
 */
export function GoogleAdsTracking() {
  return (
    <>
      <GoogleAdsTag />
      <SourceCapture />
      <ConversionTracker />
    </>
  );
}

/**
 * Analytics Components all in one
 *
 * 1. all the analytics components only work in production
 * 2. only work if the environment variable for the analytics is set
 *
 * docs:
 * https://mksaas.com/docs/analytics
 */
export function Analytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* google analytics */}
      <GoogleAnalytics />

      {/* umami analytics */}
      <UmamiAnalytics />

      {/* plausible analytics */}
      <PlausibleAnalytics />

      {/* ahrefs analytics */}
      <AhrefsAnalytics />

      {/* datafast analytics */}
      <DataFastAnalytics />

      {/* openpanel analytics */}
      <OpenPanelAnalytics />

      {/* seline analytics */}
      <SelineAnalytics />

      {/* clarity analytics */}
      <ClarityAnalytics />

      {/* vercel analytics */}
      {/* https://vercel.com/docs/analytics/quickstart */}
      {websiteConfig.analytics.enableVercelAnalytics && <VercelAnalytics />}

      {/* speed insights */}
      {/* https://vercel.com/docs/speed-insights/quickstart */}
      {websiteConfig.analytics.enableSpeedInsights && <SpeedInsights />}
    </>
  );
}
