/**
 * StretchingGuide 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { StretchingGuide } from '../../../components/stretching/StretchingGuide';

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

const mockSteps = [
  { order: 1, title: '준비 자세', description: '바르게 서서 준비합니다', durationSeconds: 10 },
  { order: 2, title: '상체 늘리기', description: '양팔을 위로 뻗어 늘립니다', durationSeconds: 30 },
  { order: 3, title: '마무리', description: '천천히 원래 자세로 돌아옵니다', durationSeconds: 10 },
];

describe('StretchingGuide', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="easy" steps={mockSteps} />,
    );
    expect(getByTestId('stretching-guide')).toBeTruthy();
  });

  it('이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="easy" steps={mockSteps} />,
    );
    expect(getByText('상체 스트레칭')).toBeTruthy();
  });

  it('난이도를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="medium" steps={mockSteps} />,
    );
    expect(getByText('보통')).toBeTruthy();
  });

  it('단계 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="easy" steps={mockSteps} />,
    );
    expect(getByText('준비 자세')).toBeTruthy();
    expect(getByText('상체 늘리기')).toBeTruthy();
    expect(getByText('마무리')).toBeTruthy();
  });

  it('총 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="easy" steps={mockSteps} />,
    );
    expect(getByText('1분')).toBeTruthy();
  });

  it('타겟 부위를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="easy" steps={mockSteps} />,
    );
    expect(getByText('어깨/팔')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="easy" steps={mockSteps} />,
    );
    expect(getByLabelText('상체 스트레칭 스트레칭 가이드, 3단계')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StretchingGuide name="상체 스트레칭" targetArea="어깨/팔" difficulty="easy" steps={mockSteps} />,
      true,
    );
    expect(getByTestId('stretching-guide')).toBeTruthy();
  });
});
