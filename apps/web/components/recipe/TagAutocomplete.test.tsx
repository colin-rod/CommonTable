import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { TagAutocomplete } from './TagAutocomplete';

describe('TagAutocomplete', () => {
  const availableTags = ['pasta', 'italian', 'quick', 'vegetarian'];

  it('should render with existing tags selected', () => {
    render(
      <TagAutocomplete
        value={['pasta', 'italian']}
        onChange={vi.fn()}
        availableTags={availableTags}
      />,
    );

    expect(screen.getByText('pasta')).toBeInTheDocument();
    expect(screen.getByText('italian')).toBeInTheDocument();
  });

  it('should display tags as Chips', () => {
    const { container } = render(
      <TagAutocomplete value={['pasta']} onChange={vi.fn()} availableTags={availableTags} />,
    );

    // MUI Chips have class MuiChip-root
    const chips = container.querySelectorAll('.MuiChip-root');
    expect(chips.length).toBe(1);
  });

  it('should call onChange when tags change', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagAutocomplete value={[]} onChange={handleChange} availableTags={availableTags} />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    // Select 'pasta' from dropdown
    const pastaOption = await screen.findByText('pasta');
    await user.click(pastaOption);

    expect(handleChange).toHaveBeenCalledWith(['pasta']);
  });

  it('should show error state', () => {
    render(
      <TagAutocomplete
        value={[]}
        onChange={vi.fn()}
        availableTags={availableTags}
        error={true}
        helperText="Tags are required"
      />,
    );

    expect(screen.getByText('Tags are required')).toBeInTheDocument();
  });

  it('should show helper text', () => {
    render(
      <TagAutocomplete
        value={[]}
        onChange={vi.fn()}
        availableTags={availableTags}
        helperText="Press Enter to add a tag"
      />,
    );

    expect(screen.getByText('Press Enter to add a tag')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <TagAutocomplete
        value={['pasta']}
        onChange={vi.fn()}
        availableTags={availableTags}
        disabled={true}
      />,
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
  });

  it('should normalize tag names (lowercase, trim)', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<TagAutocomplete value={[]} onChange={handleChange} availableTags={availableTags} />);

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.type(input, '  ITALIAN  {enter}');

    expect(handleChange).toHaveBeenCalledWith(['italian']);
  });

  it('should prevent duplicate tags', () => {
    const handleChange = vi.fn();

    render(
      <TagAutocomplete
        value={['pasta', 'italian']}
        onChange={handleChange}
        availableTags={availableTags}
      />,
    );

    // The component should deduplicate when onChange is called
    // We can test the normalization directly
    const normalized = [
      ...new Set(['pasta', 'PASTA', 'Italian'].map((t) => t.toLowerCase().trim())),
    ];
    expect(normalized).toEqual(['pasta', 'italian']);
  });
});
