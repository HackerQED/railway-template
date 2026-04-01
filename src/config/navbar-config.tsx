'use client';

import { ModelIcon } from '@/components/model-icon';
import { MODELS_MAP } from '@/config/models';
import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

/**
 * Get navbar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://mksaas.com/docs/config/navbar
 *
 * @returns The navbar config with translated titles and descriptions
 */
export function useNavbarLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');

  const seedance = MODELS_MAP.get('seedance-2-0-human');
  const seedance15 = MODELS_MAP.get('seedance-1-5');
  const veo = MODELS_MAP.get('veo-3-1');
  const seedream = MODELS_MAP.get('seedream-4-5');

  return [
    {
      title: t('aiVideo.title'),
      items: [
        ...(seedance
          ? [
              {
                title: t('aiVideo.items.seedance.title'),
                description: t('aiVideo.items.seedance.description'),
                icon: <ModelIcon src={seedance.icon} name={seedance.name} />,
                href: `/models/${seedance.slug}`,
                external: false,
              },
            ]
          : []),
        ...(seedance15
          ? [
              {
                title: t('aiVideo.items.seedance15.title'),
                description: t('aiVideo.items.seedance15.description'),
                icon: (
                  <ModelIcon src={seedance15.icon} name={seedance15.name} />
                ),
                href: `/models/${seedance15.slug}`,
                external: false,
              },
            ]
          : []),
        ...(veo
          ? [
              {
                title: t('aiVideo.items.veo.title'),
                description: t('aiVideo.items.veo.description'),
                icon: <ModelIcon src={veo.icon} name={veo.name} />,
                href: `/models/${veo.slug}`,
                external: false,
              },
            ]
          : []),
      ],
    },
    {
      title: t('aiImage.title'),
      items: [
        ...(seedream
          ? [
              {
                title: t('aiImage.items.seedream.title'),
                description: t('aiImage.items.seedream.description'),
                icon: <ModelIcon src={seedream.icon} name={seedream.name} />,
                href: `/models/${seedream.slug}`,
                external: false,
              },
            ]
          : []),
      ],
    },
    {
      title: t('pricing.title'),
      href: Routes.Pricing,
      external: false,
    },
  ];
}
