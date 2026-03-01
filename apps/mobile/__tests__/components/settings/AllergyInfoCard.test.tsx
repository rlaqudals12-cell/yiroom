/**
 * AllergyInfoCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { AllergyInfoCard } from '../../../components/settings/AllergyInfoCard';

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

describe('AllergyInfoCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AllergyInfoCard allergies={['향료', '파라벤']} />,
    );
    expect(getByTestId('allergy-info-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AllergyInfoCard allergies={[]} />,
    );
    expect(getByText('알레르기 / 민감 성분')).toBeTruthy();
  });

  it('알레르기 태그를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AllergyInfoCard allergies={['향료', '파라벤', '알코올']} />,
    );
    expect(getByText('향료')).toBeTruthy();
    expect(getByText('파라벤')).toBeTruthy();
    expect(getByText('알코올')).toBeTruthy();
  });

  it('빈 상태 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <AllergyInfoCard allergies={[]} />,
    );
    expect(getByText('등록된 알레르기 정보가 없습니다')).toBeTruthy();
  });

  it('수정 버튼을 누르면 onEdit이 호출된다', () => {
    const onEdit = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AllergyInfoCard allergies={['향료']} onEdit={onEdit} />,
    );
    fireEvent.press(getByLabelText('알레르기 정보 수정'));
    expect(onEdit).toHaveBeenCalled();
  });

  it('접근성 레이블에 건수를 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <AllergyInfoCard allergies={['향료', '파라벤']} />,
    );
    expect(getByLabelText('알레르기 정보, 2건')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <AllergyInfoCard allergies={['향료']} />,
      true,
    );
    expect(getByTestId('allergy-info-card')).toBeTruthy();
  });
});
