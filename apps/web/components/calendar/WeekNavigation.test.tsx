import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { WeekNavigation } from './WeekNavigation';

describe('WeekNavigation', () => {
  const defaultProps = {
    weekStart: new Date('2026-01-18'), // Sunday
    weekEnd: new Date('2026-01-24'), // Saturday
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    isCurrentWeek: false,
  };

  it('should render week range', () => {
    render(<WeekNavigation {...defaultProps} />);

    expect(screen.getByText('Jan 18 - 24, 2026')).toBeInTheDocument();
  });

  it('should render current week indicator when isCurrentWeek is true', () => {
    render(<WeekNavigation {...defaultProps} isCurrentWeek={true} />);

    expect(screen.getByText('(Current week)')).toBeInTheDocument();
  });

  it('should not render current week indicator when isCurrentWeek is false', () => {
    render(<WeekNavigation {...defaultProps} isCurrentWeek={false} />);

    expect(screen.queryByText('(Current week)')).not.toBeInTheDocument();
  });

  it('should call onPrevious when previous button clicked', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();

    render(<WeekNavigation {...defaultProps} onPrevious={onPrevious} />);

    const prevButton = screen.getByLabelText('Previous week');
    await user.click(prevButton);

    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('should call onNext when next button clicked', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(<WeekNavigation {...defaultProps} onNext={onNext} />);

    const nextButton = screen.getByLabelText('Next week');
    await user.click(nextButton);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('should format week range across months', () => {
    const weekStart = new Date('2026-01-25');
    const weekEnd = new Date('2026-02-01');

    render(<WeekNavigation {...defaultProps} weekStart={weekStart} weekEnd={weekEnd} />);

    expect(screen.getByText('Jan 25 - Feb 1, 2026')).toBeInTheDocument();
  });

  it('should format week range across years', () => {
    const weekStart = new Date('2025-12-28');
    const weekEnd = new Date('2026-01-03');

    render(<WeekNavigation {...defaultProps} weekStart={weekStart} weekEnd={weekEnd} />);

    expect(screen.getByText('Dec 28, 2025 - Jan 3, 2026')).toBeInTheDocument();
  });
});
