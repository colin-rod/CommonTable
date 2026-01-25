'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

/**
 * ActionResult type for server actions
 */
export type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };

/**
 * Update user profile
 */
export async function updateProfile(data: { display_name: string }): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: data.display_name })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { success: false, error: 'Failed to update profile' };
    }

    revalidatePath('/settings/profile');
    revalidatePath('/settings/household');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('updateProfile error:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Change user password
 */
export async function changePassword(data: {
  current_password: string;
  new_password: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.current_password,
    });

    if (signInError) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.new_password,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return { success: false, error: 'Failed to change password' };
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error('changePassword error:', error);
    return { success: false, error: 'Failed to change password' };
  }
}
