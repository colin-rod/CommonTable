'use client';

import { ForgotPasswordSchema, type ForgotPasswordInput } from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordInput) => Promise<void>;
  error?: Error | null;
  success?: boolean;
}

/**
 * ForgotPasswordForm Component
 * Material Design 3 compliant password reset request form
 */
export function ForgotPasswordForm({ onSubmit, error, success }: ForgotPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleFormSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit(handleFormSubmit)} spacing={3}>
      {/* Page Title */}
      <Typography variant="h5">Reset password</Typography>

      <Typography variant="body2" color="text.secondary">
        Enter your email address and we'll send you a link to reset your password.
      </Typography>

      {/* Success Message */}
      {success && (
        <Alert severity="success" variant="outlined">
          Password reset link sent. Check your email.
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" variant="outlined">
          {error.message}
        </Alert>
      )}

      {/* Email Field */}
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isSubmitting || success}
          />
        )}
      />

      {/* Primary Action */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={isSubmitting || success}
        sx={{ height: 48 }}
      >
        {isSubmitting ? <CircularProgress size={24} /> : 'Send reset link'}
      </Button>

      {/* Secondary Actions */}
      <Link href="/auth/login" passHref legacyBehavior>
        <Button variant="outlined" color="primary" fullWidth>
          Back to sign in
        </Button>
      </Link>
    </Stack>
  );
}
