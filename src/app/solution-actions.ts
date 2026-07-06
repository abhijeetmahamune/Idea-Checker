'use server';

import { db } from '@/db';
import { solutions, problems, evaluations } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { evaluateSolution } from '@/lib/evaluator';

export async function editSolutionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to edit a solution.' };
  }

  const id = formData.get('id') as string;
  const content = formData.get('content') as string;

  if (!id) {
    return { error: 'Solution ID is missing.' };
  }
  if (!content || content.length < 30) {
    return { error: 'Solution content must be at least 30 characters long.' };
  }

  try {
    // 1. Fetch solution and verify ownership
    const solutionResult = await db
      .select()
      .from(solutions)
      .where(and(eq(solutions.id, id), eq(solutions.userId, user.id)))
      .limit(1);

    if (solutionResult.length === 0) {
      return { error: 'Solution not found or access denied.' };
    }

    const currentSolution = solutionResult[0];

    // 2. Fetch parent problem description to pass to AI engine
    const problemResult = await db
      .select()
      .from(problems)
      .where(eq(problems.id, currentSolution.problemId))
      .limit(1);

    if (problemResult.length === 0) {
      return { error: 'Associated problem context not found.' };
    }

    const parentProblem = problemResult[0];

    // 3. Update solution content in database
    await db
      .update(solutions)
      .set({ content })
      .where(and(eq(solutions.id, id), eq(solutions.userId, user.id)));

    // 4. Trigger AI consensus re-evaluation (pass domain if stored on the solution)
    const evaluationData = await evaluateSolution(parentProblem.description, content);

    // 5. Insert new evaluation results into evaluations table (preserves history)
    await db
      .insert(evaluations)
      .values({
        solutionId: id,
        feasibility: evaluationData.feasibility,
        effectiveness: evaluationData.effectiveness,
        scalability: evaluationData.scalability,
        costEfficiency: evaluationData.costEfficiency,
        innovation: evaluationData.innovation,
        overallScore: evaluationData.overallScore,
        feedback: evaluationData.feedback,
        domain: null, // domain not tracked on re-evaluation unless passed
        pivotSuggestions: null,
        successfulModels: evaluationData.successfulModels,
        failedModels: evaluationData.failedModels,
      });

    revalidatePath(`/problems/${currentSolution.problemId}`);
    revalidatePath(`/problems/${currentSolution.problemId}/solutions/${id}`);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to edit and re-evaluate solution.' };
  }
}

export async function deleteSolutionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to delete a solution.' };
  }

  const id = formData.get('id') as string;

  if (!id) {
    return { error: 'Solution ID is missing.' };
  }

  try {
    // Fetch solution to find parent problem ID and verify ownership
    const solutionResult = await db
      .select()
      .from(solutions)
      .where(and(eq(solutions.id, id), eq(solutions.userId, user.id)))
      .limit(1);

    if (solutionResult.length === 0) {
      return { error: 'Solution not found or access denied.' };
    }

    const currentSolution = solutionResult[0];

    // Soft delete the solution
    await db
      .update(solutions)
      .set({ deletedAt: new Date() })
      .where(and(eq(solutions.id, id), eq(solutions.userId, user.id)));

    revalidatePath(`/problems/${currentSolution.problemId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete solution.' };
  }
}
