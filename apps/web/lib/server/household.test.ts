import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getCurrentUserHouseholdId } from './household';

import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server');

describe('getCurrentUserHouseholdId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return household ID for authenticated user', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'auth-id-123' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'profile-id-456' },
              error: null,
            }),
          };
        }
        if (table === 'household_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { household_id: 'household-id-789' },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const result = await getCurrentUserHouseholdId();

    expect(result).toBe('household-id-789');
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.from).toHaveBeenCalledWith('household_members');
  });

  it('should throw error if user not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    await expect(getCurrentUserHouseholdId()).rejects.toThrow('User not authenticated');
  });

  it('should throw error if profile not found', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'auth-id-123' } },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    await expect(getCurrentUserHouseholdId()).rejects.toThrow('User profile not found');
  });

  it('should throw error if user not in household', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'auth-id-123' } },
        }),
      },
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'profile-id-456' },
              error: null,
            }),
          };
        }
        if (table === 'household_members') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    await expect(getCurrentUserHouseholdId()).rejects.toThrow('User not in a household');
  });
});
