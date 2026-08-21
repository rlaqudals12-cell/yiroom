import { fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  REPORT_COLORS,
  ReportAttrRow,
  ReportResultLayout,
  ReportRowTable,
} from '../../../../components/analysis/report';
import { renderWithTheme } from '../../../helpers/test-utils';

const mockGetToken = jest.fn().mockResolvedValue('token-1');
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockTrackAnalysisResultView = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('@/lib/analytics/tracker', () => ({
  trackAnalysisResultView: (...args: unknown[]) => mockTrackAnalysisResultView(...args),
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
  };
});

function createLayout(overrides: Partial<React.ComponentProps<typeof ReportResultLayout>> = {}) {
  return (
    <ReportResultLayout
      attributes={
        <ReportRowTable>
          <ReportAttrRow label="두피" value="건성 두피" />
        </ReportRowTable>
      }
      conclusion={<View testID="visible-conclusion" />}
      eyebrow="헤어 분석 결과"
      moduleKey="hair"
      onPrimaryAction={jest.fn()}
      primaryActionText="헤어 제품 추천"
      retryPath="/(analysis)/hair"
      sections={[
        {
          key: 'evidence',
          title: '항목별 컨디션',
          summary: '윤기·탄력·밀도·두피',
          content: <Text>접힌 근거 내용</Text>,
        },
      ]}
      subtitle="건성 두피"
      testID="hair-report"
      verdict="직모 · 가는 모발"
      {...overrides}
    />
  );
}

describe('ReportResultLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-1');
  });

  it('다크 테마에서도 결과 지면은 크림 라이트로 고정한다', () => {
    const screen = renderWithTheme(createLayout(), true);
    const style = StyleSheet.flatten(screen.getByTestId('hair-report').props.style);

    expect(style.backgroundColor).toBe(REPORT_COLORS.ground);
    expect(screen.getByTestId('visible-conclusion')).toBeTruthy();
  });

  it('근거는 기본 접힘이고 구형 등급·게이지 표면을 만들지 않는다', () => {
    const screen = renderWithTheme(createLayout());

    expect(screen.queryByText('접힌 근거 내용')).toBeNull();
    expect(screen.queryByTestId('hair-report-grade')).toBeNull();

    fireEvent.press(screen.getByTestId('hair-report-section-evidence-trigger'));
    expect(screen.getByText('접힌 근거 내용')).toBeTruthy();
  });

  it('공유 표면을 진단지 본문 뒤의 독립 슬롯에 둔다', () => {
    const screen = renderWithTheme(createLayout({ shareContent: <Text>공유 카드</Text> }));

    expect(screen.getByTestId('hair-report-share')).toBeTruthy();
    expect(screen.getByText('공유 카드')).toBeTruthy();
  });

  it('폴백은 예시 결과와 낮은 신뢰도를 결론 가까이에 고지한다', () => {
    const screen = renderWithTheme(createLayout({ usedFallback: true }));

    expect(screen.getByTestId('hair-report-fallback')).toBeTruthy();
    expect(screen.getAllByText('예시 결과 · 낮은 신뢰도')).toHaveLength(2);
  });

  it('결과 조회를 실제 분석 축으로 한 번 기록한다', async () => {
    renderWithTheme(createLayout());

    await waitFor(() => {
      expect(mockTrackAnalysisResultView).toHaveBeenCalledTimes(1);
      expect(mockTrackAnalysisResultView).toHaveBeenCalledWith('hair', 'result-screen', 'token-1');
    });
  });

  it('다음 분석·코치·홈·재분석 도달 경로를 유지한다', () => {
    const screen = renderWithTheme(createLayout());

    fireEvent.press(screen.getByTestId('hair-report-next-analysis'));
    fireEvent.press(screen.getByTestId('hair-report-expert-cta'));
    fireEvent.press(screen.getByTestId('hair-report-buttons-home'));
    fireEvent.press(screen.getByTestId('hair-report-buttons-retry'));

    expect(mockPush).toHaveBeenNthCalledWith(1, '/(analysis)/makeup');
    expect(mockPush).toHaveBeenNthCalledWith(2, '/(coach)');
    expect(mockReplace).toHaveBeenNthCalledWith(1, '/(tabs)');
    expect(mockReplace).toHaveBeenNthCalledWith(2, '/(analysis)/hair');
  });
});
