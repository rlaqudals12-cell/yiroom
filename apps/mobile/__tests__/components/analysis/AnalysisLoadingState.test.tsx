/**
 * AnalysisLoadingState 컴포넌트 테스트
 *
 * 대상: components/analysis/AnalysisLoadingState.tsx
 * 분석 진행 중 표시되는 공통 로딩 UI 검증
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { AnalysisLoadingState } from '../../../components/analysis/AnalysisLoadingState';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
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

describe('AnalysisLoadingState', () => {
  describe('기본 렌더링', () => {
    it('기본 testID "analysis-loading"이 존재해야 한다', () => {
      const { getByTestId } = renderWithTheme(<AnalysisLoadingState />);
      expect(getByTestId('analysis-loading')).toBeTruthy();
    });

    it('커스텀 testID를 사용할 수 있어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <AnalysisLoadingState testID="custom-loading" />
      );
      expect(getByTestId('custom-loading')).toBeTruthy();
    });

    it('기본 로딩 메시지가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(<AnalysisLoadingState />);
      expect(getByText('분석 중이에요...')).toBeTruthy();
    });
  });

  describe('커스텀 메시지', () => {
    it('커스텀 로딩 메시지가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <AnalysisLoadingState message="피부를 분석하고 있어요..." />
      );
      expect(getByText('피부를 분석하고 있어요...')).toBeTruthy();
    });

    it('분석 타입별 메시지를 표시할 수 있어야 한다', () => {
      const messages = [
        '퍼스널 컬러를 분석하고 있어요...',
        '피부 상태를 확인하고 있어요...',
        '체형을 분석하고 있어요...',
        'AI가 결과를 준비하고 있어요...',
      ];

      messages.forEach((message) => {
        const { getByText, unmount } = renderWithTheme(
          <AnalysisLoadingState message={message} />
        );
        expect(getByText(message)).toBeTruthy();
        unmount();
      });
    });
  });

  describe('ActivityIndicator', () => {
    it('로딩 인디케이터가 렌더링되어야 한다', () => {
      const { UNSAFE_getByType } = renderWithTheme(<AnalysisLoadingState />);
      const { ActivityIndicator } = require('react-native');
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator).toBeTruthy();
    });

    it('로딩 인디케이터 색상이 brand.primary여야 한다', () => {
      const { UNSAFE_getByType } = renderWithTheme(<AnalysisLoadingState />);
      const { ActivityIndicator } = require('react-native');
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.color).toBe(brand.primary);
    });

    it('로딩 인디케이터 크기가 "large"여야 한다', () => {
      const { UNSAFE_getByType } = renderWithTheme(<AnalysisLoadingState />);
      const { ActivityIndicator } = require('react-native');
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('large');
    });
  });

  describe('접근성', () => {
    it('accessibilityRole이 "progressbar"여야 한다', () => {
      const { getByTestId } = renderWithTheme(<AnalysisLoadingState />);
      expect(getByTestId('analysis-loading').props.accessibilityRole).toBe(
        'progressbar'
      );
    });

    it('accessibilityLabel이 메시지와 일치해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <AnalysisLoadingState message="분석 진행 중..." />
      );
      expect(getByTestId('analysis-loading').props.accessibilityLabel).toBe(
        '분석 진행 중...'
      );
    });

    it('기본 accessibilityLabel이 기본 메시지와 일치해야 한다', () => {
      const { getByTestId } = renderWithTheme(<AnalysisLoadingState />);
      expect(getByTestId('analysis-loading').props.accessibilityLabel).toBe(
        '분석 중이에요...'
      );
    });
  });

  describe('다크 모드', () => {
    it('라이트 모드에서 정상 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <AnalysisLoadingState />,
        false
      );
      expect(getByTestId('analysis-loading')).toBeTruthy();
      expect(getByText('분석 중이에요...')).toBeTruthy();
    });

    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <AnalysisLoadingState />,
        true
      );
      expect(getByTestId('analysis-loading')).toBeTruthy();
      expect(getByText('분석 중이에요...')).toBeTruthy();
    });

    it('다크 모드에서 커스텀 메시지가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <AnalysisLoadingState message="결과를 준비 중..." />,
        true
      );
      expect(getByText('결과를 준비 중...')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('빈 문자열 메시지도 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <AnalysisLoadingState message="" />
      );
      expect(getByTestId('analysis-loading')).toBeTruthy();
    });

    it('긴 메시지도 정상 렌더링되어야 한다', () => {
      const longMessage =
        'AI가 사진을 분석하고 있어요. 잠시만 기다려주세요. 최대 10초 정도 소요될 수 있어요.';
      const { getByText } = renderWithTheme(
        <AnalysisLoadingState message={longMessage} />
      );
      expect(getByText(longMessage)).toBeTruthy();
    });
  });
});
