'use client';

import { brandColors } from '@/config/brand-colors';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface OpenClawInstallBannerProps {
  agentHeading: string;
  installCommand: string;
  copyToast: string;
}

export function OpenClawInstallBanner({
  agentHeading,
  installCommand,
  copyToast,
}: OpenClawInstallBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    toast.success(copyToast);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left shadow-sm transition-colors hover:border-[var(--openclaw)]/50"
      style={
        {
          '--openclaw': brandColors.openclaw.primary,
          borderColor: `${brandColors.openclaw.primary}40`,
          background: `linear-gradient(135deg, ${brandColors.openclaw.primary}15 0%, transparent 60%)`,
        } as React.CSSProperties
      }
    >
      {/* Left accent bar */}
      <div
        className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r-full"
        style={{ backgroundColor: brandColors.openclaw.primary }}
      />
      <div className="px-5 pt-4 pb-2">
        <p
          className="text-sm font-medium"
          style={{ color: brandColors.openclaw.medium }}
        >
          {agentHeading}
        </p>
      </div>
      <div className="mx-5">
        <div
          className="h-px w-full"
          style={{ backgroundColor: `${brandColors.openclaw.primary}25` }}
        />
      </div>
      <div className="flex items-center gap-3 px-5 pt-3 pb-4">
        <code className="flex-1 whitespace-pre-wrap text-sm text-foreground/80">
          {installCommand}
        </code>
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          {copied ? (
            <>
              <Check
                className="size-3.5"
                style={{ color: brandColors.openclaw.medium }}
              />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Click to copy
            </>
          )}
        </span>
      </div>
    </button>
  );
}
