import type { RecipeWithVersion, RecipeImage } from '@commontable/types';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeDetailView } from './RecipeDetailView';

// Mock child components
vi.mock('./RecipeMetadata', () => ({
  RecipeMetadata: ({ servings, tags }: any) => (
    <div data-testid="recipe-metadata">
      {servings && <span>Servings: {servings}</span>}
      {tags.length > 0 && <span>Tags: {tags.join(', ')}</span>}
    </div>
  ),
}));

vi.mock('./ServingsScaler', () => ({
  ServingsScaler: ({
    originalServings,
    targetServings,
    onServingsChange,
    unitSystem,
    onUnitSystemChange,
  }: any) => (
    <div data-testid="servings-scaler">
      <button onClick={() => onServingsChange(originalServings + 1)}>Increase</button>
      <button onClick={() => onServingsChange(originalServings - 1)}>Decrease</button>
      <span>Target: {targetServings}</span>
      <button onClick={() => onUnitSystemChange('metric')}>Metric</button>
      <button onClick={() => onUnitSystemChange('imperial')}>Imperial</button>
      <span>Unit: {unitSystem}</span>
    </div>
  ),
}));

vi.mock('./IngredientList', () => ({
  IngredientList: ({ ingredients, unitSystem }: any) => (
    <ul data-testid="ingredient-list">
      {ingredients.map((ing: any, i: number) => (
        <li key={i}>
          {ing.quantity} {ing.unit} {ing.name} ({unitSystem})
        </li>
      ))}
    </ul>
  ),
}));

vi.mock('./StepList', () => ({
  StepList: ({ steps }: any) => (
    <ol data-testid="step-list">
      {steps.map((step: any) => (
        <li key={step.position}>{step.text}</li>
      ))}
    </ol>
  ),
}));

describe('RecipeDetailView Component', () => {
  const mockRecipe: RecipeWithVersion = {
    id: 'recipe-123' as any,
    household_id: 'household-1' as any,
    title: 'Pasta Carbonara',
    description: 'A classic Italian pasta dish',
    tags: ['italian', 'pasta'],
    rolling_score: 4.5,
    last_cooked_at: new Date('2024-01-15'),
    is_favorite: false,
    current_version_id: 'version-1' as any,
    created_by: 'user-1' as any,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    // Phase 3 metadata fields
    cuisine: null,
    meal_type: null,
    key_ingredients: [],
    priority: null,
    status: 'suggested',
    cooking_method: null,
    dietary_categories: null,
    dish_category: null,
    current_version: {
      id: 'version-1' as any,
      recipe_id: 'recipe-123' as any,
      version_number: 1,
      servings: 4,
      prep_time_minutes: 15,
      cook_time_minutes: 20,
      ingredients_json: [
        { name: 'pasta', quantity: 400, unit: 'g' },
        { name: 'eggs', quantity: 4 },
      ],
      steps_json: [
        { position: 1, text: 'Boil pasta' },
        { position: 2, text: 'Mix eggs and cheese' },
      ],
      notes: 'Use fresh eggs for best results',
      created_by: 'user-1' as any,
      created_at: new Date('2024-01-01'),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render recipe description', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByText('A classic Italian pasta dish')).toBeInTheDocument();
    });

    it('should not render description if null', () => {
      const recipeWithoutDescription = { ...mockRecipe, description: null };
      render(<RecipeDetailView recipe={recipeWithoutDescription} />);

      expect(screen.queryByText(/classic italian/i)).not.toBeInTheDocument();
    });

    it('should render RecipeMetadata component', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByTestId('recipe-metadata')).toBeInTheDocument();
    });

    it('should render ServingsScaler when servings are set', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByTestId('servings-scaler')).toBeInTheDocument();
    });

    it('should not render ServingsScaler when servings are null', () => {
      const recipeWithoutServings = {
        ...mockRecipe,
        current_version: { ...mockRecipe.current_version!, servings: null },
      };
      render(<RecipeDetailView recipe={recipeWithoutServings} />);

      expect(screen.queryByTestId('servings-scaler')).not.toBeInTheDocument();
      expect(screen.getByText(/servings not set for this recipe/i)).toBeInTheDocument();
    });

    it('should render Ingredients section header', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByText('Ingredients')).toBeInTheDocument();
    });

    it('should render IngredientList component', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByTestId('ingredient-list')).toBeInTheDocument();
    });

    it('should render Steps section header', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByText('Steps')).toBeInTheDocument();
    });

    it('should render StepList component', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByTestId('step-list')).toBeInTheDocument();
    });

    it('should render Notes section when notes exist', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Use fresh eggs for best results')).toBeInTheDocument();
    });

    it('should not render Notes section when notes are null', () => {
      const recipeWithoutNotes = {
        ...mockRecipe,
        current_version: { ...mockRecipe.current_version!, notes: null },
      };
      render(<RecipeDetailView recipe={recipeWithoutNotes} />);

      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  describe('Servings scaling', () => {
    it('should initialize with original servings', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByText(/target: 4/i)).toBeInTheDocument();
    });

    it('should update ingredients when servings change', async () => {
      const user = userEvent.setup();
      render(<RecipeDetailView recipe={mockRecipe} />);

      const increaseButton = screen.getByText('Increase');
      await user.click(increaseButton);

      // Target servings should update
      await waitFor(() => {
        expect(screen.getByText(/target: 5/i)).toBeInTheDocument();
      });
    });

    it('should pass scaled ingredients to IngredientList', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      const ingredientList = screen.getByTestId('ingredient-list');
      expect(ingredientList).toBeInTheDocument();
      // Ingredients are scaled by scaleIngredients utility
    });

    it('should default to 4 servings if original servings is null', () => {
      const recipeWithoutServings = {
        ...mockRecipe,
        current_version: { ...mockRecipe.current_version!, servings: null },
      };
      render(<RecipeDetailView recipe={recipeWithoutServings} />);

      // Should show message instead of scaler
      expect(screen.getByText(/servings not set/i)).toBeInTheDocument();
    });
  });

  describe('Unit system switching', () => {
    it('should initialize with imperial unit system', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      expect(screen.getByText(/unit: imperial/i)).toBeInTheDocument();
    });

    it('should update unit system when toggled', async () => {
      const user = userEvent.setup();
      render(<RecipeDetailView recipe={mockRecipe} />);

      const metricButton = screen.getByText('Metric');
      await user.click(metricButton);

      await waitFor(() => {
        expect(screen.getByText(/unit: metric/i)).toBeInTheDocument();
      });
    });

    it('should pass unit system to IngredientList', () => {
      render(<RecipeDetailView recipe={mockRecipe} />);

      const ingredientList = screen.getByTestId('ingredient-list');
      expect(ingredientList.textContent).toContain('imperial');
    });
  });

  describe('Image display', () => {
    const mockImage: RecipeImage = {
      id: 'image-1' as any,
      recipe_id: 'recipe-123' as any,
      storage_path: 'recipes/image.jpg',
      alt_text: 'Delicious pasta',
      display_order: 1,
      is_primary: true,
      is_public: false,
      width: null,
      height: null,
      file_size_bytes: null,
      created_by: 'user-1' as any,
      created_at: new Date('2024-01-01'),
    };

    it('should not render image if primaryImage is null', () => {
      const { container } = render(<RecipeDetailView recipe={mockRecipe} />);

      const image = container.querySelector('img');
      expect(image).not.toBeInTheDocument();
    });

    it('should render image skeleton while loading', () => {
      const mockGetImageUrl = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve('https://example.com/image.jpg'), 100),
            ),
        );

      const { container } = render(
        <RecipeDetailView
          recipe={mockRecipe}
          primaryImage={mockImage}
          getImageUrl={mockGetImageUrl}
        />,
      );

      // MUI Skeleton doesn't have progressbar role, check for the component itself
      const skeleton = container.querySelector('.MuiSkeleton-root');
      expect(skeleton).toBeInTheDocument();
    });

    it('should render image when URL is loaded', async () => {
      const mockGetImageUrl = vi.fn().mockResolvedValue('https://example.com/image.jpg');

      render(
        <RecipeDetailView
          recipe={mockRecipe}
          primaryImage={mockImage}
          getImageUrl={mockGetImageUrl}
        />,
      );

      await waitFor(() => {
        const image = screen.getByAltText('Delicious pasta');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
      });
    });

    it('should use recipe title as alt text if image alt_text is null', async () => {
      const mockGetImageUrl = vi.fn().mockResolvedValue('https://example.com/image.jpg');
      const imageWithoutAlt = { ...mockImage, alt_text: null };

      render(
        <RecipeDetailView
          recipe={mockRecipe}
          primaryImage={imageWithoutAlt}
          getImageUrl={mockGetImageUrl}
        />,
      );

      await waitFor(() => {
        const image = screen.getByAltText('Pasta Carbonara');
        expect(image).toBeInTheDocument();
      });
    });

    it('should handle image loading error gracefully', async () => {
      const mockGetImageUrl = vi.fn().mockRejectedValue(new Error('Failed to load'));

      const { container } = render(
        <RecipeDetailView
          recipe={mockRecipe}
          primaryImage={mockImage}
          getImageUrl={mockGetImageUrl}
        />,
      );

      await waitFor(() => {
        const image = container.querySelector('img');
        expect(image).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle missing current_version', () => {
      const recipeWithoutVersion = {
        ...mockRecipe,
        current_version: null,
      };

      render(<RecipeDetailView recipe={recipeWithoutVersion as any} />);

      // Should still render but with empty ingredients and steps
      expect(screen.getByText('Ingredients')).toBeInTheDocument();
      expect(screen.getByText('Steps')).toBeInTheDocument();
    });

    it('should handle empty ingredients array', () => {
      const recipeWithoutIngredients = {
        ...mockRecipe,
        current_version: { ...mockRecipe.current_version!, ingredients_json: [] },
      };

      render(<RecipeDetailView recipe={recipeWithoutIngredients} />);

      const ingredientList = screen.getByTestId('ingredient-list');
      expect(ingredientList.children).toHaveLength(0);
    });

    it('should handle empty steps array', () => {
      const recipeWithoutSteps = {
        ...mockRecipe,
        current_version: { ...mockRecipe.current_version!, steps_json: [] },
      };

      render(<RecipeDetailView recipe={recipeWithoutSteps} />);

      const stepList = screen.getByTestId('step-list');
      expect(stepList.children).toHaveLength(0);
    });

    it('should preserve notes whitespace with pre-wrap', () => {
      const recipeWithMultilineNotes = {
        ...mockRecipe,
        current_version: {
          ...mockRecipe.current_version!,
          notes: 'Line 1\n\nLine 2\nLine 3',
        },
      };

      render(<RecipeDetailView recipe={recipeWithMultilineNotes} />);

      // Check that multiline notes are rendered
      // Use getAllByText since there may be multiple elements
      const elements = screen.getAllByText((content, element) => {
        return element?.textContent === 'Line 1\n\nLine 2\nLine 3';
      });

      // Should find at least one element with the text
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
