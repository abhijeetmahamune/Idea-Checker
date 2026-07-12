/**
 * Script to apply RLS and policies for new tables (deep_reports, ai_requests, attachments)
 *
 * Run with: npx tsx --env-file=.env.local scripts/apply-new-rls.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

async function run() {
  console.log('Applying RLS for new tables...');
  try {
    // 1. Enable RLS
    const tables = ['deep_reports', 'ai_requests', 'attachments'];
    for (const t of tables) {
      await db.execute(sql.raw(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`));
      console.log(`✓ RLS enabled on ${t}`);
    }

    // 2. Apply policies
    // Deep Reports
    await db.execute(sql`DROP POLICY IF EXISTS "Allow select deep_reports associated with owned or guest solutions" ON public.deep_reports`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow insert deep_reports associated with owned or guest solutions" ON public.deep_reports`);
    
    await db.execute(sql`
      CREATE POLICY "Allow select deep_reports associated with owned or guest solutions"
        ON public.deep_reports FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = deep_reports.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);
    
    await db.execute(sql`
      CREATE POLICY "Allow insert deep_reports associated with owned or guest solutions"
        ON public.deep_reports FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = deep_reports.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);
    console.log('✓ Policies applied for deep_reports');

    // AI Requests
    await db.execute(sql`DROP POLICY IF EXISTS "Allow users to view their own AI requests" ON public.ai_requests`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow authenticated users to insert AI requests" ON public.ai_requests`);

    await db.execute(sql`
      CREATE POLICY "Allow users to view their own AI requests"
        ON public.ai_requests FOR SELECT
        TO authenticated
        USING (user_id = auth.uid())
    `);
    
    await db.execute(sql`
      CREATE POLICY "Allow authenticated users to insert AI requests"
        ON public.ai_requests FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid())
    `);
    console.log('✓ Policies applied for ai_requests');

    // Attachments
    await db.execute(sql`DROP POLICY IF EXISTS "Allow select attachments associated with owned or guest solutions" ON public.attachments`);
    await db.execute(sql`DROP POLICY IF EXISTS "Allow users to manage attachments for their solutions" ON public.attachments`);

    await db.execute(sql`
      CREATE POLICY "Allow select attachments associated with owned or guest solutions"
        ON public.attachments FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = attachments.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);

    await db.execute(sql`
      CREATE POLICY "Allow users to manage attachments for their solutions"
        ON public.attachments FOR ALL
        USING (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = attachments.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
        WITH CHECK (
          user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.solutions s
            WHERE s.id = attachments.solution_id
            AND (s.user_id = auth.uid() OR s.user_id IS NULL)
          )
        )
    `);
    console.log('✓ Policies applied for attachments');

    console.log('🎉 RLS applied successfully!');
  } catch (err: any) {
    console.error('❌ Failed to apply RLS:', err.message || err);
  } finally {
    await client.end();
  }
}

run();
