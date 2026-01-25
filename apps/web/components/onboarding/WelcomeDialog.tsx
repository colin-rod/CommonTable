'use client';

import {
  Restaurant as RestaurantIcon,
  CalendarToday as CalendarIcon,
  RequestPage as RequestIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Stack,
  Box,
} from '@mui/material';
import { useState } from 'react';

/**
 * WelcomeDialog Props
 */
export interface WelcomeDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when the dialog is closed (via Skip button)
   */
  onClose: () => void;
  /**
   * Callback when onboarding is completed (via Add First Recipe button)
   */
  onComplete: () => void;
}

/**
 * WelcomeDialog Component
 * Multi-step onboarding dialog for first-time users
 *
 * Step 1: Welcome message
 * Step 2: Feature highlights (Recipes, Calendar, Requests)
 * Step 3: CTA to add first recipe
 *
 * Design System Compliance:
 * - Typography: h5 for title, body1 for content
 * - Buttons: contained primary for Next/Add, outlined for Skip/Back
 * - Stack spacing: 2 (16px)
 * - Dialog component only
 */
export function WelcomeDialog({ open, onClose, onComplete }: WelcomeDialogProps) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSkip = () => {
    onClose();
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <Stack spacing={3}>
          {/* Step 1: Welcome */}
          {step === 1 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Welcome to CommonTable
              </Typography>
              <Typography variant="body1">
                Your shared household recipe book. Manage recipes, plan meals, and collaborate with
                your household.
              </Typography>
            </Box>
          )}

          {/* Step 2: Feature Highlights */}
          {step === 2 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Key Features
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RestaurantIcon />
                  <Box>
                    <Typography variant="h6">Recipes</Typography>
                    <Typography variant="body1">
                      Store and organize your household's favorite recipes
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarIcon />
                  <Box>
                    <Typography variant="h6">Calendar</Typography>
                    <Typography variant="body1">
                      Plan meals for the week and stay organized
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RequestIcon />
                  <Box>
                    <Typography variant="h6">Requests</Typography>
                    <Typography variant="body1">
                      Request meals and collaborate with household members
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Step 3: Get Started */}
          {step === 3 && (
            <Box>
              <Typography variant="h5" gutterBottom>
                Get Started
              </Typography>
              <Typography variant="body1">
                Ready to add your first recipe? Click below to get started!
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'space-between' }}>
          {/* Left side: Back button (only visible on steps 2 and 3) */}
          <Box>
            {step > 1 && (
              <Button variant="outlined" onClick={handleBack}>
                Back
              </Button>
            )}
          </Box>

          {/* Right side: Skip and Next/Complete buttons */}
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={handleSkip}>
              Skip
            </Button>
            {step < 3 ? (
              <Button variant="contained" color="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={handleComplete}>
                Add First Recipe
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
