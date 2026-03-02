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
      <WaterIntakeCard current={1000} target={2000} />,
    );
    expect(getByTestId('water-intake-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={1000} target={2000} />,
    );
    expect(getByText('수분 섭취')).toBeTruthy();
  });

  it('퍼센트를 표시한다', () => {
    const { getAllByText } = renderWithTheme(
      <WaterIntakeCard current={1000} target={2000} />,
    );
    // 헤더와 원형 프로그레스 양쪽에 퍼센트가 표시됨
    expect(getAllByText('50%').length).toBeGreaterThanOrEqual(1);
  });

  it('현재 섭취량을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={1500} target={2000} />,
    );
    expect(getByText('목표 2000ml')).toBeTruthy();
  });

  it('남은 양을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={1500} target={2000} />,
    );
    expect(getByText('500ml 남음')).toBeTruthy();
  });

  it('목표 달성 시 달성 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WaterIntakeCard current={2000} target={2000} />,
    );
    expect(getByText('목표 달성!')).toBeTruthy();
    expect(getByText('목표 달성')).toBeTruthy();
  });

  it('물 한 잔 추가 버튼이 동작한다', () => {
    const onAddGlass = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <WaterIntakeCard current={1000} target={2000} onAddGlass={onAddGlass} />,
    );
    fireEvent.press(getByLabelText('물 한 잔 (250ml) 추가'));
    expect(onAddGlass).toHaveBeenCalled();
  });

  it('onAddGlass가 없으면 버튼이 표시되지 않는다', () => {
    const { queryByLabelText } = renderWithTheme(
      <WaterIntakeCard current={1000} target={2000} />,
    );
    expect(queryByLabelText('물 한 잔 (250ml) 추가')).toBeNull();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <WaterIntakeCard current={1000} target={2000} />,
    );
    expect(getByLabelText('수분 섭취 1000ml / 2000ml, 50% 달성')).toBeTruthy();
  });

  it('커스텀 testID를 사용한다', () => {
    const { getByTestId } = renderWithTheme(
      <WaterIntakeCard current={500} target={2000} testID="custom-water" />,
    );
    expect(getByTestId('custom-water')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WaterIntakeCard current={1000} target={2000} />, true,
    );
    expect(getByTestId('water-intake-card')).toBeTruthy();
  });
});
