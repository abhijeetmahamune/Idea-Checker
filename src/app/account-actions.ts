'use server';

import { db } from '@/db';
import { users, problems, solutions } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, inArray } from 'drizzle-orm';

export async function updateProfileAction(data: { name: string; bio: string; location: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { name, bio, location } = data;

    if (name.length > 100) {
      return { error: 'Name must be 100 characters or less' };
    }
    if (bio.length > 280) {
      return { error: 'Bio must be 280 characters or less' };
    }
    if (location.length > 100) {
      return { error: 'Location must be 100 characters or less' };
    }

    await db.update(users)
      .set({ 
        name: name || null, 
        bio: bio || null, 
        location: location || null 
      })
      .where(eq(users.id, user.id));

    await supabase.auth.updateUser({ data: { name: name || '' } });

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: 'Failed to update profile' };
  }
}

export async function changePasswordAction(data: { currentPassword: string; newPassword: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { currentPassword, newPassword } = data;

    if (!currentPassword || !newPassword) {
      return { error: 'All fields are required' };
    }

    if (newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters' };
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return { error: 'Current password is incorrect' };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { error: 'Failed to update password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { error: 'Failed to update password' };
  }
}

export async function updateFeaturedProblemsAction(problemIds: string[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    if (problemIds.length > 3) {
      return { error: 'You can feature up to 3 problems' };
    }

    // Verify all problem IDs belong to the user
    if (problemIds.length > 0) {
      const ownedProblems = await db
        .select({ id: problems.id })
        .from(problems)
        .where(and(
          inArray(problems.id, problemIds),
          eq(problems.userId, user.id)
        ));

      if (ownedProblems.length !== problemIds.length) {
        return { error: 'You can only feature your own problems' };
      }
    }

    await db.update(users)
      .set({ featuredProblems: problemIds.length > 0 ? problemIds : null })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Error updating featured problems:', error);
    return { error: 'Failed to update featured problems' };
  }
}

export async function updateFeaturedSolutionsAction(solutionIds: string[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    if (solutionIds.length > 3) {
      return { error: 'You can feature up to 3 solutions' };
    }

    // Verify all solution IDs belong to the user
    if (solutionIds.length > 0) {
      const ownedSolutions = await db
        .select({ id: solutions.id })
        .from(solutions)
        .where(and(
          inArray(solutions.id, solutionIds),
          eq(solutions.userId, user.id)
        ));

      if (ownedSolutions.length !== solutionIds.length) {
        return { error: 'You can only feature your own solutions' };
      }
    }

    await db.update(users)
      .set({ featuredSolutions: solutionIds.length > 0 ? solutionIds : null })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Error updating featured solutions:', error);
    return { error: 'Failed to update featured solutions' };
  }
}
