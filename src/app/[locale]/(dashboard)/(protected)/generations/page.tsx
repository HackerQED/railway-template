import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { constructMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/server';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import type { GenerationItem } from './generations-view';
import { GenerationsView } from './generations-view';

export const metadata = constructMetadata({
  title: 'Creation History - yino.ai',
  description: 'View and manage all your AI generations.',
  noIndex: true,
});

const INITIAL_PAGE_SIZE = 20;

export default async function GenerationsPage() {
  const session = await getSession();
  if (!session?.user) redirect('/?loginRequired=true');

  const db = await getDb();
  const rows = await db
    .select({
      id: generation.id,
      type: generation.type,
      generatorId: generation.generatorId,
      status: generation.status,
      input: generation.input,
      output: generation.output,
      error: generation.error,
      comment: generation.comment,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt,
    })
    .from(generation)
    .where(eq(generation.userId, session.user.id))
    .orderBy(desc(generation.createdAt))
    .limit(INITIAL_PAGE_SIZE + 1);

  // Serialize for client component (Date → string, unknown → typed)
  const items: GenerationItem[] = rows.map((r) => ({
    ...r,
    input: (r.input as GenerationItem['input']) ?? null,
    output: (r.output as GenerationItem['output']) ?? null,
    error: (r.error as GenerationItem['error']) ?? null,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  const hasMore = items.length > INITIAL_PAGE_SIZE;
  const initialItems = hasMore ? items.slice(0, INITIAL_PAGE_SIZE) : items;
  const nextCursor = hasMore
    ? initialItems[initialItems.length - 1].createdAt
    : null;

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Creation History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all your AI generations
        </p>
      </div>
      <GenerationsView
        initialItems={initialItems}
        initialNextCursor={nextCursor}
      />
    </div>
  );
}
