import {
  BanknoteIcon,
  ClockIcon,
  CoinsIcon,
  GemIcon,
  GiftIcon,
  HandCoinsIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import { CREDIT_TRANSACTION_TYPE } from './types';

const TRANSACTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  [CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH]: (
    <HandCoinsIcon className="h-5 w-5" />
  ),
  [CREDIT_TRANSACTION_TYPE.REGISTER_GIFT]: <GiftIcon className="h-5 w-5" />,
  [CREDIT_TRANSACTION_TYPE.PURCHASE_PACKAGE]: (
    <ShoppingCartIcon className="h-5 w-5" />
  ),
  [CREDIT_TRANSACTION_TYPE.USAGE]: <CoinsIcon className="h-5 w-5" />,
  [CREDIT_TRANSACTION_TYPE.PENDING]: <ClockIcon className="h-5 w-5" />,
  [CREDIT_TRANSACTION_TYPE.PENDING_CANCEL]: <ClockIcon className="h-5 w-5" />,
  [CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL]: (
    <BanknoteIcon className="h-5 w-5" />
  ),
  [CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RESET]: (
    <BanknoteIcon className="h-5 w-5" />
  ),
  [CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_EXPIRE]: (
    <ClockIcon className="h-5 w-5" />
  ),
  [CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY]: <GemIcon className="h-5 w-5" />,
};

const TRANSACTION_TYPE_LABEL_KEYS: Record<string, string> = {
  [CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH]: 'types.MONTHLY_REFRESH',
  [CREDIT_TRANSACTION_TYPE.REGISTER_GIFT]: 'types.REGISTER_GIFT',
  [CREDIT_TRANSACTION_TYPE.PURCHASE_PACKAGE]: 'types.PURCHASE',
  [CREDIT_TRANSACTION_TYPE.USAGE]: 'types.USAGE',
  [CREDIT_TRANSACTION_TYPE.PENDING]: 'types.PENDING',
  [CREDIT_TRANSACTION_TYPE.PENDING_CANCEL]: 'types.PENDING_CANCEL',
  [CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RENEWAL]: 'types.SUBSCRIPTION_RENEWAL',
  [CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_RESET]: 'types.SUBSCRIPTION_RESET',
  [CREDIT_TRANSACTION_TYPE.SUBSCRIPTION_EXPIRE]: 'types.SUBSCRIPTION_EXPIRE',
  [CREDIT_TRANSACTION_TYPE.LIFETIME_MONTHLY]: 'types.LIFETIME_MONTHLY',
};

export function getTransactionTypeIcon(type: string): React.ReactNode {
  return TRANSACTION_TYPE_ICONS[type] ?? null;
}

export function getTransactionTypeLabelKey(type: string): string | undefined {
  return TRANSACTION_TYPE_LABEL_KEYS[type];
}
