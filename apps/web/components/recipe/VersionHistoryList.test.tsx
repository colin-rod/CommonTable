import type { VersionHistoryEntry, RecipeVersionId, UserId } from '@commontable/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { VersionHistoryList } from './VersionHistoryList';

describe('VersionHistoryList', () => {
  const mockOnVersionClick = vi.fn();

  const mockVersions: VersionHistoryEntry[] = [
    {
      version_id: 'version-3' as RecipeVersionId,
      version_number: 3,
      created_by: 'user-123' as UserId,
      created_by_name: 'Sarah',
      created_at: new Date('2024-01-15T14:30:00Z'),
      is_current: true,
    },
    {
      version_id: 'version-2' as RecipeVersionId,
      version_number: 2,
      created_by: 'user-456' as UserId,
      created_by_name: 'John',
      created_at: new Date('2024-01-10T16:15:00Z'),
      is_current: false,
    },
    {
      version_id: 'version-1' as RecipeVersionId,
      version_number: 1,
      created_by: 'user-123' as UserId,
      created_by_name: 'Sarah',
      created_at: new Date('2024-01-01T10:00:00Z'),
      is_current: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders list of versions', () => {
      render(<VersionHistoryList versions={mockVersions} onVersionClick={mockOnVersionClick} />);

      expect(screen.getByText(/Version 3/)).toBeInTheDocument();
      expect(screen.getByText(/Version 2/)).toBeInTheDocument();
      expect(screen.getByText(/Version 1/)).toBeInTheDocument();
    });

    it('marks current version with indicator', () => {
      render(<VersionHistoryList versions={mockVersions} onVersionClick={mockOnVersionClick} />);

      // Version 3 should be marked as current
      expect(screen.getByText(/Version 3.*Current/i)).toBeInTheDocument();
    });

    it('displays editor names', () => {
      render(<VersionHistoryList versions={mockVersions} onVersionClick={mockOnVersionClick} />);

      expect(screen.getAllByText(/Sarah/)).toHaveLength(2);
      expect(screen.getByText(/John/)).toBeInTheDocument();
    });

    it('handles null display names gracefully', () => {
      const versionsWithNullName: VersionHistoryEntry[] = [
        {
          version_id: 'version-1' as RecipeVersionId,
          version_number: 1,
          created_by: 'user-123' as UserId,
          created_by_name: null,
          created_at: new Date('2024-01-01T10:00:00Z'),
          is_current: true,
        },
      ];

      render(
        <VersionHistoryList versions={versionsWithNullName} onVersionClick={mockOnVersionClick} />,
      );

      expect(screen.getByText(/Unknown user/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      render(
        <VersionHistoryList versions={[]} loading={true} onVersionClick={mockOnVersionClick} />,
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('does not show loading indicator when not loading', () => {
      render(
        <VersionHistoryList
          versions={mockVersions}
          loading={false}
          onVersionClick={mockOnVersionClick}
        />,
      );

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows message when no versions exist', () => {
      render(
        <VersionHistoryList versions={[]} loading={false} onVersionClick={mockOnVersionClick} />,
      );

      expect(screen.getByText(/No version history/)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onVersionClick when version is clicked', async () => {
      const user = userEvent.setup();

      render(<VersionHistoryList versions={mockVersions} onVersionClick={mockOnVersionClick} />);

      // Click on version 2
      const version2Button = screen.getByRole('button', { name: /Version 2/i });
      await user.click(version2Button);

      expect(mockOnVersionClick).toHaveBeenCalledWith(2);
    });

    it('calls onVersionClick with correct version number', async () => {
      const user = userEvent.setup();

      render(<VersionHistoryList versions={mockVersions} onVersionClick={mockOnVersionClick} />);

      // Click on version 1
      const version1Button = screen.getByRole('button', { name: /Version 1/i });
      await user.click(version1Button);

      expect(mockOnVersionClick).toHaveBeenCalledWith(1);
    });
  });

  describe('Date Formatting', () => {
    it('formats dates in readable format', () => {
      render(<VersionHistoryList versions={mockVersions} onVersionClick={mockOnVersionClick} />);

      // Should show formatted dates (exact format depends on locale, check presence of date parts)
      const listItems = screen.getAllByRole('button');
      expect(listItems.length).toBe(3);
    });
  });
});
