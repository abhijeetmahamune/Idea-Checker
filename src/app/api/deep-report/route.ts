import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutions, deepReports } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, desc } from 'drizzle-orm';
import { generateDeepReport } from '@/lib/deep-report-generator';
import { z } from 'zod';
import crypto from 'crypto';

const schema = z.object({
  solutionId: z.string().uuid(),
  problemDescription: z.string().min(10),
  solutionContent: z.string().min(10),
  domain: z.string().optional(),
  force: z.boolean().optional(),
});

function computeHash(problemDesc: string, solutionContent: string): string {
  return crypto.createHash('sha256').update(`${problemDesc || ''}||${solutionContent || ''}`).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { solutionId, problemDescription, solutionContent, domain, force } = schema.parse(body);

    // Verify the user owns this solution
    const solutionResult = await db.select({ id: solutions.id, userId: solutions.userId })
      .from(solutions).where(eq(solutions.id, solutionId)).limit(1);

    if (!solutionResult[0]) return NextResponse.json({ error: 'Solution not found' }, { status: 404 });
    if (solutionResult[0].userId !== user.id) {
      return NextResponse.json({ error: 'Only the solution owner can generate the deep report' }, { status: 403 });
    }

    const hash = computeHash(problemDescription, solutionContent);

    // 1. Caching check (unless force is true)
    if (!force) {
      const cached = await db.select()
        .from(deepReports)
        .where(and(eq(deepReports.solutionId, solutionId), eq(deepReports.contentHash, hash), eq(deepReports.status, 'COMPLETED')))
        .orderBy(desc(deepReports.createdAt))
        .limit(1);

      if (cached[0] && cached[0].content) {
        console.log(`[Cache Hit] Reusing completed deep report for solution ${solutionId}`);
        return NextResponse.json({ report: cached[0].content, cached: true });
      }
    }

    // 2. Determine version number
    const existing = await db.select({ version: deepReports.version })
      .from(deepReports)
      .where(eq(deepReports.solutionId, solutionId));
    
    const nextVersion = existing.length + 1;

    // 3. Create a running report record
    const [newReportRecord] = await db.insert(deepReports).values({
      solutionId,
      status: 'RUNNING',
      version: nextVersion,
      contentHash: hash,
    }).returning();

    try {
      // 4. Generate the report via OpenRouter models
      const result = await generateDeepReport(problemDescription, solutionContent, domain);

      // 5. Update status to COMPLETED
      await db.update(deepReports)
        .set({
          status: 'COMPLETED',
          modelUsed: result.modelUsed,
          promptVersion: 'deep-report-v1',
          generationTimeMs: result.generationTimeMs,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          estimatedCost: result.estimatedCost,
          content: result.report,
        })
        .where(eq(deepReports.id, newReportRecord.id));

      return NextResponse.json({ report: result.report, version: nextVersion });
    } catch (genErr: any) {
      // Update status to FAILED
      await db.update(deepReports)
        .set({
          status: 'FAILED',
          errorMessage: genErr.message || String(genErr),
        })
        .where(eq(deepReports.id, newReportRecord.id));
      throw genErr;
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('Deep report error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate deep report' }, { status: 500 });
  }
}
