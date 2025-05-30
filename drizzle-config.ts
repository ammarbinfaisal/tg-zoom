import type { Config } from 'drizzle-kit';
import "dotenv/config";

export default {
  schema: './web/src/lib/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:zoom_bot.db',
  },
} satisfies Config;
