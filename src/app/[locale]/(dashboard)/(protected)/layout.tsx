import { getSession } from '@/lib/server';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

/**
 * Protected layout for authenticated users
 *
 * SECURITY: This layout validates the session on the server for all protected pages.
 * The middleware only performs a fast cookie check for redirection; this is the
 * canonical server-side validation point that ensures the session is valid.
 */
export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const session = await getSession();
  if (!session?.user) {
    redirect('/?loginRequired=true');
  }

  return children;
}
