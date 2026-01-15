'use client';

import type { ForgotPasswordInput } from '@commontable/types';
import { useState } from 'react';

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useAuth } from '@/hooks/useAuth';

/**
 * Forgot Password Page
 * Handles password reset requests
 */
export default function ForgotPasswordPage() {
  const { resetPassword, error } = useAuth();
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (data: ForgotPasswordInput) => {
    await resetPassword(data);
    setSuccess(true);
  };

  return <ForgotPasswordForm onSubmit={handleResetPassword} error={error} success={success} />;
}
