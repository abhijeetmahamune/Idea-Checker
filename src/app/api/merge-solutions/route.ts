import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutions, problems, evaluations } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, inArray, and, isNull } from 'drizzle-orm';
import { mergeSolutions } from '@/lib/solution-merger';
import { evaluateSolution } from '@/lib/evaluator';
import { z } from 'zod';

const schema = z.object({
  problemId: z.string().uuid(),
  solutionIds: z.array(z.string().uuid()).min(2).max(4),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { problemId, solutionIds } = schema.parse(body);

    // Verify user owns this problem
    const problem = await db.select({ id: problems.id, description: problems.description, userId: problems.userId })
      .from(problems)
      .where(and(eq(problems.id, problemId), isNull(problems.deletedAt)))
      .limit(1);

    if (!problem[0]) return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    if (problem[0].userId !== user.id) {
      return NextResponse.json({ error: 'Only the problem owner can merge solutions' }, { status: 403 });
    }

    // Fetch all selected solutions
    const selectedSolutions = await db.select({ id: solutions.id, content: solutions.content })
      .from(solutions)
      .where(and(
        inArray(solutions.id, solutionIds),
        eq(solutions.problemId, problemId),
        isNull(solutions.deletedAt)
      ));

    if (selectedSolutions.length < 2) {
      return NextResponse.json({ error: 'At least 2 valid solutions are required' }, { status: 400 });
    }

    // 1. AI-merge the solutions
    const mergedContent = await mergeSolutions(problem[0].description, selectedSolutions);

    // 2. Insert merged solution
    const [mergedSolution] = await db.insert(solutions).values({
      problemId,
      userId: user.id,
      content: mergedContent,
      isMerged: true,
      mergedFromIds: solutionIds,
    }).returning();

    // 3. Auto-evaluate the merged solution
    const evaluationData = await evaluateSolution(problem[0].description, mergedContent);

    await db.insert(evaluations).values({
      solutionId: mergedSolution.id,
      feasibility: evaluationData.feasibility,
      effectiveness: evaluationData.effectiveness,
      scalability: evaluationData.scalability,
      costEfficiency: evaluationData.costEfficiency,
      innovation: evaluationData.innovation,
      overallScore: evaluationData.overallScore,
      feedback: evaluationData.feedback,
      domain: null,
      pivotSuggestions: null,
      successfulModels: evaluationData.successfulModels,
      failedModels: evaluationData.failedModels,
    });

    return NextResponse.json({
      solutionId: mergedSolution.id,
      score: evaluationData.overallScore,
      content: mergedContent,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request: ' + err.issues[0]?.message }, { status: 400 });
    }
    console.error('Merge solutions error:', err);
    return NextResponse.json({ error: err.message || 'Failed to merge solutions' }, { status: 500 });
  }
}
