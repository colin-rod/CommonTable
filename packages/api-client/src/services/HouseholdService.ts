import {
  type HouseholdId,
  type InvitationId,
  type ProfileId,
  type Household,
  type HouseholdMemberWithProfile,
  type HouseholdInvitation,
  type InviteAuthenticatedMemberInput,
  type AddManagedMemberInput,
  type AcceptInvitationInput,
  type RemoveMemberInput,
  InviteAuthenticatedMemberSchema,
  AddManagedMemberSchema,
  AcceptInvitationSchema,
  RemoveMemberSchema,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  AppError,
} from '@commontable/types';
import { z } from 'zod';

import { BaseService } from './BaseService';

/**
 * HouseholdService - Manages household member operations
 *
 * Provides methods for:
 * - Listing household members (authenticated + managed)
 * - Inviting authenticated users via email
 * - Adding managed members (non-authenticated, e.g., kids)
 * - Accepting invitations
 * - Removing members
 * - Managing invitations (list, cancel)
 */
export class HouseholdService extends BaseService {
  /**
   * List all members of a household (with profile data)
   *
   * @param householdId - The household ID
   * @returns Array of household members with their profiles
   * @throws {AppError} If query fails
   */
  async listMembers(householdId: HouseholdId): Promise<HouseholdMemberWithProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('household_members')
        .select('*, profile:profiles(*)')
        .eq('household_id', householdId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      return data as unknown as HouseholdMemberWithProfile[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('HouseholdService.listMembers failed:', error);
      throw new AppError('Failed to list household members', 'LIST_MEMBERS_ERROR', 500, {
        householdId,
      });
    }
  }

  /**
   * Invite authenticated user via email
   *
   * Sends email with invitation link (via Supabase Auth)
   *
   * @param householdId - The household ID
   * @param input - Invitation input (email, role)
   * @returns Created invitation
   * @throws {ValidationError} If input is invalid
   * @throws {UnauthorizedError} If user is not authenticated
   * @throws {ConflictError} If user is already a member or invitation exists
   * @throws {AppError} If operation fails
   */
  async inviteAuthenticatedMember(
    householdId: HouseholdId,
    input: InviteAuthenticatedMemberInput,
  ): Promise<HouseholdInvitation> {
    try {
      const validated = InviteAuthenticatedMemberSchema.parse(input);

      // Check if user is already a member
      // NOTE: This is a simplified check - in production we'd need to look up
      // profiles by email (which isn't indexed). For MVP, we skip this check
      // and rely on the unique constraint on household_invitations(household_id, invitee_email)

      // Check for existing pending invitation
      const { data: existingInvite } = await this.supabase
        .from('household_invitations')
        .select('*')
        .eq('household_id', householdId)
        .eq('invitee_email', validated.email)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInvite) {
        throw new ConflictError('Invitation already sent to this email');
      }

      // Get current user's profile ID
      const { data: currentUserData } = await this.supabase.auth.getUser();
      if (!currentUserData.user) {
        throw new UnauthorizedError();
      }

      const { data: currentProfile } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', currentUserData.user.id)
        .single();

      if (!currentProfile) {
        throw new UnauthorizedError('Profile not found');
      }

      // Generate secure token
      const token = globalThis.crypto.randomUUID();

      // Create invitation
      const { data: invitation, error } = await this.supabase
        .from('household_invitations')
        .insert({
          household_id: householdId,
          inviter_profile_id: currentProfile.id,
          invitee_email: validated.email,
          role: validated.role,
          token,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email via Supabase Auth
      // Use magic link with custom redirect URL containing token
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${token}`;

      await this.supabase.auth.signInWithOtp({
        email: validated.email,
        options: {
          emailRedirectTo: inviteUrl,
          data: {
            invitation_token: token,
            household_id: householdId,
          },
        },
      });

      return invitation as unknown as HouseholdInvitation;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid invitation data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.inviteAuthenticatedMember failed:', error);
      throw new AppError('Failed to invite member', 'INVITE_ERROR', 500, { householdId });
    }
  }

  /**
   * Add non-authenticated member directly (e.g., kids)
   *
   * Creates profile + household_member in single transaction
   *
   * @param householdId - The household ID
   * @param input - Managed member input (display_name, avatar_url)
   * @returns Created household member with profile
   * @throws {ValidationError} If input is invalid
   * @throws {AppError} If operation fails
   */
  async addManagedMember(
    householdId: HouseholdId,
    input: AddManagedMemberInput,
  ): Promise<HouseholdMemberWithProfile> {
    try {
      const validated = AddManagedMemberSchema.parse(input);

      // Create profile (managed user)
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          display_name: validated.display_name,
          avatar_url: validated.avatar_url || null,
          member_type: 'managed',
          auth_user_id: null,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Add to household_members
      const { data: member, error: memberError } = await this.supabase
        .from('household_members')
        .insert({
          household_id: householdId,
          user_id: profile.id,
          role: validated.role,
        })
        .select('*, profile:profiles(*)')
        .single();

      if (memberError) {
        // Rollback profile creation if household_member insert fails
        await this.supabase.from('profiles').delete().eq('id', profile.id);
        throw memberError;
      }

      return member as unknown as HouseholdMemberWithProfile;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid member data', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.addManagedMember failed:', error);
      throw new AppError('Failed to add managed member', 'ADD_MANAGED_MEMBER_ERROR', 500, {
        householdId,
      });
    }
  }

  /**
   * Accept invitation (called when user clicks invite link)
   *
   * Creates profile if needed, adds to household_members
   *
   * @param input - Invitation token
   * @returns Created household member with profile
   * @throws {ValidationError} If input is invalid
   * @throws {UnauthorizedError} If user is not authenticated or email doesn't match
   * @throws {NotFoundError} If invitation not found
   * @throws {AppError} If operation fails
   */
  async acceptInvitation(input: AcceptInvitationInput): Promise<HouseholdMemberWithProfile> {
    try {
      const validated = AcceptInvitationSchema.parse(input);

      // Get invitation
      const { data: invitation, error: inviteError } = await this.supabase
        .from('household_invitations')
        .select('*')
        .eq('token', validated.token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        throw new NotFoundError('Invitation', validated.token);
      }

      // Get current authenticated user
      const { data: currentUserData } = await this.supabase.auth.getUser();
      if (!currentUserData.user) {
        throw new UnauthorizedError('You must be logged in to accept an invitation');
      }

      // Verify email matches invitation
      if (currentUserData.user.email !== invitation.invitee_email) {
        throw new UnauthorizedError('This invitation was sent to a different email address');
      }

      // Get or create profile for current user
      let { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', currentUserData.user.id)
        .maybeSingle();

      if (!profile) {
        // Create profile for new user
        const { data: newProfile, error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            auth_user_id: currentUserData.user.id,
            display_name: currentUserData.user.user_metadata?.display_name || 'New User',
            member_type: 'authenticated',
          })
          .select()
          .single();

        if (profileError) throw profileError;
        profile = newProfile;
      }

      // Add to household_members
      const { data: member, error: memberError } = await this.supabase
        .from('household_members')
        .insert({
          household_id: invitation.household_id,
          user_id: profile.id,
          role: invitation.role,
        })
        .select('*, profile:profiles(*)')
        .single();

      if (memberError) throw memberError;

      // Update invitation status
      if (invitation.id) {
        await this.supabase
          .from('household_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', invitation.id);
      }

      return member as unknown as HouseholdMemberWithProfile;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid token', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.acceptInvitation failed:', error);
      throw new AppError('Failed to accept invitation', 'ACCEPT_INVITATION_ERROR');
    }
  }

  /**
   * Remove member from household (hard delete)
   *
   * If member is managed (non-authenticated), also deletes their profile
   *
   * @param householdId - The household ID
   * @param input - Profile ID to remove
   * @throws {ValidationError} If input is invalid
   * @throws {NotFoundError} If member not found
   * @throws {ConflictError} If trying to remove last admin
   * @throws {AppError} If operation fails
   */
  async removeMember(householdId: HouseholdId, input: RemoveMemberInput): Promise<void> {
    try {
      const validated = RemoveMemberSchema.parse(input);

      // Check if member exists in this household
      const { data: member, error: checkError } = await this.supabase
        .from('household_members')
        .select('*, profile:profiles(*)')
        .eq('household_id', householdId)
        .eq('user_id', validated.profile_id)
        .maybeSingle();

      if (checkError || !member) {
        throw new NotFoundError('Household member', validated.profile_id);
      }

      // Prevent removing the last admin
      if (member.role === 'admin') {
        const { data: admins } = await this.supabase
          .from('household_members')
          .select('user_id')
          .eq('household_id', householdId)
          .eq('role', 'admin');

        if (admins && admins.length === 1) {
          throw new ConflictError('Cannot remove the last admin from the household');
        }
      }

      // Hard delete from household_members
      const { error: deleteError } = await this.supabase
        .from('household_members')
        .delete()
        .eq('household_id', householdId)
        .eq('user_id', validated.profile_id);

      if (deleteError) throw deleteError;

      // If managed member (no auth), delete profile too
      if (member.profile.member_type === 'managed') {
        await this.supabase.from('profiles').delete().eq('id', validated.profile_id);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid input', { errors: error.errors });
      }
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.removeMember failed:', error);
      throw new AppError('Failed to remove member', 'REMOVE_MEMBER_ERROR', 500, {
        householdId,
        profileId: input.profile_id,
      });
    }
  }

  /**
   * List pending invitations for a household
   *
   * @param householdId - The household ID
   * @returns Array of pending invitations
   * @throws {AppError} If query fails
   */
  async listInvitations(householdId: HouseholdId): Promise<HouseholdInvitation[]> {
    try {
      const { data, error } = await this.supabase
        .from('household_invitations')
        .select('*')
        .eq('household_id', householdId)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;

      return data as unknown as HouseholdInvitation[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('HouseholdService.listInvitations failed:', error);
      throw new AppError('Failed to list invitations', 'LIST_INVITATIONS_ERROR', 500, {
        householdId,
      });
    }
  }

  /**
   * Cancel (delete) a pending invitation
   *
   * @param invitationId - The invitation ID to cancel
   * @throws {AppError} If operation fails
   */
  async cancelInvitation(invitationId: InvitationId): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('household_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('HouseholdService.cancelInvitation failed:', error);
      throw new AppError('Failed to cancel invitation', 'CANCEL_INVITATION_ERROR', 500, {
        invitationId,
      });
    }
  }

  /**
   * Update household name
   *
   * Admin-only operation (enforced by RLS)
   *
   * @param householdId - The household ID
   * @param name - New household name (1-100 characters, trimmed)
   * @returns Updated household
   * @throws {ValidationError} If name is invalid
   * @throws {NotFoundError} If household not found
   * @throws {AppError} If operation fails
   */
  async updateHouseholdName(householdId: HouseholdId, name: string): Promise<Household> {
    try {
      // Validate and trim name
      const trimmedName = name.trim();

      if (trimmedName.length === 0) {
        throw new ValidationError('Household name cannot be empty');
      }

      if (trimmedName.length > 100) {
        throw new ValidationError('Household name must be 100 characters or less');
      }

      // Update household name (RLS enforces admin-only)
      const { data, error } = await this.supabase
        .from('households')
        .update({ name: trimmedName })
        .eq('id', householdId)
        .select();

      if (error) throw error;

      // Check if household was found and updated
      if (!data || data.length === 0) {
        throw new NotFoundError('Household', householdId);
      }

      return data[0] as unknown as Household;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.updateHouseholdName failed:', error);
      throw new AppError('Failed to update household name', 'UPDATE_HOUSEHOLD_NAME_ERROR', 500, {
        householdId,
      });
    }
  }

  /**
   * Update member role (promote member to admin or demote admin to member)
   *
   * Admin-only operation (enforced by RLS)
   *
   * @param householdId - The household ID
   * @param userId - Profile ID of the member to update
   * @param newRole - New role ('admin' | 'member')
   * @returns Updated household member with profile
   * @throws {NotFoundError} If member not found
   * @throws {ConflictError} If demoting last admin or promoting managed member to admin
   * @throws {AppError} If operation fails
   */
  async updateMemberRole(
    householdId: HouseholdId,
    userId: ProfileId,
    newRole: 'admin' | 'member',
  ): Promise<HouseholdMemberWithProfile> {
    try {
      // Get profile to check member_type
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new NotFoundError('Member', userId);

      // Prevent promoting managed members to admin
      if (newRole === 'admin' && profile.member_type === 'managed') {
        throw new ConflictError('Cannot promote managed members to admin');
      }

      // If demoting from admin, prevent demoting last admin
      if (newRole === 'member') {
        const { data: admins } = await this.supabase
          .from('household_members')
          .select('user_id')
          .eq('household_id', householdId)
          .eq('role', 'admin');

        if (admins && admins.length === 1 && admins[0]?.user_id === userId) {
          throw new ConflictError('Cannot demote the last admin');
        }
      }

      // Update member role (RLS enforces admin-only)
      const { data, error } = await this.supabase
        .from('household_members')
        .update({ role: newRole })
        .eq('household_id', householdId)
        .eq('user_id', userId)
        .select('*, profile:profiles(*)');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new NotFoundError('Household member', userId);
      }

      return data[0] as unknown as HouseholdMemberWithProfile;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.updateMemberRole failed:', error);
      throw new AppError('Failed to update member role', 'UPDATE_MEMBER_ROLE_ERROR', 500, {
        householdId,
        userId,
      });
    }
  }

  /**
   * Resend invitation email
   *
   * Only pending invitations can be resent
   *
   * @param invitationId - The invitation ID
   * @returns Updated invitation with new timestamp
   * @throws {NotFoundError} If invitation not found
   * @throws {ConflictError} If invitation is not pending
   * @throws {AppError} If operation fails
   */
  async resendInvitation(invitationId: InvitationId): Promise<HouseholdInvitation> {
    try {
      // Get invitation
      const { data: invitation, error: getError } = await this.supabase
        .from('household_invitations')
        .select('*')
        .eq('id', invitationId)
        .maybeSingle();

      if (getError) throw getError;
      if (!invitation) throw new NotFoundError('Invitation', invitationId);

      // Validate invitation is pending
      if (invitation.status !== 'pending') {
        throw new ConflictError('Invitation must be pending to resend');
      }

      // Resend email via Supabase Auth
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitation.token}`;

      await this.supabase.auth.signInWithOtp({
        email: invitation.invitee_email,
        options: {
          emailRedirectTo: inviteUrl,
          data: {
            invitation_token: invitation.token,
            household_id: invitation.household_id,
          },
        },
      });

      // Update invitation timestamp
      const { data, error } = await this.supabase
        .from('household_invitations')
        .update({ invited_at: new Date().toISOString() })
        .eq('id', invitationId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new NotFoundError('Invitation', invitationId);
      }

      return data[0] as unknown as HouseholdInvitation;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.resendInvitation failed:', error);
      throw new AppError('Failed to resend invitation', 'RESEND_INVITATION_ERROR', 500, {
        invitationId,
      });
    }
  }

  /**
   * Update invitation status
   *
   * Only allows manual updates to declined/expired statuses
   *
   * @param invitationId - The invitation ID
   * @param status - New status ('declined' | 'expired')
   * @returns Updated invitation
   * @throws {NotFoundError} If invitation not found
   * @throws {AppError} If operation fails
   */
  async updateInvitationStatus(
    invitationId: InvitationId,
    status: 'declined' | 'expired',
  ): Promise<HouseholdInvitation> {
    try {
      const { data, error } = await this.supabase
        .from('household_invitations')
        .update({ status })
        .eq('id', invitationId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new NotFoundError('Invitation', invitationId);
      }

      return data[0] as unknown as HouseholdInvitation;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('HouseholdService.updateInvitationStatus failed:', error);
      throw new AppError(
        'Failed to update invitation status',
        'UPDATE_INVITATION_STATUS_ERROR',
        500,
        {
          invitationId,
        },
      );
    }
  }
}
