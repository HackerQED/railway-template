import FaqSection from '@/components/blocks/faqs/faqs';
import FeaturesShowcase from '@/components/blocks/features/features-showcase';
import HeroMini from '@/components/blocks/hero/hero-mini';
import HowItWorks from '@/components/blocks/how-it-works/how-it-works';
import PricingSection from '@/components/blocks/pricing/pricing';
import WhyChooseSection from '@/components/blocks/why-choose/why-choose';
import { Generator } from '@/components/generator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { assetUrl } from '@/lib/assets';
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
  const t = await getTranslations({ locale, namespace: 'SeedreamPage' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '/models/seedream-4-5',
  });
}

export default async function SeedreamPage() {
  const t = await getTranslations('SeedreamPage');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/models">Models</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Seedream 4.5</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Generator defaultModelId="seedream-4-5" />

      <HeroMini content={t.raw('hero')} />

      <FeaturesShowcase
        content={t.raw('features')}
        media={{
          'item-1': {
            image: assetUrl('/sample/seedream4.5-1.png'),
          },
          'item-2': {
            image: assetUrl('/sample/seedream4.5-2.png'),
          },
          'item-3': {
            image: assetUrl('/sample/seedream4.5-3.png'),
          },
          'item-4': {
            image: assetUrl('/sample/seedream4.5-4.png'),
          },
        }}
      />

      <HowItWorks content={t.raw('howItWorks')} />

      <WhyChooseSection content={t.raw('whyChoose')} />

      <PricingSection content={t.raw('pricing')} />

      <FaqSection content={t.raw('faqs')} />
    </div>
  );
}
