import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';

import { buildStoredResultDestination, type StoredAnalysisAxis } from '../../../lib/analysis';
import { ThemeProvider } from '../../../lib/theme';

const mockGetToken = jest.fn().mockResolvedValue('token-1');
const mockRequestPersonalColorAnalysis = jest.fn();
const mockRequestSkinAnalysis = jest.fn();
const mockRequestBodyAnalysis = jest.fn();
const mockRequestHairAnalysis = jest.fn();
const mockRequestMakeupAnalysis = jest.fn();
let mockSearchParams: Record<string, string | undefined> = {};
let mockRowsByTable: Record<string, Record<string, unknown>> = {};

interface QueryTrace {
  table: string;
  columns?: string;
  eq?: [string, unknown];
}

let mockQueryTraces: QueryTrace[] = [];

const mockSupabaseClient = {
  from: (table: string) => {
    const trace: QueryTrace = { table };
    mockQueryTraces.push(trace);
    let selectedRow: Record<string, unknown> | null = mockRowsByTable[table] ?? null;
    const builder = {
      select: (columns: string) => {
        trace.columns = columns;
        return builder;
      },
      eq: (column: string, value: unknown) => {
        trace.eq = [column, value];
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

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: mockGetToken, isSignedIn: true, userId: 'user-1' }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-font', () => ({ useFonts: jest.fn(() => [true, null]) }));
jest.mock('expo-image', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    Image: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    SafeAreaView: (props: Record<string, unknown>) =>
      ReactModule.createElement(ReactNative.View, props, props.children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));
jest.mock('../../../lib/gemini', () => ({ imageToBase64: jest.fn() }));
jest.mock('../../../lib/monitoring/sentry', () => ({ captureError: jest.fn() }));
jest.mock('../../../lib/analytics/tracker', () => ({ trackAnalysisResultView: jest.fn() }));

jest.mock('../../../lib/api/personalColor', () => {
  const actual = jest.requireActual('../../../lib/api/personalColor');
  return { ...actual, requestPersonalColorAnalysis: mockRequestPersonalColorAnalysis };
});
jest.mock('../../../lib/api/skin', () => {
  const actual = jest.requireActual('../../../lib/api/skin');
  return { ...actual, requestSkinAnalysis: mockRequestSkinAnalysis };
});
jest.mock('../../../lib/api/body', () => {
  const actual = jest.requireActual('../../../lib/api/body');
  return { ...actual, requestBodyAnalysis: mockRequestBodyAnalysis };
});
jest.mock('../../../lib/api/hair', () => {
  const actual = jest.requireActual('../../../lib/api/hair');
  return { ...actual, requestHairAnalysis: mockRequestHairAnalysis };
});
jest.mock('../../../lib/api/makeup', () => {
  const actual = jest.requireActual('../../../lib/api/makeup');
  return { ...actual, requestMakeupAnalysis: mockRequestMakeupAnalysis };
});

jest.mock('../../../components/ui', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    CelebrationEffect: () => ReactModule.createElement(ReactNative.View),
    BadgeDrop: () => ReactModule.createElement(ReactNative.View),
  };
});

jest.mock('../../../components/analysis/AnalysisLoadingState', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    AnalysisLoadingState: ({ testID }: { testID?: string }) =>
      ReactModule.createElement(ReactNative.View, { testID }),
  };
});

jest.mock('../../../components/analysis/AnalysisErrorState', () => {
  const ReactModule = require('react');
  const ReactNative = require('react-native');
  return {
    AnalysisErrorState: ({ testID, message }: { testID?: string; message?: string }) =>
      ReactModule.createElement(
        ReactNative.View,
        { testID },
        ReactModule.createElement(ReactNative.Text, null, message)
      ),
  };
});

import PersonalColorResultScreen from '../../../app/(analysis)/personal-color/result';
import SkinResultScreen from '../../../app/(analysis)/skin/result';
import BodyResultScreen from '../../../app/(analysis)/body/result';
import HairResultScreen from '../../../app/(analysis)/hair/result';
import MakeupResultScreen from '../../../app/(analysis)/makeup/result';

interface StoredResultCase {
  axis: StoredAnalysisAxis;
  table: string;
  historyId: string;
  Screen: React.ComponentType;
  resultTestID: string;
  expectedText: string;
  requestMock: jest.Mock;
  row: Record<string, unknown>;
}

const STORED_RESULT_CASES: StoredResultCase[] = [
  {
    axis: 'personal-color',
    table: 'personal_color_assessments',
    historyId: 'pc-history-1',
    Screen: PersonalColorResultScreen,
    resultTestID: 'analysis-personal-color-result-screen',
    expectedText: '봄 웜톤',
    requestMock: mockRequestPersonalColorAnalysis,
    row: {
      id: 'pc-history-1',
      season: 'Spring',
      undertone: 'Warm',
      confidence: 91,
      season_subtype: 'bright',
      best_colors: ['#123456', '#ABCDEF'],
      worst_colors: ['#654321'],
      image_analysis: { insight: '저장된 봄 색상 설명', usedFallback: false },
      session_id: null,
      created_at: '2026-08-20T00:00:00Z',
    },
  },
  {
    axis: 'skin',
    table: 'skin_analyses',
    historyId: 'skin-history-1',
    Screen: SkinResultScreen,
    resultTestID: 'skin-analysis-result',
    expectedText: '복합성 피부',
    requestMock: mockRequestSkinAnalysis,
    row: {
      id: 'skin-history-1',
      skin_type: 'combination',
      hydration: 65,
      oil_level: 40,
      pores: 55,
      pigmentation: 30,
      wrinkles: 20,
      sensitivity: 25,
      overall_score: 60,
      recommendations: { usedFallback: false },
      session_id: null,
      created_at: '2026-08-20T00:00:00Z',
    },
  },
  {
    axis: 'body',
    table: 'body_analyses',
    historyId: 'body-history-1',
    Screen: BodyResultScreen,
    resultTestID: 'body-analysis-result',
    expectedText: '스트레이트',
    requestMock: mockRequestBodyAnalysis,
    row: {
      id: 'body-history-1',
      body_type: 'S',
      height: 165,
      weight: 55,
      strengths: ['균형 잡힌 상체'],
      style_recommendations: {
        items: [{ item: '테일러드 재킷', reason: '직선 실루엣을 살려줘요' }],
        insight: '저장된 체형 조언',
        usedFallback: false,
      },
      measurement_source: 'measured',
      session_id: null,
      created_at: '2026-08-20T00:00:00Z',
    },
  },
  {
    axis: 'hair',
    table: 'hair_analyses',
    historyId: 'hair-history-1',
    Screen: HairResultScreen,
    resultTestID: 'hair-analysis-result',
    expectedText: "'레이어드 컷' 스타일이 잘 어울려요",
    requestMock: mockRequestHairAnalysis,
    row: {
      id: 'hair-history-1',
      hair_type: 'wavy',
      hair_thickness: 'thick',
      scalp_type: 'oily',
      scalp_health: 65,
      damage_level: 80,
      density: 55,
      elasticity: 72,
      shine: 60,
      overall_score: 63,
      concerns: ['frizz'],
      recommendations: {
        careTips: ['미지근한 물로 샴푸해 주세요'],
        styleRecommendations: [{ name: '레이어드 컷' }],
        usedFallback: false,
      },
      session_id: null,
      created_at: '2026-08-20T00:00:00Z',
    },
  },
  {
    axis: 'makeup',
    table: 'makeup_analyses',
    historyId: 'makeup-history-1',
    Screen: MakeupResultScreen,
    resultTestID: 'makeup-analysis-result',
    expectedText: '계란형 · 쿨톤',
    requestMock: mockRequestMakeupAnalysis,
    row: {
      id: 'makeup-history-1',
      undertone: 'cool',
      eye_shape: 'almond',
      lip_shape: 'bow',
      face_shape: 'oval',
      skin_tone_uniformity: 82,
      overall_score: 88,
      recommendations: {
        baseRecommendation: '얇고 맑은 베이스를 사용해 주세요',
        tips: [
          { category: '아이 메이크업', tips: ['눈꼬리를 따라 음영을 넣어 주세요'] },
          { category: '립 메이크업', tips: ['로즈 컬러를 발라 주세요'] },
        ],
        colors: [{ colors: [{ hex: '#AABBCC' }] }],
        foundationRecommendations: [
          {
            shadeName: '21호 쿨 핑크',
            undertone: 'cool',
            brandExample: '에스티로더 더블웨어 1C1',
            easyDescription: '핑크 기가 도는 밝은 베이지 (로즈빛)',
            oliveyoungAlt: '클리오 킬커버 파운웨어 02 랑제리',
          },
        ],
        usedFallback: false,
      },
      session_id: null,
      created_at: '2026-08-20T00:00:00Z',
    },
  },
];

describe('5축 저장 결과 재방문 계약', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue('token-1');
    mockSearchParams = {};
    mockRowsByTable = {};
    mockQueryTraces = [];
  });

  it.each(STORED_RESULT_CASES)(
    '$axis historyId 목적지는 저장 행을 조회해 실제 결과 화면을 연다',
    async ({ axis, table, historyId, Screen, resultTestID, expectedText, requestMock, row }) => {
      const destination = buildStoredResultDestination(axis, historyId);
      mockSearchParams = destination.params;
      mockRowsByTable = { [table]: row };

      const screen = render(React.createElement(ThemeProvider, null, React.createElement(Screen)));

      await waitFor(() => expect(screen.getByTestId(resultTestID)).toBeTruthy());

      expect(screen.getAllByText(expectedText).length).toBeGreaterThan(0);
      expect(mockQueryTraces[0]).toMatchObject({ table, eq: ['id', historyId] });
      expect(requestMock).not.toHaveBeenCalled();
    }
  );

  it('메이크업 저장 결과의 nullable 점수는 결과 UI에 점수로 노출되지 않는다', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'app', '(analysis)', 'makeup/result.tsx'),
      'utf8'
    );
    const renderSource = source.slice(source.indexOf('if (!result)'));

    expect(renderSource).not.toContain('result.scores');
    expect(renderSource).not.toMatch(/점수\s*\{|overall\}점/);
  });

  it('메이크업 저장 결과의 파운데이션 처방을 재방문에서도 복원한다', async () => {
    const makeupCase = STORED_RESULT_CASES.find((item) => item.axis === 'makeup')!;
    const destination = buildStoredResultDestination('makeup', makeupCase.historyId);
    mockSearchParams = destination.params;
    mockRowsByTable = { [makeupCase.table]: makeupCase.row };

    const screen = render(
      React.createElement(ThemeProvider, null, React.createElement(MakeupResultScreen))
    );
    await waitFor(() => expect(screen.getByTestId('makeup-analysis-result')).toBeTruthy());

    fireEvent.press(screen.getByTestId('makeup-analysis-result-section-foundation-trigger'));
    expect(screen.getByText(/에스티로더 더블웨어 1C1/)).toBeTruthy();
    expect(screen.getByText(/올리브영: 클리오 킬커버 파운웨어 02 랑제리/)).toBeTruthy();
    expect(mockRequestMakeupAnalysis).not.toHaveBeenCalled();
  });
});
