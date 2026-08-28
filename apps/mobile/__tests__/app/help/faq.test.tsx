import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import FAQScreen from '../../../app/help/faq';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  gradeColors,
  lightColors,
  moduleColors,
  nutrientColors,
  radii,
  scoreColors,
  shadows,
  spacing,
  statusColors,
  trustColors,
  typography,
} from '../../../lib/theme/tokens';

const themeValue: ThemeContextValue = {
  colors: lightColors,
  brand,
  module: moduleColors,
  status: statusColors,
  spacing,
  radii,
  shadows,
  typography,
  isDark: false,
  colorScheme: 'light',
  themeMode: 'system',
  setThemeMode: jest.fn(),
  grade: gradeColors,
  nutrient: nutrientColors,
  score: scoreColors,
  trust: trustColors,
};

function renderScreen() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <FAQScreen />
    </ThemeContext.Provider>
  );
}

describe('FAQScreen 출시 카피 계약', () => {
  it('사진 저장 동의에 따른 실제 보관 계약을 안내한다', () => {
    const screen = renderScreen();

    fireEvent.press(screen.getByText('사진 데이터는 안전한가요?'));

    expect(screen.getByText(/동의하지 않으면 원본을 보관하지 않고/)).toBeTruthy();
    expect(screen.getByText(/동의하면 최대 1년간 보관/)).toBeTruthy();
    expect(screen.queryByText(/모든 사진은.*즉시 삭제/)).toBeNull();
  });

  it('출시에서 숨긴 운동·영양 탭 사용법을 노출하지 않는다', () => {
    const screen = renderScreen();

    expect(screen.queryByText('운동 기록은 어떻게 하나요?')).toBeNull();
    expect(screen.queryByText('식단 기록은 어떻게 하나요?')).toBeNull();
  });
});
