import { ValidationError, UnauthorizedError, ConflictError } from '@commontable/types';
import type { SupabaseClient, AuthError } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { AuthService } from './AuthService';

/**
 * Mock types for Supabase responses in tests
 * These partial types allow us to create lightweight mocks without full type coverage
 */
interface MockUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: MockUser;
}

interface MockProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface MockHousehold {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

interface MockAuthError {
  message: string;
  name: string;
  status: number;
}

/**
 * Helper to create a mock query builder chain
 */
function createMockQueryBuilder<T>(resolvedValue: { data: T; error: null }): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
  };
  return builder;
}

/**
 * Create a mock Supabase client with properly typed auth methods
 * Uses vi.fn() for all methods to allow mocking in tests
 */
function createMockSupabaseClient(): SupabaseClient {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient;
}

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('signUp', () => {
    const validSignUpData = {
      display_name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirm_password: 'password123',
    };

    it('should create user with email/password and profile', async () => {
      const mockUser: MockUser = {
        id: 'user-123',
        email: 'john@example.com',
        user_metadata: {
          display_name: 'John Doe',
        },
      };

      const mockSession: MockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      };

      const mockProfile: MockProfile = {
        id: 'user-123',
        display_name: 'John Doe',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockHousehold: MockHousehold = {
        id: 'household-123',
        name: "John Doe's Household",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock signUp
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as never);

      // Mock profile fetch (first .from call)
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockProfile, error: null }) as never)
        // Mock household fetch (second .from call)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockHousehold, error: null }) as never);

      // Mock household creation
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockHousehold.id,
        error: null,
      } as never);

      const result = await authService.signUp(validSignUpData);

      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.profile.display_name).toBe('John Doe');
      expect(result.household.id).toBe('household-123');
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          data: {
            display_name: 'John Doe',
          },
        },
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_household_on_signup', {
        p_user_id: 'user-123',
        p_display_name: 'John Doe',
      });
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = {
        ...validSignUpData,
        email: 'not-an-email',
      };

      await expect(authService.signUp(invalidData)).rejects.toThrow(ValidationError);
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for password too short', async () => {
      const invalidData = {
        ...validSignUpData,
        password: '123',
        confirm_password: '123',
      };

      await expect(authService.signUp(invalidData)).rejects.toThrow(ValidationError);
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for mismatched passwords', async () => {
      const invalidData = {
        ...validSignUpData,
        confirm_password: 'different-password',
      };

      await expect(authService.signUp(invalidData)).rejects.toThrow(ValidationError);
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      const mockError: MockAuthError = {
        message: 'User already registered',
        name: 'AuthApiError',
        status: 409,
      };

      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as AuthError,
      } as never);

      await expect(authService.signUp(validSignUpData)).rejects.toThrow(ConflictError);
    });
  });

  describe('signIn', () => {
    const validSignInData = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should authenticate user with valid credentials', async () => {
      const mockUser: MockUser = {
        id: 'user-123',
        email: 'john@example.com',
      };

      const mockSession: MockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      };

      const mockProfile: MockProfile = {
        id: 'user-123',
        display_name: 'John Doe',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockHousehold: MockHousehold = {
        id: 'household-123',
        name: "John Doe's Household",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as never);

      // Mock profile and household fetch
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockProfile, error: null }) as never)
        .mockReturnValueOnce(
          createMockQueryBuilder({
            data: {
              household_id: 'household-123',
              role: 'admin',
              households: mockHousehold,
            },
            error: null,
          }) as never,
        );

      const result = await authService.signIn(validSignInData);

      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.profile.display_name).toBe('John Doe');
      expect(result.user.household?.id).toBe('household-123');
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };

      await expect(authService.signIn(invalidData)).rejects.toThrow(ValidationError);
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const mockError: MockAuthError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
        status: 400,
      };

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as AuthError,
      } as never);

      await expect(authService.signIn(validSignInData)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      const mockError: MockAuthError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
        status: 400,
      };

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError as AuthError,
      } as never);

      await expect(authService.signIn(validSignInData)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('signOut', () => {
    it('should clear session and revoke tokens', async () => {
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      await authService.signOut();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      const mockError: MockAuthError = {
        message: 'Network error',
        name: 'AuthApiError',
        status: 500,
      };

      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: mockError as AuthError,
      });

      await expect(authService.signOut()).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(mockSupabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as never);

      const result = await authService.resetPassword({
        email: 'john@example.com',
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'john@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/reset-password'),
        }),
      );
    });

    it('should throw ValidationError for invalid email', async () => {
      await expect(authService.resetPassword({ email: 'not-an-email' })).rejects.toThrow(
        ValidationError,
      );
      expect(mockSupabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  describe('updatePassword', () => {
    const validPasswordData = {
      password: 'newpassword123',
      confirm_password: 'newpassword123',
    };

    it('should update password with valid data', async () => {
      vi.mocked(mockSupabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as never);

      await authService.updatePassword(validPasswordData);

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('should throw ValidationError for mismatched passwords', async () => {
      const invalidData = {
        password: 'newpassword123',
        confirm_password: 'different',
      };

      await expect(authService.updatePassword(invalidData)).rejects.toThrow(ValidationError);
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for password too short', async () => {
      const invalidData = {
        password: '123',
        confirm_password: '123',
      };

      await expect(authService.updatePassword(invalidData)).rejects.toThrow(ValidationError);
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch user with profile and household data', async () => {
      const mockUser: MockUser = {
        id: 'user-123',
        email: 'john@example.com',
      };

      const mockSession: MockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      };

      const mockProfile: MockProfile = {
        id: 'user-123',
        display_name: 'John Doe',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockHousehold: MockHousehold = {
        id: 'household-123',
        name: "John Doe's Household",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as never);

      // Mock profile and household fetch
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockProfile, error: null }) as never)
        .mockReturnValueOnce(
          createMockQueryBuilder({
            data: {
              household_id: 'household-123',
              role: 'admin',
              households: mockHousehold,
            },
            error: null,
          }) as never,
        );

      const result = await authService.getCurrentUser();

      expect(result?.user.id).toBe('user-123');
      expect(result?.user.email).toBe('john@example.com');
      expect(result?.user.profile.display_name).toBe('John Doe');
      expect(result?.user.household?.id).toBe('household-123');
    });

    it('should return null if not authenticated', async () => {
      vi.mocked(mockSupabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
