/**
 * S-1 피부 분석 결과 컴포넌트 테스트
 * @description MetricBarGauge, MetricBarGaugeList, MetricDetailCard, ScientificTermTooltip, ZoneDetailCard
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SkinMetricId } from '@/types/skin-detailed';

// ============================================
// Mock 설정
// ============================================

// lucide-react 아이콘 mock
vi.mock('lucide-react', () => ({
  ChevronRight: (props: Record<string, unknown>) => (
    <div data-testid="icon-chevron-right" {...props} />
  ),
  ChevronDown: (props: Record<string, unknown>) => (
    <div data-testid="icon-chevron-down" {...props} />
  ),
  ChevronUp: (props: Record<string, unknown>) => <div data-testid="icon-chevron-up" {...props} />,
  TrendingUp: (props: Record<string, unknown>) => <div data-testid="icon-trending-up" {...props} />,
  Users: (props: Record<string, unknown>) => <div data-testid="icon-users" {...props} />,
  X: (props: Record<string, unknown>) => <div data-testid="icon-x" {...props} />,
  AlertCircle: (props: Record<string, unknown>) => (
    <div data-testid="icon-alert-circle" {...props} />
  ),
  CheckCircle: (props: Record<string, unknown>) => (
    <div data-testid="icon-check-circle" {...props} />
  ),
  XCircle: (props: Record<string, unknown>) => <div data-testid="icon-x-circle" {...props} />,
  Info: (props: Record<string, unknown>) => <div data-testid="icon-info" {...props} />,
  Beaker: (props: Record<string, unknown>) => <div data-testid="icon-beaker" {...props} />,
  Lightbulb: (props: Record<string, unknown>) => <div data-testid="icon-lightbulb" {...props} />,
  BookOpen: (props: Record<string, unknown>) => <div data-testid="icon-book-open" {...props} />,
}));

// shadcn/ui Card mock
vi.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
}));

// shadcn/ui Badge mock
vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <span className={className} {...props}>
      {children}
    </span>
  ),
}));

// shadcn/ui Button mock
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// shadcn/ui Tooltip mock
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="tooltip-content" {...props}>
      {children}
    </div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div>{children}</div>
  ),
}));

// shadcn/ui Collapsible mock
vi.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({
    children,
    open,
    ...props
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    [key: string]: unknown;
  }) => (
    <div data-open={open} {...props}>
      {children}
    </div>
  ),
  CollapsibleContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="collapsible-content" className={className}>
      {children}
    </div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="collapsible-trigger">{children}</div>
  ),
}));

// ProgressiveDisclosure mock
vi.mock('@/components/common/ProgressiveDisclosure', () => ({
  ProgressiveDisclosure: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
  }) => (
    <div data-testid="progressive-disclosure">
      <span>{title}</span>
      {children}
    </div>
  ),
}));

// ============================================
// 테스트 헬퍼
// ============================================

/** 8개 지표 전체 mock 데이터 생성 */
function createMockMetrics(
  overrides: Partial<Record<SkinMetricId, { score: number; status: string; name: string }>> = {}
): Record<SkinMetricId, { score: number; status: 'good' | 'normal' | 'warning'; name: string }> {
  return {
    hydration: { score: 75, status: 'good', name: '수분도' },
    oil: { score: 55, status: 'normal', name: '유분도' },
    pores: { score: 35, status: 'warning', name: '모공' },
    wrinkles: { score: 80, status: 'good', name: '주름' },
    pigmentation: { score: 60, status: 'normal', name: '색소침착' },
    elasticity: { score: 70, status: 'normal', name: '탄력' },
    trouble: { score: 45, status: 'normal', name: '트러블' },
    sensitivity: { score: 30, status: 'warning', name: '민감도' },
    ...overrides,
  } as Record<SkinMetricId, { score: number; status: 'good' | 'normal' | 'warning'; name: string }>;
}

// ============================================
// MetricBarGauge 테스트
// ============================================

describe('MetricBarGauge', () => {
  // 동적 import로 컴포넌트 로드 (mock 적용 후)
  let MetricBarGauge: typeof import('@/components/analysis/skin/MetricBarGauge').MetricBarGauge;

  beforeEach(async () => {
    const mod = await import('@/components/analysis/skin/MetricBarGauge');
    MetricBarGauge = mod.MetricBarGauge;
  });

  describe('기본 렌더링', () => {
    it('지표 라벨을 표시한다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} />);
      expect(screen.getByText('수분도')).toBeInTheDocument();
    });

    it('점수를 표시한다', () => {
      render(<MetricBarGauge metricId="oil" score={55} />);
      expect(screen.getByText('55')).toBeInTheDocument();
    });

    it('data-testid가 올바르게 설정된다', () => {
      render(<MetricBarGauge metricId="pores" score={40} />);
      expect(screen.getByTestId('metric-gauge-pores')).toBeInTheDocument();
    });

    it('button 요소로 렌더링된다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} />);
      const button = screen.getByTestId('metric-gauge-hydration');
      expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('바 게이지 너비가 score%로 설정된다', () => {
      render(<MetricBarGauge metricId="hydration" score={72} />);
      const button = screen.getByTestId('metric-gauge-hydration');
      // 바 게이지는 style={{ width: `${score}%` }}로 설정됨
      const bar = button.querySelector('[style*="width"]');
      expect(bar).not.toBeNull();
      expect(bar?.getAttribute('style')).toContain('72%');
    });
  });

  describe('점수별 색상 구분', () => {
    it('71점 이상이면 녹색 텍스트를 적용한다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} />);
      const scoreText = screen.getByText('75');
      expect(scoreText.className).toContain('text-green');
    });

    it('41-70점이면 노란색 텍스트를 적용한다', () => {
      render(<MetricBarGauge metricId="oil" score={55} />);
      const scoreText = screen.getByText('55');
      expect(scoreText.className).toContain('text-yellow');
    });

    it('40점 이하이면 빨간색 텍스트를 적용한다', () => {
      render(<MetricBarGauge metricId="pores" score={30} />);
      const scoreText = screen.getByText('30');
      expect(scoreText.className).toContain('text-red');
    });

    it('71점 이상이면 녹색 바를 적용한다', () => {
      render(<MetricBarGauge metricId="hydration" score={85} />);
      const button = screen.getByTestId('metric-gauge-hydration');
      const bar = button.querySelector('[style*="width"]');
      expect(bar?.className).toContain('bg-green');
    });

    it('41-70점이면 노란색 바를 적용한다', () => {
      render(<MetricBarGauge metricId="oil" score={50} />);
      const button = screen.getByTestId('metric-gauge-oil');
      const bar = button.querySelector('[style*="width"]');
      expect(bar?.className).toContain('bg-yellow');
    });

    it('40점 이하이면 빨간색 바를 적용한다', () => {
      render(<MetricBarGauge metricId="trouble" score={20} />);
      const button = screen.getByTestId('metric-gauge-trouble');
      const bar = button.querySelector('[style*="width"]');
      expect(bar?.className).toContain('bg-red');
    });
  });

  describe('클릭 이벤트', () => {
    it('클릭 시 onClick 핸들러를 호출한다', () => {
      const handleClick = vi.fn();
      render(<MetricBarGauge metricId="hydration" score={75} onClick={handleClick} />);
      fireEvent.click(screen.getByTestId('metric-gauge-hydration'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick이 없으면 클릭해도 에러가 발생하지 않는다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} />);
      expect(() => {
        fireEvent.click(screen.getByTestId('metric-gauge-hydration'));
      }).not.toThrow();
    });
  });

  describe('선택 상태', () => {
    it('isSelected=true이면 선택 스타일을 적용한다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} isSelected />);
      const button = screen.getByTestId('metric-gauge-hydration');
      expect(button.className).toContain('border-primary');
    });

    it('isSelected=false이면 선택 스타일이 없다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} isSelected={false} />);
      const button = screen.getByTestId('metric-gauge-hydration');
      // border-primary + bg-primary/5 조합 비포함
      expect(button.className).not.toContain('bg-primary/5');
    });
  });

  describe('동년배 비교', () => {
    it('기본 나이(25세)는 20대로 표시한다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} />);
      expect(screen.getByText('20대 중')).toBeInTheDocument();
    });

    it('userAge=33이면 30대로 표시한다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} userAge={33} />);
      expect(screen.getByText('30대 중')).toBeInTheDocument();
    });

    it('userAge=19이면 10대로 표시한다', () => {
      render(<MetricBarGauge metricId="hydration" score={75} userAge={19} />);
      expect(screen.getByText('10대 중')).toBeInTheDocument();
    });

    it('높은 점수는 "상위 X%"로 표시한다', () => {
      render(<MetricBarGauge metricId="hydration" score={90} />);
      // 90점이면 상위 퍼센트 표시
      const container = screen.getByTestId('metric-gauge-hydration');
      const text = container.textContent || '';
      expect(text).toContain('상위');
    });

    it('낮은 점수는 "하위 X%"로 표시한다', () => {
      render(<MetricBarGauge metricId="hydration" score={20} />);
      const container = screen.getByTestId('metric-gauge-hydration');
      const text = container.textContent || '';
      expect(text).toContain('하위');
    });
  });

  describe('엣지 케이스', () => {
    it('score=0이면 렌더링된다', () => {
      render(<MetricBarGauge metricId="hydration" score={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('score=100이면 렌더링된다', () => {
      render(<MetricBarGauge metricId="hydration" score={100} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('경계값 score=71이면 녹색이다', () => {
      render(<MetricBarGauge metricId="hydration" score={71} />);
      const scoreText = screen.getByText('71');
      expect(scoreText.className).toContain('text-green');
    });

    it('경계값 score=70이면 노란색이다', () => {
      render(<MetricBarGauge metricId="hydration" score={70} />);
      const scoreText = screen.getByText('70');
      expect(scoreText.className).toContain('text-yellow');
    });

    it('경계값 score=41이면 노란색이다', () => {
      render(<MetricBarGauge metricId="hydration" score={41} />);
      const scoreText = screen.getByText('41');
      expect(scoreText.className).toContain('text-yellow');
    });

    it('경계값 score=40이면 빨간색이다', () => {
      render(<MetricBarGauge metricId="hydration" score={40} />);
      const scoreText = screen.getByText('40');
      expect(scoreText.className).toContain('text-red');
    });
  });
});

// ============================================
// MetricBarGaugeList 테스트
// ============================================

describe('MetricBarGaugeList', () => {
  let MetricBarGaugeList: typeof import('@/components/analysis/skin/MetricBarGauge').MetricBarGaugeList;

  beforeEach(async () => {
    const mod = await import('@/components/analysis/skin/MetricBarGauge');
    MetricBarGaugeList = mod.MetricBarGaugeList;
  });

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정된다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} />);
      expect(screen.getByTestId('metric-bar-gauge-list')).toBeInTheDocument();
    });

    it('제목 "피부 지표 분석"을 표시한다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} />);
      expect(screen.getByText('피부 지표 분석')).toBeInTheDocument();
    });

    it('모든 지표를 렌더링한다', () => {
      const metrics = createMockMetrics();
      render(<MetricBarGaugeList metrics={metrics} />);

      const metricIds = Object.keys(metrics) as SkinMetricId[];
      for (const metricId of metricIds) {
        expect(screen.getByTestId(`metric-gauge-${metricId}`)).toBeInTheDocument();
      }
    });
  });

  describe('전체 순위 배지', () => {
    it('동년배 비교 배지를 표시한다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} />);
      const listContainer = screen.getByTestId('metric-bar-gauge-list');
      const text = listContainer.textContent || '';
      // 20대 중 상위/하위 X% 형식
      expect(text).toContain('20대 중');
      expect(text).toMatch(/상위|하위/);
    });

    it('userAge를 전달하면 해당 연령대로 표시한다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} userAge={35} />);
      const listContainer = screen.getByTestId('metric-bar-gauge-list');
      const text = listContainer.textContent || '';
      expect(text).toContain('30대 중');
    });
  });

  describe('범례', () => {
    it('좋음/보통/주의 범례를 표시한다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} />);
      expect(screen.getByText('좋음 (71+)')).toBeInTheDocument();
      expect(screen.getByText('보통 (41-70)')).toBeInTheDocument();
      expect(screen.getByText('주의 (0-40)')).toBeInTheDocument();
    });
  });

  describe('지표 클릭', () => {
    it('지표 클릭 시 onMetricClick을 해당 metricId와 함께 호출한다', () => {
      const handleClick = vi.fn();
      render(<MetricBarGaugeList metrics={createMockMetrics()} onMetricClick={handleClick} />);

      fireEvent.click(screen.getByTestId('metric-gauge-hydration'));
      expect(handleClick).toHaveBeenCalledWith('hydration');
    });

    it('onMetricClick이 없으면 클릭해도 에러가 발생하지 않는다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} />);
      expect(() => {
        fireEvent.click(screen.getByTestId('metric-gauge-oil'));
      }).not.toThrow();
    });
  });

  describe('선택 상태 전달', () => {
    it('selectedMetric과 일치하는 지표에 선택 스타일을 적용한다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} selectedMetric="hydration" />);
      const selected = screen.getByTestId('metric-gauge-hydration');
      expect(selected.className).toContain('border-primary');
    });

    it('selectedMetric과 다른 지표는 선택 스타일이 없다', () => {
      render(<MetricBarGaugeList metrics={createMockMetrics()} selectedMetric="hydration" />);
      const notSelected = screen.getByTestId('metric-gauge-oil');
      expect(notSelected.className).not.toContain('bg-primary/5');
    });
  });
});

// ============================================
// MetricDetailCard 테스트
// ============================================

describe('MetricDetailCard', () => {
  let MetricDetailCard: typeof import('@/components/analysis/skin/MetricDetailCard').MetricDetailCard;

  beforeEach(async () => {
    const mod = await import('@/components/analysis/skin/MetricDetailCard');
    MetricDetailCard = mod.MetricDetailCard;
  });

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정된다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByTestId('metric-detail-card')).toBeInTheDocument();
    });

    it('지표 라벨을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('수분도')).toBeInTheDocument();
    });

    it('점수와 상태 라벨을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      // "75점 . 좋음" 형태 - 점수 배지와 상태 텍스트 모두에 점수가 포함되므로 getAllByText
      const elements = screen.getAllByText(/75점/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('닫기 버튼', () => {
    it('닫기 버튼이 존재한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      const closeButton = screen.getByLabelText('닫기');
      expect(closeButton).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
      const handleClose = vi.fn();
      render(<MetricDetailCard metricId="hydration" score={75} onClose={handleClose} />);
      fireEvent.click(screen.getByLabelText('닫기'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('간단 설명', () => {
    it('간단 설명 텍스트를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      // getMetricExplanation에서 반환하는 simpleDescription
      expect(screen.getByText(/피부에 수분이 얼마나 있는지/)).toBeInTheDocument();
    });
  });

  describe('상세 분석 섹션', () => {
    it('"상세 분석" 섹션 제목을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('상세 분석')).toBeInTheDocument();
    });

    it('측정 기준을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('측정 기준')).toBeInTheDocument();
      // "각질층" 텍스트는 측정 기준과 과학적 배경 등 여러 곳에 등장
      const elements = screen.getAllByText(/각질층/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('정상 범위를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('정상 범위')).toBeInTheDocument();
    });

    it('현재 상태를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('현재 상태')).toBeInTheDocument();
    });

    it('가능한 원인 목록을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('가능한 원인')).toBeInTheDocument();
      // 최대 4개 표시 (slice(0, 4))
      expect(screen.getByText(/세안 후 보습제 미사용/)).toBeInTheDocument();
    });
  });

  describe('과학적 배경 섹션', () => {
    it('"과학적 배경" Collapsible 트리거를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('과학적 배경')).toBeInTheDocument();
    });

    it('과학적 설명 텍스트를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      // CollapsibleContent mock은 항상 렌더링
      expect(screen.getByText(/각질층은 약 30%의 수분을/)).toBeInTheDocument();
    });

    it('전문 용어 툴팁을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      // hydration 지표에는 TEWL, NMF, 각질층 용어가 있음
      expect(screen.getByText(/TEWL/)).toBeInTheDocument();
    });

    it('참조 논문을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText(/J Dermatol Sci/)).toBeInTheDocument();
    });
  });

  describe('추천 솔루션 섹션', () => {
    it('"추천 솔루션" 섹션 제목을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('추천 솔루션')).toBeInTheDocument();
    });

    it('추천 성분을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('추천 성분')).toBeInTheDocument();
      expect(screen.getByText('히알루론산')).toBeInTheDocument();
    });

    it('추천 성분의 효능을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText(/1000배 수분을 흡수/)).toBeInTheDocument();
    });

    it('추천 제품 카테고리를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('추천 제품')).toBeInTheDocument();
      expect(screen.getByText('하이드레이팅 토너')).toBeInTheDocument();
    });

    it('라이프스타일 팁을 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('라이프스타일 팁')).toBeInTheDocument();
      expect(screen.getByText(/하루 2L 이상/)).toBeInTheDocument();
    });
  });

  describe('다양한 지표', () => {
    it('oil 지표를 올바르게 렌더링한다', () => {
      render(<MetricDetailCard metricId="oil" score={50} onClose={vi.fn()} />);
      expect(screen.getByText('유분도')).toBeInTheDocument();
      expect(screen.getByText(/피지\(기름기\) 분비량/)).toBeInTheDocument();
    });

    it('pores 지표를 올바르게 렌더링한다', () => {
      render(<MetricDetailCard metricId="pores" score={35} onClose={vi.fn()} />);
      expect(screen.getByText('모공')).toBeInTheDocument();
    });
  });

  describe('점수별 상태 표시', () => {
    it('71점 이상이면 "좋음" 상태를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={75} onClose={vi.fn()} />);
      expect(screen.getByText(/좋음/)).toBeInTheDocument();
    });

    it('41-70점이면 "보통" 상태를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={55} onClose={vi.fn()} />);
      expect(screen.getByText(/보통/)).toBeInTheDocument();
    });

    it('40점 이하이면 "주의" 상태를 표시한다', () => {
      render(<MetricDetailCard metricId="hydration" score={30} onClose={vi.fn()} />);
      expect(screen.getByText(/주의/)).toBeInTheDocument();
    });
  });
});

// ============================================
// ScientificTermTooltip 테스트
// ============================================

describe('ScientificTermTooltip', () => {
  let ScientificTermTooltip: typeof import('@/components/analysis/skin/ScientificTermTooltip').ScientificTermTooltip;

  beforeEach(async () => {
    const mod = await import('@/components/analysis/skin/ScientificTermTooltip');
    ScientificTermTooltip = mod.ScientificTermTooltip;
  });

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정된다', () => {
      render(<ScientificTermTooltip term="TEWL" definition="경피수분손실량" />);
      expect(screen.getByTestId('scientific-term-tooltip')).toBeInTheDocument();
    });

    it('전문 용어 텍스트를 표시한다', () => {
      render(<ScientificTermTooltip term="TEWL" definition="경피수분손실량" />);
      expect(screen.getByText('TEWL')).toBeInTheDocument();
    });

    it('tooltip content에 정의를 표시한다', () => {
      render(<ScientificTermTooltip term="TEWL" definition="경피수분손실량" />);
      // tooltip mock이 항상 렌더링하므로 content 확인
      expect(screen.getByText('경피수분손실량')).toBeInTheDocument();
    });
  });

  describe('스타일링', () => {
    it('chip/badge 스타일이 적용된다', () => {
      render(<ScientificTermTooltip term="NMF" definition="천연보습인자" />);
      const chip = screen.getByTestId('scientific-term-tooltip');
      expect(chip.className).toContain('rounded-full');
      expect(chip.className).toContain('cursor-help');
    });

    it('커스텀 className이 적용된다', () => {
      render(
        <ScientificTermTooltip term="NMF" definition="천연보습인자" className="custom-class" />
      );
      const chip = screen.getByTestId('scientific-term-tooltip');
      expect(chip.className).toContain('custom-class');
    });
  });

  describe('다양한 용어', () => {
    it('긴 용어를 올바르게 표시한다', () => {
      render(
        <ScientificTermTooltip
          term="MMP (기질금속단백분해효소)"
          definition="콜라겐을 분해하는 효소"
        />
      );
      expect(screen.getByText('MMP (기질금속단백분해효소)')).toBeInTheDocument();
    });

    it('긴 정의를 tooltip에 표시한다', () => {
      const longDef =
        'Trans-Epidermal Water Loss의 약자로, 피부를 통해 대기 중으로 증발하는 수분량을 말해요.';
      render(<ScientificTermTooltip term="TEWL" definition={longDef} />);
      expect(screen.getByText(longDef)).toBeInTheDocument();
    });
  });
});

// ============================================
// ZoneDetailCard 테스트
// ============================================

describe('ZoneDetailCard', () => {
  let ZoneDetailCard: typeof import('@/components/analysis/skin/ZoneDetailCard').ZoneDetailCard;

  beforeEach(async () => {
    const mod = await import('@/components/analysis/skin/ZoneDetailCard');
    ZoneDetailCard = mod.ZoneDetailCard;
  });

  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 설정된다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByTestId('zone-detail-card')).toBeInTheDocument();
    });

    it('존 이름을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('이마 중앙')).toBeInTheDocument();
    });

    it('점수를 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('75점')).toBeInTheDocument();
    });
  });

  describe('점수별 라벨 및 색상', () => {
    it('71점 이상이면 "좋음"을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={80} onClose={vi.fn()} />);
      expect(screen.getByText('좋음')).toBeInTheDocument();
    });

    it('41-70점이면 "보통"을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={55} onClose={vi.fn()} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('40점 이하이면 "주의"를 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={30} onClose={vi.fn()} />);
      expect(screen.getByText('주의')).toBeInTheDocument();
    });

    it('71점 이상이면 녹색 스타일을 적용한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={80} onClose={vi.fn()} />);
      const label = screen.getByText('좋음');
      expect(label.className).toContain('text-green');
    });

    it('41-70점이면 노란색 스타일을 적용한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={55} onClose={vi.fn()} />);
      const label = screen.getByText('보통');
      expect(label.className).toContain('text-yellow');
    });

    it('40점 이하이면 빨간색 스타일을 적용한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={20} onClose={vi.fn()} />);
      const label = screen.getByText('주의');
      expect(label.className).toContain('text-red');
    });
  });

  describe('닫기 버튼', () => {
    it('닫기 버튼이 존재한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByLabelText('닫기')).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
      const handleClose = vi.fn();
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={handleClose} />);
      fireEvent.click(screen.getByLabelText('닫기'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('존 특성 섹션', () => {
    it('"이 부위의 특성" 라벨을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('이 부위의 특성')).toBeInTheDocument();
    });

    it('존 특성 설명 텍스트를 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText(/T존 상단에 위치하며/)).toBeInTheDocument();
    });
  });

  describe('주요 문제점 섹션', () => {
    it('"주요 문제점" 라벨을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('주요 문제점')).toBeInTheDocument();
    });

    it('문제점 목록을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText(/피지 과다 분비/)).toBeInTheDocument();
      expect(screen.getByText(/표정 주름/)).toBeInTheDocument();
    });
  });

  describe('측정 상세 정보 (ProgressiveDisclosure)', () => {
    it('ProgressiveDisclosure 컴포넌트를 렌더링한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByTestId('progressive-disclosure')).toBeInTheDocument();
    });

    it('"측정 상세 정보" 제목을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('측정 상세 정보')).toBeInTheDocument();
    });

    it('측정 지표를 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('피지 분비량')).toBeInTheDocument();
      expect(screen.getByText('수분도')).toBeInTheDocument();
      expect(screen.getByText('모공 크기')).toBeInTheDocument();
    });

    it('정상 범위를 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('150-200 ug/cm2')).toBeInTheDocument();
    });
  });

  describe('추천 관리법 섹션', () => {
    it('"추천 관리법" 라벨을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('추천 관리법')).toBeInTheDocument();
    });

    it('관리법 목록을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText(/BHA.*토너로 모공 속 피지 제거/)).toBeInTheDocument();
    });
  });

  describe('피해야 할 것 섹션', () => {
    it('"피해야 할 것" 라벨을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText('피해야 할 것')).toBeInTheDocument();
    });

    it('피해야 할 것 목록을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={75} onClose={vi.fn()} />);
      expect(screen.getByText(/무거운 오일 베이스 제품/)).toBeInTheDocument();
    });
  });

  describe('다양한 존', () => {
    it('eye_left 존을 올바르게 렌더링한다', () => {
      render(<ZoneDetailCard zoneId="eye_left" score={60} onClose={vi.fn()} />);
      expect(screen.getByText('왼쪽 눈가')).toBeInTheDocument();
      expect(screen.getByText(/가장 얇은 부위/)).toBeInTheDocument();
    });

    it('nose_tip 존을 올바르게 렌더링한다', () => {
      render(<ZoneDetailCard zoneId="nose_tip" score={40} onClose={vi.fn()} />);
      expect(screen.getByText('코끝')).toBeInTheDocument();
      expect(screen.getByText(/피지선이 가장 밀집된/)).toBeInTheDocument();
    });

    it('chin_center 존을 올바르게 렌더링한다', () => {
      render(<ZoneDetailCard zoneId="chin_center" score={50} onClose={vi.fn()} />);
      expect(screen.getByText('턱 중앙')).toBeInTheDocument();
    });

    it('cheek_right 존을 올바르게 렌더링한다', () => {
      render(<ZoneDetailCard zoneId="cheek_right" score={65} onClose={vi.fn()} />);
      expect(screen.getByText('오른쪽 볼')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('경계값 score=71이면 "좋음"을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={71} onClose={vi.fn()} />);
      expect(screen.getByText('좋음')).toBeInTheDocument();
    });

    it('경계값 score=70이면 "보통"을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={70} onClose={vi.fn()} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('경계값 score=41이면 "보통"을 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={41} onClose={vi.fn()} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('경계값 score=40이면 "주의"를 표시한다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={40} onClose={vi.fn()} />);
      expect(screen.getByText('주의')).toBeInTheDocument();
    });

    it('score=0이면 렌더링된다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={0} onClose={vi.fn()} />);
      expect(screen.getByText('0점')).toBeInTheDocument();
      expect(screen.getByText('주의')).toBeInTheDocument();
    });

    it('score=100이면 렌더링된다', () => {
      render(<ZoneDetailCard zoneId="forehead_center" score={100} onClose={vi.fn()} />);
      expect(screen.getByText('100점')).toBeInTheDocument();
      expect(screen.getByText('좋음')).toBeInTheDocument();
    });
  });
});
