import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeSearchBar } from './RecipeSearchBar';

describe('RecipeSearchBar Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<RecipeSearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i);
      expect(input).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<RecipeSearchBar value="" onChange={mockOnChange} placeholder="Find a recipe..." />);

      const input = screen.getByPlaceholderText(/find a recipe/i);
      expect(input).toBeInTheDocument();
    });

    it('should show search icon', () => {
      const { container } = render(<RecipeSearchBar value="" onChange={mockOnChange} />);

      // Search icon is rendered via MUI InputAdornment
      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<RecipeSearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i) as HTMLInputElement;
      expect(input.value).toBe('pasta');
    });
  });

  describe('User interaction', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      render(<RecipeSearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i);
      await user.type(input, 'c');

      expect(mockOnChange).toHaveBeenCalledWith('c');
    });

    it('should call onChange for each character typed', async () => {
      const user = userEvent.setup();

      // Need to simulate controlled component properly
      let currentValue = '';
      const handleChange = vi.fn((newValue: string) => {
        currentValue = newValue;
        mockOnChange(newValue);
      });

      const { rerender } = render(<RecipeSearchBar value={currentValue} onChange={handleChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i);

      // Type first character
      await user.type(input, 'c');
      rerender(<RecipeSearchBar value={currentValue} onChange={handleChange} />);

      // Type second character
      await user.type(input, 'a');
      rerender(<RecipeSearchBar value={currentValue} onChange={handleChange} />);

      // Type third character
      await user.type(input, 't');
      rerender(<RecipeSearchBar value={currentValue} onChange={handleChange} />);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'c');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'ca');
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'cat');
    });

    it('should handle clearing input', async () => {
      const user = userEvent.setup();
      render(<RecipeSearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i);
      await user.clear(input);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should handle backspace', async () => {
      const user = userEvent.setup();
      render(<RecipeSearchBar value="pasta" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i);

      // Focus and press backspace
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(mockOnChange).toHaveBeenCalledWith('past');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', async () => {
      const user = userEvent.setup();
      render(<RecipeSearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i);
      await user.click(input);

      expect(input).toHaveFocus();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<RecipeSearchBar value="" onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/search recipes/i);

      // Tab to focus
      await user.tab();
      expect(input).toHaveFocus();

      // Type
      await user.keyboard('test');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Full width layout', () => {
    it('should render as full width', () => {
      const { container } = render(<RecipeSearchBar value="" onChange={mockOnChange} />);

      const textField = container.querySelector('.MuiTextField-root');
      expect(textField).toHaveClass('MuiFormControl-fullWidth');
    });
  });
});
