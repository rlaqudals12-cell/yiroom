/**
 * ResultLayout 컴포넌트 테스트
 *
 * 대상: components/analysis/ResultLayout.tsx
 * 모든 분석 결과 화면의 공통 레이아웃 셸 검증
 * - 기본 렌더링 (필수 props)
 * - 제목 표시
 * - 신뢰도 배지 (AnalysisTrustBadge) 렌더링
 * - GradeDisplay 조건부 렌더링 (confidence 유무)
 * - 전문가 상담 CTA 카드
 * - Mock fallback 배너 (usedFallback=true)
 * - 3탭 TabView 렌더링
 * - 다크 모드
 */
import React from 'react';
import { View, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { ResultLayout } from '../../../components/analysis/ResultLayout';
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

// ============================================================
// Mocks
// ============================================================

// expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

// react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    SafeAreaView: (props: Record<string, unknown>) =>
      R.createElement(RN.View, props, props.children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// TabView — 탭 제목과 콘텐츠를 모두 렌더링하는 간단한 mock
jest.mock('../../../components/ui/TabView', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    TabView: (props: { tabs: Array<{ key: string; title: string; content: unknown }>; testID?: string }) =>
      R.createElement(
        RN.View,
        { testID: props.testID || 'tab-view' },
        props.tabs.map((tab: { key: string; title: string; content: unknown }) =>
          R.createElement(RN.View, { key: tab.key, testID: `tab-${tab.key}` },
            R.createElement(RN.Text, null, tab.title),
            tab.content,
          )
        )
      ),
  };
});

// AnalysisTrustBadge
jest.mock('../../../components/analysis/AnalysisTrustBadge', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AnalysisTrustBadge: (props: { testID?: string }) =>
      R.createElement(RN.View, {
        testID: props.testID || 'analysis-trust-badge',
      }),
  };
});

// AnalysisResultButtons
jest.mock('../../../components/analysis/AnalysisResultButtons', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    AnalysisResultButtons: (props: { testID?: string }) =>
      R.createElement(RN.View, {
        testID: props.testID || 'analysis-result-buttons',
      }),
  };
});

// GradeDisplay — confidence prop을 accessibilityHint에 반영하여 검증 가능
jest.mock('../../../components/analysis/GradeDisplay', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    GradeDisplay: (props: { confidence?: number; testID?: string }) =>
      R.createElement(RN.View, {
        testID: props.testID || 'grade-display',
        accessibilityHint: `confidence-${props.confidence}`,
      }),
  };
});

// GradientCard — testID와 children을 전달하는 단순 래퍼
jest.mock('../../../components/ui/GradientCard', () => {
  const RN = require('react-native');
  const R = require('react');
  return {
    GradientCard: (props: { testID?: string; children?: unknown }) =>
      R.createElement(RN.View, { testID: props.testID }, props.children),
  };
});

// @/lib/animations — TIMING 상수만 필요
jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 150, normal: 300, slow: 500, staggerInterval: 80 },
  ENTERING: {},
  EXITING: {},
  staggeredEntry: jest.fn(),
}));

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
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ============================================================
// 기본 Props 팩토리
// ============================================================

function createDefaultProps(overrides: Partial<React.ComponentProps<typeof ResultLayout>> = {}) {
  return {
    moduleKey: 'skin' as const,
    title: '피부 분석 결과',
    trustBadgeType: 'ai' as const,
    summaryTab: <View testID="summary-tab" />,
    detailTab: <View testID="detail-tab" />,
    recommendTab: <View testID="recommend-tab" />,
    primaryActionText: '제품 보기',
    onPrimaryAction: jest.fn(),
    retryPath: '/(analysis)/skin',
    ...overrides,
  };
}

// ============================================================
// 테스트
// ============================================================

describe('ResultLayout 컴포넌트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------
  // 기본 렌더링
  // --------------------------------------------------------
  describe('기본 렌더링', () => {
    it('필수 props로 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByTestId('analysis-result-layout')).toBeTruthy();
    });

    it('커스텀 testID를 사용할 수 있어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ testID: 'custom-layout' })} />
      );
      expect(getByTestId('custom-layout')).toBeTruthy();
    });
  });

  // --------------------------------------------------------
  // 제목 렌더링
  // --------------------------------------------------------
  describe('제목 렌더링', () => {
    // Animated.Text가 Reanimated mock에서 View로 대체되므로
    // getByText 대신 toJSON()으로 텍스트 포함 여부를 확인한다
    it('title prop이 화면에 표시되어야 한다', () => {
      const { toJSON } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ title: '피부 분석 결과' })} />
      );
      const json = JSON.stringify(toJSON());
      expect(json).toContain('피부 분석 결과');
    });

    it('다른 제목 문자열도 올바르게 표시되어야 한다', () => {
      const { toJSON } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ title: '체형 분석 결과' })} />
      );
      const json = JSON.stringify(toJSON());
      expect(json).toContain('체형 분석 결과');
    });
  });

  // --------------------------------------------------------
  // 신뢰도 배지 (AnalysisTrustBadge)
  // --------------------------------------------------------
  describe('신뢰도 배지 렌더링', () => {
    it('AnalysisTrustBadge가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByTestId('analysis-trust-badge')).toBeTruthy();
    });
  });

  // --------------------------------------------------------
  // GradeDisplay 조건부 렌더링
  // --------------------------------------------------------
  describe('GradeDisplay 렌더링', () => {
    it('confidence가 제공되면 GradeDisplay가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ confidence: 0.85 })} />
      );
      // confidence 0.85 -> confidencePercent 85
      expect(getByTestId('analysis-result-layout-grade')).toBeTruthy();
    });

    it('GradeDisplay에 올바른 confidencePercent가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ confidence: 0.92 })} />
      );
      const grade = getByTestId('analysis-result-layout-grade');
      // mock에서 accessibilityHint에 confidence 값을 반영
      expect(grade.props.accessibilityHint).toBe('confidence-92');
    });

    it('confidence가 undefined이면 GradeDisplay가 렌더링되지 않아야 한다', () => {
      const { queryByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ confidence: undefined })} />
      );
      expect(queryByTestId('analysis-result-layout-grade')).toBeNull();
    });

    it('confidence가 0이면 GradeDisplay가 렌더링되지 않아야 한다', () => {
      // confidencePercent = Math.round(0 * 100) = 0, 조건: confidencePercent > 0 -> false
      const { queryByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ confidence: 0 })} />
      );
      expect(queryByTestId('analysis-result-layout-grade')).toBeNull();
    });

    it('showGrade=false이면 confidence가 있어도 GradeDisplay가 렌더링되지 않아야 한다', () => {
      const { queryByTestId } = renderWithTheme(
        <ResultLayout
          {...createDefaultProps({ confidence: 0.9, showGrade: false })}
        />
      );
      expect(queryByTestId('analysis-result-layout-grade')).toBeNull();
    });
  });

  // --------------------------------------------------------
  // 전문가 상담 CTA 카드
  // --------------------------------------------------------
  describe('전문가 상담 CTA 카드', () => {
    it('전문가 상담 CTA 카드가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByTestId('analysis-result-layout-expert-cta')).toBeTruthy();
    });

    it('CTA 카드에 상담 안내 텍스트가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByText('더 자세한 분석이 궁금하다면?')).toBeTruthy();
      expect(
        getByText('AI 웰니스 코치와 1:1 상담을 받아보세요')
      ).toBeTruthy();
    });

    it('상담하기 버튼이 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByText('상담하기')).toBeTruthy();
    });

    it('상담하기 버튼 클릭 시 코치 화면으로 이동해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      fireEvent.press(getByTestId('analysis-result-layout-expert-cta-button'));
      expect(mockPush).toHaveBeenCalledWith('/(coach)');
    });
  });

  // --------------------------------------------------------
  // Mock fallback 배너
  // --------------------------------------------------------
  describe('Mock fallback 배너', () => {
    it('usedFallback=true일 때 fallback 배너가 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ usedFallback: true })} />
      );
      expect(
        getByText('AI 서비스 일시 제한으로 기본 분석 결과를 표시해요')
      ).toBeTruthy();
    });

    it('usedFallback=false일 때 fallback 배너가 표시되지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ usedFallback: false })} />
      );
      expect(
        queryByText('AI 서비스 일시 제한으로 기본 분석 결과를 표시해요')
      ).toBeNull();
    });

    it('usedFallback이 undefined일 때 fallback 배너가 표시되지 않아야 한다', () => {
      const { queryByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(
        queryByText('AI 서비스 일시 제한으로 기본 분석 결과를 표시해요')
      ).toBeNull();
    });
  });

  // --------------------------------------------------------
  // 3탭 TabView 렌더링
  // --------------------------------------------------------
  describe('TabView 3탭 렌더링', () => {
    it('TabView가 올바른 testID로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByTestId('analysis-result-layout-tabs')).toBeTruthy();
    });

    it('요약/상세/추천 3개 탭이 모두 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByText('요약')).toBeTruthy();
      expect(getByText('상세')).toBeTruthy();
      expect(getByText('추천')).toBeTruthy();
    });

    it('각 탭의 콘텐츠가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(getByTestId('summary-tab')).toBeTruthy();
      expect(getByTestId('detail-tab')).toBeTruthy();
      expect(getByTestId('recommend-tab')).toBeTruthy();
    });
  });

  // --------------------------------------------------------
  // 하단 액션 버튼
  // --------------------------------------------------------
  describe('하단 액션 버튼', () => {
    it('AnalysisResultButtons가 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />
      );
      expect(
        getByTestId('analysis-result-layout-buttons')
      ).toBeTruthy();
    });
  });

  // --------------------------------------------------------
  // 다크 모드
  // --------------------------------------------------------
  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByTestId, toJSON } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />,
        true
      );
      expect(getByTestId('analysis-result-layout')).toBeTruthy();
      const json = JSON.stringify(toJSON());
      expect(json).toContain('피부 분석 결과');
    });

    it('다크 모드에서 배경색이 darkColors.background이어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />,
        true
      );
      const container = getByTestId('analysis-result-layout');
      const flatStyle = Array.isArray(container.props.style)
        ? container.props.style
        : [container.props.style];
      const hasDarkBg = flatStyle.some(
        (s: Record<string, unknown>) => s && s.backgroundColor === darkColors.background
      );
      expect(hasDarkBg).toBe(true);
    });

    it('다크 모드에서 CTA 카드와 탭뷰가 정상 렌더링되어야 한다', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps()} />,
        true
      );
      expect(getByTestId('analysis-result-layout-expert-cta')).toBeTruthy();
      expect(getByTestId('analysis-result-layout-tabs')).toBeTruthy();
      expect(getByText('상담하기')).toBeTruthy();
    });

    it('다크 모드에서 usedFallback 배너가 올바르게 표시되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ usedFallback: true })} />,
        true
      );
      expect(
        getByText('AI 서비스 일시 제한으로 기본 분석 결과를 표시해요')
      ).toBeTruthy();
    });

    it('다크 모드에서 GradeDisplay가 조건부로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout {...createDefaultProps({ confidence: 0.88 })} />,
        true
      );
      expect(getByTestId('analysis-result-layout-grade')).toBeTruthy();
    });
  });

  // --------------------------------------------------------
  // 엣지 케이스
  // --------------------------------------------------------
  describe('엣지 케이스', () => {
    it('다양한 moduleKey에서 정상 렌더링되어야 한다', () => {
      const keys = ['body', 'personalColor', 'hair', 'makeup', 'oralHealth'] as const;
      keys.forEach((key) => {
        const { getByTestId } = renderWithTheme(
          <ResultLayout {...createDefaultProps({ moduleKey: key })} />
        );
        expect(getByTestId('analysis-result-layout')).toBeTruthy();
      });
    });

    it('imageUri가 제공되면 이미지가 렌더링되어야 한다', () => {
      const { UNSAFE_getByType } = renderWithTheme(
        <ResultLayout
          {...createDefaultProps({ imageUri: 'https://example.com/face.jpg' })}
        />
      );
      const { Image } = require('react-native');
      const image = UNSAFE_getByType(Image);
      expect(image.props.source.uri).toBe('https://example.com/face.jpg');
    });

    it('headerContent가 제공되면 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <ResultLayout
          {...createDefaultProps({
            headerContent: <View testID="custom-header-content" />,
          })}
        />
      );
      expect(getByTestId('custom-header-content')).toBeTruthy();
    });
  });
});
