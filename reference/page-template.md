# Model Page Template

生成新模型页面时参考此格式和结构，内容必须独特。

## page.tsx 结构

```tsx
import FaqSection from '@/components/blocks/faqs/faqs';
import FeaturesShowcase from '@/components/blocks/features/features-showcase';
import HeroMini from '@/components/blocks/hero/hero-mini';
import HowItWorks from '@/components/blocks/how-it-works/how-it-works';
import PricingSection from '@/components/blocks/pricing/pricing';
import WhyChooseSection from '@/components/blocks/why-choose/why-choose';
import { Generator } from '@/components/generator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: '{PageNamespace}' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '/models/{model-slug}',
  });
}

export default async function {ModelName}Page() {
  const t = await getTranslations('{PageNamespace}');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/models">Models</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{Model Display Name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Generator defaultModelId="{model-id}" />

      <HeroMini content={t.raw('hero')} />

      <FeaturesShowcase
        content={t.raw('features')}
        media={{
          'item-1': { video: assetUrl('/sample/{slug}-1.mp4') },
          'item-2': { video: assetUrl('/sample/{slug}-2.mp4') },
          'item-3': { video: assetUrl('/sample/{slug}-3.mp4') },
          'item-4': { video: assetUrl('/sample/{slug}-4.mp4') },
        }}
      />

      <HowItWorks content={t.raw('howItWorks')} />

      <WhyChooseSection content={t.raw('whyChoose')} />

      <PricingSection content={t.raw('pricing')} />

      <FaqSection content={t.raw('faqs')} />
    </div>
  );
}
```

## JSON 结构 (messages/en/{PageNamespace}.json)

```json
{
  "title": "SEO title with primary keyword | Railway Template",
  "description": "Meta description, 150-160 chars",
  "hero": {
    "title": "Page heading with primary keyword",
    "description": "1-2 sentences summarizing model capability"
  },
  "features": {
    "title": "Section title (unique per model)",
    "subtitle": "One line subtitle",
    "items": {
      "item-1": { "title": "...", "description": "40-60 words" },
      "item-2": { "title": "...", "description": "40-60 words" },
      "item-3": { "title": "...", "description": "40-60 words" },
      "item-4": { "title": "...", "description": "40-60 words" }
    }
  },
  "howItWorks": {
    "title": "How to ... (specific to model)",
    "subtitle": "One line",
    "steps": {
      "step-1": { "title": "...", "description": "40-60 words" },
      "step-2": { "title": "...", "description": "40-60 words" },
      "step-3": { "title": "...", "description": "40-60 words" }
    }
  },
  "whyChoose": {
    "title": "Why Choose ...",
    "items": {
      "item-1": { "title": "...", "description": "30-50 words" },
      "item-2": { "title": "...", "description": "30-50 words" },
      "item-3": { "title": "...", "description": "30-50 words" },
      "item-4": { "title": "...", "description": "30-50 words" },
      "item-5": { "title": "...", "description": "30-50 words" },
      "item-6": { "title": "...", "description": "30-50 words" }
    }
  },
  "pricing": { "title": "Pricing", "subtitle": "..." },
  "faqs": {
    "title": "Frequently Asked Questions",
    "items": {
      "item-1": { "question": "...", "answer": "..." },
      "item-2": { "question": "...", "answer": "..." },
      "item-3": { "question": "...", "answer": "..." },
      "item-4": { "question": "...", "answer": "..." },
      "item-5": { "question": "...", "answer": "..." },
      "item-6": { "question": "...", "answer": "..." }
    }
  }
}
```

## 注意事项

- 图片模型用 `{ image: '...' }` 代替 `{ video: '...' }`
- `media` 对象的 key 必须与 `items` 的 key 对应
- Namespace 命名：`{ModelName}Page`（如 `SeedancePage`、`VeoPage`）
- JSON 文件路径：`messages/en/{Namespace}.json`
- page.tsx 路径：`src/app/[locale]/(dashboard)/models/{model-slug}/page.tsx`
