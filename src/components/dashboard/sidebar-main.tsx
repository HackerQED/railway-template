'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import type { NestedMenuItem } from '@/types';

/**
 * Main navigation for the dashboard sidebar
 */
export function SidebarMain({ items }: { items: NestedMenuItem[] }) {
  const pathname = useLocalePathname();

  // Function to check if a path is active
  const isActive = (href: string | undefined): boolean => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="flex min-h-0 flex-col gap-2">
      {/* Render items with children as SidebarGroup */}
      {items.map((item, index) => {
        if (item.type === 'spacer') {
          return <div key={`spacer-${index}`} className="flex-1" />;
        }

        if (item.items && item.items.length > 0) {
          return (
            <SidebarGroup key={item.title ?? index}>
              {item.title && (
                <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
              )}
              <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                  {item.items.map((subItem, subIndex) => (
                    <SidebarMenuItem key={subItem.title ?? subIndex}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(subItem.href)}
                      >
                        <LocaleLink href={subItem.href || ''}>
                          {subItem.icon ? subItem.icon : null}
                          <span className="truncate font-medium text-sm">
                            {subItem.title}
                          </span>
                          {subItem.badge && (
                            <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none text-muted-foreground">
                              {subItem.badge}
                            </span>
                          )}
                        </LocaleLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        }

        /* Render items without children directly in a SidebarMenu */
        return (
          <SidebarGroup key={item.title ?? index}>
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <LocaleLink href={item.href || ''}>
                      {item.icon ? item.icon : null}
                      <span className="truncate font-medium text-sm">
                        {item.title}
                      </span>
                    </LocaleLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </div>
  );
}
