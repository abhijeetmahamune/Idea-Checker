import { db } from '@/db';
import { problems, solutions } from '@/db/schema';
import { eq, sql, and, isNull } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, Lightbulb, Tag, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export const revalidate = 0; // Disable static caching for live user dashboard data

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch problems owned by user, joined with solution count
  const userProblems = await db
    .select({
      id: problems.id,
      title: problems.title,
      description: problems.description,
      tags: problems.tags,
      createdAt: problems.createdAt,
      solutionCount: sql<number>`cast(count(${solutions.id}) as integer)`,
    })
    .from(problems)
    .leftJoin(solutions, and(eq(solutions.problemId, problems.id), isNull(solutions.deletedAt)))
    .where(and(eq(problems.userId, user.id), isNull(problems.deletedAt)))
    .groupBy(problems.id)
    .orderBy(sql`${problems.createdAt} desc`);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-border">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">Your Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define problems and evaluate multiple solution proposals.
          </p>
        </div>
        <Link href="/problems/new">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-violet-600/10 cursor-pointer">
            <Plus className="h-4 w-4" />
            New Problem
          </Button>
        </Link>
      </div>

      {/* Grid List */}
      {userProblems.length === 0 ? (
        <Card className="border-dashed border-border bg-card/40 p-12 text-center max-w-xl mx-auto mt-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-lg bg-muted p-4 text-muted-foreground">
              <Lightbulb className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">No problems defined yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Create your first problem context, then submit one or more solutions to stress-test them.
          </p>
          <Link href="/problems/new">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" />
              Define First Problem
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userProblems.map((prob) => (
            <Card
              key={prob.id}
              className="border-border/80 dark:border-zinc-900 bg-card/80 dark:bg-zinc-950/80 hover:border-violet-500/40 hover:bg-card transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md relative overflow-hidden group"
            >
              {/* Top border hover glow */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-600 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              
              <CardHeader className="pb-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {prob.tags?.slice(0, 3).map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-muted border border-border text-[10px] text-muted-foreground font-mono py-0.5 px-1.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="font-display text-lg font-bold text-foreground line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {prob.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground line-clamp-3 leading-relaxed mt-1 text-sm">
                  {prob.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 pb-6 border-t border-border/60 mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(prob.createdAt).toLocaleDateString()}
                </span>
                
                <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-semibold bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {prob.solutionCount} {prob.solutionCount === 1 ? 'Solution' : 'Solutions'}
                </span>
                
                <Link
                  href={`/problems/${prob.id}`}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 font-bold transition-colors"
                >
                  View
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
