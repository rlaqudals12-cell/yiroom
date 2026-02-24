/**
 * 온보딩 Step 2: 기본 정보 입력 테스트
 *
 * 대상: app/(onboarding)/step2.tsx
 * 의존성: useOnboarding, useTheme, Button, Input, ProgressIndicator
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

const mockSetBasicInfo = jest.fn();
const mockNextStep = jest.fn();
const mockPrevStep = jest.fn();

let mockOnboardingData = {
  goals: ['weight_loss'],
  basicInfo: {} as Record<string, unknown>,
  preferences: {},
};

jest.mock('../../../lib/onboarding', () => ({
  useOnboarding: jest.fn(() => ({
    data: mockOnboardingData,
    setBasicInfo: mockSetBasicInfo,
    nextStep: mockNextStep,
    prevStep: mockPrevStep,
  })),
  GENDER_LABELS: {
    male: '남성',
    female: '여성',
    other: '기타',
  },
  ACTIVITY_LEVEL_LABELS: {
    sedentary: '거의 안함',
    light: '가벼운 활동',
    moderate: '보통',
    active: '활발함',
    very_active: '매우 활발함',
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

let OnboardingStep2: React.ComponentType;

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  OnboardingStep2 = require('../../../app/(onboarding)/step2').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOnboardingData = {
    goals: ['weight_loss'],
    basicInfo: {},
    preferences: {},
  };
});

describe('OnboardingStep2 (기본 정보 입력)', () => {
  describe('렌더링', () => {
    it('testID="onboarding-step2" 컨테이너가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('onboarding-step2')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('기본 정보를 알려주세요')).toBeTruthy();
    });

    it('부제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('더 정확한 맞춤 추천을 위해 필요해요')).toBeTruthy();
    });

    it('ProgressIndicator 도트가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      // ProgressIndicator는 도트만 표시 (텍스트 없음)
      expect(getByTestId('onboarding-step2')).toBeTruthy();
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
      expect(getByTestId('gender-other')).toBeTruthy();
    });

    it('성별 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('남성')).toBeTruthy();
      expect(getByText('여성')).toBeTruthy();
      expect(getByText('기타')).toBeTruthy();
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

      fireEvent.press(getByTestId('gender-other'));
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ gender: 'other' });
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

  describe('신장/체중 입력 (선택)', () => {
    it('신장/체중 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('신장 / 체중 (선택)')).toBeTruthy();
    });

    it('신장 입력 필드가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('height-input')).toBeTruthy();
    });

    it('체중 입력 필드가 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('weight-input')).toBeTruthy();
    });

    it('단위 레이블(cm, kg)이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('cm')).toBeTruthy();
      expect(getByText('kg')).toBeTruthy();
    });

    it('유효한 신장 입력 시 setBasicInfo가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('height-input');

      fireEvent.changeText(input, '175');
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ height: 175 });
    });

    it('유효한 체중 입력 시 setBasicInfo가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('weight-input');

      fireEvent.changeText(input, '68');
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ weight: 68 });
    });

    it('범위 초과 신장(300 이상)은 setBasicInfo를 호출하지 않는다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('height-input');

      fireEvent.changeText(input, '300');
      expect(mockSetBasicInfo).not.toHaveBeenCalled();
    });

    it('0 이하 체중은 setBasicInfo를 호출하지 않는다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('weight-input');

      fireEvent.changeText(input, '0');
      expect(mockSetBasicInfo).not.toHaveBeenCalled();
    });
  });

  describe('활동 수준 선택', () => {
    it('활동 수준 섹션 제목이 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('평소 활동 수준')).toBeTruthy();
    });

    it('5개 활동 수준 옵션이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      expect(getByTestId('activity-sedentary')).toBeTruthy();
      expect(getByTestId('activity-light')).toBeTruthy();
      expect(getByTestId('activity-moderate')).toBeTruthy();
      expect(getByTestId('activity-active')).toBeTruthy();
      expect(getByTestId('activity-very_active')).toBeTruthy();
    });

    it('활동 수준 라벨이 한국어로 표시된다', () => {
      const { getByText } = renderWithTheme(<OnboardingStep2 />);
      expect(getByText('거의 안함')).toBeTruthy();
      expect(getByText('가벼운 활동')).toBeTruthy();
      expect(getByText('보통')).toBeTruthy();
      expect(getByText('활발함')).toBeTruthy();
      expect(getByText('매우 활발함')).toBeTruthy();
    });

    it('활동 수준 선택 시 setBasicInfo가 호출된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);

      fireEvent.press(getByTestId('activity-moderate'));
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ activityLevel: 'moderate' });
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
        goals: ['weight_loss'],
        basicInfo: {},
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('성별+출생년도+활동수준 입력 후 다음 버튼이 활성화된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: {
          gender: 'female',
          birthYear: 1995,
          activityLevel: 'moderate',
        },
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false })
      );
    });

    it('성별만 입력 시 다음 버튼이 비활성화 상태를 유지한다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: { gender: 'male' },
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const nextButton = getByTestId('next-button');

      expect(nextButton.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      );
    });

    it('활성화된 다음 버튼 클릭 시 nextStep이 호출된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: {
          gender: 'male',
          birthYear: 2000,
          activityLevel: 'active',
        },
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);

      fireEvent.press(getByTestId('next-button'));
      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('기존 데이터 복원', () => {
    it('기존에 저장된 출생년도가 입력 필드에 표시된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: { birthYear: 1990 },
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('birthYear-input');

      expect(input.props.value).toBe('1990');
    });

    it('기존에 저장된 신장이 입력 필드에 표시된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: { height: 170 },
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('height-input');

      expect(input.props.value).toBe('170');
    });

    it('기존에 저장된 체중이 입력 필드에 표시된다', () => {
      mockOnboardingData = {
        goals: ['weight_loss'],
        basicInfo: { weight: 65 },
        preferences: {},
      };

      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('weight-input');

      expect(input.props.value).toBe('65');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링된다', () => {
      const { getByTestId, getByText } = renderWithTheme(<OnboardingStep2 />, true);
      expect(getByTestId('onboarding-step2')).toBeTruthy();
      expect(getByText('기본 정보를 알려주세요')).toBeTruthy();
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

    it('소수점 체중(65.5)이 유효하게 처리된다', () => {
      const { getByTestId } = renderWithTheme(<OnboardingStep2 />);
      const input = getByTestId('weight-input');

      fireEvent.changeText(input, '65.5');
      expect(mockSetBasicInfo).toHaveBeenCalledWith({ weight: 65.5 });
    });
  });
});
