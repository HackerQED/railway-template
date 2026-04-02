'use client';

import { GoogleLoginButton } from '@/components/auth/google-login-button';
import LocaleSelector from '@/components/layout/locale-selector';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcherHorizontal } from '@/components/layout/mode-switcher-horizontal';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useNavbarLinks } from '@/config/navbar-config';
import { websiteConfig } from '@/config/website';
import { useCreditBalance } from '@/hooks/use-credits';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { Portal } from '@radix-ui/react-portal';
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CoinsIcon,
  Loader2Icon,
  MenuIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { RemoveScroll } from 'react-remove-scroll';
import { Skeleton } from '../ui/skeleton';
import { UserButtonMobile } from './user-button-mobile';

export function NavbarMobile({
  className,
  ...other
}: React.HTMLAttributes<HTMLDivElement>) {
  const t = useTranslations();
  const [open, setOpen] = React.useState<boolean>(false);
  const localePathname = useLocalePathname();
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = () => {
      if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }

      setOpen(false);
    };

    handleRouteChangeStart();
  }, [localePathname]);

  const handleChange = () => {
    const mediaQueryList = window.matchMedia('(min-width: 1024px)');
    setOpen((open) => (open ? !mediaQueryList.matches : false));
  };

  useEffect(() => {
    handleChange();
    const mediaQueryList = window.matchMedia('(min-width: 1024px)');
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, []);

  const handleToggleMobileMenu = (): void => {
    setOpen((open) => !open);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div
        className={cn('flex items-center justify-between', className)}
        {...other}
      >
        {/* navbar left shows logo */}
        <LocaleLink href={Routes.Root} className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-semibold font-bricolage-grotesque">
            {t('Metadata.name')}
          </span>
        </LocaleLink>

        {/* navbar right shows menu icon and user button */}
        <div className="flex items-center justify-end gap-4">
          {/* show user button if user is logged in */}
          {isPending ? (
            <Skeleton className="size-8 border rounded-full" />
          ) : currentUser ? (
            <>
              <MobileCreditsCompact userId={currentUser.id} />
              <UserButtonMobile user={currentUser} />
            </>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            aria-label="Toggle Mobile Menu"
            onClick={handleToggleMobileMenu}
            className="size-8 flex aspect-square h-fit select-none items-center
              justify-center rounded-md border cursor-pointer"
          >
            {open ? (
              <XIcon className="size-4" />
            ) : (
              <MenuIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <Portal asChild>
          {/* if we don't add RemoveScroll component, the underlying
            page will scroll when we scroll the mobile menu */}
          <RemoveScroll allowPinchZoom enabled>
            {/* Only render MainMobileMenu when not in loading state */}
            {!isPending && (
              <MainMobileMenu
                userLoggedIn={!!currentUser}
                userId={currentUser?.id}
                onLinkClicked={handleToggleMobileMenu}
              />
            )}
          </RemoveScroll>
        </Portal>
      )}
    </>
  );
}

interface MainMobileMenuProps {
  userLoggedIn: boolean;
  userId?: string;
  onLinkClicked: () => void;
}

function MainMobileMenu({
  userLoggedIn,
  userId,
  onLinkClicked,
}: MainMobileMenuProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const t = useTranslations();
  const menuLinks = useNavbarLinks();
  const localePathname = useLocalePathname();

  return (
    <div
      className="fixed w-full inset-0 z-50 mt-[64px] overflow-y-auto
      bg-background backdrop-blur-md animate-in fade-in-0"
    >
      <div className="size-full flex flex-col items-start space-y-4">
        {/* action buttons */}
        {userLoggedIn ? (
          <div className="w-full px-4 space-y-2">
            <LocaleLink
              href={Routes.DashboardEntry}
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                'w-full font-semibold'
              )}
              onClick={onLinkClicked}
            >
              {t('Marketing.avatar.dashboard')}
            </LocaleLink>
            <MobileCreditsRow userId={userId} onLinkClicked={onLinkClicked} />
          </div>
        ) : (
          <div className="w-full px-4">
            <GoogleLoginButton
              variant="default"
              size="lg"
              className="w-full font-semibold"
              callbackUrl={localePathname}
            >
              {t('Common.login')}
            </GoogleLoginButton>
          </div>
        )}

        {/* main menu */}
        <ul className="w-full px-4">
          {menuLinks?.map((item) => {
            const isActive = item.href
              ? item.href === '/'
                ? localePathname === '/'
                : localePathname.startsWith(item.href)
              : item.items?.some(
                  (subItem) =>
                    subItem.href &&
                    (subItem.href === '/'
                      ? localePathname === '/'
                      : localePathname.startsWith(subItem.href))
                );

            return (
              <li key={item.title} className="py-1">
                {item.items ? (
                  <Collapsible
                    open={expanded[item.title?.toLowerCase() ?? '']}
                    onOpenChange={(isOpen) =>
                      setExpanded((prev) => ({
                        ...prev,
                        [item.title?.toLowerCase() ?? '']: isOpen,
                      }))
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className={cn(
                          'flex w-full !pl-2 items-center justify-between text-left',
                          'bg-transparent text-muted-foreground cursor-pointer',
                          'hover:bg-transparent hover:text-foreground',
                          'focus:bg-transparent focus:text-foreground',
                          isActive &&
                            'font-semibold bg-transparent text-foreground'
                        )}
                      >
                        <span className="text-base">{item.title}</span>
                        {expanded[item.title?.toLowerCase() ?? ''] ? (
                          <ChevronDownIcon className="size-4" />
                        ) : (
                          <ChevronRightIcon className="size-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-2">
                      <ul className="mt-2 space-y-2 pl-0">
                        {item.items.map((subItem) => {
                          const isSubItemActive =
                            subItem.href &&
                            localePathname.startsWith(subItem.href);

                          return (
                            <li key={subItem.title}>
                              <LocaleLink
                                href={subItem.href || '#'}
                                target={subItem.external ? '_blank' : undefined}
                                rel={
                                  subItem.external
                                    ? 'noopener noreferrer'
                                    : undefined
                                }
                                className={cn(
                                  buttonVariants({ variant: 'ghost' }),
                                  'group h-auto w-full justify-start gap-4 p-1 !pl-0 !pr-3',
                                  'bg-transparent text-muted-foreground cursor-pointer',
                                  'hover:bg-transparent hover:text-foreground',
                                  'focus:bg-transparent focus:text-foreground',
                                  isSubItemActive &&
                                    'font-semibold bg-transparent text-foreground'
                                )}
                                onClick={onLinkClicked}
                              >
                                <div
                                  className={cn(
                                    'flex size-8 shrink-0 items-center justify-center transition-colors ml-0',
                                    'bg-transparent text-muted-foreground',
                                    'group-hover:bg-transparent group-hover:text-foreground',
                                    'group-focus:bg-transparent group-focus:text-foreground',
                                    isSubItemActive &&
                                      'bg-transparent text-foreground'
                                  )}
                                >
                                  {subItem.icon ? subItem.icon : null}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className={cn(
                                      'text-sm text-muted-foreground',
                                      'group-hover:bg-transparent group-hover:text-foreground',
                                      'group-focus:bg-transparent group-focus:text-foreground',
                                      isSubItemActive &&
                                        'font-semibold bg-transparent text-foreground'
                                    )}
                                  >
                                    {subItem.title}
                                  </span>
                                  {/* hide description for now */}
                                  {/* {subItem.description && (
                                      <p
                                        className={cn(
                                          'text-xs text-muted-foreground',
                                          'group-hover:bg-transparent group-hover:text-foreground/80',
                                          'group-focus:bg-transparent group-focus:text-foreground/80',
                                          isSubItemActive &&
                                          'bg-transparent text-foreground/80'
                                        )}
                                      >
                                        {subItem.description}
                                      </p>
                                    )} */}
                                </div>
                                {subItem.external && (
                                  <ArrowUpRightIcon
                                    className={cn(
                                      'size-4 shrink-0 text-muted-foreground items-center',
                                      'group-hover:bg-transparent group-hover:text-foreground',
                                      'group-focus:bg-transparent group-focus:text-foreground',
                                      isSubItemActive &&
                                        'bg-transparent text-foreground'
                                    )}
                                  />
                                )}
                              </LocaleLink>
                            </li>
                          );
                        })}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <LocaleLink
                    href={item.href || '#'}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={cn(
                      buttonVariants({ variant: 'ghost' }),
                      'w-full !pl-2 justify-start cursor-pointer group',
                      'bg-transparent text-muted-foreground',
                      'hover:bg-transparent hover:text-foreground',
                      'focus:bg-transparent focus:text-foreground',
                      isActive && 'font-semibold bg-transparent text-foreground'
                    )}
                    onClick={onLinkClicked}
                  >
                    <div className="flex items-center w-full pl-0">
                      <span className="text-base">{item.title}</span>
                    </div>
                  </LocaleLink>
                )}
              </li>
            );
          })}
        </ul>

        {/* bottom buttons */}
        <div className="flex w-full items-center justify-between gap-4 border-t border-border/50 p-4">
          <LocaleSelector />
          <ModeSwitcherHorizontal />
        </div>
      </div>
    </div>
  );
}

function MobileCreditsCompact({ userId }: { userId: string }) {
  const creditsEnabled = websiteConfig.credits.enableCredits;
  const { data: balance = 0, isLoading } = useCreditBalance(
    creditsEnabled ? userId : undefined
  );

  if (!creditsEnabled) return null;

  return (
    <LocaleLink
      href={Routes.SettingsCredits}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'h-8 gap-1.5 px-2.5 text-sm font-medium rounded-full',
        'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
      )}
    >
      <CoinsIcon className="h-3.5 w-3.5" />
      {isLoading ? (
        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
      ) : (
        balance.toLocaleString()
      )}
    </LocaleLink>
  );
}

function MobileCreditsRow({
  userId,
  onLinkClicked,
}: { userId?: string; onLinkClicked: () => void }) {
  const creditsEnabled = websiteConfig.credits.enableCredits;
  const t = useTranslations('Dashboard.settings.credits.balance');
  const { data: balance = 0, isLoading } = useCreditBalance(
    creditsEnabled ? userId : undefined
  );

  if (!creditsEnabled || !userId) return null;

  return (
    <div className="flex items-center gap-2">
      <LocaleLink
        href={Routes.Pricing}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          'flex-1 gap-1.5 font-medium'
        )}
        onClick={onLinkClicked}
      >
        <PlusIcon className="h-4 w-4" />
        {t('topUp')}
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
          40% OFF
        </span>
      </LocaleLink>
      <LocaleLink
        href={Routes.SettingsCredits}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'lg' }),
          'gap-1.5 font-medium',
          'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
        )}
        onClick={onLinkClicked}
      >
        <CoinsIcon className="h-4 w-4" />
        {isLoading ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          balance.toLocaleString()
        )}
      </LocaleLink>
    </div>
  );
}
