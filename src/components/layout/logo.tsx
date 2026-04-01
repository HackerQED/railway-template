'use client';

import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  const logo = websiteConfig.metadata.images?.logo ?? '/logo.png';

  return (
    <Image
      src={logo}
      alt="Logo"
      title="Logo"
      width={96}
      height={96}
      className={cn('size-8 rounded-md', className)}
    />
  );
}
