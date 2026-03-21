/**
 * 온보딩 Step 1: 관심 분석 선택 테스트
 *
 * 대상: app/(onboarding)/step1.tsx
 * 의존성: useOnboarding, useTheme, ScreenContainer, OnboardingHero
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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

const mockToggleAnalysisInterest = jest.fn();
const mockNextStep = jest.fn();

// useOnboarding의 반환값을 테스트마다 변경할 수 있도록 변수로 관리
let mockOnboardingData = {
  analysisInterests: [] as string[],
  goals: [] as string[],
  basicInfo: {},
  preferences: {},
};

jest.mock('../../../lib/onboarding', () => ({
  useOnboarding: jest.fn(() => ({
    data: mockOnboardingData,
    toggleAnalysisInterest: mockToggleAnalysisInterest,
    nextStep: mockNextStep,
  })),
  ANALYSIS_LABELS: {
    personal_color: '퍼스널컬러',
    skin: '피부 분석',
    body: '체형 분석',
    hair: '헤어 분석',
    makeup: '메이크업',
    ingredients: '성분 분석',
  },
  ANALYSIS_DESCRIPTIONS: {
    personal_color: '내게 어울리는 색상을 찾아요',
    skin: '피부 타입과 맞춤 케어를 알아봐요',
    body: '체형에 맞는 스타일링을 추천해요',
    hair: '어울리는 헤어스타일을 찾아요',
    makeup: '퍼스널컬러 기반 메이크업을 추천해요',
    ingredients: '안전한 제품을 선택할 수 있어요',
  },
  ANALYSIS_COLORS: {
    personal_color: { gradient: ['#C084FC', '#A855F7'], bg: '#FAF5FF' },
    skin: { gradient: ['#F472B6', '#EC4899'], bg: '#FDF2F8' },
    body: { gradient: ['#818CF8', '#6366F1'], bg: '#EEF2FF' },
    hair: { gradient: ['#FBBF24', '#F59E0B'], bg: '#FFFBEB' },
    makeup: { gradient: ['#F9A8D4', '#EC4899'], bg: '#FDF2F8' },
    ingredients: { gradient: ['#34D399', '#10B981'], bg: '#ECFDF5' },
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// lucide-react-native 아이콘 mock (barrel import 경유)
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target: Record<string, unknown>, prop: string) => {
        if (typeof prop !== 'string' || prop === '__esModule') return undefined;
        return function MockIcon(props: Record<string, unknown>) {
          return <View testID={`icon-${prop}`} {...props} />;
        };
      },
    }
  );
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
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

// ============================================================
// 테스트
// ============================================================

// 동적 import로 mock 적용 후 컴포넌트 로드
let OnboardingStep1: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OnboardingStep1 = require('../../../app/(onboarding)/step1').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOnboardingData = {
    analysisInterests: [],
    goals: [],
    basicInfo: {},
    preferences: {},
  };
});

describe('OnboardingStep1 (관심 분석 선택)', () => {
  describe('렌더링', () => {
    it('testID="onboarding-step1" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);
      expect(getByTestId('onboarding-step1')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep1 />);
      expect(getByText('어떤 분석이 궁금하세요?')).toBeTruthy();
    });

    it('부제목에 복수 선택 안내가 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep1 />);
      expect(getByText(/복수 선택 가능/)).toBeTruthy();
    });

    it('6개 분석 카드가 모두 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);
      expect(getByTestId('analysis-personal_color')).toBeTruthy();
      expect(getByTestId('analysis-skin')).toBeTruthy();
      expect(getByTestId('analysis-body')).toBeTruthy();
      expect(getByTestId('analysis-hair')).toBeTruthy();
      expect(getByTestId('analysis-makeup')).toBeTruthy();
      expect(getByTestId('analysis-ingredients')).toBeTruthy();
    });

    it('분석 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep1 />);
      expect(getByText('퍼스널컬러')).toBeTruthy();
      expect(getByText('피부 분석')).toBeTruthy();
      expect(getByText('체형 분석')).toBeTruthy();
      expect(getByText('헤어 분석')).toBeTruthy();
      expect(getByText('메이크업')).toBeTruthy();
      expect(getByText('성분 분석')).toBeTruthy();
    });
  });

  describe('분석 선택 상호작용', () => {
    it('분석 카드 클릭 시 toggleAnalysisInterest가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);

      fireEvent.press(getByTestId('analysis-skin'));
      expect(mockToggleAnalysisInterest).toHaveBeenCalledWith('skin');
    });

    it('다른 분석 카드 클릭 시 해당 분석으로 toggleAnalysisInterest가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);

      fireEvent.press(getByTestId('analysis-personal_color'));
      expect(mockToggleAnalysisInterest).toHaveBeenCalledWith('personal_color');

      fireEvent.press(getByTestId('analysis-hair'));
      expect(mockToggleAnalysisInterest).toHaveBeenCalledWith('hair');
    });
  });

  describe('선택 상태 표시', () => {
    it('선택된 분석에 체크마크 아이콘이 표시된다', () => {
      mockOnboardingData = {
        analysisInterests: ['skin', 'body'],
        goals: [],
        basicInfo: {},
        preferences: {},
      };

      const { getAllByTestId } = renderWithTheme(<OnboardingStep1 />);
      const checkmarks = getAllByTestId('icon-Check');
      expect(checkmarks.length).toBe(2);
    });

    it('선택되지 않은 분석에는 체크마크가 없다', () => {
      mockOnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: {},
        preferences: {},
      };

      const { getAllByTestId } = renderWithTheme(<OnboardingStep1 />);
      // 선택된 분석 1개만 체크마크 존재
      const checkmarks = getAllByTestId('icon-Check');
      expect(checkmarks.length).toBe(1);
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링된다', () => {
      mockOnboardingData = {
        analysisInterests: ['personal_color'],
        goals: [],
        basicInfo: {},
        preferences: {},
      };

      const { getByTestId, getByText } = renderWithTheme(<OnboardingStep1 />, true);
      expect(getByTestId('onboarding-step1')).toBeTruthy();
      expect(getByText('어떤 분석이 궁금하세요?')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('6개 분석 모두 선택된 상태에서 체크마크 6개가 표시된다', () => {
      mockOnboardingData = {
        analysisInterests: ['personal_color', 'skin', 'body', 'hair', 'makeup', 'ingredients'],
        goals: [],
        basicInfo: {},
        preferences: {},
      };

      const { getAllByTestId } = renderWithTheme(<OnboardingStep1 />);
      const checkmarks = getAllByTestId('icon-Check');
      expect(checkmarks.length).toBe(6);
    });
  });
});
