'use client';

import { BorderBeam } from '@/components/magicui/border-beam';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Copy, FileAudio, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface HeroCtaChatContent {
  header: string;
  webUi: string;
  installCommand: string;
  aiInstalled: string;
  userFile: string;
  userPrompt: string;
  resultFile: string;
  resultMeta: string;
  copy: string;
  copied: string;
  copyToast: string;
}

interface HeroCtaProps {
  primaryHref: string;
  chat: HeroCtaChatContent;
}

export function HeroCta({ primaryHref, chat }: HeroCtaProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(chat.installCommand);
    setCopied(true);
    toast.success(chat.copyToast);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* Chat simulation container */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="rounded-2xl border bg-card shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <span className="text-base font-bold text-foreground">
              {chat.header}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full text-xs"
              onClick={() => router.push(primaryHref)}
            >
              {chat.webUi}
              <ArrowRight className="size-3" />
            </Button>
          </div>

          {/* Chat messages */}
          <div className="space-y-3 p-5">
            {/* User: install command */}
            <div className="flex justify-end">
              <div className="relative">
                <div className="absolute -right-2.5 bottom-2 size-0 border-y-[8px] border-l-[10px] border-y-transparent border-l-primary/30" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="group flex cursor-pointer items-center gap-4 rounded-2xl rounded-br-sm border-2 border-primary/40 bg-primary/5 px-5 py-4 transition-all hover:border-primary/70 hover:bg-primary/10"
                >
                  <code className="flex-1 whitespace-pre-wrap text-left text-sm font-medium text-foreground">
                    {chat.installCommand}
                  </code>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
                    {copied ? (
                      <>
                        <Check className="size-3.5" />
                        {chat.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        {chat.copy}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* AI: skill installed */}
            <div className="flex justify-start">
              <div className="relative">
                <div className="absolute -left-2.5 bottom-2 size-0 border-y-[8px] border-r-[10px] border-y-transparent border-r-muted/60" />
                <div className="rounded-2xl rounded-bl-sm bg-muted/60 px-4 py-2.5 text-sm text-foreground">
                  ✅ {chat.aiInstalled}
                </div>
              </div>
            </div>

            {/* User: upload audio */}
            <div className="flex justify-end">
              <div className="relative">
                <div className="absolute -right-2.5 bottom-2 size-0 border-y-[8px] border-l-[10px] border-y-transparent border-l-primary/10" />
                <div className="flex items-center gap-2 rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2.5 text-sm text-foreground">
                  <FileAudio className="size-4 text-primary" />
                  <span>{chat.userFile}</span>
                </div>
              </div>
            </div>

            {/* User: prompt */}
            <div className="flex justify-end">
              <div className="relative">
                <div className="absolute -right-2.5 bottom-2 size-0 border-y-[8px] border-l-[10px] border-y-transparent border-l-primary/10" />
                <div className="rounded-2xl rounded-br-sm bg-primary/10 px-4 py-2.5 text-sm text-foreground">
                  {chat.userPrompt}
                </div>
              </div>
            </div>

            {/* AI: result */}
            <div className="flex justify-start">
              <div className="relative">
                <div className="absolute -left-2.5 bottom-2 size-0 border-y-[8px] border-r-[10px] border-y-transparent border-r-muted/60" />
                <div className="rounded-2xl rounded-bl-sm bg-muted/60 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="size-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {chat.resultFile}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chat.resultMeta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BorderBeam
          colorFrom="#22c55e"
          colorTo="#8b5cf6"
          size={100}
          duration={8}
        />
      </div>
    </div>
  );
}
