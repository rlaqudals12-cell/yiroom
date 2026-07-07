import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoutineToggle from '@/components/skin/routine/RoutineToggle';

// i18n 도입(next-intl)으로 컴포넌트가 번역 키를 사용 —
// tests/setup.ts 기본 목은 키를 그대로 반환하므로 실제 ko 메시지로 오버라이드해
// 한국어 문구 검증을 유지한다.
vi.mock('next-intl', async () => {
  const messages = (await import('@/messages/ko.json')).default as unknown as Record<
    string,
    Record<string, string>
  >;
  return {
    useTranslations: (namespace?: string) => (key: string) =>
      (namespace ? messages[namespace]?.[key] : undefined) ?? key,
    useLocale: () => 'ko',
    useMessages: () => messages,
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

describe('RoutineToggle', () => {
  const defaultProps = {
    activeTime: 'morning' as const,
    onToggle: vi.fn(),
    morningStepCount: 6,
    eveningStepCount: 8,
  };

  it('renders with test id', () => {
    render(<RoutineToggle {...defaultProps} />);
    expect(screen.getByTestId('routine-toggle')).toBeInTheDocument();
  });

  it('displays morning and evening buttons', () => {
    render(<RoutineToggle {...defaultProps} />);

    expect(screen.getByText('아침')).toBeInTheDocument();
    expect(screen.getByText('저녁')).toBeInTheDocument();
  });

  it('shows step counts for each time period', () => {
    render(<RoutineToggle {...defaultProps} />);

    expect(screen.getByText('6단계')).toBeInTheDocument();
    expect(screen.getByText('8단계')).toBeInTheDocument();
  });

  it('marks morning as active when activeTime is morning', () => {
    render(<RoutineToggle {...defaultProps} />);

    const morningButton = screen.getByTestId('morning-toggle-button');
    const eveningButton = screen.getByTestId('evening-toggle-button');

    expect(morningButton).toHaveAttribute('aria-selected', 'true');
    expect(eveningButton).toHaveAttribute('aria-selected', 'false');
  });

  it('marks evening as active when activeTime is evening', () => {
    render(<RoutineToggle {...defaultProps} activeTime="evening" />);

    const morningButton = screen.getByTestId('morning-toggle-button');
    const eveningButton = screen.getByTestId('evening-toggle-button');

    expect(morningButton).toHaveAttribute('aria-selected', 'false');
    expect(eveningButton).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onToggle with "morning" when morning button clicked', () => {
    const onToggle = vi.fn();
    render(<RoutineToggle {...defaultProps} activeTime="evening" onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId('morning-toggle-button'));
    expect(onToggle).toHaveBeenCalledWith('morning');
  });

  it('calls onToggle with "evening" when evening button clicked', () => {
    const onToggle = vi.fn();
    render(<RoutineToggle {...defaultProps} onToggle={onToggle} />);

    fireEvent.click(screen.getByTestId('evening-toggle-button'));
    expect(onToggle).toHaveBeenCalledWith('evening');
  });

  it('applies custom className', () => {
    render(<RoutineToggle {...defaultProps} className="custom-class" />);
    expect(screen.getByTestId('routine-toggle')).toHaveClass('custom-class');
  });

  it('has proper ARIA tablist role', () => {
    render(<RoutineToggle {...defaultProps} />);

    const toggle = screen.getByTestId('routine-toggle');
    expect(toggle).toHaveAttribute('role', 'tablist');
    expect(toggle).toHaveAttribute('aria-label', '루틴 시간대 선택');
  });

  it('has proper ARIA tab roles on buttons', () => {
    render(<RoutineToggle {...defaultProps} />);

    const morningButton = screen.getByTestId('morning-toggle-button');
    const eveningButton = screen.getByTestId('evening-toggle-button');

    expect(morningButton).toHaveAttribute('role', 'tab');
    expect(eveningButton).toHaveAttribute('role', 'tab');
  });
});
