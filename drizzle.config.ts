import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local for local migrations
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is missing from environment. Drizzle migrations may not work.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
