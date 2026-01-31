import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, it, expect, beforeEach } from 'vitest';

import { IngredientEditor } from './IngredientEditor';
import type { RecipeFormValues } from './RecipeMetadataFields';

// Helper component to wrap IngredientEditor with react-hook-form context
function TestWrapper({
  initialIngredients = [],
}: {
  initialIngredients?: RecipeFormValues['ingredients'];
}) {
  const {
    control,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      title: '',
      description: '',
      notes: '',
      ingredients: initialIngredients,
      steps: [],
    },
  });

  return <IngredientEditor control={control} errors={errors} />;
}

describe('IngredientEditor', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  it('renders empty state with "Add ingredient" button', () => {
    render(<TestWrapper />);

    expect(screen.getByRole('heading', { name: /ingredients/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add ingredient/i })).toBeInTheDocument();
  });

  it('adds new ingredient row when button clicked', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    const addButton = screen.getByRole('button', { name: /add ingredient/i });
    await user.click(addButton);

    // Should show ingredient name input
    await waitFor(() => {
      expect(screen.getByLabelText(/ingredient name/i)).toBeInTheDocument();
    });
  });

  it('removes ingredient row when delete button clicked', async () => {
    const user = userEvent.setup();

    render(<TestWrapper initialIngredients={[{ name: 'flour', quantity: 2, unit: 'cups' }]} />);

    // Should show the existing ingredient
    expect(screen.getByDisplayValue('flour')).toBeInTheDocument();

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete ingredient/i });
    await user.click(deleteButton);

    // Ingredient should be removed
    await waitFor(() => {
      expect(screen.queryByDisplayValue('flour')).not.toBeInTheDocument();
    });
  });

  it('moves ingredient up when up button clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper
        initialIngredients={[
          { name: 'flour', quantity: 2, unit: 'cups' },
          { name: 'sugar', quantity: 1, unit: 'cup' },
        ]}
      />,
    );

    // Get all ingredient name inputs
    const inputs = screen.getAllByLabelText(/ingredient name/i);
    expect(inputs[0]).toHaveValue('flour');
    expect(inputs[1]).toHaveValue('sugar');

    // Find the up button for the second ingredient (sugar)
    const upButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(upButtons[1]!);

    // Wait for reorder
    await waitFor(() => {
      const updatedInputs = screen.getAllByLabelText(/ingredient name/i);
      expect(updatedInputs[0]).toHaveValue('sugar');
      expect(updatedInputs[1]).toHaveValue('flour');
    });
  });

  it('moves ingredient down when down button clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper
        initialIngredients={[
          { name: 'flour', quantity: 2, unit: 'cups' },
          { name: 'sugar', quantity: 1, unit: 'cup' },
        ]}
      />,
    );

    // Find the down button for the first ingredient (flour)
    const downButtons = screen.getAllByRole('button', { name: /move down/i });
    await user.click(downButtons[0]!);

    // Wait for reorder
    await waitFor(() => {
      const inputs = screen.getAllByLabelText(/ingredient name/i);
      expect(inputs[0]).toHaveValue('sugar');
      expect(inputs[1]).toHaveValue('flour');
    });
  });

  it('disables up button for first item', () => {
    render(
      <TestWrapper
        initialIngredients={[
          { name: 'flour', quantity: 2, unit: 'cups' },
          { name: 'sugar', quantity: 1, unit: 'cup' },
        ]}
      />,
    );

    const upButtons = screen.getAllByRole('button', { name: /move up/i });
    expect(upButtons[0]).toBeDisabled(); // First item's up button should be disabled
    expect(upButtons[1]).not.toBeDisabled(); // Second item's up button should be enabled
  });

  it('disables down button for last item', () => {
    render(
      <TestWrapper
        initialIngredients={[
          { name: 'flour', quantity: 2, unit: 'cups' },
          { name: 'sugar', quantity: 1, unit: 'cup' },
        ]}
      />,
    );

    const downButtons = screen.getAllByRole('button', { name: /move down/i });
    expect(downButtons[0]).not.toBeDisabled(); // First item's down button should be enabled
    expect(downButtons[1]).toBeDisabled(); // Last item's down button should be disabled
  });

  it('renders pre-populated ingredients in edit mode', () => {
    render(
      <TestWrapper
        initialIngredients={[
          { name: 'flour', quantity: 2, unit: 'cups', notes: 'all-purpose' },
          { name: 'sugar', quantity: 1, unit: 'cup' },
        ]}
      />,
    );

    expect(screen.getByDisplayValue('flour')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cups')).toBeInTheDocument();
    expect(screen.getByDisplayValue('all-purpose')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sugar')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cup')).toBeInTheDocument();
  });

  it('disables all fields when disabled prop is true', () => {
    function DisabledWrapper() {
      const {
        control,
        formState: { errors },
      } = useForm<RecipeFormValues>({
        defaultValues: {
          title: '',
          description: '',
          notes: '',
          ingredients: [{ name: 'flour' }],
          steps: [],
        },
      });

      return <IngredientEditor control={control} errors={errors} disabled={true} />;
    }

    render(<DisabledWrapper />);

    const nameInput = screen.getByLabelText(/ingredient name/i) as HTMLInputElement;
    expect(nameInput).toBeDisabled();

    const addButton = screen.getByRole('button', { name: /add ingredient/i });
    expect(addButton).toBeDisabled();
  });
});
