/**
 * N-1 영양 온보딩 Step 3 테스트
 *
 * 대상: app/(nutrition)/onboarding/step3.tsx
 * 의존성: useTheme, expo-router (useLocalSearchParams, router.push),
 *          @/lib/nutrition (calculateBMR, calculateTDEE),
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
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
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

// BMR/TDEE 계산 함수 mock
jest.mock('../../../lib/nutrition', () => ({
  calculateBMR: jest.fn(() => 1600),
  calculateTDEE: jest.fn(() => 2200),
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

// ============================================================
// 테스트
// ============================================================

let NutritionStep3: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NutritionStep3 = require('../../../app/(nutrition)/onboarding/step3').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Step 1/2에서 전달된 파라미터 mock
  (useLocalSearchParams as jest.Mock).mockReturnValue({
    goal: 'health',
    gender: 'male',
    age: '25',
    heightCm: '175',
    weightKg: '70',
    activityLevel: 'moderate',
    mealStyle: 'korean',
    cookingSkill: 'intermediate',
    budget: 'medium',
  });
});

describe('NutritionStep3Screen (알레르기 & 칼로리 미리보기)', () => {
  describe('렌더링', () => {
    it('testID="nutrition-onboarding-step3" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<NutritionStep3 />);
      expect(getByTestId('nutrition-onboarding-step3')).toBeTruthy();
    });

    it('알레르기 섹션과 7개 알레르기 옵션이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep3 />);
      expect(getByText('알레르기 / 식이 제한')).toBeTruthy();
      expect(getByText('유제품')).toBeTruthy();
      expect(getByText('달걀')).toBeTruthy();
      expect(getByText('견과류')).toBeTruthy();
      expect(getByText('해산물')).toBeTruthy();
      expect(getByText('글루텐')).toBeTruthy();
      expect(getByText('대두')).toBeTruthy();
      expect(getByText('없음')).toBeTruthy();
    });

    it('식사 횟수 섹션과 3개 옵션이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep3 />);
      expect(getByText('하루 식사 횟수')).toBeTruthy();
      expect(getByText('2끼')).toBeTruthy();
      expect(getByText('3끼')).toBeTruthy();
      expect(getByText('4끼+')).toBeTruthy();
    });
  });

  describe('칼로리 미리보기', () => {
    it('BMR과 TDEE 값이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep3 />);
      expect(getByText('칼로리 미리보기')).toBeTruthy();
      expect(getByText('기초대사량 (BMR)')).toBeTruthy();
      expect(getByText('일일 권장 (TDEE)')).toBeTruthy();
      // mock에서 BMR=1600, TDEE=2200 반환
      expect(getByText('1600')).toBeTruthy();
      expect(getByText('2200')).toBeTruthy();
    });

    it('매크로 영양소 라벨이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep3 />);
      expect(getByText('탄수화물')).toBeTruthy();
      expect(getByText('단백질')).toBeTruthy();
      expect(getByText('지방')).toBeTruthy();
    });
  });

  describe('결과 보기 버튼', () => {
    it('결과 보기 버튼이 표시된다', () => {
      const { getByText } = renderWithTheme(<NutritionStep3 />);
      expect(getByText('결과 보기')).toBeTruthy();
    });

    it('결과 보기 버튼 클릭 시 result 화면으로 이동한다', () => {
      const { getByText } = renderWithTheme(<NutritionStep3 />);
      fireEvent.press(getByText('결과 보기'));
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(nutrition)/result',
          params: expect.objectContaining({
            bmr: '1600',
            tdee: '2200',
          }),
        })
      );
    });
  });
});
