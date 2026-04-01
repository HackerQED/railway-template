import { HeaderSection } from '@/components/layout/header-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
};

interface TestimonialsContent {
  title: string;
  subtitle: string;
  items: {
    'item-1': Testimonial;
    'item-2': Testimonial;
    'item-3': Testimonial;
    'item-4': Testimonial;
    'item-5': Testimonial;
    'item-6': Testimonial;
    'item-7': Testimonial;
    'item-8': Testimonial;
    'item-9': Testimonial;
    'item-10': Testimonial;
    'item-11': Testimonial;
    'item-12': Testimonial;
  };
}

interface TestimonialsSectionProps {
  content: TestimonialsContent;
}

const chunkArray = (
  array: Testimonial[],
  chunkSize: number
): Testimonial[][] => {
  const result: Testimonial[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

export default function TestimonialsSection({
  content,
}: TestimonialsSectionProps) {
  const testimonials: Testimonial[] = Object.values(content.items).filter(
    Boolean
  );

  const testimonialChunks = chunkArray(
    testimonials,
    Math.ceil(testimonials.length / 3)
  );

  return (
    <section id="testimonials" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <HeaderSection
          title={content.title}
          titleAs="h2"
          subtitle={content.subtitle}
          subtitleAs="p"
        />

        <div className="mt-8 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-3">
          {testimonialChunks.map((chunk, chunkIndex) => (
            <div key={chunkIndex} className="space-y-3">
              {chunk.map(({ name, role, quote, image }, index) => (
                <Card
                  key={index}
                  className="shadow-none bg-transparent hover:bg-accent dark:hover:bg-card"
                >
                  <CardContent className="grid grid-cols-[auto_1fr] gap-3 pt-4">
                    <Avatar className="size-9 border-2 border-gray-200">
                      <AvatarImage
                        alt={name}
                        src={image}
                        loading="lazy"
                        width="120"
                        height="120"
                      />
                      <AvatarFallback />
                    </Avatar>

                    <div>
                      <h3 className="font-medium">{name}</h3>

                      <span className="text-muted-foreground block text-sm tracking-wide">
                        {role}
                      </span>

                      <blockquote className="mt-3">
                        <p className="text-gray-700 dark:text-gray-300">
                          {quote}
                        </p>
                      </blockquote>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
