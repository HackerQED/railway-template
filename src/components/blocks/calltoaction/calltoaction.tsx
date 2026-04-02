import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';

interface CallToActionContent {
  title: string;
  description: string;
  primaryButton: string;
  secondaryButton: string;
}

interface CallToActionSectionProps {
  content: CallToActionContent;
}

export default function CallToActionSection({
  content,
}: CallToActionSectionProps) {
  return (
    <section id="call-to-action" className="px-4 py-24 bg-muted/50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            {content.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{content.description}</p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <LocaleLink href="/models/seedream-4-5">
                <span>{content.primaryButton}</span>
              </LocaleLink>
            </Button>

            <Button asChild size="lg" variant="outline">
              <LocaleLink href="/pricing">
                <span>{content.secondaryButton}</span>
              </LocaleLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
