import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, it, expect } from 'vitest';

import { RecipeMetadataFields, type RecipeFormValues } from './RecipeMetadataFields';

// Helper component to wrap RecipeMetadataFields with react-hook-form context
function TestWrapper({ disabled = false }: { disabled?: boolean }) {
  const {
    control,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    defaultValues: {
      title: '',
      description: '',
      servings: undefined,
      prep_time_minutes: undefined,
      cook_time_minutes: undefined,
      notes: '',
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
  it('renders all fields with correct labels', () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText(/recipe title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/servings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prep time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cook time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
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
    render(<TestWrapper disabled={true} />);

    const titleInput = screen.getByLabelText(/recipe title/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;
    const servingsInput = screen.getByLabelText(/servings/i) as HTMLInputElement;
    const prepTimeInput = screen.getByLabelText(/prep time/i) as HTMLInputElement;
    const cookTimeInput = screen.getByLabelText(/cook time/i) as HTMLInputElement;
    const notesInput = screen.getByLabelText(/notes/i) as HTMLInputElement;

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

  it('renders description and notes as multiline fields', () => {
    render(<TestWrapper />);

    const descriptionInput = screen.getByLabelText(/description/i);
    const notesInput = screen.getByLabelText(/notes/i);

    // MUI TextField with multiline prop renders a textarea
    expect(descriptionInput.tagName).toBe('TEXTAREA');
    expect(notesInput.tagName).toBe('TEXTAREA');
  });
});
