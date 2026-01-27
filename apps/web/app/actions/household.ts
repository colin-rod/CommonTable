'use server';

import { HouseholdService } from '@commontable/api-client';
import {
  type Household,
  type HouseholdId,
  type HouseholdMemberWithProfile,
  type HouseholdInvitation,
  type InvitationId,
  type ProfileId,
} from '@commontable/types';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

/**
 * Action result type for consistent error handling
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

/**
 * Format error for client consumption
 */
function formatError(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'code' in error ? String(error.code) : undefined,
    };
  }
  return { message: 'An unexpected error occurred' };
}

/**
 * Update household name
 *
 * @param householdId - The household ID
 * @param name - New household name
 * @returns Updated household or error
 */
export async function updateHouseholdName(
  householdId: HouseholdId,
  name: string,
): Promise<ActionResult<Household>> {
  try {
    const supabase = await createClient();
    const service = new HouseholdService(supabase);

    const household = await service.updateHouseholdName(householdId, name);

    revalidatePath('/settings/household');

    return { success: true, data: household };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Update member role (promote to admin or demote to member)
 *
 * @param householdId - The household ID
 * @param userId - Profile ID of the member to update
 * @param newRole - New role ('admin' | 'member')
 * @returns Updated household member or error
 */
export async function updateMemberRole(
  householdId: HouseholdId,
  userId: ProfileId,
  newRole: 'admin' | 'member',
): Promise<ActionResult<HouseholdMemberWithProfile>> {
  try {
    const supabase = await createClient();
    const service = new HouseholdService(supabase);

    const member = await service.updateMemberRole(householdId, userId, newRole);

    revalidatePath('/settings/household');

    return { success: true, data: member };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Resend invitation email
 *
 * @param invitationId - The invitation ID
 * @returns Updated invitation or error
 */
export async function resendInvitation(
  invitationId: InvitationId,
): Promise<ActionResult<HouseholdInvitation>> {
  try {
    const supabase = await createClient();
    const service = new HouseholdService(supabase);

    const invitation = await service.resendInvitation(invitationId);

    revalidatePath('/settings/household');

    return { success: true, data: invitation };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

/**
 * Cancel pending invitation
 *
 * @param invitationId - The invitation ID to cancel
 * @returns Success or error
 */
export async function cancelInvitation(invitationId: InvitationId): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const service = new HouseholdService(supabase);

    await service.cancelInvitation(invitationId);

    revalidatePath('/settings/household');

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}
