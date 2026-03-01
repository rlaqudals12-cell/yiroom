/**
 * FriendActivityCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FriendActivityCard } from '../../../components/social/FriendActivityCard';

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

describe('FriendActivityCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <FriendActivityCard friendName="김민수" activityType="workout" title="벤치프레스" timeAgo="5분 전" />,
    );
    expect(getByTestId('friend-activity-card')).toBeTruthy();
  });

  it('친구 이름과 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FriendActivityCard friendName="김민수" activityType="workout" title="벤치프레스 50kg" timeAgo="5분 전" />,
    );
    expect(getByText('김민수')).toBeTruthy();
    expect(getByText('벤치프레스 50kg')).toBeTruthy();
  });

  it('상세 내용을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FriendActivityCard friendName="이지은" activityType="nutrition" title="점심 기록" detail="샐러드, 닭가슴살" timeAgo="10분 전" />,
    );
    expect(getByText('샐러드, 닭가슴살')).toBeTruthy();
  });

  it('활동 타입별 이모지가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <FriendActivityCard friendName="박서준" activityType="streak" title="7일 연속!" timeAgo="1시간 전" />,
    );
    expect(getByText('🔥')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <FriendActivityCard friendName="김민수" activityType="analysis" title="피부 분석" timeAgo="3분 전" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('friend-activity-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <FriendActivityCard friendName="김민수" activityType="workout" title="스쿼트" timeAgo="5분 전" />,
    );
    expect(getByLabelText('김민수님의 운동: 스쿼트')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <FriendActivityCard friendName="김민수" activityType="workout" title="벤치프레스" timeAgo="5분 전" />,
      true,
    );
    expect(getByTestId('friend-activity-card')).toBeTruthy();
  });
});
