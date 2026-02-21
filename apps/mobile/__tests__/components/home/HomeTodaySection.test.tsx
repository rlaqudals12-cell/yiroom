/**
 * HomeTodaySection 컴포넌트 테스트
 *
 * 알림 배너 + 오늘 할 일 목록 렌더링 및 상호작용 검증.
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
import { HomeTodaySection } from '../../../components/home/HomeTodaySection';

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

const mockTasks = [
  { id: '1', label: '아침 운동', completed: true, route: '/workout' },
  { id: '2', label: '물 2L 마시기', completed: false, route: '/water' },
  { id: '3', label: '피부 관리', completed: false, route: '/skin' },
];

const mockNotifications = [
  { id: 'n1', message: '오늘 운동 목표를 달성했어요!', type: 'success' as const },
];

describe('HomeTodaySection', () => {
  const defaultProps = {
    tasks: mockTasks,
    notifications: mockNotifications,
    onTaskPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('태스크 목록을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeTodaySection {...defaultProps} />
    );

    expect(getByText('아침 운동')).toBeTruthy();
    expect(getByText('물 2L 마시기')).toBeTruthy();
    expect(getByText('피부 관리')).toBeTruthy();
  });

  it('알림 메시지를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeTodaySection {...defaultProps} />
    );

    expect(getByText('오늘 운동 목표를 달성했어요!')).toBeTruthy();
  });

  it('알림이 없을 때 배너를 표시하지 않아야 한다', () => {
    const { queryByText } = renderWithTheme(
      <HomeTodaySection
        tasks={mockTasks}
        notifications={[]}
        onTaskPress={jest.fn()}
      />
    );

    expect(queryByText('오늘 운동 목표를 달성했어요!')).toBeNull();
  });

  it('태스크 클릭 시 onTaskPress 콜백에 route를 전달해야 한다', () => {
    const onTaskPress = jest.fn();
    const { getByText } = renderWithTheme(
      <HomeTodaySection {...defaultProps} onTaskPress={onTaskPress} />
    );

    fireEvent.press(getByText('물 2L 마시기'));
    expect(onTaskPress).toHaveBeenCalledWith('/water');

    fireEvent.press(getByText('피부 관리'));
    expect(onTaskPress).toHaveBeenCalledWith('/skin');
  });

  it('완료된 태스크에 체크마크를 표시해야 한다', () => {
    const { getAllByText } = renderWithTheme(
      <HomeTodaySection {...defaultProps} />
    );

    // 완료된 태스크(아침 운동)의 체크마크 확인
    const checkmarks = getAllByText('\u2713');
    expect(checkmarks.length).toBeGreaterThanOrEqual(1);
  });

  it('남은 태스크 수를 올바르게 계산해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeTodaySection {...defaultProps} />
    );

    // 3개 중 1개 완료, 2개 남음
    expect(getByText('2개 남음')).toBeTruthy();
  });

  it('"오늘 할 일" 섹션 헤더를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeTodaySection {...defaultProps} />
    );

    expect(getByText('오늘 할 일')).toBeTruthy();
  });

  it('testID="home-today-section"이 존재해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <HomeTodaySection {...defaultProps} />
    );

    expect(getByTestId('home-today-section')).toBeTruthy();
  });

  it('모든 태스크가 완료되면 "0개 남음"을 표시해야 한다', () => {
    const allCompletedTasks = mockTasks.map((t) => ({ ...t, completed: true }));
    const { getByText } = renderWithTheme(
      <HomeTodaySection
        tasks={allCompletedTasks}
        notifications={[]}
        onTaskPress={jest.fn()}
      />
    );

    expect(getByText('0개 남음')).toBeTruthy();
  });

  it('빈 태스크 배열일 때도 섹션 헤더를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <HomeTodaySection
        tasks={[]}
        notifications={[]}
        onTaskPress={jest.fn()}
      />
    );

    expect(getByText('오늘 할 일')).toBeTruthy();
    expect(getByText('0개 남음')).toBeTruthy();
  });

  it('다크 모드에서도 정상 렌더링되어야 한다', () => {
    const { getByText, getByTestId } = renderWithTheme(
      <HomeTodaySection {...defaultProps} />,
      true
    );

    expect(getByTestId('home-today-section')).toBeTruthy();
    expect(getByText('아침 운동')).toBeTruthy();
    expect(getByText('오늘 할 일')).toBeTruthy();
  });

  it('warning 타입 알림도 렌더링해야 한다', () => {
    const warningNotifications = [
      { id: 'w1', message: '수분 섭취가 부족해요', type: 'warning' as const },
    ];
    const { getByText } = renderWithTheme(
      <HomeTodaySection
        tasks={mockTasks}
        notifications={warningNotifications}
        onTaskPress={jest.fn()}
      />
    );

    expect(getByText('수분 섭취가 부족해요')).toBeTruthy();
  });

  it('info 타입 알림도 렌더링해야 한다', () => {
    const infoNotifications = [
      { id: 'i1', message: '새로운 운동 추천이 있어요', type: 'info' as const },
    ];
    const { getByText } = renderWithTheme(
      <HomeTodaySection
        tasks={mockTasks}
        notifications={infoNotifications}
        onTaskPress={jest.fn()}
      />
    );

    expect(getByText('새로운 운동 추천이 있어요')).toBeTruthy();
  });
});
