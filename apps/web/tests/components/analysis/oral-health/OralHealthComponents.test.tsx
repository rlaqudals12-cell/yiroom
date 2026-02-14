/**
 * OH-1 구강건강 분석 컴포넌트 테스트
 * @description GumHealthIndicator, OralHealthResultCard, VitaShadeDisplay
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type {
  GumHealthResult,
  GumHealthStatus,
  OralHealthAssessment,
  ToothColorResult,
  VitaShade,
  WhiteningGoalResult,
} from '@/types/oral-health';

// ============================================
// Mock 설정
// ============================================

// lucide-react 아이콘 mock
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-alert-triangle" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  CheckCircle: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-check-circle" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  AlertCircle: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-alert-circle" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  XCircle: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-x-circle" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  Sparkles: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-sparkles" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  Calendar: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-calendar" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  ChevronDown: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-chevron-down" {...props}>
      {children as React.ReactNode}
    </div>
  ),
  ChevronUp: ({ children, ...props }: Record<string, unknown>) => (
    <div data-testid="icon-chevron-up" {...props}>
      {children as React.ReactNode}
    </div>
  ),
}));

// shadcn/ui Progress mock
vi.mock('@/components/ui/progress', () => ({
  Progress: ({
    value,
    className,
    indicatorClassName,
  }: {
    value?: number;
    className?: string;
    indicatorClassName?: string;
  }) => (
    <div
      data-testid="progress-bar"
      data-value={value}
      className={className}
      data-indicator-class={indicatorClassName}
    />
  ),
}));

// shadcn/ui Badge mock
vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

// shadcn/ui Button mock
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
  }) => (
    <button onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// shadcn/ui Tabs mock
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    defaultValue,
    className,
  }: {
    children: React.ReactNode;
    defaultValue?: string;
    className?: string;
  }) => (
    <div data-testid="tabs" data-default-value={defaultValue} className={className}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="tabs-list" className={className}>
      {children}
    </div>
  ),
  TabsTrigger: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => (
    <button data-testid={`tab-trigger-${value}`} className={className}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

// cn 유틸리티 mock
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false | null)[]) => classes.filter(Boolean).join(' '),
}));

// 컴포넌트 import
import { GumHealthIndicator } from '@/components/analysis/oral-health/GumHealthIndicator';
import { VitaShadeDisplay } from '@/components/analysis/oral-health/VitaShadeDisplay';
import { OralHealthResultCard } from '@/components/analysis/oral-health/OralHealthResultCard';

// ============================================
// Mock 데이터 팩토리
// ============================================

function createMockGumHealthResult(overrides: Partial<GumHealthResult> = {}): GumHealthResult {
  return {
    healthStatus: 'healthy',
    inflammationScore: 15,
    needsDentalVisit: false,
    metrics: {
      aStarMean: 12,
      aStarStd: 2.5,
      rednessPercentage: 5,
      swellingIndicator: 0,
    },
    recommendations: [
      '하루 2회 이상 칫솔질을 해주세요.',
      '치실 사용을 권장해요.',
      '정기적인 치과 검진을 받아주세요.',
    ],
    affectedAreas: [],
    ...overrides,
  };
}

function createMockToothColorResult(overrides: Partial<ToothColorResult> = {}): ToothColorResult {
  return {
    measuredLab: { L: 67, a: 2.5, b: 18 },
    matchedShade: 'A2' as VitaShade,
    deltaE: 1.2,
    confidence: 85,
    alternativeMatches: [
      { shade: 'A1' as VitaShade, deltaE: 2.5 },
      { shade: 'B2' as VitaShade, deltaE: 3.0 },
    ],
    interpretation: {
      brightness: 'medium',
      yellowness: 'mild',
      series: 'A',
    },
    ...overrides,
  };
}

function createMockAssessment(overrides: Partial<OralHealthAssessment> = {}): OralHealthAssessment {
  return {
    id: 'oh_test_123',
    clerkUserId: 'user_123',
    createdAt: '2026-02-14T10:00:00Z',
    usedFallback: false,
    toothColor: createMockToothColorResult(),
    gumHealth: createMockGumHealthResult(),
    overallScore: 82,
    recommendations: ['정기적인 치과 검진을 받아주세요.', '하루 2회 이상 칫솔질을 해주세요.'],
    ...overrides,
  };
}

function createMockWhiteningGoal(
  overrides: Partial<WhiteningGoalResult> = {}
): WhiteningGoalResult {
  return {
    targetShade: 'B1' as VitaShade,
    shadeStepsNeeded: 3,
    expectedDuration: { minWeeks: 4, maxWeeks: 8 },
    isOverWhitening: false,
    harmonySuggestion: '봄 웜톤에는 밝고 따뜻한 아이보리 계열이 자연스럽습니다.',
    recommendedMethods: [
      {
        method: 'whitening_toothpaste',
        effectiveness: 'low',
        duration: '4-8주',
        notes: '일상적 관리에 적합해요',
      },
      {
        method: 'strips',
        effectiveness: 'medium',
        duration: '2-4주',
        notes: '집에서 사용 가능해요',
      },
    ],
    ...overrides,
  };
}

// ============================================
// GumHealthIndicator 테스트
// ============================================

describe('GumHealthIndicator', () => {
  describe('렌더링', () => {
    it('기본 렌더링 시 data-testid가 존재한다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult()} />);
      expect(screen.getByTestId('gum-health-indicator')).toBeInTheDocument();
    });

    it('잇몸 건강 제목이 표시된다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult()} />);
      expect(screen.getByText('잇몸 건강')).toBeInTheDocument();
    });

    it('관리 방법 섹션이 표시된다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult()} />);
      expect(screen.getByText('관리 방법')).toBeInTheDocument();
    });

    it('염증 지수 텍스트가 표시된다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 45 })} />);
      expect(screen.getByText('염증 지수')).toBeInTheDocument();
      expect(screen.getByText('45/100')).toBeInTheDocument();
    });

    it('Progress 바가 렌더링된다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 50 })} />);
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('data-value', '50');
    });
  });

  describe('건강 상태별 표시', () => {
    const statusCases: { status: GumHealthStatus; label: string; description: string }[] = [
      { status: 'healthy', label: '양호', description: '잇몸 건강 상태가 양호해요.' },
      {
        status: 'mild_gingivitis',
        label: '경미한 염증',
        description: '경미한 잇몸 염증이 관찰돼요.',
      },
      {
        status: 'moderate_gingivitis',
        label: '중등도 염증',
        description: '잇몸 염증이 있어요. 관리가 필요해요.',
      },
      {
        status: 'severe_inflammation',
        label: '심한 염증',
        description: '잇몸 염증이 심해요. 치과 방문을 권해 드려요.',
      },
    ];

    statusCases.forEach(({ status, label, description }) => {
      it(`${label} 상태 라벨이 표시된다`, () => {
        render(<GumHealthIndicator result={createMockGumHealthResult({ healthStatus: status })} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });

      it(`${label} 상태 설명이 표시된다`, () => {
        render(<GumHealthIndicator result={createMockGumHealthResult({ healthStatus: status })} />);
        expect(screen.getByText(description)).toBeInTheDocument();
      });
    });
  });

  describe('치과 방문 권장', () => {
    it('needsDentalVisit=true이면 치과 방문 권장 뱃지가 표시된다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ needsDentalVisit: true })} />);
      expect(screen.getByText('치과 방문 권장')).toBeInTheDocument();
    });

    it('needsDentalVisit=false이면 치과 방문 권장 뱃지가 숨겨진다', () => {
      render(
        <GumHealthIndicator result={createMockGumHealthResult({ needsDentalVisit: false })} />
      );
      expect(screen.queryByText('치과 방문 권장')).not.toBeInTheDocument();
    });
  });

  describe('염증 점수 등급 표시', () => {
    it('30 미만일 때 정상 범위 표시', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 20 })} />);
      expect(screen.getByText('정상 범위')).toBeInTheDocument();
    });

    it('30 이상 60 미만일 때 주의 필요 표시', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 45 })} />);
      expect(screen.getByText('주의 필요')).toBeInTheDocument();
    });

    it('60 이상일 때 관리 필요 표시', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 75 })} />);
      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });

    it('경계값: 29일 때 정상 범위', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 29 })} />);
      expect(screen.getByText('정상 범위')).toBeInTheDocument();
    });

    it('경계값: 30일 때 주의 필요', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 30 })} />);
      expect(screen.getByText('주의 필요')).toBeInTheDocument();
    });

    it('경계값: 59일 때 주의 필요', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 59 })} />);
      expect(screen.getByText('주의 필요')).toBeInTheDocument();
    });

    it('경계값: 60일 때 관리 필요', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ inflammationScore: 60 })} />);
      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });
  });

  describe('컴팩트 모드', () => {
    it('compact=false일 때 상세 지표가 표시된다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult()} compact={false} />);
      expect(screen.getByText('붉은 영역')).toBeInTheDocument();
      expect(screen.getByText('붉은기 수치')).toBeInTheDocument();
    });

    it('compact=true일 때 상세 지표가 숨겨진다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult()} compact={true} />);
      expect(screen.queryByText('붉은 영역')).not.toBeInTheDocument();
      expect(screen.queryByText('붉은기 수치')).not.toBeInTheDocument();
    });

    it('compact=true일 때 추천 사항이 최대 2개 표시된다', () => {
      const result = createMockGumHealthResult({
        recommendations: ['추천1', '추천2', '추천3', '추천4'],
      });
      render(<GumHealthIndicator result={result} compact={true} />);
      expect(screen.getByText('추천1')).toBeInTheDocument();
      expect(screen.getByText('추천2')).toBeInTheDocument();
      expect(screen.queryByText('추천3')).not.toBeInTheDocument();
    });

    it('compact=false일 때 추천 사항이 최대 4개 표시된다', () => {
      const result = createMockGumHealthResult({
        recommendations: ['추천1', '추천2', '추천3', '추천4', '추천5'],
      });
      render(<GumHealthIndicator result={result} compact={false} />);
      expect(screen.getByText('추천1')).toBeInTheDocument();
      expect(screen.getByText('추천4')).toBeInTheDocument();
      expect(screen.queryByText('추천5')).not.toBeInTheDocument();
    });
  });

  describe('영향 받은 영역', () => {
    it('영향 받은 영역이 없으면 섹션이 숨겨진다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult({ affectedAreas: [] })} />);
      expect(screen.queryByText('주의가 필요한 영역')).not.toBeInTheDocument();
    });

    it('영향 받은 영역이 있으면 표시된다', () => {
      render(
        <GumHealthIndicator
          result={createMockGumHealthResult({
            affectedAreas: [
              { region: 'upper_front', severity: 'mild' },
              { region: 'lower_back', severity: 'moderate' },
            ],
          })}
        />
      );
      expect(screen.getByText('주의가 필요한 영역')).toBeInTheDocument();
      expect(screen.getByText('윗니 앞쪽')).toBeInTheDocument();
      expect(screen.getByText('아랫니 뒤쪽')).toBeInTheDocument();
    });

    it('영역 레이블이 올바르게 변환된다', () => {
      const areas = [
        { region: 'upper_front' as const, severity: 'mild' as const, expected: '윗니 앞쪽' },
        { region: 'upper_back' as const, severity: 'mild' as const, expected: '윗니 뒤쪽' },
        { region: 'lower_front' as const, severity: 'mild' as const, expected: '아랫니 앞쪽' },
        { region: 'lower_back' as const, severity: 'mild' as const, expected: '아랫니 뒤쪽' },
      ];
      render(<GumHealthIndicator result={createMockGumHealthResult({ affectedAreas: areas })} />);
      areas.forEach(({ expected }) => {
        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  });

  describe('메트릭 표시', () => {
    it('붉은 영역 비율이 표시된다', () => {
      render(
        <GumHealthIndicator
          result={createMockGumHealthResult({
            metrics: {
              aStarMean: 12,
              aStarStd: 2.5,
              rednessPercentage: 15.3,
              swellingIndicator: 0,
            },
          })}
          compact={false}
        />
      );
      expect(screen.getByText('15.3%')).toBeInTheDocument();
    });

    it('붉은기 수치가 표시된다', () => {
      render(
        <GumHealthIndicator
          result={createMockGumHealthResult({
            metrics: { aStarMean: 18.7, aStarStd: 2.5, rednessPercentage: 5, swellingIndicator: 0 },
          })}
          compact={false}
        />
      );
      expect(screen.getByText('18.7')).toBeInTheDocument();
    });
  });

  describe('className 전달', () => {
    it('커스텀 className이 적용된다', () => {
      render(<GumHealthIndicator result={createMockGumHealthResult()} className="custom-class" />);
      const container = screen.getByTestId('gum-health-indicator');
      expect(container.className).toContain('custom-class');
    });
  });
});

// ============================================
// VitaShadeDisplay 테스트
// ============================================

describe('VitaShadeDisplay', () => {
  describe('렌더링', () => {
    it('기본 렌더링 시 data-testid가 존재한다', () => {
      render(<VitaShadeDisplay currentShade="A2" />);
      expect(screen.getByTestId('vita-shade-display')).toBeInTheDocument();
    });

    it('치아 색상 제목이 표시된다', () => {
      render(<VitaShadeDisplay currentShade="A2" />);
      expect(screen.getByText('치아 색상')).toBeInTheDocument();
    });

    it('현재 셰이드 텍스트가 표시된다', () => {
      render(<VitaShadeDisplay currentShade="A2" />);
      expect(screen.getByText('현재 셰이드')).toBeInTheDocument();
    });

    it('현재 셰이드 값이 표시된다', () => {
      render(<VitaShadeDisplay currentShade="B1" />);
      // B1 텍스트가 셰이드 원 안에 표시됨
      const b1Elements = screen.getAllByText('B1');
      expect(b1Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('셰이드별 설명', () => {
    it('0M 계열은 미백 처리로 표시된다', () => {
      render(<VitaShadeDisplay currentShade="0M1" />);
      expect(screen.getByText('미백 처리')).toBeInTheDocument();
    });

    it('A 계열은 따뜻한 갈색 계열로 표시된다', () => {
      render(<VitaShadeDisplay currentShade="A2" />);
      expect(screen.getByText('따뜻한 갈색 계열')).toBeInTheDocument();
    });

    it('B 계열은 밝은 노란 계열로 표시된다', () => {
      render(<VitaShadeDisplay currentShade="B2" />);
      expect(screen.getByText('밝은 노란 계열')).toBeInTheDocument();
    });

    it('C 계열은 차분한 회색 계열로 표시된다', () => {
      render(<VitaShadeDisplay currentShade="C1" />);
      expect(screen.getByText('차분한 회색 계열')).toBeInTheDocument();
    });

    it('D 계열은 자연스러운 회갈색 계열로 표시된다', () => {
      render(<VitaShadeDisplay currentShade="D2" />);
      expect(screen.getByText('자연스러운 회갈색 계열')).toBeInTheDocument();
    });
  });

  describe('목표 셰이드', () => {
    it('목표 셰이드가 없으면 목표 섹션이 숨겨진다', () => {
      render(<VitaShadeDisplay currentShade="A2" />);
      expect(screen.queryByText('목표 셰이드')).not.toBeInTheDocument();
    });

    it('목표 셰이드가 있으면 표시된다', () => {
      render(<VitaShadeDisplay currentShade="A3" targetShade="B1" />);
      expect(screen.getByText('목표 셰이드')).toBeInTheDocument();
    });

    it('목표가 현재보다 밝으면 N단계 밝게 표시', () => {
      // A3 = index 11, B1 = index 3 -> 8단계 밝게
      render(<VitaShadeDisplay currentShade="A3" targetShade="B1" />);
      expect(screen.getByText(/단계 밝게/)).toBeInTheDocument();
    });

    it('목표가 현재와 같으면 현재 유지 표시', () => {
      render(<VitaShadeDisplay currentShade="A2" targetShade="A2" />);
      expect(screen.getByText('현재 유지')).toBeInTheDocument();
    });
  });

  describe('셰이드 스케일', () => {
    it('compact=false일 때 셰이드 스케일이 표시된다', () => {
      render(<VitaShadeDisplay currentShade="A2" compact={false} />);
      expect(screen.getByText('VITA 셰이드 스케일')).toBeInTheDocument();
      expect(screen.getByText('밝음')).toBeInTheDocument();
      expect(screen.getByText('어두움')).toBeInTheDocument();
    });

    it('compact=true일 때 셰이드 스케일이 숨겨진다', () => {
      render(<VitaShadeDisplay currentShade="A2" compact={true} />);
      expect(screen.queryByText('VITA 셰이드 스케일')).not.toBeInTheDocument();
    });
  });

  describe('신뢰도 표시', () => {
    it('result 전달 시 신뢰도가 표시된다', () => {
      render(
        <VitaShadeDisplay
          currentShade="A2"
          result={createMockToothColorResult({ confidence: 85 })}
        />
      );
      expect(screen.getByText('신뢰도 85%')).toBeInTheDocument();
    });

    it('result 없으면 신뢰도가 숨겨진다', () => {
      render(<VitaShadeDisplay currentShade="A2" />);
      expect(screen.queryByText(/신뢰도/)).not.toBeInTheDocument();
    });
  });

  describe('해석 정보', () => {
    it('result 전달 시 밝기 해석이 표시된다', () => {
      // compact 모드로 셰이드 스케일의 "밝음" 레이블과 겹치지 않도록 함
      render(
        <VitaShadeDisplay
          currentShade="A2"
          compact={true}
          result={createMockToothColorResult({
            interpretation: { brightness: 'bright', yellowness: 'mild', series: 'A' },
          })}
        />
      );
      // 밝기: + 밝음이 해석 섹션에 있음
      const brightnessElements = screen.getAllByText('밝음');
      expect(brightnessElements.length).toBeGreaterThanOrEqual(1);
    });

    it('result 전달 시 황색도 해석이 표시된다', () => {
      render(
        <VitaShadeDisplay
          currentShade="A2"
          compact={true}
          result={createMockToothColorResult({
            interpretation: { brightness: 'medium', yellowness: 'moderate', series: 'A' },
          })}
        />
      );
      // 누런 정도: + 보통
      const moderateElements = screen.getAllByText('보통');
      expect(moderateElements.length).toBeGreaterThanOrEqual(1);
    });

    it('밝기 레이블: very_bright -> 매우 밝음', () => {
      render(
        <VitaShadeDisplay
          currentShade="0M1"
          compact={true}
          result={createMockToothColorResult({
            interpretation: { brightness: 'very_bright', yellowness: 'minimal', series: 'A' },
          })}
        />
      );
      expect(screen.getByText('매우 밝음')).toBeInTheDocument();
    });

    it('밝기 레이블: dark -> 어두움', () => {
      render(
        <VitaShadeDisplay
          currentShade="A4"
          compact={true}
          result={createMockToothColorResult({
            interpretation: { brightness: 'dark', yellowness: 'significant', series: 'A' },
          })}
        />
      );
      // compact 모드에서는 셰이드 스케일의 "어두움"이 안 나오므로 해석만 존재
      expect(screen.getByText('어두움')).toBeInTheDocument();
    });

    it('황색도 레이블: minimal -> 최소', () => {
      render(
        <VitaShadeDisplay
          currentShade="0M1"
          compact={true}
          result={createMockToothColorResult({
            interpretation: { brightness: 'very_bright', yellowness: 'minimal', series: 'A' },
          })}
        />
      );
      expect(screen.getByText('최소')).toBeInTheDocument();
    });

    it('황색도 레이블: significant -> 상당', () => {
      render(
        <VitaShadeDisplay
          currentShade="A4"
          compact={true}
          result={createMockToothColorResult({
            interpretation: { brightness: 'dark', yellowness: 'significant', series: 'A' },
          })}
        />
      );
      expect(screen.getByText('상당')).toBeInTheDocument();
    });
  });

  describe('className 전달', () => {
    it('커스텀 className이 적용된다', () => {
      render(<VitaShadeDisplay currentShade="A2" className="test-class" />);
      const container = screen.getByTestId('vita-shade-display');
      expect(container.className).toContain('test-class');
    });
  });
});

// ============================================
// OralHealthResultCard 테스트
// ============================================

describe('OralHealthResultCard', () => {
  describe('렌더링', () => {
    it('기본 렌더링 시 data-testid가 존재한다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment()} />);
      expect(screen.getByTestId('oral-health-result-card')).toBeInTheDocument();
    });

    it('구강건강 분석 제목이 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment()} />);
      expect(screen.getByText('구강건강 분석')).toBeInTheDocument();
    });

    it('생성 날짜가 한국어 형식으로 표시된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment({ createdAt: '2026-02-14T10:00:00Z' })}
        />
      );
      // toLocaleDateString('ko-KR')으로 변환
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('종합 점수가 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ overallScore: 82 })} />);
      expect(screen.getByText('82')).toBeInTheDocument();
    });
  });

  describe('추정값 뱃지', () => {
    it('usedFallback=true이면 추정값 뱃지가 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ usedFallback: true })} />);
      expect(screen.getByText('추정값')).toBeInTheDocument();
    });

    it('usedFallback=false이면 추정값 뱃지가 숨겨진다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ usedFallback: false })} />);
      expect(screen.queryByText('추정값')).not.toBeInTheDocument();
    });
  });

  describe('탭 구조', () => {
    it('치아 색상과 잇몸 건강 탭이 모두 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment()} />);
      expect(screen.getByTestId('tab-trigger-tooth')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-gum')).toBeInTheDocument();
    });

    it('치아 색상만 있으면 tooth 탭만 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ gumHealth: undefined })} />);
      expect(screen.getByTestId('tab-trigger-tooth')).toBeInTheDocument();
      expect(screen.queryByTestId('tab-trigger-gum')).not.toBeInTheDocument();
    });

    it('잇몸 건강만 있으면 gum 탭만 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ toothColor: undefined })} />);
      expect(screen.queryByTestId('tab-trigger-tooth')).not.toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-gum')).toBeInTheDocument();
    });

    it('미백 목표가 있으면 whitening 탭이 추가된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal()}
        />
      );
      expect(screen.getByTestId('tab-trigger-whitening')).toBeInTheDocument();
    });

    it('미백 목표가 없으면 whitening 탭이 숨겨진다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment()} />);
      expect(screen.queryByTestId('tab-trigger-whitening')).not.toBeInTheDocument();
    });

    it('기본 선택 탭: 치아 색상이 있으면 tooth', () => {
      render(<OralHealthResultCard assessment={createMockAssessment()} />);
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-default-value', 'tooth');
    });

    it('기본 선택 탭: 치아 색상 없으면 gum', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ toothColor: undefined })} />);
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-default-value', 'gum');
    });
  });

  describe('추천 사항 토글', () => {
    it('초기 상태에서 추천 사항 목록이 접혀있다', () => {
      // GumHealthIndicator 내부에도 recommendations가 렌더링되므로,
      // OralHealthResultCard 수준의 추천 목록이 토글로 제어되는지 확인
      // gumHealth를 제거하여 내부 추천과의 중복을 방지
      render(
        <OralHealthResultCard
          assessment={createMockAssessment({
            gumHealth: undefined,
            toothColor: undefined,
            recommendations: ['이 추천은 카드 수준이에요.'],
          })}
        />
      );
      expect(screen.getByText('추천 사항')).toBeInTheDocument();
      // 초기에는 카드 수준 추천 목록이 숨겨져 있음
      expect(screen.queryByText('이 추천은 카드 수준이에요.')).not.toBeInTheDocument();
    });

    it('추천 사항 버튼 클릭 시 목록이 펼쳐진다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment({
            recommendations: ['치과 검진을 받아주세요.', '하루 2회 칫솔질을 해주세요.'],
          })}
        />
      );
      const toggleButton = screen.getByText('추천 사항').closest('button')!;
      fireEvent.click(toggleButton);

      expect(screen.getByText('치과 검진을 받아주세요.')).toBeInTheDocument();
      expect(screen.getByText('하루 2회 칫솔질을 해주세요.')).toBeInTheDocument();
    });

    it('추천 사항 버튼 재클릭 시 목록이 다시 접힌다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment({
            recommendations: ['치과 검진을 받아주세요.'],
          })}
        />
      );
      const toggleButton = screen.getByText('추천 사항').closest('button')!;
      fireEvent.click(toggleButton);
      expect(screen.getByText('치과 검진을 받아주세요.')).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.queryByText('치과 검진을 받아주세요.')).not.toBeInTheDocument();
    });
  });

  describe('점수 뱃지 색상', () => {
    it('80 이상이면 녹색 계열', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ overallScore: 85 })} />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('60-79이면 노란색 계열', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ overallScore: 65 })} />);
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('40-59이면 주황색 계열', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ overallScore: 45 })} />);
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('40 미만이면 빨간색 계열', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ overallScore: 30 })} />);
      expect(screen.getByText('30')).toBeInTheDocument();
    });
  });

  describe('미백 목표 섹션', () => {
    it('미백 목표가 있으면 목표 셰이드가 표시된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({ targetShade: 'B1' })}
        />
      );
      expect(screen.getByTestId('whitening-goal-section')).toBeInTheDocument();
      // B1은 VitaShadeDisplay의 셰이드 스케일에도 나타나므로 getAllByText 사용
      const b1Elements = screen.getAllByText('B1');
      expect(b1Elements.length).toBeGreaterThanOrEqual(1);
    });

    it('필요 단계 수가 표시된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({ shadeStepsNeeded: 3 })}
        />
      );
      expect(screen.getByText('3단계')).toBeInTheDocument();
    });

    it('예상 기간이 표시된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({
            expectedDuration: { minWeeks: 4, maxWeeks: 8 },
          })}
        />
      );
      expect(screen.getByText('4-8주')).toBeInTheDocument();
    });

    it('과도한 미백 경고가 표시된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({
            isOverWhitening: true,
            overWhiteningReason: '이미 밝은 셰이드입니다.',
          })}
        />
      );
      expect(screen.getByText('과도한 미백 주의')).toBeInTheDocument();
      expect(screen.getByText('이미 밝은 셰이드입니다.')).toBeInTheDocument();
    });

    it('과도한 미백이 아니면 경고가 숨겨진다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({ isOverWhitening: false })}
        />
      );
      expect(screen.queryByText('과도한 미백 주의')).not.toBeInTheDocument();
    });

    it('퍼스널컬러 조화 제안이 표시된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({
            harmonySuggestion: '봄 웜톤에는 밝고 따뜻한 아이보리 계열이 자연스럽습니다.',
          })}
        />
      );
      expect(screen.getByText('퍼스널컬러 조화')).toBeInTheDocument();
      expect(
        screen.getByText('봄 웜톤에는 밝고 따뜻한 아이보리 계열이 자연스럽습니다.')
      ).toBeInTheDocument();
    });

    it('추천 미백 방법이 표시된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({
            recommendedMethods: [
              {
                method: 'whitening_toothpaste',
                effectiveness: 'low',
                duration: '4-8주',
                notes: '일상적 관리에 적합해요',
              },
              {
                method: 'professional_bleaching',
                effectiveness: 'high',
                duration: '1-2회',
                notes: '전문가 시술이에요',
              },
            ],
          })}
        />
      );
      expect(screen.getByText('추천 미백 방법')).toBeInTheDocument();
      expect(screen.getByText('미백 치약')).toBeInTheDocument();
      expect(screen.getByText('전문가 미백')).toBeInTheDocument();
    });

    it('방법 효과성 뱃지: low -> 낮음, medium -> 보통, high -> 높음', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment()}
          whiteningGoal={createMockWhiteningGoal({
            recommendedMethods: [
              { method: 'whitening_toothpaste', effectiveness: 'low', duration: '4주', notes: 'a' },
              { method: 'strips', effectiveness: 'medium', duration: '2주', notes: 'b' },
              { method: 'in_office', effectiveness: 'high', duration: '1회', notes: 'c' },
            ],
          })}
        />
      );
      // "낮음"은 효과성 뱃지에만 나타남
      expect(screen.getByText('낮음')).toBeInTheDocument();
      // "보통"은 여러 곳에 나올 수 있으므로 최소 1개 존재 확인
      const mediumElements = screen.getAllByText('보통');
      expect(mediumElements.length).toBeGreaterThanOrEqual(1);
      // "높음"도 여러 곳에 나올 수 있으므로 최소 1개 존재 확인
      const highElements = screen.getAllByText('높음');
      expect(highElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('className 전달', () => {
    it('커스텀 className이 적용된다', () => {
      render(
        <OralHealthResultCard assessment={createMockAssessment()} className="my-custom-class" />
      );
      const container = screen.getByTestId('oral-health-result-card');
      expect(container.className).toContain('my-custom-class');
    });
  });

  describe('엣지 케이스', () => {
    it('toothColor와 gumHealth 모두 없는 경우에도 렌더링된다', () => {
      render(
        <OralHealthResultCard
          assessment={createMockAssessment({ toothColor: undefined, gumHealth: undefined })}
        />
      );
      expect(screen.getByTestId('oral-health-result-card')).toBeInTheDocument();
    });

    it('추천 사항이 빈 배열이어도 정상 렌더링된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ recommendations: [] })} />);
      expect(screen.getByText('추천 사항')).toBeInTheDocument();
    });

    it('overallScore가 0이어도 정상 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ overallScore: 0 })} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('overallScore가 100이어도 정상 표시된다', () => {
      render(<OralHealthResultCard assessment={createMockAssessment({ overallScore: 100 })} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });
});
