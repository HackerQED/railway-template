import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import FeaturesShowcase from '@/components/blocks/features/features-showcase';
import HeroSection from '@/components/blocks/hero/hero';
import HowItWorks from '@/components/blocks/how-it-works/how-it-works';
import LogoCloudSection from '@/components/blocks/logo-cloud/logo-cloud';
import PricingSection from '@/components/blocks/pricing/pricing';
import WhyChooseSection from '@/components/blocks/why-choose/why-choose';
import { HomeGenerator } from '@/components/home-generator';
import CrispChat from '@/components/layout/crisp-chat';
import { storageUrl } from '@/config/storage';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

/**
 * https://next-intl.dev/docs/environments/actions-metadata-route-handlers#metadata-api
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '',
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function HomePage(props: HomePageProps) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations('HomePage');

  return (
    <>
      <div className="flex flex-col">
        <HeroSection content={t.raw('hero')} />

        <HomeGenerator />

        <FeaturesShowcase
          content={t.raw('features')}
          media={{
            'item-1': {
              video: storageUrl('/sample/seedance-2-1.mp4'),
            },
            'item-2': { video: storageUrl('/sample/seedance-2-2.mp4') },
            'item-3': {
              video: storageUrl('/sample/seedance-2-3.mp4'),
            },
          }}
        />

        <LogoCloudSection content={t.raw('logocloud')} />

        <HowItWorks content={t.raw('howItWorks')} />

        <WhyChooseSection content={t.raw('whyChoose')} />

        <PricingSection content={t.raw('pricing')} />

        <FaqSection content={t.raw('faqs')} />

        <CallToActionSection content={t.raw('calltoaction')} />

        <CrispChat />
      </div>
    </>
  );
}
