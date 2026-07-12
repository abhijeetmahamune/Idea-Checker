/**
 * Script to migrate existing deep reports from solutions.deep_report
 * into the new deep_reports table to ensure backward compatibility.
 *
 * Run with: npx tsx --env-file=.env.local scripts/migrate-deep-reports.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql, eq, isNotNull } from 'drizzle-orm';
import { solutions, deepReports } from '../src/db/schema';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(client);

// Helper to compute MD5 or SHA256 of contents to populate initial cache hashes
function computeHash(problemDesc: string, solutionContent: string): string {
  const content = `${problemDesc || ''}||${solutionContent || ''}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function migrate() {
  console.log('Starting data migration for deep reports...\n');
  try {
    // 1. Fetch solutions that contain a deep report
    // We join with problems to get problem description for hashing
    const solutionsWithReports = await db.execute(sql`
      SELECT s.id, s.content, s.deep_report, p.description as problem_description
      FROM public.solutions s
      JOIN public.problems p ON s.problem_id = p.id
      WHERE s.deep_report IS NOT NULL
    `);

    console.log(`Found ${solutionsWithReports.length} solutions with existing deep reports.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const sol of solutionsWithReports) {
      const solutionId = sol.id;
      const content = sol.deep_report;
      
      // Compute caching hash
      const hash = computeHash(sol.problem_description as string, sol.content as string);

      // Check if deep_reports already has a completed report for this solution
      const existing = await db.execute(sql`
        SELECT id FROM public.deep_reports
        WHERE solution_id = ${solutionId} AND status = 'COMPLETED'
        LIMIT 1
      `);

      if (existing.length > 0) {
        console.log(`- Solution ${solutionId} already has a deep report record. Skipping.`);
        skippedCount++;
      } else {
        // Insert into deep_reports
        await db.execute(sql`
          INSERT INTO public.deep_reports (solution_id, status, version, model_used, content, content_hash, created_at)
          VALUES (${solutionId}, 'COMPLETED', 1, 'nvidia/nemotron-3-super-120b-a12b:free', ${JSON.stringify(content)}, ${hash}, NOW())
        `);
        console.log(`- Solution ${solutionId} deep report successfully migrated.`);
        migratedCount++;
      }
    }

    console.log(`\n🎉 Data migration complete! Migrated: ${migratedCount}, Skipped: ${skippedCount}\n`);

  } catch (err: any) {
    console.error('❌ Data migration failed:', err.message || err);
    await client.end();
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

migrate();
