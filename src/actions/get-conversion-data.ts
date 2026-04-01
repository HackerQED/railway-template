'use server';

import { getDb } from '@/db';
import { userConversion } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';

export interface PurchaseReport {
  transactionId: string;
  value: number;
  currency: string;
  createdAt: string;
  reportedAt: string | null;
}

/**
 * Get user's conversion status: signup state, gclid, and pending purchase reports.
 * Used by ConversionTracker to decide what needs reporting.
 */
export const getConversionDataAction = userActionClient.action(
  async ({ ctx }) => {
    const userId = (ctx as { user: User }).user.id;

    try {
      const db = await getDb();
      const records = await db
        .select({
          gclid: userConversion.gclid,
          signUpAt: userConversion.signUpAt,
          pendingPurchaseReports: userConversion.pendingPurchaseReports,
        })
        .from(userConversion)
        .where(eq(userConversion.userId, userId))
        .limit(1);

      const record = records[0];

      // Filter unreported purchase reports
      let unreportedPurchases: PurchaseReport[] = [];
      if (
        record?.pendingPurchaseReports &&
        Array.isArray(record.pendingPurchaseReports)
      ) {
        unreportedPurchases = (
          record.pendingPurchaseReports as PurchaseReport[]
        ).filter((r) => !r.reportedAt);
      }

      return {
        success: true,
        gclid: record?.gclid ?? null,
        signUpAt: record?.signUpAt?.toISOString() ?? null,
        unreportedPurchases,
      };
    } catch (error) {
      console.error('Get conversion data error:', error);
      return {
        success: false,
        gclid: null,
        signUpAt: null,
        unreportedPurchases: [] as PurchaseReport[],
      };
    }
  }
);
