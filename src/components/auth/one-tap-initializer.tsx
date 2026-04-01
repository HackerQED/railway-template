'use client';

import { useSession } from '@/hooks/use-session';
import { authClient } from '@/lib/auth-client';
import { useEffect, useRef } from 'react';

export const OneTapInitializer = () => {
  const session = useSession();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (session || hasTriggered.current) {
      return;
    }
    hasTriggered.current = true;

    // 自动显示 Google One Tap
    Promise.resolve(authClient.oneTap()).catch((error) => {
      console.error('one-tap invoke failed', error);
    });
  }, [session]);

  return null;
};
