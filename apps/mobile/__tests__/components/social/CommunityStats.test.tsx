/**
 * CommunityStats 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { CommunityStats } from '../../../components/social/CommunityStats';

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

describe('CommunityStats', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <CommunityStats totalMembers={100} activeToday={25} postsToday={10} encouragementsToday={50} />,
    );
    expect(getByTestId('community-stats')).toBeTruthy();
  });

  it('타이틀을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <CommunityStats totalMembers={100} activeToday={25} postsToday={10} encouragementsToday={50} />,
    );
    expect(getByText('커뮤니티')).toBeTruthy();
  });

  it('통계 수치를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <CommunityStats totalMembers={100} activeToday={25} postsToday={10} encouragementsToday={50} />,
    );
    expect(getByText('100')).toBeTruthy();
    expect(getByText('25')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('50')).toBeTruthy();
  });

  it('라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <CommunityStats totalMembers={100} activeToday={25} postsToday={10} encouragementsToday={50} />,
    );
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('오늘 활동')).toBeTruthy();
    expect(getByText('게시물')).toBeTruthy();
    expect(getByText('응원')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <CommunityStats totalMembers={100} activeToday={25} postsToday={10} encouragementsToday={50} />,
    );
    expect(getByLabelText('커뮤니티 통계, 100명 중 25명 활동')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <CommunityStats totalMembers={100} activeToday={25} postsToday={10} encouragementsToday={50} />,
      true,
    );
    expect(getByTestId('community-stats')).toBeTruthy();
  });
});
