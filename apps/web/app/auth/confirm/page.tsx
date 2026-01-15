import { EmailConfirmation } from '@/components/auth/EmailConfirmation';

interface EmailConfirmPageProps {
  searchParams: { error?: string; error_description?: string };
}

/**
 * Email Confirmation Page
 * Handles email verification redirects from confirmation links
 *
 * User arrives here from email verification link
 * Supabase automatically exchanges token for session client-side
 *
 * Flow:
 * 1. User clicks "Confirm Email" in verification email
 * 2. Supabase redirects to /auth/confirm?token=...&type=signup
 * 3. Token is automatically validated (client-side)
 * 4. Display success/error message
 * 5. Auto-redirect to dashboard on success
 */
export default function EmailConfirmPage({ searchParams }: EmailConfirmPageProps) {
  return (
    <EmailConfirmation
      error={searchParams.error}
      errorDescription={searchParams.error_description}
    />
  );
}
