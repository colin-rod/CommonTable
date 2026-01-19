import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ServingsScaler } from './ServingsScaler';

describe('ServingsScaler Component', () => {
  const mockOnServingsChange = vi.fn();
  const mockOnUnitSystemChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render servings controls', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      expect(screen.getByText('servings')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should render unit system toggle', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      expect(screen.getByText('Units:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /imperial/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /metric/i })).toBeInTheDocument();
    });

    it('should render quick scale buttons', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      expect(screen.getByRole('button', { name: /0\.5x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /1x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2x/i })).toBeInTheDocument();
    });

    it('should not render reset button when not scaled', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    });

    it('should render reset button when scaled', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={8}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });

  describe('Servings increment/decrement', () => {
    it('should increment servings on "+" click', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const incrementButton = screen.getByLabelText(/increase servings/i);
      await user.click(incrementButton);

      expect(mockOnServingsChange).toHaveBeenCalledWith(5);
    });

    it('should decrement servings on "-" click', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const decrementButton = screen.getByLabelText(/decrease servings/i);
      await user.click(decrementButton);

      expect(mockOnServingsChange).toHaveBeenCalledWith(3);
    });

    it('should not go below 1 serving', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={1}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const decrementButton = screen.getByLabelText(/decrease servings/i);

      // Button is disabled at 1 serving, cannot be clicked
      expect(decrementButton).toBeDisabled();
      expect(mockOnServingsChange).not.toHaveBeenCalled();
    });
  });

  describe('Manual servings input', () => {
    it('should allow manual servings input', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      // Click the servings number to start editing
      const servingsButton = screen.getByRole('button', { name: '4' });
      await user.click(servingsButton);

      // TextField should appear
      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();

      // Type new value
      await user.clear(input);
      await user.type(input, '8');

      // Blur to commit
      await user.tab();

      await waitFor(() => {
        expect(mockOnServingsChange).toHaveBeenCalledWith(8);
      });
    });

    it('should validate manual input (positive integers only)', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const servingsButton = screen.getByRole('button', { name: '4' });
      await user.click(servingsButton);

      const input = screen.getByRole('spinbutton');

      // Invalid input: negative
      await user.clear(input);
      await user.type(input, '-5');
      await user.tab();

      // Should not call onServingsChange with invalid value
      await waitFor(() => {
        expect(mockOnServingsChange).not.toHaveBeenCalledWith(-5);
      });
    });

    it('should reset input value if invalid on blur', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const servingsButton = screen.getByRole('button', { name: '4' });
      await user.click(servingsButton);

      const input = screen.getByRole('spinbutton') as HTMLInputElement;

      await user.clear(input);
      await user.type(input, 'abc');
      await user.tab();

      // Input should disappear (exit editing mode)
      await waitFor(() => {
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      });

      // Should show original value button again
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    });

    it('should commit on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const servingsButton = screen.getByRole('button', { name: '4' });
      await user.click(servingsButton);

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '6{Enter}');

      await waitFor(() => {
        expect(mockOnServingsChange).toHaveBeenCalledWith(6);
      });
    });

    it('should cancel on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const servingsButton = screen.getByRole('button', { name: '4' });
      await user.click(servingsButton);

      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '10{Escape}');

      // Input should disappear
      await waitFor(() => {
        expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      });

      // Should not call onServingsChange
      expect(mockOnServingsChange).not.toHaveBeenCalled();

      // Should show original value
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    });
  });

  describe('Quick scale buttons', () => {
    it('should scale to 0.5x', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const halfButton = screen.getByRole('button', { name: /0\.5x/i });
      await user.click(halfButton);

      expect(mockOnServingsChange).toHaveBeenCalledWith(2);
    });

    it('should scale to 1x (reset)', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={8}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const oneXButton = screen.getByRole('button', { name: /1x/i });
      await user.click(oneXButton);

      expect(mockOnServingsChange).toHaveBeenCalledWith(4);
    });

    it('should scale to 2x', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const doubleButton = screen.getByRole('button', { name: /2x/i });
      await user.click(doubleButton);

      expect(mockOnServingsChange).toHaveBeenCalledWith(8);
    });

    it('should disable 1x button when not scaled', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const oneXButton = screen.getByRole('button', { name: /1x/i });
      expect(oneXButton).toBeDisabled();
    });

    it('should not go below 1 serving when scaling', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={1}
          targetServings={1}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const halfButton = screen.getByRole('button', { name: /0\.5x/i });
      await user.click(halfButton);

      // Should call with 1 (minimum), not 0
      expect(mockOnServingsChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Reset button', () => {
    it('should reset to original servings', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={8}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(mockOnServingsChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Unit system toggle', () => {
    it('should switch to imperial when imperial button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="metric"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const imperialButton = screen.getByRole('button', { name: /imperial/i });
      await user.click(imperialButton);

      expect(mockOnUnitSystemChange).toHaveBeenCalledWith('imperial');
    });

    it('should switch to metric when metric button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const metricButton = screen.getByRole('button', { name: /metric/i });
      await user.click(metricButton);

      expect(mockOnUnitSystemChange).toHaveBeenCalledWith('metric');
    });

    it('should show imperial button as contained when imperial selected', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="imperial"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const imperialButton = screen.getByRole('button', { name: /imperial/i });
      expect(imperialButton).toHaveClass('MuiButton-contained');
    });

    it('should show metric button as contained when metric selected', () => {
      render(
        <ServingsScaler
          originalServings={4}
          targetServings={4}
          onServingsChange={mockOnServingsChange}
          unitSystem="metric"
          onUnitSystemChange={mockOnUnitSystemChange}
        />,
      );

      const metricButton = screen.getByRole('button', { name: /metric/i });
      expect(metricButton).toHaveClass('MuiButton-contained');
    });
  });
});
