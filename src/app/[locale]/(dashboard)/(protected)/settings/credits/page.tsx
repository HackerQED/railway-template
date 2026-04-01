import CreditsPageClient from '@/components/settings/credits/credits-page-client';
import { websiteConfig } from '@/config/website';
import { constructMetadata } from '@/lib/metadata';
import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

export const metadata = constructMetadata({
  title: 'Plan & Credits - yino.ai',
  description:
    'Manage your subscription plan, credit balance, and transactions.',
  noIndex: true,
});

/**
 * Credits page, show credit balance and transactions
 */
export default function CreditsPage() {
  // If credits are disabled, redirect to billing page
  if (!websiteConfig.credits.enableCredits) {
    redirect(Routes.DashboardEntry);
  }

  return <CreditsPageClient />;
}
