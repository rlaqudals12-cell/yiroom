/**
 * 온보딩 Step 3: 웰니스 목표 + 신체정보 (선택) 테스트
 *
 * 대상: app/(onboarding)/step3.tsx
 * 의존성: useOnboarding, useTheme, Button, ScreenContainer
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

// ADR-098: WELLNESS_PHASE2=false 이므로 Step3은 웰니스 목표 카드/요약 카드를 숨기고
// 신장/체중(선택) 신체정보만 수집한다. (건강 목표 UI는 게이팅으로 숨김)
describe('OnboardingStep3 (신체정보 입력)', () => {
  describe('렌더링', () => {
    it('testID="onboarding-step3" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('onboarding-step3')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('신체 정보도 알려주세요')).toBeTruthy();
    });

    it('부제목에 선택 사항 안내가 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText(/건너뛰어도 괜찮아요/)).toBeTruthy();
    });

    it('진행 표시 바가 3/3 단계로 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('step-progress')).toBeTruthy();
    });
  });

  describe('웰니스 목표 숨김 (WELLNESS_PHASE2=false)', () => {
    it('목표 카드가 렌더링되지 않는다', () => {
      const { queryByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(queryByTestId('goal-weight_loss')).toBeNull();
      expect(queryByTestId('goal-muscle_gain')).toBeNull();
      expect(queryByTestId('goal-better_sleep')).toBeNull();
    });

    it('목표 라벨이 표시되지 않는다', () => {
      const { queryByText } = renderWithTheme(<OnboardingStep3 />);
      expect(queryByText('체중 감량')).toBeNull();
      expect(queryByText('수면 개선')).toBeNull();
    });

    it('입력 요약 카드가 표시되지 않는다', () => {
      const { queryByText } = renderWithTheme(<OnboardingStep3 />);
      expect(queryByText('입력 요약')).toBeNull();
    });
  });

  describe('신장/체중 입력', () => {
    it('신장/체중 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('신장 / 체중 (선택)')).toBeTruthy();
    });

    it('키/체중 입력 필드가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('height-input')).toBeTruthy();
      expect(getByTestId('weight-input')).toBeTruthy();
    });

    it('키 입력 시 setBasicInfo가 height와 함께 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.changeText(getByTestId('height-input'), '175');
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ height: 175 });
    });

    it('체중 입력 시 setBasicInfo가 weight와 함께 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.changeText(getByTestId('weight-input'), '68');
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ weight: 68 });
    });

    it('범위 밖 값 입력 시 setBasicInfo가 호출되지 않는다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      // 0은 유효 범위(0 < h < 300) 밖
      fireEvent.changeText(getByTestId('height-input'), '0');
      expect(mockSetBasicInfo).not.toHaveBeenCalled();
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

    it('건너뛰기 버튼 클릭 시 completeOnboarding이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('skip-button'));
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });

    it('시작하기 버튼 클릭 시 completeOnboarding이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('complete-button'));
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링된다', () => {
      const { getByTestId, getByText } = renderWithTheme(<OnboardingStep3 />, true);
      expect(getByTestId('onboarding-step3')).toBeTruthy();
      expect(getByText('신체 정보도 알려주세요')).toBeTruthy();
    });
  });
});
