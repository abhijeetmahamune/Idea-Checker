import { db } from '@/db';
import { solutions, problems, evaluations, simulations, solutionRatings } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { EvaluationView } from '@/components/evaluation-view';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StressTestView } from '@/components/stress-test-view';
import { Badge } from '@/components/ui/badge';
import { CommunityScoreWidget } from '@/components/community-score-widget';

export const revalidate = 0; // Disable static caching so we fetch newest results immediately

export default async function GuestEvaluationPage({
  params,
}: {
  params: Promise<{ solutionId: string }>;
}) {
  const { solutionId } = await params;

  if (!solutionId) {
    notFound();
  }

  // Fetch the evaluation, solution, and problem in a single join query
  const results = await db
    .select({
      solution: solutions,
      problem: problems,
      evaluation: evaluations,
    })
    .from(solutions)
    .innerJoin(problems, eq(solutions.problemId, problems.id))
    .innerJoin(evaluations, eq(evaluations.solutionId, solutions.id))
    .where(eq(solutions.id, solutionId))
    .limit(1);

  if (results.length === 0) {
    notFound();
  }

  const { solution, problem, evaluation } = results[0];

  // Fetch all simulations for this solution
  const solutionSimulations = await db
    .select()
    .from(simulations)
    .where(eq(simulations.solutionId, solutionId))
    .orderBy(sql`${simulations.createdAt} desc`);

  // Fetch community score (read-only for guests)
  const ratingStats = await db
    .select({
      averageRating: sql<number>`round(avg(${solutionRatings.rating})::numeric, 1)::float8`,
      totalRatings: sql<number>`count(*)::int`,
    })
    .from(solutionRatings)
    .where(eq(solutionRatings.solutionId, solutionId));

  const communityScore = {
    average: ratingStats[0]?.averageRating ?? 0,
    total: ratingStats[0]?.totalRatings ?? 0,
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow py-8 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] rounded-full bg-violet-900/5 filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-900/5 filter blur-[100px] pointer-events-none" />

        <div className="container mx-auto">
          {/* Header breadcrumb or tag */}
          <div className="max-w-5xl mx-auto px-4 mb-6 text-sm text-zinc-500 font-medium">
            <span>Guest Evaluation Report</span> &rarr; <span className="text-zinc-300">{problem.title}</span>
          </div>

          <Tabs defaultValue="score" className="max-w-5xl mx-auto px-4">
            <TabsList className="mb-6">
              <TabsTrigger value="score">Consensus Score</TabsTrigger>
              <TabsTrigger value="stress" className="flex items-center gap-1.5">
                Stress Simulation
                {solutionSimulations.length > 0 && (
                  <Badge variant="secondary" className="px-1.5 py-0 h-4 min-w-4 text-[10px] flex items-center justify-center font-mono">
                    {solutionSimulations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="score" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8">
                  <EvaluationView
                    problem={problem}
                    solution={solution}
                    evaluation={evaluation}
                    showRegisterCta={true}
                  />
                </div>
                {/* Community Score — read-only for guests */}
                <div className="lg:col-span-4 lg:sticky lg:top-20">
                  <CommunityScoreWidget
                    solutionId={solutionId}
                    initialAverage={communityScore.average}
                    initialTotal={communityScore.total}
                    initialUserRating={0}
                    isOwner={false}
                    isGuest={true}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stress" className="mt-0">
              <StressTestView
                solutionId={solutionId}
                initialSimulations={solutionSimulations}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-6 bg-black text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Idea Checker. Free Guest Session.
      </footer>
    </div>
  );
}

