'use client';

import { BorderBeam } from '@/components/magicui/border-beam';
import { ModelIcon } from '@/components/model-icon';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODELS, type ModelConfig } from '@/config/models';
import { authClient } from '@/lib/auth-client';
import { Bot, ImageIcon, ImagePlus, Sparkles, Video, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const CATEGORIES = ['video', 'image'] as const;
type Category = (typeof CATEGORIES)[number];

type TabItem = {
  id: Category | 'agent';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
};

const TABS: TabItem[] = [
  { id: 'video', label: 'AI Video', icon: Video },
  { id: 'image', label: 'AI Image', icon: ImageIcon },
  {
    id: 'agent',
    label: 'AI Agent',
    icon: Bot,
    disabled: true,
    badge: 'Coming Soon',
  },
];

interface HeroPromptContent {
  placeholder: string;
  generate: string;
}

interface HeroPromptBoxProps {
  content: HeroPromptContent;
}

export function HeroPromptBox({ content }: HeroPromptBoxProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('video');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const isLoggedIn = mounted && !!session?.user;

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl]
  );

  const handleRemoveImage = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const modelsInCategory = useMemo(() => {
    const seen = new Set<string>();
    return MODELS.filter((m) => {
      if (m.category !== selectedCategory) return false;
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    });
  }, [selectedCategory]);
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(
    modelsInCategory[0]
  );

  const handleCategoryChange = (cat: Category) => {
    setSelectedCategory(cat);
    const seen = new Set<string>();
    const models = MODELS.filter((m) => {
      if (m.category !== cat) return false;
      if (seen.has(m.slug)) return false;
      seen.add(m.slug);
      return true;
    });
    if (models.length > 0) {
      setSelectedModel(models[0]);
    }
  };

  const handleSubmit = () => {
    // Unauthenticated users: prompt login first
    if (!isLoggedIn) {
      authClient.signIn.social({
        provider: 'google',
        callbackURL: `/models/${selectedModel.slug}${prompt.trim() ? `?prompt=${encodeURIComponent(prompt.trim())}` : ''}`,
        errorCallbackURL: '/auth/error',
      });
      return;
    }

    const qs = prompt.trim()
      ? `?prompt=${encodeURIComponent(prompt.trim())}`
      : '';
    router.push(`/models/${selectedModel.slug}${qs}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      {/* Card 1: For Human — prompt input */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="rounded-2xl border border-white/20 bg-black/50 shadow-lg backdrop-blur-xl">
          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-white/10 px-4 pt-1">
            {TABS.map((tab) => {
              const isActive = !tab.disabled && selectedCategory === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  disabled={tab.disabled}
                  onClick={() => {
                    if (!tab.disabled && tab.id !== 'agent') {
                      handleCategoryChange(tab.id as Category);
                    }
                  }}
                  className={`group relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab.disabled
                      ? 'cursor-not-allowed text-muted-foreground/40'
                      : isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none font-medium text-muted-foreground/60">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 p-4 pb-3">
            {/* Image upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() =>
                previewUrl ? handleRemoveImage() : fileInputRef.current?.click()
              }
              className="group/img relative size-[88px] shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              {previewUrl ? (
                <>
                  <Image
                    src={previewUrl}
                    alt="Reference"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                    <X className="size-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1">
                  <ImagePlus className="size-6 text-muted-foreground/40" />
                </div>
              )}
            </button>

            {/* Textarea */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={content.placeholder}
              rows={3}
              className="w-full min-w-0 flex-1 resize-none bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>

          {/* Bottom bar: model select + generate */}
          <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3">
            {/* Model select */}
            {modelsInCategory.length > 0 && (
              <Select
                value={selectedModel.id}
                onValueChange={(v) => {
                  const model = modelsInCategory.find((m) => m.id === v);
                  if (model) setSelectedModel(model);
                }}
              >
                <SelectTrigger size="sm" className="h-8 w-auto rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelsInCategory.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-1.5">
                        <ModelIcon
                          src={m.icon}
                          name={m.name}
                          className="size-3.5"
                        />
                        {m.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Spacer + Generate */}
            <div className="ml-auto">
              <Button
                onClick={handleSubmit}
                size="sm"
                className="gap-2 rounded-full px-6"
              >
                <Sparkles className="size-4" />
                {content.generate}
              </Button>
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
