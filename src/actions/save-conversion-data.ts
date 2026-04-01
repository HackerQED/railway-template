'use server';

import { getDb } from '@/db';
import { userConversion } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { PurchaseReport } from './get-conversion-data';

const saveConversionDataSchema = z.object({
  signUpAt: z.string().datetime().optional(),
  gclid: z.string().min(1).optional(),
  utmSource: z.string().optional(),
  utmCampaign: z.string().optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
});

/**
 * Save source attribution data (write-once per field) and return full conversion status.
 * Combines save + get into one round trip.
 */
export const saveConversionDataAction = userActionClient
  .schema(saveConversionDataSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = (ctx as { user: User }).user.id;

    try {
      const db = await getDb();

      const existing = await db
        .select()
        .from(userConversion)
        .where(eq(userConversion.userId, userId))
        .limit(1);

      if (existing[0]) {
        const record = existing[0];
        const updates: Record<string, unknown> = {};

        // Write-once fields: only set if DB value is empty
        const writeOnceFields = [
          'gclid',
          'utmSource',
          'utmCampaign',
          'referrer',
          'landingPage',
        ] as const;
        for (const field of writeOnceFields) {
          if (!record[field] && parsedInput[field]) {
            updates[field] = parsedInput[field];
          }
        }
        if (!record.signUpAt && parsedInput.signUpAt) {
          updates.signUpAt = new Date(parsedInput.signUpAt);
        }

        const signUpWasSet = 'signUpAt' in updates;

        if (Object.keys(updates).length > 0) {
          updates.updatedAt = new Date();
          await db
            .update(userConversion)
            .set(updates)
            .where(eq(userConversion.userId, userId));
        }

        // Return full conversion status
        const reports = Array.isArray(record.pendingPurchaseReports)
          ? (record.pendingPurchaseReports as PurchaseReport[])
          : [];

        return {
          success: true,
          signUpWasSet,
          gclid: record.gclid ?? parsedInput.gclid ?? null,
          unreportedPurchases: reports.filter((r) => !r.reportedAt),
        };
      }

      // Create new record
      await db.insert(userConversion).values({
        id: nanoid(),
        userId,
        signUpAt: parsedInput.signUpAt
          ? new Date(parsedInput.signUpAt)
          : undefined,
        gclid: parsedInput.gclid,
        utmSource: parsedInput.utmSource,
        utmCampaign: parsedInput.utmCampaign,
        referrer: parsedInput.referrer,
        landingPage: parsedInput.landingPage,
      });

      return {
        success: true,
        signUpWasSet: !!parsedInput.signUpAt,
        gclid: parsedInput.gclid ?? null,
        unreportedPurchases: [] as PurchaseReport[],
      };
    } catch (error) {
      console.error('Save conversion data error:', error);
      return {
        success: false,
        signUpWasSet: false,
        gclid: null,
        unreportedPurchases: [] as PurchaseReport[],
      };
    }
  });
