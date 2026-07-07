import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaces, workspaceMembers, problems } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { randomBytes } from 'crypto';

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F1B9C2"
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { problemId, name } = z.object({
      problemId: z.string().uuid(),
      name: z.string().min(1).max(80),
    }).parse(body);

    // Verify user owns the problem
    const problem = await db.select({ userId: problems.userId })
      .from(problems)
      .where(and(eq(problems.id, problemId), isNull(problems.deletedAt)))
      .limit(1);

    if (!problem[0]) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    if (problem[0].userId !== user.id) {
      return NextResponse.json({ error: 'Only the problem owner can create a workspace' }, { status: 403 });
    }

    // Check if workspace already exists for this problem
    const existing = await db.select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.problemId, problemId))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ error: 'A workspace already exists for this problem', workspaceId: existing[0].id }, { status: 409 });
    }

    // Create workspace
    const inviteCode = generateInviteCode();
    const [workspace] = await db.insert(workspaces).values({
      problemId,
      ownerId: user.id,
      name,
      inviteCode,
    }).returning();

    // Auto-add creator as owner member
    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    });

    return NextResponse.json({ workspaceId: workspace.id, inviteCode });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    console.error('Create workspace error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create workspace' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');
    if (!problemId) return NextResponse.json({ error: 'problemId required' }, { status: 400 });

    const workspace = await db.select()
      .from(workspaces)
      .where(eq(workspaces.problemId, problemId))
      .limit(1);

    return NextResponse.json({ workspace: workspace[0] ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
