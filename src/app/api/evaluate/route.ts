import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { problems, solutions, evaluations } from '@/db/schema';
import { checkRateLimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { evaluateSolution } from '@/lib/evaluator';
import { generatePivots } from '@/lib/solution-generator';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';

// Validation schema for request body
const evaluateRequestSchema = z.object({
  problemTitle: z.string().optional(),
  problemDescription: z.string().optional(),
  solutionContent: z.string().min(30, 'Solution content must be at least 30 characters long.'),
  tags: z.array(z.string()).optional(),
  problemId: z.string().uuid().optional(), // If proposing a solution to an existing problem
  domain: z.string().optional(),           // Optional domain hint for tailored evaluation
}).superRefine((data, ctx) => {
  if (!data.problemId) {
    if (!data.problemTitle || data.problemTitle.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Problem title must be at least 5 characters long.',
        path: ['problemTitle'],
      });
    }
    if (!data.problemDescription || data.problemDescription.length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Problem description must be at least 20 characters long.',
        path: ['problemDescription'],
      });
    }
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = evaluateRequestSchema.parse(body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const guestSessionId = request.cookies.get('guest_session_id')?.value;
    const isGuest = !user;

    // Rate Limiting Key Determination
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
      // Combine Guest ID and IP to prevent spoofing
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      rateLimitKey = `guest:${guestSessionId}:${ip}`;
    }

    // Perform Rate Limit Check
    const rateLimit = await checkRateLimit(rateLimitKey, isGuest);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: isGuest
            ? 'Guest rate limit reached (3 evaluations per day). Please sign up to run more evaluations!'
            : 'Rate limit reached. Please wait before running more evaluations.',
          reset: rateLimit.reset,
        },
        { status: 429 }
      );
    }

    let activeProblemId = validatedData.problemId;
    let problemDesc: string;

    // If existing problemId is provided, fetch and verify ownership/guestSessionId match
    if (activeProblemId) {
      const existing = await db
        .select()
        .from(problems)
        .where(and(eq(problems.id, activeProblemId), isNull(problems.deletedAt)))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json({ error: 'Problem not found.' }, { status: 404 });
      }

      const problemOwner = existing[0];
      // Ensure the caller is either the user owner or guest session owner
      if (
        (problemOwner.userId && problemOwner.userId !== user?.id) ||
        (!problemOwner.userId && problemOwner.guestSessionId !== guestSessionId)
      ) {
        return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
      }

      problemDesc = problemOwner.description;
    } else {
      if (!validatedData.problemTitle || !validatedData.problemDescription) {
        return NextResponse.json(
          { error: 'Problem title and description are required.' },
          { status: 400 }
        );
      }
      problemDesc = validatedData.problemDescription;

      // Create new problem record
      const newProblem = await db
        .insert(problems)
        .values({
          userId: user?.id || null,
          guestSessionId: user ? null : guestSessionId,
          title: validatedData.problemTitle,
          description: validatedData.problemDescription,
          tags: validatedData.tags || [],
        })
        .returning();

      activeProblemId = newProblem[0].id;
    }

    // Create new solution record
    const newSolution = await db
      .insert(solutions)
      .values({
        problemId: activeProblemId!,
        userId: user?.id || null,
        guestSessionId: user ? null : guestSessionId,
        content: validatedData.solutionContent,
      })
      .returning();

    const activeSolutionId = newSolution[0].id;

    // Run AI Evaluation (with optional domain context)
    const evaluationData = await evaluateSolution(
      problemDesc,
      validatedData.solutionContent,
      validatedData.domain
    );

    // Auto-generate pivot suggestions if score is below 60
    let pivotSuggestions = null;
    if (evaluationData.overallScore < 60) {
      try {
        pivotSuggestions = await generatePivots(
          problemDesc,
          validatedData.solutionContent,
          evaluationData.overallScore,
          validatedData.domain
        );
      } catch (pivotErr) {
        console.warn('Pivot generation failed (non-fatal):', pivotErr);
      }
    }

    // Save evaluation in database
    await db.insert(evaluations).values({
      solutionId: activeSolutionId,
      feasibility: evaluationData.feasibility,
      effectiveness: evaluationData.effectiveness,
      scalability: evaluationData.scalability,
      costEfficiency: evaluationData.costEfficiency,
      innovation: evaluationData.innovation,
      overallScore: evaluationData.overallScore,
      domain: validatedData.domain ?? null,
      feedback: evaluationData.feedback,
      pivotSuggestions,
      successfulModels: evaluationData.successfulModels,
      failedModels: evaluationData.failedModels,
    });

    return NextResponse.json({
      success: true,
      problemId: activeProblemId,
      solutionId: activeSolutionId,
      evaluation: evaluationData,
    });
  } catch (error: any) {
    console.error('API evaluation route error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((e) => e.message).join(' ') },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during evaluation.' },
      { status: 500 }
    );
  }
}
