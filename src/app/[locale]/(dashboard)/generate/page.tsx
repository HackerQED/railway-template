import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import FeaturesSection from '@/components/blocks/features/features';
import Features2Section from '@/components/blocks/features/features2';
import Features3Section from '@/components/blocks/features/features3';
import GenerateHeroSection from '@/components/blocks/hero/generate-hero';
import IntegrationSection from '@/components/blocks/integration/integration';
import Integration2Section from '@/components/blocks/integration/integration2';
import LogoCloud from '@/components/blocks/logo-cloud/logo-cloud';
import PricingSection from '@/components/blocks/pricing/pricing';
import SeoSection from '@/components/blocks/seo/seo';
import StatsSection from '@/components/blocks/stats/stats';
import TestimonialsSection from '@/components/blocks/testimonials/testimonials';
import CrispChat from '@/components/layout/crisp-chat';
import { NewsletterCard } from '@/components/newsletter/newsletter-card';
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
  const t = await getTranslations({ locale, namespace: 'GeneratePage' });

  return constructMetadata({
    title: t('metadata.title'),
    description: t('metadata.description'),
    locale,
    pathname: '/generate',
  });
}

interface GeneratePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function GeneratePage(props: GeneratePageProps) {
  await props.params;
  const t = await getTranslations('GeneratePage');

  return (
    <div className="flex flex-col">
      <GenerateHeroSection content={t.raw('hero')} />

      <LogoCloud content={t.raw('logocloud')} />

      <StatsSection content={t.raw('stats')} />

      <IntegrationSection content={t.raw('integration')} />

      <FeaturesSection content={t.raw('features')} />

      <Features2Section content={t.raw('features2')} />

      <Features3Section content={t.raw('features3')} />

      <SeoSection content={t.raw('seo')} />

      <Integration2Section content={t.raw('integration2')} />

      <PricingSection content={t.raw('pricing')} />

      <FaqSection content={t.raw('faqs')} />

      <CallToActionSection content={t.raw('calltoaction')} />

      <TestimonialsSection content={t.raw('testimonials')} />

      <NewsletterCard />

      <CrispChat />
    </div>
  );
}
