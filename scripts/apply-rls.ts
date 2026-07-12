/**
 * Script to apply Row Level Security (RLS) and policies to all remaining tables
 * to resolve security issues and clear the Supabase warnings.
 *
 * Run with: npx tsx --env-file=.env.local scripts/apply-rls.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL not found. Run with: npx tsx --env-file=.env.local scripts/apply-rls.ts');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

async function applyRLS() {
  console.log('Enabling Row Level Security (RLS) on remaining tables...\n');

  try {
    // 1. Enable RLS on all tables
    const tablesToEnable = [
      'simulations',
      'devil_advocate_reports',
      'problem_upvotes',
      'solution_ratings',
      'problem_comments',
      'workspaces',
      'workspace_members',
      'workspace_messages'
    ];

    for (const table of tablesToEnable) {
      await db.execute(sql.raw(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
      console.log(`✓ RLS enabled on public.${table}`);
    }

    console.log('\nApplying policies...\n');

    // --- Simulations Policies ---
    await db.execute(sql`DROP POLICY IF EXISTS "Allow select simulations associated with owned or guest solutions" ON public.simulations`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow insert simulations associated with owned or guest solutions" ON public.simulations`);
    
    await db.execute(sql`
      CREATE POLICY "Allow select simulations associated with owned or guest solutions"
        ON public.simulations FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = simulations.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);
    await db.execute(sql`
      CREATE POLICY "Allow insert simulations associated with owned or guest solutions"
        ON public.simulations FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = simulations.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);
    console.log('✓ Policies applied for public.simulations');

    // --- Devil Advocate Reports Policies ---
    await db.execute(sql`DROP POLICY IF EXISTS "Allow select devil_advocate_reports associated with owned or guest solutions" ON public.devil_advocate_reports`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow insert devil_advocate_reports associated with owned or guest solutions" ON public.devil_advocate_reports`);

    await db.execute(sql`
      CREATE POLICY "Allow select devil_advocate_reports associated with owned or guest solutions"
        ON public.devil_advocate_reports FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = devil_advocate_reports.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);
    await db.execute(sql`
      CREATE POLICY "Allow insert devil_advocate_reports associated with owned or guest solutions"
        ON public.devil_advocate_reports FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = devil_advocate_reports.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);
    console.log('✓ Policies applied for public.devil_advocate_reports');

    // --- Problem Upvotes Policies ---
    await db.execute(sql`DROP POLICY IF EXISTS "Allow authenticated users to read upvotes" ON public.problem_upvotes`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow users to manage their own upvotes" ON public.problem_upvotes`);

    await db.execute(sql`
      CREATE POLICY "Allow authenticated users to read upvotes"
        ON public.problem_upvotes FOR SELECT
        TO authenticated
        USING (true)
    `);
    await db.execute(sql`
      CREATE POLICY "Allow users to manage their own upvotes"
        ON public.problem_upvotes FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    `);
    console.log('✓ Policies applied for public.problem_upvotes');

    // --- Solution Ratings Policies ---
    await db.execute(sql`DROP POLICY IF EXISTS "Allow authenticated users to read ratings" ON public.solution_ratings`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow users to manage their own ratings" ON public.solution_ratings`);

    await db.execute(sql`
      CREATE POLICY "Allow authenticated users to read ratings"
        ON public.solution_ratings FOR SELECT
        TO authenticated
        USING (true)
    `);
    await db.execute(sql`
      CREATE POLICY "Allow users to manage their own ratings"
        ON public.solution_ratings FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    `);
    console.log('✓ Policies applied for public.solution_ratings');

    // --- Problem Comments Policies ---
    await db.execute(sql`DROP POLICY IF EXISTS "Allow anyone to read comments" ON public.problem_comments`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow authenticated users to manage their own comments" ON public.problem_comments`);

    await db.execute(sql`
      CREATE POLICY "Allow anyone to read comments"
        ON public.problem_comments FOR SELECT
        USING (true)
    `);
    await db.execute(sql`
      CREATE POLICY "Allow authenticated users to manage their own comments"
        ON public.problem_comments FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    `);
    console.log('✓ Policies applied for public.problem_comments');

    // --- Workspaces Policies ---
    await db.execute(sql`DROP POLICY IF EXISTS "Allow owners and members to select workspaces" ON public.workspaces`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow owners to update workspaces" ON public.workspaces`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow owners to delete workspaces" ON public.workspaces`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow authenticated users to insert workspaces" ON public.workspaces`);

    await db.execute(sql`
      CREATE POLICY "Allow owners and members to select workspaces"
        ON public.workspaces FOR SELECT
        USING (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.workspace_members m
            WHERE m.workspace_id = workspaces.id
            AND m.user_id = auth.uid()
          )
        )
    `);
    await db.execute(sql`
      CREATE POLICY "Allow owners to update workspaces"
        ON public.workspaces FOR UPDATE
        USING (owner_id = auth.uid())
        WITH CHECK (owner_id = auth.uid())
    `);
    await db.execute(sql`
      CREATE POLICY "Allow owners to delete workspaces"
        ON public.workspaces FOR DELETE
        USING (owner_id = auth.uid())
    `);
    await db.execute(sql`
      CREATE POLICY "Allow authenticated users to insert workspaces"
        ON public.workspaces FOR INSERT
        TO authenticated
        WITH CHECK (owner_id = auth.uid())
    `);
    console.log('✓ Policies applied for public.workspaces');

    // --- Workspace Members Policies ---
    await db.execute(sql`DROP POLICY IF EXISTS "Allow users to view their own memberships" ON public.workspace_members`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow owners to manage workspace members" ON public.workspace_members`);

    await db.execute(sql`
      CREATE POLICY "Allow users to view their own memberships"
        ON public.workspace_members FOR SELECT
        USING (user_id = auth.uid())
    `);
    await db.execute(sql`
      CREATE POLICY "Allow owners to manage workspace members"
        ON public.workspace_members FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_members.workspace_id
            AND w.owner_id = auth.uid()
          )
        )
    `);
    console.log('✓ Policies applied for public.workspace_members');

    // --- Workspace Messages Policies (Ensure standard policies are active) ---
    await db.execute(sql`DROP POLICY IF EXISTS "workspace_members_read_messages" ON public.workspace_messages`);
    await db.execute(sql`DROP POLICY IF EXISTS "workspace_members_insert_messages" ON public.workspace_messages`);

    await db.execute(sql`
      CREATE POLICY "workspace_members_read_messages" ON public.workspace_messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.workspace_members m
          WHERE m.workspace_id = workspace_messages.workspace_id
          AND m.user_id = auth.uid()
        )
      )
    `);
    await db.execute(sql`
      CREATE POLICY "workspace_members_insert_messages" ON public.workspace_messages
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.workspace_members m
          WHERE m.workspace_id = workspace_messages.workspace_id
          AND m.user_id = auth.uid()
        )
      )
    `);
    console.log('✓ Policies applied/verified for public.workspace_messages');

    console.log('\n🎉 RLS application successful!\n');

  } catch (err: any) {
    console.error('\n❌ Failed to apply RLS and policies:', err?.message || err);
    await client.end();
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

applyRLS();
