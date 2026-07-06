import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutions } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { generateDeepReport } from '@/lib/deep-report-generator';
import { z } from 'zod';

const schema = z.object({
  solutionId: z.string().uuid(),
  problemDescription: z.string().min(10),
  solutionContent: z.string().min(10),
  domain: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { solutionId, problemDescription, solutionContent, domain } = schema.parse(body);

    // Verify the user owns this solution
    const solutionResult = await db.select({ id: solutions.id, userId: solutions.userId })
      .from(solutions).where(eq(solutions.id, solutionId)).limit(1);

    if (!solutionResult[0]) return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    if (solutionResult[0].userId !== user.id) {
      return NextResponse.json({ error: 'Only the solution owner can generate the deep report' }, { status: 403 });
    }

    // Generate the 10-section report via Nemetron (OpenRouter)
    const report = await generateDeepReport(problemDescription, solutionContent, domain);

    // Persist the report on the solution record
    await db.update(solutions)
      .set({ deepReport: report })
      .where(eq(solutions.id, solutionId));

    return NextResponse.json({ report });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('Deep report error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate deep report' }, { status: 500 });
  }
}
