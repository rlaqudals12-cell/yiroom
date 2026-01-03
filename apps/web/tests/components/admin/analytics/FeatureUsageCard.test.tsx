import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureUsageCard } from '@/components/admin/analytics';
import type { FeatureUsageStats } from '@/lib/admin/user-activity-stats';

describe('FeatureUsageCard', () => {
  const mockStats: FeatureUsageStats = {
    personalColorAnalyses: 1200,
    skinAnalyses: 980,
    bodyAnalyses: 750,
    workoutLogs: 5600,
    mealRecords: 8900,
    changes: {
      personalColor: 5.5,
      skin: -2.3,
      body: 0,
      workout: 12.0,
      meal: -8.5,
    },
  };

  it('로딩 상태를 표시한다', () => {
    render(<FeatureUsageCard stats={null} isLoading={true} />);

    expect(screen.getByTestId('feature-usage-loading')).toBeInTheDocument();
  });

  it('stats가 null이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<FeatureUsageCard stats={null} isLoading={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('기능별 사용 현황을 표시한다', () => {
    render(<FeatureUsageCard stats={mockStats} isLoading={false} />);

    expect(screen.getByTestId('feature-usage-card')).toBeInTheDocument();
    expect(screen.getByText('퍼스널 컬러 분석')).toBeInTheDocument();
    expect(screen.getByText('피부 분석')).toBeInTheDocument();
    expect(screen.getByText('체형 분석')).toBeInTheDocument();
    expect(screen.getByText('운동 기록')).toBeInTheDocument();
    expect(screen.getByText('식사 기록')).toBeInTheDocument();
  });

  it('기능별 수치를 표시한다', () => {
    render(<FeatureUsageCard stats={mockStats} isLoading={false} />);

    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('980')).toBeInTheDocument();
    expect(screen.getByText('750')).toBeInTheDocument();
    expect(screen.getByText('5,600')).toBeInTheDocument();
    expect(screen.getByText('8,900')).toBeInTheDocument();
  });

  it('제목과 설명을 표시한다', () => {
    render(<FeatureUsageCard stats={mockStats} isLoading={false} />);

    expect(screen.getByText('기능별 사용 현황')).toBeInTheDocument();
    expect(screen.getByText('전체 누적 및 오늘 변화')).toBeInTheDocument();
  });
});
