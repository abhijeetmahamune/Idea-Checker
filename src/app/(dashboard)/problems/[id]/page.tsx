import { db } from '@/db';
import { problems, solutions, evaluations, users, workspaces } from '@/db/schema';
import { eq, sql, and, isNull } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, FileText, ChevronRight, Globe, User, MessageCircle, GitMerge } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SolutionForm } from '@/components/solution-form';
import { EditProblemDialog } from '@/components/edit-problem-dialog';
import { DeleteProblemButton } from '@/components/delete-problem-button';
import { EditSolutionDialog } from '@/components/edit-solution-dialog';
import { DeleteSolutionButton } from '@/components/delete-solution-button';
import { VisibilityToggle } from '@/components/visibility-toggle';
import { CommentSection } from '@/components/comment-section';
import { MergeSolutionsDialog } from '@/components/merge-solutions-dialog';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog';

export const revalidate = 0;

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch the problem + author
  const problemResult = await db
    .select({ problem: problems, author: users })
    .from(problems)
    .leftJoin(users, eq(problems.userId, users.id))
    .where(and(eq(problems.id, id), isNull(problems.deletedAt)))
    .limit(1);

  if (problemResult.length === 0) notFound();

  const { problem, author } = problemResult[0];
  const isOwner = problem.userId === user.id;
  const isPublicView = problem.isPublic;

  if (!isOwner && !isPublicView) redirect('/dashboard');

  // Fetch solutions with latest evaluation
  const latestEvaluationsSubquery = db
    .select({
      solutionId: evaluations.solutionId,
      maxCreatedAt: sql<Date>`max(${evaluations.createdAt})`.as('max_created_at'),
    })
    .from(evaluations)
    .groupBy(evaluations.solutionId)
    .as('latest_eval_sq');

  const problemSolutions = await db
    .select({ solution: solutions, evaluation: evaluations })
    .from(solutions)
    .leftJoin(latestEvaluationsSubquery, eq(solutions.id, latestEvaluationsSubquery.solutionId))
    .leftJoin(evaluations, and(
      eq(evaluations.solutionId, solutions.id),
      eq(evaluations.createdAt, latestEvaluationsSubquery.maxCreatedAt)
    ))
    .where(and(eq(solutions.problemId, id), isNull(solutions.deletedAt)))
    .orderBy(sql`${solutions.createdAt} desc`);

  // Fetch existing workspace for this problem (owner check)
  const existingWorkspace = isOwner
    ? await db.select({ id: workspaces.id, inviteCode: workspaces.inviteCode })
        .from(workspaces).where(eq(workspaces.problemId, id)).limit(1)
    : [];

  const workspace = existingWorkspace[0] ?? null;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <Link
        href={isOwner ? '/dashboard' : '/community'}
        className="inline-flex items-center text-xs text-zinc-500 hover:text-white transition-colors mb-6 gap-1"
      >
        <ArrowLeft className="h-3 w-3" />
        {isOwner ? 'Back to Workspace' : 'Back to Community Board'}
      </Link>

      {/* Grid: Details on Left, Sidebar on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side */}
        <div className="lg:col-span-8 space-y-8">
          {/* Problem Details */}
          <Card className="border-zinc-900 bg-zinc-950/80 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4 flex-wrap sm:flex-nowrap">
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {problem.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">{problem.title}</h1>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {isOwner ? (
                    <>
                      <VisibilityToggle problemId={problem.id} initialIsPublic={problem.isPublic} />
                      <CreateWorkspaceDialog
                        problemId={problem.id}
                        existingWorkspaceId={workspace?.id}
                        existingInviteCode={workspace?.inviteCode}
                      />
                      <EditProblemDialog problem={problem} />
                      <DeleteProblemButton problemId={problem.id} />
                    </>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-1 flex items-center gap-1 font-semibold">
                      <Globe className="h-3.5 w-3.5" />
                      Public Idea
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-zinc-400 block text-xs uppercase tracking-wider">Problem Context:</span>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{problem.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-900 flex items-center text-xs text-zinc-500 gap-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                Created: {new Date(problem.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Card>

          {/* Solutions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-zinc-400" />
                Proposed Solutions ({problemSolutions.length})
              </h2>
              {/* Merge button — owner only, 2+ solutions */}
              {isOwner && problemSolutions.length >= 2 && (
                <MergeSolutionsDialog
                  problemId={id}
                  solutions={problemSolutions.map(({ solution, evaluation }) => ({
                    id: solution.id,
                    content: solution.content,
                    score: evaluation?.overallScore ?? null,
                    isMerged: solution.isMerged,
                  }))}
                />
              )}
            </div>

            {problemSolutions.length === 0 ? (
              <Card className="border-dashed border-zinc-900 bg-zinc-950/20 p-8 text-center">
                <p className="text-sm text-zinc-500 italic">No solutions have been proposed for this problem context yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {problemSolutions.map(({ solution, evaluation }) => (
                  <Card
                    key={solution.id}
                    className="border-zinc-900 bg-zinc-950/50 hover:bg-zinc-950 hover:border-violet-500/20 transition-all duration-200 shadow-md p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {solution.isMerged && (
                          <Badge className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-1">
                            <GitMerge className="h-2.5 w-2.5" />
                            AI Merged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">{solution.content}</p>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        Submitted: {new Date(solution.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-900">
                      {evaluation ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider hidden sm:inline">Score</span>
                          <Badge className={`font-mono font-bold px-2.5 py-1 text-sm ${
                            evaluation.overallScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : evaluation.overallScore >= 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {evaluation.overallScore}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-zinc-500 border-zinc-800">Pending</Badge>
                      )}

                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <>
                            <EditSolutionDialog solution={solution} />
                            <DeleteSolutionButton solutionId={solution.id} />
                            <div className="h-3 w-[1px] bg-zinc-800" />
                          </>
                        )}
                        <Link
                          href={`/problems/${id}/solutions/${solution.id}`}
                          className="inline-flex items-center text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors gap-0.5 group-hover:translate-x-0.5 duration-200"
                        >
                          Report
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Comment Section — public problems only */}
          {isPublicView && (
            <Card className="border-zinc-900 bg-zinc-950/60 p-6 shadow-xl">
              <CommentSection
                problemId={id}
                currentUserId={user.id}
                isProblemOwner={isOwner}
              />
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          {isOwner ? (
            <>
              <SolutionForm
                problemId={id}
                problemTitle={problem.title}
                problemDescription={problem.description}
              />
              {/* Workspace quick-access link */}
              {workspace && (
                <Card className="border-zinc-900 bg-zinc-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Team Workspace</p>
                      <p className="text-[10px] text-zinc-500">Your team is collaborating here</p>
                    </div>
                    <Link href={`/workspace/${workspace.id}`}>
                      <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-500 text-white h-8">
                        Open →
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-zinc-900 bg-zinc-950/80 shadow-2xl relative overflow-hidden p-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
              <CardHeader className="p-0 pb-4 border-b border-zinc-900 mb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-300">
                  <User className="h-4 w-4 text-violet-400" />
                  Author Profile
                </CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Posted By</span>
                  <p className="text-sm text-white font-medium">{author?.name || author?.email || 'Anonymous Contributor'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Email</span>
                  <p className="text-xs text-zinc-400 font-mono truncate">{author?.email || 'N/A'}</p>
                </div>
                <div className="border-t border-zinc-900 pt-4 mt-2">
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    This idea has been shared with the community. Review the solution variants, AI consensus scores, and stress tests. Join the discussion below!
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
