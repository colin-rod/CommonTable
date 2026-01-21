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
});
