/**
 * RankingCard 컴포넌트 테스트
 *
 * 리더보드 랭킹 카드
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { RankingCard } from '../../../components/common/RankingCard';
import type { RankingItem } from '../../../components/common/RankingCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>,
  );
}

describe('RankingCard', () => {
  const baseItem: RankingItem = {
    rank: 1,
    name: '김이룸',
    score: 95,
  };

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RankingCard item={baseItem} />,
    );
    expect(getByTestId('ranking-card')).toBeTruthy();
  });

  it('이름이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={baseItem} />,
    );
    expect(getByText('김이룸')).toBeTruthy();
  });

  it('1등에 금메달이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, rank: 1 }} />,
    );
    expect(getByText('🥇')).toBeTruthy();
  });

  it('2등에 은메달이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, rank: 2 }} />,
    );
    expect(getByText('🥈')).toBeTruthy();
  });

  it('3등에 동메달이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, rank: 3 }} />,
    );
    expect(getByText('🥉')).toBeTruthy();
  });

  it('4등 이상은 숫자가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, rank: 4 }} />,
    );
    expect(getByText('4')).toBeTruthy();
  });

  it('점수가 단위와 함께 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={baseItem} scoreUnit="점" />,
    );
    expect(getByText('95점')).toBeTruthy();
  });

  it('순위 상승이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, rankChange: 3 }} />,
    );
    expect(getByText('▲3')).toBeTruthy();
  });

  it('순위 하락이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, rankChange: -2 }} />,
    );
    expect(getByText('▼2')).toBeTruthy();
  });

  it('isMe일 때 (나)가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, isMe: true }} />,
    );
    expect(getByText(/\(나\)/)).toBeTruthy();
  });

  it('아바타 이니셜이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={baseItem} />,
    );
    // 이름 첫 글자 '김'이 아바타에 표시
    expect(getByText('김')).toBeTruthy();
  });

  it('커스텀 아바타가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RankingCard item={{ ...baseItem, avatar: '🦄' }} />,
    );
    expect(getByText('🦄')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <RankingCard item={baseItem} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('ranking-card'));
    expect(onPress).toHaveBeenCalled();
  });

  it('접근성 라벨이 올바르다', () => {
    const { getByLabelText } = renderWithTheme(
      <RankingCard item={baseItem} />,
    );
    expect(getByLabelText('1위 김이룸 95점')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RankingCard item={baseItem} />,
      true,
    );
    expect(getByTestId('ranking-card')).toBeTruthy();
  });
});
