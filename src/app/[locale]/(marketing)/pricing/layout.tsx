import { BackgroundLines } from '@/components/ui/background-lines';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const pt = await getTranslations({ locale, namespace: 'PricingPage' });
  return constructMetadata({
    title: pt('title'),
    description: pt('description'),
    locale,
    pathname: '/pricing',
  });
}

export default async function PricingPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('PricingPage');
  return (
    <BackgroundLines className="mb-16">
      <div className="mt-8 w-full flex flex-col items-center justify-center gap-8">
        {/* Header */}
        <div className="space-y-4 flex flex-col items-center">
          <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            {t('certifiedPartnerBadge')}
          </span>
          <h1 className="text-center text-3xl font-bold tracking-tight">
            {t('subtitle')}
          </h1>
          <h2 className="text-center text-lg text-muted-foreground">
            {t('subheadline')}
          </h2>
        </div>
      </div>

      {children}
    </BackgroundLines>
  );
}
