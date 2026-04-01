import Image from 'next/image';

interface LogoCloudContent {
  title: string;
}

interface LogoCloudSectionProps {
  content: LogoCloudContent;
}

const logos = [
  { src: '/icons/seedance.png', alt: 'SeeDance', height: 28 },
  { src: '/icons/veo.png', alt: 'Veo', height: 24 },
  { src: '/icons/wan.png', alt: 'Wan', height: 24 },
  { src: '/icons/banana.png', alt: 'Banana', height: 24 },
  { src: '/icons/hailuo.png', alt: 'Hailuo AI', height: 24 },
  { src: '/icons/kling.png', alt: 'Kling', height: 24 },
  { src: '/icons/flux.png', alt: 'Flux', height: 24 },
  { src: '/icons/pixverse.png', alt: 'PixVerse', height: 24 },
  { src: '/icons/ltx.png', alt: 'LTX', height: 24 },
];

export default function LogoCloudSection({ content }: LogoCloudSectionProps) {
  return (
    <section id="logo-cloud" className="bg-muted/50 px-4 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-xl font-medium">{content.title}</h2>

        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16 sm:gap-y-10">
          {logos.map((logo) => (
            <Image
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              width={120}
              height={logo.height}
              className="h-6 w-auto object-contain sm:h-7"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
