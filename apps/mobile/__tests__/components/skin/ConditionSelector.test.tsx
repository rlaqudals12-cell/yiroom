/**
 * ConditionSelector 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ConditionSelector, type ConditionOption } from '../../../components/skin/ConditionSelector';

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

const mockOptions: ConditionOption[] = [
  { id: 'acne', label: '여드름', emoji: '🔴' },
  { id: 'dryness', label: '건조함', emoji: '🏜️' },
  { id: 'redness', label: '홍조', emoji: '🌡️' },
];

describe('ConditionSelector', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ConditionSelector options={mockOptions} selected={[]} />,
    );
    expect(getByTestId('condition-selector')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ConditionSelector options={mockOptions} selected={[]} />,
    );
    expect(getByText('피부 증상')).toBeTruthy();
  });

  it('옵션을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ConditionSelector options={mockOptions} selected={[]} />,
    );
    expect(getByText('여드름')).toBeTruthy();
    expect(getByText('건조함')).toBeTruthy();
    expect(getByText('홍조')).toBeTruthy();
  });

  it('선택 상태를 반영한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ConditionSelector options={mockOptions} selected={['acne']} />,
    );
    expect(getByLabelText('여드름, 선택됨')).toBeTruthy();
  });

  it('토글이 동작한다', () => {
    const onToggle = jest.fn();
    const { getByText } = renderWithTheme(
      <ConditionSelector options={mockOptions} selected={[]} onToggle={onToggle} />,
    );
    fireEvent.press(getByText('건조함'));
    expect(onToggle).toHaveBeenCalledWith('dryness');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <ConditionSelector options={mockOptions} selected={['acne', 'redness']} />,
    );
    expect(getByLabelText('피부 증상, 2개 선택됨')).toBeTruthy();
  });

  it('커스텀 제목을 지원한다', () => {
    const { getByText } = renderWithTheme(
      <ConditionSelector title="증상 선택" options={mockOptions} selected={[]} />,
    );
    expect(getByText('증상 선택')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ConditionSelector options={mockOptions} selected={[]} />, true,
    );
    expect(getByTestId('condition-selector')).toBeTruthy();
  });
});
