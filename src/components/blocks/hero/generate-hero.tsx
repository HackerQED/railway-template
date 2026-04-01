import { Ripple } from '@/components/magicui/ripple';
import { AnimatedGroup } from '@/components/tailark/motion/animated-group';
import { TextEffect } from '@/components/tailark/motion/text-effect';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      y: 12,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

interface GenerateHeroContent {
  introduction: string;
  title: string;
  description: string;
  primary: string;
  secondary: string;
  tool: {
    title: string;
    subtitle: string;
    status: string;
    inputLabel: string;
    inputPlaceholder: string;
    outputLabel: string;
    outputPlaceholder: string;
    options: {
      tone: string;
      length: string;
      format: string;
    };
  };
}

interface GenerateHeroSectionProps {
  content: GenerateHeroContent;
}

const links = {
  introduction: 'https://x.com/mksaascom',
  primary: '/#pricing',
  secondary: 'https://demo.mksaas.com',
};

export default function GenerateHeroSection({
  content,
}: GenerateHeroSectionProps) {
  return (
    <main id="hero" className="overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
      >
        <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>

      <section>
        <div className="relative pt-12">
          <div className="mx-auto max-w-7xl px-6">
            <Ripple />

            <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0 lg:text-left">
                <AnimatedGroup variants={transitionVariants}>
                  <LocaleLink
                    href={links.introduction}
                    className="hover:bg-accent group mx-auto flex w-fit items-center gap-2 rounded-full border p-1 pl-4 lg:mx-0"
                  >
                    <span className="text-foreground text-sm">
                      {content.introduction}
                    </span>

                    <div className="size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </LocaleLink>
                </AnimatedGroup>

                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 text-balance text-4xl font-bricolage-grotesque lg:mt-16 lg:text-5xl"
                >
                  {content.title}
                </TextEffect>

                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground lg:mx-0"
                >
                  {content.description}
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-row items-center justify-center gap-4 lg:justify-start"
                >
                  <div
                    key={1}
                    className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-5 text-base"
                    >
                      <LocaleLink href={links.primary}>
                        <span className="text-nowrap">{content.primary}</span>
                      </LocaleLink>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-10.5 rounded-xl px-5"
                  >
                    <LocaleLink href={links.secondary}>
                      <span className="text-nowrap">{content.secondary}</span>
                    </LocaleLink>
                  </Button>
                </AnimatedGroup>
              </div>

              <div className="rounded-3xl border bg-background/80 p-6 shadow-lg shadow-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {content.tool.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {content.tool.subtitle}
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                    {content.tool.status}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {content.tool.inputLabel}
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    {content.tool.inputPlaceholder}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                      {content.tool.options.tone}
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                      {content.tool.options.length}
                    </div>
                    <div className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                      {content.tool.options.format}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {content.tool.outputLabel}
                  </p>
                  <p className="mt-3 text-sm text-foreground">
                    {content.tool.outputPlaceholder}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
