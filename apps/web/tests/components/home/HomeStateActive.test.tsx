/**
 * HomeStateActive 테스트
 * KI-007 개선: 내재화 위젯이 별도 블록이 아닌 HomeActivityBar에 통합됨
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'user_123' } }),
}));

// Mock 서브 컴포넌트 — 렌더링 확인용 stub
vi.mock('@/app/(main)/home/_components/ActiveInsightCard', () => ({
  default: () => <div data-testid="active-insight-card" />,
}));
vi.mock('@/app/(main)/home/_components/HomeDailyCapsuleWidget', () => ({
  default: () => <div data-testid="home-daily-capsule" />,
}));
vi.mock('@/app/(main)/home/_components/HomeAnalysisSummary', () => ({
  default: () => <div data-testid="home-analysis-summary" />,
}));
vi.mock('@/app/(main)/home/_components/HomeActivityBar', () => ({
  default: () => <div data-testid="home-activity-bar" />,
}));
vi.mock('@/app/(main)/home/_components/HomeRecentlyViewed', () => ({
  default: () => <div data-testid="home-recently-viewed" />,
}));

// WS-11: SortableWidgetList + useWidgetOrder mock
vi.mock('@/app/(main)/home/_components/SortableWidgetList', () => ({
  default: ({ order, widgets }: { order: string[]; widgets: Record<string, React.ReactNode> }) => (
    <div data-testid="sortable-widget-list">
      {order.map((id: string) => (
        <div key={id}>{widgets[id]}</div>
      ))}
    </div>
  ),
}));
vi.mock('@/hooks/useWidgetOrder', () => ({
  useWidgetOrder: () => ({
    order: ['insight', 'capsule', 'analysis-summary', 'activity-bar', 'recently-viewed'],
    setOrder: vi.fn(),
    resetOrder: vi.fn(),
    isCustomized: false,
  }),
  DEFAULT_WIDGET_ORDER: [
    'insight',
    'capsule',
    'analysis-summary',
    'activity-bar',
    'recently-viewed',
  ],
}));

import React from 'react';
import HomeStateActive from '@/app/(main)/home/_components/HomeStateActive';

const mockAnalyses = [
  { module: 'personal_color', id: '1' },
  { module: 'skin', id: '2' },
  { module: 'body', id: '3' },
  { module: 'hair', id: '4' },
] as never[];

describe('HomeStateActive', () => {
  it('data-testid="home-state-active"가 존재한다', () => {
    render(<HomeStateActive analyses={mockAnalyses} />);
    expect(screen.getByTestId('home-state-active')).toBeInTheDocument();
  });

  it('5개 정보 블록이 렌더링된다 (KI-007 개선)', () => {
    render(<HomeStateActive analyses={mockAnalyses} />);

    expect(screen.getByTestId('active-insight-card')).toBeInTheDocument();
    expect(screen.getByTestId('home-daily-capsule')).toBeInTheDocument();
    expect(screen.getByTestId('home-analysis-summary')).toBeInTheDocument();
    expect(screen.getByTestId('home-activity-bar')).toBeInTheDocument();
    expect(screen.getByTestId('home-recently-viewed')).toBeInTheDocument();
  });

  it('InternalizationWidget이 독립 블록으로 렌더링되지 않는다', () => {
    render(<HomeStateActive analyses={mockAnalyses} />);

    // InternalizationWidget의 data-testid가 존재하지 않음
    expect(screen.queryByTestId('dashboard-internalization-widget')).not.toBeInTheDocument();
  });
});
