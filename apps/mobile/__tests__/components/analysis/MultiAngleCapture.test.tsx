/**
 * MultiAngleCapture 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MultiAngleCapture } from '../../../components/analysis/MultiAngleCapture';

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

describe('MultiAngleCapture', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnCapture = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} />,
    );
    expect(getByTestId('multi-angle-capture')).toBeTruthy();
  });

  it('스텝 인디케이터를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} />,
    );
    expect(getByText('정면 촬영')).toBeTruthy();
    expect(getByText('추가 촬영')).toBeTruthy();
    expect(getByText('완료')).toBeTruthy();
  });

  it('정면 촬영 안내를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} />,
    );
    expect(getByText(/정면을 바라봐주세요/)).toBeTruthy();
  });

  it('촬영 버튼 접근성 라벨이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} />,
    );
    expect(getByLabelText('정면 사진 촬영')).toBeTruthy();
  });

  it('촬영 버튼 클릭 시 onCapture를 호출한다', async () => {
    mockOnCapture.mockResolvedValueOnce('file:///photo.jpg');
    const { getByLabelText } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} />,
    );
    fireEvent.press(getByLabelText('정면 사진 촬영'));
    await waitFor(() => {
      expect(mockOnCapture).toHaveBeenCalledWith('front');
    });
  });

  it('취소 버튼을 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} onCancel={mockOnCancel} />,
    );
    expect(getByLabelText('촬영 취소')).toBeTruthy();
  });

  it('취소 버튼 클릭 시 onCancel을 호출한다', () => {
    const { getByLabelText } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} onCancel={mockOnCancel} />,
    );
    fireEvent.press(getByLabelText('촬영 취소'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('팁을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} />,
    );
    expect(getByText(/자연광에서.*더 정확/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MultiAngleCapture onComplete={mockOnComplete} onCapture={mockOnCapture} />,
      true,
    );
    expect(getByTestId('multi-angle-capture')).toBeTruthy();
  });
});
