/**
 * AddClothingSheet 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { AddClothingSheet } from '../../../components/inventory/AddClothingSheet';

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

describe('AddClothingSheet', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(getByTestId('add-clothing-sheet')).toBeTruthy();
  });

  it('의류 추가 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} />,
    );
    expect(getByText('의류 추가')).toBeTruthy();
  });

  it('이름 입력 필드를 표시한다', () => {
    const { getByTestId } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} />,
    );
    expect(getByTestId('clothing-name-input')).toBeTruthy();
  });

  it('색상 입력 필드를 표시한다', () => {
    const { getByTestId } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} />,
    );
    expect(getByTestId('clothing-color-input')).toBeTruthy();
  });

  it('카테고리 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} />,
    );
    expect(getByText('상의')).toBeTruthy();
    expect(getByText('하의')).toBeTruthy();
    expect(getByText('아우터')).toBeTruthy();
    expect(getByText('신발')).toBeTruthy();
    expect(getByText('악세서리')).toBeTruthy();
  });

  it('저장 버튼을 누르면 onSave가 호출된다', () => {
    const onSave = jest.fn();
    const { getByLabelText, getByTestId } = renderWithTheme(
      <AddClothingSheet onSave={onSave} />,
    );
    fireEvent.changeText(getByTestId('clothing-name-input'), '흰 셔츠');
    fireEvent.changeText(getByTestId('clothing-color-input'), '화이트');
    fireEvent.press(getByLabelText('저장'));
    expect(onSave).toHaveBeenCalledWith({ name: '흰 셔츠', category: 'top', color: '화이트' });
  });

  it('취소 버튼을 누르면 onCancel이 호출된다', () => {
    const onCancel = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} onCancel={onCancel} />,
    );
    fireEvent.press(getByLabelText('취소'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} />,
    );
    expect(getByLabelText('의류 추가')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AddClothingSheet onSave={jest.fn()} onCancel={jest.fn()} />,
      true,
    );
    expect(getByTestId('add-clothing-sheet')).toBeTruthy();
  });
});
