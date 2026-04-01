/**
 * Credit transaction type enum
 *
 * Earn types (positive amount):
 * - REGISTER_GIFT: one-time signup bonus → balance
 * - PURCHASE_PACKAGE: credit package purchase → balance
 * - SUBSCRIPTION_RENEWAL: subscription renewal credits → subscriptionBalance (reset)
 * - SUBSCRIPTION_RESET: monthly reset of subscription credits → subscriptionBalance
 * - LIFETIME_MONTHLY: lifetime plan monthly credits → subscriptionBalance (reset)
 * - MONTHLY_REFRESH: free plan monthly credits → subscriptionBalance (reset)
 *
 * Spend types (negative amount):
 * - USAGE: actual credit consumption (confirmed)
 * - PENDING: credits locked for in-progress generation
 * - PENDING_CANCEL: release of locked credits (on success or failure)
 *
 * Lifecycle types:
 * - SUBSCRIPTION_EXPIRE: subscription ended, subscriptionBalance zeroed out
 */
export enum CREDIT_TRANSACTION_TYPE {
  // Earn types
  MONTHLY_REFRESH = 'MONTHLY_REFRESH',
  REGISTER_GIFT = 'REGISTER_GIFT',
  PURCHASE_PACKAGE = 'PURCHASE_PACKAGE',
  SUBSCRIPTION_RENEWAL = 'SUBSCRIPTION_RENEWAL',
  SUBSCRIPTION_RESET = 'SUBSCRIPTION_RESET',
  SUBSCRIPTION_UPGRADE = 'SUBSCRIPTION_UPGRADE',
  LIFETIME_MONTHLY = 'LIFETIME_MONTHLY',

  // Spend types (pre-deduction flow)
  USAGE = 'USAGE',
  PENDING = 'PENDING',
  PENDING_CANCEL = 'PENDING_CANCEL',

  // Lifecycle types
  SUBSCRIPTION_EXPIRE = 'SUBSCRIPTION_EXPIRE',
}

/**
 * Credit transaction metadata for tracking balance breakdown
 */
export interface CreditTransactionMetadata {
  fromSubscription?: number;
  fromBalance?: number;
}

/**
 * Credit package price
 */
export interface CreditPackagePrice {
  priceId: string;                   // Stripe price ID (not product id)
  amount: number;                    // Price amount in currency units (dollars, euros, etc.)
  currency: string;                  // Currency code (e.g., USD)
  allowPromotionCode?: boolean;      // Whether to allow promotion code for this price
}

/**
 * Credit package
 */
export interface CreditPackage {
  id: string;                          // Unique identifier for the package
  amount: number;                      // Amount of credits in the package
  price: CreditPackagePrice;           // Price of the package
  popular: boolean;                    // Whether the package is popular
  name?: string;                       // Display name of the package
  description?: string;                // Description of the package
  disabled?: boolean;                  // Whether the package is disabled in the UI
}

/**
 * Credit balance info returned to clients
 */
export interface CreditBalance {
  balance: number;              // purchased credits
  subscriptionBalance: number;  // subscription/lifetime credits
  pendingBalance: number;       // locked credits
  available: number;            // total available (balance + subscriptionBalance - pendingBalance)
}

/**
 * Credit transaction
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  type: string;
  description: string | null;
  amount: number;
  paymentId: string | null;
  generationId: string | null;
  metadata: CreditTransactionMetadata | unknown;
  createdAt: Date;
  updatedAt: Date;
}
