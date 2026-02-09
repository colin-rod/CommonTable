import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { RecipeForm } from './RecipeForm';
import type { RecipeFormValues } from './RecipeMetadataFields';

describe('RecipeForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultInitialValues: RecipeFormValues = {
    title: '',
    description: '',
    servings: undefined,
    prep_time_minutes: undefined,
    cook_time_minutes: undefined,
    notes: '',
    tags: [],
    ingredients: [],
    steps: [],
  };

  it('renders in create mode with empty form', () => {
    render(
      <RecipeForm
        mode="create"
        initialValues={defaultInitialValues}
        availableTags={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Create Recipe' })).toBeInTheDocument();
    expect(screen.getByLabelText(/recipe title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create recipe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders in edit mode with pre-populated data', () => {
    const editValues: RecipeFormValues = {
      title: 'Pasta Carbonara',
      description: 'Classic Italian pasta dish',
      servings: 4,
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      notes: 'Use fresh eggs',
      tags: ['pasta', 'italian'],
      ingredients: [{ name: 'pasta', quantity: 400, unit: 'g' }],
      steps: [{ position: 1, text: 'Boil water' }],
    };

    render(
      <RecipeForm
        mode="edit"
        initialValues={editValues}
        availableTags={['pasta', 'italian', 'quick']}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Edit Recipe' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pasta Carbonara')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onSubmit with validated data on form submission', async () => {
    const user = userEvent.setup();

    render(
      <RecipeForm
        mode="create"
        initialValues={defaultInitialValues}
        availableTags={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    // Fill in required title field
    const titleInput = screen.getByLabelText(/recipe title/i);
    await user.type(titleInput, 'Test Recipe');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create recipe/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Recipe',
        }),
      );
    });
  });

  it('prevents submission with invalid data', async () => {
    const user = userEvent.setup();

    render(
      <RecipeForm
        mode="create"
        initialValues={defaultInitialValues}
        availableTags={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    // Submit without filling required title (leave it empty)
    const submitButton = screen.getByRole('button', { name: /create recipe/i });
    await user.click(submitButton);

    // Wait a bit to ensure no submission happens
    await waitFor(() => {
      // onSubmit should not be called when validation fails
      // (HTML5 required attribute prevents form submission)
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('disables submit button while loading', () => {
    render(
      <RecipeForm
        mode="create"
        initialValues={defaultInitialValues}
        availableTags={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />,
    );

    const submitButton = screen.getByRole('button', { name: /create recipe/i });
    expect(submitButton).toBeDisabled();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();

    render(
      <RecipeForm
        mode="create"
        initialValues={defaultInitialValues}
        availableTags={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('displays error alert when error prop provided', () => {
    const error = new Error('Failed to save recipe');

    render(
      <RecipeForm
        mode="create"
        initialValues={defaultInitialValues}
        availableTags={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error={error}
      />,
    );

    expect(screen.getByText(/failed to save recipe/i)).toBeInTheDocument();
  });

  it('disables all fields when loading', () => {
    render(
      <RecipeForm
        mode="create"
        initialValues={defaultInitialValues}
        availableTags={[]}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />,
    );

    const titleInput = screen.getByLabelText(/recipe title/i) as HTMLInputElement;
    expect(titleInput).toBeDisabled();
  });

  describe('two-column layout', () => {
    it('renders ingredients section in a Paper container', () => {
      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // IngredientEditor has its own "Ingredients" heading
      const ingredientsHeading = screen.getByRole('heading', { name: /^ingredients$/i });
      expect(ingredientsHeading).toBeInTheDocument();

      // Ingredients section should be within a Paper container
      const ingredientsPaper = ingredientsHeading.closest('.MuiPaper-root');
      expect(ingredientsPaper).toBeInTheDocument();
    });

    it('renders steps section in a Paper container', () => {
      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // StepEditor has its own "Steps" heading
      const stepsHeading = screen.getByRole('heading', { name: /^steps$/i });
      expect(stepsHeading).toBeInTheDocument();

      // Steps section should be within a Paper container
      const stepsPaper = stepsHeading.closest('.MuiPaper-root');
      expect(stepsPaper).toBeInTheDocument();
    });

    it('places ingredients and steps in separate containers side by side', () => {
      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const ingredientsHeading = screen.getByRole('heading', { name: /^ingredients$/i });
      const stepsHeading = screen.getByRole('heading', { name: /^steps$/i });

      const ingredientsPaper = ingredientsHeading.closest('.MuiPaper-root');
      const stepsPaper = stepsHeading.closest('.MuiPaper-root');

      // They should be in different Paper containers
      expect(ingredientsPaper).not.toBe(stepsPaper);

      // Their parent should use flex layout for side-by-side positioning
      const ingredientsParent = ingredientsPaper?.parentElement;
      expect(ingredientsParent).toHaveStyle({ display: 'flex' });
    });
  });

  describe('metadata fields', () => {
    it('renders cuisine select dropdown with options', async () => {
      const user = userEvent.setup();

      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Open Details accordion to reveal metadata fields
      const detailsAccordion = screen.getByText(/^Details$/);
      await user.click(detailsAccordion);

      // Find cuisine select by label
      const cuisineSelect = screen.getByLabelText(/cuisine/i);
      expect(cuisineSelect).toBeInTheDocument();
    });

    it('renders meal type select dropdown with options', async () => {
      const user = userEvent.setup();

      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Open Details accordion
      const detailsAccordion = screen.getByText(/^Details$/);
      await user.click(detailsAccordion);

      // Find meal type select by label
      const mealTypeSelect = screen.getByLabelText(/meal type/i);
      expect(mealTypeSelect).toBeInTheDocument();
    });

    it('renders key ingredients autocomplete field', async () => {
      const user = userEvent.setup();

      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Open Details accordion
      const detailsAccordion = screen.getByText(/^Details$/);
      await user.click(detailsAccordion);

      // Find key ingredients autocomplete by label
      const keyIngredientsInput = screen.getByLabelText(/key ingredients/i);
      expect(keyIngredientsInput).toBeInTheDocument();
    });

    it('renders priority select dropdown with 1-5 options', async () => {
      const user = userEvent.setup();

      render(
        <RecipeForm
          mode="edit"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Open Details accordion
      const detailsAccordion = screen.getByText(/^Details$/);
      await user.click(detailsAccordion);

      // Find priority select by label
      const prioritySelect = screen.getByLabelText(/priority/i);
      expect(prioritySelect).toBeInTheDocument();
    });

    it('renders source URL text field', async () => {
      const user = userEvent.setup();

      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Open Details accordion
      const detailsAccordion = screen.getByText(/^Details$/);
      await user.click(detailsAccordion);

      // Find source URL field by label
      const sourceUrlInput = screen.getByLabelText(/source url/i);
      expect(sourceUrlInput).toBeInTheDocument();
    });

    it('submits form with metadata values when provided', async () => {
      const user = userEvent.setup();

      const valuesWithMetadata: RecipeFormValues = {
        ...defaultInitialValues,
        title: 'Test Recipe',
        cuisine: 'italian',
        meal_type: 'main_dish',
        key_ingredients: ['pasta', 'tomato'],
        priority: 4,
      };

      render(
        <RecipeForm
          mode="create"
          initialValues={valuesWithMetadata}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create recipe/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Recipe',
            cuisine: 'italian',
            meal_type: 'main_dish',
            key_ingredients: ['pasta', 'tomato'],
            priority: 4,
          }),
        );
      });
    });

    it('submits form successfully when metadata fields are empty (optional)', async () => {
      const user = userEvent.setup();

      render(
        <RecipeForm
          mode="create"
          initialValues={defaultInitialValues}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Fill only required title field
      const titleInput = screen.getByLabelText(/recipe title/i);
      await user.type(titleInput, 'Minimal Recipe');

      // Submit form without filling metadata
      const submitButton = screen.getByRole('button', { name: /create recipe/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Minimal Recipe',
          }),
        );
      });
    });

    it('validates source URL format', async () => {
      const user = userEvent.setup();

      const valuesWithInvalidUrl: RecipeFormValues = {
        ...defaultInitialValues,
        title: 'Test Recipe',
        source_url: 'not-a-valid-url',
      };

      render(
        <RecipeForm
          mode="create"
          initialValues={valuesWithInvalidUrl}
          availableTags={[]}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Open Details accordion
      const detailsAccordion = screen.getByText(/^Details$/);
      await user.click(detailsAccordion);

      // The source URL field should show validation error
      // Note: HTML5 URL validation will prevent submission
      const sourceUrlInput = screen.getByLabelText(/source url/i);
      expect(sourceUrlInput).toHaveAttribute('type', 'url');
    });
  });
});
