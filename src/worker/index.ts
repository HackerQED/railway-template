import { getDb } from '@/db';
import { generation } from '@/db/schema';
import { isMocked } from '@/lib/mock';
import { inArray } from 'drizzle-orm';
import { pollOnce } from './poll';

const POLL_INTERVAL = 1000;
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

let pollCount = 0;
let lastHeartbeat = Date.now();

async function logHeartbeat() {
  const db = await getDb();
  const tasks = await db
    .select({ status: generation.status })
    .from(generation)
    .where(inArray(generation.status, ['pending', 'processing']));

  const pending = tasks.filter((t) => t.status === 'pending').length;
  const processing = tasks.filter((t) => t.status === 'processing').length;

  const uptime = Math.round((Date.now() - startedAt) / 60000);
  console.log(
    `[worker] ♥ alive for ${uptime}min | polls: ${pollCount} | pending: ${pending}, processing: ${processing}`
  );
}

const startedAt = Date.now();

async function main() {
  console.log('[worker] Starting generation worker...');
  if (isMocked()) console.log('[worker] Mock mode: ON');

  console.log(
    `[worker] Polling every ${POLL_INTERVAL / 1000}s, heartbeat every ${HEARTBEAT_INTERVAL / 60000}min. Press Ctrl+C to stop.`
  );

  async function pollLoop() {
    try {
      await pollOnce();
      pollCount++;
    } catch (err) {
      console.error('[worker] pollOnce error:', err);
    }

    // Periodic heartbeat
    if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL) {
      lastHeartbeat = Date.now();
      logHeartbeat().catch((err) =>
        console.error('[worker] heartbeat error:', err)
      );
    }

    setTimeout(pollLoop, POLL_INTERVAL);
  }

  // Log first heartbeat immediately
  await logHeartbeat();
  pollLoop();
}

process.on('SIGINT', () => {
  console.log('[worker] Received SIGINT. Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[worker] Received SIGTERM. Shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[worker] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[worker] Unhandled rejection:', reason);
  process.exit(1);
});

main().catch((err) => {
  console.error('[worker] Failed to start:', err);
  process.exit(1);
});
