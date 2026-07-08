/**
 * HomeStateActive 테스트 (ADR-114)
 * 위젯 대시보드 → 브리핑 홈. Active 상태는 DailyBriefing을 렌더한다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// DailyBriefing은 별도 테스트 — 여기선 stub
vi.mock('@/app/(main)/home/_components/DailyBriefing', () => ({
  default: ({ analyses }: { analyses: unknown[] }) => (
    <div data-testid="daily-briefing" data-count={analyses.length} />
  ),
}));

import HomeStateActive from '@/app/(main)/home/_components/HomeStateActive';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

const mockAnalyses = [
  { id: '1', type: 'personal-color', createdAt: new Date(), summary: '봄 웜톤' },
  { id: '2', type: 'skin', createdAt: new Date(), summary: '80점' },
  { id: '3', type: 'body', createdAt: new Date(), summary: '스트레이트' },
  { id: '4', type: 'hair', createdAt: new Date(), summary: '직모' },
] as AnalysisSummary[];

describe('HomeStateActive', () => {
  it('data-testid="home-state-active"가 존재한다', () => {
    render(<HomeStateActive analyses={mockAnalyses} />);
    expect(screen.getByTestId('home-state-active')).toBeInTheDocument();
  });

  it('DailyBriefing을 분석 데이터와 함께 렌더한다', () => {
    render(<HomeStateActive analyses={mockAnalyses} />);
    const briefing = screen.getByTestId('daily-briefing');
    expect(briefing).toBeInTheDocument();
    expect(briefing).toHaveAttribute('data-count', '4');
  });

  it('위젯 드래그 정렬(SortableWidgetList)이 더는 렌더되지 않는다', () => {
    render(<HomeStateActive analyses={mockAnalyses} />);
    expect(screen.queryByTestId('sortable-widget-list')).not.toBeInTheDocument();
  });
});
