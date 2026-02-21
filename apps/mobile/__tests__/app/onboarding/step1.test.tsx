/**
 * 온보딩 Step 1: 목표 선택 테스트
 *
 * 대상: app/(onboarding)/step1.tsx
 * 의존성: useOnboarding, useTheme, Button, ProgressIndicator
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
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// ============================================================
// Mock 설정
// ============================================================

const mockToggleGoal = jest.fn();
const mockNextStep = jest.fn();

// useOnboarding의 반환값을 테스트마다 변경할 수 있도록 변수로 관리
let mockOnboardingData = {
  goals: [] as string[],
  basicInfo: {},
  preferences: {},
};

jest.mock('../../../lib/onboarding', () => ({
  useOnboarding: jest.fn(() => ({
    data: mockOnboardingData,
    toggleGoal: mockToggleGoal,
    nextStep: mockNextStep,
  })),
  GOAL_LABELS: {
    weight_loss: '체중 감량',
    muscle_gain: '근육 증가',
    health_maintenance: '건강 유지',
    stress_relief: '스트레스 해소',
    better_sleep: '수면 개선',
  },
  GOAL_ICONS: {
    weight_loss: '⚖️',
    muscle_gain: '💪',
    health_maintenance: '❤️',
    stress_relief: '🧘',
    better_sleep: '😴',
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) => <View {...props} />,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// lucide-react-native 아이콘 mock (MenuCard barrel import 경유)
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
    goals: [],
    basicInfo: {},
    preferences: {},
  };
});

describe('OnboardingStep1 (목표 선택)', () => {
  describe('렌더링', () => {
    it('testID="onboarding-step1" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);
      expect(getByTestId('onboarding-step1')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep1 />);
      expect(getByText('목표를 선택해주세요')).toBeTruthy();
    });

    it('부제목에 복수 선택 안내가 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep1 />);
      expect(getByText(/복수 선택 가능/)).toBeTruthy();
    });

    it('5개 목표 카드가 모두 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);
      expect(getByTestId('goal-weight_loss')).toBeTruthy();
      expect(getByTestId('goal-muscle_gain')).toBeTruthy();
      expect(getByTestId('goal-health_maintenance')).toBeTruthy();
      expect(getByTestId('goal-stress_relief')).toBeTruthy();
      expect(getByTestId('goal-better_sleep')).toBeTruthy();
    });

    it('목표 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep1 />);
      expect(getByText('체중 감량')).toBeTruthy();
      expect(getByText('근육 증가')).toBeTruthy();
      expect(getByText('건강 유지')).toBeTruthy();
      expect(getByText('스트레스 해소')).toBeTruthy();
      expect(getByText('수면 개선')).toBeTruthy();
    });

    it('ProgressIndicator에 1/3이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep1 />);
      expect(getByText('1 / 3')).toBeTruthy();
    });

    it('다음 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);
      expect(getByTestId('next-button')).toBeTruthy();
    });
  });

  describe('목표 선택 상호작용', () => {
    it('목표 카드 클릭 시 toggleGoal이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);

      fireEvent.press(getByTestId('goal-weight_loss'));
      expect(mockToggleGoal).toHaveBeenCalledWith('weight_loss');
    });

    it('다른 목표 카드 클릭 시 해당 goal로 toggleGoal이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);

      fireEvent.press(getByTestId('goal-muscle_gain'));
      expect(mockToggleGoal).toHaveBeenCalledWith('muscle_gain');

      fireEvent.press(getByTestId('goal-better_sleep'));
      expect(mockToggleGoal).toHaveBeenCalledWith('better_sleep');
    });
  });

  describe('선택 상태 표시', () => {
    it('선택된 목표에 체크마크가 표시된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss', 'muscle_gain'],
        basicInfo: {},
        preferences: {},
      };

      // 체크마크 문자 존재 확인
      const { getAllByText } = renderWithTheme(<OnboardingStep1 />);
      const checkmarks = getAllByText('\u2713');
      expect(checkmarks.length).toBe(2);
    });

    it('선택되지 않은 목표에는 체크마크가 없다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: {},
        preferences: {},
      };

      const { getAllByText } = renderWithTheme(<OnboardingStep1 />);
      // 선택된 목표 1개만 체크마크 존재
      const checkmarks = getAllByText('\u2713');
      expect(checkmarks.length).toBe(1);
    });
  });

  describe('다음 버튼 활성화/비활성화', () => {
    it('목표 미선택 시 다음 버튼이 비활성화된다', () => {
      mockOnboardingData = {
        goals: [],
        basicInfo: {},
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('목표 선택 후 다음 버튼이 활성화된다', () => {
      mockOnboardingData = {
        goals: ['health_maintenance'],
        basicInfo: {},
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false })
      );
    });

    it('활성화된 다음 버튼 클릭 시 nextStep이 호출된다', () => {
      mockOnboardingData = {
        goals: ['stress_relief'],
        basicInfo: {},
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep1 />);

      fireEvent.press(getByTestId('next-button'));
      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: {},
        preferences: {},
      };

      const { getByTestId, getByText } = renderWithTheme(<OnboardingStep1 />, true);
      expect(getByTestId('onboarding-step1')).toBeTruthy();
      expect(getByText('목표를 선택해주세요')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('5개 목표 모두 선택된 상태에서 체크마크 5개가 표시된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss', 'muscle_gain', 'health_maintenance', 'stress_relief', 'better_sleep'],
        basicInfo: {},
        preferences: {},
      };

      const { getAllByText } = renderWithTheme(<OnboardingStep1 />);
      const checkmarks = getAllByText('\u2713');
      expect(checkmarks.length).toBe(5);
    });
  });
});
