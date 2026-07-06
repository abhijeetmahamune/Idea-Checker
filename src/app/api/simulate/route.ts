import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutions, problems, simulations } from '@/db/schema';
import { checkRateLimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { runStressSimulation } from '@/lib/simulation';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';

const simulateRequestSchema = z.object({
  solutionId: z.string().uuid('Invalid solution ID format.'),
  scenario: z.string().min(10, 'Scenario description must be at least 10 characters long.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = simulateRequestSchema.parse(body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const guestSessionId = request.cookies.get('guest_session_id')?.value;
    const isGuest = !user;

    // Determine Rate limit key
    let rateLimitKey: string;
    if (!isGuest) {
      rateLimitKey = user.id;
    } else {
      if (!guestSessionId) {
        return NextResponse.json(
          { error: 'Session cookie missing. Please refresh and try again.' },
          { status: 400 }
        );
      }
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      rateLimitKey = `guest:${guestSessionId}:${ip}`;
    }

    // Rate Limit checking (shares rate limit bucket with core evaluation)
    const rateLimit = await checkRateLimit(rateLimitKey, isGuest);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: isGuest
            ? 'Guest rate limit reached (3 checks per day). Please sign up to run more simulations!'
            : 'Rate limit reached. Please wait before running more simulations.',
          reset: rateLimit.reset,
        },
        { status: 429 }
      );
    }

    // Fetch solution and parent problem to verify ownership/session access
    const solutionResult = await db
      .select({
        solution: solutions,
        problem: problems,
      })
      .from(solutions)
      .innerJoin(problems, eq(solutions.problemId, problems.id))
      .where(and(eq(solutions.id, validatedData.solutionId), isNull(solutions.deletedAt)))
      .limit(1);

    if (solutionResult.length === 0) {
      return NextResponse.json({ error: 'Solution not found.' }, { status: 404 });
    }

    const { solution, problem } = solutionResult[0];

    // Ownership check (Must match user ID or guest session ID)
    if (!isGuest) {
      if (solution.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
      }
    } else {
      if (solution.guestSessionId !== guestSessionId) {
        return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
      }
    }

    // Run AI Stress simulation
    const simulationResult = await runStressSimulation(
      problem.description,
      solution.content,
      validatedData.scenario
    );

    // Save simulation in the database
    const inserted = await db
      .insert(simulations)
      .values({
        solutionId: validatedData.solutionId,
        userId: user ? user.id : null,
        guestSessionId: user ? null : guestSessionId,
        scenario: validatedData.scenario,
        resilienceScore: simulationResult.resilienceScore,
        feedback: {
          analysis: simulationResult.analysis,
          strengths: simulationResult.strengths,
          weaknesses: simulationResult.weaknesses,
          recommendations: simulationResult.recommendations,
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      simulationId: inserted[0].id,
      simulation: simulationResult,
    });
  } catch (error: any) {
    console.error('API simulate route error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(' ') },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during stress simulation.' },
      { status: 500 }
    );
  }
}
