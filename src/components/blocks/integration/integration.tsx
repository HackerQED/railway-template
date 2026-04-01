import { HeaderSection } from '@/components/layout/header-section';
import {
  Gemini,
  GooglePaLM,
  MagicUI,
  MediaWiki,
  Replit,
  VSCodium,
} from '@/components/tailark/logos';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LocaleLink } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import type * as React from 'react';

interface IntegrationContent {
  title: string;
  subtitle: string;
  description: string;
  learnMore: string;
  items: {
    'item-1': { title: string; description: string };
    'item-2': { title: string; description: string };
    'item-3': { title: string; description: string };
    'item-4': { title: string; description: string };
    'item-5': { title: string; description: string };
    'item-6': { title: string; description: string };
  };
}

interface IntegrationSectionProps {
  content: IntegrationContent;
}

export default function IntegrationSection({
  content,
}: IntegrationSectionProps) {
  return (
    <section id="integration" className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <HeaderSection
          title={content.title}
          subtitle={content.subtitle}
          description={content.description}
          subtitleAs="h2"
          descriptionAs="p"
        />

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard
            title={content.items['item-1'].title}
            description={content.items['item-1'].description}
            learnMore={content.learnMore}
          >
            <Gemini />
          </IntegrationCard>

          <IntegrationCard
            title={content.items['item-2'].title}
            description={content.items['item-2'].description}
            learnMore={content.learnMore}
          >
            <Replit />
          </IntegrationCard>

          <IntegrationCard
            title={content.items['item-3'].title}
            description={content.items['item-3'].description}
            learnMore={content.learnMore}
          >
            <MagicUI />
          </IntegrationCard>

          <IntegrationCard
            title={content.items['item-4'].title}
            description={content.items['item-4'].description}
            learnMore={content.learnMore}
          >
            <VSCodium />
          </IntegrationCard>

          <IntegrationCard
            title={content.items['item-5'].title}
            description={content.items['item-5'].description}
            learnMore={content.learnMore}
          >
            <MediaWiki />
          </IntegrationCard>

          <IntegrationCard
            title={content.items['item-6'].title}
            description={content.items['item-6'].description}
            learnMore={content.learnMore}
          >
            <GooglePaLM />
          </IntegrationCard>
        </div>
      </div>
    </section>
  );
}

const IntegrationCard = ({
  title,
  description,
  children,
  learnMore,
  link = '#',
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  learnMore: string;
  link?: string;
}) => {
  return (
    <Card className="p-6 bg-transparent hover:bg-accent dark:hover:bg-card">
      <div className="relative">
        <div className="*:size-10">{children}</div>

        <div className="space-y-2 py-6">
          <h3 className="text-base font-medium">{title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {description}
          </p>
        </div>

        <div className="flex gap-3 border-t border-dashed pt-6">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1 pr-2 shadow-none"
          >
            <LocaleLink href={link}>
              {learnMore}
              <ChevronRight className="ml-0 !size-3.5 opacity-50" />
            </LocaleLink>
          </Button>
        </div>
      </div>
    </Card>
  );
};
