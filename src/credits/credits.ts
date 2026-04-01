import { randomUUID } from 'crypto';
import { websiteConfig } from '@/config/website';
import { getDb } from '@/db';
import { creditTransaction, userCredit } from '@/db/schema';
import { findPlanByPlanId, findPlanByPriceId } from '@/lib/price-plan';
import { PlanIntervals } from '@/payment/types';
import { and, eq, sql } from 'drizzle-orm';
import { CREDIT_TRANSACTION_TYPE } from './types';
import type { CreditBalance, CreditTransactionMetadata } from './types';

// ─── Pure helpers ─────────────────────────────────────────────────

function computeAvailable(credit: {
  balance: number;
  subscriptionBalance: number;
  pendingBalance: number;
}): number {
  return (
    (credit.balance ?? 0) +
    (credit.subscriptionBalance ?? 0) -
    (credit.pendingBalance ?? 0)
  );
}

/** Priority: subscription → balance */
function computeConsumptionBreakdown(
  subscriptionBalance: number,
  amount: number
) {
  const fromSubscription = Math.min(subscriptionBalance, amount);
  const fromBalance = amount - fromSubscription;
  return { fromSubscription, fromBalance };
}

function validateCreditBalances(credit: {
  balance: number;
  subscriptionBalance: number;
  pendingBalance: number;
}) {
  if (credit.balance < 0)
    throw new Error('Invalid credit state: negative balance');
  if (credit.subscriptionBalance < 0)
    throw new Error('Invalid credit state: negative subscription balance');
  if (credit.pendingBalance < 0)
    throw new Error('Invalid credit state: negative pending balance');
}

// ─── DB helpers ───────────────────────────────────────────────────

/**
 * Get or create user credit record.
 * Accepts an optional Drizzle transaction to run within an existing tx.
 */
export async function getOrCreateUserCredit(
  userId: string,
  tx?: Parameters<
    Parameters<Awaited<ReturnType<typeof getDb>>['transaction']>[0]
  >[0]
) {
  const db = tx || (await getDb());
  const records = await db
    .select()
    .from(userCredit)
    .where(eq(userCredit.userId, userId))
    .limit(1);

  if (records.length > 0) return records[0];

  const newRecord = {
    id: randomUUID(),
    userId,
    balance: 0,
    subscriptionBalance: 0,
    pendingBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(userCredit).values(newRecord);
  return newRecord;
}

/**
 * Find a pending transaction by generationId, or throw.
 */
async function findPendingTransaction(
  db: Parameters<
    Parameters<Awaited<ReturnType<typeof getDb>>['transaction']>[0]
  >[0],
  generationId: string
) {
  const rows = await db
    .select({
      id: creditTransaction.id,
      userId: creditTransaction.userId,
      amount: creditTransaction.amount,
      metadata: creditTransaction.metadata,
    })
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.generationId, generationId),
        eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.PENDING)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error('No pending transaction found for this generation');
  return row;
}

// ─── Balance queries ──────────────────────────────────────────────

export async function getUserCreditBalance(
  userId: string
): Promise<CreditBalance> {
  const credit = await getOrCreateUserCredit(userId);
  const balance = credit.balance ?? 0;
  const subscriptionBalance = credit.subscriptionBalance ?? 0;
  const pendingBalance = credit.pendingBalance ?? 0;
  return {
    balance,
    subscriptionBalance,
    pendingBalance,
    available: computeAvailable(credit),
  };
}

export async function getUserCredits(userId: string): Promise<number> {
  const creditBalance = await getUserCreditBalance(userId);
  return creditBalance.available;
}

export async function checkCreditsAvailable({
  userId,
  requiredCredits,
}: {
  userId: string;
  requiredCredits: number;
}): Promise<boolean> {
  const creditBalance = await getUserCreditBalance(userId);
  return creditBalance.available >= requiredCredits;
}

export const hasEnoughCredits = checkCreditsAvailable;

// ─── Pre-deduction flow (lock → confirm/rollback) ─────────────────

/**
 * Lock credits for a pending generation task.
 */
export async function lockCredits({
  userId,
  amount,
  generationId,
  description,
}: {
  userId: string;
  amount: number;
  generationId: string;
  description?: string;
}) {
  if (amount <= 0) throw new Error('lockCredits: amount must be positive');

  const db = await getDb();
  return await db.transaction(async (tx) => {
    const credit = await getOrCreateUserCredit(userId, tx);
    validateCreditBalances(credit);

    const available = computeAvailable(credit);
    if (available < amount) throw new Error('Insufficient credits');

    const breakdown = computeConsumptionBreakdown(
      credit.subscriptionBalance ?? 0,
      amount
    );
    const metadata: CreditTransactionMetadata = breakdown;

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      type: CREDIT_TRANSACTION_TYPE.PENDING,
      amount: -amount,
      generationId,
      description: description || `Lock credits: ${amount}`,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx
      .update(userCredit)
      .set({
        pendingBalance: sql`${userCredit.pendingBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    return breakdown;
  });
}

/**
 * Confirm credit deduction after generation succeeds.
 * All queries run inside a single transaction to prevent TOCTOU races.
 */
export async function confirmCreditsDeduction({
  generationId,
  description,
}: {
  generationId: string;
  description?: string;
}) {
  const db = await getDb();
  return await db.transaction(async (tx) => {
    // Duplicate check inside transaction
    const existingConsume = await tx
      .select({ id: creditTransaction.id })
      .from(creditTransaction)
      .where(
        and(
          eq(creditTransaction.generationId, generationId),
          eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.USAGE)
        )
      )
      .limit(1);

    if (existingConsume.length > 0) {
      throw new Error('Credits already consumed for this generation');
    }

    const pendingTx = await findPendingTransaction(tx, generationId);
    const amount = Math.abs(pendingTx.amount);
    const userId = pendingTx.userId;

    const credit = await getOrCreateUserCredit(userId, tx);
    validateCreditBalances(credit);

    // Recalculate breakdown at confirmation time (balances may have changed since lock)
    const breakdown = computeConsumptionBreakdown(
      credit.subscriptionBalance ?? 0,
      amount
    );
    const metadata: CreditTransactionMetadata = breakdown;

    // Batch insert USAGE + PENDING_CANCEL
    await tx.insert(creditTransaction).values([
      {
        id: randomUUID(),
        userId,
        type: CREDIT_TRANSACTION_TYPE.USAGE,
        amount: -amount,
        generationId,
        description: description || `Consume credits: ${amount}`,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId,
        type: CREDIT_TRANSACTION_TYPE.PENDING_CANCEL,
        amount: amount,
        generationId,
        description: `Release pending: ${amount}`,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await tx
      .update(userCredit)
      .set({
        subscriptionBalance: sql`${userCredit.subscriptionBalance} - ${breakdown.fromSubscription}`,
        balance: sql`${userCredit.balance} - ${breakdown.fromBalance}`,
        pendingBalance: sql`${userCredit.pendingBalance} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    return { amount, ...breakdown };
  });
}

/**
 * Rollback locked credits after generation fails.
 * All queries run inside a single transaction to prevent TOCTOU races.
 */
export async function rollbackLockedCredits({
  generationId,
  description,
}: {
  generationId: string;
  description?: string;
}) {
  const db = await getDb();
  return await db.transaction(async (tx) => {
    const pendingTx = await findPendingTransaction(tx, generationId);
    const amount = Math.abs(pendingTx.amount);
    const userId = pendingTx.userId;

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      type: CREDIT_TRANSACTION_TYPE.PENDING_CANCEL,
      amount: amount,
      generationId,
      description: description || `Rollback pending: ${amount}`,
      metadata: pendingTx.metadata as CreditTransactionMetadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx
      .update(userCredit)
      .set({
        pendingBalance: sql`${userCredit.pendingBalance} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    return { amount };
  });
}

// ─── Direct credit operations (for webhooks / admin) ──────────────

/**
 * Add credits to user's balance (for purchases, register gift, etc.)
 */
export async function addCreditsToBalance({
  userId,
  amount,
  type,
  description,
  paymentId,
}: {
  userId: string;
  amount: number;
  type: CREDIT_TRANSACTION_TYPE;
  description: string;
  paymentId?: string;
}) {
  if (amount <= 0)
    throw new Error('addCreditsToBalance: amount must be positive');

  const db = await getDb();
  await db.transaction(async (tx) => {
    await getOrCreateUserCredit(userId, tx);

    await tx
      .update(userCredit)
      .set({
        balance: sql`${userCredit.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      type,
      amount,
      description,
      paymentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
}

/**
 * Reset subscription balance (for subscription renewal / lifetime monthly).
 * Sets subscriptionBalance to the plan's monthly credit amount.
 */
export async function resetSubscriptionBalance({
  userId,
  amount,
  type,
  description,
  paymentId,
}: {
  userId: string;
  amount: number;
  type: CREDIT_TRANSACTION_TYPE;
  description: string;
  paymentId?: string;
}) {
  if (amount < 0)
    throw new Error('resetSubscriptionBalance: amount must be non-negative');

  const db = await getDb();
  await db.transaction(async (tx) => {
    const credit = await getOrCreateUserCredit(userId, tx);
    const previousBalance = credit.subscriptionBalance ?? 0;

    await tx
      .update(userCredit)
      .set({
        subscriptionBalance: amount,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      type,
      amount: amount - previousBalance,
      description,
      paymentId,
      metadata: { fromSubscription: previousBalance },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
}

/**
 * Expire subscription balance (on subscription deletion).
 * Sets subscriptionBalance to 0.
 */
export async function expireSubscriptionBalance({
  userId,
  description,
}: {
  userId: string;
  description: string;
}) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const credit = await getOrCreateUserCredit(userId, tx);
    const previousBalance = credit.subscriptionBalance ?? 0;
    if (previousBalance === 0) return;

    await tx
      .update(userCredit)
      .set({
        subscriptionBalance: 0,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      type: CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_EXPIRE,
      amount: -previousBalance,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `expireSubscriptionBalance, ${previousBalance} credits expired for user ${userId}`
    );
  });
}

// ─── Backward-compatible addCredits ───────────────────────────────

const SUBSCRIPTION_TYPES: ReadonlySet<CREDIT_TRANSACTION_TYPE> = new Set([
  CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL,
  CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RESET,
  CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY,
  CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
]);

export async function addCredits({
  userId,
  amount,
  type,
  description,
  paymentId,
}: {
  userId: string;
  amount: number;
  type: CREDIT_TRANSACTION_TYPE;
  description: string;
  paymentId?: string;
}) {
  if (amount <= 0) throw new Error('addCredits: amount must be positive');

  if (SUBSCRIPTION_TYPES.has(type)) {
    await resetSubscriptionBalance({
      userId,
      amount,
      type,
      description,
      paymentId,
    });
  } else {
    await addCreditsToBalance({ userId, amount, type, description, paymentId });
  }
}

// ─── Deduplication guards ─────────────────────────────────────────

export async function canAddCreditsByType(
  userId: string,
  creditType: CREDIT_TRANSACTION_TYPE
) {
  const db = await getDb();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const existing = await db
    .select({ id: creditTransaction.id })
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.userId, userId),
        eq(creditTransaction.type, creditType),
        sql`EXTRACT(MONTH FROM ${creditTransaction.createdAt}) = ${currentMonth + 1}`,
        sql`EXTRACT(YEAR FROM ${creditTransaction.createdAt}) = ${currentYear}`
      )
    )
    .limit(1);

  return existing.length === 0;
}

// ─── Plan-specific credit operations ──────────────────────────────

export async function addRegisterGiftCredits(userId: string) {
  const db = await getDb();
  const existing = await db
    .select({ id: creditTransaction.id })
    .from(creditTransaction)
    .where(
      and(
        eq(creditTransaction.userId, userId),
        eq(creditTransaction.type, CREDIT_TRANSACTION_TYPE.REGISTER_GIFT)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    const credits = websiteConfig.credits.registerGiftCredits.amount;
    await addCreditsToBalance({
      userId,
      amount: credits,
      type: CREDIT_TRANSACTION_TYPE.REGISTER_GIFT,
      description: `Register gift credits: ${credits}`,
    });
    console.log(
      `addRegisterGiftCredits, ${credits} credits for user ${userId}`
    );
  }
}

/**
 * Shared logic for periodic subscription credit resets.
 * Used by free monthly, subscription renewal, and lifetime monthly.
 */
async function resetPeriodicCredits({
  userId,
  credits,
  creditType,
  label,
}: {
  userId: string;
  credits: number;
  creditType: CREDIT_TRANSACTION_TYPE;
  label: string;
}) {
  const canAdd = await canAddCreditsByType(userId, creditType);
  if (!canAdd) return;

  const now = new Date();
  await resetSubscriptionBalance({
    userId,
    amount: credits,
    type: creditType,
    description: `${label}: ${credits} for ${now.getFullYear()}-${now.getMonth() + 1}`,
  });
  console.log(`${label}, ${credits} credits for user ${userId}`);
}

export async function addMonthlyFreeCredits(userId: string, planId: string) {
  const plan = findPlanByPlanId(planId);
  if (!plan || plan.disabled || !plan.isFree || !plan.credits?.enable) return;

  await resetPeriodicCredits({
    userId,
    credits: plan.credits.amount,
    creditType: CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
    label: 'Free monthly credits',
  });
}

export async function addSubscriptionCredits(userId: string, priceId: string) {
  const plan = findPlanByPriceId(priceId);
  if (!plan?.credits?.enable) return;

  const price = plan.prices.find((p) => p.priceId === priceId);
  const isYearly = price?.interval === PlanIntervals.YEAR;
  const credits = isYearly ? plan.credits.amount * 12 : plan.credits.amount;

  await resetPeriodicCredits({
    userId,
    credits,
    creditType: CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL,
    label: 'Subscription renewal credits',
  });
}

/**
 * Supplement credits when user upgrades subscription.
 * Adds the difference between new and old plan credits to subscriptionBalance.
 */
export async function addUpgradeCredits({
  userId,
  oldPriceId,
  newPriceId,
}: {
  userId: string;
  oldPriceId: string;
  newPriceId: string;
}) {
  const oldPlan = findPlanByPriceId(oldPriceId);
  const newPlan = findPlanByPriceId(newPriceId);

  if (!oldPlan?.credits?.enable || !newPlan?.credits?.enable) return;

  const oldPrice = oldPlan.prices.find((p) => p.priceId === oldPriceId);
  const newPrice = newPlan.prices.find((p) => p.priceId === newPriceId);

  const oldIsYearly = oldPrice?.interval === PlanIntervals.YEAR;
  const newIsYearly = newPrice?.interval === PlanIntervals.YEAR;

  const oldCredits = oldIsYearly
    ? oldPlan.credits.amount * 12
    : oldPlan.credits.amount;
  const newCredits = newIsYearly
    ? newPlan.credits.amount * 12
    : newPlan.credits.amount;

  const difference = newCredits - oldCredits;
  if (difference <= 0) return;

  const db = await getDb();
  await db.transaction(async (tx) => {
    await getOrCreateUserCredit(userId, tx);

    await tx
      .update(userCredit)
      .set({
        subscriptionBalance: sql`${userCredit.subscriptionBalance} + ${difference}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      type: CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_UPGRADE,
      amount: difference,
      description: `Subscription upgrade: +${difference} credits (${oldPlan.id} → ${newPlan.id})`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  console.log(
    `addUpgradeCredits, +${difference} credits for user ${userId} (${oldPlan.id} → ${newPlan.id})`
  );
}

export async function addLifetimeMonthlyCredits(
  userId: string,
  priceId: string
) {
  const plan = findPlanByPriceId(priceId);
  if (!plan?.isLifetime || plan.disabled || !plan.credits?.enable) return;

  await resetPeriodicCredits({
    userId,
    credits: plan.credits.amount,
    creditType: CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY,
    label: 'Lifetime monthly credits',
  });
}

// ─── Deprecated ───────────────────────────────────────────────────

/**
 * @deprecated Use lockCredits + confirmCreditsDeduction instead.
 * Kept for backward compatibility with test card.
 */
export async function consumeCredits({
  userId,
  amount,
  description,
}: {
  userId: string;
  amount: number;
  description: string;
}) {
  if (amount <= 0) throw new Error('consumeCredits: amount must be positive');

  const db = await getDb();
  await db.transaction(async (tx) => {
    const credit = await getOrCreateUserCredit(userId, tx);
    validateCreditBalances(credit);

    const available = computeAvailable(credit);
    if (available < amount) throw new Error('Insufficient credits');

    const breakdown = computeConsumptionBreakdown(
      credit.subscriptionBalance ?? 0,
      amount
    );
    const metadata: CreditTransactionMetadata = breakdown;

    await tx
      .update(userCredit)
      .set({
        subscriptionBalance: sql`${userCredit.subscriptionBalance} - ${breakdown.fromSubscription}`,
        balance: sql`${userCredit.balance} - ${breakdown.fromBalance}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredit.userId, userId));

    await tx.insert(creditTransaction).values({
      id: randomUUID(),
      userId,
      type: CREDIT_TRANSACTION_TYPE.USAGE,
      amount: -amount,
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
}
