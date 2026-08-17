import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { devilAdvocateReports } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const solutionId = searchParams.get('solutionId');
    const reportId = searchParams.get('reportId');

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

    // Fetch target report (by reportId if provided, else latest)
    const reports = reportId && z.string().uuid().safeParse(reportId).success
      ? await db
          .select()
          .from(devilAdvocateReports)
          .where(and(eq(devilAdvocateReports.id, reportId), eq(devilAdvocateReports.solutionId, solutionId)))
          .limit(1)
      : await db
          .select()
          .from(devilAdvocateReports)
          .where(eq(devilAdvocateReports.solutionId, solutionId))
          .orderBy(desc(devilAdvocateReports.createdAt))
          .limit(1);

    if (reports.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const targetReport = reports[0];

    return NextResponse.json({
      exists: true,
      report: targetReport.report,
      reportId: targetReport.id,
      version: targetReport.version,
      evolutionSummary: targetReport.evolutionSummary ?? (targetReport.report as any)?.evolutionSummary ?? null,
      createdAt: targetReport.createdAt,
    });
  } catch (err: any) {
    console.error('Devil Advocate exists check error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to check for existing report.' },
      { status: 500 }
    );
  }
}
