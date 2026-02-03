import { ValidationError, ConflictError, AppError } from '@commontable/types';
import type { Database, UserId } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import { TagService } from './TagService';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient<Database>;

  return mockSupabase;
};

describe('TagService', () => {
  let service: TagService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new TagService(mockSupabase);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tag', async () => {
      const mockTag = {
        id: 'tag-123',
        household_id: 'household-456',
        name: 'pasta',
        created_by: 'user-789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock RLS function for household ID
      const mockRpc = vi.fn().mockResolvedValue({ data: 'household-456', error: null });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
          }),
        }),
      });

      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      const result = await service.create({ name: 'Pasta' }, 'user-789' as UserId);

      expect(result).toEqual(mockTag);
      expect(result.name).toBe('pasta'); // normalized
      expect(mockFrom).toHaveBeenCalledWith('tags');
      expect(mockRpc).toHaveBeenCalledWith('get_user_household_id');
    });

    it('should normalize tag name (lowercase, trim)', async () => {
      const mockTag = {
        id: 'tag-123',
        household_id: 'household-456',
        name: 'italian cuisine',
        created_by: 'user-789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock RLS function for household ID
      const mockRpc = vi.fn().mockResolvedValue({ data: 'household-456', error: null });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
        }),
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      const result = await service.create({ name: '  Italian Cuisine  ' }, 'user-789' as UserId);

      expect(result.name).toBe('italian cuisine');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ name: 'italian cuisine' }));
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(service.create({ name: '' }, 'user-789' as UserId)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for name > 20 chars', async () => {
      await expect(
        service.create(
          { name: 'this-is-a-very-long-tag-name-exceeding-twenty-characters' },
          'user-789' as UserId,
        ),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error if database insert fails', async () => {
      // Mock RLS function for household ID
      const mockRpc = vi.fn().mockResolvedValue({ data: 'household-456', error: null });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      await expect(service.create({ name: 'pasta' }, 'user-789' as UserId)).rejects.toThrow();
    });
  });

  describe('getOrCreateTag', () => {
    it('should create tag if not exists', async () => {
      const mockTagId = 'tag-123';
      const mockTag = {
        id: mockTagId,
        household_id: 'household-456',
        name: 'pasta',
        created_by: 'user-789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock RPC call
      const mockRpc = vi.fn().mockResolvedValue({ data: mockTagId, error: null });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      // Mock getById call
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
          }),
        }),
      });
      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      const result = await service.getOrCreateTag(
        'Pasta',
        'household-456' as any,
        'user-789' as any,
      );

      expect(result.name).toBe('pasta');
      expect(mockRpc).toHaveBeenCalledWith('get_or_create_tag', {
        p_household_id: 'household-456',
        p_tag_name: 'pasta',
        p_created_by: 'user-789',
      });
    });

    it('should return existing tag if exists (case-insensitive)', async () => {
      const mockTagId = 'tag-123';
      const mockTag = {
        id: mockTagId,
        household_id: 'household-456',
        name: 'pasta',
        created_by: 'user-789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock RPC call returning existing tag ID
      const mockRpc = vi.fn().mockResolvedValue({ data: mockTagId, error: null });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      // Mock getById call
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
          }),
        }),
      });
      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      // Call twice with different casing
      const result1 = await service.getOrCreateTag(
        'Pasta',
        'household-456' as any,
        'user-789' as any,
      );
      const result2 = await service.getOrCreateTag(
        'PASTA',
        'household-456' as any,
        'user-789' as any,
      );

      expect(result1.id).toBe(mockTagId);
      expect(result2.id).toBe(mockTagId);
    });

    it('should throw ValidationError for invalid tag name', async () => {
      await expect(
        service.getOrCreateTag('', 'household-456' as any, 'user-789' as any),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('addTagToVersion', () => {
    it('should associate tag with version', async () => {
      const mockTagId = '550e8400-e29b-41d4-a716-446655440001';
      const mockVersionId = '550e8400-e29b-41d4-a716-446655440002';
      const mockTag = {
        id: mockTagId,
        household_id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'pasta',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockAssociation = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        recipe_version_id: mockVersionId,
        tag_id: mockTagId,
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        created_at: new Date().toISOString(),
      };

      // Mock RLS function for household ID and getOrCreateTag RPC
      const mockRpc = vi.fn((fn: string) => {
        if (fn === 'get_user_household_id') {
          return Promise.resolve({ data: '550e8400-e29b-41d4-a716-446655440003', error: null });
        } else if (fn === 'get_or_create_tag') {
          return Promise.resolve({ data: mockTagId, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      // Mock getById for getOrCreateTag
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
        }),
      });

      // Mock insert for addTagToVersion
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockAssociation, error: null }),
        }),
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'tags') {
          return { select: mockSelect };
        } else if (table === 'recipe_version_tags') {
          return { insert: mockInsert };
        }
        return {};
      });

      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      const result = await service.addTagToVersion(
        {
          recipe_version_id: mockVersionId,
          tag_name: 'pasta',
        },
        '550e8400-e29b-41d4-a716-446655440004' as UserId,
      );

      expect(result.tag_id).toBe(mockTagId);
      expect(result.recipe_version_id).toBe(mockVersionId);
    });

    it('should throw ConflictError for duplicate association', async () => {
      const mockTagId = '550e8400-e29b-41d4-a716-446655440001';
      const mockVersionId = '550e8400-e29b-41d4-a716-446655440002';
      const mockTag = {
        id: mockTagId,
        household_id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'pasta',
        created_by: '550e8400-e29b-41d4-a716-446655440004',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock RLS function for household ID and getOrCreateTag RPC
      const mockRpc = vi.fn((fn: string) => {
        if (fn === 'get_user_household_id') {
          return Promise.resolve({ data: '550e8400-e29b-41d4-a716-446655440003', error: null });
        } else if (fn === 'get_or_create_tag') {
          return Promise.resolve({ data: mockTagId, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      // Mock getById for getOrCreateTag
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockTag, error: null }),
        }),
      });

      // Mock insert with duplicate error
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint' },
          }),
        }),
      });

      const mockFrom = vi.fn((table: string) => {
        if (table === 'tags') {
          return { select: mockSelect };
        } else if (table === 'recipe_version_tags') {
          return { insert: mockInsert };
        }
        return {};
      });

      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      await expect(
        service.addTagToVersion(
          {
            recipe_version_id: mockVersionId,
            tag_name: 'pasta',
          },
          '550e8400-e29b-41d4-a716-446655440004' as UserId,
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getVersionTags', () => {
    it('should return all tags for a version', async () => {
      const mockData = [
        {
          tag_id: 'tag-1',
          tags: {
            id: 'tag-1',
            name: 'italian',
            household_id: 'household-456',
            created_by: 'user-789',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
        {
          tag_id: 'tag-2',
          tags: {
            id: 'tag-2',
            name: 'pasta',
            household_id: 'household-456',
            created_by: 'user-789',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      const result = await service.getVersionTags('version-456' as any);

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('italian'); // sorted alphabetically
      expect(result[1]!.name).toBe('pasta');
    });

    it('should return empty array if no tags', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      (mockSupabase.from as Mock).mockImplementation(mockFrom);

      const result = await service.getVersionTags('version-456' as any);

      expect(result).toEqual([]);
    });
  });

  describe('getHouseholdTags', () => {
    it('should return tags with usage counts', async () => {
      const mockData = [
        { tag_name: 'pasta', usage_count: 12 },
        { tag_name: 'italian', usage_count: 8 },
      ];

      const mockRpc = vi.fn().mockResolvedValue({ data: mockData, error: null });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      const result = await service.getHouseholdTags('household-456' as any);

      expect(result).toEqual(mockData);
      expect(mockRpc).toHaveBeenCalledWith('get_household_tags', {
        p_household_id: 'household-456',
      });
    });
  });

  describe('getCurrentHouseholdId (private method)', () => {
    it('should call RLS function and return household ID', async () => {
      const mockHouseholdId = 'household-456';
      const mockRpc = vi.fn().mockResolvedValue({
        data: mockHouseholdId,
        error: null,
      });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      // Access private method for testing
      const result = await (service as any).getCurrentHouseholdId();

      expect(result).toBe(mockHouseholdId);
      expect(mockRpc).toHaveBeenCalledWith('get_user_household_id');
    });

    it('should throw AppError if RLS function returns error', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not authenticated' },
      });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      await expect((service as any).getCurrentHouseholdId()).rejects.toThrow(AppError);
      await expect((service as any).getCurrentHouseholdId()).rejects.toThrow(
        'Failed to get current household ID',
      );
    });

    it('should throw AppError if RLS function returns no data', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      (mockSupabase.rpc as Mock).mockImplementation(mockRpc);

      await expect((service as any).getCurrentHouseholdId()).rejects.toThrow(AppError);
    });
  });
});
