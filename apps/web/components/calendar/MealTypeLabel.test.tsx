import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { MealTypeLabel } from './MealTypeLabel';

describe('MealTypeLabel', () => {
  it('should render breakfast label', () => {
    render(<MealTypeLabel mealSlot="breakfast" />);

    expect(screen.getByText('Breakfast')).toBeInTheDocument();
  });

  it('should render lunch label', () => {
    render(<MealTypeLabel mealSlot="lunch" />);

    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  it('should render dinner label', () => {
    render(<MealTypeLabel mealSlot="dinner" />);

    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('should render snack label', () => {
    render(<MealTypeLabel mealSlot="snack" />);

    expect(screen.getByText('Snack')).toBeInTheDocument();
  });

  it('should have correct styling', () => {
    const { container } = render(<MealTypeLabel mealSlot="breakfast" />);

    const labelBox = container.firstChild as HTMLElement;

    // Should have display: flex
    expect(labelBox).toHaveStyle({ display: 'flex' });
  });
});
