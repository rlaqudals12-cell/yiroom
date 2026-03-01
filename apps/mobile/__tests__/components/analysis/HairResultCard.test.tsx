/**
 * HairResultCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { HairResultCard } from '../../../components/analysis/HairResultCard';

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

const mockStyles = [
  { id: '1', name: '레이어드 컷', suitability: 92, description: '얼굴형에 맞는 스타일' },
  { id: '2', name: '웨이브 펌', suitability: 85 },
];

const mockColors = [
  { id: '1', name: '애쉬 브라운', hexColor: '#8B7355', suitability: 88 },
];

describe('HairResultCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <HairResultCard faceShape="oval" confidence={85} recommendedStyles={mockStyles} />,
    );
    expect(getByTestId('hair-result-card')).toBeTruthy();
  });

  it('얼굴형을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <HairResultCard faceShape="oval" confidence={85} recommendedStyles={mockStyles} />,
    );
    expect(getByText('타원형')).toBeTruthy();
  });

  it('신뢰도를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <HairResultCard faceShape="round" confidence={90} recommendedStyles={mockStyles} />,
    );
    expect(getByText('신뢰도 90%')).toBeTruthy();
  });

  it('스타일 탭을 기본 표시한다', () => {
    const { getByText } = renderWithTheme(
      <HairResultCard faceShape="oval" confidence={85} recommendedStyles={mockStyles} />,
    );
    expect(getByText('레이어드 컷')).toBeTruthy();
    expect(getByText('92%')).toBeTruthy();
  });

  it('컬러 탭으로 전환한다', () => {
    const { getByText } = renderWithTheme(
      <HairResultCard
        faceShape="oval"
        confidence={85}
        recommendedStyles={mockStyles}
        recommendedColors={mockColors}
      />,
    );
    fireEvent.press(getByText('추천 컬러'));
    expect(getByText('애쉬 브라운')).toBeTruthy();
  });

  it('팁 탭으로 전환한다', () => {
    const tips = [{ id: '1', title: '수분 관리', description: '주 2회 헤어팩' }];
    const { getByText } = renderWithTheme(
      <HairResultCard faceShape="oval" confidence={85} recommendedStyles={mockStyles} careTips={tips} />,
    );
    fireEvent.press(getByText('관리 팁'));
    expect(getByText('수분 관리')).toBeTruthy();
  });

  it('현재 헤어 정보를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <HairResultCard
        faceShape="oval"
        confidence={85}
        recommendedStyles={mockStyles}
        currentHairInfo={{ length: '미디엄', texture: '직모' }}
      />,
    );
    expect(getByText('미디엄')).toBeTruthy();
    expect(getByText('직모')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <HairResultCard faceShape="heart" confidence={88} recommendedStyles={mockStyles} />,
    );
    expect(getByLabelText(/헤어 분석 결과.*하트형.*88%/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <HairResultCard faceShape="oval" confidence={85} recommendedStyles={mockStyles} />,
      true,
    );
    expect(getByTestId('hair-result-card')).toBeTruthy();
  });
});
