/**
 * 개인정보 설정 화면 테스트
 *
 * 대상: app/settings/privacy.tsx
 * 의존성: useAuth (Clerk), useClerkSupabaseClient, useTheme, Alert, Switch
 */
import React from 'react';
import { Alert } from 'react-native';
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

// Supabase mock
const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    rpc: mockRpc,
    from: jest.fn(() => ({
      update: mockUpdate,
      eq: mockEq,
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test_user_123' } },
        error: null,
      }),
    },
  }),
}));

jest.spyOn(Alert, 'alert');

import PrivacySettingsScreen from '../../../app/settings/privacy';

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

describe('PrivacySettingsScreen (개인정보 설정)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // 기본 렌더링
  // ---------------------------------------------------------------
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByTestId('settings-privacy-screen')).toBeTruthy();
    });

    it('세 개의 섹션 제목이 표시된다', () => {
      const { getAllByText, getByText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('데이터 수집')).toBeTruthy();
      // "프로필 공개"는 섹션 제목과 토글 라벨 모두에 존재
      expect(getAllByText('프로필 공개').length).toBeGreaterThanOrEqual(2);
      expect(getByText('데이터 관리')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // 데이터 수집 토글
  // ---------------------------------------------------------------
  describe('데이터 수집 토글', () => {
    it('분석 데이터 수집 동의 토글이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('분석 데이터 수집 동의')).toBeTruthy();
      expect(getByText('서비스 개선을 위한 익명 데이터 수집')).toBeTruthy();
      expect(getByLabelText('분석 데이터 수집 동의')).toBeTruthy();
    });

    it('마케팅 정보 수신 토글이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('마케팅 정보 수신')).toBeTruthy();
      expect(getByText('이벤트, 할인, 새 기능 소식 알림')).toBeTruthy();
      expect(getByLabelText('마케팅 정보 수신')).toBeTruthy();
    });

    it('분석 데이터 수집 동의 기본값이 true이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('분석 데이터 수집 동의');
      expect(toggle.props.value).toBe(true);
    });

    it('마케팅 정보 수신 기본값이 false이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('마케팅 정보 수신');
      expect(toggle.props.value).toBe(false);
    });

    it('마케팅 정보 수신 토글을 변경할 수 있다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('마케팅 정보 수신');
      fireEvent(toggle, 'valueChange', true);
      expect(toggle.props.value).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // 프로필 공개 토글
  // ---------------------------------------------------------------
  describe('프로필 공개 토글', () => {
    it('프로필 공개 토글이 표시된다', () => {
      const { getAllByText, getByText, getByLabelText } = renderWithTheme(
        <PrivacySettingsScreen />
      );
      // "프로필 공개"는 섹션 제목과 토글 라벨 양쪽에 존재
      expect(getAllByText('프로필 공개').length).toBeGreaterThanOrEqual(2);
      expect(getByText('다른 사용자가 내 프로필을 볼 수 있어요')).toBeTruthy();
      expect(getByLabelText('프로필 공개')).toBeTruthy();
    });

    it('분석 결과 공유 허용 토글이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('분석 결과 공유 허용')).toBeTruthy();
      expect(getByText('분석 결과를 친구와 공유할 수 있어요')).toBeTruthy();
      expect(getByLabelText('분석 결과 공유 허용')).toBeTruthy();
    });

    it('프로필 공개 기본값이 false이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('프로필 공개');
      expect(toggle.props.value).toBe(false);
    });

    it('분석 결과 공유 허용 기본값이 false이다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const toggle = getByLabelText('분석 결과 공유 허용');
      expect(toggle.props.value).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // 데이터 관리
  // ---------------------------------------------------------------
  describe('데이터 관리', () => {
    it('내 데이터 다운로드 버튼이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('내 데이터 다운로드')).toBeTruthy();
      expect(getByText('저장된 모든 데이터를 파일로 받아보세요')).toBeTruthy();
      expect(getByLabelText('내 데이터 다운로드')).toBeTruthy();
    });

    it('내 데이터 다운로드 버튼이 클릭 가능하다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      const button = getByLabelText('내 데이터 다운로드');
      // 비동기 데이터 내보내기 함수가 호출됨 (실제 Supabase 호출은 mock)
      expect(() => fireEvent.press(button)).not.toThrow();
    });

    it('계정 삭제 버튼이 표시된다', () => {
      const { getByText, getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText('계정 삭제')).toBeTruthy();
      expect(getByText('모든 데이터가 영구 삭제돼요')).toBeTruthy();
      expect(getByLabelText('계정 삭제')).toBeTruthy();
    });

    it('계정 삭제 텍스트가 destructive 색상으로 표시된다', () => {
      const { getByText } = renderWithTheme(<PrivacySettingsScreen />);
      const deleteText = getByText('계정 삭제');
      // destructive 색상이 스타일에 포함됨
      const flatStyle = Array.isArray(deleteText.props.style)
        ? Object.assign({}, ...deleteText.props.style)
        : deleteText.props.style;
      expect(flatStyle.color).toBe(lightColors.destructive);
    });

    it('계정 삭제 클릭 시 30일 유예기간 포함 확인 Alert가 표시된다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('계정 삭제'));
      expect(Alert.alert).toHaveBeenCalledWith(
        '계정 삭제',
        expect.stringContaining('30일'),
        expect.arrayContaining([
          expect.objectContaining({ text: '취소', style: 'cancel' }),
          expect.objectContaining({ text: '삭제 요청', style: 'destructive' }),
        ])
      );
    });

    it('계정 삭제 Alert 메시지에 복구 안내가 포함된다', () => {
      const { getByLabelText } = renderWithTheme(<PrivacySettingsScreen />);
      fireEvent.press(getByLabelText('계정 삭제'));
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const message = alertCall[1] as string;
      expect(message).toContain('다시 로그인하면 삭제를 취소할 수 있어요');
      expect(message).toContain('복구할 수 없어요');
    });
  });

  // ---------------------------------------------------------------
  // 안내 텍스트
  // ---------------------------------------------------------------
  describe('안내 텍스트', () => {
    it('개인정보 안내 텍스트가 표시된다', () => {
      const { getByText } = renderWithTheme(<PrivacySettingsScreen />);
      expect(getByText(/안전하게 암호화되어 저장돼요/)).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------
  // 다크 모드
  // ---------------------------------------------------------------
  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<PrivacySettingsScreen />, true);
      expect(getByTestId('settings-privacy-screen')).toBeTruthy();
    });
  });
});
