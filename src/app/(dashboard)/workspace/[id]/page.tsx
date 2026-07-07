import { db } from '@/db';
import { workspaces, workspaceMembers, workspaceMessages, problems, solutions, evaluations, users } from '@/db/schema';
import { eq, and, asc, sql, isNull } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceChat } from '@/components/workspace-chat';
import { SolutionForm } from '@/components/solution-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  ArrowLeft, Users, FileText, TrendingUp, TrendingDown, Minus,
  Crown, Edit3, Eye,
} from 'lucide-react';
import { InviteButton } from '@/components/invite-button';

export const revalidate = 0;

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner:  { label: 'Owner',  icon: Crown, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  editor: { label: 'Editor', icon: Edit3, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  viewer: { label: 'Viewer', icon: Eye,   color: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
};

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch workspace
  const workspaceResult = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!workspaceResult[0]) notFound();
  const workspace = workspaceResult[0];

  // Verify membership
  const memberResult = await db.select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);
  if (!memberResult[0]) redirect('/dashboard');
  const userRole = memberResult[0].role;

  // Fetch problem + solutions with scores
  const problem = await db.select().from(problems).where(eq(problems.id, workspace.problemId)).limit(1);
  if (!problem[0]) notFound();

  // Fetch solutions with latest evaluation
  const latestEvalSq = db
    .select({ solutionId: evaluations.solutionId, maxDate: sql<Date>`max(${evaluations.createdAt})`.as('max_date') })
    .from(evaluations).groupBy(evaluations.solutionId).as('latest_sq');

  const solutionsWithScores = await db
    .select({ solution: solutions, score: evaluations.overallScore, authorName: users.name, authorEmail: users.email })
    .from(solutions)
    .leftJoin(latestEvalSq, eq(latestEvalSq.solutionId, solutions.id))
    .leftJoin(evaluations, and(eq(evaluations.solutionId, solutions.id), eq(evaluations.createdAt, latestEvalSq.maxDate)))
    .leftJoin(users, eq(solutions.userId, users.id))
    .where(and(eq(solutions.problemId, workspace.problemId), isNull(solutions.deletedAt)))
    .orderBy(sql`${evaluations.overallScore} desc nulls last`);

  // Fetch members
  const members = await db
    .select({ id: workspaceMembers.id, userId: workspaceMembers.userId, role: workspaceMembers.role, name: users.name, email: users.email })
    .from(workspaceMembers)
    .leftJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  // Fetch initial messages
  const messages = await db
    .select()
    .from(workspaceMessages)
    .where(eq(workspaceMessages.workspaceId, workspaceId))
    .orderBy(asc(workspaceMessages.createdAt))
    .limit(100);

  const currentUser = await db.select({ name: users.name, email: users.email })
    .from(users).where(eq(users.id, user.id)).limit(1);
  const currentUserName = currentUser[0]?.name || currentUser[0]?.email?.split('@')[0] || 'Anonymous';
  const isEditor = userRole === 'owner' || userRole === 'editor';
  const inviteLink = `/workspace/join/${workspace.inviteCode}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-20 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/problems/${workspace.problemId}`} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-400 flex-shrink-0" />
                <h1 className="text-sm font-black text-white truncate">{workspace.name}</h1>
                <Badge className={`text-[9px] flex-shrink-0 ${ROLE_CONFIG[userRole]?.color}`}>
                  {userRole}
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-600 truncate">{problem[0].title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Member avatars */}
            <div className="hidden sm:flex items-center -space-x-1.5">
              {members.slice(0, 5).map(m => (
                <div key={m.id} title={m.name || m.email || 'Member'}
                  className="h-6 w-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400 ring-1 ring-black">
                  {(m.name || m.email || '?')[0].toUpperCase()}
                </div>
              ))}
              {members.length > 5 && (
                <div className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-500">
                  +{members.length - 5}
                </div>
              )}
            </div>

            {/* Invite code copy */}
            {userRole === 'owner' && (
              <InviteButton inviteCode={workspace.inviteCode} inviteLink={inviteLink} />
            )}
          </div>
        </div>
      </div>

      {/* Main layout — two panels */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* LEFT — Problem board */}
        <div className="w-[55%] flex flex-col border-r border-zinc-900 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Problem card */}
            <Card className="border-zinc-800 bg-zinc-950/80">
              <CardHeader className="pb-3 border-b border-zinc-900">
                <CardTitle className="text-sm font-bold text-white">{problem[0].title}</CardTitle>
                <p className="text-xs text-zinc-400 leading-relaxed">{problem[0].description}</p>
                {problem[0].tags && problem[0].tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {problem[0].tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-[10px] text-zinc-600">
                  {solutionsWithScores.length} solution{solutionsWithScores.length !== 1 ? 's' : ''} · {members.length} team member{members.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* Solutions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-400" />
                  Solutions
                </h2>
              </div>

              {solutionsWithScores.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-xs">
                  No solutions yet. {isEditor ? 'Propose the first one below!' : 'The team hasn\'t proposed any solutions yet.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {solutionsWithScores.map(({ solution, score, authorName, authorEmail }, idx) => {
                    const prevScore = solutionsWithScores[idx + 1]?.score;
                    return (
                      <Link key={solution.id} href={`/problems/${workspace.problemId}/solutions/${solution.id}`}
                        className="block p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-violet-500/30 hover:bg-zinc-950 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs text-zinc-300 line-clamp-2 flex-grow leading-relaxed group-hover:text-white transition-colors">
                            {solution.content}
                          </p>
                          <div className="flex-shrink-0 text-center">
                            <span className={`text-base font-black font-mono block ${
                              !score ? 'text-zinc-600'
                              : score >= 70 ? 'text-emerald-400'
                              : score >= 50 ? 'text-amber-400'
                              : 'text-rose-400'
                            }`}>{score ?? '—'}</span>
                            <span className="text-[9px] text-zinc-600">/100</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-zinc-600">
                            by {authorName || authorEmail?.split('@')[0] || 'Unknown'}
                          </span>
                          {solution.isMerged && (
                            <Badge className="text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20">🔀 Merged</Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Solution form for editors */}
              {isEditor && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Propose a Solution</p>
                  <SolutionForm problemId={workspace.problemId} problemDescription={problem[0].description} />
                </div>
              )}
            </div>

            {/* Members */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-400" />
                Team ({members.length})
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {members.map(m => {
                  const rc = ROLE_CONFIG[m.role] || ROLE_CONFIG.viewer;
                  const RoleIcon = rc.icon;
                  return (
                    <div key={m.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/40">
                      <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                        {(m.name || m.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-medium text-white truncate">{m.name || m.email?.split('@')[0]}</p>
                        <span className={`text-[9px] font-bold ${rc.color} px-1.5 py-0.5 rounded border inline-flex items-center gap-0.5 mt-0.5`}>
                          <RoleIcon className="h-2.5 w-2.5" />
                          {rc.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="border-b border-zinc-900 px-4 py-3 flex-shrink-0">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Team Chat</h2>
            <p className="text-[10px] text-zinc-600">Type <code className="text-violet-400">@ai</code> to ask the AI assistant</p>
          </div>
          <div className="flex-1 min-h-0">
            <WorkspaceChat
              workspaceId={workspaceId}
              currentUserId={user.id}
              currentUserName={currentUserName}
              initialMessages={messages.map(m => ({
                ...m,
                createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
                userId: m.userId ?? null,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
