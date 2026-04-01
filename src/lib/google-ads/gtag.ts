'use client';

// Google Ads gtag type definitions
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'set' | 'consent' | 'config' | 'js',
      eventName: string | Date,
      // biome-ignore lint/suspicious/noExplicitAny: gtag params are dynamic
      params?: Record<string, any>
    ) => void;
  }
}

interface ConversionOptions {
  value?: number;
  currency?: string;
  transaction_id?: string;
  user_data?: {
    email: string;
  };
  gclid?: string;
}

const isDev = process.env.NODE_ENV === 'development';

export function trackConversion({
  label,
  googleAdsId,
  options,
}: {
  label: string;
  googleAdsId: string;
  options?: ConversionOptions;
}) {
  if (typeof window === 'undefined') return;

  const payload = {
    send_to: `${googleAdsId}/${label}`,
    ...options,
  };

  if (isDev) {
    console.log('[Google Ads] trackConversion:', payload);
  }

  if (window.gtag) {
    window.gtag('event', 'conversion', payload);
  }
}

export function setUserData(userData: { email: string }) {
  if (typeof window === 'undefined') return;

  if (isDev) {
    console.log('[Google Ads] setUserData:', userData);
  }

  if (window.gtag) {
    window.gtag('set', 'user_data', userData);
  }
}
