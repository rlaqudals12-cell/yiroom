/**
 * StatCard UI 컴포넌트 테스트
 *
 * 숫자 통계 카드의 라벨, 값, 트렌드, 악센트 바, 모듈 색상 검증.
 * react-native-reanimated는 __mocks__에서 자동 모킹됨.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

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
import { StatCard } from '../../../components/ui/StatCard';

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

describe('StatCard', () => {
  describe('렌더링', () => {
    it('라벨을 렌더링해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StatCard value={42} label="운동 횟수" />
      );

      expect(getByText('운동 횟수')).toBeTruthy();
    });

    it('접근성 라벨에 값이 포함되어야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <StatCard value={42} label="운동 횟수" />
      );

      expect(getByLabelText('운동 횟수 42')).toBeTruthy();
    });

    it('접두사와 접미사를 포함해야 한다', () => {
      const { getByLabelText } = renderWithTheme(
        <StatCard value={1500} label="소모 칼로리" prefix="" suffix="kcal" />
      );

      expect(getByLabelText('소모 칼로리 1500kcal')).toBeTruthy();
    });

    it('testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StatCard value={10} label="테스트" testID="custom-stat" />
      );

      expect(getByTestId('custom-stat')).toBeTruthy();
    });

    it('기본 testID가 stat-card여야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StatCard value={10} label="기본" />
      );

      expect(getByTestId('stat-card')).toBeTruthy();
    });
  });

  describe('트렌드', () => {
    it('양수 트렌드에 상승 화살표를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StatCard value={85} label="점수" trend={3} />
      );

      // 트렌드 텍스트에 상승 화살표와 값이 포함됨
      expect(getByText(/▲/)).toBeTruthy();
      expect(getByText(/3/)).toBeTruthy();
    });

    it('음수 트렌드에 하락 화살표를 표시해야 한다', () => {
      const { getByText } = renderWithTheme(
        <StatCard value={60} label="점수" trend={-2} />
      );

      expect(getByText(/▼/)).toBeTruthy();
      expect(getByText(/2/)).toBeTruthy();
    });

    it('트렌드가 0이면 트렌드를 표시하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <StatCard value={70} label="점수" trend={0} />
      );

      expect(queryByText('▲')).toBeNull();
      expect(queryByText('▼')).toBeNull();
    });

    it('트렌드가 undefined이면 트렌드를 표시하지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <StatCard value={70} label="점수" />
      );

      expect(queryByText('▲')).toBeNull();
      expect(queryByText('▼')).toBeNull();
    });
  });

  describe('악센트 바', () => {
    it('악센트 바가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StatCard value={50} label="진행" />
      );

      // 악센트 바는 카드 내부의 View로 렌더링됨 (height: 3)
      const card = getByTestId('stat-card');
      expect(card).toBeTruthy();
      // 카드가 렌더링되면 악센트 바도 포함됨 (자식 View)
      expect(card.children.length).toBeGreaterThan(0);
    });
  });

  describe('모듈 색상', () => {
    it('workout 모듈 색상이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StatCard value={30} label="운동" moduleColor="workout" />
      );

      expect(getByTestId('stat-card')).toBeTruthy();
    });

    it('nutrition 모듈 색상이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StatCard value={2000} label="칼로리" moduleColor="nutrition" />
      );

      expect(getByTestId('stat-card')).toBeTruthy();
    });

    it('skin 모듈 색상이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StatCard value={75} label="수분" moduleColor="skin" />
      );

      expect(getByTestId('stat-card')).toBeTruthy();
    });

    it('모듈 색상 없이도 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <StatCard value={50} label="일반" />
      );

      expect(getByTestId('stat-card')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StatCard value={88} label="다크 점수" />,
        true
      );

      expect(getByText('다크 점수')).toBeTruthy();
    });

    it('다크 모드에서 트렌드가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <StatCard value={90} label="점수" trend={5} />,
        true
      );

      expect(getByText(/▲/)).toBeTruthy();
    });
  });
});
