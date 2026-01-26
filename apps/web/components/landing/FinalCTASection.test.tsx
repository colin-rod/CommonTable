import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { FinalCTASection } from './FinalCTASection';

describe('FinalCTASection', () => {
  it('renders the headline', () => {
    render(<FinalCTASection />);
    expect(screen.getByText('Ready to get started?')).toBeInTheDocument();
  });

  it('renders the body text', () => {
    render(<FinalCTASection />);
    expect(screen.getByText('Create your household recipe book in minutes.')).toBeInTheDocument();
  });

  it('renders the "Sign up for free" button', () => {
    render(<FinalCTASection />);
    const button = screen.getByRole('link', { name: /sign up for free/i });
    expect(button).toBeInTheDocument();
  });

  it('"Sign up for free" button has correct href', () => {
    render(<FinalCTASection />);
    const button = screen.getByRole('link', { name: /sign up for free/i });
    expect(button).toHaveAttribute('href', '/auth/signup');
  });

  it('renders the "Log in" link', () => {
    render(<FinalCTASection />);
    const link = screen.getByRole('link', { name: /log in to your account/i });
    expect(link).toBeInTheDocument();
  });

  it('"Log in" link has correct href', () => {
    render(<FinalCTASection />);
    const link = screen.getByRole('link', { name: /log in to your account/i });
    expect(link).toHaveAttribute('href', '/auth/login');
  });
});
