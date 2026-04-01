'use client';

import type { CreditPackage } from '@/credits/types';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * Get credit packages with translations for client components
 *
 * NOTICE: This function should only be used in client components.
 * If you need to get the credit packages in server components, use getAllCreditPackages instead.
 * Use this function when showing the credit packages to the user.
 *
 * docs:
 * https://mksaas.com/docs/config/credits
 *
 * @returns The credit packages with translated content
 */
export function useCreditPackages(): Record<string, CreditPackage> {
  const t = useTranslations('CreditPackages');
  const creditConfig = websiteConfig.credits;
  const packages: Record<string, CreditPackage> = {};
  const translate = (key: string) => {
    try {
      return t(key as never);
    } catch {
      return undefined;
    }
  };

  // Add translated content to each package
  Object.entries(creditConfig.packages || {}).forEach(([key, pkg]) => {
    if (!pkg) return;
    const nameKey = `${key}.name`;
    const descriptionKey = `${key}.description`;
    packages[key] = {
      ...pkg,
      name: translate(nameKey) ?? pkg.name,
      description: translate(descriptionKey) ?? pkg.description,
    };
  });

  return packages;
}
