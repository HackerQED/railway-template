'use client';

import { getSortingStateParser } from '@/components/data-table/lib/parsers';
import type { ExtendedColumnSort } from '@/components/data-table/types/data-table';
import BillingCard from '@/components/settings/billing/billing-card';
import { CreditTransactionsTable } from '@/components/settings/credits/credit-transactions-table';
import CreditsCard from '@/components/settings/credits/credits-card';
import type { CreditTransaction } from '@/credits/types';
import { useCreditTransactions } from '@/hooks/use-credits';
import { authClient } from '@/lib/auth-client';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useEffect, useMemo, useRef } from 'react';

/**
 * Credits page client, show credit balance, billing, and transactions
 */
export default function CreditsPageClient() {
  const t = useTranslations('Dashboard.settings.credits');

  // Get user session for user ID
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;

  const sortableColumnIds = useMemo<
    Array<Extract<keyof CreditTransaction, string>>
  >(
    () => [
      'type',
      'amount',
      'description',
      'paymentId',
      'createdAt',
      'updatedAt',
    ],
    []
  );

  const sortableColumnSet = useMemo(
    () => new Set<Extract<keyof CreditTransaction, string>>(sortableColumnIds),
    [sortableColumnIds]
  );

  const defaultSorting = useMemo<ExtendedColumnSort<CreditTransaction>[]>(
    () => [{ id: 'createdAt', desc: true }],
    []
  );

  const [{ page, size, search, sort, type }, setQueryStates] = useQueryStates({
    page: parseAsIndex.withDefault(0),
    size: parseAsInteger.withDefault(10),
    search: parseAsString.withDefault(''),
    sort: getSortingStateParser<CreditTransaction>(
      sortableColumnIds
    ).withDefault(defaultSorting),
    type: parseAsString.withDefault(''),
  });

  // normalize sorting to ensure it only contains valid column ids
  const normalizeSorting = (
    value: SortingState
  ): ExtendedColumnSort<CreditTransaction>[] => {
    const filtered = value
      .filter((item) =>
        sortableColumnSet.has(
          item.id as Extract<keyof CreditTransaction, string>
        )
      )
      .map((item) => ({
        ...item,
        id: item.id as Extract<keyof CreditTransaction, string>,
      })) as ExtendedColumnSort<CreditTransaction>[];

    return filtered.length > 0 ? filtered : defaultSorting;
  };

  const safeSorting = normalizeSorting(sort);

  // Build filters for both client UI and server API
  const filters = useMemo(() => {
    const clientFilters: ColumnFiltersState = [];
    const serverFilters: Array<{ id: string; value: string }> = [];

    if (type) {
      clientFilters.push({ id: 'type', value: [type] });
      serverFilters.push({ id: 'type', value: type });
    }

    return { clientFilters, serverFilters };
  }, [type]);

  const filtersSignature = useMemo(() => JSON.stringify({ type }), [type]);

  const previousFiltersSignatureRef = useRef(filtersSignature);

  // reset page to 0 when filters change
  useEffect(() => {
    if (previousFiltersSignatureRef.current === filtersSignature) return;
    previousFiltersSignatureRef.current = filtersSignature;
    void setQueryStates(
      { page: 0 },
      {
        history: 'replace',
        shallow: true,
      }
    );
  }, [filtersSignature, setQueryStates]);

  // Fetch credit transactions data
  const { data, isLoading } = useCreditTransactions(
    currentUser?.id,
    page,
    size,
    search,
    safeSorting,
    filters.serverFilters
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Credits Balance + Billing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CreditsCard />
        <BillingCard />
      </div>

      {/* Credit Transactions */}
      <div>
        <h3 className="text-base font-semibold mb-4">
          {t('transactions.title')}
        </h3>
        <CreditTransactionsTable
          data={data?.items || []}
          total={data?.total || 0}
          pageIndex={page}
          pageSize={size}
          search={search}
          sorting={safeSorting}
          filters={filters.clientFilters}
          loading={isLoading}
          onSearch={(newSearch) =>
            setQueryStates({ search: newSearch, page: 0 })
          }
          onPageChange={(newPageIndex) =>
            setQueryStates({ page: newPageIndex })
          }
          onPageSizeChange={(newPageSize) =>
            setQueryStates({ size: newPageSize, page: 0 })
          }
          onSortingChange={(newSorting) => {
            const nextSorting = normalizeSorting(newSorting);
            setQueryStates({ sort: nextSorting, page: 0 });
          }}
          onFiltersChange={(nextFilters) => {
            const typeFilter = nextFilters.find(
              (filter) => filter.id === 'type'
            );
            const nextType =
              typeFilter && Array.isArray(typeFilter.value)
                ? ((typeFilter.value[0] as string) ?? '')
                : '';
            setQueryStates(
              { type: nextType, page: 0 },
              { history: 'replace', shallow: true }
            );
          }}
        />
      </div>
    </div>
  );
}
