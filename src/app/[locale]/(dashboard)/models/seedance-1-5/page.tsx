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
  const t = await getTranslations({ locale, namespace: 'Seedance15Page' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '/models/seedance-1-5',
  });
}

export default async function Seedance15Page() {
  const t = await getTranslations('Seedance15Page');

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
            <BreadcrumbPage>Seedance 1.5</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Generator defaultModelId="seedance-1-5" />

      <HeroMini content={t.raw('hero')} />

      <FeaturesShowcase
        content={t.raw('features')}
        media={{
          'item-1': {
            video: assetUrl('/sample/seedance-1.5-1.mp4'),
          },
          'item-2': {
            video: assetUrl('/sample/seedance-1.5-2.mp4'),
          },
          'item-3': {
            video: assetUrl('/sample/seedance-1.5-3.mp4'),
          },
          'item-4': {
            video: assetUrl('/sample/seedance-1.5-4.mp4'),
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
