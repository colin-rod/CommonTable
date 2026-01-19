import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { IngredientList } from './IngredientList';

describe('IngredientList Component', () => {
  describe('Rendering', () => {
    it('should render empty state when no ingredients provided', () => {
      render(<IngredientList ingredients={[]} />);

      expect(screen.getByText(/no ingredients listed/i)).toBeInTheDocument();
    });

    it('should render ingredient with quantity and unit', () => {
      const ingredients = [{ name: 'flour', quantity: 2, unit: 'cups' }];

      render(<IngredientList ingredients={ingredients} />);

      expect(screen.getByText(/2 cups flour/i)).toBeInTheDocument();
    });

    it('should render ingredient without quantity', () => {
      const ingredients = [{ name: 'salt', unit: 'pinch' }];

      render(<IngredientList ingredients={ingredients} />);

      expect(screen.getByText(/pinch salt/i)).toBeInTheDocument();
    });

    it('should render ingredient without unit', () => {
      const ingredients = [{ name: 'eggs', quantity: 3 }];

      render(<IngredientList ingredients={ingredients} />);

      expect(screen.getByText(/3 eggs/i)).toBeInTheDocument();
    });

    it('should render ingredient with only name', () => {
      const ingredients = [{ name: 'butter' }];

      render(<IngredientList ingredients={ingredients} />);

      expect(screen.getByText('butter')).toBeInTheDocument();
    });

    it('should render multiple ingredients', () => {
      const ingredients = [
        { name: 'flour', quantity: 2, unit: 'cups' },
        { name: 'sugar', quantity: 1, unit: 'cup' },
        { name: 'eggs', quantity: 3 },
      ];

      render(<IngredientList ingredients={ingredients} />);

      expect(screen.getByText(/2 cups flour/i)).toBeInTheDocument();
      expect(screen.getByText(/1 cup sugar/i)).toBeInTheDocument();
      expect(screen.getByText(/3 eggs/i)).toBeInTheDocument();
    });

    it('should render ingredient notes', () => {
      const ingredients = [
        { name: 'butter', quantity: 1, unit: 'stick', notes: 'room temperature' },
      ];

      render(<IngredientList ingredients={ingredients} />);

      expect(screen.getByText(/1 stick butter/i)).toBeInTheDocument();
      expect(screen.getByText('room temperature')).toBeInTheDocument();
    });

    it('should format decimal quantities correctly', () => {
      const ingredients = [
        { name: 'milk', quantity: 1.5, unit: 'cups' },
        { name: 'vanilla', quantity: 0.25, unit: 'tsp' },
      ];

      render(<IngredientList ingredients={ingredients} />);

      expect(screen.getByText(/1.5 cups milk/i)).toBeInTheDocument();
      expect(screen.getByText(/0.25 tsp vanilla/i)).toBeInTheDocument();
    });

    it('should remove trailing zeros from quantities', () => {
      const ingredients = [{ name: 'water', quantity: 2.0, unit: 'cups' }];

      render(<IngredientList ingredients={ingredients} />);

      // Should display as "2 cups water" not "2.0 cups water"
      expect(screen.getByText(/2 cups water/i)).toBeInTheDocument();
    });
  });

  describe('Unit system conversion', () => {
    it('should convert to metric when unitSystem is metric', () => {
      const ingredients = [{ name: 'milk', quantity: 1, unit: 'cup' }];

      render(<IngredientList ingredients={ingredients} unitSystem="metric" />);

      // 1 cup = ~237ml (actual conversion from convertToSystem utility)
      expect(screen.getByText(/237 ml milk/i)).toBeInTheDocument();
    });

    it('should convert to imperial when unitSystem is imperial', () => {
      const ingredients = [{ name: 'milk', quantity: 240, unit: 'ml' }];

      render(<IngredientList ingredients={ingredients} unitSystem="imperial" />);

      // 240ml = ~1 cup (conversion should happen)
      expect(screen.getByText(/1 cup milk/i)).toBeInTheDocument();
    });

    it('should not convert when no unitSystem specified', () => {
      const ingredients = [{ name: 'milk', quantity: 1, unit: 'cup' }];

      render(<IngredientList ingredients={ingredients} />);

      // Should stay as original
      expect(screen.getByText(/1 cup milk/i)).toBeInTheDocument();
    });

    it('should handle ingredients without units when unitSystem specified', () => {
      const ingredients = [{ name: 'eggs', quantity: 3 }];

      render(<IngredientList ingredients={ingredients} unitSystem="metric" />);

      // No conversion should happen for unitless ingredients
      expect(screen.getByText(/3 eggs/i)).toBeInTheDocument();
    });
  });
});
