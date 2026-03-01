/**
 * LevelUpModal 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { LevelUpModal } from '../../../components/gamification/LevelUpModal';

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

describe('LevelUpModal', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<LevelUpModal newLevel={10} />);
    expect(getByTestId('level-up-modal')).toBeTruthy();
  });

  it('레벨업 텍스트를 표시한다', () => {
    const { getByText } = renderWithTheme(<LevelUpModal newLevel={10} />);
    expect(getByText('레벨업!')).toBeTruthy();
    expect(getByText('Lv.10')).toBeTruthy();
  });

  it('보상을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LevelUpModal newLevel={10} rewards={['골드 뱃지', '특별 칭호']} />,
    );
    expect(getByText('보상')).toBeTruthy();
    expect(getByText('🎁 골드 뱃지')).toBeTruthy();
    expect(getByText('🎁 특별 칭호')).toBeTruthy();
  });

  it('onClose 콜백이 호출된다', () => {
    const onClose = jest.fn();
    const { getByText } = renderWithTheme(
      <LevelUpModal newLevel={10} onClose={onClose} />,
    );
    fireEvent.press(getByText('확인'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<LevelUpModal newLevel={10} />);
    expect(getByLabelText('레벨업! 레벨 10 달성')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<LevelUpModal newLevel={10} />, true);
    expect(getByTestId('level-up-modal')).toBeTruthy();
  });
});
