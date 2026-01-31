import {
  SignUpSchema,
  SignInSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  AppError,
  EmailVerificationError,
} from '@commontable/types';
import type {
  SignUpInput,
  SignInInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  SignUpResponse,
  SignInResponse,
  ForgotPasswordResponse,
  GetCurrentUserResponse,
  User,
  Profile,
  Session,
  UserId,
  Household,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * AuthService handles all authentication operations
 * Uses Supabase Auth for user management
 */
export class AuthService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Sign up a new user with email/password
   * Automatically creates profile and household
   *
   * @throws ValidationError - Invalid input data
   * @throws ConflictError - Email already exists
   * @throws AppError - Other errors
   */
  async signUp(input: SignUpInput): Promise<SignUpResponse> {
    // Validate input
    const validated = this.validate(SignUpSchema, input, 'Invalid signup data');

    try {
      // Sign up user with Supabase Auth
      const { data, error } = await this.supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            display_name: validated.display_name,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new ConflictError('Email already exists', { email: validated.email });
        }
        throw new AppError(error.message, 'SIGNUP_ERROR', error.status || 500);
      }

      if (!data.user || !data.session) {
        throw new AppError('Failed to create user', 'SIGNUP_ERROR');
      }

      // Fetch profile (created by trigger)
      // The trigger automatically creates the profile with auth_user_id set
      const profile = await this.fetchProfile(data.user.id);

      // Create household for new user
      // This RPC now returns household_id (UUID) instead of void
      const { data: householdId, error: householdError } = await this.supabase.rpc(
        'create_household_on_signup',
        {
          p_user_id: data.user.id,
          p_display_name: validated.display_name,
        },
      );

      if (householdError) {
        throw new AppError('Failed to create household', 'HOUSEHOLD_CREATE_ERROR', 500, {
          error: householdError,
        });
      }

      if (!householdId) {
        throw new AppError('No household ID returned', 'HOUSEHOLD_CREATE_ERROR', 500);
      }

      // Fetch household
      const household = await this.fetchHousehold(householdId);

      // Construct user object
      const user: User = {
        id: data.user.id as UserId,
        email: data.user.email ?? validated.email,
        profile,
        household,
        household_role: 'admin',
      };

      return {
        user,
        session: this.mapSession(data.session),
        household,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }

      throw new AppError('Signup failed', 'SIGNUP_ERROR', 500, { error });
    }
  }

  /**
   * Sign in an existing user with email/password
   *
   * @throws ValidationError - Invalid input data
   * @throws UnauthorizedError - Invalid credentials
   * @throws AppError - Other errors
   */
  async signIn(input: SignInInput): Promise<SignInResponse> {
    // Validate input
    const validated = this.validate(SignInSchema, input, 'Invalid signin data');

    try {
      // Sign in with Supabase Auth
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        throw new UnauthorizedError('Invalid email or password');
      }

      if (!data.user || !data.session) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Fetch user data
      const user = await this.fetchUserData(data.user.id, data.user.email ?? validated.email);

      return {
        user,
        session: this.mapSession(data.session),
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }

      throw new UnauthorizedError('Invalid email or password');
    }
  }

  /**
   * Sign out the current user
   *
   * @throws AppError - Sign out failed
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new AppError('Sign out failed', 'SIGNOUT_ERROR', 500, { error });
    }
  }

  /**
   * Send password reset email
   *
   * @throws ValidationError - Invalid email
   * @throws AppError - Failed to send email
   */
  async resetPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
    // Validate input
    const validated = this.validate(ForgotPasswordSchema, input, 'Invalid email');

    try {
      // Get redirect URL from environment or use default
      // Check for browser environment safely
      let redirectTo = 'http://localhost:3000/auth/reset-password';
      if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
        const location = (globalThis as { location?: { origin?: string } }).location;
        if (location?.origin) {
          redirectTo = `${location.origin}/auth/reset-password`;
        }
      }

      const { error } = await this.supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo,
      });

      if (error) {
        throw new AppError('Failed to send reset email', 'RESET_PASSWORD_ERROR', 500, {
          error,
        });
      }

      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to send reset email', 'RESET_PASSWORD_ERROR', 500, {
        error,
      });
    }
  }

  /**
   * Update user password
   *
   * @throws ValidationError - Invalid password
   * @throws UnauthorizedError - Not authenticated or invalid token
   * @throws AppError - Update failed
   */
  async updatePassword(input: ResetPasswordInput): Promise<void> {
    // Validate input
    const validated = this.validate(ResetPasswordSchema, input, 'Invalid password');

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: validated.password,
      });

      if (error) {
        throw new UnauthorizedError('Failed to update password');
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to update password', 'UPDATE_PASSWORD_ERROR', 500, {
        error,
      });
    }
  }

  /**
   * Get current authenticated user
   *
   * @returns User and session if authenticated, null otherwise
   */
  async getCurrentUser(): Promise<GetCurrentUserResponse | null> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error || !data.session) {
        return null;
      }

      const userEmail = data.session.user.email;
      if (!userEmail) {
        return null;
      }

      const user = await this.fetchUserData(data.session.user.id, userEmail);

      return {
        user,
        session: this.mapSession(data.session),
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch profile for a user
   */
  private async fetchProfile(userId: string): Promise<Profile> {
    // Profiles are now looked up by auth_user_id (not id)
    // The trigger creates profiles with auth_user_id = auth.users.id
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Profile', userId);
    }

    return data;
  }

  /**
   * Fetch household by ID
   */
  private async fetchHousehold(householdId: string): Promise<Household> {
    const { data, error } = await this.supabase
      .from('households')
      .select('*')
      .eq('id', householdId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Household', householdId);
    }

    return data;
  }

  /**
   * Fetch complete user data (profile + household)
   */
  private async fetchUserData(userId: string, email: string): Promise<User> {
    // Fetch profile (by auth_user_id)
    const profile = await this.fetchProfile(userId);

    // Fetch household membership
    // Note: household_members.user_id references profiles.id (not auth.users.id)
    const { data: memberData, error: memberError } = await this.supabase
      .from('household_members')
      .select('household_id, role, households(*)')
      .eq('user_id', profile.id)
      .single();

    if (memberError || !memberData) {
      // Attempt self-heal for orphaned profiles (missing household_members row)
      const { data: householdId, error: householdCreateError } = await this.supabase.rpc(
        'create_household_on_signup',
        {
          p_user_id: userId,
          p_display_name: profile.display_name,
        },
      );

      if (!householdCreateError && householdId) {
        const household = await this.fetchHousehold(householdId);
        return {
          id: userId as UserId,
          email,
          profile,
          household,
          household_role: 'admin',
        };
      }

      // User has no household yet (or self-heal failed)
      return {
        id: userId as UserId,
        email,
        profile,
        household: null,
        household_role: null,
      };
    }

    // Cast the joined households data to our Household type
    const household = memberData.households as unknown as Household;

    return {
      id: userId as UserId,
      email,
      profile,
      household,
      household_role: memberData.role,
    };
  }

  /**
   * Map Supabase session to our Session type
   */
  private mapSession(session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in: number;
    token_type: string;
    user: { id: string; email?: string };
  }): Session {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: {
        id: session.user.id as UserId,
        email: session.user.email ?? '',
      },
    };
  }

  /**
   * Resend verification email to user
   *
   * @throws ValidationError - Invalid email format
   * @throws EmailVerificationError - Resend failed
   */
  async resendVerificationEmail(email: string): Promise<void> {
    // Validate email format
    const EmailSchema = z.string().email();
    const validated = this.validate(EmailSchema, email, 'Invalid email format');

    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email: validated,
    });

    if (error) {
      throw new EmailVerificationError(error.message);
    }
  }

  /**
   * Validate input with Zod schema and convert ZodError to ValidationError
   */
  private validate<T>(schema: z.ZodSchema<T>, input: unknown, errorMessage: string): T {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(errorMessage, { errors: error.errors });
      }
      throw error;
    }
  }
}
