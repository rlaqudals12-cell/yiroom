/**
 * ChallengeCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ChallengeCard } from '../../../components/gamification/ChallengeCard';

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

describe('ChallengeCard', () => {
  const defaultProps = {
    id: 'c1',
    title: '7일 운동 챌린지',
    description: '매일 30분 운동하기',
    status: 'active' as const,
    currentProgress: 3,
    targetProgress: 7,
  };

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ChallengeCard {...defaultProps} />);
    expect(getByTestId('challenge-card')).toBeTruthy();
  });

  it('제목과 설명을 표시한다', () => {
    const { getByText } = renderWithTheme(<ChallengeCard {...defaultProps} />);
    expect(getByText('7일 운동 챌린지')).toBeTruthy();
    expect(getByText('매일 30분 운동하기')).toBeTruthy();
  });

  it('상태 배지를 표시한다', () => {
    const { getByText } = renderWithTheme(<ChallengeCard {...defaultProps} />);
    expect(getByText('진행 중')).toBeTruthy();
  });

  it('진행률을 표시한다', () => {
    const { getByText } = renderWithTheme(<ChallengeCard {...defaultProps} />);
    expect(getByText('3/7 (43%)')).toBeTruthy();
  });

  it('참여자 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ChallengeCard {...defaultProps} participants={25} />,
    );
    expect(getByText('👥 25명')).toBeTruthy();
  });

  it('남은 일수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ChallengeCard {...defaultProps} daysLeft={4} />,
    );
    expect(getByText('4일 남음')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <ChallengeCard {...defaultProps} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('challenge-card'));
    expect(onPress).toHaveBeenCalledWith('c1');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<ChallengeCard {...defaultProps} />);
    expect(getByLabelText('7일 운동 챌린지 챌린지, 진행 중, 43% 달성')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ChallengeCard {...defaultProps} />, true);
    expect(getByTestId('challenge-card')).toBeTruthy();
  });
});
