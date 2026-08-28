/**
 * 통합 결과 화면 축별 Mock 고지 배선 테스트
 *
 * 대상: app/(analysis)/integrated/result/[sessionId].tsx
 * 컴포넌트 단위 테스트만으로는 "만들었지만 화면에 안 붙은" 결함을 못 잡는다.
 * 실제 payload 쿼리(prod 형상: encodeURIComponent(JSON))로 화면을 띄워
 * 폴백 축이 정직하게 고지되는지 / 폴백이 없으면 미노출인지 검증한다.
 * (design-contracts §3 · ADR-007)
 */
import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { renderWithTheme } from '../../helpers/test-utils';
import type { AxisCode, IntegratedAnalysisResult } from '../../../lib/api';

const mockTrackAnalysisResultView = jest.fn();
const mockUseIntegratedSession = jest.fn();

jest.mock('@/lib/analytics/tracker', () => ({
  trackAnalysisResultView: (...args: unknown[]) => mockTrackAnalysisResultView(...args),
}));

jest.mock('@/hooks/useIntegratedSession', () => ({
  useIntegratedSession: (...args: unknown[]) => mockUseIntegratedSession(...args),
}));

// 발급번호 조회는 네트워크 — 고지 검증과 무관하므로 차단
jest.mock('@/lib/api', () => ({
  fetchIssueNo: jest.fn().mockResolvedValue(null),
}));

// 공유카드는 SVG·캡처 의존이 커서 대체 (고지 배선 검증에 불필요)
jest.mock('@/components/share', () => ({
  PersonaShareSection: () => {
    const { View } = require('react-native');
    return <View testID="persona-share-section" />;
  },
}));

jest.mock('@/hooks/useHasClosetItems', () => ({
  useHasClosetItems: jest.fn(() => false),
}));

jest.mock('@/components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
  };
});

import IntegratedResultScreen from '../../../app/(analysis)/integrated/result/[sessionId]';

const mockUseLocalSearchParams = useLocalSearchParams as unknown as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

function buildResult(usedFallback: AxisCode[]): IntegratedAnalysisResult {
  return {
    sessionId: 'sess-fallback-1',
    status: 'completed',
    axes: {
      personalColor: { success: true, data: {}, usedFallback: false },
      skin: { success: true, data: {}, usedFallback: usedFallback.includes('skin') },
      body: { success: true, data: {}, usedFallback: usedFallback.includes('body') },
      hair: { success: true, data: {}, usedFallback: false },
      makeup: { success: true, data: {}, usedFallback: false },
    },
    persona: {
      oneLine: '나를 아는 한 줄',
      narrative: '통합 내러티브',
      keyInsights: [],
      usedFallback: false,
    },
    axesCompleted: ['personal_color', 'skin', 'body', 'hair', 'makeup'],
    axesFailed: [],
    usedFallback,
    createdAt: '2026-08-01T00:00:00.000Z',
    completedAt: '2026-08-01T00:00:10.000Z',
  };
}

/** prod 형상: 결과 화면은 payload 쿼리를 decodeURIComponent → JSON.parse 한다 */
function setPayload(result: IntegratedAnalysisResult): void {
  mockUseLocalSearchParams.mockReturnValue({
    sessionId: result.sessionId,
    payload: encodeURIComponent(JSON.stringify(result)),
  });
}

describe('통합 결과 화면 — 축별 Mock 고지 배선', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIntegratedSession.mockImplementation(
      (_sessionId: string | null, initialResult: IntegratedAnalysisResult | null) => ({
        result: initialResult,
        isLoading: false,
        error: null,
      })
    );
  });

  afterEach(() => {
    mockUseLocalSearchParams.mockReturnValue({});
  });

  it('axes 없는 reused 요약 payload는 완전 결과로 소비하지 않고 sessionId 저장 조회로 넘긴다', () => {
    mockUseLocalSearchParams.mockReturnValue({
      sessionId: 'sess-reused-summary',
      payload: encodeURIComponent(
        JSON.stringify({ sessionId: 'sess-reused-summary', status: 'completed', reused: true })
      ),
    });
    mockUseIntegratedSession.mockReturnValue({ result: null, isLoading: true, error: null });

    const { getByTestId } = renderWithTheme(<IntegratedResultScreen />);

    expect(mockUseIntegratedSession).toHaveBeenCalledWith('sess-reused-summary', null);
    expect(getByTestId('integrated-result-loading')).toBeTruthy();
  });

  it('폴백 축이 있으면 화면에 샘플 고지가 노출된다', () => {
    setPayload(buildResult(['skin', 'body']));
    const { getByTestId, getByText } = renderWithTheme(<IntegratedResultScreen />);

    expect(getByTestId('axis-fallback-notice')).toBeTruthy();
    expect(getByTestId('integrated-result-verdict')).toBeTruthy();
    expect(getByText('피부, 체형')).toBeTruthy();
  });

  it('세리프 결론·5축 속성표·공유 카드를 진단지 구조로 유지한다', () => {
    setPayload(buildResult([]));
    const screen = renderWithTheme(<IntegratedResultScreen />);

    expect(screen.getByTestId('integrated-result-verdict')).toBeTruthy();
    expect(screen.getByTestId('integrated-result-verdict-title')).toHaveTextContent(
      '나를 아는 한 줄'
    );
    expect(screen.getByTestId('integrated-axis-summary')).toBeTruthy();
    expect(screen.getAllByTestId('report-attr-row')).toHaveLength(5);
    expect(screen.getByTestId('persona-share-section')).toBeTruthy();
  });

  it('행동 근거는 기본 접힘이고 사용자가 요청할 때만 펼친다', () => {
    setPayload(buildResult([]));
    const screen = renderWithTheme(<IntegratedResultScreen />);

    expect(screen.getByTestId('action-plan-section')).toBeTruthy();
    expect(screen.queryByTestId('action-plan-items')).toBeNull();
    fireEvent.press(screen.getByTestId('action-plan-section-trigger'));
    expect(screen.getByTestId('action-plan-items')).toBeTruthy();
  });

  it('partial 결과는 미완료 축만 다시 분석하는 경로를 보존한다', () => {
    const partial = {
      ...buildResult([]),
      status: 'partial' as const,
      axesCompleted: ['personal_color', 'skin', 'body', 'makeup'] as AxisCode[],
      axesFailed: ['hair'] as AxisCode[],
    };
    setPayload(partial);
    const screen = renderWithTheme(<IntegratedResultScreen />);

    fireEvent.press(screen.getByText('미완료 축 다시 분석'));
    expect(mockRouterReplace).toHaveBeenCalledWith('/(analysis)/integrated?retryAxes=hair');
  });

  it('통합 결과 소스에 점수 게이지·레이더·그라데이션 표면이 다시 들어오지 않는다', () => {
    const sourcePaths = [
      'app/(analysis)/integrated/result/[sessionId].tsx',
      'components/analysis/integrated/IntegratedResultReport.tsx',
      'components/analysis/integrated/IntegratedResultSections.tsx',
    ];
    const source = sourcePaths
      .map((path) => readFileSync(join(process.cwd(), path), 'utf8'))
      .join('\n');

    expect(source).not.toMatch(/MetricBar|RadarChart|CircularProgress|LinearGradient/);
  });

  it('직전 응답 결과 보기는 fresh 출처로 한 번만 기록한다', async () => {
    setPayload(buildResult([]));
    renderWithTheme(<IntegratedResultScreen />);

    await waitFor(() => {
      expect(mockTrackAnalysisResultView).toHaveBeenCalledTimes(1);
      expect(mockTrackAnalysisResultView).toHaveBeenCalledWith(
        'integrated',
        'fresh',
        'mock_jwt_token'
      );
    });
  });

  it('이력에서 불러온 결과 보기는 history 출처로 한 번만 기록한다', async () => {
    const historyResult = buildResult([]);
    mockUseLocalSearchParams.mockReturnValue({ sessionId: historyResult.sessionId });
    mockUseIntegratedSession.mockReturnValue({
      result: historyResult,
      isLoading: false,
      error: null,
    });

    renderWithTheme(<IntegratedResultScreen />);

    await waitFor(() => {
      expect(mockTrackAnalysisResultView).toHaveBeenCalledTimes(1);
      expect(mockTrackAnalysisResultView).toHaveBeenCalledWith(
        'integrated',
        'history',
        'mock_jwt_token'
      );
    });
  });

  it('폴백 축이 없으면 고지를 띄우지 않는다', () => {
    setPayload(buildResult([]));
    const { queryByTestId } = renderWithTheme(<IntegratedResultScreen />);

    expect(queryByTestId('axis-fallback-notice')).toBeNull();
  });

  it('고지는 verdict(나 프로필) 아래에 배치된다', () => {
    setPayload(buildResult(['hair']));
    const { getByTestId, UNSAFE_root } = renderWithTheme(<IntegratedResultScreen />);

    // 왜: "경고 격하" 위계 — 결론(persona)이 먼저 읽히고 고지가 뒤따라야 한다.
    const flat: unknown[] = [];
    const walk = (node: { props?: Record<string, unknown>; children?: unknown[] }): void => {
      if (node.props?.testID) flat.push(node.props.testID);
      (node.children ?? []).forEach((child) => {
        if (typeof child === 'object' && child !== null) {
          walk(child as { props?: Record<string, unknown>; children?: unknown[] });
        }
      });
    };
    walk(UNSAFE_root as unknown as { props?: Record<string, unknown>; children?: unknown[] });

    expect(getByTestId('axis-fallback-notice')).toBeTruthy();
    expect(flat.indexOf('persona-narrative-card')).toBeGreaterThanOrEqual(0);
    expect(flat.indexOf('axis-fallback-notice')).toBeGreaterThan(
      flat.indexOf('persona-narrative-card')
    );
  });
});
