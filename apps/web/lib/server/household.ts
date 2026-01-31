'use server';

import type { HouseholdId } from '@commontable/types';

import { createClient } from '@/lib/supabase/server';

/**
 * Get the household ID for the current authenticated user
 *
 * This helper correctly resolves the user's profile ID and queries household_members.
 * The key insight is that household_members.user_id references profiles.id, not auth.users.id.
 *
 * @throws {Error} If user not authenticated or not in a household
 * @returns The user's household ID
 */
export async function getCurrentUserHouseholdId(): Promise<HouseholdId> {
  const supabase = await createClient();

  // Get current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's profile (profiles.id is the universal user ID)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id) // Map auth.users.id → profiles.id
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  // Get household membership using profile.id
  const { data: householdMember, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', profile.id) // ← profile.id, NOT user.id
    .single();

  if (memberError || !householdMember) {
    throw new Error('User not in a household');
  }

  return householdMember.household_id as HouseholdId;
}
