/**
 * ItemUploader 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ItemUploader } from '../../../components/inventory/ItemUploader';

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

describe('ItemUploader', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ItemUploader onCamera={jest.fn()} onGallery={jest.fn()} onManual={jest.fn()} />,
    );
    expect(getByTestId('item-uploader')).toBeTruthy();
  });

  it('제품 추가 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemUploader onCamera={jest.fn()} onGallery={jest.fn()} onManual={jest.fn()} />,
    );
    expect(getByText('제품 추가')).toBeTruthy();
  });

  it('촬영 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemUploader onCamera={jest.fn()} />,
    );
    expect(getByText('📷')).toBeTruthy();
    expect(getByText('촬영')).toBeTruthy();
  });

  it('갤러리 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemUploader onGallery={jest.fn()} />,
    );
    expect(getByText('🖼️')).toBeTruthy();
    expect(getByText('갤러리')).toBeTruthy();
  });

  it('직접 입력 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ItemUploader onManual={jest.fn()} />,
    );
    expect(getByText('✏️')).toBeTruthy();
    expect(getByText('직접 입력')).toBeTruthy();
  });

  it('카메라 버튼을 누르면 onCamera가 호출된다', () => {
    const onCamera = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ItemUploader onCamera={onCamera} />,
    );
    fireEvent.press(getByLabelText('카메라로 촬영'));
    expect(onCamera).toHaveBeenCalled();
  });

  it('갤러리 버튼을 누르면 onGallery가 호출된다', () => {
    const onGallery = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ItemUploader onGallery={onGallery} />,
    );
    fireEvent.press(getByLabelText('갤러리에서 선택'));
    expect(onGallery).toHaveBeenCalled();
  });

  it('직접 입력 버튼을 누르면 onManual이 호출된다', () => {
    const onManual = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ItemUploader onManual={onManual} />,
    );
    fireEvent.press(getByLabelText('직접 입력'));
    expect(onManual).toHaveBeenCalled();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <ItemUploader onCamera={jest.fn()} />,
    );
    expect(getByLabelText('제품 등록')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ItemUploader onCamera={jest.fn()} onGallery={jest.fn()} onManual={jest.fn()} />,
      true,
    );
    expect(getByTestId('item-uploader')).toBeTruthy();
  });
});
