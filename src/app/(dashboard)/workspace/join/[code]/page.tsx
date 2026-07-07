import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { workspaces, workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function JoinWorkspacePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/workspace/join/${code}`);
  }

  // Find workspace by invite code (server-side, no HTTP round-trip needed)
  const workspace = await db.select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.inviteCode, code.toUpperCase()))
    .limit(1);

  if (!workspace[0]) {
    redirect('/dashboard?error=invalid_invite');
  }

  const workspaceId = workspace[0].id;

  // Check if already a member
  const existing = await db.select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    // Add as editor
    await db.insert(workspaceMembers).values({
      workspaceId,
      userId: user.id,
      role: 'editor',
    });
  }

  redirect(`/workspace/${workspaceId}`);
}
