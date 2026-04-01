'use client';

import { ModelIcon } from '@/components/model-icon';
import { MODELS } from '@/config/models';
import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { HistoryIcon, SettingsIcon } from 'lucide-react';

/**
 * Sidebar navigation configuration.
 * Model entries are dynamically generated from src/config/models.ts.
 */
export function useSidebarLinks(): NestedMenuItem[] {
  const links: NestedMenuItem[] = [];

  // AI Models — grouped by category, deduplicated by slug (channels share a page)
  const seen = new Set<string>();
  const deduped = MODELS.filter((m) => {
    if (seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  });

  const videoModels = deduped.filter((m) => m.category === 'video');
  const imageModels = deduped.filter((m) => m.category === 'image');

  const toItems = (models: typeof MODELS) =>
    models.map((m) => ({
      title: m.name,
      icon: <ModelIcon src={m.icon} name={m.name} />,
      href: `/models/${m.slug}`,
      external: false,
      ...(m.featured ? { badge: '⭐ NEW' } : {}),
    }));

  if (videoModels.length > 0) {
    links.push({ title: 'AI VIDEO', items: toItems(videoModels) });
  }
  if (imageModels.length > 0) {
    links.push({ title: 'AI IMAGE', items: toItems(imageModels) });
  }

  // Spacer
  links.push({ type: 'spacer' });

  // Dashboard group
  links.push({
    title: 'WORKSPACE',
    items: [
      {
        title: 'Creation History',
        icon: <HistoryIcon className="size-4 shrink-0" />,
        href: Routes.Generations,
        external: false,
      },
    ],
  });

  // Settings group
  links.push({
    title: 'SETTINGS',
    items: [
      {
        title: 'Plan & Credits',
        icon: <SettingsIcon className="size-4 shrink-0" />,
        href: Routes.SettingsCredits,
        external: false,
      },
    ],
  });

  return links;
}
