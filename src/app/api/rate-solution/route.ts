import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutionRatings, solutions, problems } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, sql, avg } from 'drizzle-orm';
import { z } from 'zod';

const schema = z.object({
  solutionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { solutionId, rating } = schema.parse(body);

    // Fetch solution + problem to verify it's public and rater isn't the owner
    const solutionResult = await db
      .select({ solution: solutions, problem: problems })
      .from(solutions)
      .innerJoin(problems, eq(solutions.problemId, problems.id))
      .where(eq(solutions.id, solutionId))
      .limit(1);

    if (!solutionResult[0]) return NextResponse.json({ error: 'Solution not found' }, { status: 404 });

    const { solution, problem } = solutionResult[0];

    // Must be a public problem
    if (!problem.isPublic) return NextResponse.json({ error: 'Solution is not on a public problem' }, { status: 403 });

    // Solution owner cannot rate their own solution
    if (solution.userId === user.id) {
      return NextResponse.json({ error: "You can't rate your own solution" }, { status: 403 });
    }

    // Upsert rating
    await db.insert(solutionRatings)
      .values({ solutionId, userId: user.id, rating, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [solutionRatings.solutionId, solutionRatings.userId],
        set: { rating, updatedAt: new Date() },
      });

    // Return aggregate stats
    const stats = await db
      .select({
        averageRating: sql<number>`round(avg(${solutionRatings.rating})::numeric, 1)::float8`,
        totalRatings: sql<number>`count(*)::int`,
      })
      .from(solutionRatings)
      .where(eq(solutionRatings.solutionId, solutionId));

    // Get user's own rating
    const userRating = await db
      .select({ rating: solutionRatings.rating })
      .from(solutionRatings)
      .where(and(eq(solutionRatings.solutionId, solutionId), eq(solutionRatings.userId, user.id)))
      .limit(1);

    return NextResponse.json({
      averageRating: stats[0]?.averageRating ?? rating,
      totalRatings: stats[0]?.totalRatings ?? 1,
      userRating: userRating[0]?.rating ?? rating,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('Rate solution error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save rating' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const solutionId = searchParams.get('solutionId');
    if (!solutionId) return NextResponse.json({ error: 'solutionId required' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const stats = await db
      .select({
        averageRating: sql<number>`round(avg(${solutionRatings.rating})::numeric, 1)::float8`,
        totalRatings: sql<number>`count(*)::int`,
      })
      .from(solutionRatings)
      .where(eq(solutionRatings.solutionId, solutionId));

    let userRating = 0;
    if (user) {
      const ur = await db.select({ rating: solutionRatings.rating })
        .from(solutionRatings)
        .where(and(eq(solutionRatings.solutionId, solutionId), eq(solutionRatings.userId, user.id)))
        .limit(1);
      userRating = ur[0]?.rating ?? 0;
    }

    return NextResponse.json({
      averageRating: stats[0]?.averageRating ?? 0,
      totalRatings: stats[0]?.totalRatings ?? 0,
      userRating,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
