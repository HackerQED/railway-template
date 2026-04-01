import FaqSection from '@/components/blocks/faqs/faqs';
import WhyChooseSection from '@/components/blocks/why-choose/why-choose';
import Container from '@/components/layout/container';
import { PricingTable } from '@/components/pricing/pricing-table';
import { getTranslations } from 'next-intl/server';

export default async function PricingPage() {
  const t = await getTranslations('PricingPage');

  return (
    <Container className="mt-8 max-w-6xl px-4 flex flex-col gap-16">
      <PricingTable />

      <WhyChooseSection content={t.raw('whyChoose')} />

      <FaqSection content={t.raw('faqs')} />
    </Container>
  );
}
