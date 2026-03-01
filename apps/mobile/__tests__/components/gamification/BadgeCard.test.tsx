/**
 * BadgeCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { BadgeCard } from '../../../components/gamification/BadgeCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}
function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(<ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>);
}

describe('BadgeCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <BadgeCard id="1" name="첫 분석" emoji="📸" description="첫 AI 분석 완료" isUnlocked />,
    );
    expect(getByTestId('badge-card')).toBeTruthy();
  });

  it('뱃지 이름과 설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <BadgeCard id="1" name="첫 분석" emoji="📸" description="첫 AI 분석 완료" isUnlocked />,
    );
    expect(getByText('첫 분석')).toBeTruthy();
    expect(getByText('첫 AI 분석 완료')).toBeTruthy();
  });

  it('이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <BadgeCard id="1" name="첫 분석" emoji="📸" description="설명" isUnlocked />,
    );
    expect(getByText('📸')).toBeTruthy();
  });

  it('해금 날짜를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <BadgeCard id="1" name="첫 분석" emoji="📸" description="설명" isUnlocked unlockedAt="2026.01.15" />,
    );
    expect(getByText('2026.01.15')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <BadgeCard id="b1" name="첫 분석" emoji="📸" description="설명" isUnlocked onPress={onPress} />,
    );
    fireEvent.press(getByTestId('badge-card'));
    expect(onPress).toHaveBeenCalledWith('b1');
  });

  it('해금 상태 접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <BadgeCard id="1" name="첫 분석" emoji="📸" description="설명" isUnlocked />,
    );
    expect(getByLabelText('첫 분석 뱃지, 해금됨')).toBeTruthy();
  });

  it('미해금 상태 접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <BadgeCard id="1" name="첫 분석" emoji="📸" description="설명" isUnlocked={false} />,
    );
    expect(getByLabelText('첫 분석 뱃지, 미해금')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <BadgeCard id="1" name="첫 분석" emoji="📸" description="설명" isUnlocked />,
      true,
    );
    expect(getByTestId('badge-card')).toBeTruthy();
  });
});
