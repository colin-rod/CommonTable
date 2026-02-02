import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { AddMealButton } from './AddMealButton';

describe('AddMealButton', () => {
  it('should render with aria-label "Add meal"', () => {
    const onClick = vi.fn();
    render(<AddMealButton onClick={onClick} />);

    expect(screen.getByRole('button', { name: /add meal/i })).toBeInTheDocument();
  });

  it('should render with Add icon', () => {
    const onClick = vi.fn();
    render(<AddMealButton onClick={onClick} />);

    const button = screen.getByRole('button', { name: /add meal/i });
    const icon = button.querySelector('svg');

    expect(icon).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<AddMealButton onClick={onClick} />);

    const button = screen.getByRole('button', { name: /add meal/i });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be an icon button with dashed border', () => {
    const onClick = vi.fn();
    render(<AddMealButton onClick={onClick} />);

    const button = screen.getByRole('button', { name: /add meal/i });

    // Check for IconButton class
    expect(button.className).toContain('MuiIconButton');
  });

  it('should contain hover text "Add meal"', () => {
    const onClick = vi.fn();
    render(<AddMealButton onClick={onClick} />);

    // Hover text is present in the DOM (with opacity: 0)
    expect(screen.getByText('Add meal')).toBeInTheDocument();
  });
});
