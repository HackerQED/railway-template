import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import {
  getTransactionTypeIcon,
  getTransactionTypeLabelKey,
} from '@/credits/transaction-display';
import type { CreditTransaction } from '@/credits/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDate } from '@/lib/formatter';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

interface CreditDetailViewerProps {
  transaction: CreditTransaction;
}

export function CreditDetailViewer({ transaction }: CreditDetailViewerProps) {
  const t = useTranslations('Dashboard.settings.credits.transactions');
  const isMobile = useIsMobile();

  const displayName = (type: string) => {
    const key = getTransactionTypeLabelKey(type);
    return key ? t(key as never) : type;
  };

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="cursor-pointer text-foreground w-fit px-3 text-left h-auto"
        >
          <span
            className={`font-medium ${
              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {transaction.amount > 0 ? '+' : ''}
            {transaction.amount.toLocaleString()}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('detailViewer.title')}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="hover:bg-accent transition-colors"
              >
                {getTransactionTypeIcon(transaction.type)}
                {displayName(transaction.type)}
              </Badge>
            </div>

            <div className="grid gap-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t('columns.amount')}:
                </span>
                <span
                  className={`font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount.toLocaleString()}
                </span>
              </div>

              {transaction.description && (
                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs">
                    {t('columns.description')}:
                  </span>
                  <span className="break-words">{transaction.description}</span>
                </div>
              )}

              {transaction.paymentId && (
                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs">
                    {t('columns.paymentId')}:
                  </span>
                  <span
                    className="font-mono text-sm cursor-pointer hover:bg-accent px-2 py-1 rounded border break-all"
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.paymentId!);
                      toast.success(t('paymentIdCopied'));
                    }}
                  >
                    {transaction.paymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t('columns.createdAt')}:
              </span>
              <span>{formatDate(transaction.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t('columns.updatedAt')}:
              </span>
              <span>{formatDate(transaction.updatedAt)}</span>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="cursor-pointer">
              {t('detailViewer.close')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
