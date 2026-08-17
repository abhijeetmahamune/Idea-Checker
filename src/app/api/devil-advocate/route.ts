import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutions, problems, devilAdvocateReports, workspaces, workspaceMembers } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
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

    // Allow owner, solution owner, public problem viewers, or workspace members to run Devil's Advocate
    const isOwner = problem.userId === user.id || solution.userId === user.id;
    let hasAccess = isOwner || problem.isPublic;

    if (!hasAccess) {
      const ws = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.problemId, problem.id)).limit(1);
      if (ws[0]) {
        const mem = await db.select({ id: workspaceMembers.id }).from(workspaceMembers)
          .where(and(eq(workspaceMembers.workspaceId, ws[0].id), eq(workspaceMembers.userId, user.id))).limit(1);
        if (mem[0]) hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Fetch previous Devil's Advocate reports for context & versioning
    const existingReports = await db
      .select()
      .from(devilAdvocateReports)
      .where(eq(devilAdvocateReports.solutionId, solutionId))
      .orderBy(desc(devilAdvocateReports.createdAt));

    const previousReportRecord = existingReports[0] ?? null;
    const nextVersion = existingReports.length + 1;

    // Generate Devil's Advocate report (with optional prior report context for evolution comparison)
    const report = await generateDevilAdvocate(
      problem.description,
      solution.content,
      domain,
      previousReportRecord ? (previousReportRecord.report as any) : null,
      previousReportRecord ? previousReportRecord.solutionContentSnapshot : null
    );

    const evolutionSummary = report.evolutionSummary ?? (previousReportRecord ? (previousReportRecord.evolutionSummary ?? null) : null);

    // Save new versioned report to database
    const [saved] = await db
      .insert(devilAdvocateReports)
      .values({
        solutionId,
        version: nextVersion,
        solutionContentSnapshot: solution.content,
        previousReportId: previousReportRecord?.id ?? null,
        evolutionSummary,
        report,
      })
      .returning();

    return NextResponse.json({
      success: true,
      reportId: saved.id,
      version: nextVersion,
      evolutionSummary,
      report,
    });
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
