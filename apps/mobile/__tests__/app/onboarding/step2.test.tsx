/**
 * 온보딩 Step 2: 성별 / 스타일 선호 / 생년월일 테스트
 *
 * 대상: app/(onboarding)/step2.tsx
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

const mockSetBasicInfo = jest.fn();
const mockSetStylePreference = jest.fn();
const mockNextStep = jest.fn();
const mockPrevStep = jest.fn();

let mockOnboardingData = {
  analysisInterests: ['skin'] as string[],
  goals: [] as string[],
  basicInfo: {} as Record<string, unknown>,
  preferences: {},
  stylePreference: undefined as string | undefined,
};

jest.mock('../../../lib/onboarding', () => ({
  useOnboarding: jest.fn(() => ({
    data: mockOnboardingData,
    setBasicInfo: mockSetBasicInfo,
    setStylePreference: mockSetStylePreference,
    nextStep: mockNextStep,
    prevStep: mockPrevStep,
  })),
  GENDER_LABELS: {
    male: '남성',
    female: '여성',
    neutral: '선택 안 함',
  },
  STYLE_PREFERENCE_LABELS: {
    masculine: '남성적 스타일',
    feminine: '여성적 스타일',
    unisex: '유니섹스 스타일',
  },
  STYLE_PREFERENCE_DESCRIPTIONS: {
    masculine: '깔끔하고 심플한 스타일을 추천해요',
    feminine: '화사하고 부드러운 스타일을 추천해요',
    unisex: '성별 구분 없는 다양한 스타일을 추천해요',
  },
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

let OnboardingStep2: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OnboardingStep2 = require('../../../app/(onboarding)/step2').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOnboardingData = {
    analysisInterests: ['skin'],
    goals: [],
    basicInfo: {},
    preferences: {},
    stylePreference: undefined,
  };
});

describe('OnboardingStep2 (성별 / 스타일 / 생년월일)', () => {
  describe('렌더링', () => {
    it('testID="onboarding-step2" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('onboarding-step2')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('나에게 맞는 추천 받기')).toBeTruthy();
    });

    it('부제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('성별과 스타일에 맞는 맞춤 분석을 제공해요')).toBeTruthy();
    });
  });

  describe('성별 선택', () => {
    it('성별 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('성별')).toBeTruthy();
    });

    it('3개 성별 옵션이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('gender-male')).toBeTruthy();
      expect(getByTestId('gender-female')).toBeTruthy();
      expect(getByTestId('gender-neutral')).toBeTruthy();
    });

    it('성별 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('남성')).toBeTruthy();
      expect(getByText('여성')).toBeTruthy();
      expect(getByText('선택 안 함')).toBeTruthy();
    });

    it('성별 선택 시 setBasicInfo가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);

      fireEvent.press(getByTestId('gender-female'));
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ gender: 'female' });
    });

    it('다른 성별 선택 시 해당 값으로 setBasicInfo가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);

      fireEvent.press(getByTestId('gender-male'));
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ gender: 'male' });

      fireEvent.press(getByTestId('gender-neutral'));
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ gender: 'neutral' });
    });

    it('neutral 선택 시 setStylePreference("unisex")도 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);

      fireEvent.press(getByTestId('gender-neutral'));
      expect(mockSetStylePreference).toHaveBeenCalledWith('unisex');
    });
  });

  describe('출생년도 입력', () => {
    it('출생년도 입력 필드가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('birthYear-input')).toBeTruthy();
    });

    it('유효한 출생년도 입력 시 setBasicInfo가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('birthYear-input');

      fireEvent.changeText(input, '1995');
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ birthYear: 1995 });
    });

    it('유효하지 않은 출생년도(1899)는 setBasicInfo를 호출하지 않는다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('birthYear-input');

      fireEvent.changeText(input, '1899');
      expect(mockSetBasicInfo).not.toHaveBeenCalled();
    });

    it('부분 입력(2자리)은 setBasicInfo를 호출하지 않는다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('birthYear-input');

      fireEvent.changeText(input, '19');
      expect(mockSetBasicInfo).not.toHaveBeenCalled();
    });
  });

  describe('네비게이션 버튼', () => {
    it('이전 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('back-button')).toBeTruthy();
    });

    it('다음 버튼이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('next-button')).toBeTruthy();
    });

    it('이전 버튼 클릭 시 prevStep이 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);

      fireEvent.press(getByTestId('back-button'));
      expect(mockPrevStep).toHaveBeenCalledTimes(1);
    });

    it('필수 정보 미입력 시 다음 버튼이 비활성화된다', () => {
      mockOnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: {},
        preferences: {},
        stylePreference: undefined,
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('성별+출생년도 입력 후 다음 버튼이 활성화된다', () => {
      mockOnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: {
          gender: 'female',
          birthYear: 1995,
        },
        preferences: {},
        stylePreference: undefined,
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false })
      );
    });

    it('성별만 입력 시 다음 버튼이 비활성화 상태를 유지한다', () => {
      mockOnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: { gender: 'male' },
        preferences: {},
        stylePreference: undefined,
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('활성화된 다음 버튼 클릭 시 nextStep이 호출된다', () => {
      mockOnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: {
          gender: 'male',
          birthYear: 2000,
        },
        preferences: {},
        stylePreference: undefined,
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);

      fireEvent.press(getByTestId('next-button'));
      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('기존 데이터 복원', () => {
    it('기존에 저장된 출생년도가 입력 필드에 표시된다', () => {
      mockOnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: { birthYear: 1990 },
        preferences: {},
        stylePreference: undefined,
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('birthYear-input');

      expect(input.props.value).toBe('1990');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링된다', () => {
      const { getByTestId, getByText } = renderWithTheme(<OnboardingStep2 />, true);
      expect(getByTestId('onboarding-step2')).toBeTruthy();
      expect(getByText('나에게 맞는 추천 받기')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('현재 년도를 출생년도로 입력해도 setBasicInfo가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('birthYear-input');
      const currentYear = new Date().getFullYear().toString();

      fireEvent.changeText(input, currentYear);
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ birthYear: parseInt(currentYear, 10) });
    });
  });
});
