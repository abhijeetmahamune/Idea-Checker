'use server';

import { db } from '@/db';
import { problems, solutions } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

  let newId: string;
  try {
    const inserted = await db
      .insert(problems)
      .values({
        userId: user.id,
        title,
        description,
        tags,
      })
      .returning();

    newId = inserted[0].id;
  } catch (err: any) {
    return { error: err?.message || 'Failed to create problem context.' };
  }

  redirect(`/problems/${newId}`);
}

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
      })
      .where(and(eq(problems.id, id), eq(problems.userId, user.id)));

    revalidatePath(`/problems/${id}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to edit problem context.' };
  }
}

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
  } catch (err: any) {
    return { error: err?.message || 'Failed to delete problem context.' };
  }

  redirect('/dashboard');
}

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
  } catch (err: any) {
    return { error: err?.message || 'Failed to update problem visibility.' };
  }
}

