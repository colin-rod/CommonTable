/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ValidationError,
  NotFoundError,
  AppError,
  type CalendarEntryCommentId,
  type CalendarEntryId,
  type HouseholdId,
  type UserId,
  type CalendarEntryComment,
  type CreateCalendarEntryCommentInput,
} from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { CalendarEntryCommentService } from './CalendarEntryCommentService';

/**
 * Mock types for Supabase responses in tests
 */
interface MockCalendarEntryComment {
  id: string;
  calendar_entry_id: string;
  household_id: string;
  comment_text: string;
  created_by: string;
  created_at: string;
}

interface MockCalendarEntry {
  id: string;
  household_id: string;
  recipe_id: string | null;
  planned_date: string;
  meal_slot: string;
  status: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
}

/**
 * Helper to create a mock query builder chain
 */
function createMockQueryBuilder<T>(resolvedValue?: {
  data: T | null;
  error: unknown;
}): MockQueryBuilder {
  const defaultValue = resolvedValue ?? { data: null, error: null };

  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(defaultValue),
    maybeSingle: vi.fn().mockResolvedValue(defaultValue),
    limit: vi.fn().mockResolvedValue(defaultValue),
  };

  return builder;
}

/**
 * Create a mock Supabase client
 */
function createMockSupabaseClient(): SupabaseClient {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  } as unknown as SupabaseClient;
}

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();

describe('CalendarEntryCommentService', () => {
  let service: CalendarEntryCommentService;

  // Valid UUIDs for testing
  const validCalendarEntryId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' as CalendarEntryId;
  const validCommentId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901' as CalendarEntryCommentId;
  const validHouseholdId = 'c3d4e5f6-a7b8-9012-cdef-123456789012' as HouseholdId;
  const validUserId = 'd4e5f6a7-b8c9-0123-def1-234567890123' as UserId;

  beforeEach(() => {
    service = new CalendarEntryCommentService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // =============================================================================
  // getByCalendarEntryId
  // =============================================================================

  describe('getByCalendarEntryId', () => {
    it('should return empty array when no comments exist', async () => {
      const builder = createMockQueryBuilder({ data: [], error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(builder as any);

      const result = await service.getByCalendarEntryId(validCalendarEntryId);

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_entry_comments');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('calendar_entry_id', validCalendarEntryId);
      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should return comments in chronological order (oldest first)', async () => {
      const mockComments: MockCalendarEntryComment[] = [
        {
          id: 'comment-1',
          calendar_entry_id: validCalendarEntryId,
          household_id: validHouseholdId,
          comment_text: 'First comment',
          created_by: validUserId,
          created_at: '2026-01-20T10:00:00Z',
        },
        {
          id: 'comment-2',
          calendar_entry_id: validCalendarEntryId,
          household_id: validHouseholdId,
          comment_text: 'Second comment',
          created_by: validUserId,
          created_at: '2026-01-20T11:00:00Z',
        },
      ];

      const builder = createMockQueryBuilder({ data: mockComments, error: null });
      // order() should also return the builder and resolve with the data
      builder.order.mockReturnValue(Promise.resolve({ data: mockComments, error: null }));
      vi.mocked(mockSupabase.from).mockReturnValue(builder as any);

      const result = await service.getByCalendarEntryId(validCalendarEntryId);

      expect(result).toHaveLength(2);
      expect(result[0]!.comment_text).toBe('First comment');
      expect(result[1]!.comment_text).toBe('Second comment');
      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });

    it('should throw AppError when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      const builder = createMockQueryBuilder({ data: null, error: dbError });
      // order() should reject with error
      builder.order.mockReturnValue(Promise.resolve({ data: null, error: dbError }));
      vi.mocked(mockSupabase.from).mockReturnValue(builder as any);

      await expect(service.getByCalendarEntryId(validCalendarEntryId)).rejects.toThrow(AppError);
    });
  });

  // =============================================================================
  // create
  // =============================================================================

  describe('create', () => {
    it('should create comment successfully', async () => {
      const input: CreateCalendarEntryCommentInput = {
        calendar_entry_id: validCalendarEntryId,
        comment_text: 'This looks delicious!',
      };

      const mockCalendarEntry: MockCalendarEntry = {
        id: validCalendarEntryId,
        household_id: validHouseholdId,
        recipe_id: 'recipe-123',
        planned_date: '2026-01-25',
        meal_slot: 'dinner',
        status: 'planned',
        notes: null,
        created_by: validUserId,
        created_at: '2026-01-20T10:00:00Z',
        updated_at: '2026-01-20T10:00:00Z',
      };

      const mockComment: MockCalendarEntryComment = {
        id: validCommentId,
        calendar_entry_id: validCalendarEntryId,
        household_id: validHouseholdId,
        comment_text: input.comment_text,
        created_by: validUserId,
        created_at: '2026-01-21T12:00:00Z',
      };

      // Mock auth.getUser to return user
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: validUserId } as any },
        error: null,
      });

      // Mock calendar entry lookup
      const calendarEntryBuilder = createMockQueryBuilder({ data: mockCalendarEntry, error: null });
      // Mock comment insert
      const commentBuilder = createMockQueryBuilder({ data: mockComment, error: null });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(calendarEntryBuilder as any) // First call: calendar entry lookup
        .mockReturnValueOnce(commentBuilder as any); // Second call: comment insert

      const result = await service.create(input);

      expect(result.id).toBe(validCommentId);
      expect(result.comment_text).toBe(input.comment_text);
      expect(result.calendar_entry_id).toBe(validCalendarEntryId);
      expect(result.household_id).toBe(validHouseholdId);
      expect(result.created_by).toBe(validUserId);
    });

    it('should validate input with Zod and throw ValidationError for empty comment', async () => {
      const input: CreateCalendarEntryCommentInput = {
        calendar_entry_id: validCalendarEntryId,
        comment_text: '   ', // Only whitespace
      };

      await expect(service.create(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid calendar entry ID', async () => {
      const input = {
        calendar_entry_id: 'invalid-uuid',
        comment_text: 'This looks great!',
      } as CreateCalendarEntryCommentInput;

      await expect(service.create(input)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if calendar entry does not exist', async () => {
      const input: CreateCalendarEntryCommentInput = {
        calendar_entry_id: validCalendarEntryId,
        comment_text: 'This looks delicious!',
      };

      // Mock auth.getUser to return user
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: validUserId } as any },
        error: null,
      });

      // Mock calendar entry lookup returning null (not found)
      const calendarEntryBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(calendarEntryBuilder as any);

      await expect(service.create(input)).rejects.toThrow(NotFoundError);
      await expect(service.create(input)).rejects.toThrow('Calendar entry not found');
    });

    it('should throw AppError when user is not authenticated', async () => {
      const input: CreateCalendarEntryCommentInput = {
        calendar_entry_id: validCalendarEntryId,
        comment_text: 'This looks delicious!',
      };

      // Mock auth.getUser returning no user
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(service.create(input)).rejects.toThrow(AppError);
      await expect(service.create(input)).rejects.toThrow('User not authenticated');
    });
  });

  // =============================================================================
  // getById
  // =============================================================================

  describe('getById', () => {
    it('should return comment when found', async () => {
      const mockComment: MockCalendarEntryComment = {
        id: validCommentId,
        calendar_entry_id: validCalendarEntryId,
        household_id: validHouseholdId,
        comment_text: 'Great meal plan!',
        created_by: validUserId,
        created_at: '2026-01-21T12:00:00Z',
      };

      const builder = createMockQueryBuilder({ data: mockComment, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(builder as any);

      const result = await service.getById(validCommentId);

      expect(result.id).toBe(validCommentId);
      expect(result.comment_text).toBe('Great meal plan!');
      expect(mockSupabase.from).toHaveBeenCalledWith('calendar_entry_comments');
      expect(builder.select).toHaveBeenCalledWith('*');
      expect(builder.eq).toHaveBeenCalledWith('id', validCommentId);
      expect(builder.single).toHaveBeenCalled();
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      const builder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(mockSupabase.from).mockReturnValue(builder as any);

      await expect(service.getById(validCommentId)).rejects.toThrow(NotFoundError);
      await expect(service.getById(validCommentId)).rejects.toThrow('Comment not found');
    });

    it('should throw AppError when database query fails', async () => {
      const dbError = new Error('Database error');
      const builder = createMockQueryBuilder({ data: null, error: dbError });
      vi.mocked(mockSupabase.from).mockReturnValue(builder as any);

      await expect(service.getById(validCommentId)).rejects.toThrow(AppError);
    });
  });
});
