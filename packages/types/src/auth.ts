import { z } from 'zod';

import type { UserId, HouseholdId, ProfileId, AuthUserId, InvitationId } from './models';

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Member type: authenticated (with email/password) or managed (no auth, e.g., kids)
 */
export type MemberType = 'authenticated' | 'managed';

/**
 * User profile extending auth.users
 * Maps to public.profiles table
 *
 * Supports two types of users:
 * - Authenticated: Have auth.users record, can log in independently
 * - Managed: No auth.users record, added by admins (e.g., kids)
 */
export interface Profile {
  readonly id: ProfileId;
  readonly auth_user_id: AuthUserId | null;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly member_type: MemberType;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Household group for recipe sharing
 * Maps to public.households table
 */
export interface Household {
  readonly id: HouseholdId;
  readonly name: string;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Household membership with role
 * Maps to public.household_members table
 *
 * Note: user_id now references profiles.id (not auth.users.id)
 * This allows both authenticated and managed users to be members
 */
export interface HouseholdMember {
  readonly household_id: HouseholdId;
  readonly user_id: ProfileId;
  readonly role: 'admin' | 'member';
  readonly joined_at: string;
}

/**
 * Household member with full profile data
 * Used for displaying member lists with profile information
 */
export interface HouseholdMemberWithProfile extends HouseholdMember {
  readonly profile: Profile;
}

/**
 * Invitation status
 */
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/**
 * Household invitation for email-based member invites
 * Maps to public.household_invitations table
 */
export interface HouseholdInvitation {
  readonly id: InvitationId;
  readonly household_id: HouseholdId;
  readonly inviter_profile_id: ProfileId;
  readonly invitee_email: string;
  readonly role: 'admin' | 'member';
  readonly status: InvitationStatus;
  readonly token: string;
  readonly invited_at: string;
  readonly accepted_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Authenticated user with profile and household
 * Combines data from auth.users, profiles, and household_members
 */
export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly profile: Profile;
  readonly household: Household | null;
  readonly household_role: 'admin' | 'member' | null;
}

/**
 * Supabase Auth Session
 */
export interface Session {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_at: number;
  readonly expires_in: number;
  readonly token_type: string;
  readonly user: {
    readonly id: UserId;
    readonly email: string;
  };
}

// =============================================================================
// Auth State (Discriminated Union)
// =============================================================================

/**
 * Authentication state using discriminated union
 * Ensures type safety when checking auth status
 */
export type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User; session: Session }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: Error };

// =============================================================================
// Validation Schemas (Zod)
// =============================================================================

/**
 * Sign up form validation schema
 */
export const SignUpSchema = z
  .object({
    display_name: z
      .string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be 50 characters or less')
      .trim(),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or less'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;

/**
 * Sign in form validation schema
 */
export const SignInSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof SignInSchema>;

/**
 * Forgot password form validation schema
 */
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset password form validation schema
 */
export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or less'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// =============================================================================
// Auth Service Response Types
// =============================================================================

/**
 * Sign up response
 */
export interface SignUpResponse {
  readonly user: User;
  readonly session: Session;
  readonly household: Household;
}

/**
 * Sign in response
 */
export interface SignInResponse {
  readonly user: User;
  readonly session: Session;
}

/**
 * Password reset request response
 */
export interface ForgotPasswordResponse {
  readonly success: boolean;
}

/**
 * Get current user response
 */
export interface GetCurrentUserResponse {
  readonly user: User;
  readonly session: Session;
}
