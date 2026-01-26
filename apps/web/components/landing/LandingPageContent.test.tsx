import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { LandingPageContent } from './LandingPageContent';

describe('LandingPageContent', () => {
  it('renders all sections', () => {
    render(<LandingPageContent />);

    // HeroSection
    expect(screen.getByText('A shared recipe book for your household')).toBeInTheDocument();

    // FeaturesSection
    expect(screen.getByText('What you can do')).toBeInTheDocument();
    expect(screen.getByText('Organize your recipes')).toBeInTheDocument();

    // HowItWorksSection
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('1. Create your household')).toBeInTheDocument();

    // FinalCTASection
    expect(screen.getByText('Ready to get started?')).toBeInTheDocument();

    // LandingFooter
    expect(screen.getByText(/© 2026 CommonTable/)).toBeInTheDocument();
  });

  it('uses Container with maxWidth md', () => {
    const { container } = render(<LandingPageContent />);
    const containerEl = container.querySelector('.MuiContainer-maxWidthMd');
    expect(containerEl).toBeInTheDocument();
  });

  it('renders sections in correct order', () => {
    render(<LandingPageContent />);

    const sections = screen.getAllByRole('heading');
    const headings = sections.map((section) => section.textContent);

    // Should contain headings in order: hero, features, how it works, final CTA
    expect(headings).toContain('A shared recipe book for your household');
    expect(headings).toContain('What you can do');
    expect(headings).toContain('How it works');
    expect(headings).toContain('Ready to get started?');
  });
});
