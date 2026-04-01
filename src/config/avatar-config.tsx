'use client';

import { Routes } from '@/routes';
import type { MenuItem } from '@/types';
import { CoinsIcon, CreditCardIcon, LayoutDashboardIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * Get avatar config with translations
 *
 * NOTICE: used in client components only
 *
 * docs:
 * https://mksaas.com/docs/config/avatar
 *
 * @returns The avatar config with translated titles
 */
export function useAvatarLinks(): MenuItem[] {
  const t = useTranslations('Marketing.avatar');

  return [
    {
      title: t('dashboard'),
      href: Routes.DashboardEntry,
      icon: <LayoutDashboardIcon className="size-4 shrink-0" />,
    },
    {
      title: t('purchaseCredits'),
      href: Routes.Pricing,
      icon: <CreditCardIcon className="size-4 shrink-0" />,
    },
    ...(websiteConfig.credits.enableCredits
      ? [
          {
            title: t('creditHistory'),
            href: Routes.SettingsCredits,
            icon: <CoinsIcon className="size-4 shrink-0" />,
          },
        ]
      : []),
  ];
}
