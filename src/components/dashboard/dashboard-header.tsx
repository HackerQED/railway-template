'use client';

import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { Logo } from '@/components/layout/logo';
import { UserButton } from '@/components/layout/user-button';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { CreditsBalanceButton } from '../layout/credits-balance-button';
import LocaleSwitcher from '../layout/locale-switcher';
import { Skeleton } from '../ui/skeleton';

interface DashboardHeaderProps {
  actions?: ReactNode;
}

/**
 * Dashboard header
 * - Mobile: solid header bar (logo left, actions right)
 * - Desktop: transparent floating actions (top-right only)
 */
export function DashboardHeader({ actions }: DashboardHeaderProps) {
  const t = useTranslations();
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user;
  const [mounted, setMounted] = useState(false);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  const userActions = (
    <>
      {actions}
      {!mounted || isPending ? (
        <Skeleton className="size-8 border rounded-full" />
      ) : currentUser ? (
        <>
          <CreditsBalanceButton userId={currentUser.id} className="" />
          <UserButton user={currentUser} />
        </>
      ) : (
        <GoogleLoginButton
          variant="default"
          size="sm"
          className="font-semibold"
        >
          {t('Common.login')}
        </GoogleLoginButton>
      )}
    </>
  );

  return (
    <>
      {/* Mobile: original solid header */}
      <header className="md:hidden sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur">
        <div className="flex w-full items-center gap-1 px-4">
          <LocaleLink href={Routes.Root} className="flex items-center gap-2">
            <Logo className="size-6" />
            <span className="text-xl font-semibold font-bricolage-grotesque">
              {t('Metadata.name')}
            </span>
          </LocaleLink>
          <div className="ml-auto flex items-center gap-3 pl-4">
            {userActions}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle Sidebar"
              onClick={toggleSidebar}
              className="flex aspect-square h-fit select-none items-center justify-center rounded-md cursor-pointer size-10"
            >
              <MenuIcon className="size-5" />
            </Button>
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      {/* Desktop: solid header bar */}
      <header className="hidden md:flex sticky top-0 z-30 h-(--header-height) shrink-0 items-center border-b bg-background/80 backdrop-blur">
        <div className="flex w-full items-center px-6">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {userActions}
            <LocaleSwitcher />
          </div>
        </div>
      </header>
    </>
  );
}
