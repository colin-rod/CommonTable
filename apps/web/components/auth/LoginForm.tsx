'use client';

import { SignInSchema, type SignInInput } from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface LoginFormProps {
  onSubmit: (data: SignInInput) => Promise<void>;
  error?: Error | null;
}

/**
 * LoginForm Component
 * Material Design 3 compliant login form with email/password
 *
 * Following CLAUDE.md constraints:
 * - Only approved MUI components
 * - Only allowed button variants (contained primary, outlined)
 * - Only allowed typography variants (h5, h6, body1, body2)
 * - Spacing: 16px, 24px gaps
 * - No emojis, calm neutral tone
 */
export function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleFormSubmit = async (data: SignInInput) => {
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
      <Typography variant="h5">Sign in</Typography>

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
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isSubmitting}
          />
        )}
      />

      {/* Primary Action */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={isSubmitting}
        sx={{ height: 48 }}
      >
        {isSubmitting ? <CircularProgress size={24} /> : 'Sign in'}
      </Button>

      {/* Secondary Actions */}
      <Stack spacing={2}>
        <Link href="/auth/forgot-password" passHref legacyBehavior>
          <Button variant="outlined" color="primary" fullWidth>
            Forgot password
          </Button>
        </Link>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Don't have an account?{' '}
          <Link href="/auth/signup" style={{ textDecoration: 'none' }}>
            <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 500 }}>
              Create account
            </Typography>
          </Link>
        </Typography>
      </Stack>
    </Stack>
  );
}
