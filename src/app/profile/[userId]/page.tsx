import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users, problems, solutions, evaluations, workspaceMembers } from '@/db/schema';
import { eq, count, and, inArray, isNull, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { ProfileView } from '@/components/profile-view';
import { AccountStats } from '@/components/account-stats';
import { FeaturedProblems } from '@/components/featured-problems';
import { FeaturedSolutions } from '@/components/featured-solutions';

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Fetch the target user's profile
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!profile) {
    notFound();
  }

  const isOwner = currentUser?.id === profile.id;

  // Fetch activity stats
  const [problemCount] = await db
    .select({ count: count() })
    .from(problems)
    .where(and(eq(problems.userId, userId), isNull(problems.deletedAt)));

  const [solutionCount] = await db
    .select({ count: count() })
    .from(solutions)
    .where(and(eq(solutions.userId, userId), isNull(solutions.deletedAt)));

  const evaluationCountResult = await db
    .select({ count: count() })
    .from(evaluations)
    .innerJoin(solutions, eq(evaluations.solutionId, solutions.id))
    .where(and(eq(solutions.userId, userId), isNull(solutions.deletedAt)));

  const [workspaceCount] = await db
    .select({ count: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId));

  const stats = {
    problems: problemCount?.count ?? 0,
    solutions: solutionCount?.count ?? 0,
    evaluations: evaluationCountResult[0]?.count ?? 0,
    workspaces: workspaceCount?.count ?? 0,
  };

  // Fetch featured problems
  let featuredProblemsData: {
    id: string;
    title: string;
    description: string;
    tags: string[] | null;
    solutionCount: number;
    createdAt: Date;
  }[] = [];

  if (profile.featuredProblems && profile.featuredProblems.length > 0) {
    featuredProblemsData = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        tags: problems.tags,
        solutionCount: sql<number>`cast(count(${solutions.id}) as integer)`,
        createdAt: problems.createdAt,
      })
      .from(problems)
      .leftJoin(solutions, and(eq(solutions.problemId, problems.id), isNull(solutions.deletedAt)))
      .where(and(
        inArray(problems.id, profile.featuredProblems),
        isNull(problems.deletedAt)
      ))
      .groupBy(problems.id);
  }

  // Fetch featured solutions
  let featuredSolutionsData: {
    id: string;
    content: string;
    problemTitle: string;
    problemId: string;
    overallScore: number | null;
    createdAt: Date;
  }[] = [];

  if (profile.featuredSolutions && profile.featuredSolutions.length > 0) {
    const rawSolutions = await db
      .select({
        id: solutions.id,
        content: solutions.content,
        problemTitle: problems.title,
        problemId: problems.id,
        createdAt: solutions.createdAt,
      })
      .from(solutions)
      .innerJoin(problems, eq(solutions.problemId, problems.id))
      .where(and(
        inArray(solutions.id, profile.featuredSolutions),
        isNull(solutions.deletedAt)
      ));

    // Fetch evaluation scores for these solutions
    for (const sol of rawSolutions) {
      const [evalResult] = await db
        .select({ overallScore: evaluations.overallScore })
        .from(evaluations)
        .where(eq(evaluations.solutionId, sol.id))
        .orderBy(sql`${evaluations.createdAt} desc`)
        .limit(1);

      featuredSolutionsData.push({
        ...sol,
        overallScore: evalResult?.overallScore ?? null,
      });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] rounded-full bg-violet-500/5 dark:bg-violet-900/5 filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 dark:bg-indigo-900/5 filter blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          {/* Profile View */}
          <div className="mb-8">
            <ProfileView user={{
              id: profile.id,
              email: profile.email,
              name: profile.name,
              bio: profile.bio,
              location: profile.location,
              avatarUrl: profile.avatarUrl,
              createdAt: profile.createdAt,
            }} isOwner={isOwner} />
          </div>

          {/* Activity Stats */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider font-display">Activity</h2>
            <AccountStats stats={stats} />
          </div>

          {/* Featured Problems */}
          <div className="mb-8">
            <FeaturedProblems problems={featuredProblemsData} />
          </div>

          {/* Featured Solutions */}
          <div className="mb-8">
            <FeaturedSolutions solutions={featuredSolutionsData} />
          </div>
        </div>
      </main>
      <footer className="border-t border-border py-6 bg-card/60 backdrop-blur-md text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Idea Checker. Public Profile.
      </footer>
    </div>
  );
}
