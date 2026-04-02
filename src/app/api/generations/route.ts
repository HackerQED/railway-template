import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { getSession } from '@/lib/server';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const cursor = params.get('cursor');
  const model = params.get('model');
  const status = params.get('status');
  const search = params.get('search');

  const conditions = [eq(generation.userId, session.user.id)];

  if (cursor) {
    conditions.push(lt(generation.createdAt, new Date(cursor)));
  }
  if (model) {
    conditions.push(eq(generation.generatorId, model));
  }
  if (status) {
    conditions.push(eq(generation.status, status));
  }
  if (search) {
    conditions.push(
      sql`${generation.input}->>'prompt' ILIKE ${'%' + search + '%'}`
    );
  }

  const db = await getDb();
  const items = await db
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
    .where(and(...conditions))
    .orderBy(desc(generation.createdAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = items.length > PAGE_SIZE;
  const results = hasMore ? items.slice(0, PAGE_SIZE) : items;
  const nextCursor = hasMore
    ? results[results.length - 1].createdAt.toISOString()
    : null;

  return NextResponse.json({ items: results, nextCursor });
}
