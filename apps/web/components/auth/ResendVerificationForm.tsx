'use client';

import { TextField, Button, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import { z } from 'zod';

interface ResendVerificationFormProps {
  onSubmit: (email: string) => Promise<void>;
  error?: Error | null;
}

const EmailSchema = z.string().email('Invalid email address');

/**
 * ResendVerificationForm Component
 * Material Design 3 compliant form for resending verification emails
 *
 * Following CLAUDE.md constraints:
 * - Only approved MUI components
 * - Only allowed button variants (contained primary)
 * - Only allowed typography variants (h5, body1, body2)
 * - Spacing: 24px gaps
 * - No emojis, calm neutral tone
 */
export function ResendVerificationForm({ onSubmit, error }: ResendVerificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate email
    const result = EmailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message || 'Invalid email');
      return;
    }

    setEmailError(null);
    setIsSubmitting(true);
    setSuccess(false);

    try {
      await onSubmit(email);
      setSuccess(true);
      setEmail(''); // Clear form on success
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={3}>
      {/* Page Title */}
      <Typography variant="h5">Resend verification email</Typography>

      <Typography variant="body1">
        Enter your email address to receive a new verification link.
      </Typography>

      {/* Success Display */}
      {success && (
        <Alert severity="success" variant="outlined">
          Verification email sent. Check your inbox.
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" variant="outlined">
          {error.message}
        </Alert>
      )}

      {/* Email Field */}
      <TextField
        label="Email"
        type="email"
        required
        fullWidth
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError(null);
        }}
        error={!!emailError}
        helperText={emailError}
        disabled={isSubmitting}
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
        {isSubmitting ? <CircularProgress size={24} /> : 'Resend verification email'}
      </Button>

      {/* Secondary Actions */}
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Already verified?{' '}
        <Link href="/auth/login" style={{ textDecoration: 'none' }}>
          <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            Sign in
          </Typography>
        </Link>
      </Typography>
    </Stack>
  );
}
