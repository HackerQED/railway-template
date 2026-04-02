import { HeroTitle } from '@/components/blocks/hero/hero-title';
import { HeroVideoBg } from '@/components/blocks/hero/hero-video-bg';
import { AnimatedGroup } from '@/components/tailark/motion/animated-group';
import { Button } from '@/components/ui/button';
import { storageUrl } from '@/config/storage';
import { Sparkles } from 'lucide-react';

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

interface ComparisonItem {
  bad: string;
  good: string;
}

interface HeroContent {
  introduction: string;
  titlePrefix: string;
  titleFlipWords: string[];
  titleSuffix: string;
  comparison?: {
    items: ComparisonItem[];
  };
}

interface HeroSectionProps {
  content: HeroContent;
}

export default function HeroSection({ content }: HeroSectionProps) {
  return (
    <>
      <main id="hero" className="-mt-[72px]">
        <section>
          <HeroVideoBg
            videoUrl={storageUrl('/sample/hero.mp4')}
            posterUrl={storageUrl('/sample/hero-poster.jpg')}
            className="pt-24 pb-16"
          >
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0 w-full">
                {/* introduction */}
                <AnimatedGroup variants={transitionVariants}>
                  <div className="mx-auto flex w-fit items-center rounded-full border border-primary/50 bg-primary/10 px-5 py-1.5 shadow-sm shadow-primary/20">
                    <span className="text-foreground font-medium text-base">
                      {content.introduction}
                    </span>
                  </div>
                </AnimatedGroup>

                {/* title with sparkles */}
                <HeroTitle
                  prefix={content.titlePrefix}
                  flipWords={content.titleFlipWords}
                  suffix={content.titleSuffix}
                />

                {/* VS comparison card */}
                {content.comparison && (
                  <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-black/30 px-8 py-6 backdrop-blur-xl">
                    <span className="mb-4 inline-block rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                      What We Exclusively Provide
                    </span>
                    <AnimatedGroup
                      variants={{
                        container: {
                          visible: {
                            transition: {
                              staggerChildren: 0.1,
                              delayChildren: 0.5,
                            },
                          },
                        },
                        ...transitionVariants,
                      }}
                      className="space-y-3"
                    >
                      {content.comparison.items.map((item) => (
                        <div
                          key={item.bad}
                          className="flex items-center justify-center gap-4 text-base sm:text-lg"
                        >
                          <span className="text-red-400/80 line-through decoration-red-400/60">
                            {item.bad}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-semibold text-green-400">
                            {item.good}
                          </span>
                        </div>
                      ))}
                    </AnimatedGroup>

                    {/* CTA buttons */}
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <a href="#generator">
                        <Button size="lg" className="gap-2 rounded-full px-8">
                          <Sparkles className="size-4" />
                          Try Now
                        </Button>
                      </a>
                      <a href="/pricing">
                        <Button
                          variant="outline"
                          size="lg"
                          className="rounded-full px-8"
                        >
                          View Pricing
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </HeroVideoBg>
        </section>
      </main>
    </>
  );
}
