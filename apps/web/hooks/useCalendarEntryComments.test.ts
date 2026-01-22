import { CalendarEntryCommentService } from '@commontable/api-client';
import type {
  CalendarEntryComment,
  CalendarEntryCommentId,
  CalendarEntryId,
  HouseholdId,
  UserId,
  CreateCalendarEntryCommentInput,
} from '@commontable/types';
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useCalendarEntryComments } from './useCalendarEntryComments';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

// Mock CalendarEntryCommentService
vi.mock('@commontable/api-client', () => ({
  CalendarEntryCommentService: vi.fn(),
}));

describe('useCalendarEntryComments Hook', () => {
  const mockCalendarEntryId = 'calendar-entry-123' as CalendarEntryId;
  const mockHouseholdId = 'household-123' as HouseholdId;
  const mockUserId = 'user-123' as UserId;

  const mockComments: CalendarEntryComment[] = [
    {
      id: 'comment-1' as CalendarEntryCommentId,
      calendar_entry_id: mockCalendarEntryId,
      household_id: mockHouseholdId,
      comment_text: 'First comment',
      created_by: mockUserId,
      created_at: new Date('2026-01-20T10:00:00Z'),
    },
    {
      id: 'comment-2' as CalendarEntryCommentId,
      calendar_entry_id: mockCalendarEntryId,
      household_id: mockHouseholdId,
      comment_text: 'Second comment',
      created_by: mockUserId,
      created_at: new Date('2026-01-20T11:00:00Z'),
    },
  ];

  const mockCommentService = {
    getByCalendarEntryId: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CalendarEntryCommentService).mockImplementation(() => mockCommentService as any);
  });

  describe('Loading comments on mount', () => {
    it('should load comments on mount', async () => {
      mockCommentService.getByCalendarEntryId.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useCalendarEntryComments(mockCalendarEntryId));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.comments).toEqual([]);
      expect(result.current.error).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual(mockComments);
      expect(result.current.error).toBeNull();
      expect(mockCommentService.getByCalendarEntryId).toHaveBeenCalledWith(mockCalendarEntryId);
      expect(mockCommentService.getByCalendarEntryId).toHaveBeenCalledTimes(1);
    });

    it('should handle empty comments list', async () => {
      mockCommentService.getByCalendarEntryId.mockResolvedValue([]);

      const { result } = renderHook(() => useCalendarEntryComments(mockCalendarEntryId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when loading comments', async () => {
      const error = new Error('Failed to fetch comments');
      mockCommentService.getByCalendarEntryId.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarEntryComments(mockCalendarEntryId));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual([]);
      expect(result.current.error).toEqual(error);
    });
  });

  describe('Refetching comments when calendarEntryId changes', () => {
    it('should refetch comments when calendarEntryId changes', async () => {
      const secondCalendarEntryId = 'calendar-entry-456' as CalendarEntryId;
      const secondComments: CalendarEntryComment[] = [
        {
          id: 'comment-3' as CalendarEntryCommentId,
          calendar_entry_id: secondCalendarEntryId,
          household_id: mockHouseholdId,
          comment_text: 'Third comment',
          created_by: mockUserId,
          created_at: new Date('2026-01-21T10:00:00Z'),
        },
      ];

      mockCommentService.getByCalendarEntryId
        .mockResolvedValueOnce(mockComments)
        .mockResolvedValueOnce(secondComments);

      const { result, rerender } = renderHook(
        ({ calendarEntryId }) => useCalendarEntryComments(calendarEntryId),
        {
          initialProps: { calendarEntryId: mockCalendarEntryId },
        },
      );

      // Wait for first load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual(mockComments);

      // Change calendarEntryId
      rerender({ calendarEntryId: secondCalendarEntryId });

      // Should show loading again
      expect(result.current.loading).toBe(true);

      // Wait for second load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toEqual(secondComments);
      expect(mockCommentService.getByCalendarEntryId).toHaveBeenCalledWith(secondCalendarEntryId);
      expect(mockCommentService.getByCalendarEntryId).toHaveBeenCalledTimes(2);
    });
  });

  describe('Adding comments', () => {
    it('should add comment optimistically', async () => {
      mockCommentService.getByCalendarEntryId.mockResolvedValue(mockComments);

      const newComment: CalendarEntryComment = {
        id: 'comment-3' as CalendarEntryCommentId,
        calendar_entry_id: mockCalendarEntryId,
        household_id: mockHouseholdId,
        comment_text: 'New comment',
        created_by: mockUserId,
        created_at: new Date('2026-01-21T12:00:00Z'),
      };

      mockCommentService.create.mockResolvedValue(newComment);

      const { result } = renderHook(() => useCalendarEntryComments(mockCalendarEntryId));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(2);

      // Add comment
      const input: CreateCalendarEntryCommentInput = {
        calendar_entry_id: mockCalendarEntryId,
        comment_text: 'New comment',
      };

      await act(async () => {
        await result.current.addComment(input);
      });

      // Comment should be added to state
      expect(result.current.comments).toHaveLength(3);
      expect(result.current.comments[2]).toEqual(newComment);
      expect(mockCommentService.create).toHaveBeenCalledWith(input);
    });

    it('should handle errors when adding comment', async () => {
      mockCommentService.getByCalendarEntryId.mockResolvedValue(mockComments);
      const error = new Error('Failed to create comment');
      mockCommentService.create.mockRejectedValue(error);

      const { result } = renderHook(() => useCalendarEntryComments(mockCalendarEntryId));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const input: CreateCalendarEntryCommentInput = {
        calendar_entry_id: mockCalendarEntryId,
        comment_text: 'New comment',
      };

      // Adding comment should throw error
      await expect(
        act(async () => {
          await result.current.addComment(input);
        }),
      ).rejects.toThrow(error);

      // Comments should remain unchanged
      expect(result.current.comments).toHaveLength(2);
    });
  });

  describe('Refetch functionality', () => {
    it('should refetch comments when refetch is called', async () => {
      const updatedComments: CalendarEntryComment[] = [
        ...mockComments,
        {
          id: 'comment-3' as CalendarEntryCommentId,
          calendar_entry_id: mockCalendarEntryId,
          household_id: mockHouseholdId,
          comment_text: 'Third comment',
          created_by: mockUserId,
          created_at: new Date('2026-01-21T10:00:00Z'),
        },
      ];

      mockCommentService.getByCalendarEntryId
        .mockResolvedValueOnce(mockComments)
        .mockResolvedValueOnce(updatedComments);

      const { result } = renderHook(() => useCalendarEntryComments(mockCalendarEntryId));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.comments).toHaveLength(2);

      // Call refetch
      await act(async () => {
        await result.current.refetch();
      });

      // Should have updated comments
      expect(result.current.comments).toHaveLength(3);
      expect(mockCommentService.getByCalendarEntryId).toHaveBeenCalledTimes(2);
    });
  });
});
