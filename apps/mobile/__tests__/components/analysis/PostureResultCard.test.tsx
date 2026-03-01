/**
 * PostureResultCard 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { PostureResultCard } from '../../../components/analysis/PostureResultCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>,
  );
}

describe('PostureResultCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <PostureResultCard postureType="ideal" overallScore={90} confidence={88} />,
    );
    expect(getByTestId('posture-result-card')).toBeTruthy();
  });

  it('자세 유형을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <PostureResultCard postureType="forward_head" overallScore={55} confidence={85} />,
    );
    expect(getByText('거북목')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <PostureResultCard postureType="ideal" overallScore={90} confidence={88} />,
    );
    expect(getByText('90')).toBeTruthy();
  });

  it('이상적 자세 배너를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <PostureResultCard postureType="ideal" overallScore={90} confidence={88} />,
    );
    expect(getByText(/이상적인 자세를 유지/)).toBeTruthy();
  });

  it('이슈 카운트 경고를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <PostureResultCard postureType="forward_head" overallScore={55} confidence={85} issueCount={3} />,
    );
    expect(getByText(/3개 항목이 개선이 필요/)).toBeTruthy();
  });

  it('전면 측정을 표시한다', () => {
    const frontMeasurements = [
      { name: '어깨 대칭', value: 2.5, unit: '°', status: 'good' as const },
      { name: '골반 대칭', value: 4.1, unit: '°', status: 'warning' as const },
    ];
    const { getByText } = renderWithTheme(
      <PostureResultCard
        postureType="rounded_shoulders"
        overallScore={65}
        confidence={80}
        frontMeasurements={frontMeasurements}
      />,
    );
    expect(getByText('전면 분석')).toBeTruthy();
    expect(getByText('어깨 대칭')).toBeTruthy();
    expect(getByText('2.5°')).toBeTruthy();
  });

  it('측면 측정을 표시한다', () => {
    const sideMeasurements = [
      { name: '머리 전방 각도', value: 15, unit: '°', status: 'alert' as const },
    ];
    const { getByText } = renderWithTheme(
      <PostureResultCard
        postureType="forward_head"
        overallScore={55}
        confidence={85}
        sideMeasurements={sideMeasurements}
      />,
    );
    expect(getByText('측면 분석')).toBeTruthy();
    expect(getByText('머리 전방 각도')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <PostureResultCard postureType="kyphosis" overallScore={60} confidence={82} />,
    );
    expect(getByLabelText(/자세 분석 결과.*등굽음증.*60점/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <PostureResultCard postureType="ideal" overallScore={90} confidence={88} />,
      true,
    );
    expect(getByTestId('posture-result-card')).toBeTruthy();
  });
});
