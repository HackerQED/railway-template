'use client';

import Script from 'next/script';

/**
 * Plausible Analytics
 *
 * Supports both legacy (data-domain) and new (site-specific script URL) formats.
 *
 * https://plausible.io
 * https://mksaas.com/docs/analytics#plausible
 */
export function PlausibleAnalytics() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const script = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT as string;
  if (!script) {
    return null;
  }

  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN as string;

  return (
    <>
      <Script
        async
        type="text/javascript"
        src={script}
        {...(domain ? { 'data-domain': domain } : {})}
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
      </Script>
    </>
  );
}
