/**
 * DataExportCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { DataExportCard } from '../../../components/settings/DataExportCard';

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

describe('DataExportCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<DataExportCard />);
    expect(getByTestId('data-export-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<DataExportCard />);
    expect(getByText('데이터 내보내기')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(<DataExportCard />);
    expect(getByText(/JSON 형식으로 내보냅니다/)).toBeTruthy();
  });

  it('마지막 내보내기 날짜를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DataExportCard lastExportDate="2026-02-28" />,
    );
    expect(getByText('마지막 내보내기: 2026-02-28')).toBeTruthy();
  });

  it('내보내기 버튼을 누르면 onExport가 호출된다', () => {
    const onExport = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <DataExportCard onExport={onExport} />,
    );
    fireEvent.press(getByLabelText('내보내기'));
    expect(onExport).toHaveBeenCalled();
  });

  it('내보내기 중일 때 텍스트가 변경된다', () => {
    const { getByText } = renderWithTheme(
      <DataExportCard onExport={jest.fn()} isExporting />,
    );
    expect(getByText('내보내는 중...')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<DataExportCard />, true);
    expect(getByTestId('data-export-card')).toBeTruthy();
  });
});
