'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const LoginRequiredToast = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('loginRequired') === 'true') {
      // 使用 setTimeout 将 toast 延迟到下一个事件循环,避免在渲染期间调用
      setTimeout(() => {
        toast.info('Please sign in to access this page');
      }, 0);
    }
  }, [searchParams]);

  return null;
};
