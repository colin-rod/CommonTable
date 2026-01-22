'use client';

import type { CreateMealRequestInput } from '@commontable/api-client';
import type { MealRequestStatus, MealRequestId } from '@commontable/types';
import {
  Container,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useState } from 'react';

import {
  AddMealRequestDialog,
  MealRequestList,
  MealRequestFilterBar,
} from '@/components/mealRequests';
import { useHousehold } from '@/hooks/useHousehold';
import { useMealRequests } from '@/hooks/useMealRequests';
import { useRecipes } from '@/hooks/useRecipes';

/**
 * Requests page - Meal requests queue for triage
 *
 * Route: /requests
 *
 * Design System Compliance:
 * - Container with maxWidth="md"
 * - Stack for vertical spacing (3 = 24px)
 * - Typography h5 for page title
 * - Typography body2 for page description
 * - Single primary button (Add Request)
 * - Material Design 3 components only
 */
export default function RequestsPage() {
  const { members: householdMembers } = useHousehold();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MealRequestStatus | 'all'>('open');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const { recipes, loading: recipesLoading } = useRecipes();
  const {
    requests,
    loading: requestsLoading,
    error,
    createRequest,
    updateStatus,
    updatePriority,
    addToCalendar,
  } = useMealRequests({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  // Build requester names map
  const requesterNames = new Map<string, string>();
  if (householdMembers) {
    householdMembers.forEach((member) => {
      requesterNames.set(member.user_id, member.profile?.display_name || 'Unknown');
    });
  }

  const handleAddRequest = async (input: CreateMealRequestInput) => {
    try {
      await createRequest(input);
      showSnackbar('Request added successfully', 'success');
    } catch (_err) {
      showSnackbar('Failed to add request', 'error');
      throw _err;
    }
  };

  const handleAddToCalendar = async (id: MealRequestId) => {
    try {
      await addToCalendar(id);
      showSnackbar('Added to calendar', 'success');
    } catch (_err) {
      showSnackbar('Failed to add to calendar', 'error');
    }
  };

  const handleDismiss = async (id: MealRequestId) => {
    try {
      await updateStatus(id, 'dismissed');
      showSnackbar('Request dismissed', 'success');
    } catch (_err) {
      showSnackbar('Failed to dismiss request', 'error');
    }
  };

  const handleUpdatePriority = async (id: MealRequestId, delta: number) => {
    try {
      const currentRequest = requests.find((r) => r.id === id);
      if (!currentRequest) return;

      const newPriority = currentRequest.priority + delta;
      await updatePriority(id, newPriority);
    } catch (_err) {
      showSnackbar('Failed to update priority', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const loading = recipesLoading || requestsLoading;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={3}>
        {/* Page Title */}
        <Typography variant="h5">Meal Requests</Typography>

        {/* Page Description */}
        <Typography variant="body2" color="text.secondary">
          Review and triage meal requests from your household
        </Typography>

        {/* Add Request Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => setDialogOpen(true)}
          disabled={loading}
        >
          Add Request
        </Button>

        {/* Filter Bar */}
        <MealRequestFilterBar statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />

        {/* Loading State */}
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Stack>
        )}

        {/* Error State */}
        {!loading && error && (
          <Typography variant="body1" color="error" sx={{ textAlign: 'center', py: 4 }}>
            Failed to load meal requests
          </Typography>
        )}

        {/* Request List */}
        {!loading && !error && (
          <MealRequestList
            requests={requests}
            recipes={recipes}
            requesterNames={requesterNames}
            onAddToCalendar={handleAddToCalendar}
            onDismiss={handleDismiss}
            onUpdatePriority={handleUpdatePriority}
          />
        )}

        {/* Add Request Dialog */}
        <AddMealRequestDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleAddRequest}
          recipes={recipes}
        />

        {/* Success/Error Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}
