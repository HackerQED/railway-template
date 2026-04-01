import { HeaderSection } from '@/components/layout/header-section';

interface SeoItem {
  title: string;
  description: string;
}

interface SeoContent {
  title: string;
  subtitle: string;
  description: string;
  items: SeoItem[];
}

interface SeoSectionProps {
  content: SeoContent;
}

export default function SeoSection({ content }: SeoSectionProps) {
  return (
    <section id="seo" className="px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <HeaderSection
          title={content.title}
          subtitle={content.subtitle}
          subtitleAs="h2"
          description={content.description}
          descriptionAs="p"
        />

        <div className="grid gap-4 md:grid-cols-3">
          {content.items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border bg-muted/30 p-6 text-left"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
