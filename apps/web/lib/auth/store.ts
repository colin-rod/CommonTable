import { AuthService } from '@commontable/api-client';
import type {
  User,
  Session,
  SignUpInput,
  SignInInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@commontable/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createClient } from '../supabase/client';

/**
 * Auth state using discriminated union pattern
 */
type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User; session: Session }
  | { status: 'unauthenticated' }
  | { status: 'error'; error: Error };

/**
 * Auth store interface
 */
interface AuthStore {
  // State
  state: AuthState;
  initialized: boolean;

  // Actions
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (input: ForgotPasswordInput) => Promise<void>;
  updatePassword: (input: ResetPasswordInput) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

/**
 * Create Zustand auth store
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => {
      // Create Supabase client
      const supabase = createClient();
      const authService = new AuthService(supabase);

      return {
        // Initial state
        state: { status: 'idle' },
        initialized: false,

        /**
         * Initialize auth state on app load
         * Checks for existing session and recovers user data
         */
        initialize: async () => {
          const { initialized } = get();
          if (initialized) return;

          set({ state: { status: 'loading' } }, false, 'auth/initialize/start');

          try {
            const result = await authService.getCurrentUser();

            if (result) {
              set(
                {
                  state: {
                    status: 'authenticated',
                    user: result.user,
                    session: result.session,
                  },
                  initialized: true,
                },
                false,
                'auth/initialize/authenticated',
              );
            } else {
              set(
                {
                  state: { status: 'unauthenticated' },
                  initialized: true,
                },
                false,
                'auth/initialize/unauthenticated',
              );
            }
          } catch (error) {
            set(
              {
                state: {
                  status: 'error',
                  error: error instanceof Error ? error : new Error('Unknown error'),
                },
                initialized: true,
              },
              false,
              'auth/initialize/error',
            );
          }
        },

        /**
         * Sign up new user
         * Automatically creates profile and household
         */
        signUp: async (input: SignUpInput) => {
          set({ state: { status: 'loading' } }, false, 'auth/signUp/start');

          try {
            const result = await authService.signUp(input);

            set(
              {
                state: {
                  status: 'authenticated',
                  user: result.user,
                  session: result.session,
                },
              },
              false,
              'auth/signUp/success',
            );
          } catch (error) {
            set(
              {
                state: {
                  status: 'error',
                  error: error instanceof Error ? error : new Error('Signup failed'),
                },
              },
              false,
              'auth/signUp/error',
            );
            throw error;
          }
        },

        /**
         * Sign in existing user
         */
        signIn: async (input: SignInInput) => {
          set({ state: { status: 'loading' } }, false, 'auth/signIn/start');

          try {
            const result = await authService.signIn(input);

            set(
              {
                state: {
                  status: 'authenticated',
                  user: result.user,
                  session: result.session,
                },
              },
              false,
              'auth/signIn/success',
            );
          } catch (error) {
            set(
              {
                state: {
                  status: 'error',
                  error: error instanceof Error ? error : new Error('Signin failed'),
                },
              },
              false,
              'auth/signIn/error',
            );
            throw error;
          }
        },

        /**
         * Sign out current user
         */
        signOut: async () => {
          set({ state: { status: 'loading' } }, false, 'auth/signOut/start');

          try {
            await authService.signOut();

            set(
              {
                state: { status: 'unauthenticated' },
              },
              false,
              'auth/signOut/success',
            );
          } catch (error) {
            set(
              {
                state: {
                  status: 'error',
                  error: error instanceof Error ? error : new Error('Signout failed'),
                },
              },
              false,
              'auth/signOut/error',
            );
            throw error;
          }
        },

        /**
         * Request password reset email
         */
        resetPassword: async (input: ForgotPasswordInput) => {
          try {
            await authService.resetPassword(input);
          } catch (error) {
            set(
              {
                state: {
                  status: 'error',
                  error: error instanceof Error ? error : new Error('Password reset failed'),
                },
              },
              false,
              'auth/resetPassword/error',
            );
            throw error;
          }
        },

        /**
         * Update password with reset token
         */
        updatePassword: async (input: ResetPasswordInput) => {
          try {
            await authService.updatePassword(input);
          } catch (error) {
            set(
              {
                state: {
                  status: 'error',
                  error: error instanceof Error ? error : new Error('Password update failed'),
                },
              },
              false,
              'auth/updatePassword/error',
            );
            throw error;
          }
        },

        /**
         * Clear error state
         */
        clearError: () => {
          const { state } = get();
          if (state.status === 'error') {
            set({ state: { status: 'unauthenticated' } }, false, 'auth/clearError');
          }
        },
      };
    },
    { name: 'AuthStore' },
  ),
);
