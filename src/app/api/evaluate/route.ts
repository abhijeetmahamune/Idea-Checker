import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { problems, solutions, evaluations } from '@/db/schema';
import { checkRateLimit } from '@/lib/ratelimit';
import { createClient } from '@/lib/supabase/server';
import { evaluateSolution } from '@/lib/evaluator';
import { generatePivots } from '@/lib/solution-generator';
import { z } from 'zod';
import { eq, and, isNull, desc } from 'drizzle-orm';
import crypto from 'crypto';

// Validation schema for request body
const evaluateRequestSchema = z.object({
  problemTitle: z.string().optional(),
  problemDescription: z.string().optional(),
  solutionContent: z.string().min(30, 'Solution content must be at least 30 characters long.'),
  tags: z.array(z.string()).optional(),
  problemId: z.string().uuid().optional(), // If proposing a solution to an existing problem
  domain: z.string().optional(),           // Optional domain hint for tailored evaluation
  force: z.boolean().optional(),
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

    function computeHash(problem: string, solution: string): string {
      return crypto.createHash('sha256').update(`${problem || ''}||${solution || ''}`).digest('hex');
    }

    const hash = computeHash(problemDesc, validatedData.solutionContent);

    // 1. Caching check (unless force is true)
    let evaluationData;
    let pivotSuggestions = null;
    let cacheHit = false;

    if (!validatedData.force) {
      const cached = await db
        .select()
        .from(evaluations)
        .where(eq(evaluations.contentHash, hash))
        .orderBy(desc(evaluations.createdAt))
        .limit(1);

      if (cached.length > 0) {
        console.log(`[Cache Hit] Reusing evaluation for solution ${activeSolutionId}`);
        cacheHit = true;
        
        evaluationData = {
          feasibility: cached[0].feasibility,
          effectiveness: cached[0].effectiveness,
          scalability: cached[0].scalability,
          costEfficiency: cached[0].costEfficiency,
          innovation: cached[0].innovation,
          overallScore: cached[0].overallScore,
          feedback: cached[0].feedback,
          successfulModels: cached[0].successfulModels,
          failedModels: cached[0].failedModels,
        };

        pivotSuggestions = cached[0].pivotSuggestions;

        // Save cloned evaluation record
        await db.insert(evaluations).values({
          solutionId: activeSolutionId,
          feasibility: cached[0].feasibility,
          effectiveness: cached[0].effectiveness,
          scalability: cached[0].scalability,
          costEfficiency: cached[0].costEfficiency,
          innovation: cached[0].innovation,
          overallScore: cached[0].overallScore,
          domain: validatedData.domain ?? null,
          feedback: cached[0].feedback,
          pivotSuggestions,
          successfulModels: cached[0].successfulModels,
          failedModels: cached[0].failedModels,
          
          rawResponses: cached[0].rawResponses,
          consensusResult: cached[0].consensusResult,
          modelUsed: cached[0].modelUsed,
          promptVersion: cached[0].promptVersion,
          generationTimeMs: cached[0].generationTimeMs,
          promptTokens: cached[0].promptTokens,
          completionTokens: cached[0].completionTokens,
          totalTokens: cached[0].totalTokens,
          estimatedCost: cached[0].estimatedCost,
          contentHash: hash,
        });
      }
    }

    if (!cacheHit) {
      // Run AI Evaluation (with optional domain context)
      const freshEval = await evaluateSolution(
        problemDesc,
        validatedData.solutionContent,
        validatedData.domain
      );

      evaluationData = freshEval;

      // Auto-generate pivot suggestions if score is below 60
      if (freshEval.overallScore < 60) {
        try {
          pivotSuggestions = await generatePivots(
            problemDesc,
            validatedData.solutionContent,
            freshEval.overallScore,
            validatedData.domain
          );
        } catch (pivotErr) {
          console.warn('Pivot generation failed (non-fatal):', pivotErr);
        }
      }

      // Save evaluation in database
      await db.insert(evaluations).values({
        solutionId: activeSolutionId,
        feasibility: freshEval.feasibility,
        effectiveness: freshEval.effectiveness,
        scalability: freshEval.scalability,
        costEfficiency: freshEval.costEfficiency,
        innovation: freshEval.innovation,
        overallScore: freshEval.overallScore,
        domain: validatedData.domain ?? null,
        feedback: freshEval.feedback,
        pivotSuggestions,
        successfulModels: freshEval.successfulModels,
        failedModels: freshEval.failedModels,
        
        rawResponses: freshEval.rawResponses,
        consensusResult: freshEval.consensusResult,
        modelUsed: 'consensus-ensemble',
        promptVersion: 'evaluator-v1',
        generationTimeMs: freshEval.generationTimeMs,
        promptTokens: freshEval.promptTokens,
        completionTokens: freshEval.completionTokens,
        totalTokens: freshEval.totalTokens,
        estimatedCost: freshEval.estimatedCost,
        contentHash: hash,
      });
    }

    return NextResponse.json({
      success: true,
      problemId: activeProblemId,
      solutionId: activeSolutionId,
      evaluation: evaluationData,
      cached: cacheHit,
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
