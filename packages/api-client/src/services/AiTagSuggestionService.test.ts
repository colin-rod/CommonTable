import type {
  AiTagSuggestion,
  AiTagSuggestionId,
  AiTagSuggestionWithTag,
  HouseholdId,
  RecipeVersionId,
  Tag,
  TagId,
  UserId,
} from '@commontable/types';
import { NotFoundError } from '@commontable/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AiTagSuggestionService } from './AiTagSuggestionService';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
} as unknown as SupabaseClient;

describe('AiTagSuggestionService', () => {
  let service: AiTagSuggestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AiTagSuggestionService(mockSupabase);
  });

  describe('getPendingByRecipeVersion', () => {
    it('should return pending suggestions for a recipe version', async () => {
      const versionId = 'version-123' as RecipeVersionId;
      const mockTag: Tag = {
        id: 'tag-1' as TagId,
        household_id: 'household-1' as HouseholdId,
        name: 'italian',
        created_by: 'user-123' as UserId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockSuggestions: AiTagSuggestionWithTag[] = [
        {
          id: 'suggestion-1' as AiTagSuggestionId,
          recipe_version_id: versionId,
          tag_id: 'tag-1' as TagId,
          confidence_score: 0.95,
          user_accepted: null,
          accepted_at: null,
          model_version: 'gpt-4-turbo',
          created_at: new Date(),
          tag: mockTag,
        },
        {
          id: 'suggestion-2' as AiTagSuggestionId,
          recipe_version_id: versionId,
          tag_id: 'tag-2' as TagId,
          confidence_score: 0.87,
          user_accepted: null,
          accepted_at: null,
          model_version: 'gpt-4-turbo',
          created_at: new Date(),
          tag: {
            ...mockTag,
            id: 'tag-2' as TagId,
            name: 'pasta',
          },
        },
      ];

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockIsNull = vi.fn().mockResolvedValue({
        data: mockSuggestions,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        is: mockIsNull,
      } as any);

      const result = await service.getPendingByRecipeVersion(versionId);

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_tag_suggestions');
      expect(mockSelect).toHaveBeenCalledWith('*, tag:tags(*)');
      expect(mockEq).toHaveBeenCalledWith('recipe_version_id', versionId);
      expect(mockIsNull).toHaveBeenCalledWith('user_accepted', null);
      expect(result).toEqual(mockSuggestions);
    });

    it('should return empty array when no pending suggestions exist', async () => {
      const versionId = 'version-123' as RecipeVersionId;

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockIsNull = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        is: mockIsNull,
      } as any);

      const result = await service.getPendingByRecipeVersion(versionId);

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const versionId = 'version-123' as RecipeVersionId;

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockIsNull = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        is: mockIsNull,
      } as any);

      await expect(service.getPendingByRecipeVersion(versionId)).rejects.toThrow(
        'Failed to fetch pending suggestions',
      );
    });
  });

  describe('accept', () => {
    it('should mark suggestion as accepted', async () => {
      const suggestionId = 'suggestion-1' as AiTagSuggestionId;
      const now = new Date();

      const mockUpdatedSuggestion: AiTagSuggestion = {
        id: suggestionId,
        recipe_version_id: 'version-123' as RecipeVersionId,
        tag_id: 'tag-1' as TagId,
        confidence_score: 0.95,
        user_accepted: true,
        accepted_at: now,
        model_version: 'gpt-4-turbo',
        created_at: new Date(),
      };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUpdatedSuggestion,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      } as any);

      const result = await service.accept(suggestionId);

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_tag_suggestions');
      expect(mockUpdate).toHaveBeenCalledWith({
        user_accepted: true,
        accepted_at: expect.any(String), // ISO timestamp
      });
      expect(mockEq).toHaveBeenCalledWith('id', suggestionId);
      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedSuggestion);
    });

    it('should throw NotFoundError when suggestion does not exist', async () => {
      const suggestionId = 'nonexistent' as AiTagSuggestionId;

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      } as any);

      await expect(service.accept(suggestionId)).rejects.toThrow(NotFoundError);
    });

    it('should throw error when database update fails', async () => {
      const suggestionId = 'suggestion-1' as AiTagSuggestionId;

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      } as any);

      await expect(service.accept(suggestionId)).rejects.toThrow('Failed to accept suggestion');
    });
  });

  describe('reject', () => {
    it('should mark suggestion as rejected and remove tag from recipe', async () => {
      const suggestionId = 'suggestion-1' as AiTagSuggestionId;
      const now = new Date();

      const mockUpdatedSuggestion: AiTagSuggestion = {
        id: suggestionId,
        recipe_version_id: 'version-123' as RecipeVersionId,
        tag_id: 'tag-1' as TagId,
        confidence_score: 0.95,
        user_accepted: false,
        accepted_at: now,
        model_version: 'gpt-4-turbo',
        created_at: new Date(),
      };

      // Mock update suggestion
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUpdatedSuggestion,
        error: null,
      });

      // Mock delete from recipe_version_tags
      const mockDelete = vi.fn().mockReturnThis();
      const mockEqDelete1 = vi.fn().mockReturnThis();
      const mockEqDelete2 = vi.fn().mockResolvedValue({
        error: null,
      });

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce({
          update: mockUpdate,
          eq: mockEq,
          select: mockSelect,
          single: mockSingle,
        } as any)
        .mockReturnValueOnce({
          delete: mockDelete,
          eq: mockEqDelete1.mockReturnValueOnce({
            eq: mockEqDelete2,
          } as any),
        } as any);

      const result = await service.reject(suggestionId);

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_tag_suggestions');
      expect(mockUpdate).toHaveBeenCalledWith({
        user_accepted: false,
        accepted_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('id', suggestionId);

      // Verify tag removal
      expect(mockSupabase.from).toHaveBeenCalledWith('recipe_version_tags');
      expect(mockDelete).toHaveBeenCalled();

      expect(result).toEqual(mockUpdatedSuggestion);
    });

    it('should throw NotFoundError when suggestion does not exist', async () => {
      const suggestionId = 'nonexistent' as AiTagSuggestionId;

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      } as any);

      await expect(service.reject(suggestionId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('acceptAllForRecipeVersion', () => {
    it('should mark all pending suggestions as accepted', async () => {
      const versionId = 'version-123' as RecipeVersionId;

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockIsNull = vi.fn().mockResolvedValue({
        error: null,
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        is: mockIsNull,
      } as any);

      await service.acceptAllForRecipeVersion(versionId);

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_tag_suggestions');
      expect(mockUpdate).toHaveBeenCalledWith({
        user_accepted: true,
        accepted_at: expect.any(String),
      });
      expect(mockEq).toHaveBeenCalledWith('recipe_version_id', versionId);
      expect(mockIsNull).toHaveBeenCalledWith('user_accepted', null);
    });

    it('should throw error when database update fails', async () => {
      const versionId = 'version-123' as RecipeVersionId;

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockIsNull = vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      });

      vi.mocked(mockSupabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        is: mockIsNull,
      } as any);

      await expect(service.acceptAllForRecipeVersion(versionId)).rejects.toThrow(
        'Failed to accept all suggestions',
      );
    });
  });
});
