import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion, SrOnlyLiveRegion } from '@/components/common/LiveRegion';

describe('LiveRegion', () => {
  it('should render children', () => {
    render(<LiveRegion testId="live-test">알림 메시지</LiveRegion>);
    expect(screen.getByText('알림 메시지')).toBeInTheDocument();
  });

  it('should have aria-live="polite" by default', () => {
    render(<LiveRegion testId="live-test">메시지</LiveRegion>);
    const region = screen.getByTestId('live-test');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-atomic', 'true');
  });

  it('should support assertive politeness', () => {
    render(
      <LiveRegion testId="live-assertive" politeness="assertive">
        긴급 알림
      </LiveRegion>
    );
    const region = screen.getByTestId('live-assertive');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });
});

describe('SrOnlyLiveRegion', () => {
  it('should render with sr-only class', () => {
    render(<SrOnlyLiveRegion>숨겨진 알림</SrOnlyLiveRegion>);
    const region = screen.getByRole('status');
    expect(region).toHaveClass('sr-only');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });
});
