'use client';

import { Generator } from '@/components/generator';
import { SeedanceBanner } from '@/components/generator/seedance-banner';

export function HomeGenerator() {
  return (
    <section id="generator" className="mx-auto w-full max-w-6xl px-4 py-8">
      <SeedanceBanner />
      <Generator defaultModelId="seedance-2-0-human" />
    </section>
  );
}
