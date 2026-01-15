import type { User, Session, Household } from '@commontable/types';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { useAuthStore } from '../lib/auth/store';

import { useAuth } from './useAuth';

// Mock the auth store
vi.mock('../lib/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

describe('useAuth Hook', () => {
  const mockUser: User = {
    id: 'user-123' as User['id'],
    email: 'test@example.com',
    profile: {
      id: 'user-123' as User['id'],
      display_name: 'Test User',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    household: {
      id: 'household-123' as Household['id'],
      name: 'Test Household',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    household_role: 'admin',
  };

  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 3600000,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'user-123' as User['id'],
      email: 'test@example.com',
    },
  };

  const mockActions = {
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    initialize: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State - Idle', () => {
    it('should return idle state before initialization', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'idle' as const },
            initialized: false,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.household).toBeNull();
      expect(result.current.householdRole).toBeNull();
      expect(result.current.initialized).toBe(false);
    });

    it('should call initialize on mount', () => {
      const initializeMock = vi.fn();

      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'idle' as const },
            initialized: false,
            ...mockActions,
            initialize: initializeMock,
          };
          return selector(store);
        },
      );

      renderHook(() => useAuth());

      expect(initializeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should return loading state correctly', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'loading' as const },
            initialized: false,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Authenticated State', () => {
    it('should return authenticated state with user and session', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: {
              status: 'authenticated' as const,
              user: mockUser,
              session: mockSession,
            },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isError).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.household).toEqual(mockUser.household);
      expect(result.current.householdRole).toBe('admin');
      expect(result.current.initialized).toBe(true);
    });

    it('should return null household when user has no household', () => {
      const userWithoutHousehold: User = {
        ...mockUser,
        household: null,
        household_role: null,
      };

      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: {
              status: 'authenticated' as const,
              user: userWithoutHousehold,
              session: mockSession,
            },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.household).toBeNull();
      expect(result.current.householdRole).toBeNull();
    });
  });

  describe('Unauthenticated State', () => {
    it('should return unauthenticated state', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'unauthenticated' as const },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.household).toBeNull();
      expect(result.current.initialized).toBe(true);
    });
  });

  describe('Error State', () => {
    it('should return error state with error message', () => {
      const mockError = new Error('Authentication failed');

      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: {
              status: 'error' as const,
              error: mockError,
            },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Actions', () => {
    it('should provide signUp action', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'unauthenticated' as const },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.signUp).toBeDefined();
      expect(typeof result.current.signUp).toBe('function');
    });

    it('should provide signIn action', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'unauthenticated' as const },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.signIn).toBeDefined();
      expect(typeof result.current.signIn).toBe('function');
    });

    it('should provide signOut action', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: {
              status: 'authenticated' as const,
              user: mockUser,
              session: mockSession,
            },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.signOut).toBeDefined();
      expect(typeof result.current.signOut).toBe('function');
    });

    it('should provide resetPassword action', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'unauthenticated' as const },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.resetPassword).toBeDefined();
      expect(typeof result.current.resetPassword).toBe('function');
    });

    it('should provide updatePassword action', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'unauthenticated' as const },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.updatePassword).toBeDefined();
      expect(typeof result.current.updatePassword).toBe('function');
    });

    it('should provide clearError action', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: {
              status: 'error' as const,
              error: new Error('Test error'),
            },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.clearError).toBeDefined();
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('State Transitions', () => {
    it('should update when state transitions from idle to authenticated', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let storeState: any = {
        state: { status: 'idle' as const },
        initialized: false,
        ...mockActions,
      };

      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          return selector(storeState);
        },
      );

      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);

      // Simulate state change
      storeState = {
        state: {
          status: 'authenticated' as const,
          user: mockUser,
          session: mockSession,
        },
        initialized: true,
        ...mockActions,
      };

      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should update when state transitions from authenticated to unauthenticated', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let storeState: any = {
        state: {
          status: 'authenticated' as const,
          user: mockUser,
          session: mockSession,
        },
        initialized: true,
        ...mockActions,
      };

      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          return selector(storeState);
        },
      );

      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);

      // Simulate sign out
      storeState = {
        state: { status: 'unauthenticated' as const },
        initialized: true,
        ...mockActions,
      };

      rerender();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('should update when state transitions from loading to error', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let storeState: any = {
        state: { status: 'loading' as const },
        initialized: false,
        ...mockActions,
      };

      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          return selector(storeState);
        },
      );

      const { result, rerender } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);

      // Simulate error
      const mockError = new Error('Failed to authenticate');
      storeState = {
        state: {
          status: 'error' as const,
          error: mockError,
        },
        initialized: true,
        ...mockActions,
      };

      rerender();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('Initialization', () => {
    it('should only call initialize once even on multiple renders', () => {
      const initializeMock = vi.fn();

      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: { status: 'idle' as const },
            initialized: false,
            ...mockActions,
            initialize: initializeMock,
          };
          return selector(store);
        },
      );

      const { rerender } = renderHook(() => useAuth());

      expect(initializeMock).toHaveBeenCalledTimes(1);

      rerender();
      rerender();

      // Should still be called only once due to useEffect dependency
      expect(initializeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript types for all return values', () => {
      vi.mocked(useAuthStore).mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (selector: any) => {
          const store = {
            state: {
              status: 'authenticated' as const,
              user: mockUser,
              session: mockSession,
            },
            initialized: true,
            ...mockActions,
          };
          return selector(store);
        },
      );

      const { result } = renderHook(() => useAuth());

      // Type assertions (compile-time checks)
      const user: User | null = result.current.user;
      const session: Session | null = result.current.session;
      const household: Household | null = result.current.household;
      const householdRole: 'admin' | 'member' | null = result.current.householdRole;
      const isAuthenticated: boolean = result.current.isAuthenticated;
      const isLoading: boolean = result.current.isLoading;
      const isError: boolean = result.current.isError;
      const error: Error | null = result.current.error;
      const initialized: boolean = result.current.initialized;

      expect(user).toBeDefined();
      expect(session).toBeDefined();
      expect(household).toBeDefined();
      expect(householdRole).toBeDefined();
      expect(typeof isAuthenticated).toBe('boolean');
      expect(typeof isLoading).toBe('boolean');
      expect(typeof isError).toBe('boolean');
      expect(error).toBeNull();
      expect(typeof initialized).toBe('boolean');
    });
  });
});
