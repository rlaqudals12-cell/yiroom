import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FactorTrendChart from '@/components/skin/diary/FactorTrendChart';
import type { SkinDiaryEntry } from '@/types/skin-diary';

describe('FactorTrendChart', () => {
  // 현재 날짜를 고정하여 테스트 안정성 확보
  const fixedDate = new Date('2026-01-10T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  });

  const createMockEntry = (daysAgo: number, skinCondition: 1 | 2 | 3 | 4 | 5): SkinDiaryEntry => {
    const date = new Date(fixedDate);
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `entry-${daysAgo}`,
      clerkUserId: 'user-1',
      entryDate: date,
      skinCondition,
      morningRoutineCompleted: false,
      eveningRoutineCompleted: false,
      specialTreatments: [],
      createdAt: date,
      updatedAt: date,
    };
  };

  it('renders with test id', () => {
    const entries = [createMockEntry(0, 3), createMockEntry(1, 4)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    expect(screen.getByTestId('factor-trend-chart')).toBeInTheDocument();
  });

  it('displays title', () => {
    const entries = [createMockEntry(0, 3), createMockEntry(1, 4)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    expect(screen.getByText('피부 컨디션 트렌드')).toBeInTheDocument();
  });

  it('shows 7 days period label', () => {
    const entries = [createMockEntry(0, 3)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    expect(screen.getByText('최근 7일')).toBeInTheDocument();
  });

  it('shows 30 days period label', () => {
    const entries = [createMockEntry(0, 3)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="30days" />);
    expect(screen.getByText('최근 30일')).toBeInTheDocument();
  });

  it('shows 90 days period label', () => {
    const entries = [createMockEntry(0, 3)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="90days" />);
    expect(screen.getByText('최근 90일')).toBeInTheDocument();
  });

  it('shows empty state when no entries in period', () => {
    // 기간 외의 데이터만 제공
    const entries = [createMockEntry(100, 3)]; // 100일 전 = 7일 기간 외
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    expect(screen.getByText('최근 7일 동안 기록이 없습니다')).toBeInTheDocument();
  });

  it('displays average condition', () => {
    const entries = [createMockEntry(0, 3), createMockEntry(1, 4), createMockEntry(2, 5)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    // 평균: (3+4+5)/3 = 4.0
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('displays record count', () => {
    const entries = [createMockEntry(0, 3), createMockEntry(1, 4), createMockEntry(2, 5)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    expect(screen.getByText('3일')).toBeInTheDocument();
  });

  it('shows average condition label', () => {
    const entries = [createMockEntry(0, 3)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    expect(screen.getByText('평균 컨디션')).toBeInTheDocument();
  });

  it('shows record count label', () => {
    const entries = [createMockEntry(0, 3)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    expect(screen.getByText('기록 일수')).toBeInTheDocument();
  });

  it('renders legend for all condition scores', () => {
    const entries = [createMockEntry(0, 3)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);

    // 범례에 1~5점이 모두 표시되어야 함
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`${i}점`)).toBeInTheDocument();
    }
  });

  it('filters entries by 7 days period', () => {
    const entries = [
      createMockEntry(0, 5), // 오늘 - 포함
      createMockEntry(5, 4), // 5일 전 - 포함
      createMockEntry(10, 3), // 10일 전 - 제외
    ];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);

    // 7일 내 데이터만 포함되어야 함 (2개)
    expect(screen.getByText('2일')).toBeInTheDocument();
    // 평균: (5+4)/2 = 4.5
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('filters entries by 30 days period', () => {
    const entries = [
      createMockEntry(0, 5), // 오늘 - 포함
      createMockEntry(20, 4), // 20일 전 - 포함
      createMockEntry(40, 3), // 40일 전 - 제외
    ];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="30days" />);

    // 30일 내 데이터만 포함되어야 함 (2개)
    expect(screen.getByText('2일')).toBeInTheDocument();
  });

  it('filters entries by 90 days period', () => {
    const entries = [
      createMockEntry(0, 5), // 오늘 - 포함
      createMockEntry(60, 4), // 60일 전 - 포함
      createMockEntry(100, 3), // 100일 전 - 제외
    ];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="90days" />);

    // 90일 내 데이터만 포함되어야 함 (2개)
    expect(screen.getByText('2일')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const entries = [createMockEntry(0, 3)];
    render(
      <FactorTrendChart
        entries={entries}
        factor="skinCondition"
        period="7days"
        className="custom-class"
      />
    );
    expect(screen.getByTestId('factor-trend-chart')).toHaveClass('custom-class');
  });

  it('renders SVG chart element', () => {
    const entries = [createMockEntry(0, 3), createMockEntry(1, 4)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);

    // SVG 요소가 렌더링되어야 함
    const chart = screen.getByTestId('factor-trend-chart');
    expect(chart.querySelector('svg')).toBeInTheDocument();
  });

  it('shows condition emojis in Y axis', () => {
    const entries = [createMockEntry(0, 3)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);

    // Y축에 이모지가 표시되어야 함
    const container = screen.getByTestId('factor-trend-chart');
    // 이모지 확인 (CONDITION_EMOJIS에 정의된 이모지)
    expect(container.textContent).toContain('😊'); // 5점
    expect(container.textContent).toContain('😫'); // 1점
  });

  it('calculates correct average for multiple entries', () => {
    const entries = [
      createMockEntry(0, 1),
      createMockEntry(1, 2),
      createMockEntry(2, 3),
      createMockEntry(3, 4),
      createMockEntry(4, 5),
    ];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);
    // 평균: (1+2+3+4+5)/5 = 3.0
    expect(screen.getByText('3.0')).toBeInTheDocument();
  });

  it('sorts entries by date', () => {
    // 순서가 섞인 엔트리
    const entries = [createMockEntry(2, 3), createMockEntry(0, 5), createMockEntry(1, 4)];
    render(<FactorTrendChart entries={entries} factor="skinCondition" period="7days" />);

    // 정상적으로 렌더링되어야 함
    expect(screen.getByTestId('factor-trend-chart')).toBeInTheDocument();
    expect(screen.getByText('3일')).toBeInTheDocument();
  });
});
