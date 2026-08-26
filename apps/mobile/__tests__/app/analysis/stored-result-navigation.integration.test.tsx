import type { SupabaseClient } from '@supabase/supabase-js';
import React from 'react';

import { ThemeProvider } from '../../../lib/theme';

jest.unmock('expo-router');
jest.unmock('expo-router/testing-library');
jest.mock('react-native-reanimated/mock', () =>
  require('../../../__mocks__/react-native-reanimated.js')
);

const mockRequestPersonalColorAnalysis = jest.fn();
const mockQueryTrace = { table: '', eq: [] as unknown[] };

const storedPersonalColor = {
  id: 'pc-history-router-1',
  season: 'Spring',
  undertone: 'Warm',
  confidence: 91,
  season_subtype: 'bright',
  best_colors: ['#123456', '#ABCDEF'],
  worst_colors: ['#654321'],
  image_analysis: { insight: '저장된 봄 색상 설명', usedFallback: false },
  session_id: null,
  created_at: '2026-08-20T00:00:00Z',
};

const mockSupabaseClient = {
  from: (table: string) => {
    mockQueryTrace.table = table;
    let selectedRow: Record<string, unknown> | null = storedPersonalColor;
    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => {
        mockQueryTrace.eq = [column, value];
        if (selectedRow?.[column] !== value) selectedRow = null;
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: () => Promise.resolve({ data: selectedRow, error: null }),
    };
    return builder;
  },
} as unknown as SupabaseClient;

jest.mock('../../../hooks/useUserAnalyses', () => ({
  useUserAnalyses: () => ({
    analyses: [
      {
        id: 'pc-history-router-1',
        type: 'personal-color',
        summary: 'Spring Warm',
        createdAt: new Date('2026-08-20T00:00:00Z'),
      },
    ],
    personalColor: { id: 'pc-history-router-1', season: 'spring' },
    skinAnalysis: null,
    bodyAnalysis: null,
    hairAnalysis: null,
    makeupAnalysis: null,
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useWorkoutData', () => ({
  useWorkoutData: () => ({
    analysis: null,
    streak: null,
    todayWorkout: null,
    weeklyLogs: [],
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useNutritionData', () => ({
  useNutritionData: () => ({
    settings: null,
    streak: null,
    todaySummary: null,
    weeklyHistory: [],
    isLoading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));

jest.mock('../../../lib/api/personalColor', () => {
  const actual = jest.requireActual('../../../lib/api/personalColor');
  return { ...actual, requestPersonalColorAnalysis: mockRequestPersonalColorAnalysis };
});

jest.mock('../../../lib/gemini', () => ({ imageToBase64: jest.fn() }));
jest.mock('../../../lib/monitoring/sentry', () => ({ captureError: jest.fn() }));
jest.mock('../../../lib/analytics/tracker', () => ({ trackAnalysisResultView: jest.fn() }));
jest.mock('../../../lib/animations', () => ({
  staggeredEntry: () => undefined,
  TIMING: { fast: 200, normal: 300, slow: 500 },
}));
jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));
jest.mock('expo-linear-gradient', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    LinearGradient: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
  };
});
jest.mock('expo-image', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    Image: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
  };
});
jest.mock('lucide-react-native', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return new Proxy(
    {},
    {
      get: () => (props: Record<string, unknown>) =>
        ReactModule.createElement(ReactNative.View, props),
    }
  );
});
jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    SafeAreaProvider: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
    SafeAreaView: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    },
  };
});
jest.mock('../../../components/analysis', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  const Box = ({ children, testID }: { children?: React.ReactNode; testID?: string }) =>
    ReactModule.createElement(ReactNative.View, { testID }, children);
  return {
    AnalysisTimeline: ({
      analyses,
      onItemPress,
      testID,
    }: {
      analyses: Array<{ id: string; type: string; summary: string }>;
      onItemPress: (item: { id: string; type: string }) => void;
      testID?: string;
    }) =>
      ReactModule.createElement(
        ReactNative.View,
        { testID },
        analyses.map((item) =>
          ReactModule.createElement(
            ReactNative.Pressable,
            { key: item.id, onPress: () => onItemPress(item) },
            ReactModule.createElement(ReactNative.Text, null, item.summary)
          )
        )
      ),
    AnalysisLoadingState: Box,
    AnalysisErrorState: Box,
    ColorHarmonyGuide: Box,
    DrapingPreview: Box,
    ReportActionList: Box,
    ReportAttrRow: ({ label, value }: { label: string; value: string }) =>
      ReactModule.createElement(ReactNative.Text, null, `${label} ${value}`),
    ReportColorBand: Box,
    ReportDivider: Box,
    ReportResultLayout: ({
      testID,
      verdict,
      attributes,
      conclusion,
    }: {
      testID: string;
      verdict: string;
      attributes?: React.ReactNode;
      conclusion?: React.ReactNode;
    }) =>
      ReactModule.createElement(
        ReactNative.View,
        { testID },
        ReactModule.createElement(ReactNative.Text, null, verdict),
        attributes,
        conclusion
      ),
    ReportRowTable: Box,
    ReportTextList: Box,
  };
});
jest.mock('../../../components/profile', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  const Stub = (props: Record<string, unknown>) =>
    ReactModule.createElement(ReactNative.View, props, props.children);
  return {
    WellnessScoreRing: Stub,
    LevelBadge: Stub,
    AchievementGrid: Stub,
    MyTwinCard: Stub,
  };
});
jest.mock('../../../components/analysis/personal-color/PersonalColorResultSupport', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    PersonalColorResultShare: () => ReactModule.createElement(ReactNative.View),
    getPersonalColorMakeupRows: () => [{ label: '립 컬러', value: '코랄 계열' }],
    personalColorResultStyles: {
      conclusion: {},
      evidenceGroup: {},
      resultImage: {},
    },
  };
});
jest.mock('../../../components/ui', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  const Box = (props: Record<string, unknown>) =>
    ReactModule.createElement(ReactNative.View, props, props.children);
  return {
    GlassCard: Box,
    GradientBackground: Box,
    ScreenContainer: Box,
    SectionHeader: ({ title, ...props }: { title: string; [key: string]: unknown }) =>
      ReactModule.createElement(
        ReactNative.View,
        props,
        ReactModule.createElement(ReactNative.Text, null, title)
      ),
    CelebrationEffect: () => ReactModule.createElement(ReactNative.View),
    BadgeDrop: () => ReactModule.createElement(ReactNative.View),
  };
});

// 실제 화면은 저장소 Reanimated mock으로 먼저 고정한 뒤 Router 테스트 도구에 연결한다.
const PersonalColorResultScreen = require('../../../app/(analysis)/personal-color/result').default;
const ProfileScreen = require('../../../app/(tabs)/profile').default;
const { renderRouter, userEvent, waitFor } = require('expo-router/testing-library');

describe('저장 결과 실제 라우터 재진입', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryTrace.table = '';
    mockQueryTrace.eq = [];
  });

  it('나 탭 분석 이력 행을 누르면 새 진단이 아니라 저장 결과 뷰가 열린다', async () => {
    const rendered = renderRouter(
      {
        '(tabs)/profile': ProfileScreen,
        '(analysis)/personal-color/result': PersonalColorResultScreen,
      },
      {
        initialUrl: '/profile',
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <ThemeProvider>{children}</ThemeProvider>
        ),
      }
    );

    await userEvent.press(await rendered.findByText('Spring Warm'));

    await waitFor(() =>
      expect(rendered.getByTestId('analysis-personal-color-result-screen')).toBeTruthy()
    );
    expect(rendered.getAllByText('봄 웜톤').length).toBeGreaterThan(0);
    expect(mockQueryTrace).toEqual({
      table: 'personal_color_assessments',
      eq: ['id', 'pc-history-router-1'],
    });
    expect(mockRequestPersonalColorAnalysis).not.toHaveBeenCalled();
  });
});
