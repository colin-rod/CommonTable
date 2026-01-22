import type { CalendarEntryComment } from '@commontable/types';
import { List, ListItem, ListItemText, CircularProgress, Typography, Box } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

interface CalendarEntryCommentListProps {
  comments: CalendarEntryComment[];
  loading: boolean;
  error: Error | null;
}

/**
 * CalendarEntryCommentList Component
 *
 * Displays a flat chronological list of comments (oldest first)
 *
 * States:
 * - Loading: Shows spinner
 * - Error: Shows error message
 * - Empty: Shows "No comments yet"
 * - Success: Shows comment list with author and relative time
 */
export function CalendarEntryCommentList({
  comments,
  loading,
  error,
}: CalendarEntryCommentListProps) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" variant="body2">
        Failed to load comments
      </Typography>
    );
  }

  if (comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No comments yet
      </Typography>
    );
  }

  return (
    <List>
      {comments.map((comment) => (
        <ListItem key={comment.id} alignItems="flex-start" disablePadding>
          <ListItemText
            primary={comment.comment_text}
            secondary={formatRelativeTime(comment.created_at)}
            primaryTypographyProps={{ variant: 'body1' }}
            secondaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItem>
      ))}
    </List>
  );
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
