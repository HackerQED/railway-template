'use client';

import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { useState } from 'react';
import { Button } from '../ui/button';

interface GoogleLoginButtonProps {
  callbackUrl?: string;
  variant?:
    | 'default'
    | 'outline'
    | 'ghost'
    | 'link'
    | 'destructive'
    | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

export const GoogleLoginButton = ({
  callbackUrl = Routes.DashboardEntry,
  variant = 'default',
  size = 'sm',
  className,
  children,
}: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    console.log('[auth] signIn.social triggered, callbackURL:', callbackUrl);
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: callbackUrl,
        errorCallbackURL: Routes.AuthError,
      });
      console.log('[auth] signIn.social result:', result);
    } catch (error) {
      console.error('[auth] signIn.social error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? 'Loading...' : children || 'Sign in with Google'}
    </Button>
  );
};
