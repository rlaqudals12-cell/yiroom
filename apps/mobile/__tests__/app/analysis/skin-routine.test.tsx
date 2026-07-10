/**
 * 스킨케어 루틴 화면 렌더링 테스트 — thin client (ADR-118)
 *
 * 대상: app/(analysis)/skin/routine.tsx
 * testID: analysis-skin-routine-screen
 * 검증: 분석 0건 CTA 분기, 스텝 스펙명·보유 배지, 저녁 탭 주간 7칸.
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { renderWithTheme } from '../../helpers/test-utils';
import type { DailyRoutineData } from '../../../lib/api/routine';

// --- Standard mocks ---

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown => new Proxy({}, { get: () => createChainable });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    FadeInUp: createChainable(),
    FadeIn: createChainable(),
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

// --- Screen-specific mocks ---

const mockHook = {
  data: null as DailyRoutineData | null,
  stale: false,
  isLoading: false,
  error: null as string | null,
  refetch: jest.fn(),
};
jest.mock('../../../hooks/useDailyRoutine', () => ({
  useDailyRoutine: jest.fn(() => mockHook),
}));

jest.mock('@/lib/skincare', () => ({
  getCategoryInfo: jest.fn(() => ({ emoji: '🧴', label: '클렌저' })),
}));

// ProgressiveDisclosure — summary + detail 모두 렌더(펼침 상태 가정)
jest.mock('../../../components/common', () => {
  const { View } = require('react-native');
  return {
    ProgressiveDisclosure: ({
      summary,
      detail,
    }: {
      summary: React.ReactNode;
      detail: React.ReactNode;
    }) => (
      <View>
        {summary}
        {detail}
      </View>
    ),
  };
});

// DataStateWrapper — 로딩/에러/빈/정상 분기를 실제와 동일하게 흉내
jest.mock('../../../components/ui', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    GlassCard: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
      [key: string]: unknown;
    }) => <View testID={testID}>{children}</View>,
    DataStateWrapper: ({
      children,
      isLoading,
      error,
      isEmpty,
      emptyConfig,
    }: {
      children: React.ReactNode;
      isLoading: boolean;
      error?: unknown;
      isEmpty?: boolean;
      emptyConfig?: { title: string; actionLabel?: string; onAction?: () => void };
    }) => {
      if (isLoading) return <View testID="data-state-loading" />;
      if (error) return <Text>{String(error)}</Text>;
      if (isEmpty && emptyConfig)
        return (
          <Pressable testID="empty-cta" onPress={emptyConfig.onAction}>
            <Text>{emptyConfig.title}</Text>
            <Text>{emptyConfig.actionLabel}</Text>
          </Pressable>
        );
      return <View>{children}</View>;
    },
  };
});

// --- Import screen after mocks ---
import SkincareRoutineScreen from '../../../app/(analysis)/skin/routine';

function makeStep(over: Partial<import('../../../lib/api/routine').RoutineStepData> = {}) {
  return {
    order: 1,
    category: 'cleanser',
    name: '클렌저',
    specName: '약산성 클렌저',
    specReason: '피부 장벽을 덜 자극해요',
    purpose: '노폐물 제거',
    tips: [],
    isOptional: false,
    howto: { amount: '500원 동전 크기', method: '거품을 내서 세안', tips: ['부드럽게'] },
    ...over,
  };
}

const fullData: DailyRoutineData = {
  date: '2026-07-10',
  hasSkinAnalysis: true,
  skinType: 'combination',
  skinTypeLabel: '복합성',
  personalizationNote: '복합성 피부에 맞춘 루틴이에요.',
  carePhase: { phase: 'barrier', label: '장벽 회복 단계', message: '지금은 장벽 회복이 먼저예요' },
  goals: [{ id: 'hydration', label: '수분' }],
  morning: [makeStep({ ownedProduct: { name: '수분 크림', brand: '테스트' } })],
  evening: [makeStep({ order: 1, category: 'toner', name: '토너' })],
  eveningFocus: { focus: 'recovery', label: '회복의 날', reason: '진정·보습에 집중해요' },
  weeklyCycle: Array.from({ length: 7 }, (_, dow) => ({
    dow,
    focus: 'recovery' as const,
    label: '회복의 날',
  })),
};

describe('SkincareRoutineScreen (thin client)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHook.data = null;
    mockHook.stale = false;
    mockHook.isLoading = false;
    mockHook.error = null;
  });

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SkincareRoutineScreen />);
    expect(getByTestId('analysis-skin-routine-screen')).toBeTruthy();
  });

  it('분석 0건이면 CTA(피부 분석하러 가기)를 노출하고 분석 화면으로 보낸다', () => {
    mockHook.data = { date: '2026-07-10', hasSkinAnalysis: false };
    const { getByTestId, getByText } = renderWithTheme(<SkincareRoutineScreen />);

    expect(getByText('피부 분석하러 가기')).toBeTruthy();
    fireEvent.press(getByTestId('empty-cta'));
    const { router } = require('expo-router');
    expect(router.push).toHaveBeenCalledWith('/(analysis)/skin');
  });

  it('데이터가 없어도 CTA 빈 상태를 노출한다', () => {
    mockHook.data = null;
    const { getByTestId } = renderWithTheme(<SkincareRoutineScreen />);
    expect(getByTestId('empty-cta')).toBeTruthy();
  });

  it('루틴이 있으면 제목·스펙명·보유 배지를 표시한다', () => {
    mockHook.data = fullData;
    const { getByText, getByTestId } = renderWithTheme(<SkincareRoutineScreen />);

    expect(getByText('오늘의 스킨케어 루틴')).toBeTruthy();
    // 스펙명 우선 표시
    expect(getByText('약산성 클렌저')).toBeTruthy();
    // "내 ○○" 보유 배지
    expect(getByTestId('routine-owned-badge')).toBeTruthy();
    expect(getByText('내 수분 크림')).toBeTruthy();
    // 케어 단계
    expect(getByTestId('routine-care-phase')).toBeTruthy();
  });

  it('저녁 탭으로 전환하면 주간 7칸 사이클을 표시한다', () => {
    mockHook.data = fullData;
    const { getByTestId, getAllByTestId } = renderWithTheme(<SkincareRoutineScreen />);

    fireEvent.press(getByTestId('routine-toggle-evening'));

    expect(getByTestId('routine-evening-focus')).toBeTruthy();
    expect(getAllByTestId('routine-week-cell')).toHaveLength(7);
  });
});
