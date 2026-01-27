'use client';

import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DownloadIcon from '@mui/icons-material/Download';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MailIcon from '@mui/icons-material/Mail';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { Badge, Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

interface QuickActionsProps {
  pendingTagsCount?: number;
  pendingRequestsCount?: number;
}

/**
 * QuickActions component
 * Displays primary and secondary action buttons for common tasks
 */
export function QuickActions({
  pendingTagsCount = 0,
  pendingRequestsCount = 0,
}: QuickActionsProps = {}) {
  const router = useRouter();

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Quick Actions</Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/recipes/new')}
        >
          Add Recipe
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<CalendarTodayIcon />}
          onClick={() => router.push('/calendar')}
        >
          Plan This Week's Meals
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<RestaurantIcon />}
          onClick={() => router.push('/recipes')}
        >
          Browse All Recipes
        </Button>

        {/* Secondary Actions */}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={() => router.push('/recipes/import')}
        >
          Import Recipe
        </Button>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<LightbulbIcon />}
          onClick={() => router.push('/suggestions')}
        >
          Recipe Suggestions
        </Button>

        <Badge badgeContent={pendingTagsCount} color="error">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LocalOfferIcon />}
            onClick={() => router.push('/tags/review')}
          >
            AI Tag Review
          </Button>
        </Badge>

        <Badge badgeContent={pendingRequestsCount} color="error">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<MailIcon />}
            onClick={() => router.push('/requests')}
          >
            Meal Requests
          </Button>
        </Badge>
      </Stack>
    </Stack>
  );
}
