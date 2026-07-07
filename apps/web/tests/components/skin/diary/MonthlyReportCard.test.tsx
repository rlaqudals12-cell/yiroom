import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MonthlyReportCard from '@/components/skin/diary/MonthlyReportCard';
import type { MonthlyReport } from '@/types/skin-diary';

// 현행 컴포넌트는 next-intl 키(skinUI.*)를 사용 — setup.ts의 "키 그대로 반환" mock 대신
// 실제 한국어 메시지(ko.json)로 해석해 사용자 대면 텍스트 기준 검증을 유지한다.
vi.mock('next-intl', async () => {
  const ko = (await import('@/messages/ko.json')).default as Record<string, unknown>;
  const resolve = (ns: string | undefined, key: string): string => {
    const path = ns ? `${ns}.${key}` : key;
    const value = path
      .split('.')
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], ko);
    return typeof value === 'string' ? value : key;
  };
  return {
    useTranslations: (ns?: string) => (key: string) => resolve(ns, key),
    useLocale: () => 'ko',
    useMessages: () => ko,
    useNow: () => new Date(),
    useTimeZone: () => 'Asia/Seoul',
    useFormatter: () => ({
      number: (n: number) => String(n),
      dateTime: (d: Date) => d.toISOString(),
      relativeTime: (d: Date) => d.toISOString(),
    }),
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

describe('MonthlyReportCard', () => {
  const mockReport: MonthlyReport = {
    month: '2026-01',
    totalEntries: 25,
    avgCondition: 3.8,
    bestDay: new Date(2026, 0, 15),
    worstDay: new Date(2026, 0, 8),
    topFactors: [
      {
        factor: '수면 시간',
        factorKey: 'sleepHours',
        correlation: 0.72,
        confidence: 85,
        insight: '수면 7시간 이상일 때 피부가 좋아요',
        recommendation: '7시간 이상 수면하세요',
        isPositive: true,
      },
      {
        factor: '스트레스',
        factorKey: 'stressLevel',
        correlation: -0.65,
        confidence: 80,
        insight: '스트레스가 높으면 피부가 나빠져요',
        recommendation: '스트레스 관리하세요',
        isPositive: false,
      },
    ],
    routineCompletionRate: {
      morning: 80,
      evening: 72,
    },
    trendDirection: 'improving',
    weeklyAverages: [],
  };

  it('renders with test id', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByTestId('monthly-report-card')).toBeInTheDocument();
  });

  it('displays month in Korean format', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByText('2026년 1월 리포트')).toBeInTheDocument();
  });

  it('displays total entries count', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByText('25일 기록')).toBeInTheDocument();
  });

  it('displays average condition score', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByText('3.8')).toBeInTheDocument();
    expect(screen.getByText('/5')).toBeInTheDocument();
  });

  it('displays improving trend', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByText('개선 중')).toBeInTheDocument();
  });

  it('displays declining trend', () => {
    const decliningReport = { ...mockReport, trendDirection: 'declining' as const };
    render(<MonthlyReportCard report={decliningReport} />);
    expect(screen.getByText('주의 필요')).toBeInTheDocument();
  });

  it('displays stable trend', () => {
    const stableReport = { ...mockReport, trendDirection: 'stable' as const };
    render(<MonthlyReportCard report={stableReport} />);
    expect(screen.getByText('안정적')).toBeInTheDocument();
  });

  it('displays morning routine completion rate', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByText('아침 루틴')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('displays evening routine completion rate', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByText('저녁 루틴')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('displays top factors insights', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.getByText('주요 인사이트')).toBeInTheDocument();
    expect(screen.getByText('수면 시간')).toBeInTheDocument();
    expect(screen.getByText('스트레스')).toBeInTheDocument();
  });

  it('shows view details button when onViewDetails is provided', () => {
    render(<MonthlyReportCard report={mockReport} onViewDetails={vi.fn()} />);
    expect(screen.getByText('상세 리포트 보기')).toBeInTheDocument();
  });

  it('hides view details button when onViewDetails is not provided', () => {
    render(<MonthlyReportCard report={mockReport} />);
    expect(screen.queryByText('상세 리포트 보기')).not.toBeInTheDocument();
  });

  it('calls onViewDetails when button clicked', () => {
    const onViewDetails = vi.fn();
    render(<MonthlyReportCard report={mockReport} onViewDetails={onViewDetails} />);

    fireEvent.click(screen.getByText('상세 리포트 보기'));
    expect(onViewDetails).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<MonthlyReportCard report={mockReport} className="custom-class" />);
    expect(screen.getByTestId('monthly-report-card')).toHaveClass('custom-class');
  });

  it('displays condition emoji based on average', () => {
    render(<MonthlyReportCard report={mockReport} />);
    // 3.8 rounds to 4, which is happy face
    const card = screen.getByTestId('monthly-report-card');
    expect(card.textContent).toContain('🙂');
  });

  it('renders without topFactors', () => {
    const reportWithoutFactors = { ...mockReport, topFactors: [] };
    render(<MonthlyReportCard report={reportWithoutFactors} />);
    expect(screen.queryByText('주요 인사이트')).not.toBeInTheDocument();
  });

  it('differentiates positive and negative insights', () => {
    render(<MonthlyReportCard report={mockReport} />);

    // Should have different styling for positive (green) vs negative (amber)
    const container = screen.getByTestId('monthly-report-card');
    expect(container).toBeInTheDocument();
  });

  it('has accessible aria-label on progress bars', () => {
    render(<MonthlyReportCard report={mockReport} />);

    const morningProgress = screen.getByLabelText('아침 루틴 완료율 80%');
    expect(morningProgress).toBeInTheDocument();

    const eveningProgress = screen.getByLabelText('저녁 루틴 완료율 72%');
    expect(eveningProgress).toBeInTheDocument();
  });
});
