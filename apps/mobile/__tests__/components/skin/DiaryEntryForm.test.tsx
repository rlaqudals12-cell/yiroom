/**
 * DiaryEntryForm 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { DiaryEntryForm } from '../../../components/skin/DiaryEntryForm';

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

describe('DiaryEntryForm', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" />,
    );
    expect(getByTestId('diary-entry-form')).toBeTruthy();
  });

  it('날짜를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" />,
    );
    expect(getByText('2026년 3월 1일')).toBeTruthy();
  });

  it('컨디션 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" />,
    );
    expect(getByText('오늘 피부 상태')).toBeTruthy();
  });

  it('컨디션 버튼을 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" />,
    );
    expect(getByLabelText('피부 상태: 좋음')).toBeTruthy();
    expect(getByLabelText('피부 상태: 보통')).toBeTruthy();
    expect(getByLabelText('피부 상태: 나쁨')).toBeTruthy();
  });

  it('메모 입력이 있다', () => {
    const { getByTestId } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" />,
    );
    expect(getByTestId('diary-memo-input')).toBeTruthy();
  });

  it('저장 버튼이 동작한다', () => {
    const onSave = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" onSave={onSave} />,
    );
    fireEvent.press(getByLabelText('피부 일기 저장'));
    expect(onSave).toHaveBeenCalledWith({ condition: 'normal', memo: '' });
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" />,
    );
    expect(getByLabelText('2026년 3월 1일 피부 일기 작성')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DiaryEntryForm date="2026년 3월 1일" />, true,
    );
    expect(getByTestId('diary-entry-form')).toBeTruthy();
  });
});
