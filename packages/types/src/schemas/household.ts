import { z } from 'zod';

// =============================================================================
// Household Member Management Schemas
// =============================================================================

/**
 * Invite authenticated user (email required)
 * Used for email-based invitations to join household
 */
export const InviteAuthenticatedMemberSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  role: z.enum(['admin', 'member']).default('member'),
});

export type InviteAuthenticatedMemberInput = z.infer<typeof InviteAuthenticatedMemberSchema>;

/**
 * Add managed member (name required, no email)
 * Used for adding non-authenticated household members (e.g., kids)
 */
export const AddManagedMemberSchema = z.object({
  display_name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  avatar_url: z.string().url('Invalid URL').optional(),
  role: z.enum(['member']).default('member'), // Managed members cannot be admin
});

export type AddManagedMemberInput = z.infer<typeof AddManagedMemberSchema>;

/**
 * Accept invitation (token required)
 * Used when user clicks invitation link
 */
export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

/**
 * Remove member from household
 */
export const RemoveMemberSchema = z.object({
  profile_id: z.string().uuid('Invalid profile ID'),
});

export type RemoveMemberInput = z.infer<typeof RemoveMemberSchema>;

/**
 * Cancel invitation
 */
export const CancelInvitationSchema = z.object({
  invitation_id: z.string().uuid('Invalid invitation ID'),
});

export type CancelInvitationInput = z.infer<typeof CancelInvitationSchema>;
