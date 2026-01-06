import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MoodSelector } from '@/components/mental-health/MoodSelector';

describe('MoodSelector', () => {
  it('renders all mood options', () => {
    render(<MoodSelector value={null} onChange={vi.fn()} />);
    expect(screen.getByTestId('mood-selector')).toBeInTheDocument();
    expect(screen.getByText('😢')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
  });

  it('calls onChange when option clicked', () => {
    const handleChange = vi.fn();
    render(<MoodSelector value={null} onChange={handleChange} />);

    fireEvent.click(screen.getByText('😊'));
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('highlights selected value', () => {
    render(<MoodSelector value={3} onChange={vi.fn()} />);
    const neutralButton = screen.getByLabelText('보통');
    expect(neutralButton).toHaveClass('ring-2');
  });
});
