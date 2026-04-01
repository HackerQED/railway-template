'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface RotatingTipsProps {
  tips: string[];
  interval?: number;
  className?: string;
}

export function RotatingTips({
  tips,
  interval = 3000,
  className,
}: RotatingTipsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (tips.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }, interval);

    return () => clearInterval(timer);
  }, [tips.length, interval, isPaused]);

  if (!tips.length) return null;

  return (
    <div
      className={cn('flex items-center justify-center text-center', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {tips[currentIndex]}
    </div>
  );
}
