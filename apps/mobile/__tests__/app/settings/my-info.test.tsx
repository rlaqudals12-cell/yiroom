/**
 * 내 정보 수정 화면 테스트
 *
 * 대상: app/settings/my-info.tsx
 * 의존성: useUser (Clerk), useClerkSupabaseClient, useTheme, Alert, ActivityIndicator
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

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

// react-native-reanimated mock
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown => new Proxy({}, { get: () => createChainable });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    FadeInUp: createChainable(), FadeIn: createChainable(), FadeInDown: createChainable(),
    ZoomIn: createChainable(), SlideInRight: createChainable(), SlideInLeft: createChainable(),
    Easing: { out: () => ({}), exp: {}, bezier: () => ({}), linear: {}, ease: {}, in: () => ({}), inOut: () => ({}) },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v, withSpring: (v: unknown) => v, withDelay: (_d: unknown, v: unknown) => v,
  };
});

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

// Supabase mock
const mockSingle = jest.fn().mockResolvedValue({
  data: {
    nickname: '테스트닉네임',
    birthdate: '1995-05-15',
    gender: 'female',
    height_cm: 165,
    weight_kg: 55,
    skin_type: 'combination',
  },
  error: null,
});
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    from: jest.fn((table: string) => ({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
    })),
  }),
}));

jest.spyOn(Alert, 'alert');

import MyInfoScreen from '../../../app/settings/my-info';

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

describe('MyInfoScreen (내 정보 수정)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 기본 Supabase 응답 복원
    mockSingle.mockResolvedValue({
      data: {
        nickname: '테스트닉네임',
        birthdate: '1995-05-15',
        gender: 'female',
        height_cm: 165,
        weight_kg: 55,
        skin_type: 'combination',
      },
      error: null,
    });
  });

  // ---------------------------------------------------------------
  // 기본 렌더링
  // ---------------------------------------------------------------
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<MyInfoScreen />);
      expect(getByTestId('settings-my-info-screen')).toBeTruthy();
    });

    it('세 개의 섹션 제목이 표시된다', () => {
      const { getByText, getAllByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('기본 정보')).toBeTruthy();
      expect(getByText('신체 정보')).toBeTruthy();
      // "피부 타입"은 섹션 제목과 필드 라벨 양쪽에 존재
      expect(getAllByText('피부 타입').length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------
  // 기본 정보 필드
  // ---------------------------------------------------------------
  describe('기본 정보 필드', () => {
    it('닉네임 필드가 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('닉네임')).toBeTruthy();
      expect(getByLabelText('닉네임 입력')).toBeTruthy();
    });

    it('닉네임 필드에 placeholder가 있다', () => {
      const { getByPlaceholderText } = renderWithTheme(<MyInfoScreen />);
      expect(getByPlaceholderText('닉네임을 입력해주세요')).toBeTruthy();
    });

    it('닉네임 입력값을 변경할 수 있다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      const input = getByLabelText('닉네임 입력');
      fireEvent.changeText(input, '새닉네임');
      expect(input.props.value).toBe('새닉네임');
    });

    it('생년월일 필드가 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('생년월일')).toBeTruthy();
      expect(getByLabelText('생년월일 입력')).toBeTruthy();
    });

    it('생년월일 placeholder가 YYYY-MM-DD 형식이다', () => {
      const { getByPlaceholderText } = renderWithTheme(<MyInfoScreen />);
      expect(getByPlaceholderText('YYYY-MM-DD')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // 성별 선택
  // ---------------------------------------------------------------
  describe('성별 선택', () => {
    it('성별 라벨이 표시된다', () => {
      const { getByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('성별')).toBeTruthy();
    });

    it('세 가지 성별 옵션이 모두 표시된다', () => {
      const { getByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('남성')).toBeTruthy();
      expect(getByText('여성')).toBeTruthy();
      expect(getByText('기타')).toBeTruthy();
    });

    it('성별 버튼 클릭 시 선택 상태가 변경된다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      const maleButton = getByLabelText('남성');
      fireEvent.press(maleButton);

      // 선택 후 accessibilityState가 변경됨
      expect(maleButton.props.accessibilityState).toEqual({ selected: true });
    });

    it('다른 성별 선택 시 이전 선택이 해제된다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      fireEvent.press(getByLabelText('남성'));
      fireEvent.press(getByLabelText('여성'));

      expect(getByLabelText('남성').props.accessibilityState).toEqual({ selected: false });
      expect(getByLabelText('여성').props.accessibilityState).toEqual({ selected: true });
    });

    it('성별 버튼에 radio 역할이 지정되어 있다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      expect(getByLabelText('남성').props.accessibilityRole).toBe('radio');
      expect(getByLabelText('여성').props.accessibilityRole).toBe('radio');
      expect(getByLabelText('기타').props.accessibilityRole).toBe('radio');
    });
  });

  // ---------------------------------------------------------------
  // 신체 정보 필드
  // ---------------------------------------------------------------
  describe('신체 정보 필드', () => {
    it('키 입력 필드가 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('키')).toBeTruthy();
      expect(getByLabelText('키 입력')).toBeTruthy();
    });

    it('키 단위(cm)가 표시된다', () => {
      const { getByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('cm')).toBeTruthy();
    });

    it('몸무게 입력 필드가 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('몸무게')).toBeTruthy();
      expect(getByLabelText('몸무게 입력')).toBeTruthy();
    });

    it('몸무게 단위(kg)가 표시된다', () => {
      const { getByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('kg')).toBeTruthy();
    });

    it('키 입력값을 변경할 수 있다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      const input = getByLabelText('키 입력');
      fireEvent.changeText(input, '175');
      expect(input.props.value).toBe('175');
    });

    it('몸무게 입력값을 변경할 수 있다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      const input = getByLabelText('몸무게 입력');
      fireEvent.changeText(input, '70');
      expect(input.props.value).toBe('70');
    });
  });

  // ---------------------------------------------------------------
  // 피부 타입 선택
  // ---------------------------------------------------------------
  describe('피부 타입 선택', () => {
    it('피부 타입 라벨이 표시된다', () => {
      const { getAllByText } = renderWithTheme(<MyInfoScreen />);
      // 섹션 제목과 필드 라벨 모두 "피부 타입"
      expect(getAllByText('피부 타입').length).toBeGreaterThanOrEqual(1);
    });

    it('다섯 가지 피부 타입 옵션이 모두 표시된다', () => {
      const { getByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('건성')).toBeTruthy();
      expect(getByText('지성')).toBeTruthy();
      expect(getByText('복합성')).toBeTruthy();
      expect(getByText('민감성')).toBeTruthy();
      expect(getByText('중성')).toBeTruthy();
    });

    it('피부 타입 버튼 클릭 시 선택 상태가 변경된다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      const dryButton = getByLabelText('피부 타입 건성');
      fireEvent.press(dryButton);
      expect(dryButton.props.accessibilityState).toEqual({ selected: true });
    });

    it('다른 피부 타입 선택 시 이전 선택이 해제된다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      fireEvent.press(getByLabelText('피부 타입 건성'));
      fireEvent.press(getByLabelText('피부 타입 지성'));

      expect(getByLabelText('피부 타입 건성').props.accessibilityState).toEqual({ selected: false });
      expect(getByLabelText('피부 타입 지성').props.accessibilityState).toEqual({ selected: true });
    });

    it('피부 타입 버튼에 radio 역할이 지정되어 있다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      expect(getByLabelText('피부 타입 건성').props.accessibilityRole).toBe('radio');
    });
  });

  // ---------------------------------------------------------------
  // 저장 버튼
  // ---------------------------------------------------------------
  describe('저장 버튼', () => {
    it('저장 버튼이 표시된다', () => {
      const { getByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText('저장')).toBeTruthy();
    });

    it('저장 버튼에 button 역할이 지정되어 있다', () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      expect(getByLabelText('정보 저장').props.accessibilityRole).toBe('button');
    });

    it('닉네임이 비어있을 때 저장 시 Alert가 표시된다', async () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);
      // 닉네임 비우기
      const nicknameInput = getByLabelText('닉네임 입력');
      fireEvent.changeText(nicknameInput, '');

      // 저장 버튼 클릭
      fireEvent.press(getByLabelText('정보 저장'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '알림',
          '닉네임을 입력해주세요.'
        );
      });
    });

    it('저장 성공 시 완료 Alert가 표시된다', async () => {
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: null });

      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);

      // 닉네임 입력
      const nicknameInput = getByLabelText('닉네임 입력');
      fireEvent.changeText(nicknameInput, '새닉네임');

      // 저장 버튼 클릭
      fireEvent.press(getByLabelText('정보 저장'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '저장 완료',
          '내 정보가 저장되었어요.'
        );
      });
    });

    it('저장 실패 시 오류 Alert가 표시된다', async () => {
      mockUpdateEq.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);

      // 닉네임 입력
      const nicknameInput = getByLabelText('닉네임 입력');
      fireEvent.changeText(nicknameInput, '새닉네임');

      // 저장 버튼 클릭
      fireEvent.press(getByLabelText('정보 저장'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '오류',
          '저장에 실패했어요. 다시 시도해주세요.'
        );
      });
    });
  });

  // ---------------------------------------------------------------
  // DB 데이터 로드
  // ---------------------------------------------------------------
  describe('DB 데이터 로드', () => {
    it('DB에서 사용자 정보를 로드한다', async () => {
      renderWithTheme(<MyInfoScreen />);

      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalledWith(
          'nickname, birthdate, gender, height_cm, weight_kg, skin_type'
        );
      });
    });

    it('DB 데이터가 필드에 반영된다', async () => {
      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);

      await waitFor(() => {
        expect(getByLabelText('닉네임 입력').props.value).toBe('테스트닉네임');
      });
    });

    it('DB에 데이터가 없으면 Clerk 이름으로 초기화된다', async () => {
      // beforeEach에서 복원된 기본값을 덮어씌움
      mockSingle.mockReset();
      mockSingle.mockResolvedValue({ data: null, error: null });

      const { getByLabelText } = renderWithTheme(<MyInfoScreen />);

      await waitFor(() => {
        expect(getByLabelText('닉네임 입력').props.value).toBe('테스트');
      });
    });
  });

  // ---------------------------------------------------------------
  // 안내 텍스트
  // ---------------------------------------------------------------
  describe('안내 텍스트', () => {
    it('맞춤형 분석 안내 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<MyInfoScreen />);
      expect(getByText(/맞춤형 분석과 추천에 활용돼요/)).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // 다크 모드
  // ---------------------------------------------------------------
  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<MyInfoScreen />, true);
      expect(getByTestId('settings-my-info-screen')).toBeTruthy();
    });
  });
});
