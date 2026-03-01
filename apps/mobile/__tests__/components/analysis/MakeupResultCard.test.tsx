/**
 * MakeupResultCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MakeupResultCard } from '../../../components/analysis/MakeupResultCard';

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

describe('MakeupResultCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MakeupResultCard undertone="warm" overallScore={82} confidence={90} />,
    );
    expect(getByTestId('makeup-result-card')).toBeTruthy();
  });

  it('언더톤을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MakeupResultCard undertone="warm" overallScore={82} confidence={90} />,
    );
    expect(getByText('웜톤')).toBeTruthy();
  });

  it('쿨톤을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MakeupResultCard undertone="cool" overallScore={78} confidence={85} />,
    );
    expect(getByText('쿨톤')).toBeTruthy();
  });

  it('점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MakeupResultCard undertone="warm" overallScore={82} confidence={90} />,
    );
    expect(getByText('82')).toBeTruthy();
  });

  it('얼굴 특징 뱃지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MakeupResultCard
        undertone="warm"
        overallScore={82}
        confidence={90}
        features={{ eyeShape: '쌍꺼풀', lipShape: '도톰한 입술' }}
      />,
    );
    expect(getByText(/쌍꺼풀/)).toBeTruthy();
    expect(getByText(/도톰한 입술/)).toBeTruthy();
  });

  it('인사이트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MakeupResultCard
        undertone="neutral"
        overallScore={80}
        confidence={88}
        insight="다양한 컬러가 잘 어울리는 뉴트럴 톤입니다"
      />,
    );
    expect(getByText(/다양한 컬러가 잘 어울리는/)).toBeTruthy();
  });

  it('스타일 탭으로 전환한다', () => {
    const styles = [{ id: '1', name: '내추럴', description: '자연스러운 메이크업', suitability: 95 }];
    const { getByText } = renderWithTheme(
      <MakeupResultCard undertone="warm" overallScore={82} confidence={90} styles={styles} />,
    );
    fireEvent.press(getByText('추천 스타일'));
    expect(getByText('내추럴')).toBeTruthy();
    expect(getByText('95%')).toBeTruthy();
  });

  it('컬러 카테고리를 표시한다', () => {
    const colorCategories = [
      { id: '1', category: '립', colors: [{ name: '코랄', hex: '#FF7F50' }] },
    ];
    const { getByText } = renderWithTheme(
      <MakeupResultCard undertone="warm" overallScore={82} confidence={90} colorCategories={colorCategories} />,
    );
    expect(getByText('립')).toBeTruthy();
    expect(getByText('코랄')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <MakeupResultCard undertone="warm" overallScore={82} confidence={90} />,
    );
    expect(getByLabelText(/메이크업 분석 결과.*웜톤.*82점/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MakeupResultCard undertone="cool" overallScore={78} confidence={85} />,
      true,
    );
    expect(getByTestId('makeup-result-card')).toBeTruthy();
  });
});
