import { render, waitFor, within } from '@testing-library/react-native';
import React from 'react';

import PersonalColorResultScreen from '../../../app/(analysis)/personal-color/result';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({
    imageUri: 'file:///personal-color.jpg',
    imageBase64: 'x'.repeat(200),
  }),
}));

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: jest.fn().mockResolvedValue('token-1') }),
}));

const mockRequestPersonalColorAnalysis = jest.fn();
jest.mock('../../../lib/api/personalColor', () => ({
  requestPersonalColorAnalysis: (...args: unknown[]) =>
    (mockRequestPersonalColorAnalysis as jest.Mock)(...args),
  PersonalColorApiError: class PersonalColorApiError extends Error {},
  getPersonalColorSubtypeLabel: (subtype: string) => {
    const labels: Record<string, string> = {
      bright: '브라이트',
      light: '라이트',
      true: '트루',
      mute: '뮤트',
      deep: '딥',
    };
    return labels[subtype];
  },
}));

jest.mock('../../../lib/gemini', () => ({
  imageToBase64: jest.fn().mockResolvedValue('x'.repeat(200)),
}));

jest.mock('../../../lib/monitoring/sentry', () => ({ captureError: jest.fn() }));

jest.mock('../../../components/analysis', () => {
  const { Text, View } = require('react-native');
  return {
    AnalysisLoadingState: ({ testID }: { testID?: string }) => <View testID={testID} />,
    AnalysisErrorState: ({ testID }: { testID?: string }) => <View testID={testID} />,
    ResultLayout: ({
      testID,
      headerContent,
      summaryTab,
      detailTab,
      recommendTab,
      usedFallback,
    }: {
      testID?: string;
      headerContent?: React.ReactNode;
      summaryTab?: React.ReactNode;
      detailTab?: React.ReactNode;
      recommendTab?: React.ReactNode;
      usedFallback?: boolean;
    }) => (
      <View testID={testID}>
        <Text testID="used-fallback">{String(usedFallback)}</Text>
        {headerContent}
        {summaryTab}
        {detailTab}
        {recommendTab}
      </View>
    ),
    ColorPalette: ({ colors, testID }: { colors: { color: string }[]; testID?: string }) => (
      <View testID={testID}>
        <Text>{colors.map((color) => color.color).join(',')}</Text>
      </View>
    ),
    ColorHarmonyGuide: ({ baseHex }: { baseHex: string }) => <Text>{baseHex}</Text>,
    MetricBar: () => <View />,
    DrapingPreview: ({
      palette,
      avoidPalette,
      seasonDescription,
    }: {
      palette: string[];
      avoidPalette: string[];
      seasonDescription: string;
    }) => (
      <View testID="draping-preview">
        <Text>{palette.join(',')}</Text>
        <Text>{avoidPalette.join(',')}</Text>
        <Text>{seasonDescription}</Text>
      </View>
    ),
    TopActionsCard: () => <View />,
    useAnalysisStyles: () => ({
      module: {
        personalColor: { base: '#EC4899', light: '#F9A8D4', dark: '#BE185D' },
      },
    }),
  };
});

jest.mock('../../../components/common/AIBadge', () => {
  const { View } = require('react-native');
  return { AIBadge: () => <View /> };
});

jest.mock('../../../components/common/ProgressiveDisclosure', () => {
  const { View } = require('react-native');
  return {
    ProgressiveDisclosure: ({
      summary,
      detail,
    }: {
      summary?: React.ReactNode;
      detail?: React.ReactNode;
    }) => (
      <View>
        {summary}
        {detail}
      </View>
    ),
  };
});

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    GradientCard: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    CelebrationEffect: () => <View />,
    BadgeDrop: () => <View />,
  };
});

jest.mock('../../../lib/analysis', () => ({ buildPersonalColorTopActions: () => [] }));

jest.mock('../../../lib/theme', () => {
  const typography = {
    size: { sm: 14, base: 16 },
    weight: { medium: '500', semibold: '600', bold: '700' },
  };
  return {
    useTheme: () => ({
      colors: { foreground: '#111111', mutedForeground: '#666666' },
      typography,
      isDark: false,
    }),
    typography,
    radii: { circle: 999 },
    spacing: { xs: 4, sm: 8, smx: 10, smd: 12, md: 16, mlg: 20 },
  };
});

describe('PersonalColorResultScreen 서버 팔레트 배선', () => {
  beforeEach(() => {
    mockRequestPersonalColorAnalysis.mockReset();
  });

  it('서버 12톤과 팔레트를 시즌 고정표보다 우선해 결과 화면에 표시한다', async () => {
    mockRequestPersonalColorAnalysis.mockResolvedValue({
      season: 'Spring',
      seasonSubtype: 'bright',
      confidence: 0.91,
      description: '서버 분석 설명',
      bestColors: ['#123456', '#ABCDEF'],
      worstColors: ['#654321'],
      usedMock: false,
    });

    const screen = render(<PersonalColorResultScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('analysis-personal-color-result-screen')).toBeTruthy()
    );

    expect(screen.getByText('브라이트')).toBeTruthy();
    expect(within(screen.getByTestId('pc-best-colors')).getByText('#123456,#ABCDEF')).toBeTruthy();
    expect(within(screen.getByTestId('pc-worst-colors')).getByText('#654321')).toBeTruthy();
    expect(
      within(screen.getByTestId('pc-best-colors')).queryByText(
        '#FFB6C1,#FFDAB9,#FFA07A,#F0E68C,#98FB98,#FFD700'
      )
    ).toBeNull();
  });

  it('서버 팔레트가 비어 고정표를 쓰면 폴백임을 정직하게 표시한다', async () => {
    mockRequestPersonalColorAnalysis.mockResolvedValue({
      season: 'Spring',
      seasonSubtype: null,
      confidence: 0.91,
      description: '구형 서버 응답',
      bestColors: [],
      worstColors: [],
      usedMock: false,
    });

    const screen = render(<PersonalColorResultScreen />);

    await waitFor(() => expect(screen.getByTestId('used-fallback').props.children).toBe('true'));
  });
});
