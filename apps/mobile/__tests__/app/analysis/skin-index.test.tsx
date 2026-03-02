/**
 * S-1 피부 분석 시작 화면 테스트
 *
 * 대상: app/(analysis)/skin/index.tsx
 * 의존성: expo-router, useTheme, SafeAreaView
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
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

describe('SkinAnalysisScreen (시작 화면)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(
        getByText(/사진 한 장으로 나의 피부 타입과/)
      ).toBeTruthy();
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

      const items = [
        '피부 타입',
        '수분도',
        '유분도',
        '모공',
        '주름',
        '색소침착',
        '민감도',
      ];

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
      expect(
        getByText(/화장을 지운 맨 얼굴로 촬영해주세요/)
      ).toBeTruthy();
      expect(
        getByText(/밝은 자연광 아래에서 촬영하면 좋아요/)
      ).toBeTruthy();
      expect(
        getByText(/정면을 바라보고 촬영해주세요/)
      ).toBeTruthy();
    });
  });

  describe('시작 버튼', () => {
    it('"피부 분석 시작하기" 버튼이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);
      expect(getByText('피부 분석 시작하기')).toBeTruthy();
    });

    it('시작 버튼 클릭 시 카메라 페이지로 이동해야 한다', () => {
      const { getByText } = renderWithTheme(<SkinAnalysisScreen />);

      fireEvent.press(getByText('피부 분석 시작하기'));

      expect(router.push).toHaveBeenCalledWith('/(analysis)/skin/camera');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <SkinAnalysisScreen />,
        true
      );
      expect(getByTestId('analysis-skin-screen')).toBeTruthy();
      expect(getByText('AI 피부 분석')).toBeTruthy();
      expect(getByText('피부 분석 시작하기')).toBeTruthy();
    });
  });
});
