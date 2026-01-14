// MUI Design System enforcement utilities
// Enforces DESIGN_SYSTEM.md constraints at the type level

// Allowed button variants (exactly 3)
export type AllowedButtonVariant =
  | { variant: 'contained'; color: 'primary' } // Primary action
  | { variant: 'outlined'; color: 'primary' } // Secondary action
  | { variant: 'contained'; color: 'error' }; // Destructive action

// Allowed typography variants (exactly 4)
export type AllowedTypographyVariant = 'h5' | 'h6' | 'body1' | 'body2';

// Allowed spacing values (multiply by 8 to get px)
// Maps to: 4, 8, 16, 24, 32, 48 pixels
export type AllowedSpacing = 0.5 | 1 | 2 | 3 | 4 | 6;

// Allowed elevations (low only)
export type AllowedElevation = 0 | 1 | 2;

// Helper to ensure spacing values are valid
export function validateSpacing(value: number): AllowedSpacing {
  const allowed: AllowedSpacing[] = [0.5, 1, 2, 3, 4, 6];
  if (allowed.includes(value as AllowedSpacing)) {
    return value as AllowedSpacing;
  }
  throw new Error(
    `Invalid spacing value: ${value}. Allowed values: ${allowed.join(', ')} (maps to 4, 8, 16, 24, 32, 48px)`
  );
}

// Helper to ensure elevation values are valid
export function validateElevation(value: number): AllowedElevation {
  const allowed: AllowedElevation[] = [0, 1, 2];
  if (allowed.includes(value as AllowedElevation)) {
    return value as AllowedElevation;
  }
  throw new Error(
    `Invalid elevation value: ${value}. Allowed values: ${allowed.join(', ')} (elevation > 2 forbidden in MVP)`
  );
}
