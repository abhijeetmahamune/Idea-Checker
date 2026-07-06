import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutions, problems, devilAdvocateReports } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { generateDevilAdvocate } from '@/lib/devil-advocate-generator';
import { z } from 'zod';

const requestSchema = z.object({
  solutionId: z.string().uuid(),
  domain: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { solutionId, domain } = requestSchema.parse(body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Fetch solution + parent problem, verify access
    const solutionResult = await db
      .select({ solution: solutions, problem: problems })
      .from(solutions)
      .innerJoin(problems, eq(solutions.problemId, problems.id))
      .where(eq(solutions.id, solutionId))
      .limit(1);

    if (solutionResult.length === 0) {
      return NextResponse.json({ error: 'Solution not found.' }, { status: 404 });
    }

    const { solution, problem } = solutionResult[0];

    // Allow owner or public problem viewers to run Devil's Advocate
    const isOwner = problem.userId === user.id;
    const isPublic = problem.isPublic;
    if (!isOwner && !isPublic) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Generate Devil's Advocate report
    const report = await generateDevilAdvocate(
      problem.description,
      solution.content,
      domain
    );

    // Save to database
    const [saved] = await db
      .insert(devilAdvocateReports)
      .values({
        solutionId,
        report,
      })
      .returning();

    return NextResponse.json({ success: true, reportId: saved.id, report });
  } catch (err: any) {
    console.error('Devil Advocate API error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map((e) => e.message).join(' ') },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to generate Devil\'s Advocate report.' },
      { status: 500 }
    );
  }
}
