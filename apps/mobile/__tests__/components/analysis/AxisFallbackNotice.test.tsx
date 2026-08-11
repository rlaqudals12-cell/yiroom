/**
 * AxisFallbackNotice 컴포넌트 테스트
 *
 * 대상: components/analysis/AxisFallbackNotice.tsx
 * 축별 Mock 폴백 정직 고지(design-contracts §3) 렌더 계약 검증.
 * 웹 AxisFallbackNotice.test.tsx와 동일한 계약을 RN에서 미러한다.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { AxisFallbackNotice } from '../../../components/analysis/AxisFallbackNotice';
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
import type { AxisCode, IntegratedAnalysisResult } from '../../../lib/api';

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

describe('AxisFallbackNotice', () => {
  describe('폴백 축이 있을 때', () => {
    it('고지 컨테이너(testID)가 렌더된다', () => {
      const { getByTestId } = renderWithTheme(<AxisFallbackNotice usedFallback={['skin']} />);
      expect(getByTestId('axis-fallback-notice')).toBeTruthy();
    });

    it('샘플 결과 제목과 재시도 안내를 노출한다', () => {
      const { getByText } = renderWithTheme(<AxisFallbackNotice usedFallback={['skin']} />);
      expect(getByText('일부 축은 샘플 결과예요')).toBeTruthy();
      expect(
        getByText('잠시 후 해당 축을 다시 분석하시면 정확한 결과를 받으실 수 있어요.')
      ).toBeTruthy();
    });

    it('해당 축 라벨을 한국어로 병기한다', () => {
      const { getByText } = renderWithTheme(
        <AxisFallbackNotice usedFallback={['personal_color', 'makeup']} />
      );
      expect(getByText('퍼스널컬러, 메이크업')).toBeTruthy();
    });

    it('5축 라벨이 모두 매핑되어 있다', () => {
      const all: AxisCode[] = ['personal_color', 'skin', 'body', 'hair', 'makeup'];
      const { getByText } = renderWithTheme(<AxisFallbackNotice usedFallback={all} />);
      expect(getByText('퍼스널컬러, 피부, 체형, 헤어, 메이크업')).toBeTruthy();
    });

    it('다크 모드에서도 렌더된다', () => {
      const { getByTestId } = renderWithTheme(<AxisFallbackNotice usedFallback={['hair']} />, true);
      expect(getByTestId('axis-fallback-notice')).toBeTruthy();
    });
  });

  describe('폴백 축이 없을 때 (미노출 계약)', () => {
    it('빈 배열이면 아무것도 렌더하지 않는다', () => {
      const { queryByTestId } = renderWithTheme(<AxisFallbackNotice usedFallback={[]} />);
      expect(queryByTestId('axis-fallback-notice')).toBeNull();
    });

    it('undefined면 아무것도 렌더하지 않는다 (구버전 payload 방어)', () => {
      const { queryByTestId } = renderWithTheme(<AxisFallbackNotice usedFallback={undefined} />);
      expect(queryByTestId('axis-fallback-notice')).toBeNull();
    });

    it('알 수 없는 축 코드만 있으면 렌더하지 않는다 ("undefined" 노출 방지)', () => {
      const { queryByTestId } = renderWithTheme(
        <AxisFallbackNotice usedFallback={['oral_health' as AxisCode]} />
      );
      expect(queryByTestId('axis-fallback-notice')).toBeNull();
    });

    it('알 수 없는 축은 걸러내고 아는 축만 표기한다', () => {
      const { getByText } = renderWithTheme(
        <AxisFallbackNotice usedFallback={['oral_health' as AxisCode, 'body']} />
      );
      expect(getByText('체형')).toBeTruthy();
    });
  });

  describe('prod 형상 회귀 (payload 왕복)', () => {
    // 왜: 결과 화면은 payload 쿼리(encodeURIComponent(JSON))로도 결과를 받는다.
    // 필드명이 어긋나거나 직렬화에서 유실되면 테스트는 그린인데 실기기에서 무동작이 된다.
    function buildResult(usedFallback: AxisCode[]): IntegratedAnalysisResult {
      return {
        sessionId: 'session-1',
        status: 'completed',
        axes: {
          personalColor: { success: true, data: {}, usedFallback: false },
          skin: { success: true, data: {}, usedFallback: usedFallback.includes('skin') },
          body: { success: true, data: {}, usedFallback: usedFallback.includes('body') },
          hair: { success: true, data: {}, usedFallback: false },
          makeup: { success: true, data: {}, usedFallback: false },
        },
        persona: null,
        axesCompleted: ['personal_color', 'skin', 'body', 'hair', 'makeup'],
        axesFailed: [],
        usedFallback,
        createdAt: '2026-08-01T00:00:00.000Z',
        completedAt: '2026-08-01T00:00:10.000Z',
      };
    }

    function roundTrip(result: IntegratedAnalysisResult): IntegratedAnalysisResult {
      return JSON.parse(
        decodeURIComponent(encodeURIComponent(JSON.stringify(result)))
      ) as IntegratedAnalysisResult;
    }

    it('payload 직렬화를 거친 결과에서도 폴백 축을 고지한다', () => {
      const restored = roundTrip(buildResult(['skin', 'body']));
      const { getByTestId, getByText } = renderWithTheme(
        <AxisFallbackNotice usedFallback={restored.usedFallback} />
      );
      expect(getByTestId('axis-fallback-notice')).toBeTruthy();
      expect(getByText('피부, 체형')).toBeTruthy();
    });

    it('폴백이 없는 결과는 고지를 띄우지 않는다', () => {
      const restored = roundTrip(buildResult([]));
      const { queryByTestId } = renderWithTheme(
        <AxisFallbackNotice usedFallback={restored.usedFallback} />
      );
      expect(queryByTestId('axis-fallback-notice')).toBeNull();
    });
  });
});
