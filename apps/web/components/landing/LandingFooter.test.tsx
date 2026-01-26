import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { LandingFooter } from './LandingFooter';

describe('LandingFooter', () => {
  it('renders Privacy Policy link', () => {
    render(<LandingFooter />);
    const link = screen.getByRole('link', { name: /privacy policy/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/privacy');
  });

  it('renders Terms of Service link', () => {
    render(<LandingFooter />);
    const link = screen.getByRole('link', { name: /terms of service/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/terms');
  });

  it('renders Support link', () => {
    render(<LandingFooter />);
    const link = screen.getByRole('link', { name: /support/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'mailto:support@commontable.app');
  });

  it('renders copyright notice', () => {
    render(<LandingFooter />);
    expect(screen.getByText(/© 2026 CommonTable. All rights reserved./)).toBeInTheDocument();
  });
});
