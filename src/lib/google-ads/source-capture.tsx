'use client';

import { useEffect } from 'react';

interface SourceData {
  utmSource: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  landingPage: string | null;
  gclid: string | null;
  capturedAt: string;
}

const SOURCE_STORAGE_KEY = 'google_ads_source_data';

/**
 * Captures GCLID and UTM parameters from URL on first visit.
 * Stores in localStorage to preserve original attribution.
 * Should be placed in root layout.
 */
export default function SourceCapture() {
  useEffect(() => {
    captureSourceData();
  }, []);

  return null;
}

function captureSourceData(): void {
  if (
    typeof window === 'undefined' ||
    localStorage.getItem(SOURCE_STORAGE_KEY)
  ) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const landingPage =
    window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  const sourceData: SourceData = {
    utmSource: urlParams.get('utm_source'),
    utmCampaign: urlParams.get('utm_campaign'),
    referrer: document.referrer || null,
    landingPage,
    gclid: urlParams.get('gclid'),
    capturedAt: new Date().toISOString(),
  };

  if (
    sourceData.utmSource ||
    sourceData.utmCampaign ||
    sourceData.referrer ||
    sourceData.gclid ||
    sourceData.landingPage
  ) {
    localStorage.setItem(SOURCE_STORAGE_KEY, JSON.stringify(sourceData));

    if (process.env.NODE_ENV === 'development') {
      console.log('[Google Ads] Captured source data:', sourceData);
    }
  }
}

export function getStoredSourceData(): SourceData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(SOURCE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}
