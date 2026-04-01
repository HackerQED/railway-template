'use client';

import { markConversionReportedAction } from '@/actions/mark-conversion-reported';
import { saveConversionDataAction } from '@/actions/save-conversion-data';
import { websiteConfig } from '@/config/website';
import { authClient } from '@/lib/auth-client';
import { useEffect, useRef } from 'react';
import { setUserData, trackConversion } from './gtag';
import { getStoredSourceData } from './source-capture';

/**
 * Unified Google Ads conversion tracker.
 * Runs on every page load: saves source data, reports pending signup/purchase conversions.
 * No skip optimization — always checks DB for pending work.
 */
export function ConversionTracker() {
  const { data: session } = authClient.useSession();
  const reportedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user) return;
    processConversions(session.user, reportedIds.current);
  }, [session?.user?.id]);

  return null;
}

async function processConversions(
  user: { id: string; email: string; createdAt: Date },
  reportedIds: Set<string>
) {
  const googleAds = websiteConfig.analytics.googleAds;
  const sourceData = getStoredSourceData();

  // Single server call: save source data + return full conversion status
  const result = await saveConversionDataAction({
    signUpAt: new Date().toISOString(),
    gclid: sourceData?.gclid ?? undefined,
    utmSource: sourceData?.utmSource ?? undefined,
    utmCampaign: sourceData?.utmCampaign ?? undefined,
    referrer: sourceData?.referrer ?? undefined,
    landingPage: sourceData?.landingPage ?? undefined,
  }).catch((err) => {
    console.error('[Google Ads] Failed to save/get conversion data:', err);
    return null;
  });

  const data = result?.data;
  if (!data?.success || !googleAds?.googleAdsId) return;

  const gclid = data.gclid ?? sourceData?.gclid ?? undefined;

  // Signup conversion (signUpWasSet = DB field was freshly written this call)
  if (googleAds.signupConversionLabel && data.signUpWasSet) {
    if (user.email) {
      setUserData({ email: user.email });
    }

    trackConversion({
      label: googleAds.signupConversionLabel,
      googleAdsId: googleAds.googleAdsId,
      options: {
        ...(user.email && { user_data: { email: user.email } }),
        ...(gclid && { gclid }),
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Google Ads] Tracked signup conversion for:', user.email);
    }
  }

  // Purchase conversions — deduplicate with in-memory Set to prevent double-fire
  const unreported = (data.unreportedPurchases ?? []).filter(
    (r) => !reportedIds.has(r.transactionId)
  );

  if (googleAds.purchaseConversionLabel && unreported.length > 0) {
    if (user.email) {
      setUserData({ email: user.email });
    }

    const transactionIds: string[] = [];

    for (const report of unreported) {
      trackConversion({
        label: googleAds.purchaseConversionLabel,
        googleAdsId: googleAds.googleAdsId,
        options: {
          value: report.value,
          currency: report.currency,
          transaction_id: report.transactionId,
          ...(user.email && { user_data: { email: user.email } }),
          ...(gclid && { gclid }),
        },
      });

      reportedIds.add(report.transactionId);
      transactionIds.push(report.transactionId);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Google Ads] Tracked purchase conversion:', report);
      }
    }

    // Mark as reported in DB
    markConversionReportedAction({ transactionIds }).catch((err) => {
      console.error('[Google Ads] Failed to mark purchases reported:', err);
    });
  }
}
