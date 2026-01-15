'use client';

import { SignUpSchema, type SignUpInput } from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface SignUpFormProps {
  onSubmit: (data: SignUpInput) => Promise<void>;
  error?: Error | null;
}

/**
 * SignUpForm Component
 * Material Design 3 compliant signup form
 *
 * Following CLAUDE.md constraints:
 * - Display name + email + password + confirm password fields
 * - Material Design 3 approved components only
 * - Calm neutral tone, no emojis
 */
export function SignUpForm({ onSubmit, error }: SignUpFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      display_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const password = watch('password');

  const handleFormSubmit = async (data: SignUpInput) => {
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
      <Typography variant="h5">Create account</Typography>

      {/* Error Display */}
      {error && (
        <Alert severity="error" variant="outlined">
          {error.message}
        </Alert>
      )}

      {/* Display Name Field */}
      <Controller
        name="display_name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Display name"
            required
            fullWidth
            autoComplete="name"
            error={!!errors.display_name}
            helperText={errors.display_name?.message || 'This will be shown to your household'}
            disabled={isSubmitting}
          />
        )}
      />

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
            disabled={isSubmitting}
          />
        )}
      />

      {/* Password Field */}
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message || 'At least 8 characters'}
            disabled={isSubmitting}
          />
        )}
      />

      {/* Confirm Password Field */}
      <Controller
        name="confirm_password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Confirm password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={!!errors.confirm_password}
            helperText={errors.confirm_password?.message}
            disabled={isSubmitting}
          />
        )}
      />

      {/* Password Strength Indicator */}
      {password && password.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Password strength:{' '}
          {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : 'Weak'}
        </Typography>
      )}

      {/* Primary Action */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={isSubmitting}
        sx={{ height: 48 }}
      >
        {isSubmitting ? <CircularProgress size={24} /> : 'Create account'}
      </Button>

      {/* Secondary Actions */}
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Already have an account?{' '}
        <Link href="/auth/login" style={{ textDecoration: 'none' }}>
          <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            Sign in
          </Typography>
        </Link>
      </Typography>
    </Stack>
  );
}
