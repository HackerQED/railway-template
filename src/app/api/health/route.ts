import { getDb } from '@/db/index';
import { user } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<
    string,
    { status: string; latencyMs?: number; error?: string }
  > = {};

  const db = await getDb();

  // Check database connectivity
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      error: e instanceof Error ? e.message : 'unknown',
    };
  }

  // Check if seed data exists (test user present)
  try {
    const users = await db.select({ id: user.id }).from(user).limit(1);
    checks.seed = {
      status: users.length > 0 ? 'ok' : 'empty',
    };
  } catch {
    checks.seed = { status: 'skipped' };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
