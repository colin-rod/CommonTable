import { describe, it, expect, vi, beforeEach } from 'vitest';

import { updateProfile, changePassword } from './profile';

const { mockSupabaseClient, mockAuth, mockProfilesTable, supabaseClients } = vi.hoisted(() => ({
  mockSupabaseClient: {},
  mockAuth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn(),
  },
  mockProfilesTable: {
    update: vi.fn(() => mockProfilesTable),
    eq: vi.fn(),
  },
  supabaseClients: [] as unknown[],
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    supabaseClients.push(mockSupabaseClient);
    return {
      ...mockSupabaseClient,
      auth: mockAuth,
      from: (table: string) => {
        if (table === 'profiles') return mockProfilesTable;
        return {};
      },
    };
  }),
}));

describe('profile server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseClients.length = 0;
  });

  describe('updateProfile', () => {
    it('should update profile and return success', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      mockProfilesTable.eq.mockResolvedValue({
        error: null,
      });

      const input = {
        display_name: 'New Display Name',
      };

      const result = await updateProfile(input);

      expect(result).toEqual({ success: true, data: undefined });
      expect(mockAuth.getUser).toHaveBeenCalled();
      expect(mockProfilesTable.update).toHaveBeenCalledWith({ display_name: 'New Display Name' });
      expect(mockProfilesTable.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should return error when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const input = {
        display_name: 'New Display Name',
      };

      const result = await updateProfile(input);

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
      expect(mockProfilesTable.update).not.toHaveBeenCalled();
    });

    it('should return error when getUser returns null user', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const input = {
        display_name: 'New Display Name',
      };

      const result = await updateProfile(input);

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
      expect(mockProfilesTable.update).not.toHaveBeenCalled();
    });

    it('should return error when profile update fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      mockProfilesTable.eq.mockResolvedValue({
        error: { message: 'Database error' },
      });

      const input = {
        display_name: 'New Display Name',
      };

      const result = await updateProfile(input);

      expect(result).toEqual({ success: false, error: 'Failed to update profile' });
    });

    it('should handle unexpected errors', async () => {
      mockAuth.getUser.mockRejectedValue(new Error('Unexpected error'));

      const input = {
        display_name: 'New Display Name',
      };

      const result = await updateProfile(input);

      expect(result).toEqual({ success: false, error: 'Failed to update profile' });
    });
  });

  describe('changePassword', () => {
    it('should change password and return success', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-1' }, session: {} },
        error: null,
      });

      mockAuth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });

      const input = {
        current_password: 'old-password',
        new_password: 'new-password',
      };

      const result = await changePassword(input);

      expect(result).toEqual({ success: true, data: undefined });
      expect(mockAuth.getUser).toHaveBeenCalled();
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'old-password',
      });
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        password: 'new-password',
      });
    });

    it('should return error when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const input = {
        current_password: 'old-password',
        new_password: 'new-password',
      };

      const result = await changePassword(input);

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
      expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return error when user has no email', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: null } },
        error: null,
      });

      const input = {
        current_password: 'old-password',
        new_password: 'new-password',
      };

      const result = await changePassword(input);

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
      expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should return error when current password is incorrect', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const input = {
        current_password: 'wrong-password',
        new_password: 'new-password',
      };

      const result = await changePassword(input);

      expect(result).toEqual({ success: false, error: 'Current password is incorrect' });
      expect(mockAuth.updateUser).not.toHaveBeenCalled();
    });

    it('should return error when password update fails', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      mockAuth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-1' }, session: {} },
        error: null,
      });

      mockAuth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Update failed' },
      });

      const input = {
        current_password: 'old-password',
        new_password: 'new-password',
      };

      const result = await changePassword(input);

      expect(result).toEqual({ success: false, error: 'Failed to change password' });
    });

    it('should handle unexpected errors', async () => {
      mockAuth.getUser.mockRejectedValue(new Error('Unexpected error'));

      const input = {
        current_password: 'old-password',
        new_password: 'new-password',
      };

      const result = await changePassword(input);

      expect(result).toEqual({ success: false, error: 'Failed to change password' });
    });
  });
});
