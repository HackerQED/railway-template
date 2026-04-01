import { cn } from '@/lib/utils';

interface FeatureItem {
  title: string;
  description: string;
  bulletPoints?: string[];
  image?: string;
  video?: string;
}

interface FeaturesShowcaseContent {
  title: string;
  subtitle: string;
  items: {
    [key: string]: FeatureItem;
  };
}

interface FeaturesShowcaseProps {
  content: FeaturesShowcaseContent;
  media?: Record<string, { video?: string; image?: string }>;
}

export default function FeaturesShowcase({
  content,
  media,
}: FeaturesShowcaseProps) {
  const items = Object.entries(content.items).map(([key, item]) => ({
    ...item,
    ...(media?.[key] ?? {}),
  }));

  return (
    <section id="features" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground">
            {content.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {content.subtitle}
          </p>
        </div>

        {/* Feature Items */}
        <div className="space-y-20">
          {items.map((item, index) => (
            <div
              key={item.title}
              className={cn(
                'grid items-center gap-8 md:grid-cols-2 md:gap-12',
                index % 2 === 1 && 'md:grid-flow-dense'
              )}
            >
              {/* Media */}
              <div
                className={cn(
                  'relative flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted/30',
                  index % 2 === 1 && 'md:col-start-2'
                )}
              >
                {item.video ? (
                  <video
                    src={item.video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="size-full rounded-2xl object-cover"
                  />
                ) : item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="size-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex size-full min-h-[300px] items-center justify-center text-muted-foreground">
                    <span className="text-sm">Media placeholder</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col space-y-4">
                <h3 className="text-2xl font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-lg text-muted-foreground">
                  {item.description}
                </p>
                {item.bulletPoints && item.bulletPoints.length > 0 && (
                  <ul className="space-y-2 pt-2">
                    {item.bulletPoints.map((point) => (
                      <li
                        key={point}
                        className="flex items-center space-x-2 text-muted-foreground"
                      >
                        <span className="text-primary">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
