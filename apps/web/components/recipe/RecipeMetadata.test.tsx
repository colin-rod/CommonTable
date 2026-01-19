import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RecipeMetadata } from './RecipeMetadata';

describe('RecipeMetadata Component', () => {
  describe('Servings', () => {
    it('should render servings when provided', () => {
      render(<RecipeMetadata servings={4} tags={[]} />);

      expect(screen.getByText(/4 servings/i)).toBeInTheDocument();
    });

    it('should not render servings when not provided', () => {
      render(<RecipeMetadata tags={[]} />);

      expect(screen.queryByText(/servings/i)).not.toBeInTheDocument();
    });
  });

  describe('Time display', () => {
    it('should render prep time only', () => {
      render(<RecipeMetadata prepTimeMinutes={30} tags={[]} />);

      expect(screen.getByText(/30 min prep/i)).toBeInTheDocument();
    });

    it('should render cook time only', () => {
      render(<RecipeMetadata cookTimeMinutes={45} tags={[]} />);

      expect(screen.getByText(/45 min cook/i)).toBeInTheDocument();
    });

    it('should render both prep and cook time with total', () => {
      render(<RecipeMetadata prepTimeMinutes={15} cookTimeMinutes={30} tags={[]} />);

      expect(screen.getByText(/15 min prep \+ 30 min cook \(45 min total\)/i)).toBeInTheDocument();
    });

    it('should format time in hours and minutes when >= 60 minutes', () => {
      render(<RecipeMetadata prepTimeMinutes={90} tags={[]} />);

      expect(screen.getByText(/1 hr 30 min prep/i)).toBeInTheDocument();
    });

    it('should format time in hours only when exact hour', () => {
      render(<RecipeMetadata cookTimeMinutes={120} tags={[]} />);

      expect(screen.getByText(/2 hr cook/i)).toBeInTheDocument();
    });

    it('should not render time section when no times provided', () => {
      render(<RecipeMetadata tags={[]} />);

      // More specific regex to avoid matching "Last cooked"
      expect(screen.queryByText(/prep time/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\d+ min cook/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/\d+ hr cook/i)).not.toBeInTheDocument();
    });
  });

  describe('Rating', () => {
    it('should render rating when provided', () => {
      render(<RecipeMetadata rollingScore={4.5} tags={[]} />);

      expect(screen.getByText(/4.5 rating/i)).toBeInTheDocument();
    });

    it('should format rating to 1 decimal place', () => {
      render(<RecipeMetadata rollingScore={3.456} tags={[]} />);

      expect(screen.getByText(/3.5 rating/i)).toBeInTheDocument();
    });

    it('should not render rating when not provided', () => {
      render(<RecipeMetadata tags={[]} />);

      expect(screen.queryByText(/rating/i)).not.toBeInTheDocument();
    });

    it('should not render rating when null', () => {
      render(<RecipeMetadata rollingScore={null} tags={[]} />);

      expect(screen.queryByText(/rating/i)).not.toBeInTheDocument();
    });
  });

  describe('Last cooked', () => {
    it('should render formatted date when lastCookedAt provided', () => {
      const date = new Date('2024-01-15');
      render(<RecipeMetadata lastCookedAt={date} tags={[]} />);

      expect(screen.getByText(/Last cooked:/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/i)).toBeInTheDocument();
    });

    it('should render "Never cooked" when lastCookedAt is null', () => {
      render(<RecipeMetadata lastCookedAt={null} tags={[]} />);

      expect(screen.getByText(/Last cooked: Never cooked/i)).toBeInTheDocument();
    });

    it('should render "Never cooked" when lastCookedAt not provided', () => {
      render(<RecipeMetadata tags={[]} />);

      expect(screen.getByText(/Last cooked: Never cooked/i)).toBeInTheDocument();
    });
  });

  describe('Tags', () => {
    it('should render tags when provided', () => {
      const tags = ['vegetarian', 'quick', 'healthy'];
      render(<RecipeMetadata tags={tags} />);

      expect(screen.getByText('vegetarian')).toBeInTheDocument();
      expect(screen.getByText('quick')).toBeInTheDocument();
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    it('should not render tags section when empty array', () => {
      render(<RecipeMetadata tags={[]} />);

      // Tags should not be visible since array is empty
      const chips = screen.queryAllByRole('button'); // Chips have button role
      expect(chips.filter((chip) => chip.textContent !== '')).toHaveLength(0);
    });

    it('should render single tag', () => {
      render(<RecipeMetadata tags={['dessert']} />);

      expect(screen.getByText('dessert')).toBeInTheDocument();
    });
  });

  describe('Complete metadata', () => {
    it('should render all metadata when fully populated', () => {
      const date = new Date('2024-03-01');
      render(
        <RecipeMetadata
          servings={6}
          prepTimeMinutes={20}
          cookTimeMinutes={40}
          rollingScore={4.8}
          lastCookedAt={date}
          tags={['dinner', 'italian']}
        />,
      );

      expect(screen.getByText(/6 servings/i)).toBeInTheDocument();
      expect(screen.getByText(/20 min prep/i)).toBeInTheDocument();
      expect(screen.getByText(/40 min cook/i)).toBeInTheDocument();
      expect(screen.getByText(/4.8 rating/i)).toBeInTheDocument();
      expect(screen.getByText(/Mar 1, 2024/i)).toBeInTheDocument();
      expect(screen.getByText('dinner')).toBeInTheDocument();
      expect(screen.getByText('italian')).toBeInTheDocument();
    });
  });
});
