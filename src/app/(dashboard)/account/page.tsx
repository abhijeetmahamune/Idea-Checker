import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users, problems, solutions, evaluations, workspaceMembers } from '@/db/schema';
import { eq, count, and, isNull, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/auth-actions';
import { updateFeaturedProblemsAction, updateFeaturedSolutionsAction } from '@/app/account-actions';
import { ProfileForm } from '@/components/profile-form';
import { SecurityForm } from '@/components/security-form';
import { AccountStats } from '@/components/account-stats';
import { FeaturedPicker } from '@/components/featured-picker';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Lightbulb, Zap } from 'lucide-react';
import Link from 'next/link';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile from public.users
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!profile) {
    redirect('/login');
  }

  // Fetch activity stats
  const [problemCount] = await db
    .select({ count: count() })
    .from(problems)
    .where(and(eq(problems.userId, user.id), isNull(problems.deletedAt)));

  const [solutionCount] = await db
    .select({ count: count() })
    .from(solutions)
    .where(and(eq(solutions.userId, user.id), isNull(solutions.deletedAt)));

  const evaluationCountResult = await db
    .select({ count: count() })
    .from(evaluations)
    .innerJoin(solutions, eq(evaluations.solutionId, solutions.id))
    .where(and(eq(solutions.userId, user.id), isNull(solutions.deletedAt)));

  const [workspaceCount] = await db
    .select({ count: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id));

  const stats = {
    problems: problemCount?.count ?? 0,
    solutions: solutionCount?.count ?? 0,
    evaluations: evaluationCountResult[0]?.count ?? 0,
    workspaces: workspaceCount?.count ?? 0,
  };

  // Fetch user's problems for the picker
  const userProblems = await db
    .select({ id: problems.id, title: problems.title, description: problems.description })
    .from(problems)
    .where(and(eq(problems.userId, user.id), isNull(problems.deletedAt)))
    .orderBy(sql`${problems.createdAt} desc`);

  const problemPickerItems = userProblems.map(p => ({
    id: p.id,
    label: p.title,
    sublabel: p.description.slice(0, 80) + (p.description.length > 80 ? '...' : ''),
  }));

  // Fetch user's solutions for the picker
  const userSolutions = await db
    .select({
      id: solutions.id,
      content: solutions.content,
      problemTitle: problems.title,
    })
    .from(solutions)
    .innerJoin(problems, eq(solutions.problemId, problems.id))
    .where(and(eq(solutions.userId, user.id), isNull(solutions.deletedAt)))
    .orderBy(sql`${solutions.createdAt} desc`);

  const solutionPickerItems = userSolutions.map(s => ({
    id: s.id,
    label: s.content.slice(0, 60) + (s.content.length > 60 ? '...' : ''),
    sublabel: `For: ${s.problemTitle}`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your profile and security preferences</p>
            </div>
          </div>
          <Link href={`/profile/${user.id}`}>
            <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent gap-1.5 cursor-pointer">
              View Profile
            </Button>
          </Link>
        </div>

        {/* Activity Stats */}
        <div className="mb-8">
          <h2 className="font-display text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Your Activity</h2>
          <AccountStats stats={stats} />
        </div>

        {/* Profile Form */}
        <div className="mb-8">
          <ProfileForm user={{
            id: profile.id,
            email: profile.email,
            name: profile.name,
            bio: profile.bio,
            location: profile.location,
            avatarUrl: profile.avatarUrl,
            createdAt: profile.createdAt,
          }} />
        </div>

        {/* Featured Problems Picker */}
        <div className="mb-8">
          <FeaturedPicker
            title="Featured Problems"
            icon={<Lightbulb className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            items={problemPickerItems}
            selectedIds={profile.featuredProblems || []}
            maxSelections={3}
            onSave={updateFeaturedProblemsAction}
          />
        </div>

        {/* Featured Solutions Picker */}
        <div className="mb-8">
          <FeaturedPicker
            title="Featured Solutions"
            icon={<Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            items={solutionPickerItems}
            selectedIds={profile.featuredSolutions || []}
            maxSelections={3}
            onSave={updateFeaturedSolutionsAction}
          />
        </div>

        {/* Security Form */}
        <div className="mb-8">
          <SecurityForm />
        </div>

        {/* Logout Section */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">Session</h3>
              <p className="text-xs text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <form action={signOut}>
              <Button 
                variant="outline" 
                type="submit" 
                className="border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
