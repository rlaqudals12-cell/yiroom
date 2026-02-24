/**
 * 분석 시각화 컴포넌트 테스트
 *
 * AnalysisTimeline, ComparisonCard
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { AnalysisTimeline } from '../../../components/analysis/AnalysisTimeline';
import { ComparisonCard } from '../../../components/analysis/ComparisonCard';
import type { AnalysisSummary } from '../../../hooks/useUserAnalyses';
import type { MetricComparison } from '../../../components/analysis/ComparisonCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ========================================
// Mock 데이터
// ========================================

function createMockAnalysis(overrides: Partial<AnalysisSummary> = {}): AnalysisSummary {
  return {
    id: 'analysis-1',
    type: 'personal-color',
    createdAt: new Date('2026-02-20'),
    summary: '봄 웜톤으로 분석되었어요',
    ...overrides,
  };
}

function createMockMetrics(): MetricComparison[] {
  return [
    { label: '수분도', previous: 60, current: 72 },
    { label: '탄력', previous: 55, current: 58 },
    { label: '모공', previous: 40, current: 45 },
  ];
}

// ========================================
// AnalysisTimeline
// ========================================

describe('AnalysisTimeline', () => {
  it('분석 이력을 표시해야 한다', () => {
    const analyses = [
      createMockAnalysis({ id: 'a1', type: 'personal-color', summary: '봄 웜톤' }),
      createMockAnalysis({ id: 'a2', type: 'skin', summary: '복합성 피부' }),
    ];
    const { getByText } = renderWithTheme(
      <AnalysisTimeline analyses={analyses} />
    );
    expect(getByText('봄 웜톤')).toBeTruthy();
    expect(getByText('복합성 피부')).toBeTruthy();
  });

  it('분석 타입 라벨을 표시해야 한다', () => {
    const analyses = [
      createMockAnalysis({ type: 'personal-color' }),
      createMockAnalysis({ id: 'a2', type: 'skin', summary: '피부' }),
      createMockAnalysis({ id: 'a3', type: 'body', summary: '체형' }),
    ];
    const { getByText } = renderWithTheme(
      <AnalysisTimeline analyses={analyses} />
    );
    expect(getByText('퍼스널컬러')).toBeTruthy();
    expect(getByText('피부 분석')).toBeTruthy();
    expect(getByText('체형 분석')).toBeTruthy();
  });

  it('헤더 타이틀을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <AnalysisTimeline analyses={[createMockAnalysis()]} />
    );
    expect(getByText('분석 이력')).toBeTruthy();
  });

  it('빈 배열일 때 안내 메시지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <AnalysisTimeline analyses={[]} />
    );
    expect(getByText('아직 분석 기록이 없어요')).toBeTruthy();
  });

  it('onItemPress 호출 시 분석 데이터를 전달해야 한다', () => {
    const onPress = jest.fn();
    const analysis = createMockAnalysis();
    const { getByText } = renderWithTheme(
      <AnalysisTimeline analyses={[analysis]} onItemPress={onPress} />
    );
    fireEvent.press(getByText('봄 웜톤으로 분석되었어요'));
    expect(onPress).toHaveBeenCalledWith(analysis);
  });

  it('최신순으로 정렬해야 한다', () => {
    const older = createMockAnalysis({
      id: 'old',
      createdAt: new Date('2026-02-10'),
      summary: '이전 분석',
    });
    const newer = createMockAnalysis({
      id: 'new',
      createdAt: new Date('2026-02-20'),
      summary: '최신 분석',
    });
    const { getAllByText } = renderWithTheme(
      <AnalysisTimeline analyses={[older, newer]} />
    );
    // 퍼스널컬러 라벨이 2개 (최신→이전 순서)
    const labels = getAllByText('퍼스널컬러');
    expect(labels).toHaveLength(2);
  });

  it('알 수 없는 타입은 무시해야 한다', () => {
    const unknown = createMockAnalysis({ type: 'unknown-type' as 'personal-color' });
    const { queryByText } = renderWithTheme(
      <AnalysisTimeline analyses={[unknown]} />
    );
    expect(queryByText('봄 웜톤으로 분석되었어요')).toBeNull();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <AnalysisTimeline analyses={[]} testID="timeline" />
    );
    expect(getByTestId('timeline')).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <AnalysisTimeline analyses={[createMockAnalysis()]} />,
      true,
    );
    expect(getByText('분석 이력')).toBeTruthy();
  });

  it('상대 날짜를 표시해야 한다', () => {
    const today = new Date();
    const analysis = createMockAnalysis({ createdAt: today });
    const { getByText } = renderWithTheme(
      <AnalysisTimeline analyses={[analysis]} />
    );
    expect(getByText('오늘')).toBeTruthy();
  });

  it('접근성 라벨이 분석 정보를 포함해야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <AnalysisTimeline analyses={[createMockAnalysis()]} />
    );
    expect(getByLabelText(/퍼스널컬러.*봄 웜톤/)).toBeTruthy();
  });
});

// ========================================
// ComparisonCard
// ========================================

describe('ComparisonCard', () => {
  const defaultMetrics = createMockMetrics();

  it('타이틀을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard title="피부 분석 비교" metrics={defaultMetrics} />
    );
    expect(getByText('피부 분석 비교')).toBeTruthy();
  });

  it('지표 라벨을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={defaultMetrics} />
    );
    expect(getByText('수분도')).toBeTruthy();
    expect(getByText('탄력')).toBeTruthy();
    expect(getByText('모공')).toBeTruthy();
  });

  it('이전/현재 값을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={[{ label: '수분도', previous: 60, current: 72 }]} />
    );
    expect(getByText('60')).toBeTruthy();
    expect(getByText('72')).toBeTruthy();
  });

  it('총점 변화 뱃지를 표시해야 한다 (상승)', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard
        title="비교"
        metrics={defaultMetrics}
        previousTotal={60}
        currentTotal={75}
      />
    );
    expect(getByText('+15점')).toBeTruthy();
  });

  it('총점 변화 뱃지를 표시해야 한다 (하락)', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard
        title="비교"
        metrics={defaultMetrics}
        previousTotal={80}
        currentTotal={70}
      />
    );
    expect(getByText('-10점')).toBeTruthy();
  });

  it('총점이 없으면 뱃지를 숨겨야 한다', () => {
    const { queryByText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={defaultMetrics} />
    );
    expect(queryByText(/점$/)).toBeNull();
  });

  it('빈 metrics일 때 기본 안내 메시지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={[]} />
    );
    expect(getByText('비교할 이전 데이터가 없어요')).toBeTruthy();
  });

  it('첫 분석 시 격려 메시지를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={[]} isFirstAnalysis />
    );
    expect(getByText(/첫 분석이에요/)).toBeTruthy();
  });

  it('컬럼 헤더를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={defaultMetrics} />
    );
    expect(getByText('지표')).toBeTruthy();
    expect(getByText('이전')).toBeTruthy();
    expect(getByText('현재')).toBeTruthy();
    expect(getByText('변화')).toBeTruthy();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ComparisonCard title="비교" metrics={[]} testID="comparison" />
    );
    expect(getByTestId('comparison')).toBeTruthy();
  });

  it('접근성 라벨이 지표 수를 포함해야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={defaultMetrics} />
    );
    expect(getByLabelText(/3개 지표/)).toBeTruthy();
  });

  it('접근성 라벨이 총점 변화를 포함해야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ComparisonCard
        title="비교"
        metrics={defaultMetrics}
        previousTotal={60}
        currentTotal={75}
      />
    );
    expect(getByLabelText(/\+15점/)).toBeTruthy();
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ComparisonCard title="비교" metrics={defaultMetrics} />,
      true,
    );
    expect(getByText('비교')).toBeTruthy();
    expect(getByText('수분도')).toBeTruthy();
  });
});
