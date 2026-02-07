import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, it, expect, beforeEach } from 'vitest';

import type { RecipeFormValues } from './RecipeMetadataFields';
import { StepEditor } from './StepEditor';

// Helper component to wrap StepEditor with react-hook-form context
function TestWrapper({ initialSteps = [] }: { initialSteps?: RecipeFormValues['steps'] }) {
  const {
    control,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      title: '',
      description: '',
      notes: '',
      ingredients: [],
      steps: initialSteps,
    },
  });

  return <StepEditor control={control} errors={errors} />;
}

describe('StepEditor', () => {
  beforeEach(() => {
    // Clear any previous state
  });

  it('renders empty state with "Add step" button', () => {
    render(<TestWrapper />);

    expect(screen.getByRole('heading', { name: /steps/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add step/i })).toBeInTheDocument();
  });

  it('adds new step row when button clicked', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    const addButton = screen.getByRole('button', { name: /add step/i });
    await user.click(addButton);

    // Should show step text input
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /step 1/i })).toBeInTheDocument();
    });
  });

  it('auto-numbers steps (1, 2, 3...)', async () => {
    const user = userEvent.setup();

    render(<TestWrapper />);

    // Add first step
    const addButton = screen.getByRole('button', { name: /add step/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /step 1/i })).toBeInTheDocument();
    });

    // Add second step
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /step 2/i })).toBeInTheDocument();
    });
  });

  it('removes step when delete button clicked', async () => {
    const user = userEvent.setup();

    render(<TestWrapper initialSteps={[{ position: 1, text: 'Boil water' }]} />);

    // Should show the existing step
    expect(screen.getByDisplayValue('Boil water')).toBeInTheDocument();

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete step/i });
    await user.click(deleteButton);

    // Step should be removed
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Boil water')).not.toBeInTheDocument();
    });
  });

  it('reorders steps with up/down buttons', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper
        initialSteps={[
          { position: 1, text: 'Boil water' },
          { position: 2, text: 'Add pasta' },
        ]}
      />,
    );

    // Get all step text inputs
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveValue('Boil water');
    expect(inputs[1]).toHaveValue('Add pasta');

    // Move second step up
    const upButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(upButtons[1]!);

    // Wait for reorder
    await waitFor(() => {
      const updatedInputs = screen.getAllByRole('textbox');
      expect(updatedInputs[0]).toHaveValue('Add pasta');
      expect(updatedInputs[1]).toHaveValue('Boil water');
    });
  });

  it('renumbers steps after reordering', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper
        initialSteps={[
          { position: 1, text: 'Boil water' },
          { position: 2, text: 'Add pasta' },
        ]}
      />,
    );

    // Move second step up
    const upButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(upButtons[1]!);

    // Wait for reorder and check labels
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /step 1/i })).toHaveValue('Add pasta');
      expect(screen.getByRole('textbox', { name: /step 2/i })).toHaveValue('Boil water');
    });
  });

  it('disables up button for first item', () => {
    render(
      <TestWrapper
        initialSteps={[
          { position: 1, text: 'Boil water' },
          { position: 2, text: 'Add pasta' },
        ]}
      />,
    );

    const upButtons = screen.getAllByRole('button', { name: /move up/i });
    expect(upButtons[0]).toBeDisabled();
    expect(upButtons[1]).not.toBeDisabled();
  });

  it('disables down button for last item', () => {
    render(
      <TestWrapper
        initialSteps={[
          { position: 1, text: 'Boil water' },
          { position: 2, text: 'Add pasta' },
        ]}
      />,
    );

    const downButtons = screen.getAllByRole('button', { name: /move down/i });
    expect(downButtons[0]).not.toBeDisabled();
    expect(downButtons[1]).toBeDisabled();
  });

  it('renders pre-populated steps in edit mode', () => {
    render(
      <TestWrapper
        initialSteps={[
          { position: 1, text: 'Boil water' },
          { position: 2, text: 'Add pasta' },
          { position: 3, text: 'Cook for 10 minutes' },
        ]}
      />,
    );

    expect(screen.getByDisplayValue('Boil water')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Add pasta')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Cook for 10 minutes')).toBeInTheDocument();
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
          ingredients: [],
          steps: [{ position: 1, text: 'Boil water' }],
        },
      });

      return <StepEditor control={control} errors={errors} disabled={true} />;
    }

    render(<DisabledWrapper />);

    const textInput = screen.getByRole('textbox', { name: /step 1/i }) as HTMLInputElement;
    expect(textInput).toBeDisabled();

    const addButton = screen.getByRole('button', { name: /add step/i });
    expect(addButton).toBeDisabled();
  });

  describe('Writing Mode - Visual Layout', () => {
    it('should render step number as h6 typography to the left of textarea', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);

      await waitFor(() => {
        const stepNumber = screen.getByText('1');
        expect(stepNumber.tagName).toBe('H6');
      });
    });

    it('should render multiline textarea with minRows for growing content', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox', { name: /step 1/i });
        // Verify it's a multiline textarea (minRows is a React prop, not a DOM attribute)
        expect(textarea.tagName).toBe('TEXTAREA');
        expect(textarea).toHaveAttribute('name', 'steps.0.text');
      });
    });

    it('should have placeholder text in textarea', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/describe this step/i);
        expect(textarea).toBeInTheDocument();
      });
    });
  });

  describe('Writing Mode - Refs and Focus Management', () => {
    it('should assign refs to all textareas for focus management', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);
      await user.click(addButton);

      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        expect(textareas).toHaveLength(2);
        expect(textareas[0]).toBeInstanceOf(HTMLTextAreaElement);
        expect(textareas[1]).toBeInstanceOf(HTMLTextAreaElement);
      });
    });

    it('should auto-focus newly added step from Add Step button', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);

      await waitFor(() => {
        const firstTextarea = screen.getByRole('textbox', { name: /step 1/i });
        expect(firstTextarea).toHaveFocus();
      });

      await user.click(addButton);

      await waitFor(() => {
        const secondTextarea = screen.getByRole('textbox', { name: /step 2/i });
        expect(secondTextarea).toHaveFocus();
      });
    });
  });

  describe('Writing Mode - Keyboard Shortcuts', () => {
    it('should create new step on Cmd+Enter (Mac)', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);

      const textarea = screen.getByRole('textbox', { name: /step 1/i });
      await user.type(textarea, 'First step');

      // Press Cmd+Enter
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      // Verify new step added and focused
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /step 2/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /step 2/i })).toHaveFocus();
      });
    });

    it('should create new step on Ctrl+Enter (Windows/Linux)', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);

      const textarea = screen.getByRole('textbox', { name: /step 1/i });
      await user.type(textarea, 'First step');

      // Press Ctrl+Enter
      await user.keyboard('{Control>}{Enter}{/Control}');

      // Verify new step added and focused
      await waitFor(() => {
        expect(screen.getByRole('textbox', { name: /step 2/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /step 2/i })).toHaveFocus();
      });
    });

    it('should allow Enter key for newlines within step', async () => {
      const user = userEvent.setup();

      render(<TestWrapper />);

      const addButton = screen.getByRole('button', { name: /add step/i });
      await user.click(addButton);

      const textarea = screen.getByRole('textbox', { name: /step 1/i });
      await user.type(textarea, 'Line 1{Enter}Line 2');

      // Verify newline added, not new step
      expect(textarea).toHaveValue('Line 1\nLine 2');
      expect(screen.queryByRole('textbox', { name: /step 2/i })).not.toBeInTheDocument();
    });

    it('should ignore keyboard shortcuts when disabled', async () => {
      function DisabledWrapper() {
        const {
          control,
          formState: { errors },
        } = useForm<RecipeFormValues>({
          defaultValues: {
            title: '',
            description: '',
            notes: '',
            ingredients: [],
            steps: [{ position: 1, text: 'Boil water' }],
          },
        });

        return <StepEditor control={control} errors={errors} disabled={true} />;
      }

      render(<DisabledWrapper />);

      const textarea = screen.getByRole('textbox', { name: /step 1/i }) as HTMLTextAreaElement;
      expect(textarea).toBeDisabled();

      // Cannot interact with disabled textarea
      expect(screen.queryByRole('textbox', { name: /step 2/i })).not.toBeInTheDocument();
    });
  });
});
