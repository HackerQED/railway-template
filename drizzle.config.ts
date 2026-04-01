import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

// Load Next.js environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

/**
 * https://orm.drizzle.team/docs/get-started/neon-new#step-5---setup-drizzle-config-file
 */
export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // LangGraph checkpointer creates its own tables at runtime;
  // exclude them so drizzle-kit doesn't try to drop them.
  tablesFilter: ['!checkpoint*'],
});
