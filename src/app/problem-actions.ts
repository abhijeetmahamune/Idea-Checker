'use server';

import { db } from '@/db';
import { problems, solutions } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  isProblemStage,
  isSeekingOption,
  MAX_SEEKING_SELECTIONS,
} from '@/lib/problem-constants';


// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse and validate stage from FormData. Returns 'EXPLORING' as safe default. */
function parseStage(formData: FormData): string {
  const raw = (formData.get('stage') as string | null) ?? 'EXPLORING';
  return isProblemStage(raw) ? raw : 'EXPLORING';
}

/** Parse and validate seeking from FormData (comma-separated string or multiple fields). */
function parseSeeking(formData: FormData): string[] {
  const raw = (formData.get('seeking') as string | null) ?? '';
  const values = raw
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && isSeekingOption(v));
  // Remove duplicates, cap at max
  return [...new Set(values)].slice(0, MAX_SEEKING_SELECTIONS);
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createProblemAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create a problem context.' };
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const tagsString = formData.get('tags') as string;

  if (!title || title.length < 5) {
    return { error: 'Problem title must be at least 5 characters long.' };
  }
  if (!description || description.length < 20) {
    return { error: 'Problem description must be at least 20 characters long.' };
  }

  const tags = tagsString
    ? tagsString
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const stage = parseStage(formData);
  const seeking = parseSeeking(formData);

  // Validate seeking count (server-side guard)
  const rawSeeking = seeking.filter(isSeekingOption);
  if (rawSeeking.length > MAX_SEEKING_SELECTIONS) {
    return { error: `You can select up to ${MAX_SEEKING_SELECTIONS} things you're currently seeking.` };
  }

  let newId: string;
  try {
    const inserted = await db
      .insert(problems)
      .values({
        userId: user.id,
        title,
        description,
        tags,
        stage,
        seeking: rawSeeking,
      })
      .returning();

    newId = inserted[0].id;
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Failed to create problem context.' };
  }

  redirect(`/problems/${newId}`);
}

// ── Edit ──────────────────────────────────────────────────────────────────────

export async function editProblemAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to edit a problem context.' };
  }

  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const tagsString = formData.get('tags') as string;

  if (!id) {
    return { error: 'Problem ID is missing.' };
  }
  if (!title || title.length < 5) {
    return { error: 'Problem title must be at least 5 characters long.' };
  }
  if (!description || description.length < 20) {
    return { error: 'Problem description must be at least 20 characters long.' };
  }

  const tags = tagsString
    ? tagsString
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const stage = parseStage(formData);
  const seeking = parseSeeking(formData);

  if (seeking.length > MAX_SEEKING_SELECTIONS) {
    return { error: `You can select up to ${MAX_SEEKING_SELECTIONS} things you're currently seeking.` };
  }

  try {
    // Check ownership first
    const existing = await db
      .select()
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { error: 'Problem context not found or access denied.' };
    }

    await db
      .update(problems)
      .set({
        title,
        description,
        tags,
        stage,
        seeking,
      })
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)));

    revalidatePath(`/problems/${id}`);
    revalidatePath('/dashboard');
    revalidatePath('/community');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Failed to edit problem context.' };
  }
}

// ── Update Stage (inline from detail page) ────────────────────────────────────

export async function updateProblemStatusAction(
  id: string,
  stage: string,
  seeking?: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update this problem.' };
  }

  if (!id) {
    return { error: 'Problem ID is missing.' };
  }

  // Validate stage
  if (!isProblemStage(stage)) {
    return { error: 'Invalid stage value.' };
  }

  // Validate seeking (if provided)
  if (seeking !== undefined) {
    const invalidValues = seeking.filter((v) => !isSeekingOption(v));
    if (invalidValues.length > 0) {
      return { error: 'Invalid seeking value(s).' };
    }
    if (seeking.length > MAX_SEEKING_SELECTIONS) {
      return { error: `You can select up to ${MAX_SEEKING_SELECTIONS} things you're currently seeking.` };
    }
  }

  try {
    // Check ownership first
    const existing = await db
      .select({ id: problems.id })
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { error: 'Problem context not found or access denied.' };
    }

    const cleanSeeking = seeking !== undefined
      ? [...new Set(seeking)].filter(isSeekingOption)
      : undefined;

    if (cleanSeeking !== undefined) {
      await db
        .update(problems)
        .set({ stage, seeking: cleanSeeking })
        .where(and(eq(problems.id, id), eq(problems.userId, user.id)));
    } else {
      await db
        .update(problems)
        .set({ stage })
        .where(and(eq(problems.id, id), eq(problems.userId, user.id)));
    }

    revalidatePath(`/problems/${id}`);
    revalidatePath('/community');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Failed to update problem status.' };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteProblemAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to delete a problem context.' };
  }

  const id = formData.get('id') as string;

  if (!id) {
    return { error: 'Problem ID is missing.' };
  }

  try {
    // Check ownership first
    const existing = await db
      .select()
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { error: 'Problem context not found or access denied.' };
    }

    const now = new Date();

    // 1. Soft-delete the problem
    await db
      .update(problems)
      .set({ deletedAt: now })
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)));

    // 2. Cascade soft-delete to solutions under this problem context
    await db
      .update(solutions)
      .set({ deletedAt: now })
      .where(and(eq(solutions.problemId, id), eq(solutions.userId, user.id)));

    revalidatePath('/dashboard');
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Failed to delete problem context.' };
  }

  redirect('/dashboard');
}

// ── Visibility ────────────────────────────────────────────────────────────────

export async function toggleProblemVisibilityAction(id: string, isPublic: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to modify problem visibility.' };
  }

  if (!id) {
    return { error: 'Problem ID is missing.' };
  }

  try {
    // Check ownership first
    const existing = await db
      .select()
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)))
      .limit(1);

    if (existing.length === 0) {
      return { error: 'Problem context not found or access denied.' };
    }

    await db
      .update(problems)
      .set({ isPublic })
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)));

    revalidatePath(`/problems/${id}`);
    revalidatePath('/dashboard');
    revalidatePath('/community');
    return { success: true };
  } catch (err: unknown) {
    return { error: (err as Error)?.message || 'Failed to update problem visibility.' };
  }
}
