import { HeaderSection } from '@/components/layout/header-section';
import {
  AudioWaveformIcon,
  DownloadIcon,
  LayoutGridIcon,
  MonitorPlayIcon,
  PaletteIcon,
  ShareIcon,
} from 'lucide-react';

/**
 * https://nsui.irung.me/features
 * pnpm dlx shadcn@canary add https://nsui.irung.me/r/features-4.json
 */
interface Features3Content {
  title: string;
  subtitle: string;
  description: string;
  items: {
    'item-1': { title: string; description: string };
    'item-2': { title: string; description: string };
    'item-3': { title: string; description: string };
    'item-4': { title: string; description: string };
    'item-5': { title: string; description: string };
    'item-6': { title: string; description: string };
  };
}

interface Features3SectionProps {
  content: Features3Content;
}

export default function Features3Section({ content }: Features3SectionProps) {
  return (
    <section id="features3" className="px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-8 lg:space-y-20">
        <HeaderSection
          title={content.title}
          subtitle={content.subtitle}
          subtitleAs="h2"
          description={content.description}
          descriptionAs="p"
        />

        <div className="relative mx-auto grid divide-x divide-y border *:p-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AudioWaveformIcon className="size-4" />
              <h3 className="text-base font-medium">
                {content.items['item-1'].title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {content.items['item-1'].description}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LayoutGridIcon className="size-4" />
              <h3 className="text-base font-medium">
                {content.items['item-2'].title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {content.items['item-2'].description}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PaletteIcon className="size-4" />

              <h3 className="text-base font-medium">
                {content.items['item-3'].title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {content.items['item-3'].description}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MonitorPlayIcon className="size-4" />

              <h3 className="text-base font-medium">
                {content.items['item-4'].title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {content.items['item-4'].description}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DownloadIcon className="size-4" />

              <h3 className="text-base font-medium">
                {content.items['item-5'].title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {content.items['item-5'].description}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShareIcon className="size-4" />

              <h3 className="text-base font-medium">
                {content.items['item-6'].title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {content.items['item-6'].description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
