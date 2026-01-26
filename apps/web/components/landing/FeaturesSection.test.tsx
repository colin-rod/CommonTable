import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { FeaturesSection } from './FeaturesSection';

describe('FeaturesSection', () => {
  it('renders the section header', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('What you can do')).toBeInTheDocument();
  });

  it('renders three feature cards', () => {
    const { container } = render(<FeaturesSection />);
    const cards = container.querySelectorAll('.MuiCard-root');
    expect(cards).toHaveLength(3);
  });

  it('renders "Organize your recipes" feature', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Organize your recipes')).toBeInTheDocument();
    expect(
      screen.getByText(/Store recipes with ingredients, steps, and notes/),
    ).toBeInTheDocument();
  });

  it('renders "Plan your meals" feature', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Plan your meals')).toBeInTheDocument();
    expect(screen.getByText(/Add recipes to your weekly calendar/)).toBeInTheDocument();
  });

  it('renders "Manage meal requests" feature', () => {
    render(<FeaturesSection />);
    expect(screen.getByText('Manage meal requests')).toBeInTheDocument();
    expect(screen.getByText(/Family members request meals/)).toBeInTheDocument();
  });

  it('feature cards have elevation of 1', () => {
    const { container } = render(<FeaturesSection />);
    const cards = container.querySelectorAll('.MuiCard-root');
    cards.forEach((card) => {
      expect(card).toHaveClass('MuiPaper-elevation1');
    });
  });
});
