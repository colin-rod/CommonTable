import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StepList } from './StepList';

describe('StepList Component', () => {
  describe('Rendering', () => {
    it('should render empty state when no steps provided', () => {
      render(<StepList steps={[]} />);

      expect(screen.getByText(/no steps listed/i)).toBeInTheDocument();
    });

    it('should render list of steps with numbers', () => {
      const steps = [
        { position: 1, text: 'Preheat oven to 350°F' },
        { position: 2, text: 'Mix ingredients' },
        { position: 3, text: 'Bake for 30 minutes' },
      ];

      render(<StepList steps={steps} />);

      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('Preheat oven to 350°F')).toBeInTheDocument();

      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('Mix ingredients')).toBeInTheDocument();

      expect(screen.getByText('3.')).toBeInTheDocument();
      expect(screen.getByText('Bake for 30 minutes')).toBeInTheDocument();
    });

    it('should sort steps by position', () => {
      const steps = [
        { position: 3, text: 'Third step' },
        { position: 1, text: 'First step' },
        { position: 2, text: 'Second step' },
      ];

      render(<StepList steps={steps} />);

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      // Check that steps are in correct order
      expect(listItems[0]).toHaveTextContent('1.');
      expect(listItems[0]).toHaveTextContent('First step');

      expect(listItems[1]).toHaveTextContent('2.');
      expect(listItems[1]).toHaveTextContent('Second step');

      expect(listItems[2]).toHaveTextContent('3.');
      expect(listItems[2]).toHaveTextContent('Third step');
    });

    it('should handle single step', () => {
      const steps = [{ position: 1, text: 'Only step' }];

      render(<StepList steps={steps} />);

      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('Only step')).toBeInTheDocument();
    });

    it('should preserve whitespace in step text', () => {
      const steps = [
        {
          position: 1,
          text: 'Line 1\nLine 2\nLine 3',
        },
      ];

      render(<StepList steps={steps} />);

      // Check that multiline text is rendered in the ListItemText
      // Use getAllByText since there may be multiple elements
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent === 'Line 1\nLine 2\nLine 3';
      });

      // Should find at least one element with the text
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
