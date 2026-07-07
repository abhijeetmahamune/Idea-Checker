import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaces, workspaceMembers, users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { inviteCode } = z.object({ inviteCode: z.string().min(1) }).parse(body);

    // Find workspace by invite code
    const workspace = await db.select()
      .from(workspaces)
      .where(eq(workspaces.inviteCode, inviteCode.toUpperCase()))
      .limit(1);

    if (!workspace[0]) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

    // Check if already a member
    const existing = await db.select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspace[0].id),
        eq(workspaceMembers.userId, user.id)
      ))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ workspaceId: workspace[0].id, alreadyMember: true });
    }

    // Add as editor
    await db.insert(workspaceMembers).values({
      workspaceId: workspace[0].id,
      userId: user.id,
      role: 'editor',
    });

    return NextResponse.json({ workspaceId: workspace[0].id, alreadyMember: false });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: err.message || 'Failed to join workspace' }, { status: 500 });
  }
}
