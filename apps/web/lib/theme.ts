import { createTheme } from '@mui/material/styles';

// Strict Material Design 3 theme
// Source of truth: /Users/colinrodrigues/CommonTable/DESIGN_SYSTEM.md

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4D7C0F', // Olive
    },
    background: {
      default: '#fafafa', // Warm neutral, not pure white
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    error: {
      main: '#d32f2f',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    // Only 4 variants allowed per DESIGN_SYSTEM.md
    h5: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // No ALL CAPS
          fontWeight: 500,
        },
      },
    },
    // Enforce low elevation only (0, 1, 2)
    MuiPaper: {
      defaultProps: {
        elevation: 1,
      },
    },
  },
});
