/**
 * Seed script — idempotent, safe to run multiple times.
 *
 * Creates test accounts for AI (Claude Code) to authenticate via email/password.
 * Bypasses email verification by directly setting emailVerified = true.
 * Generates a test API key for agent API access.
 *
 * Run: pnpm db:seed
 */
import { createHash, randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import postgres from 'postgres';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;
const DATABASE_URL = process.env.DATABASE_URL!;

const TEST_ACCOUNTS = [
  {
    email: 'test@yino.dev',
    password: 'test-password-123',
    name: 'Test User',
  },
];

async function seed() {
  const client = postgres(DATABASE_URL);

  console.log('Seeding test accounts...');

  for (const account of TEST_ACCOUNTS) {
    const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: BASE_URL,
      },
      body: JSON.stringify(account),
    });

    if (res.ok) {
      console.log(`  Created: ${account.email}`);
    } else {
      const body = await res.json().catch(() => null);
      console.log(
        `  Skipped: ${account.email} (${body?.message ?? res.status})`
      );
    }

    await client`
      UPDATE "user" SET email_verified = true
      WHERE email = ${account.email} AND email_verified = false
    `;
    console.log(`  Verified: ${account.email} (emailVerified = true)`);
  }

  // Seed API key for test user
  console.log('\nSeeding API key...');

  const [testUser] = await client`
    SELECT id FROM "user" WHERE email = ${TEST_ACCOUNTS[0].email} LIMIT 1
  `;

  if (!testUser) {
    console.log('  Skipped: test user not found');
    await client.end();
    console.log('Done.');
    return;
  }

  const userId = testUser.id;

  // Check if a test API key already exists
  const [existingKey] = await client`
    SELECT key_prefix FROM "api_key"
    WHERE user_id = ${userId} AND name = 'seed-test-key' AND revoked_at IS NULL
    LIMIT 1
  `;

  if (existingKey) {
    console.log(
      `  Skipped: API key already exists (prefix: ${existingKey.key_prefix}...)`
    );
    console.log('  To regenerate, revoke the existing key and re-run seed.');
  } else {
    const raw = randomBytes(24).toString('base64url');
    const key = `yino_${raw}`;
    const keyHash = createHash('sha256').update(key).digest('hex');
    const keyPrefix = key.slice(0, 12);
    const id = nanoid();
    const now = new Date();

    await client`
      INSERT INTO "api_key" (id, user_id, key_hash, key_prefix, name, created_at)
      VALUES (${id}, ${userId}, ${keyHash}, ${keyPrefix}, ${'seed-test-key'}, ${now})
    `;

    console.log('  Created API key (save this — it will NOT be shown again):');
    console.log(`\n  ████████████████████████████████████████`);
    console.log(`  ${key}`);
    console.log(`  ████████████████████████████████████████\n`);
  }

  await client.end();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
