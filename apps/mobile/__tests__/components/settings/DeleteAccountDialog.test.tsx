/**
 * DeleteAccountDialog 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { DeleteAccountDialog } from '../../../components/settings/DeleteAccountDialog';

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

describe('DeleteAccountDialog', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DeleteAccountDialog onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(getByTestId('delete-account-dialog')).toBeTruthy();
  });

  it('경고 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DeleteAccountDialog onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(getByText('계정을 삭제하시겠습니까?')).toBeTruthy();
  });

  it('삭제 설명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DeleteAccountDialog onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );
    expect(getByText(/삭제된 데이터는 복구할 수 없습니다/)).toBeTruthy();
  });

  it('삭제 버튼을 누르면 onConfirm이 호출된다', () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <DeleteAccountDialog onConfirm={onConfirm} onCancel={jest.fn()} />,
    );
    fireEvent.press(getByLabelText('계정 삭제'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('취소 버튼을 누르면 onCancel이 호출된다', () => {
    const onCancel = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <DeleteAccountDialog onConfirm={jest.fn()} onCancel={onCancel} />,
    );
    fireEvent.press(getByLabelText('취소'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('삭제 중일 때 텍스트가 변경된다', () => {
    const { getByText } = renderWithTheme(
      <DeleteAccountDialog onConfirm={jest.fn()} onCancel={jest.fn()} isDeleting />,
    );
    expect(getByText('삭제 중...')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DeleteAccountDialog onConfirm={jest.fn()} onCancel={jest.fn()} />,
      true,
    );
    expect(getByTestId('delete-account-dialog')).toBeTruthy();
  });
});
