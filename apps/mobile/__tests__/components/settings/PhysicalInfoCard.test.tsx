/**
 * PhysicalInfoCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { PhysicalInfoCard } from '../../../components/settings/PhysicalInfoCard';

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

describe('PhysicalInfoCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<PhysicalInfoCard />);
    expect(getByTestId('physical-info-card')).toBeTruthy();
  });

  it('신체 정보 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<PhysicalInfoCard />);
    expect(getByText('신체 정보')).toBeTruthy();
  });

  it('키와 몸무게를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <PhysicalInfoCard height={175} weight={70} />,
    );
    expect(getByText('175cm')).toBeTruthy();
    expect(getByText('70kg')).toBeTruthy();
  });

  it('체형과 성별을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <PhysicalInfoCard bodyType="역삼각형" gender="남성" />,
    );
    expect(getByText('역삼각형')).toBeTruthy();
    expect(getByText('남성')).toBeTruthy();
  });

  it('데이터 없을 때 안내 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(<PhysicalInfoCard />);
    expect(getByText('신체 정보를 등록해주세요')).toBeTruthy();
  });

  it('수정 버튼을 누르면 onEdit이 호출된다', () => {
    const onEdit = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <PhysicalInfoCard height={175} onEdit={onEdit} />,
    );
    fireEvent.press(getByLabelText('신체 정보 수정'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<PhysicalInfoCard height={175} />, true);
    expect(getByTestId('physical-info-card')).toBeTruthy();
  });
});
