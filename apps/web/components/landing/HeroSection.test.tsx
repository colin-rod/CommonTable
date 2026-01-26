import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { HeroSection } from './HeroSection';

describe('HeroSection', () => {
  it('renders the headline', () => {
    render(<HeroSection />);
    expect(screen.getByText('A shared recipe book for your household')).toBeInTheDocument();
  });

  it('renders the subheadline', () => {
    render(<HeroSection />);
    expect(
      screen.getByText(
        /Plan meals, improve recipes over time, and preserve what your family loves to cook/,
      ),
    ).toBeInTheDocument();
  });

  it('renders the "Get started" button', () => {
    render(<HeroSection />);
    const button = screen.getByRole('link', { name: /get started/i });
    expect(button).toBeInTheDocument();
  });

  it('"Get started" button has correct href', () => {
    render(<HeroSection />);
    const button = screen.getByRole('link', { name: /get started/i });
    expect(button).toHaveAttribute('href', '/auth/signup');
  });

  it('renders the "Log in" link', () => {
    render(<HeroSection />);
    const link = screen.getByRole('link', { name: /log in/i });
    expect(link).toBeInTheDocument();
  });

  it('"Log in" link has correct href', () => {
    render(<HeroSection />);
    const link = screen.getByRole('link', { name: /log in/i });
    expect(link).toHaveAttribute('href', '/auth/login');
  });

  it('renders with centered text alignment', () => {
    const { container } = render(<HeroSection />);
    const stack = container.firstChild;
    expect(stack).toHaveStyle({ textAlign: 'center' });
  });
});
