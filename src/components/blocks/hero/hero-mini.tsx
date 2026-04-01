interface HeroMiniContent {
  title: string;
  description: string;
}

interface HeroMiniProps {
  content: HeroMiniContent;
}

export default function HeroMini({ content }: HeroMiniProps) {
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {content.description}
        </p>
      </div>
    </section>
  );
}
