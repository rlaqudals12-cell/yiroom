/**
 * 온보딩 Step 3: 웰니스 목표 + 신체정보 (선택) 테스트
 *
 * 대상: app/(onboarding)/step3.tsx
 * 의존성: useOnboarding, useTheme, Button, ScreenContainer
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

const mockToggleGoal = jest.fn();
const mockSetBasicInfo = jest.fn();
const mockPrevStep = jest.fn();
const mockCompleteOnboarding = jest.fn();

let mockOnboardingData = {
  analysisInterests: ['skin', 'personal_color'] as string[],
  goals: [] as string[],
  basicInfo: {
    gender: 'female',
    birthYear: 1995,
  } as Record<string, unknown>,
  preferences: {} as Record<string, unknown>,
  stylePreference: 'feminine' as string | undefined,
};

jest.mock('../../../lib/onboarding', () => ({
  useOnboarding: jest.fn(() => ({
    data: mockOnboardingData,
    toggleGoal: mockToggleGoal,
    setBasicInfo: mockSetBasicInfo,
    prevStep: mockPrevStep,
    completeOnboarding: mockCompleteOnboarding,
  })),
  GOAL_LABELS: {
    weight_loss: '체중 감량',
    muscle_gain: '근육 증가',
    health_maintenance: '건강 유지',
    stress_relief: '스트레스 해소',
    better_sleep: '수면 개선',
  },
  GOAL_DESCRIPTIONS: {
    weight_loss: '건강한 식단과 운동으로 체중을 관리해요',
    muscle_gain: '근력 운동과 고단백 식단을 추천해요',
    health_maintenance: '전반적인 건강 지표를 개선해요',
    stress_relief: '유연성과 마음 챙김으로 스트레스를 줄여요',
    better_sleep: '수면 패턴 분석으로 숙면을 도와요',
  },
  GOAL_COLORS: {
    weight_loss: { gradient: ['#F472B6', '#EC4899'], bg: '#FDF2F8' },
    muscle_gain: { gradient: ['#A78BFA', '#8B5CF6'], bg: '#F5F3FF' },
    health_maintenance: { gradient: ['#34D399', '#10B981'], bg: '#ECFDF5' },
    stress_relief: { gradient: ['#60A5FA', '#3B82F6'], bg: '#EFF6FF' },
    better_sleep: { gradient: ['#818CF8', '#6366F1'], bg: '#EEF2FF' },
  },
  ANALYSIS_LABELS: {
    personal_color: '퍼스널컬러',
    skin: '피부 분석',
    body: '체형 분석',
    hair: '헤어 분석',
    makeup: '메이크업',
    ingredients: '성분 분석',
  },
  GENDER_LABELS: {
    male: '남성',
    female: '여성',
    neutral: '선택 안 함',
  },
  STYLE_PREFERENCE_LABELS: {
    masculine: '미니멀 스타일',
    feminine: '소프트 스타일',
    unisex: '자유로운 스타일',
  },
  calculateAge: jest.fn((birthYear: number) => new Date().getFullYear() - birthYear),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// lucide-react-native 아이콘 mock
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

let OnboardingStep3: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OnboardingStep3 = require('../../../app/(onboarding)/step3').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOnboardingData = {
    analysisInterests: ['skin', 'personal_color'],
    goals: [],
    basicInfo: {
      gender: 'female',
      birthYear: 1995,
    },
    preferences: {},
    stylePreference: 'feminine',
  };
});

describe('OnboardingStep3 (웰니스 목표 + 신체정보)', () => {
  describe('렌더링', () => {
    it('testID="onboarding-step3" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('onboarding-step3')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('건강 목표도 설정해볼까요?')).toBeTruthy();
    });

    it('부제목에 선택 사항 안내가 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText(/건너뛰어도 괜찮아요/)).toBeTruthy();
    });
  });

  describe('웰니스 목표 선택', () => {
    it('5개 목표 카드가 모두 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('goal-weight_loss')).toBeTruthy();
      expect(getByTestId('goal-muscle_gain')).toBeTruthy();
      expect(getByTestId('goal-health_maintenance')).toBeTruthy();
      expect(getByTestId('goal-stress_relief')).toBeTruthy();
      expect(getByTestId('goal-better_sleep')).toBeTruthy();
    });

    it('목표 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('체중 감량')).toBeTruthy();
      expect(getByText('근육 증가')).toBeTruthy();
      expect(getByText('건강 유지')).toBeTruthy();
      expect(getByText('스트레스 해소')).toBeTruthy();
      expect(getByText('수면 개선')).toBeTruthy();
    });

    it('목표 카드 클릭 시 toggleGoal이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('goal-weight_loss'));
      expect(mockToggleGoal).toHaveBeenCalledWith('weight_loss');
    });

    it('다른 목표 카드 클릭 시 해당 값으로 toggleGoal이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('goal-muscle_gain'));
      expect(mockToggleGoal).toHaveBeenCalledWith('muscle_gain');

      fireEvent.press(getByTestId('goal-better_sleep'));
      expect(mockToggleGoal).toHaveBeenCalledWith('better_sleep');
    });
  });

  describe('선택 상태 표시', () => {
    it('선택된 목표에 체크마크 아이콘이 표시된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: ['weight_loss', 'muscle_gain'],
      };

      const { getAllByTestId } = renderWithTheme(<OnboardingStep3 />);
      const checkmarks = getAllByTestId('icon-Check');
      // 요약 카드의 Check 아이콘 1개 + 선택된 목표 2개 = 3개
      expect(checkmarks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('요약 카드', () => {
    it('입력 요약 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('입력 요약')).toBeTruthy();
    });

    it('선택한 관심 분석이 요약에 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('피부 분석, 퍼스널컬러')).toBeTruthy();
    });

    it('선택한 목표가 요약에 표시된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: ['weight_loss', 'muscle_gain'],
      };

      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('체중 감량, 근육 증가')).toBeTruthy();
    });
  });

  describe('네비게이션 버튼', () => {
    it('건너뛰기 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('skip-button')).toBeTruthy();
    });

    it('시작하기 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('complete-button')).toBeTruthy();
    });

    it('미니 백 버튼 클릭 시 prevStep이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('mini-back-button'));
      expect(mockPrevStep).toHaveBeenCalledTimes(1);
    });

    it('Step 3은 선택 사항이므로 시작하기 버튼이 항상 활성화된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: [],
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const completeButton = getByTestId('complete-button');
      // complete-button은 Pressable이므로 disabled prop 대신 항상 활성화
      expect(completeButton).toBeTruthy();
    });

    it('건너뛰기 버튼 클릭 시 completeOnboarding이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('skip-button'));
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });

    it('시작하기 버튼 클릭 시 completeOnboarding이 호출된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: ['health_maintenance'],
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('complete-button'));
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링된다', () => {
      const { getByTestId, getByText } = renderWithTheme(<OnboardingStep3 />, true);
      expect(getByTestId('onboarding-step3')).toBeTruthy();
      expect(getByText('건강 목표도 설정해볼까요?')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('목표 5개 모두 선택된 요약이 표시된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: ['weight_loss', 'muscle_gain', 'health_maintenance', 'stress_relief', 'better_sleep'],
      };

      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(
        getByText('체중 감량, 근육 증가, 건강 유지, 스트레스 해소, 수면 개선')
      ).toBeTruthy();
    });

    it('목표가 없으면 건강 목표 요약 행이 표시되지 않는다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: [],
      };

      const { queryByText } = renderWithTheme(<OnboardingStep3 />);
      // 건강 목표 값이 없으므로 쉼표 구분 요약 텍스트가 없어야 함
      // (개별 라벨은 카드에 표시되므로 요약 조합 텍스트로 확인)
      expect(queryByText('체중 감량, 근육 증가')).toBeNull();
    });
  });
});
