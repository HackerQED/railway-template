'use server';

import { getUserCreditBalance } from '@/credits/credits';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';

/**
 * Get current user's credit balance (all fields)
 */
export const getCreditBalanceAction = userActionClient.action(
  async ({ ctx }) => {
    try {
      const currentUser = (ctx as { user: User }).user;
      const creditBalance = await getUserCreditBalance(currentUser.id);
      return {
        success: true,
        credits: creditBalance.available,
        creditBalance,
      };
    } catch (error) {
      console.error('get credit balance error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch credit balance',
      };
    }
  }
);
