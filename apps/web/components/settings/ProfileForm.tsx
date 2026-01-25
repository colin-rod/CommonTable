'use client';

import type { User } from '@commontable/types';
import { Button, Stack, TextField, Typography } from '@mui/material';
import type { FormEvent } from 'react';
import { useState } from 'react';

/**
 * ProfileForm Props
 */
export interface ProfileFormProps {
  user: User;
  onSubmit: (data: ProfileFormData) => Promise<void> | void;
  onCancel: () => void;
}

/**
 * ProfileForm Data
 */
export interface ProfileFormData {
  display_name: string;
  current_password?: string;
  new_password?: string;
}

/**
 * ProfileForm Component
 * Allows users to edit their display name and change password
 *
 * Design System Compliance:
 * - Stack spacing 3 (24px)
 * - TextField fullWidth
 * - Button variants: contained (primary) for save, outlined for cancel
 * - Typography: h6 for section headers
 */
export function ProfileForm({ user, onSubmit, onCancel }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(user.profile.display_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form fields
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validate new password length if provided
    if (newPassword && newPassword.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }

    // Validate password confirmation matches
    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
      newErrors.confirm_new_password = 'Passwords must match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data: ProfileFormData = {
        display_name: displayName,
      };

      // Include password fields only if all three are filled
      if (currentPassword && newPassword && confirmNewPassword) {
        data.current_password = currentPassword;
        data.new_password = newPassword;
      }

      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle new password blur (validate on blur)
   */
  const handleNewPasswordBlur = () => {
    if (newPassword && newPassword.length < 8) {
      setErrors((prev) => ({
        ...prev,
        new_password: 'Password must be at least 8 characters',
      }));
    } else {
      setErrors((prev) => {
        const { new_password: _new_password, ...rest } = prev;
        return rest;
      });
    }
  };

  /**
   * Handle confirm password blur (validate on blur)
   */
  const handleConfirmPasswordBlur = () => {
    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
      setErrors((prev) => ({
        ...prev,
        confirm_new_password: 'Passwords must match',
      }));
    } else {
      setErrors((prev) => {
        const { confirm_new_password: _confirm_new_password, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit}>
      {/* Profile Section */}
      <Typography variant="h6">Profile</Typography>

      <TextField
        label="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        fullWidth
        required
      />

      <TextField label="Email" value={user.email} disabled fullWidth />

      {/* Password Change Section */}
      <Typography variant="h6">Change Password</Typography>

      <TextField
        label="Current Password"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        fullWidth
      />

      <TextField
        label="New Password"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        onBlur={handleNewPasswordBlur}
        error={!!errors.new_password}
        helperText={errors.new_password}
        fullWidth
      />

      <TextField
        label="Confirm New Password"
        type="password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        onBlur={handleConfirmPasswordBlur}
        error={!!errors.confirm_new_password}
        helperText={errors.confirm_new_password}
        fullWidth
      />

      {/* Actions */}
      <Stack direction="row" spacing={2}>
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          Save Changes
        </Button>
        <Button variant="outlined" color="primary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}
