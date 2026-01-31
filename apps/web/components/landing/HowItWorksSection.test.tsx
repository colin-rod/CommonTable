import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { HowItWorksSection } from './HowItWorksSection';

describe('HowItWorksSection', () => {
  it('renders the section header', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('How it works')).toBeInTheDocument();
  });

  it('renders three list items', () => {
    const { container } = render(<HowItWorksSection />);
    const listItems = container.querySelectorAll('.MuiListItem-root');
    expect(listItems).toHaveLength(3);
  });

  it('renders step 1', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('1. Create your household')).toBeInTheDocument();
    expect(screen.getByText('Sign up and invite family members or roommates.')).toBeInTheDocument();
  });

  it('renders step 2', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('2. Add your recipes')).toBeInTheDocument();
    expect(
      screen.getByText('Import from URLs or add manually. Tag and organize.'),
    ).toBeInTheDocument();
  });

  it('renders step 3', () => {
    render(<HowItWorksSection />);
    expect(screen.getByText('3. Plan together')).toBeInTheDocument();
    expect(
      screen.getByText('Add recipes to your calendar and review meal requests.'),
    ).toBeInTheDocument();
  });
});
