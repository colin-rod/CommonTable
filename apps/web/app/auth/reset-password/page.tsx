'use client';

import type { ResetPasswordInput } from '@commontable/types';
import { useRouter } from 'next/navigation';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { useAuth } from '@/hooks/useAuth';

/**
 * Reset Password Page
 * Handles setting new password from email link
 *
 * User arrives here from password reset email link
 * Token is validated by Supabase automatically
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, error } = useAuth();

  const handleUpdatePassword = async (data: ResetPasswordInput) => {
    await updatePassword(data);
    // Redirect to login on success
    router.push('/auth/login');
  };

  return <ResetPasswordForm onSubmit={handleUpdatePassword} error={error} />;
}
