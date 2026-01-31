import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RecipeMetadataChips } from './RecipeMetadataChips';

describe('RecipeMetadataChips', () => {
  describe('Cuisine chip', () => {
    it('should render cuisine chip when cuisine provided', () => {
      render(<RecipeMetadataChips cuisine="italian" />);
      expect(screen.getByText('Italian')).toBeInTheDocument();
    });

    it('should not render cuisine chip when cuisine is null', () => {
      render(<RecipeMetadataChips cuisine={null} />);
      expect(screen.queryByText(/italian/i)).not.toBeInTheDocument();
    });

    it('should not render cuisine chip when cuisine is undefined', () => {
      render(<RecipeMetadataChips />);
      const container = render(<RecipeMetadataChips />).container;
      expect(container.querySelector('.MuiChip-root')).not.toBeInTheDocument();
    });

    it('should format multi-word cuisines correctly', () => {
      render(<RecipeMetadataChips cuisine="middle_eastern" />);
      expect(screen.getByText('Middle Eastern')).toBeInTheDocument();
    });

    it('should render cuisine icon', () => {
      const { container } = render(<RecipeMetadataChips cuisine="italian" />);
      const icon = container.querySelector('svg[data-testid="PublicIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Meal type chip', () => {
    it('should render meal type chip when mealType provided', () => {
      render(<RecipeMetadataChips mealType="main_dish" />);
      expect(screen.getByText('Main Dish')).toBeInTheDocument();
    });

    it('should not render meal type chip when mealType is null', () => {
      render(<RecipeMetadataChips mealType={null} />);
      expect(screen.queryByText(/main dish/i)).not.toBeInTheDocument();
    });

    it('should not render meal type chip when mealType is undefined', () => {
      render(<RecipeMetadataChips />);
      const container = render(<RecipeMetadataChips />).container;
      expect(container.querySelector('.MuiChip-root')).not.toBeInTheDocument();
    });

    it('should format single-word meal types correctly', () => {
      render(<RecipeMetadataChips mealType="breakfast" />);
      expect(screen.getByText('Breakfast')).toBeInTheDocument();
    });

    it('should format multi-word meal types correctly', () => {
      render(<RecipeMetadataChips mealType="side_dish" />);
      expect(screen.getByText('Side Dish')).toBeInTheDocument();
    });

    it('should render meal type icon', () => {
      const { container } = render(<RecipeMetadataChips mealType="main_dish" />);
      const icon = container.querySelector('svg[data-testid="RestaurantMenuIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Both chips', () => {
    it('should render both chips when both metadata provided', () => {
      render(<RecipeMetadataChips cuisine="italian" mealType="main_dish" />);
      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.getByText('Main Dish')).toBeInTheDocument();
    });

    it('should render chips in horizontal stack with spacing', () => {
      const { container } = render(<RecipeMetadataChips cuisine="italian" mealType="main_dish" />);
      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toHaveClass('MuiStack-root');
    });
  });

  describe('Empty state', () => {
    it('should return null when no metadata provided', () => {
      const { container } = render(<RecipeMetadataChips />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when all metadata is null', () => {
      const { container } = render(<RecipeMetadataChips cuisine={null} mealType={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Size prop', () => {
    it('should render small size by default', () => {
      const { container } = render(<RecipeMetadataChips cuisine="italian" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');
    });

    it('should render medium size when specified', () => {
      const { container } = render(<RecipeMetadataChips cuisine="italian" size="medium" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeMedium');
    });
  });

  describe('Chip variant', () => {
    it('should render outlined variant', () => {
      const { container } = render(<RecipeMetadataChips cuisine="italian" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-outlined');
    });
  });

  describe('Cuisine formatting', () => {
    it.each([
      ['african', 'African'],
      ['american', 'American'],
      ['asian', 'Asian'],
      ['brazilian', 'Brazilian'],
      ['breakfast', 'Breakfast'],
      ['chinese', 'Chinese'],
      ['dessert', 'Dessert'],
      ['french', 'French'],
      ['german', 'German'],
      ['greek', 'Greek'],
      ['hungarian', 'Hungarian'],
      ['indian', 'Indian'],
      ['italian', 'Italian'],
      ['japanese', 'Japanese'],
      ['korean', 'Korean'],
      ['mediterranean', 'Mediterranean'],
      ['mexican', 'Mexican'],
      ['middle_eastern', 'Middle Eastern'],
      ['pastry', 'Pastry'],
      ['persian', 'Persian'],
      ['peruvian', 'Peruvian'],
      ['salad', 'Salad'],
      ['sauce', 'Sauce'],
      ['seafood', 'Seafood'],
      ['spanish', 'Spanish'],
      ['staple', 'Staple'],
      ['thai', 'Thai'],
      ['vegetable', 'Vegetable'],
      ['vietnamese', 'Vietnamese'],
    ] as const)('should format %s as %s', (cuisine, expected) => {
      render(<RecipeMetadataChips cuisine={cuisine} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe('Meal type formatting', () => {
    it.each([
      ['main_dish', 'Main Dish'],
      ['side_dish', 'Side Dish'],
      ['breakfast', 'Breakfast'],
      ['dessert', 'Dessert'],
      ['snack', 'Snack'],
      ['beverage', 'Beverage'],
    ] as const)('should format %s as %s', (mealType, expected) => {
      render(<RecipeMetadataChips mealType={mealType} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });
});
