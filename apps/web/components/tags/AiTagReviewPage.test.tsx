import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { AiTagReviewPage } from './AiTagReviewPage';

describe('AiTagReviewPage', () => {
  it('should render page title and description', () => {
    render(<AiTagReviewPage />);

    expect(screen.getByText('AI Tag Review')).toBeInTheDocument();
    expect(screen.getByText(/This page is under construction/i)).toBeInTheDocument();
  });
});
