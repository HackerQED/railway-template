import { HeaderSection } from '@/components/layout/header-section';
import { PricingTable } from '@/components/pricing/pricing-table';

interface PricingContent {
  subtitle: string;
  description: string;
}

interface PricingSectionProps {
  content: PricingContent;
}

export default function PricingSection({ content }: PricingSectionProps) {
  return (
    <section id="pricing" className="px-4 py-16">
      <div className="mx-auto max-w-6xl px-6 space-y-16">
        <HeaderSection
          subtitle={content.subtitle}
          subtitleAs="h2"
          subtitleClassName="text-4xl font-bold"
          description={content.description}
          descriptionAs="p"
        />

        <PricingTable />
      </div>
    </section>
  );
}
