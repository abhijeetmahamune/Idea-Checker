import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL || '', { prepare: false });

async function main() {
  try {
    const result = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    console.log('Current columns:', result.map(r => r.column_name));

    const columns = result.map(r => r.column_name);
    
    if (!columns.includes('bio')) {
      await sql`ALTER TABLE "users" ADD COLUMN "bio" text;`;
      console.log('Added bio column');
    }
    if (!columns.includes('avatar_url')) {
      await sql`ALTER TABLE "users" ADD COLUMN "avatar_url" text;`;
      console.log('Added avatar_url column');
    }
    if (!columns.includes('location')) {
      await sql`ALTER TABLE "users" ADD COLUMN "location" text;`;
      console.log('Added location column');
    }
    if (!columns.includes('featured_problems')) {
      await sql`ALTER TABLE "users" ADD COLUMN "featured_problems" text[];`;
      console.log('Added featured_problems column');
    }
    if (!columns.includes('featured_solutions')) {
      await sql`ALTER TABLE "users" ADD COLUMN "featured_solutions" text[];`;
      console.log('Added featured_solutions column');
    }

    const after = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    console.log('Updated columns:', after.map(r => r.column_name));
    console.log('Migration applied successfully!');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await sql.end();
  }
}

main();
