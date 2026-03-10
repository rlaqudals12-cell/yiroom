/**
 * N-1 영양 온보딩 결과 화면 테스트
 *
 * 대상: app/(nutrition)/result/index.tsx
 * 의존성: useTheme, expo-router (useLocalSearchParams, router.replace),
 *          expo-linear-gradient
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams, router } from 'expo-router';

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

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: (props: Record<string, unknown>) => <View {...props} />,
  };
});

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

let NutritionResult: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NutritionResult = require('../../../app/(nutrition)/result/index').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Step 3에서 전달된 결과 파라미터
  (useLocalSearchParams as jest.Mock).mockReturnValue({
    goal: 'muscle_gain',
    gender: 'male',
    age: '28',
    heightCm: '178',
    weightKg: '75',
    activityLevel: 'active',
    bmr: '1750',
    tdee: '2600',
    carbG: '293',
    proteinG: '195',
    fatG: '72',
    mealCount: '3',
  });
});

describe('NutritionResultScreen (결과 화면)', () => {
  describe('렌더링', () => {
    it('testID="nutrition-result-screen" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<NutritionResult />);
      expect(getByTestId('nutrition-result-screen')).toBeTruthy();
    });

    it('완료 헤더에 축하 메시지와 목표가 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionResult />);
      expect(getByText('맞춤 영양 플랜 완성!')).toBeTruthy();
      expect(getByText(/근육 증가/)).toBeTruthy();
    });
  });

  describe('BMR/TDEE 표시', () => {
    it('기초대사량과 일일 권장 칼로리가 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionResult />);
      expect(getByText('에너지 소비량')).toBeTruthy();
      expect(getByText('기초대사량')).toBeTruthy();
      expect(getByText('일일 권장')).toBeTruthy();
      expect(getByText('1750')).toBeTruthy();
      expect(getByText('2600')).toBeTruthy();
    });
  });

  describe('매크로 영양소 표시', () => {
    it('탄수화물/단백질/지방 목표가 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionResult />);
      expect(getByText('일일 매크로 목표')).toBeTruthy();
      expect(getByText('탄수화물')).toBeTruthy();
      expect(getByText('단백질')).toBeTruthy();
      expect(getByText('지방')).toBeTruthy();
    });
  });

  describe('영양제 추천', () => {
    it('3개 영양제 추천이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionResult />);
      expect(getByText('추천 영양제')).toBeTruthy();
      expect(getByText('종합 비타민')).toBeTruthy();
      expect(getByText('오메가-3')).toBeTruthy();
      expect(getByText('유산균')).toBeTruthy();
    });
  });

  describe('CTA 버튼', () => {
    it('영양 관리 시작하기 버튼이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionResult />);
      expect(getByText('영양 관리 시작하기')).toBeTruthy();
    });

    it('시작하기 버튼 클릭 시 대시보드로 이동한다', () => {
      const { getByText } = renderWithTheme(<NutritionResult />);
      fireEvent.press(getByText('영양 관리 시작하기'));
      expect(router.replace).toHaveBeenCalledWith('/(nutrition)/dashboard');
    });
  });
});
