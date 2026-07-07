/**
 * Wave 2C migration — applies schema changes for:
 * - solutions.is_merged + solutions.merged_from_ids
 * - problem_comments table
 * - workspaces, workspace_members, workspace_messages tables
 * - RLS policies for workspace_messages (Supabase Realtime)
 * - Realtime publication for workspace_messages
 *
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
  console.log('Applying Wave 2C migration...\n');

  try {
    // ── Wave 2B columns (idempotent) ────────────────────────────────────────────
    await db.execute(sql`ALTER TABLE solutions ADD COLUMN IF NOT EXISTS deep_report jsonb`);
    console.log('✓ solutions.deep_report ready');

    // ── Wave 2C solution columns ────────────────────────────────────────────────
    await db.execute(sql`ALTER TABLE solutions ADD COLUMN IF NOT EXISTS is_merged boolean NOT NULL DEFAULT false`);
    console.log('✓ solutions.is_merged ready');

    await db.execute(sql`ALTER TABLE solutions ADD COLUMN IF NOT EXISTS merged_from_ids text[]`);
    console.log('✓ solutions.merged_from_ids ready');

    // ── problem_comments ────────────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS problem_comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE cascade,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
        content text NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    console.log('✓ problem_comments table ready');

    // ── workspaces ──────────────────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspaces (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE cascade,
        owner_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
        name text NOT NULL,
        invite_code text UNIQUE NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    console.log('✓ workspaces table ready');

    // ── workspace_members ───────────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE cascade,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
        role text NOT NULL DEFAULT 'viewer',
        joined_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    try {
      await db.execute(sql`
        ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_unique UNIQUE (workspace_id, user_id)
      `);
    } catch { /* already exists */ }
    console.log('✓ workspace_members table ready');

    // ── workspace_messages ──────────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspace_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE cascade,
        user_id uuid REFERENCES users(id) ON DELETE set null,
        sender_name text NOT NULL DEFAULT 'Unknown',
        content text NOT NULL,
        type text NOT NULL DEFAULT 'text',
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    console.log('✓ workspace_messages table ready');

    // ── Wave 2B tables (idempotent) ─────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS problem_upvotes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE cascade,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `);
    try { await db.execute(sql`ALTER TABLE problem_upvotes ADD CONSTRAINT problem_upvotes_unique UNIQUE (problem_id, user_id)`); } catch {}

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
    try { await db.execute(sql`ALTER TABLE solution_ratings ADD CONSTRAINT solution_ratings_unique UNIQUE (solution_id, user_id)`); } catch {}
    console.log('✓ Wave 2B tables ready');

    // ── RLS policies for Supabase Realtime on workspace_messages ───────────────
    await db.execute(sql`ALTER TABLE workspace_messages ENABLE ROW LEVEL SECURITY`);

    // Drop existing policies first (idempotent)
    await db.execute(sql`DROP POLICY IF EXISTS "workspace_members_read_messages" ON workspace_messages`);
    await db.execute(sql`DROP POLICY IF EXISTS "workspace_members_insert_messages" ON workspace_messages`);

    await db.execute(sql`
      CREATE POLICY "workspace_members_read_messages" ON workspace_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = workspace_messages.workspace_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    `);

    await db.execute(sql`
      CREATE POLICY "workspace_members_insert_messages" ON workspace_messages
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = workspace_messages.workspace_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    `);
    console.log('✓ RLS policies for workspace_messages applied');

    // ── Enable Realtime publication ─────────────────────────────────────────────
    try {
      await db.execute(sql`ALTER PUBLICATION supabase_realtime ADD TABLE workspace_messages`);
      console.log('✓ workspace_messages added to supabase_realtime publication');
    } catch (e: any) {
      // Already in publication
      console.log('✓ workspace_messages already in supabase_realtime publication');
    }

    // ── Verify ──────────────────────────────────────────────────────────────────
    const tables = await db.execute(sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('problem_comments', 'workspaces', 'workspace_members', 'workspace_messages', 'problem_upvotes', 'solution_ratings')
      AND table_schema = 'public'
    `);
    console.log('\n✅ Verified tables:', tables.map((r: any) => r.table_name).join(', '));
    console.log('\n🎉 Wave 2C migration complete!\n');

  } catch (err: any) {
    console.error('\n❌ Migration failed:', err?.message || err);
    await client.end();
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

applyMigration();
