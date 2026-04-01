'use server';

import { getDb } from '@/db';
import { userConversion } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { PurchaseReport } from './get-conversion-data';

const markReportedSchema = z.object({
  transactionIds: z.array(z.string().min(1)),
});

/**
 * Mark purchase reports as reported to Google Ads.
 * Sets reportedAt timestamp on matching pending reports.
 */
export const markConversionReportedAction = userActionClient
  .schema(markReportedSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = (ctx as { user: User }).user.id;

    try {
      const db = await getDb();
      const records = await db
        .select({
          id: userConversion.id,
          pendingPurchaseReports: userConversion.pendingPurchaseReports,
        })
        .from(userConversion)
        .where(eq(userConversion.userId, userId))
        .limit(1);

      const record = records[0];
      if (
        !record?.pendingPurchaseReports ||
        !Array.isArray(record.pendingPurchaseReports)
      ) {
        return { success: false, error: 'No pending reports found' };
      }

      const now = new Date().toISOString();
      const transactionIdSet = new Set(parsedInput.transactionIds);

      const updatedReports = (
        record.pendingPurchaseReports as PurchaseReport[]
      ).map((report) => {
        if (transactionIdSet.has(report.transactionId) && !report.reportedAt) {
          return { ...report, reportedAt: now };
        }
        return report;
      });

      await db
        .update(userConversion)
        .set({
          pendingPurchaseReports: updatedReports,
          updatedAt: new Date(),
        })
        .where(eq(userConversion.id, record.id));

      return { success: true, markedCount: parsedInput.transactionIds.length };
    } catch (error) {
      console.error('Mark conversion reported error:', error);
      return { success: false, error: 'Failed to mark conversion reported' };
    }
  });
