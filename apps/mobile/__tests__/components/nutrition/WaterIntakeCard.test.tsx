/**
 * WaterIntakeCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WaterIntakeCard } from '../../../components/nutrition/WaterIntakeCard';

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

describe('WaterIntakeCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} />,
    );
    expect(getByTestId('water-intake-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} />,
    );
    expect(getByText('💧 수분 섭취')).toBeTruthy();
  });

  it('현재 섭취량을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} />,
    );
    expect(getByText('1000')).toBeTruthy();
    expect(getByText('/ 2000ml')).toBeTruthy();
  });

  it('퍼센트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} />,
    );
    expect(getByText('50%')).toBeTruthy();
  });

  it('목표 달성 시 달성 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={2000} goal={2000} />,
    );
    expect(getByText('달성!')).toBeTruthy();
  });

  it('추가 버튼이 동작한다', () => {
    const onAdd = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} onAdd={onAdd} />,
    );
    fireEvent.press(getByLabelText('250ml 추가'));
    expect(onAdd).toHaveBeenCalledWith(250);
  });

  it('감소 버튼이 동작한다', () => {
    const onRemove = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} onRemove={onRemove} />,
    );
    fireEvent.press(getByLabelText('250ml 감소'));
    expect(onRemove).toHaveBeenCalledWith(250);
  });

  it('커스텀 스텝을 사용한다', () => {
    const onAdd = jest.fn();
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} step={500} onAdd={onAdd} />,
    );
    expect(getByText('+500ml')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} />,
    );
    expect(getByLabelText('수분 섭취 1000/2000ml, 50% 달성')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WaterIntakeCard current={1000} goal={2000} />, true,
    );
    expect(getByTestId('water-intake-card')).toBeTruthy();
  });
});
