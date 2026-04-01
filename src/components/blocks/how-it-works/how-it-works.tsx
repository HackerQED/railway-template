interface StepItem {
  title: string;
  description: string;
}

interface HowItWorksContent {
  title: string;
  subtitle: string;
  steps: {
    [key: string]: StepItem;
  };
}

interface HowItWorksProps {
  content: HowItWorksContent;
}

export default function HowItWorks({ content }: HowItWorksProps) {
  const steps = Object.values(content.steps);

  return (
    <section id="how-it-works" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground">
            {content.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {content.subtitle}
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-start space-y-4"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
