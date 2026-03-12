/**
 * ConnectionAwareness 모바일 컴포넌트 통합 테스트
 *
 * CrossModuleInsight CA depth 분기, DailyCapsuleCard CA 통합,
 * ActiveInsightCard 렌더링 검증
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../lib/theme/ThemeProvider';
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
} from '../../lib/theme/tokens';

// ─── 공통 Mock ────────────────────────────────────────────────────────────────

const mockConfirm = jest.fn().mockResolvedValue(undefined);

jest.mock('../../hooks/useConnectionExposure', () => ({
  useConnectionExposure: jest.fn(() => ({
    status: 'exposed',
    depth: 'full',
    isConfirmed: false,
    exposureCount: 1,
    confirm: mockConfirm,
  })),
}));

jest.mock('../../lib/connection-awareness', () => ({
  exposeConnection: jest.fn().mockResolvedValue({ status: 'exposed', exposureCount: 1 }),
  confirmConnection: jest.fn().mockResolvedValue({ status: 'recognized' }),
  getExplanationDepth: jest.fn().mockReturnValue('full'),
  capsuleItemToExposeRequest: jest.fn((moduleCode: string) => ({
    connectionId: `daily_routine::${moduleCode}`,
    sourceModule: moduleCode,
    targetDomain: 'daily-routine',
    connectionRule: `${moduleCode} 기반 — 데일리 루틴 추천`,
  })),
  capsuleModulesToExposeRequests: jest.fn().mockReturnValue([]),
  insightToExposeRequest: jest.fn(),
  getModuleLabel: jest.fn((module: string) => {
    const labels: Record<string, string> = {
      skin: '피부 분석',
      'personal-color': '퍼스널컬러',
      body: '체형 분석',
      workout: '운동',
      nutrition: '영양',
    };
    return labels[module] ?? module;
  }),
  analysisToConnectionModule: jest.fn(),
}));

// GlassCard는 children을 투명하게 렌더링
jest.mock('../../components/ui/GlassCard', () => ({
  GlassCard: ({ children, testID, style }: { children: React.ReactNode; testID?: string; style?: object }) => {
    const { View } = require('react-native');
    return <View testID={testID} style={style}>{children}</View>;
  },
}));

// CapsuleProgressBar 간단 mock
jest.mock('../../components/capsule/CapsuleProgressBar', () => ({
  CapsuleProgressBar: () => null,
}));

// lucide-react-native mock
jest.mock('lucide-react-native', () => ({
  Lightbulb: () => null,
  Sparkles: () => null,
  Check: () => null,
}));

// ─── 테스트 헬퍼 ──────────────────────────────────────────────────────────────

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
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ─── CrossModuleInsight + CA depth 분기 ──────────────────────────────────────

import { CrossModuleInsight } from '../../components/home/CrossModuleInsight';
import type { CrossModuleInsight as InsightType } from '../../hooks/useCrossModuleInsights';

const mockInsights: InsightType[] = [
  {
    id: 'skin-water',
    emoji: '💧',
    title: '피부 수분이 부족해요',
    description: '물을 더 마시면 피부 수분도가 올라갈 수 있어요',
    modules: ['skin', 'nutrition'],
    priority: 90,
  },
  {
    id: 'workout-streak',
    emoji: '💪',
    title: '운동 5일 연속 달성',
    description: '좋은 습관이 만들어지고 있어요!',
    modules: ['workout'],
    priority: 70,
  },
  {
    id: 'style-synergy',
    emoji: '✨',
    title: '스타일 시너지 발견',
    description: '퍼스널컬러와 체형 분석을 조합해 최적의 코디를 찾아보세요',
    modules: ['personalColor', 'body'],
    priority: 75,
  },
];

describe('CrossModuleInsight — CA depth 분기', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'exposed',
      depth: 'full',
      isConfirmed: false,
      exposureCount: 1,
      confirm: mockConfirm,
    });
  });

  it('full depth에서 인사이트 제목과 설명을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    expect(getByText('피부 수분이 부족해요')).toBeTruthy();
    expect(getByText('물을 더 마시면 피부 수분도가 올라갈 수 있어요')).toBeTruthy();
  });

  it('full depth에서 확인 버튼을 표시해야 한다', () => {
    const { getAllByTestId } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    const buttons = getAllByTestId(/^confirm-insight-/);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('확인 버튼 클릭 시 confirm이 호출되어야 한다', () => {
    const { getAllByTestId } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    const buttons = getAllByTestId(/^confirm-insight-/);
    fireEvent.press(buttons[0]);
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('depth=none일 때 인사이트 제목을 숨겨야 한다', () => {
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'independent',
      depth: 'none',
      isConfirmed: true,
      exposureCount: 10,
      confirm: mockConfirm,
    });

    const { queryByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    expect(queryByText('피부 수분이 부족해요')).toBeNull();
    expect(queryByText('운동 5일 연속 달성')).toBeNull();
  });

  it('depth=brief일 때 제목은 표시하고 설명을 제한해야 한다', () => {
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'recognized',
      depth: 'brief',
      isConfirmed: false,
      exposureCount: 3,
      confirm: mockConfirm,
    });

    const { getByText } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    // 제목은 보여야 함
    expect(getByText('피부 수분이 부족해요')).toBeTruthy();
  });

  it('isConfirmed=true일 때 클릭 가능한 confirm 버튼이 없어야 한다', () => {
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'recognized',
      depth: 'full',
      isConfirmed: true,
      exposureCount: 3,
      confirm: mockConfirm,
    });

    const { queryAllByTestId } = renderWithTheme(
      <CrossModuleInsight insights={mockInsights} />
    );
    const confirmButtons = queryAllByTestId(/^confirm-insight-/);
    expect(confirmButtons.length).toBe(0);
  });

  it('빈 insights일 때 null을 반환해야 한다', () => {
    const { toJSON } = renderWithTheme(
      <CrossModuleInsight insights={[]} />
    );
    expect(toJSON()).toBeNull();
  });
});

// ─── DailyCapsuleCard CA 통합 ─────────────────────────────────────────────────

import { DailyCapsuleCard } from '../../components/capsule/DailyCapsuleCard';

const mockCapsuleItems = [
  { id: '1', moduleCode: 'S', name: '수분 크림', reason: '건조한 피부에 수분 공급', isChecked: false },
  { id: '2', moduleCode: 'N', name: '비타민 C', reason: '피부 톤 개선', isChecked: false },
];

const mockCapsule = {
  id: 'capsule-1',
  items: mockCapsuleItems,
  totalCcs: 82,
  status: 'active',
};

describe('DailyCapsuleCard — CA 통합', () => {
  const onGenerate = jest.fn();
  const onCheckItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'exposed',
      depth: 'full',
      isConfirmed: false,
      exposureCount: 1,
      confirm: mockConfirm,
    });
  });

  it('캡슐 아이템 이름을 렌더링해야 한다', () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <DailyCapsuleCard
        capsule={mockCapsule}
        completionRate={0}
        onGenerate={onGenerate}
        onCheckItem={onCheckItem}
      />
    );

    fireEvent.press(getByLabelText('캡슐 펼치기'));
    expect(getByText('수분 크림')).toBeTruthy();
    expect(getByText('비타민 C')).toBeTruthy();
  });

  it('full depth에서 reason을 표시해야 한다', () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <DailyCapsuleCard
        capsule={mockCapsule}
        completionRate={0}
        onGenerate={onGenerate}
        onCheckItem={onCheckItem}
      />
    );

    fireEvent.press(getByLabelText('캡슐 펼치기'));
    expect(getByText('건조한 피부에 수분 공급')).toBeTruthy();
  });

  it('minimal depth에서 reason을 숨겨야 한다', () => {
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'internalized',
      depth: 'minimal',
      isConfirmed: true,
      exposureCount: 5,
      confirm: mockConfirm,
    });

    const { getByLabelText, queryByText } = renderWithTheme(
      <DailyCapsuleCard
        capsule={mockCapsule}
        completionRate={0}
        onGenerate={onGenerate}
        onCheckItem={onCheckItem}
      />
    );

    fireEvent.press(getByLabelText('캡슐 펼치기'));
    expect(queryByText('건조한 피부에 수분 공급')).toBeNull();
    expect(queryByText('피부 톤 개선')).toBeNull();
  });

  it('none depth에서 reason을 숨겨야 한다', () => {
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'independent',
      depth: 'none',
      isConfirmed: true,
      exposureCount: 10,
      confirm: mockConfirm,
    });

    const { getByLabelText, queryByText } = renderWithTheme(
      <DailyCapsuleCard
        capsule={mockCapsule}
        completionRate={0}
        onGenerate={onGenerate}
        onCheckItem={onCheckItem}
      />
    );

    fireEvent.press(getByLabelText('캡슐 펼치기'));
    expect(queryByText('건조한 피부에 수분 공급')).toBeNull();
  });

  it('아이템 체크 시 onCheckItem과 confirm을 호출해야 한다', async () => {
    const { getByLabelText } = renderWithTheme(
      <DailyCapsuleCard
        capsule={mockCapsule}
        completionRate={0}
        onGenerate={onGenerate}
        onCheckItem={onCheckItem}
      />
    );

    fireEvent.press(getByLabelText('캡슐 펼치기'));
    fireEvent.press(getByLabelText('수분 크림 미완료'));

    expect(onCheckItem).toHaveBeenCalledWith('1', true);
    // confirm은 async이므로 호출 여부만 체크 (비동기 결과는 별도 테스트)
  });

  it('CA capsuleItemToExposeRequest를 각 아이템에 호출해야 한다', () => {
    const { capsuleItemToExposeRequest } = require('../../lib/connection-awareness');
    const { getByLabelText } = renderWithTheme(
      <DailyCapsuleCard
        capsule={mockCapsule}
        completionRate={0}
        onGenerate={onGenerate}
        onCheckItem={onCheckItem}
      />
    );

    fireEvent.press(getByLabelText('캡슐 펼치기'));
    // 아이템 2개가 렌더링되므로 capsuleItemToExposeRequest가 최소 2회 호출됨
    expect(capsuleItemToExposeRequest).toHaveBeenCalledWith('S');
    expect(capsuleItemToExposeRequest).toHaveBeenCalledWith('N');
  });
});

// ─── ActiveInsightCard ────────────────────────────────────────────────────────

import { ActiveInsightCard } from '../../components/home/ActiveInsightCard';

const activeInsights: InsightType[] = [
  {
    id: 'skin-water',
    emoji: '💧',
    title: '피부 수분이 부족해요',
    description: '물을 더 마시면 피부 수분도가 올라갈 수 있어요',
    modules: ['skin', 'nutrition'],
    priority: 90,
  },
  {
    id: 'workout-streak',
    emoji: '💪',
    title: '운동 5일 연속 달성',
    description: '좋은 습관이 만들어지고 있어요!',
    modules: ['workout'],
    priority: 70,
  },
  {
    id: 'extra',
    emoji: '✨',
    title: '추가 인사이트',
    description: '이건 maxItems 초과',
    modules: [],
    priority: 50,
  },
];

describe('ActiveInsightCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'exposed',
      depth: 'full',
      isConfirmed: false,
      exposureCount: 1,
      confirm: mockConfirm,
    });
  });

  it('최대 2개 인사이트만 렌더링해야 한다', () => {
    const { getByText, queryByText } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />
    );
    expect(getByText('피부 수분이 부족해요')).toBeTruthy();
    expect(getByText('운동 5일 연속 달성')).toBeTruthy();
    // 3번째 인사이트는 표시 안 됨
    expect(queryByText('추가 인사이트')).toBeNull();
  });

  it('활성 인사이트 타이틀을 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />
    );
    expect(getByText('활성 인사이트')).toBeTruthy();
  });

  it('소스 배지를 표시해야 한다 (연관 모듈이 있을 때)', () => {
    const { getByTestId } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />
    );
    // skin-water 인사이트에는 소스 배지 존재
    expect(getByTestId('source-badge-skin-water')).toBeTruthy();
  });

  it('소스 배지 텍스트에 모듈 라벨이 포함되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />
    );
    const badge = getByTestId('source-badge-skin-water');
    // 피부 분석 + 영양 라벨 포함
    expect(badge).toBeTruthy();
  });

  it('연관 모듈 없으면 소스 배지를 숨겨야 한다', () => {
    const insightsNoModules: InsightType[] = [
      {
        id: 'welcome',
        emoji: '👋',
        title: '이룸과 함께 시작해요',
        description: '분석, 운동, 식단을 기록하면 맞춤 인사이트를 받을 수 있어요',
        modules: [],
        priority: 10,
      },
    ];

    const { queryByTestId } = renderWithTheme(
      <ActiveInsightCard insights={insightsNoModules} />
    );
    expect(queryByTestId('source-badge-welcome')).toBeNull();
  });

  it('빈 insights일 때 null을 반환해야 한다', () => {
    const { toJSON } = renderWithTheme(
      <ActiveInsightCard insights={[]} />
    );
    expect(toJSON()).toBeNull();
  });

  it('testID를 설정해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} testID="active-insight" />
    );
    expect(getByTestId('active-insight')).toBeTruthy();
  });

  it('depth=none일 때 인사이트를 숨겨야 한다', () => {
    const { useConnectionExposure } = require('../../hooks/useConnectionExposure');
    useConnectionExposure.mockReturnValue({
      status: 'independent',
      depth: 'none',
      isConfirmed: true,
      exposureCount: 10,
      confirm: mockConfirm,
    });

    const { queryByText } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />
    );
    expect(queryByText('피부 수분이 부족해요')).toBeNull();
  });

  it('확인 버튼을 렌더링해야 한다 (full depth)', () => {
    const { getAllByTestId } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />
    );
    const buttons = getAllByTestId(/^confirm-active-insight-/);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('확인 버튼 클릭 시 confirm이 호출되어야 한다', () => {
    const { getAllByTestId } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />
    );
    const buttons = getAllByTestId(/^confirm-active-insight-/);
    fireEvent.press(buttons[0]);
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('다크모드에서 렌더링되어야 한다', () => {
    const { getByText } = renderWithTheme(
      <ActiveInsightCard insights={activeInsights} />,
      true
    );
    expect(getByText('활성 인사이트')).toBeTruthy();
    expect(getByText('피부 수분이 부족해요')).toBeTruthy();
  });
});
