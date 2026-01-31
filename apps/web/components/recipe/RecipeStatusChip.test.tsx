import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RecipeStatusChip } from './RecipeStatusChip';

describe('RecipeStatusChip', () => {
  describe('Status: suggested', () => {
    it('should render "Suggested" label', () => {
      render(<RecipeStatusChip status="suggested" />);
      expect(screen.getByText('Suggested')).toBeInTheDocument();
    });

    it('should render with default color', () => {
      const { container } = render(<RecipeStatusChip status="suggested" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorDefault');
    });

    it('should render lightbulb icon', () => {
      const { container } = render(<RecipeStatusChip status="suggested" />);
      const icon = container.querySelector('svg[data-testid="LightbulbOutlinedIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Status: to_buy', () => {
    it('should render "To Buy" label', () => {
      render(<RecipeStatusChip status="to_buy" />);
      expect(screen.getByText('To Buy')).toBeInTheDocument();
    });

    it('should render with primary color', () => {
      const { container } = render(<RecipeStatusChip status="to_buy" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorPrimary');
    });

    it('should render shopping cart icon', () => {
      const { container } = render(<RecipeStatusChip status="to_buy" />);
      const icon = container.querySelector('svg[data-testid="ShoppingCartOutlinedIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Status: to_cook', () => {
    it('should render "To Cook" label', () => {
      render(<RecipeStatusChip status="to_cook" />);
      expect(screen.getByText('To Cook')).toBeInTheDocument();
    });

    it('should render with primary color', () => {
      const { container } = render(<RecipeStatusChip status="to_cook" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorPrimary');
    });

    it('should render restaurant icon', () => {
      const { container } = render(<RecipeStatusChip status="to_cook" />);
      const icon = container.querySelector('svg[data-testid="RestaurantOutlinedIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Status: cooked', () => {
    it('should render "Cooked" label', () => {
      render(<RecipeStatusChip status="cooked" />);
      expect(screen.getByText('Cooked')).toBeInTheDocument();
    });

    it('should render with success color', () => {
      const { container } = render(<RecipeStatusChip status="cooked" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-colorSuccess');
    });

    it('should render check circle icon', () => {
      const { container } = render(<RecipeStatusChip status="cooked" />);
      const icon = container.querySelector('svg[data-testid="CheckCircleOutlineIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Size prop', () => {
    it('should render small size by default', () => {
      const { container } = render(<RecipeStatusChip status="suggested" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeSmall');
    });

    it('should render medium size when specified', () => {
      const { container } = render(<RecipeStatusChip status="suggested" size="medium" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-sizeMedium');
    });
  });

  describe('Chip variant', () => {
    it('should render outlined variant', () => {
      const { container } = render(<RecipeStatusChip status="suggested" />);
      const chip = container.querySelector('.MuiChip-root');
      expect(chip).toHaveClass('MuiChip-outlined');
    });
  });
});
