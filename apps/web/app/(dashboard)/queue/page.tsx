import { Container, Stack, Typography } from '@mui/material';

import { QueueView } from '@/components/queue/QueueView';

export default function QueuePage() {
  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Typography variant="h5">Recipe Queue</Typography>
        <Typography variant="body2" color="text.secondary">
          Organize recipes you want to cook. Mark as cooked to log to history.
        </Typography>
        <QueueView />
      </Stack>
    </Container>
  );
}
