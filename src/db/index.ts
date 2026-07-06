import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // During build time or if env is missing, we shouldn't crash unless we actually try to query
  console.warn('DATABASE_URL is not set. Database queries will fail.');
}

const client = postgres(connectionString || '', { prepare: false });
export const db = drizzle(client, { schema });
