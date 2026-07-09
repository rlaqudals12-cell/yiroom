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

// useAdaptiveAnimation mock
jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 150, normal: 300, slow: 500, staggerInterval: 80 },
  useAdaptiveAnimation: () => ({ shouldAnimate: false, duration: 300 }),
}));

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
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
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
  { title: '퍼스널 컬러', subtitle: '나에게 맞는 색상', color: '#F472B6', route: '/analysis/personal-color', completed: false },
  { title: '피부 분석', subtitle: '피부 타입 분석', color: '#60A5FA', route: '/analysis/skin', completed: false },
  { title: '체형 분석', subtitle: '체형 스타일링', color: '#A78BFA', route: '/analysis/body', completed: false },
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

    expect(getByText('궁금한 것을 물어보세요')).toBeTruthy();
    expect(getByText('운동, 영양, 뷰티 궁금한 것 무엇이든')).toBeTruthy();
  });

  it('퀵 액션 title을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    expect(getByText('퍼스널 컬러')).toBeTruthy();
    expect(getByText('피부 분석')).toBeTruthy();
    expect(getByText('체형 분석')).toBeTruthy();
  });

  it('AI 코치 카드 클릭 시 onCoachPress 콜백을 호출해야 한다', () => {
    const onCoachPress = jest.fn();
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} onCoachPress={onCoachPress} />
    );

    // AI 코치 카드의 텍스트를 포함하는 Pressable을 찾아 클릭
    fireEvent.press(getByText('궁금한 것을 물어보세요'));
    expect(onCoachPress).toHaveBeenCalledTimes(1);
  });

  it('퀵 액션 클릭 시 onActionPress 콜백에 route를 전달해야 한다', () => {
    const onActionPress = jest.fn();
    const { getByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} onActionPress={onActionPress} />
    );

    fireEvent.press(getByText('퍼스널 컬러'));
    expect(onActionPress).toHaveBeenCalledWith('/analysis/personal-color');

    fireEvent.press(getByText('체형 분석'));
    expect(onActionPress).toHaveBeenCalledWith('/analysis/body');
  });

  it('히스토리 없는 액션에 "시작하기" 상태가 표시되어야 한다', () => {
    const { getAllByText } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />
    );

    // 히스토리 없으면 모든 액션이 "시작하기" 상태
    const startTexts = getAllByText('시작하기');
    expect(startTexts.length).toBe(3);
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

    expect(getByText('궁금한 것을 물어보세요')).toBeTruthy();
    expect(queryByText('퍼스널 컬러')).toBeNull();
  });

  it('다크 모드에서도 정상 렌더링되어야 한다', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <HomeQuickActions {...defaultProps} />,
      true
    );

    expect(getByTestId('home-quick-actions')).toBeTruthy();
    expect(getByText('궁금한 것을 물어보세요')).toBeTruthy();
    expect(getByText('퍼스널 컬러')).toBeTruthy();
  });
});
