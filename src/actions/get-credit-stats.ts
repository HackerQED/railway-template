'use server';

import { getUserCreditBalance } from '@/credits/credits';
import { CREDIT_TRANSACTION_TYPE } from '@/credits/types';
import { getDb } from '@/db';
import { creditTransaction } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { and, eq, gte, sum } from 'drizzle-orm';

/**
 * Get credit statistics for a user
 */
export const getCreditStatsAction = userActionClient.action(async ({ ctx }) => {
  try {
    const currentUser = (ctx as { user: User }).user;
    const userId = currentUser.id;

    const db = await getDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [creditBalance, usageResult] = await Promise.all([
      getUserCreditBalance(userId),
      db
        .select({ totalUsage: sum(creditTransaction.amount) })
        .from(creditTransaction)
        .where(
          and(
            eq(creditTransaction.userId, userId),
            eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.USAGE),
            gte(creditTransaction.createdAt, thirtyDaysAgo)
          )
        ),
    ]);

    const totalUsageLast30Days = Math.abs(
      Number(usageResult[0]?.totalUsage) || 0
    );

    return {
      success: true,
      data: {
        creditBalance,
        usageLast30Days: totalUsageLast30Days,
      },
    };
  } catch (error) {
    console.error('get credit stats error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch credit statistics',
    };
  }
});
