import { db } from '@/db';
import { problems, solutions, users, problemUpvotes } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Calendar, FileText, User, Globe, ArrowRight, ArrowUpDown } from 'lucide-react';
import { UpvoteButton } from '@/components/upvote-button';

export const revalidate = 0;

export default async function CommunityBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortBy = sort === 'top' ? 'top' : 'latest';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch all public problems with author details, solution count, upvote count, and user's vote
  const publicProblems = await db
    .select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      tags: problems.tags,
      createdAt: problems.createdAt,
      authorName: users.name,
      authorEmail: users.email,
      solutionCount: sql<number>`count(distinct ${solutions.id})::int`,
      upvoteCount: sql<number>`count(distinct ${problemUpvotes.id})::int`,
    })
    .from(problems)
    .leftJoin(users, eq(problems.userId, users.id))
    .leftJoin(solutions, and(eq(solutions.problemId, problems.id), isNull(solutions.deletedAt)))
    .leftJoin(problemUpvotes, eq(problemUpvotes.problemId, problems.id))
    .where(and(eq(problems.isPublic, true), isNull(problems.deletedAt)))
    .groupBy(problems.id, users.id)
    .orderBy(
      sortBy === 'top'
        ? sql`count(distinct ${problemUpvotes.id}) desc, ${problems.createdAt} desc`
        : sql`${problems.createdAt} desc`
    );

  // Fetch user's upvotes in one query
  const userUpvotes = await db
    .select({ problemId: problemUpvotes.problemId })
    .from(problemUpvotes)
    .where(eq(problemUpvotes.userId, user.id));

  const upvotedSet = new Set(userUpvotes.map(u => u.problemId));

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-900 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Globe className="h-7 w-7 text-violet-400" />
            Community Board
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Explore startup ideas, solution proposals, and AI evaluations shared by fellow builders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort toggle */}
          <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Link href="/community?sort=latest">
              <button className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${sortBy === 'latest' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Latest
              </button>
            </Link>
            <Link href="/community?sort=top">
              <button className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${sortBy === 'top' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                <ArrowUpDown className="h-3 w-3" />
                Top
              </button>
            </Link>
          </div>

          <Link href="/dashboard">
            <Button className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs">
              Your Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid List */}
      {publicProblems.length === 0 ? (
        <Card className="border-dashed border-zinc-900 bg-zinc-950/20 p-16 text-center max-w-2xl mx-auto mt-8">
          <Globe className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No public ideas yet</h3>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto mb-6">
            Be the first to share one of your startup contexts with the community!
          </p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-6 py-4">
              Open Workspace
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicProblems.map((p) => (
            <Card
              key={p.id}
              className="border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950 hover:border-violet-500/25 transition-all duration-300 shadow-xl flex flex-col justify-between overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none group-hover:bg-violet-600/10 transition-colors duration-300" />

              <CardContent className="p-6 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {p.tags && p.tags.length > 0 ? (
                      p.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] px-2">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-zinc-600 border-zinc-900 text-[9px] px-2">General</Badge>
                    )}
                  </div>

                  {/* Title & snippet */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-violet-400 transition-colors duration-300">
                      {p.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">{p.description}</p>
                  </div>
                </div>

                {/* Meta details */}
                <div className="border-t border-zinc-900/60 pt-4 mt-6 space-y-2">
                  {/* Author */}
                  <div className="flex items-center text-[10px] text-zinc-500 gap-1.5">
                    <User className="h-3 w-3 text-zinc-600" />
                    <span className="truncate">
                      By: <span className="font-semibold text-zinc-400">{p.authorName || p.authorEmail || 'Anonymous'}</span>
                    </span>
                  </div>

                  {/* Date, solutions, upvotes */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-600" />
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-violet-400 font-semibold bg-violet-500/5 px-2 py-0.5 rounded border border-violet-500/10">
                        <FileText className="h-3 w-3" />
                        <span>{p.solutionCount}</span>
                      </div>

                      {/* Upvote button */}
                      <UpvoteButton
                        problemId={p.id}
                        initialCount={p.upvoteCount}
                        initialUpvoted={upvotedSet.has(p.id)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Action footer */}
              <div className="bg-zinc-950 border-t border-zinc-900/60 p-3.5 text-center group-hover:bg-zinc-900/40 transition-colors duration-300">
                <Link
                  href={`/problems/${p.id}`}
                  className="inline-flex items-center text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors gap-1"
                >
                  Explore Idea Reports
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
