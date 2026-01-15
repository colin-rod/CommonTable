'use client';

import { ResetPasswordSchema, type ResetPasswordInput } from '@commontable/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Button, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordInput) => Promise<void>;
  error?: Error | null;
}

/**
 * ResetPasswordForm Component
 * Material Design 3 compliant password reset form
 */
export function ResetPasswordForm({ onSubmit, error }: ResetPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirm_password: '',
    },
  });

  const password = watch('password');

  const handleFormSubmit = async (data: ResetPasswordInput) => {
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
      <Typography variant="h5">Set new password</Typography>

      <Typography variant="body2" color="text.secondary">
        Enter your new password below.
      </Typography>

      {/* Error Display */}
      {error && (
        <Alert severity="error" variant="outlined">
          {error.message}
        </Alert>
      )}

      {/* Password Field */}
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="New password"
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
            label="Confirm new password"
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
        {isSubmitting ? <CircularProgress size={24} /> : 'Update password'}
      </Button>
    </Stack>
  );
}
