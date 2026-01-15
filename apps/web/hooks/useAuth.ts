import type {
  User,
  Session,
  Household,
  SignUpInput,
  SignInInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@commontable/types';
import { useEffect } from 'react';

import { useAuthStore } from '../lib/auth/store';

/**
 * useAuth hook interface
 * Provides convenient access to auth state and actions
 */
export interface UseAuthReturn {
  // User data
  user: User | null;
  session: Session | null;
  household: Household | null;
  householdRole: 'admin' | 'member' | null;

  // Status flags
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  initialized: boolean;

  // Actions
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (input: ForgotPasswordInput) => Promise<void>;
  updatePassword: (input: ResetPasswordInput) => Promise<void>;
  clearError: () => void;
}

/**
 * useAuth hook
 * Wraps Zustand auth store with a convenient React hook interface
 *
 * Automatically initializes auth state on first mount
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signIn, signOut } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <LoginForm onSubmit={signIn} />;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user.profile.display_name}!</h1>
 *       <button onClick={signOut}>Sign out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const state = useAuthStore((store) => store.state);
  const initialized = useAuthStore((store) => store.initialized);
  const signUp = useAuthStore((store) => store.signUp);
  const signIn = useAuthStore((store) => store.signIn);
  const signOut = useAuthStore((store) => store.signOut);
  const resetPassword = useAuthStore((store) => store.resetPassword);
  const updatePassword = useAuthStore((store) => store.updatePassword);
  const initialize = useAuthStore((store) => store.initialize);
  const clearError = useAuthStore((store) => store.clearError);

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Extract computed values based on state
  const isLoading = state.status === 'loading' || state.status === 'idle';
  const isError = state.status === 'error';
  const isAuthenticated = state.status === 'authenticated';
  const error = state.status === 'error' ? state.error : null;
  const user = state.status === 'authenticated' ? state.user : null;
  const session = state.status === 'authenticated' ? state.session : null;
  const household = user?.household ?? null;
  const householdRole = user?.household_role ?? null;

  return {
    // User data
    user,
    session,
    household,
    householdRole,

    // Status flags
    isAuthenticated,
    isLoading,
    isError,
    error,
    initialized,

    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    clearError,
  };
}
