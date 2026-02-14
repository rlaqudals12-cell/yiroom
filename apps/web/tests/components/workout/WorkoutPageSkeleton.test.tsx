import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Skeleton mock
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: (props: Record<string, unknown>) => <div data-testid="skeleton" {...props} />,
}));

import { WorkoutPageSkeleton } from '@/components/workout/WorkoutPageSkeleton';

describe('WorkoutPageSkeleton', () => {
  it('data-testid가 존재한다', () => {
    render(<WorkoutPageSkeleton />);
    expect(screen.getByTestId('workout-page-skeleton')).toBeInTheDocument();
  });

  it('스켈레톤 요소들이 렌더링된다', () => {
    render(<WorkoutPageSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    // 헤더(2) + 운동 타입 카드(3) + 오늘의 운동(4) + 스트릭(3) + 빠른 액션 제목(1) + 4개 그리드(4) + 하단 버튼(1) = 18
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });

  it('container 클래스가 적용된다', () => {
    render(<WorkoutPageSkeleton />);
    const container = screen.getByTestId('workout-page-skeleton');
    expect(container.className).toContain('container');
    expect(container.className).toContain('max-w-lg');
  });
});
