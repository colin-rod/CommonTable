import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, it, expect } from 'vitest';

import { RecipeMetadataFields, type RecipeFormValues } from './RecipeMetadataFields';

// Helper component to wrap RecipeMetadataFields with react-hook-form context
function TestWrapper({
  disabled = false,
  initialDescription = '',
  initialNotes = '',
}: {
  disabled?: boolean;
  initialDescription?: string;
  initialNotes?: string;
}) {
  const {
    control,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      title: '',
      description: initialDescription,
      servings: undefined,
      prep_time_minutes: undefined,
      cook_time_minutes: undefined,
      notes: initialNotes,
      tags: [],
    },
  });

  return (
    <RecipeMetadataFields
      control={control}
      errors={errors}
      disabled={disabled}
      availableTags={[]}
    />
  );
}

describe('RecipeMetadataFields', () => {
  describe('basic fields', () => {
    it('renders required fields with correct labels', () => {
      render(<TestWrapper />);

      expect(screen.getByLabelText(/recipe title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/servings/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument();
    });
  });

  describe('expandable description field', () => {
    it('shows "Add description" link when description is empty', () => {
      render(<TestWrapper />);

      expect(screen.getByText(/add description/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/description/i)).not.toBeInTheDocument();
    });

    it('shows description field when "Add description" is clicked', async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);

      const addDescriptionLink = screen.getByText(/add description/i);
      await user.click(addDescriptionLink);

      expect(screen.queryByText(/add description/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('shows description field when initialDescription has content', () => {
      render(<TestWrapper initialDescription="Existing description content" />);

      expect(screen.queryByText(/add description/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/existing description content/i)).toBeInTheDocument();
    });
  });

  describe('expandable notes field', () => {
    it('shows "Add notes" link when notes is empty', () => {
      render(<TestWrapper />);

      expect(screen.getByText(/add notes/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/^notes$/i)).not.toBeInTheDocument();
    });

    it('shows notes field when "Add notes" is clicked', async () => {
      const user = userEvent.setup();
      render(<TestWrapper />);

      const addNotesLink = screen.getByText(/add notes/i);
      await user.click(addNotesLink);

      expect(screen.queryByText(/add notes/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/^notes$/i)).toBeInTheDocument();
    });

    it('shows notes field when initialNotes has content', () => {
      render(<TestWrapper initialNotes="Existing notes content" />);

      expect(screen.queryByText(/add notes/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/^notes$/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/existing notes content/i)).toBeInTheDocument();
    });
  });

  describe('grid layout', () => {
    it('renders fields in a grid structure', () => {
      const { container } = render(<TestWrapper />);

      // Grid container should be present
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  // Legacy tests (keeping for backwards compatibility during migration)
  it('renders all fields with correct labels', () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText(/recipe title/i)).toBeInTheDocument();
    // Description is now hidden by default, skip this check
    expect(screen.getByLabelText(/servings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument();
    // Notes is now hidden by default, skip this check
  });

  it('displays validation error for required title field', () => {
    // Wrapper that has errors
    function TestWrapperWithError() {
      const {
        control,
        formState: { errors },
      } = useForm<RecipeFormValues>({
        defaultValues: { title: '', tags: [] },
      });

      // Simulate validation error
      const errorsWithTitleError = {
        ...errors,
        title: { type: 'required', message: 'Title is required' },
      };

      return (
        <RecipeMetadataFields control={control} errors={errorsWithTitleError} availableTags={[]} />
      );
    }

    render(<TestWrapperWithError />);

    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('accepts numeric input for servings field', () => {
    render(<TestWrapper />);

    const servingsInput = screen.getByLabelText(/servings/i) as HTMLInputElement;
    expect(servingsInput.type).toBe('number');
  });

  it('accepts numeric input for prep and cook time fields', () => {
    render(<TestWrapper />);

    const prepTimeInput = screen.getByLabelText(/prep time/i) as HTMLInputElement;
    const cookTimeInput = screen.getByLabelText(/cook time/i) as HTMLInputElement;

    expect(prepTimeInput.type).toBe('number');
    expect(cookTimeInput.type).toBe('number');
  });

  it('shows helper text for time fields', () => {
    render(<TestWrapper />);

    // Both prep and cook time have "minutes" helper text
    const minutesTexts = screen.getAllByText(/^minutes$/i);
    expect(minutesTexts.length).toBe(2); // Prep time and cook time
  });

  it('disables all fields when disabled prop is true', () => {
    render(
      <TestWrapper
        disabled={true}
        initialDescription="Some description"
        initialNotes="Some notes"
      />,
    );

    const titleInput = screen.getByLabelText(/recipe title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
    const servingsInput = screen.getByLabelText(/servings/i) as HTMLInputElement;
    const prepTimeInput = screen.getByLabelText(/prep time/i) as HTMLInputElement;
    const cookTimeInput = screen.getByLabelText(/cook time/i) as HTMLInputElement;
    const notesInput = screen.getByLabelText(/^notes$/i) as HTMLInputElement;

    expect(titleInput).toBeDisabled();
    expect(descriptionInput).toBeDisabled();
    expect(servingsInput).toBeDisabled();
    expect(prepTimeInput).toBeDisabled();
    expect(cookTimeInput).toBeDisabled();
    expect(notesInput).toBeDisabled();
  });

  it('marks title field as required', () => {
    render(<TestWrapper />);

    const titleInput = screen.getByLabelText(/recipe title/i);
    expect(titleInput).toBeRequired();
  });

  it('renders description and notes as multiline fields when visible', () => {
    render(<TestWrapper initialDescription="Some description" initialNotes="Some notes" />);

    const descriptionInput = screen.getByLabelText(/description/i);
    const notesInput = screen.getByLabelText(/^notes$/i);

    // MUI TextField with multiline prop renders a textarea
    expect(descriptionInput.tagName).toBe('TEXTAREA');
    expect(notesInput.tagName).toBe('TEXTAREA');
  });
});
