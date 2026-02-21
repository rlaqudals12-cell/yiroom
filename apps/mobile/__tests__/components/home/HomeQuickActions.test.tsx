/**
 * HomeQuickActions 컴포넌트 테스트
 *
 * AI 코치 카드 + 퀵 액션 버튼 렌더링 및 콜백 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// lucide-react-native는 react-native-svg 의존성으로 Platform.OS 문제 발생 — barrel import 경유 시 필요
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    { get: (_target, name) => (name === '__esModule' ? true : View) }
  );
});

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { HomeQuickActions } from '../../../components/home/HomeQuickActions';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

const mockActions = [
  { title: '운동 기록', subtitle: '오늘의 운동', color: '#4ADE80', route: '/workout', completed: false },
  { title: '식단 기록', subtitle: '오늘의 식단', color: '#60A5FA', route: '/nutrition', completed: true },
  { title: '물 섭취', subtitle: '물 마시기', color: '#3B82F6', route: '/water', completed: false },
];

describe('HomeQuickActions', () => {
  const defaultProps = {
    actions: mockActions,
    onActionPress: jest.fn(),
    onCoachPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AI 코치 카드 텍스트를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    expect(getByText('AI 코치에게 물어보세요')).toBeTruthy();
    expect(getByText('운동, 영양, 뷰티 궁금한 것 무엇이든')).toBeTruthy();
  });

  it('퀵 액션 title과 subtitle을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    expect(getByText('운동 기록')).toBeTruthy();
    expect(getByText('오늘의 운동')).toBeTruthy();
    expect(getByText('식단 기록')).toBeTruthy();
    expect(getByText('물 섭취')).toBeTruthy();
    expect(getByText('물 마시기')).toBeTruthy();
  });

  it('AI 코치 카드 클릭 시 onCoachPress 콜백을 호출해야 한다', () => {
    const onCoachPress = jest.fn();
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} onCoachPress={onCoachPress} />
    );

    // AI 코치 카드의 텍스트를 포함하는 Pressable을 찾아 클릭
    fireEvent.press(getByText('AI 코치에게 물어보세요'));
    expect(onCoachPress).toHaveBeenCalledTimes(1);
  });

  it('퀵 액션 클릭 시 onActionPress 콜백에 route를 전달해야 한다', () => {
    const onActionPress = jest.fn();
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} onActionPress={onActionPress} />
    );

    fireEvent.press(getByText('운동 기록'));
    expect(onActionPress).toHaveBeenCalledWith('/workout');

    fireEvent.press(getByText('물 섭취'));
    expect(onActionPress).toHaveBeenCalledWith('/water');
  });

  it('completed 상태인 액션에 "완료됨"을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    // 식단 기록은 completed=true이므로 subtitle 대신 "완료됨" 표시
    expect(getByText('완료됨')).toBeTruthy();
  });

  it('completed 상태인 액션에 체크 표시가 있어야 한다', () => {
    const { getAllByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    // completed=true인 액션에 체크마크 표시
    const checkmarks = getAllByText('\u2713');
    expect(checkmarks.length).toBeGreaterThanOrEqual(1);
  });

  it('testID="home-quick-actions"가 존재해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    expect(getByTestId('home-quick-actions')).toBeTruthy();
  });

  it('"빠른 시작" 섹션 헤더를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    expect(getByText('빠른 시작')).toBeTruthy();
  });

  it('빈 actions 배열일 때 코치 카드만 렌더링해야 한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <HomeQuickActions
        actions={[]}
        onActionPress={jest.fn()}
        onCoachPress={jest.fn()}
      />
    );

    expect(getByText('AI 코치에게 물어보세요')).toBeTruthy();
    expect(queryByText('운동 기록')).toBeNull();
  });

  it('다크 모드에서도 정상 렌더링되어야 한다', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />,
      true
    );

    expect(getByTestId('home-quick-actions')).toBeTruthy();
    expect(getByText('AI 코치에게 물어보세요')).toBeTruthy();
    expect(getByText('운동 기록')).toBeTruthy();
  });
});
