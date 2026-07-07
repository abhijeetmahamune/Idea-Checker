import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { problemComments, problems, users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');
    if (!problemId) return NextResponse.json({ error: 'problemId required' }, { status: 400 });

    const comments = await db
      .select({
        id: problemComments.id,
        content: problemComments.content,
        createdAt: problemComments.createdAt,
        userId: problemComments.userId,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(problemComments)
      .leftJoin(users, eq(problemComments.userId, users.id))
      .where(eq(problemComments.problemId, problemId))
      .orderBy(asc(problemComments.createdAt));

    return NextResponse.json({ comments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { problemId, content } = z.object({
      problemId: z.string().uuid(),
      content: z.string().min(1).max(1000),
    }).parse(body);

    // Verify the problem is public or user owns it
    const problem = await db.select({ isPublic: problems.isPublic, userId: problems.userId })
      .from(problems).where(eq(problems.id, problemId)).limit(1);
    if (!problem[0]) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    if (!problem[0].isPublic && problem[0].userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [comment] = await db.insert(problemComments)
      .values({ problemId, userId: user.id, content })
      .returning();

    return NextResponse.json({ comment });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 });

    // Fetch comment to verify ownership
    const [comment] = await db.select({
      id: problemComments.id,
      userId: problemComments.userId,
      problemId: problemComments.problemId,
    }).from(problemComments).where(eq(problemComments.id, commentId)).limit(1);

    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    // Allow: comment author OR problem owner
    const problem = await db.select({ userId: problems.userId })
      .from(problems).where(eq(problems.id, comment.problemId)).limit(1);

    const canDelete = comment.userId === user.id || problem[0]?.userId === user.id;
    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db.delete(problemComments).where(eq(problemComments.id, commentId));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
