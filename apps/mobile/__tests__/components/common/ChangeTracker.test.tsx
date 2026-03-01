/**
 * ChangeTracker 컴포넌트 테스트
 *
 * 비포/애프터 점수 비교 카드
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { ChangeTracker } from '../../../components/common/ChangeTracker';
import type { ChangeTrackerItem } from '../../../components/common/ChangeTracker';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>,
  );
}

const mockItems: ChangeTrackerItem[] = [
  { label: '수분', before: 60, after: 75, unit: '점' },
  { label: '유분', before: 70, after: 55, unit: '점', higherIsBetter: false },
  { label: '탄력', before: 80, after: 80 },
];

describe('ChangeTracker', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ChangeTracker title="피부 변화" items={mockItems} />,
    );
    expect(getByTestId('change-tracker')).toBeTruthy();
  });

  it('타이틀이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <ChangeTracker title="피부 변화" items={mockItems} />,
    );
    expect(getByText('피부 변화')).toBeTruthy();
  });

  it('항목 라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <ChangeTracker title="변화" items={mockItems} />,
    );
    expect(getByText('수분')).toBeTruthy();
    expect(getByText('유분')).toBeTruthy();
    expect(getByText('탄력')).toBeTruthy();
  });

  it('기본 헤더 라벨 이전/현재가 표시된다', () => {
    const { getByText, getAllByText } = renderWithTheme(
      <ChangeTracker title="피부 변화" items={mockItems} />,
    );
    expect(getByText('이전')).toBeTruthy();
    expect(getByText('현재')).toBeTruthy();
    // 타이틀 "피부 변화"에서도 '변화' 포함되므로 getAllByText 사용
    expect(getAllByText(/변화/).length).toBeGreaterThanOrEqual(1);
  });

  it('커스텀 헤더 라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <ChangeTracker
        title="변화"
        items={mockItems}
        beforeLabel="1월"
        afterLabel="2월"
      />,
    );
    expect(getByText('1월')).toBeTruthy();
    expect(getByText('2월')).toBeTruthy();
  });

  it('접근성 라벨에 변화 정보가 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <ChangeTracker title="변화" items={[mockItems[0]]} />,
    );
    expect(getByLabelText(/수분.*60.*75.*증가/)).toBeTruthy();
  });

  it('variant beauty로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ChangeTracker title="뷰티" items={mockItems} variant="beauty" />,
    );
    expect(getByTestId('change-tracker')).toBeTruthy();
  });

  it('variant fitness로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ChangeTracker title="운동" items={mockItems} variant="fitness" />,
    );
    expect(getByTestId('change-tracker')).toBeTruthy();
  });

  it('빈 items 배열도 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ChangeTracker title="빈 변화" items={[]} />,
    );
    expect(getByTestId('change-tracker')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ChangeTracker title="다크" items={mockItems} />,
      true,
    );
    expect(getByTestId('change-tracker')).toBeTruthy();
  });
});
