import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { ToolsHeader } from '@/components/dashboard/tools-header';
import { Footer } from '@/components/layout/footer';
import { PromotionalBanner } from '@/components/marketing/promotional-banner';
import { PricingDialog } from '@/components/pricing/pricing-dialog';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { PropsWithChildren } from 'react';

/**
 * Shared tools layout with sidebar
 */
export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <>
      <PromotionalBanner />
      <PricingDialog />
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <DashboardSidebar variant="sidebar" />

        <SidebarInset className="min-w-0">
          <ToolsHeader />
          <div className="min-w-0 overflow-x-hidden">{children}</div>
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
