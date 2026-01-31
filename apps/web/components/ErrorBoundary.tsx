'use client';

import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import { Component, type ReactNode } from 'react';

/**
 * ErrorBoundary Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

/**
 * ErrorBoundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * Design System Compliance:
 * - Typography: h5 for error title, body1 for message
 * - Button: outlined (secondary) for retry
 * - Alert: severity="error"
 * - Stack spacing: 3 (24px)
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state when error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error to console (and in future, to Sentry)
   */
  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  /**
   * Reset error state and try again
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
          <Stack spacing={3}>
            <Alert severity="error">
              <Typography variant="h5" gutterBottom>
                Something went wrong
              </Typography>
              <Typography variant="body1" gutterBottom>
                An unexpected error occurred. Please try again or contact support if the problem
                persists.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {this.state.error.message}
              </Typography>
            </Alert>

            <Box>
              <Button variant="outlined" color="primary" onClick={this.handleReset}>
                Try again
              </Button>
            </Box>
          </Stack>
        </Container>
      );
    }

    return this.props.children;
  }
}
