'use client';

import Script from 'next/script';

/**
 * Google Ads Tag - loads gtag.js with Google Ads ID (AW-xxx)
 *
 * This is separate from Google Analytics (G-xxx).
 * Only loads in production when NEXT_PUBLIC_GOOGLE_ADS_ID is set.
 */
export default function GoogleAdsTag() {
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (!googleAdsId) {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
      />
      <Script id="google-ads-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAdsId}');
        `}
      </Script>
    </>
  );
}
