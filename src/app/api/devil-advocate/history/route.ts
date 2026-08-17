import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devilAdvocateReports, solutions, problems, workspaces, workspaceMembers } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const solutionId = searchParams.get('solutionId');

    if (!solutionId || !z.string().uuid().safeParse(solutionId).success) {
      return NextResponse.json({ error: 'Invalid solutionId.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Verify access
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

    // Fetch all Devil's Advocate reports for this solution (newest first)
    const reports = await db
      .select({
        id: devilAdvocateReports.id,
        version: devilAdvocateReports.version,
        createdAt: devilAdvocateReports.createdAt,
        overallRiskLevel: devilAdvocateReports.report,
        evolutionSummary: devilAdvocateReports.evolutionSummary,
      })
      .from(devilAdvocateReports)
      .where(eq(devilAdvocateReports.solutionId, solutionId))
      .orderBy(desc(devilAdvocateReports.createdAt));

    const versions = reports.map((r) => r.version);
    const hasUniqueNonDefaultVersions =
      new Set(versions).size === reports.length && !versions.every((v) => v === 1);

    const history = reports.map((r, idx) => {
      const totalCount = reports.length;
      const displayVersion = hasUniqueNonDefaultVersions && r.version ? r.version : totalCount - idx;
      const rep = r.overallRiskLevel as any;
      return {
        id: r.id,
        version: displayVersion,
        title: `Challenge #${displayVersion}`,
        createdAt: r.createdAt,
        overallRiskLevel: rep?.overallRiskLevel || 'High Risk',
        verdict: rep?.verdict || '',
        evolutionSummary: r.evolutionSummary,
      };
    });

    return NextResponse.json({ history });
  } catch (err: any) {
    console.error('Devil Advocate history error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch history.' }, { status: 500 });
  }
}
