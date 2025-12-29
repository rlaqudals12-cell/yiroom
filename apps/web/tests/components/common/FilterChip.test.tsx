import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChip, FilterChipGroup } from '@/components/common/FilterChip';

describe('FilterChip', () => {
  it('renders with label', () => {
    render(<FilterChip label="테스트 필터" value="test" onToggle={() => {}} />);
    expect(screen.getByText('테스트 필터')).toBeInTheDocument();
  });

  it('handles toggle events', () => {
    const handleToggle = vi.fn();
    render(<FilterChip label="클릭 테스트" value="click" onToggle={handleToggle} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleToggle).toHaveBeenCalledWith('click');
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('shows selected state', () => {
    render(<FilterChip label="선택됨" value="sel" selected onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows unselected state', () => {
    render(<FilterChip label="미선택" value="unsel" selected={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies beauty variant styles', () => {
    render(<FilterChip label="뷰티" value="b" variant="beauty" selected onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('pink');
  });

  it('applies style variant styles', () => {
    render(<FilterChip label="스타일" value="s" variant="style" selected onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('indigo');
  });

  it('does not trigger when disabled', () => {
    const handleToggle = vi.fn();
    render(<FilterChip label="비활성" value="dis" disabled onToggle={handleToggle} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleToggle).not.toHaveBeenCalled();
  });
});

describe('FilterChipGroup', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];

  it('renders all options', () => {
    render(
      <FilterChipGroup
        options={options}
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
  });

  it('shows selected items', () => {
    render(
      <FilterChipGroup
        options={options}
        selected={['a', 'c']}
        onChange={() => {}}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles single selection mode', () => {
    const handleChange = vi.fn();
    render(
      <FilterChipGroup
        options={options}
        selected={['a']}
        onChange={handleChange}
        multiple={false}
      />
    );

    fireEvent.click(screen.getByText('Option B'));
    expect(handleChange).toHaveBeenCalledWith(['b']);
  });

  it('handles multiple selection mode', () => {
    const handleChange = vi.fn();
    render(
      <FilterChipGroup
        options={options}
        selected={['a']}
        onChange={handleChange}
        multiple={true}
      />
    );

    fireEvent.click(screen.getByText('Option B'));
    expect(handleChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('removes item when clicking selected in multiple mode', () => {
    const handleChange = vi.fn();
    render(
      <FilterChipGroup
        options={options}
        selected={['a', 'b']}
        onChange={handleChange}
        multiple={true}
      />
    );

    fireEvent.click(screen.getByText('Option A'));
    expect(handleChange).toHaveBeenCalledWith(['b']);
  });
});
