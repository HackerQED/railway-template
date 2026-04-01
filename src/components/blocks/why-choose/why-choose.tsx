interface WhyChooseItem {
  icon: string;
  title: string;
  description: string;
}

interface WhyChooseContent {
  title: string;
  items: {
    [key: string]: WhyChooseItem;
  };
}

interface WhyChooseSectionProps {
  content: WhyChooseContent;
}

export default function WhyChooseSection({ content }: WhyChooseSectionProps) {
  const items = Object.entries(content.items);

  return (
    <section id="why-choose" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground">
            {content.title}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map(([key, item]) => (
            <div key={key} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-3 text-3xl">{item.icon}</div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
