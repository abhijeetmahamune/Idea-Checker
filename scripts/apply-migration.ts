/**
 * Wave 2B migration — applies schema changes for problemUpvotes, solutionRatings, solutions.deep_report
 * Run with: npx tsx --env-file=.env.local scripts/apply-migration.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found. Run with: npx tsx --env-file=.env.local scripts/apply-migration.ts');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

async function applyMigration() {
  console.log('Applying Wave 2B migration...\n');

  try {
    // 1. Add deep_report column to solutions
    await db.execute(sql`ALTER TABLE solutions ADD COLUMN IF NOT EXISTS deep_report jsonb`);
    console.log('✓ solutions.deep_report column ready');

    // 2. Create problem_upvotes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS problem_upvotes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE cascade,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    console.log('✓ problem_upvotes table ready');

    // 3. Unique constraint on problem_upvotes
    try {
      await db.execute(sql`
        ALTER TABLE problem_upvotes
          ADD CONSTRAINT problem_upvotes_unique UNIQUE (problem_id, user_id)
      `);
      console.log('✓ problem_upvotes unique constraint added');
    } catch { console.log('✓ problem_upvotes unique constraint already exists'); }

    // 4. Create solution_ratings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS solution_ratings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        solution_id uuid NOT NULL REFERENCES solutions(id) ON DELETE cascade,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
        rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    console.log('✓ solution_ratings table ready');

    // 5. Unique constraint on solution_ratings
    try {
      await db.execute(sql`
        ALTER TABLE solution_ratings
          ADD CONSTRAINT solution_ratings_unique UNIQUE (solution_id, user_id)
      `);
      console.log('✓ solution_ratings unique constraint added');
    } catch { console.log('✓ solution_ratings unique constraint already exists'); }

    // Verify
    const cols = await db.execute(sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE (table_name = 'solutions' AND column_name = 'deep_report')
    `);
    const tables = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('problem_upvotes', 'solution_ratings')
    `);

    console.log('\n✅ Verified columns:', cols.map((r: any) => `${r.table_name}.${r.column_name}`).join(', '));
    console.log('✅ Verified tables:', tables.map((r: any) => r.table_name).join(', '));
    console.log('\n🎉 Wave 2B migration complete!\n');

  } catch (err: any) {
    console.error('\n❌ Migration failed:', err?.message || err);
    await client.end();
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

applyMigration();
