import { db } from '@/db';
import { problemUpvotes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  Calendar,
  User,
  Globe,
  ArrowRight,
  ArrowUpDown,
  LogIn,
  Lightbulb,
  ThumbsUp,
  MessageCircle,
} from 'lucide-react';
import { UpvoteButton } from '@/components/upvote-button';
import {
  CommunityCardIntelligence,
  type CardIntelligenceState,
} from '@/components/community-card-intelligence';
import { getStageInfo, getSeekingInfo } from '@/lib/problem-constants';


export const revalidate = 0;

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicProblemRow {
  id: string;
  title: string;
  description: string;
  tags: string[] | null;
  createdAt: Date;
  authorName: string | null;
  authorEmail: string | null;
  solutionCount: number;
  upvoteCount: number;
  commentCount: number;
  topSolutionAvgRating: number | null;
  topSolutionRatingCount: number;
  aiScore: number | null;
  feasibility: number | null;
  effectiveness: number | null;
  scalability: number | null;
  costEfficiency: number | null;
  innovation: number | null;
  stage: string;
  seeking: string[];
}

// ── Intelligence state helper ──────────────────────────────────────────────────

function deriveCardState(row: PublicProblemRow): CardIntelligenceState {
  if (row.solutionCount === 0) return 'no_solutions';
  if (row.aiScore === null) return 'no_eval';
  if (row.topSolutionRatingCount === 0 || row.topSolutionAvgRating === null) return 'eval_only';
  return 'rated_and_evaluated';
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CommunityBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortBy = sort === 'top' ? 'top' : 'latest';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // No redirect — guests can view community in read-only mode

  // ── Single enriched query (no N+1) ────────────────────────────────────────
  //
  // Strategy:
  //  1. CTE `top_sol`: For each problem, pick the single "best" solution.
  //     Best = highest avg star rating (NULLS LAST), then highest AI score.
  //     Uses DISTINCT ON (problem_id) with ORDER BY to select one row/problem.
  //  2. CTE `latest_eval`: For each solution, pick only the newest evaluation.
  //  3. Main SELECT: aggregates problem-level counts + joins the CTEs.
  //
  // One database round-trip regardless of problem count.

  const orderClause =
    sortBy === 'top'
      ? sql`count(distinct pu.id) desc, p.created_at desc`
      : sql`p.created_at desc`;

  const rawRows = await db.execute<{
    id: string;
    title: string;
    description: string;
    tags: string[] | null;
    created_at: Date;
    author_name: string | null;
    author_email: string | null;
    solution_count: number;
    upvote_count: number;
    comment_count: number;
    top_solution_avg_rating: string | null;
    top_solution_rating_count: number;
    stage: string;
    seeking: string[] | null;
    ai_score: number | null;
    feasibility: number | null;
    effectiveness: number | null;
    scalability: number | null;
    cost_efficiency: number | null;
    innovation: number | null;
  }>(sql`
    WITH top_sol AS (
      SELECT DISTINCT ON (s.problem_id)
        s.id            AS solution_id,
        s.problem_id,
        ROUND(AVG(sr.rating)::numeric, 1)::float8 AS avg_rating,
        COUNT(sr.id)::int                          AS rating_count
      FROM solutions s
      LEFT JOIN solution_ratings sr ON sr.solution_id = s.id
      LEFT JOIN evaluations e       ON e.solution_id  = s.id
      WHERE s.deleted_at IS NULL
      GROUP BY s.id, s.problem_id
      ORDER BY
        s.problem_id,
        AVG(sr.rating)      DESC NULLS LAST,
        MAX(e.overall_score) DESC NULLS LAST,
        s.created_at         DESC
    ),
    latest_eval AS (
      SELECT DISTINCT ON (e.solution_id)
        e.solution_id,
        e.overall_score,
        e.feasibility,
        e.effectiveness,
        e.scalability,
        e.cost_efficiency,
        e.innovation
      FROM evaluations e
      ORDER BY e.solution_id, e.created_at DESC
    )
    SELECT
      p.id,
      p.title,
      p.description,
      p.tags,
      p.created_at,
      u.name         AS author_name,
      u.email        AS author_email,
      COUNT(DISTINCT s.id)::int   AS solution_count,
      COUNT(DISTINCT pu.id)::int  AS upvote_count,
      COUNT(DISTINCT pc.id)::int  AS comment_count,
      ts.avg_rating               AS top_solution_avg_rating,
      COALESCE(ts.rating_count, 0)::int AS top_solution_rating_count,
      le.overall_score            AS ai_score,
      le.feasibility,
      le.effectiveness,
      le.scalability,
      le.cost_efficiency,
      le.innovation,
      p.stage,
      p.seeking
    FROM problems p
    LEFT JOIN users            u  ON u.id         = p.user_id
    LEFT JOIN solutions        s  ON s.problem_id = p.id AND s.deleted_at IS NULL
    LEFT JOIN problem_upvotes  pu ON pu.problem_id = p.id
    LEFT JOIN problem_comments pc ON pc.problem_id = p.id
    LEFT JOIN top_sol          ts ON ts.problem_id = p.id
    LEFT JOIN latest_eval      le ON le.solution_id = ts.solution_id
    WHERE p.is_public = true AND p.deleted_at IS NULL
    GROUP BY
      p.id, u.id, p.stage, p.seeking,
      ts.avg_rating, ts.rating_count,
      le.overall_score, le.feasibility, le.effectiveness,
      le.scalability, le.cost_efficiency, le.innovation
    ORDER BY ${orderClause}
  `);

  // Normalize raw DB rows into typed objects
  // drizzle-orm/postgres-js: db.execute() returns a RowList<T[]> which extends Array<T>
  const publicProblems: PublicProblemRow[] = Array.from(rawRows).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    tags: r.tags,
    createdAt: new Date(r.created_at),
    authorName: r.author_name,
    authorEmail: r.author_email,
    solutionCount: Number(r.solution_count),
    upvoteCount: Number(r.upvote_count),
    commentCount: Number(r.comment_count),
    topSolutionAvgRating:
      r.top_solution_avg_rating !== null ? Number(r.top_solution_avg_rating) : null,
    topSolutionRatingCount: Number(r.top_solution_rating_count),
    aiScore: r.ai_score !== null ? Number(r.ai_score) : null,
    feasibility: r.feasibility !== null ? Number(r.feasibility) : null,
    effectiveness: r.effectiveness !== null ? Number(r.effectiveness) : null,
    scalability: r.scalability !== null ? Number(r.scalability) : null,
    costEfficiency: r.cost_efficiency !== null ? Number(r.cost_efficiency) : null,
    innovation: r.innovation !== null ? Number(r.innovation) : null,
    stage: r.stage ?? 'EXPLORING',
    seeking: r.seeking ?? [],
  }));

  // Only fetch user upvotes if logged in
  const upvotedSet = new Set<string>();
  if (user) {
    const userUpvotes = await db
      .select({ problemId: problemUpvotes.problemId })
      .from(problemUpvotes)
      .where(eq(problemUpvotes.userId, user.id));
    userUpvotes.forEach((u) => upvotedSet.add(u.problemId));
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Globe className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            Community Board
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Explore startup ideas, solution proposals, and AI evaluations shared by fellow builders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-lg">
            <Link href="/community?sort=latest">
              <button
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${sortBy === 'latest' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Latest
              </button>
            </Link>
            <Link href="/community?sort=top">
              <button
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${sortBy === 'top' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ArrowUpDown className="h-3 w-3" />
                Top
              </button>
            </Link>
          </div>

          {user ? (
            <Link href="/dashboard">
              <Button className="bg-card border border-border text-foreground hover:bg-accent text-xs cursor-pointer">
                Your Workspace
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <LogIn className="h-3.5 w-3.5" />
                Join Free
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Guest banner */}
      {!user && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/10 dark:bg-violet-950/20 text-sm">
          <LogIn className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0" />
          <p className="text-muted-foreground">
            You&apos;re browsing as a guest.{' '}
            <Link
              href="/register"
              className="text-violet-600 dark:text-violet-400 font-semibold hover:underline transition-colors"
            >
              Create a free account
            </Link>{' '}
            to upvote ideas, submit your own, and get AI evaluations.
          </p>
        </div>
      )}

      {/* Grid List */}
      {publicProblems.length === 0 ? (
        <Card className="border-dashed border-border bg-card/40 p-16 text-center max-w-2xl mx-auto mt-8">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-foreground mb-2">No public ideas yet</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto mb-6">
            Be the first to share one of your startup contexts with the community!
          </p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-6 py-4 cursor-pointer">
              Open Workspace
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicProblems.map((p) => {
            const cardState = deriveCardState(p);
            return (
              <Card
                key={p.id}
                className="border-border/80 dark:border-zinc-900 bg-card/80 dark:bg-zinc-950/40 hover:bg-card dark:hover:bg-zinc-950 hover:border-violet-500/40 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none group-hover:bg-violet-600/10 transition-colors duration-300" />

                <CardContent className="p-6 flex-grow flex flex-col gap-4">
                  {/* Tags + Stage badge */}
                  <div className="flex flex-wrap gap-1 items-center">
                    {p.tags && p.tags.length > 0 ? (
                      p.tags.map((tag, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-muted border border-border text-muted-foreground text-[9px] px-2"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground border-border text-[9px] px-2"
                      >
                        General
                      </Badge>
                    )}
                    {/* Stage badge — compact, always shown */}
                    {(() => {
                      const si = getStageInfo(p.stage);
                      return (
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ml-auto ${si.bgClass} ${si.colorClass}`}>
                          <span aria-hidden="true">{si.emoji}</span>
                          {si.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Title & description */}
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-foreground line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  {/* Seeking badges — compact, only shown if owner selected options */}
                  {p.seeking && p.seeking.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Seeking:</span>
                      {p.seeking.map((val) => {
                        const info = getSeekingInfo(val);
                        if (!info) return null;
                        return (
                          <span
                            key={val}
                            title={info.description}
                            className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                          >
                            <span aria-hidden="true">{info.emoji}</span>
                            {info.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* AI Intelligence section */}
                  <div className="rounded-xl border border-border/60 bg-muted/20 dark:bg-zinc-900/40 p-3">
                    <CommunityCardIntelligence
                      state={cardState}
                      aiScore={p.aiScore}
                      feasibility={p.feasibility}
                      effectiveness={p.effectiveness}
                      scalability={p.scalability}
                      costEfficiency={p.costEfficiency}
                      innovation={p.innovation}
                      topSolutionAvgRating={p.topSolutionAvgRating}
                      topSolutionRatingCount={p.topSolutionRatingCount}
                    />
                  </div>

                  {/* Meta details */}
                  <div className="border-t border-border/60 pt-3 space-y-2 mt-auto">
                    {/* Community activity counts */}
                    <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                        <span className="font-semibold text-foreground">{p.solutionCount}</span>{' '}
                        {p.solutionCount === 1 ? 'Solution' : 'Solutions'}
                      </span>
                      <span className="text-border/80">·</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                        <span className="font-semibold text-foreground">{p.upvoteCount}</span>{' '}
                        {p.upvoteCount === 1 ? 'Supporter' : 'Supporters'}
                      </span>
                      <span className="text-border/80">·</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                        <span className="font-semibold text-foreground">{p.commentCount}</span>{' '}
                        {p.commentCount === 1 ? 'Discussion' : 'Discussions'}
                      </span>
                    </div>

                    {/* Author + date row */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">
                          By:{' '}
                          <span className="font-semibold text-foreground">
                            {p.authorName || p.authorEmail || 'Anonymous'}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar className="h-3 w-3" />
                          <span>{p.createdAt.toLocaleDateString()}</span>
                        </div>
                        {/* Upvote button — guest-aware */}
                        <UpvoteButton
                          problemId={p.id}
                          initialCount={p.upvoteCount}
                          initialUpvoted={upvotedSet.has(p.id)}
                          isGuest={!user}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Action footer */}
                <div className="bg-muted/40 dark:bg-zinc-950 border-t border-border/60 p-3.5 text-center group-hover:bg-muted/70 dark:group-hover:bg-zinc-900/40 transition-colors duration-300">
                  <Link
                    href={`/problems/${p.id}`}
                    className="inline-flex items-center text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline transition-colors gap-1"
                  >
                    Explore Problem
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
