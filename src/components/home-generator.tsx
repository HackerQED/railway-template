'use client';

import { Generator } from '@/components/generator';

export function HomeGenerator() {
  return (
    <section id="generator" className="mx-auto w-full max-w-6xl px-4 py-8">
      <Generator defaultModelId="seedream-4-5" />
    </section>
  );
}
