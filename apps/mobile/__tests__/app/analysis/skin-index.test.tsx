/**
 * S-1 피부 분석 시작 화면 테스트
 *
 * 대상: app/(analysis)/skin/index.tsx
 * 의존성: expo-router, useTheme, SafeAreaView
 */
import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';

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

const mockGetToken = jest.fn().mockResolvedValue('jwt-token');
const mockFetchSafetyProfile = jest.fn();
const mockSaveSafetyProfile = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true }),
}));

jest.mock('../../../lib/api/safety', () => ({
  fetchSafetyProfile: (...args: unknown[]) => mockFetchSafetyProfile(...args),
  saveSafetyProfile: (...args: unknown[]) => mockSaveSafetyProfile(...args),
}));

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

import SkinAnalysisScreen from '../../../app/(analysis)/skin/index';
import { router } from 'expo-router';

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

describe('SkinAnalysisScreen (시작 화면)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('jwt-token');
    mockFetchSafetyProfile.mockResolvedValue({
      conditions: [],
      medications: [],
      consentGiven: false,
    });
    mockSaveSafetyProfile.mockResolvedValue({
      conditions: [],
      medications: [],
      consentGiven: true,
    });
  });

  describe('초기 렌더링', () => {
    it('testID "analysis-skin-screen"이 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByTestId('analysis-skin-screen')).toBeTruthy();
    });

    it('제목 "AI 피부 분석"이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByText('AI 피부 분석')).toBeTruthy();
    });

    it('설명 텍스트가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      // ScrollView 내에 줄바꿈 포함 텍스트
      expect(getByText(/사진 한 장으로 나의 피부 타입과/)).toBeTruthy();
    });

    it('피부 모듈 아이콘이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByText('💧')).toBeTruthy();
    });
  });

  describe('분석 항목 카드', () => {
    it('"분석 항목" 카드 제목이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByText('분석 항목')).toBeTruthy();
    });

    it('7가지 분석 항목이 모두 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);

      const items = ['피부 타입', '수분도', '유분도', '모공', '주름', '색소침착', '민감도'];

      items.forEach((item) => {
        expect(getByText(item)).toBeTruthy();
      });
    });

    it('각 분석 항목의 설명이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);

      expect(getByText('건성/지성/복합/민감성')).toBeTruthy();
      expect(getByText('피부 수분 레벨 측정')).toBeTruthy();
      expect(getByText('피부 유분 밸런스')).toBeTruthy();
    });
  });

  describe('촬영 가이드 카드', () => {
    it('"촬영 가이드" 카드 제목이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByText('촬영 가이드')).toBeTruthy();
    });

    it('촬영 가이드 항목이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByText(/화장을 지운 맨 얼굴로 촬영해주세요/)).toBeTruthy();
      expect(getByText(/밝은 자연광 아래에서 촬영하면 좋아요/)).toBeTruthy();
      expect(getByText(/정면을 바라보고 촬영해주세요/)).toBeTruthy();
    });
  });

  describe('안전 문진', () => {
    it('임신·수유와 이소트레티노인 문항을 촬영 전에 표시한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByText('현재 임신 중이거나 수유 중인가요?')).toBeTruthy();
      expect(getByText('현재 이소트레티노인을 복용 중인가요?')).toBeTruthy();
      expect(getByText('나중에 입력')).toBeTruthy();
    });

    it('나중에 입력을 누르면 fail-closed 상태로 카메라 페이지에 이동한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);

      fireEvent.press(getByText('나중에 입력'));

      expect(router.push).toHaveBeenCalledWith('/(analysis)/skin/camera');
    });

    it('결합 문항을 단일 marker로 저장한 뒤 카메라로 이동한다', async () => {
      const { getByTestId, getByLabelText, getByText } = renderWithTheme(<SkinAnalysisScreen />);

      fireEvent.press(within(getByTestId('pregnancy-breastfeeding-question')).getByText('네'));
      fireEvent.press(within(getByTestId('isotretinoin-question')).getByText('네'));
      fireEvent.press(getByLabelText('건강 정보 수집·이용 동의'));
      fireEvent.press(getByText('동의하고 계속'));

      await waitFor(() =>
        expect(mockSaveSafetyProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            conditions: ['pregnancy_or_breastfeeding'],
            medications: ['isotretinoin'],
            consentGiven: true,
          }),
          'jwt-token'
        )
      );
      expect(router.push).toHaveBeenCalledWith('/(analysis)/skin/camera');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(<SkinAnalysisScreen />, true);
      expect(getByTestId('analysis-skin-screen')).toBeTruthy();
      expect(getByText('AI 피부 분석')).toBeTruthy();
      expect(getByText('나중에 입력')).toBeTruthy();
    });
  });
});
