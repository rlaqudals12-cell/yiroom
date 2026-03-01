/**
 * StretchingRecommendation 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { StretchingRecommendation, type StretchingItem } from '../../../components/analysis/StretchingRecommendation';

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

const mockItems: StretchingItem[] = [
  { id: '1', name: '목 스트레칭', targetArea: '목/어깨', difficulty: 'easy', duration: '30초', frequency: '매일' },
  { id: '2', name: '가슴 열기', targetArea: '가슴/어깨', difficulty: 'medium', duration: '1분', frequency: '주 3회', description: '가슴을 열어 라운드 숄더를 교정합니다' },
  { id: '3', name: '코어 플랭크', targetArea: '코어', difficulty: 'hard', duration: '1분', frequency: '주 5회' },
];

describe('StretchingRecommendation', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
    );
    expect(getByTestId('stretching-recommendation')).toBeTruthy();
  });

  it('스트레칭 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
    );
    expect(getByText('목 스트레칭')).toBeTruthy();
    expect(getByText('가슴 열기')).toBeTruthy();
    expect(getByText('코어 플랭크')).toBeTruthy();
  });

  it('난이도 뱃지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
    );
    expect(getByText('쉬움')).toBeTruthy();
    expect(getByText('보통')).toBeTruthy();
    expect(getByText('어려움')).toBeTruthy();
  });

  it('대상 부위를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
    );
    expect(getByText('목/어깨')).toBeTruthy();
    expect(getByText('코어')).toBeTruthy();
  });

  it('시간과 빈도를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
    );
    expect(getByText(/30초/)).toBeTruthy();
    expect(getByText(/매일/)).toBeTruthy();
  });

  it('설명이 있으면 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
    );
    expect(getByText(/가슴을 열어 라운드 숄더를 교정/)).toBeTruthy();
  });

  it('안내 배너를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} showGuidance />,
    );
    expect(getByText(/꾸준한 스트레칭이 자세 교정의 핵심/)).toBeTruthy();
  });

  it('안내 배너를 숨길 수 있다', () => {
    const { queryByText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} showGuidance={false} />,
    );
    expect(queryByText(/꾸준한 스트레칭이 자세 교정의 핵심/)).toBeNull();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
    );
    expect(getByLabelText(/스트레칭 추천 3개/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StretchingRecommendation recommendations={mockItems} />,
      true,
    );
    expect(getByTestId('stretching-recommendation')).toBeTruthy();
  });
});
