import { LoginRequiredToast } from '@/components/auth/login-required-toast';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { PromotionalBanner } from '@/components/marketing/promotional-banner';
import type { ReactNode } from 'react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <LoginRequiredToast />
      <PromotionalBanner />
      <Navbar scroll={true} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
