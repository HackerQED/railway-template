import { HeaderSection } from '@/components/layout/header-section';

interface StatsContent {
  title: string;
  subtitle: string;
  description: string;
  items: {
    'item-1': { title: string };
    'item-2': { title: string };
    'item-3': { title: string };
  };
}

interface StatsSectionProps {
  content: StatsContent;
}

export default function StatsSection({ content }: StatsSectionProps) {
  return (
    <section id="stats" className="px-4 py-16">
      <div className="mx-auto max-w-5xl px-6 space-y-8 md:space-y-16">
        <HeaderSection
          title={content.title}
          subtitle={content.subtitle}
          subtitleAs="h2"
          description={content.description}
          descriptionAs="p"
        />

        <div className="grid gap-12 divide-y-0 *:text-center md:grid-cols-3 md:gap-2 md:divide-x">
          <div className="space-y-4">
            <div className="text-5xl font-bold text-primary">10,000+</div>
            <p>{content.items['item-1'].title}</p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl font-bold text-primary">50,000+</div>
            <p>{content.items['item-2'].title}</p>
          </div>
          <div className="space-y-4">
            <div className="text-5xl font-bold text-primary">2,000+</div>
            <p>{content.items['item-3'].title}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
