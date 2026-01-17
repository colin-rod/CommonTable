'use client';

import type { VersionHistoryEntry } from '@commontable/types';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';

/**
 * Format a date for display in version history
 */
function formatVersionDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

interface VersionHistoryListProps {
  versions: VersionHistoryEntry[];
  loading?: boolean;
  onVersionClick: (versionNumber: number) => void;
}

/**
 * VersionHistoryList Component
 *
 * Displays a list of recipe versions with:
 * - Version number (with "Current" badge for active version)
 * - Editor name and timestamp
 *
 * Follows DESIGN_SYSTEM.md:
 * - Uses List > ListItem > ListItemButton pattern
 * - Typography: body1 for primary, body2 for secondary
 * - Loading state with CircularProgress
 */
export function VersionHistoryList({
  versions,
  loading = false,
  onVersionClick,
}: VersionHistoryListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (versions.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No version history
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {versions.map((version) => {
        const primaryText = version.is_current
          ? `Version ${version.version_number} (Current)`
          : `Version ${version.version_number}`;

        const editorName = version.created_by_name ?? 'Unknown user';
        const formattedDate = formatVersionDate(version.created_at);
        const secondaryText = `Edited by ${editorName} · ${formattedDate}`;

        return (
          <ListItem key={version.version_id} disablePadding>
            <ListItemButton
              onClick={() => onVersionClick(version.version_number)}
              aria-label={primaryText}
            >
              <ListItemText
                primary={primaryText}
                secondary={secondaryText}
                primaryTypographyProps={{ variant: 'body1' }}
                secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
