import ApiKeysPageClient from '@/components/settings/api-keys/api-keys-page-client';
import { constructMetadata } from '@/lib/metadata';

export const metadata = constructMetadata({
  title: 'API Keys - yino.ai',
  description: 'Manage your API keys for programmatic access.',
  noIndex: true,
});

export default function ApiKeysPage() {
  return <ApiKeysPageClient />;
}
