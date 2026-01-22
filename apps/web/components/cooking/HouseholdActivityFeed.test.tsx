import type {
  CookingEventWithRecipeAndProfile,
  CookingEventId,
  RecipeId,
  RecipeVersionId,
  HouseholdId,
  UserId,
} from '@commontable/types';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { HouseholdActivityFeed } from './HouseholdActivityFeed';

const mockCookingEventId = '00000000-0000-0000-0000-000000000001' as CookingEventId;
const mockRecipeId = '00000000-0000-0000-0000-000000000002' as RecipeId;
const mockRecipeVersionId = '00000000-0000-0000-0000-000000000003' as RecipeVersionId;
const mockHouseholdId = '00000000-0000-0000-0000-000000000004' as HouseholdId;
const mockUserId = '00000000-0000-0000-0000-000000000005' as UserId;

const mockEvents: CookingEventWithRecipeAndProfile[] = [
  {
    id: mockCookingEventId,
    recipe_id: mockRecipeId,
    recipe_version_id: mockRecipeVersionId,
    household_id: mockHouseholdId,
    cooked_at: new Date('2026-01-22T10:00:00Z'),
    servings_made: 4,
    rating: 5,
    notes: null,
    cooked_by: mockUserId,
    recipe_title: 'Pasta Carbonara',
    cooked_by_name: 'John Doe',
  },
  {
    id: '00000000-0000-0000-0000-000000000006' as CookingEventId,
    recipe_id: '00000000-0000-0000-0000-000000000007' as RecipeId,
    recipe_version_id: '00000000-0000-0000-0000-000000000008' as RecipeVersionId,
    household_id: mockHouseholdId,
    cooked_at: new Date('2026-01-20T15:00:00Z'),
    servings_made: 2,
    rating: 4,
    notes: 'Delicious!',
    cooked_by: mockUserId,
    recipe_title: 'Chocolate Chip Cookies',
    cooked_by_name: 'Jane Smith',
  },
];

describe('HouseholdActivityFeed', () => {
  it('should render list of cooking events with recipe titles', () => {
    render(<HouseholdActivityFeed events={mockEvents} />);

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument();
  });

  it('should show star ratings for each event', () => {
    render(<HouseholdActivityFeed events={mockEvents} />);

    // First event has 5 stars
    const ratings = screen.getAllByRole('img', { name: /rated/i });
    expect(ratings).toHaveLength(2);
  });

  it('should format dates relatively', () => {
    render(<HouseholdActivityFeed events={mockEvents} />);

    // Dates should be formatted with formatRelativeDate
    // Exact text depends on current time, so we just verify dates are rendered
    const dateTexts = screen.getAllByText(/cooked/i);
    expect(dateTexts.length).toBeGreaterThan(0);
  });

  it('should show empty state when events array is empty', () => {
    render(<HouseholdActivityFeed events={[]} />);

    expect(screen.getByText('No cooking history yet')).toBeInTheDocument();
  });

  it('should show loading state when loading prop is true', () => {
    render(<HouseholdActivityFeed events={[]} loading />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render semantic List structure', () => {
    render(<HouseholdActivityFeed events={mockEvents} />);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('should have accessible aria-labels on Rating components', () => {
    render(<HouseholdActivityFeed events={mockEvents} />);

    // Rating components should have aria-label like "Rated 5 out of 5 stars"
    const ratings = screen.getAllByRole('img', { name: /rated.*out of 5 stars/i });
    expect(ratings.length).toBeGreaterThan(0);
  });
});
