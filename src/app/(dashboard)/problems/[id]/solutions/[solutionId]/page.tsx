import { db } from '@/db';
import { solutions, problems, evaluations, simulations, devilAdvocateReports, solutionRatings } from '@/db/schema';
import { eq, sql, desc, and, avg } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EvaluationView } from '@/components/evaluation-view';
import { ArrowLeft, Activity } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StressTestView } from '@/components/stress-test-view';
import { DevilAdvocateView } from '@/components/devil-advocate-view';
import { DeepReportView } from '@/components/deep-report-view';
import { ScoreTimeline } from '@/components/score-timeline';
import { CommunityScoreWidget } from '@/components/community-score-widget';

export const revalidate = 0;

export default async function SolutionEvaluationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; solutionId: string }>;
  searchParams: Promise<{ evalId?: string; tab?: string }>;
}) {
  const { id, solutionId } = await params;
  const { evalId, tab } = await searchParams;

  if (!id || !solutionId) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. Fetch solution & problem details (includes deepReport)
  const solutionResult = await db
    .select({ solution: solutions, problem: problems })
    .from(solutions)
    .innerJoin(problems, eq(solutions.problemId, problems.id))
    .where(eq(solutions.id, solutionId))
    .limit(1);

  if (solutionResult.length === 0) notFound();

  const { solution, problem } = solutionResult[0];

  const isOwner = problem.userId === user.id && solution.userId === user.id;
  const isPublicView = problem.isPublic;

  if (!isOwner && !isPublicView) redirect('/dashboard');

  // 2. Fetch all evaluations for this solution (newest first for timeline)
  const history = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.solutionId, solutionId))
    .orderBy(sql`${evaluations.createdAt} desc`);

  if (history.length === 0) notFound();

  const activeEval = evalId
    ? history.find((e) => e.id === evalId) || history[0]
    : history[0];

  // 3. Fetch all simulations
  const solutionSimulations = await db
    .select()
    .from(simulations)
    .where(eq(simulations.solutionId, solutionId))
    .orderBy(sql`${simulations.createdAt} desc`);

  // 4. Fetch latest Devil's Advocate report
  const devilReports = await db
    .select()
    .from(devilAdvocateReports)
    .where(eq(devilAdvocateReports.solutionId, solutionId))
    .orderBy(desc(devilAdvocateReports.createdAt))
    .limit(1);

  const latestDevilReport = devilReports[0]?.report ?? null;

  // 5. Community score aggregate + user's own rating
  const ratingStats = await db
    .select({
      averageRating: sql<number>`round(avg(${solutionRatings.rating})::numeric, 1)::float8`,
      totalRatings: sql<number>`count(*)::int`,
    })
    .from(solutionRatings)
    .where(eq(solutionRatings.solutionId, solutionId));

  const userRatingResult = await db
    .select({ rating: solutionRatings.rating })
    .from(solutionRatings)
    .where(and(eq(solutionRatings.solutionId, solutionId), eq(solutionRatings.userId, user.id)))
    .limit(1);

  const communityScore = {
    average: ratingStats[0]?.averageRating ?? 0,
    total: ratingStats[0]?.totalRatings ?? 0,
    userRating: userRatingResult[0]?.rating ?? 0,
  };

  const defaultTab = tab || 'score';
  const deepReport = solution.deepReport ?? null;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header back-link */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-zinc-900 pb-4">
        <Link
          href={`/problems/${id}`}
          className="inline-flex items-center text-xs text-zinc-500 hover:text-white transition-colors gap-1 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Solutions List
        </Link>
        <span className="text-xs text-zinc-500 font-mono">
          Report Reference: {activeEval.id.substring(0, 8)}
        </span>
      </div>

      <Tabs defaultValue={defaultTab} className="max-w-7xl mx-auto">
        <TabsList className="mb-6 flex-wrap gap-1 h-auto">
          <TabsTrigger value="score">Consensus Score</TabsTrigger>
          <TabsTrigger value="stress" className="flex items-center gap-1.5">
            Stress Simulation
            {solutionSimulations.length > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 h-4 min-w-4 text-[10px] flex items-center justify-center font-mono">
                {solutionSimulations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="devil" className="flex items-center gap-1.5 data-[state=active]:bg-rose-950/50 data-[state=active]:text-rose-300">
            😈 Devil&apos;s Advocate
            {latestDevilReport && (
              <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-1.5 py-0 h-4 text-[9px]">Done</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deep" className="flex items-center gap-1.5 data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-300">
            📋 Deep Report
            {deepReport && (
              <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-1.5 py-0 h-4 text-[9px]">Done</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Consensus Score ── */}
        <TabsContent value="score" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <EvaluationView
                problem={problem}
                solution={solution}
                evaluation={activeEval}
                showRegisterCta={false}
                pivotSuggestions={activeEval.pivotSuggestions ?? null}
              />
            </div>

            {/* Sidebar: Timeline + Community Score */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
              {/* Score Evolution Timeline */}
              <Card className="border-zinc-900 bg-zinc-950/80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
                <CardHeader className="pb-4 border-b border-zinc-900">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-violet-400" />
                    Idea Evolution
                  </CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">
                    Track how your score changed across every re-evaluation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 px-4 pb-4">
                  <ScoreTimeline
                    history={history.map(e => ({
                      id: e.id,
                      overallScore: e.overallScore,
                      createdAt: e.createdAt,
                      feedback: e.feedback,
                    }))}
                    activeEvalId={activeEval.id}
                    tab={defaultTab}
                  />
                </CardContent>
              </Card>

              {/* Community Score (only on public problems) */}
              {isPublicView && (
                <CommunityScoreWidget
                  solutionId={solutionId}
                  initialAverage={communityScore.average}
                  initialTotal={communityScore.total}
                  initialUserRating={communityScore.userRating}
                  isOwner={isOwner}
                  isGuest={false}
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Stress Simulation ── */}
        <TabsContent value="stress" className="mt-0">
          <StressTestView solutionId={solutionId} initialSimulations={solutionSimulations} />
        </TabsContent>

        {/* ── Tab: Devil's Advocate ── */}
        <TabsContent value="devil" className="mt-0">
          <DevilAdvocateView
            solutionId={solutionId}
            initialReport={latestDevilReport}
            domain={activeEval.domain ?? undefined}
          />
        </TabsContent>

        {/* ── Tab: Deep Report ── */}
        <TabsContent value="deep" className="mt-0">
          <DeepReportView
            solutionId={solutionId}
            initialReport={deepReport}
            problemDescription={problem.description}
            solutionContent={solution.content}
            domain={activeEval.domain ?? undefined}
            isOwner={isOwner}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
