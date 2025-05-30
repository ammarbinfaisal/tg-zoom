import type { Config } from 'drizzle-kit';
import "dotenv/config";

import path from 'path';

export default {
  schema: './web/src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || `file:${path.resolve(__dirname, 'zoom_bot.db')}`,
  },
} satisfies Config;
