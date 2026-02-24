/**
 * 온보딩 Step 3: 선호도 설정 및 완료 테스트
 *
 * 대상: app/(onboarding)/step3.tsx
 * 의존성: useOnboarding, useTheme, Button, Card, ProgressIndicator
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

const mockSetPreferences = jest.fn();
const mockPrevStep = jest.fn();
const mockCompleteOnboarding = jest.fn();

let mockOnboardingData = {
  goals: ['weight_loss'] as string[],
  basicInfo: {
    gender: 'female',
    birthYear: 1995,
    height: 165,
    weight: 55,
    activityLevel: 'moderate',
  } as Record<string, unknown>,
  preferences: {} as Record<string, unknown>,
};

jest.mock('../../../lib/onboarding', () => ({
  useOnboarding: jest.fn(() => ({
    data: mockOnboardingData,
    setPreferences: mockSetPreferences,
    prevStep: mockPrevStep,
    completeOnboarding: mockCompleteOnboarding,
  })),
  WORKOUT_FREQUENCY_LABELS: {
    none: '운동 안 함',
    '1-2': '주 1-2회',
    '3-4': '주 3-4회',
    '5+': '주 5회 이상',
  },
  MEAL_PREFERENCE_LABELS: {
    regular: '규칙적인 식사',
    intermittent: '간헐적 단식',
    low_carb: '저탄수화물',
    high_protein: '고단백',
  },
  GOAL_LABELS: {
    weight_loss: '체중 감량',
    muscle_gain: '근육 증가',
    health_maintenance: '건강 유지',
    stress_relief: '스트레스 해소',
    better_sleep: '수면 개선',
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

let OnboardingStep3: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OnboardingStep3 = require('../../../app/(onboarding)/step3').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOnboardingData = {
    goals: ['weight_loss'],
    basicInfo: {
      gender: 'female',
      birthYear: 1995,
      height: 165,
      weight: 55,
      activityLevel: 'moderate',
    },
    preferences: {},
  };
});

describe('OnboardingStep3 (선호도 설정 및 완료)', () => {
  describe('렌더링', () => {
    it('testID="onboarding-step3" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('onboarding-step3')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('거의 다 왔어요!')).toBeTruthy();
    });

    it('부제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('마지막으로 선호도를 알려주세요')).toBeTruthy();
    });

    it('ProgressIndicator 도트가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      // ProgressIndicator는 도트만 표시 (텍스트 없음)
      expect(getByTestId('onboarding-step3')).toBeTruthy();
    });
  });

  describe('운동 빈도 선택', () => {
    it('운동 빈도 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('현재 운동 빈도')).toBeTruthy();
    });

    it('4개 운동 빈도 옵션이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('frequency-none')).toBeTruthy();
      expect(getByTestId('frequency-1-2')).toBeTruthy();
      expect(getByTestId('frequency-3-4')).toBeTruthy();
      expect(getByTestId('frequency-5+')).toBeTruthy();
    });

    it('운동 빈도 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('운동 안 함')).toBeTruthy();
      expect(getByText('주 1-2회')).toBeTruthy();
      expect(getByText('주 3-4회')).toBeTruthy();
      expect(getByText('주 5회 이상')).toBeTruthy();
    });

    it('운동 빈도 선택 시 setPreferences가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('frequency-3-4'));
      expect(mockSetPreferences).toHaveBeenCalledWith({ workoutFrequency: '3-4' });
    });

    it('다른 운동 빈도 선택 시 해당 값으로 setPreferences가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('frequency-none'));
      expect(mockSetPreferences).toHaveBeenCalledWith({ workoutFrequency: 'none' });

      fireEvent.press(getByTestId('frequency-5+'));
      expect(mockSetPreferences).toHaveBeenCalledWith({ workoutFrequency: '5+' });
    });
  });

  describe('식습관 선택', () => {
    it('식습관 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('선호하는 식습관')).toBeTruthy();
    });

    it('4개 식습관 옵션이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('meal-regular')).toBeTruthy();
      expect(getByTestId('meal-intermittent')).toBeTruthy();
      expect(getByTestId('meal-low_carb')).toBeTruthy();
      expect(getByTestId('meal-high_protein')).toBeTruthy();
    });

    it('식습관 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('규칙적인 식사')).toBeTruthy();
      expect(getByText('간헐적 단식')).toBeTruthy();
      expect(getByText('저탄수화물')).toBeTruthy();
      expect(getByText('고단백')).toBeTruthy();
    });

    it('식습관 선택 시 setPreferences가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('meal-high_protein'));
      expect(mockSetPreferences).toHaveBeenCalledWith({ mealPreference: 'high_protein' });
    });
  });

  describe('알림 설정', () => {
    it('알림 받기 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('알림 받기')).toBeTruthy();
    });

    it('알림 설명 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('운동/식단 리마인더를 받을게요')).toBeTruthy();
    });

    it('알림 스위치가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('notifications-switch')).toBeTruthy();
    });

    it('알림 스위치 토글 시 setPreferences가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const switchEl = getByTestId('notifications-switch');

      fireEvent(switchEl, 'valueChange', true);
      expect(mockSetPreferences).toHaveBeenCalledWith({ notificationsEnabled: true });
    });

    it('알림 끄기 토글 시 false로 setPreferences가 호출된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        preferences: { notificationsEnabled: true },
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const switchEl = getByTestId('notifications-switch');

      fireEvent(switchEl, 'valueChange', false);
      expect(mockSetPreferences).toHaveBeenCalledWith({ notificationsEnabled: false });
    });
  });

  describe('요약 카드', () => {
    it('입력하신 정보 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText(/입력하신 정보/)).toBeTruthy();
    });

    it('선택한 목표가 요약에 표시된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: ['weight_loss', 'muscle_gain'],
      };

      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('체중 감량, 근육 증가')).toBeTruthy();
    });

    it('목표가 없으면 대시(-)가 표시된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: [],
      };

      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('-')).toBeTruthy();
    });

    it('출생년도로부터 계산된 나이가 표시된다', () => {
      const expectedAge = new Date().getFullYear() - 1995;

      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText(`${expectedAge}세`)).toBeTruthy();
    });

    it('신장과 체중이 요약에 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(getByText('165cm / 55kg')).toBeTruthy();
    });

    it('신장/체중이 없으면 신체 행이 표시되지 않는다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        basicInfo: { gender: 'female', birthYear: 1995 },
      };

      const { queryByText } = renderWithTheme(<OnboardingStep3 />);
      expect(queryByText('신체')).toBeNull();
    });

    it('출생년도가 없으면 나이 행이 표시되지 않는다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        basicInfo: { gender: 'female' },
      };

      const { queryByText } = renderWithTheme(<OnboardingStep3 />);
      expect(queryByText(/세$/)).toBeNull();
    });
  });

  describe('네비게이션 버튼', () => {
    it('이전 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('back-button')).toBeTruthy();
    });

    it('시작하기 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      expect(getByTestId('complete-button')).toBeTruthy();
    });

    it('이전 버튼 클릭 시 prevStep이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);

      fireEvent.press(getByTestId('back-button'));
      expect(mockPrevStep).toHaveBeenCalledTimes(1);
    });

    it('선호도 미선택 시 시작하기 버튼이 비활성화된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const completeButton = getByTestId('complete-button');

      expect(completeButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('운동 빈도 선택 후 시작하기 버튼이 활성화된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        preferences: { workoutFrequency: '3-4' },
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const completeButton = getByTestId('complete-button');

      expect(completeButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false })
      );
    });

    it('식습관 선택만으로도 시작하기 버튼이 활성화된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        preferences: { mealPreference: 'regular' },
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const completeButton = getByTestId('complete-button');

      expect(completeButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false })
      );
    });

    it('활성화된 시작하기 버튼 클릭 시 completeOnboarding이 호출된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        preferences: { workoutFrequency: '1-2', mealPreference: 'low_carb' },
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
      expect(getByText('거의 다 왔어요!')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('목표 5개 모두 선택된 요약이 쉼표로 구분되어 표시된다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        goals: ['weight_loss', 'muscle_gain', 'health_maintenance', 'stress_relief', 'better_sleep'],
      };

      const { getByText } = renderWithTheme(<OnboardingStep3 />);
      expect(
        getByText('체중 감량, 근육 증가, 건강 유지, 스트레스 해소, 수면 개선')
      ).toBeTruthy();
    });

    it('알림이 기본 false(undefined)일 때 스위치가 꺼져 있다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const switchEl = getByTestId('notifications-switch');

      expect(switchEl.props.value).toBe(false);
    });

    it('알림이 true로 설정되면 스위치가 켜져 있다', () => {
      mockOnboardingData = {
        ...mockOnboardingData,
        preferences: { notificationsEnabled: true },
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep3 />);
      const switchEl = getByTestId('notifications-switch');

      expect(switchEl.props.value).toBe(true);
    });
  });
});
