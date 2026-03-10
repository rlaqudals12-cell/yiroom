/**
 * N-1 영양 온보딩 Step 1 테스트
 *
 * 대상: app/(nutrition)/onboarding/step1.tsx
 * 의존성: useTheme, expo-router (router.push)
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
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

// ============================================================
// Mock 설정
// ============================================================

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// ============================================================
// 테마 헬퍼
// ============================================================

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

// ============================================================
// 테스트
// ============================================================

let NutritionStep1: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NutritionStep1 = require('../../../app/(nutrition)/onboarding/step1').default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NutritionStep1Screen (기본 정보 입력)', () => {
  describe('렌더링', () => {
    it('testID="nutrition-onboarding-step1" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<NutritionStep1 />);
      expect(getByTestId('nutrition-onboarding-step1')).toBeTruthy();
    });

    it('영양 목표 섹션과 4개 목표가 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep1 />);
      expect(getByText('영양 목표')).toBeTruthy();
      expect(getByText('체중 감량')).toBeTruthy();
      expect(getByText('근육 증가')).toBeTruthy();
      expect(getByText('건강 유지')).toBeTruthy();
      expect(getByText('활력 증진')).toBeTruthy();
    });

    it('성별/신체 정보/활동 수준 섹션이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep1 />);
      expect(getByText('성별')).toBeTruthy();
      expect(getByText('신체 정보')).toBeTruthy();
      expect(getByText('활동 수준')).toBeTruthy();
    });

    it('다음 버튼이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep1 />);
      expect(getByText('다음')).toBeTruthy();
    });
  });

  describe('다음 버튼 비활성화', () => {
    it('모든 필드가 비어있으면 다음 버튼 클릭 시 라우터가 호출되지 않는다', () => {
      const { getByText } = renderWithTheme(<NutritionStep1 />);
      // 초기 상태에서 isValid=false이므로 다음 버튼이 disabled
      fireEvent.press(getByText('다음'));
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe('활동 수준 표시', () => {
    it('5개 활동 수준 카드가 모두 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep1 />);
      expect(getByText('좌식 생활')).toBeTruthy();
      expect(getByText('가벼운 활동')).toBeTruthy();
      expect(getByText('보통 활동')).toBeTruthy();
      expect(getByText('활동적')).toBeTruthy();
      expect(getByText('매우 활동적')).toBeTruthy();
    });
  });
});
