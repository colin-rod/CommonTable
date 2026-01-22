import { describe, it, expect } from 'vitest';

import {
  SignUpSchema,
  SignInSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type SignUpInput,
  type SignInInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type AuthState,
  type User,
  type Profile,
  type Session,
} from './auth';

describe('Auth Type Validation Schemas', () => {
  describe('SignUpSchema', () => {
    it('should validate valid signup input', () => {
      const validInput = {
        display_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirm_password: 'password123',
      };

      const result = SignUpSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          display_name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          confirm_password: 'password123',
        });
      }
    });

    it('should lowercase email', () => {
      const input = {
        display_name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123',
        confirm_password: 'password123',
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should trim display_name', () => {
      const input = {
        display_name: '  John Doe  ',
        email: 'john@example.com',
        password: 'password123',
        confirm_password: 'password123',
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.display_name).toBe('John Doe');
      }
    });

    it('should fail when display_name is empty', () => {
      const input = {
        display_name: '',
        email: 'john@example.com',
        password: 'password123',
        confirm_password: 'password123',
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Display name is required');
      }
    });

    it('should fail when display_name exceeds 50 characters', () => {
      const input = {
        display_name: 'a'.repeat(51),
        email: 'john@example.com',
        password: 'password123',
        confirm_password: 'password123',
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Display name must be 50 characters or less');
      }
    });

    it('should fail when email is invalid', () => {
      const input = {
        display_name: 'John Doe',
        email: 'not-an-email',
        password: 'password123',
        confirm_password: 'password123',
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid email address');
      }
    });

    it('should fail when password is less than 8 characters', () => {
      const input = {
        display_name: 'John Doe',
        email: 'john@example.com',
        password: 'pass123',
        confirm_password: 'pass123',
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password must be at least 8 characters');
      }
    });

    it('should fail when password exceeds 72 characters', () => {
      const longPassword = 'a'.repeat(73);
      const input = {
        display_name: 'John Doe',
        email: 'john@example.com',
        password: longPassword,
        confirm_password: longPassword,
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password must be 72 characters or less');
      }
    });

    it('should fail when passwords do not match', () => {
      const input = {
        display_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirm_password: 'different456',
      };

      const result = SignUpSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const matchError = result.error.issues.find((issue) =>
          issue.path.includes('confirm_password'),
        );
        expect(matchError?.message).toBe('Passwords do not match');
      }
    });

    it('should have correct TypeScript type for SignUpInput', () => {
      const input: SignUpInput = {
        display_name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirm_password: 'password123',
      };

      expect(input).toBeDefined();
    });
  });

  describe('SignInSchema', () => {
    it('should validate valid signin input', () => {
      const validInput = {
        email: 'john@example.com',
        password: 'password123',
      };

      const result = SignInSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: 'john@example.com',
          password: 'password123',
        });
      }
    });

    it('should lowercase email', () => {
      const input = {
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123',
      };

      const result = SignInSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should fail when email is invalid', () => {
      const input = {
        email: 'not-an-email',
        password: 'password123',
      };

      const result = SignInSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid email address');
      }
    });

    it('should fail when password is empty', () => {
      const input = {
        email: 'john@example.com',
        password: '',
      };

      const result = SignInSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password is required');
      }
    });

    it('should have correct TypeScript type for SignInInput', () => {
      const input: SignInInput = {
        email: 'john@example.com',
        password: 'password123',
      };

      expect(input).toBeDefined();
    });
  });

  describe('ForgotPasswordSchema', () => {
    it('should validate valid forgot password input', () => {
      const validInput = {
        email: 'john@example.com',
      };

      const result = ForgotPasswordSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: 'john@example.com',
        });
      }
    });

    it('should lowercase email', () => {
      const input = {
        email: 'JOHN@EXAMPLE.COM',
      };

      const result = ForgotPasswordSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should fail when email is invalid', () => {
      const input = {
        email: 'not-an-email',
      };

      const result = ForgotPasswordSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid email address');
      }
    });

    it('should have correct TypeScript type for ForgotPasswordInput', () => {
      const input: ForgotPasswordInput = {
        email: 'john@example.com',
      };

      expect(input).toBeDefined();
    });
  });

  describe('ResetPasswordSchema', () => {
    it('should validate valid reset password input', () => {
      const validInput = {
        password: 'newpassword123',
        confirm_password: 'newpassword123',
      };

      const result = ResetPasswordSchema.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          password: 'newpassword123',
          confirm_password: 'newpassword123',
        });
      }
    });

    it('should fail when password is less than 8 characters', () => {
      const input = {
        password: 'pass123',
        confirm_password: 'pass123',
      };

      const result = ResetPasswordSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password must be at least 8 characters');
      }
    });

    it('should fail when password exceeds 72 characters', () => {
      const longPassword = 'a'.repeat(73);
      const input = {
        password: longPassword,
        confirm_password: longPassword,
      };

      const result = ResetPasswordSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Password must be 72 characters or less');
      }
    });

    it('should fail when passwords do not match', () => {
      const input = {
        password: 'newpassword123',
        confirm_password: 'different456',
      };

      const result = ResetPasswordSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        const matchError = result.error.issues.find((issue) =>
          issue.path.includes('confirm_password'),
        );
        expect(matchError?.message).toBe('Passwords do not match');
      }
    });

    it('should have correct TypeScript type for ResetPasswordInput', () => {
      const input: ResetPasswordInput = {
        password: 'newpassword123',
        confirm_password: 'newpassword123',
      };

      expect(input).toBeDefined();
    });
  });

  describe('AuthState Discriminated Union', () => {
    it('should type-check idle state', () => {
      const state: AuthState = { status: 'idle' };

      expect(state.status).toBe('idle');
    });

    it('should type-check loading state', () => {
      const state: AuthState = { status: 'loading' };

      expect(state.status).toBe('loading');
    });

    it('should type-check authenticated state', () => {
      const mockUser: User = {
        id: 'user123' as User['id'],
        email: 'john@example.com',
        profile: {
          id: 'profile123' as Profile['id'],
          display_name: 'John Doe',
          avatar_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        household: null,
        household_role: null,
      };

      const mockSession: Session = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        expires_at: 1234567890,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user123' as User['id'],
          email: 'john@example.com',
        },
      };

      const state: AuthState = {
        status: 'authenticated',
        user: mockUser,
        session: mockSession,
      };

      expect(state.status).toBe('authenticated');
      if (state.status === 'authenticated') {
        expect(state.user.email).toBe('john@example.com');
        expect(state.session.access_token).toBe('token123');
      }
    });

    it('should type-check unauthenticated state', () => {
      const state: AuthState = { status: 'unauthenticated' };

      expect(state.status).toBe('unauthenticated');
    });

    it('should type-check error state', () => {
      const state: AuthState = {
        status: 'error',
        error: new Error('Authentication failed'),
      };

      expect(state.status).toBe('error');
      if (state.status === 'error') {
        expect(state.error.message).toBe('Authentication failed');
      }
    });

    it('should enforce discriminated union type narrowing', () => {
      const mockUser: User = {
        id: 'user123' as User['id'],
        email: 'john@example.com',
        profile: {
          id: 'profile123' as Profile['id'],
          display_name: 'John Doe',
          avatar_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        household: null,
        household_role: null,
      };

      const mockSession: Session = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        expires_at: 1234567890,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user123' as User['id'],
          email: 'john@example.com',
        },
      };

      const authenticatedState: AuthState = {
        status: 'authenticated',
        user: mockUser,
        session: mockSession,
      };

      if (authenticatedState.status === 'authenticated') {
        // TypeScript should know user and session exist here
        const user = authenticatedState.user;
        const session = authenticatedState.session;
        expect(user).toBeDefined();
        expect(session).toBeDefined();
      }

      const errorState: AuthState = {
        status: 'error',
        error: new Error('Test error'),
      };

      if (errorState.status === 'error') {
        // TypeScript should know error exists here
        const error = errorState.error;
        expect(error).toBeDefined();
      }
    });
  });

  describe('Type Exports', () => {
    it('should export all required types', () => {
      // Compile-time type checks (no runtime assertions needed)
      type _SignUpInput = SignUpInput;
      type _SignInInput = SignInInput;
      type _ForgotPasswordInput = ForgotPasswordInput;
      type _ResetPasswordInput = ResetPasswordInput;
      type _AuthState = AuthState;

      // If TypeScript compiles, types are correctly exported
      expect(true).toBe(true);
    });
  });
});
