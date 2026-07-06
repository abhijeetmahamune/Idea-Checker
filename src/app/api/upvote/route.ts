import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { problemUpvotes, problems } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({ problemId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { problemId } = schema.parse(body);

    // Check problem exists and is public
    const problem = await db.select({ id: problems.id, isPublic: problems.isPublic })
      .from(problems).where(eq(problems.id, problemId)).limit(1);
    if (!problem[0]) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    if (!problem[0].isPublic) return NextResponse.json({ error: 'Problem is not public' }, { status: 403 });

    // Check if user already upvoted
    const existing = await db.select({ id: problemUpvotes.id })
      .from(problemUpvotes)
      .where(and(eq(problemUpvotes.problemId, problemId), eq(problemUpvotes.userId, user.id)))
      .limit(1);

    let upvoted: boolean;
    if (existing.length > 0) {
      // Remove upvote
      await db.delete(problemUpvotes)
        .where(and(eq(problemUpvotes.problemId, problemId), eq(problemUpvotes.userId, user.id)));
      upvoted = false;
    } else {
      // Add upvote
      await db.insert(problemUpvotes).values({ problemId, userId: user.id });
      upvoted = true;
    }

    // Get new total count
    const countResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(problemUpvotes).where(eq(problemUpvotes.problemId, problemId));
    const count = countResult[0]?.count ?? 0;

    return NextResponse.json({ upvoted, count });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('Upvote error:', err);
    return NextResponse.json({ error: err.message || 'Failed to toggle upvote' }, { status: 500 });
  }
}
