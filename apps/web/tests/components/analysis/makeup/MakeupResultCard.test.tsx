/**
 * M-1 메이크업 분석 결과 카드 - 실제 컴포넌트 테스트
 *
 * @description MakeupResultCard의 렌더링, 탭 전환, 퍼스널컬러 연동, 엣지케이스 테스트
 * @see components/analysis/makeup/MakeupResultCard.tsx
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { MakeupAnalysisResult } from '@/lib/mock/makeup-analysis';

// ============================================================================
// Mock 설정 (shadcn/ui 컴포넌트)
// ============================================================================

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
  CardContent: ({
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
  CardHeader: ({
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
  CardTitle: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <h3 className={className} {...props}>
      {children}
    </h3>
  ),
}));

// shadcn/ui Badge mock
vi.mock('@/components/ui/badge', () => ({
  Badge: ({
    children,
    className,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
}));

// shadcn/ui Tabs mock - 탭 전환 동작 지원
vi.mock('@/components/ui/tabs', () => {
  const TabsContext = React.createContext({ activeTab: '', setActiveTab: (_v: string) => {} });

  return {
    Tabs: ({
      children,
      defaultValue,
      ...props
    }: {
      children: React.ReactNode;
      defaultValue?: string;
      [key: string]: unknown;
    }) => {
      const [activeTab, setActiveTab] = React.useState(defaultValue || '');
      return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
          <div data-testid="tabs" {...props}>
            {children}
          </div>
        </TabsContext.Provider>
      );
    },
    TabsList: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => (
      <div className={className} role="tablist" {...props}>
        {children}
      </div>
    ),
    TabsTrigger: ({
      children,
      value,
      ...props
    }: {
      children: React.ReactNode;
      value: string;
      [key: string]: unknown;
    }) => {
      const { setActiveTab } = React.useContext(TabsContext);
      return (
        <button role="tab" data-value={value} onClick={() => setActiveTab(value)} {...props}>
          {children}
        </button>
      );
    },
    TabsContent: ({
      children,
      value,
      className,
      ...props
    }: {
      children: React.ReactNode;
      value: string;
      className?: string;
      [key: string]: unknown;
    }) => {
      const { activeTab } = React.useContext(TabsContext);
      if (activeTab !== value) return null;
      return (
        <div className={className} data-value={value} {...props}>
          {children}
        </div>
      );
    },
  };
});

// shadcn/ui Tooltip mock
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: unknown;
  }) => (asChild ? <>{children}</> : <div {...props}>{children}</div>),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

// ============================================================================
// 실제 컴포넌트 import (mock 이후)
// ============================================================================

import { MakeupResultCard } from '@/components/analysis/makeup/MakeupResultCard';

// ============================================================================
// 테스트 데이터 팩토리
// ============================================================================

function createMockResult(overrides: Partial<MakeupAnalysisResult> = {}): MakeupAnalysisResult {
  return {
    undertone: 'warm',
    undertoneLabel: '웜톤',
    eyeShape: 'almond',
    eyeShapeLabel: '아몬드형',
    lipShape: 'full',
    lipShapeLabel: '도톰한 입술',
    faceShape: 'oval',
    faceShapeLabel: '계란형',
    overallScore: 78,
    metrics: [
      {
        id: 'skin-tone',
        label: '피부톤 균일도',
        value: 75,
        status: 'good',
        description: '균일한 편',
      },
      { id: 'hydration', label: '수분도', value: 60, status: 'normal', description: '보통 수준' },
      { id: 'pore', label: '모공 상태', value: 35, status: 'warning', description: '관리 필요' },
    ],
    concerns: ['dark-circles', 'oily-tzone'],
    insight: '웜톤 피부에 아몬드형 눈이 잘 어울려요. 코랄 계열 메이크업을 추천해요.',
    recommendedStyles: ['natural', 'glam', 'vintage'],
    colorRecommendations: [
      {
        category: 'lip',
        categoryLabel: '립 컬러',
        colors: [
          { name: '코랄 핑크', hex: '#FF7F7F', description: '따뜻한 코랄 톤' },
          { name: '피치 베이지', hex: '#FFDAB9', description: '자연스러운 피치' },
        ],
      },
      {
        category: 'eyeshadow',
        categoryLabel: '아이섀도',
        colors: [{ name: '샴페인 골드', hex: '#F7E7CE', description: '은은한 골드' }],
      },
    ],
    makeupTips: [
      {
        category: '베이스 메이크업',
        tips: ['웜톤 파운데이션을 선택하세요', '프라이머로 모공을 커버하세요'],
      },
      {
        category: '포인트 메이크업',
        tips: ['아몬드 눈매를 살리는 아이라인을 추천해요'],
      },
    ],
    personalColorConnection: {
      season: '봄 웜톤',
      compatibility: 'high',
      note: '퍼스널컬러와 메이크업 언더톤이 잘 어울려요',
    },
    analyzedAt: new Date('2026-02-12'),
    analysisReliability: 'high',
    ...overrides,
  };
}

// 탭 전환 헬퍼 함수
function clickTab(name: string): void {
  const tab = screen.getByRole('tab', { name });
  fireEvent.click(tab);
}

// ============================================================================
// 테스트
// ============================================================================

describe('MakeupResultCard', () => {
  describe('렌더링', () => {
    it('결과 카드가 렌더링된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('makeup-result-card')).toBeInTheDocument();
    });

    it('언더톤 라벨이 표시된다', () => {
      const result = createMockResult({ undertone: 'warm', undertoneLabel: '웜톤' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('웜톤')).toBeInTheDocument();
    });

    it('쿨톤 언더톤이 표시된다', () => {
      const result = createMockResult({ undertone: 'cool', undertoneLabel: '쿨톤' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('쿨톤')).toBeInTheDocument();
    });

    it('뉴트럴 언더톤이 표시된다', () => {
      const result = createMockResult({ undertone: 'neutral', undertoneLabel: '뉴트럴' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('뉴트럴')).toBeInTheDocument();
    });

    it('종합 점수가 표시된다', () => {
      const result = createMockResult({ overallScore: 85 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('인사이트 문구가 표시된다', () => {
      const result = createMockResult({
        insight: '웜톤 피부에 아몬드형 눈이 잘 어울려요.',
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('웜톤 피부에 아몬드형 눈이 잘 어울려요.')).toBeInTheDocument();
    });

    it('메이크업 분석 결과 텍스트가 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('메이크업 분석 결과')).toBeInTheDocument();
    });
  });

  describe('특징 뱃지', () => {
    it('눈 형태 라벨이 표시된다', () => {
      const result = createMockResult({ eyeShapeLabel: '아몬드형' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByLabelText(/눈 모양: 아몬드형/)).toBeInTheDocument();
    });

    it('입술 형태 라벨이 표시된다', () => {
      const result = createMockResult({ lipShapeLabel: '도톰한 입술' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/도톰한 입술/)).toBeInTheDocument();
    });

    it('얼굴형 라벨이 표시된다', () => {
      const result = createMockResult({ faceShapeLabel: '계란형' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/계란형/)).toBeInTheDocument();
    });

    it('특징 뱃지 영역에 aria-label이 존재한다', () => {
      const result = createMockResult({
        eyeShapeLabel: '아몬드형',
        lipShapeLabel: '도톰한 입술',
        faceShapeLabel: '계란형',
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByLabelText(/눈 모양: 아몬드형/)).toBeInTheDocument();
      expect(screen.getByLabelText(/입술 모양: 도톰한 입술/)).toBeInTheDocument();
      expect(screen.getByLabelText(/얼굴형: 계란형/)).toBeInTheDocument();
    });
  });

  describe('점수 등급', () => {
    it('매우 좋음 (80-100)', () => {
      const result = createMockResult({ overallScore: 85 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('매우 좋음')).toBeInTheDocument();
    });

    it('좋음 (60-79)', () => {
      const result = createMockResult({ overallScore: 65 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('좋음')).toBeInTheDocument();
    });

    it('보통 (40-59)', () => {
      const result = createMockResult({ overallScore: 50 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('관리 필요 (0-39)', () => {
      const result = createMockResult({ overallScore: 30 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });

    it('경계값: 80점은 매우 좋음', () => {
      const result = createMockResult({ overallScore: 80 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('매우 좋음')).toBeInTheDocument();
    });

    it('경계값: 60점은 좋음', () => {
      const result = createMockResult({ overallScore: 60 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('좋음')).toBeInTheDocument();
    });

    it('경계값: 40점은 보통', () => {
      const result = createMockResult({ overallScore: 40 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('경계값: 0점은 관리 필요', () => {
      const result = createMockResult({ overallScore: 0 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });

    it('경계값: 100점은 매우 좋음', () => {
      const result = createMockResult({ overallScore: 100 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('매우 좋음')).toBeInTheDocument();
    });
  });

  describe('탭 전환', () => {
    it('기본 탭은 추천 컬러이다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      // 기본 탭(colors)이 활성화되어 있으므로 컬러 카테고리가 보인다
      expect(screen.getByText('립 컬러')).toBeInTheDocument();
    });

    it('4개 탭 트리거가 모두 존재한다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByRole('tab', { name: '추천 컬러' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '추천 스타일' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '메이크업 팁' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: '피부 지표' })).toBeInTheDocument();
    });

    it('추천 스타일 탭으로 전환하면 스타일 내용이 표시된다', () => {
      const result = createMockResult({ recommendedStyles: ['natural', 'glam'] });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      expect(screen.getByText('내추럴')).toBeInTheDocument();
      expect(screen.getByText('글램')).toBeInTheDocument();
    });

    it('메이크업 팁 탭으로 전환하면 팁 내용이 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('메이크업 팁');
      expect(screen.getByText('베이스 메이크업')).toBeInTheDocument();
      expect(screen.getByText('웜톤 파운데이션을 선택하세요')).toBeInTheDocument();
    });

    it('피부 지표 탭으로 전환하면 지표가 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      expect(screen.getByText('피부톤 균일도')).toBeInTheDocument();
      expect(screen.getByText('수분도')).toBeInTheDocument();
      expect(screen.getByText('모공 상태')).toBeInTheDocument();
    });
  });

  describe('추천 컬러 (기본 탭)', () => {
    it('카테고리별 컬러가 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('립 컬러')).toBeInTheDocument();
      expect(screen.getByText('아이섀도')).toBeInTheDocument();
    });

    it('개별 컬러 이름이 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('코랄 핑크')).toBeInTheDocument();
      expect(screen.getByText('피치 베이지')).toBeInTheDocument();
      expect(screen.getByText('샴페인 골드')).toBeInTheDocument();
    });

    it('컬러 HEX 코드가 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('#FF7F7F')).toBeInTheDocument();
      expect(screen.getByText('#FFDAB9')).toBeInTheDocument();
    });

    it('빈 컬러 추천 시 카테고리 영역이 없다', () => {
      const result = createMockResult({ colorRecommendations: [] });
      render(<MakeupResultCard result={result} />);
      // 카테고리 라벨이 없어야 한다
      expect(screen.queryByText('립 컬러')).not.toBeInTheDocument();
    });

    it('5개 카테고리 모두 렌더링된다', () => {
      const result = createMockResult({
        colorRecommendations: [
          {
            category: 'foundation',
            categoryLabel: '파운데이션',
            colors: [{ name: '골든 베이지', hex: '#E8C39E', description: '황금빛' }],
          },
          {
            category: 'lip',
            categoryLabel: '립',
            colors: [{ name: '코랄', hex: '#FF6B4A', description: '화사한' }],
          },
          {
            category: 'eyeshadow',
            categoryLabel: '아이섀도',
            colors: [{ name: '골드', hex: '#C9A86A', description: '화려한' }],
          },
          {
            category: 'blush',
            categoryLabel: '블러셔',
            colors: [{ name: '피치', hex: '#FFAB91', description: '복숭아빛' }],
          },
          {
            category: 'contour',
            categoryLabel: '컨투어',
            colors: [{ name: '브라운', hex: '#8B6914', description: '따뜻한' }],
          },
        ],
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('파운데이션')).toBeInTheDocument();
      expect(screen.getByText('립')).toBeInTheDocument();
      expect(screen.getByText('아이섀도')).toBeInTheDocument();
      expect(screen.getByText('블러셔')).toBeInTheDocument();
      expect(screen.getByText('컨투어')).toBeInTheDocument();
    });

    it('카테고리에 여러 색상이 있을 때 모두 표시된다', () => {
      const result = createMockResult({
        colorRecommendations: [
          {
            category: 'lip',
            categoryLabel: '립',
            colors: [
              { name: '레드A', hex: '#FF0000', description: '빨강' },
              { name: '레드B', hex: '#EE0000', description: '진빨강' },
              { name: '레드C', hex: '#DD0000', description: '어두운 빨강' },
            ],
          },
        ],
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('레드A')).toBeInTheDocument();
      expect(screen.getByText('레드B')).toBeInTheDocument();
      expect(screen.getByText('레드C')).toBeInTheDocument();
    });

    it('컬러에 aria-label이 존재한다', () => {
      const result = createMockResult({
        colorRecommendations: [
          {
            category: 'lip',
            categoryLabel: '립',
            colors: [{ name: '코랄 핑크', hex: '#FF7F7F', description: '따뜻한 코랄' }],
          },
        ],
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByLabelText('코랄 핑크 (#FF7F7F)')).toBeInTheDocument();
    });
  });

  describe('추천 스타일 (탭 전환 후)', () => {
    it('스타일 이름이 한글로 표시된다', () => {
      const result = createMockResult({ recommendedStyles: ['natural', 'glam', 'vintage'] });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      expect(screen.getByText('내추럴')).toBeInTheDocument();
      expect(screen.getByText('글램')).toBeInTheDocument();
      expect(screen.getByText('빈티지')).toBeInTheDocument();
    });

    it('알 수 없는 스타일 ID는 원본 ID가 표시된다', () => {
      const result = createMockResult({
        recommendedStyles: ['unknown-style' as 'natural'],
      });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      expect(screen.getByText('unknown-style')).toBeInTheDocument();
    });

    it('빈 스타일 배열이면 스타일 항목이 없다', () => {
      const result = createMockResult({ recommendedStyles: [] });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      // 정의된 스타일 이름이 하나도 없어야 한다
      expect(screen.queryByText('내추럴')).not.toBeInTheDocument();
      expect(screen.queryByText('글램')).not.toBeInTheDocument();
    });

    it('모든 스타일이 올바르게 표시된다', () => {
      const allStyles = [
        { id: 'natural', name: '내추럴' },
        { id: 'glam', name: '글램' },
        { id: 'cute', name: '큐트' },
        { id: 'chic', name: '시크' },
        { id: 'vintage', name: '빈티지' },
        { id: 'edgy', name: '엣지' },
      ] as const;

      allStyles.forEach(({ id, name }) => {
        const result = createMockResult({ recommendedStyles: [id] });
        const { unmount } = render(<MakeupResultCard result={result} />);
        clickTab('추천 스타일');
        expect(screen.getByText(name)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('피부 고민 (추천 스타일 탭 내)', () => {
    it('고민 목록이 표시된다', () => {
      const result = createMockResult({ concerns: ['dark-circles', 'redness'] });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      expect(screen.getByText(/다크서클/)).toBeInTheDocument();
      expect(screen.getByText(/홍조/)).toBeInTheDocument();
    });

    it('집중 케어 영역 제목이 표시된다', () => {
      const result = createMockResult({ concerns: ['dark-circles'] });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      expect(screen.getByText('집중 케어 영역')).toBeInTheDocument();
    });

    it('고민이 없을 때 집중 케어 영역이 숨겨진다', () => {
      const result = createMockResult({ concerns: [] });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      expect(screen.queryByText('집중 케어 영역')).not.toBeInTheDocument();
    });

    it('알 수 없는 고민 ID는 원본 ID가 표시된다', () => {
      const result = createMockResult({ concerns: ['unknown-concern' as 'redness'] });
      render(<MakeupResultCard result={result} />);
      clickTab('추천 스타일');
      expect(screen.getByText(/unknown-concern/)).toBeInTheDocument();
    });

    it('모든 피부 고민이 올바르게 표시된다', () => {
      const allConcerns = [
        { id: 'dark-circles', name: '다크서클' },
        { id: 'redness', name: '홍조' },
        { id: 'uneven-tone', name: '피부톤 불균일' },
        { id: 'large-pores', name: '넓은 모공' },
        { id: 'oily-tzone', name: 'T존 번들거림' },
        { id: 'dry-patches', name: '건조 부위' },
        { id: 'acne-scars', name: '트러블 흔적' },
        { id: 'fine-lines', name: '잔주름' },
      ] as const;

      allConcerns.forEach(({ id, name }) => {
        const result = createMockResult({ concerns: [id] });
        const { unmount } = render(<MakeupResultCard result={result} />);
        clickTab('추천 스타일');
        expect(screen.getByText(new RegExp(name))).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('메이크업 팁 (탭 전환 후)', () => {
    it('카테고리별 팁이 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('메이크업 팁');
      expect(screen.getByText('베이스 메이크업')).toBeInTheDocument();
      expect(screen.getByText('포인트 메이크업')).toBeInTheDocument();
    });

    it('개별 팁 내용이 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('메이크업 팁');
      expect(screen.getByText('웜톤 파운데이션을 선택하세요')).toBeInTheDocument();
      expect(screen.getByText('프라이머로 모공을 커버하세요')).toBeInTheDocument();
    });

    it('빈 팁 배열이면 팁 항목이 없다', () => {
      const result = createMockResult({ makeupTips: [] });
      render(<MakeupResultCard result={result} />);
      clickTab('메이크업 팁');
      expect(screen.queryByText('베이스 메이크업')).not.toBeInTheDocument();
    });

    it('여러 카테고리와 여러 팁이 렌더링된다', () => {
      const result = createMockResult({
        makeupTips: [
          { category: '베이스', tips: ['팁1', '팁2', '팁3'] },
          { category: '아이', tips: ['팁A', '팁B'] },
          { category: '립', tips: ['팁X'] },
        ],
      });
      render(<MakeupResultCard result={result} />);
      clickTab('메이크업 팁');
      expect(screen.getByText('베이스')).toBeInTheDocument();
      expect(screen.getByText('아이')).toBeInTheDocument();
      expect(screen.getByText('립')).toBeInTheDocument();
      expect(screen.getByText('팁1')).toBeInTheDocument();
      expect(screen.getByText('팁3')).toBeInTheDocument();
      expect(screen.getByText('팁X')).toBeInTheDocument();
    });
  });

  describe('피부 지표 (탭 전환 후)', () => {
    it('지표 라벨이 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      expect(screen.getByText('피부톤 균일도')).toBeInTheDocument();
      expect(screen.getByText('수분도')).toBeInTheDocument();
      expect(screen.getByText('모공 상태')).toBeInTheDocument();
    });

    it('지표 점수가 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      expect(screen.getByText('75점')).toBeInTheDocument();
      expect(screen.getByText('60점')).toBeInTheDocument();
      expect(screen.getByText('35점')).toBeInTheDocument();
    });

    it('상태 라벨이 표시된다: 양호/보통/주의', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      expect(screen.getByText('양호')).toBeInTheDocument();
      const normalStatuses = screen.getAllByText('보통');
      expect(normalStatuses.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('주의')).toBeInTheDocument();
    });

    it('지표 설명이 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      expect(screen.getByText('균일한 편')).toBeInTheDocument();
      expect(screen.getByText('보통 수준')).toBeInTheDocument();
      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });

    it('빈 지표 배열이면 지표 항목이 없다', () => {
      const result = createMockResult({ metrics: [] });
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      expect(screen.queryByText('피부톤 균일도')).not.toBeInTheDocument();
    });

    it('모두 good 상태인 경우 양호가 여러개 표시된다', () => {
      const result = createMockResult({
        metrics: [
          { id: 'a', label: '지표A', value: 85, status: 'good', description: '좋은 상태' },
          { id: 'b', label: '지표B', value: 90, status: 'good', description: '매우 좋음' },
        ],
      });
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      const allGood = screen.getAllByText('양호');
      expect(allGood).toHaveLength(2);
    });

    it('모두 warning 상태인 경우 주의가 여러개 표시된다', () => {
      const result = createMockResult({
        metrics: [
          { id: 'a', label: '지표A', value: 20, status: 'warning', description: '주의 필요' },
          { id: 'b', label: '지표B', value: 15, status: 'warning', description: '관리 필요' },
        ],
      });
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      const allWarning = screen.getAllByText('주의');
      expect(allWarning).toHaveLength(2);
    });

    it('단일 지표가 올바르게 렌더링된다', () => {
      const result = createMockResult({
        metrics: [
          { id: 'only', label: '유일한 지표', value: 55, status: 'normal', description: '보통' },
        ],
      });
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      expect(screen.getByText('유일한 지표')).toBeInTheDocument();
      expect(screen.getByText('55점')).toBeInTheDocument();
    });

    it('지표의 progressbar role과 aria 속성이 존재한다', () => {
      const result = createMockResult({
        metrics: [
          {
            id: 'test-metric',
            label: '테스트 지표',
            value: 70,
            status: 'good',
            description: '양호',
          },
        ],
      });
      render(<MakeupResultCard result={result} />);
      clickTab('피부 지표');
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '70');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('퍼스널컬러 연동', () => {
    it('showDetails=true일 때 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} showDetails={true} />);
      expect(screen.getByText('퍼스널컬러 연동')).toBeInTheDocument();
      expect(screen.getByText('봄 웜톤')).toBeInTheDocument();
    });

    it('showDetails=false일 때 숨겨진다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} showDetails={false} />);
      expect(screen.queryByText('퍼스널컬러 연동')).not.toBeInTheDocument();
    });

    it('showDetails 기본값(true)일 때 표시된다', () => {
      const result = createMockResult();
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('퍼스널컬러 연동')).toBeInTheDocument();
    });

    it('personalColorConnection이 없으면 숨겨진다', () => {
      const result = createMockResult({ personalColorConnection: undefined });
      render(<MakeupResultCard result={result} />);
      expect(screen.queryByText('퍼스널컬러 연동')).not.toBeInTheDocument();
    });

    it('호환성: 높음', () => {
      const result = createMockResult({
        personalColorConnection: { season: '봄 웜톤', compatibility: 'high', note: '잘 어울려요' },
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/호환성:.*높음/)).toBeInTheDocument();
    });

    it('호환성: 보통', () => {
      const result = createMockResult({
        personalColorConnection: {
          season: '여름 쿨톤',
          compatibility: 'medium',
          note: '괜찮아요',
        },
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/호환성:.*보통/)).toBeInTheDocument();
    });

    it('호환성: 낮음', () => {
      const result = createMockResult({
        personalColorConnection: { season: '겨울 쿨톤', compatibility: 'low', note: '주의해요' },
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(/호환성:.*낮음/)).toBeInTheDocument();
    });

    it('퍼스널컬러 연동 노트가 표시된다', () => {
      const result = createMockResult({
        personalColorConnection: {
          season: '봄 웜톤',
          compatibility: 'high',
          note: '퍼스널컬러와 메이크업 언더톤이 잘 어울려요',
        },
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('퍼스널컬러와 메이크업 언더톤이 잘 어울려요')).toBeInTheDocument();
    });
  });

  describe('분석 신뢰도', () => {
    it('높음 신뢰도가 표시된다', () => {
      const result = createMockResult({ analysisReliability: 'high' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('분석 신뢰도')).toBeInTheDocument();
      expect(screen.getByText('높음')).toBeInTheDocument();
    });

    it('보통 신뢰도가 표시된다', () => {
      const result = createMockResult({ analysisReliability: 'medium' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('분석 신뢰도')).toBeInTheDocument();
      // '보통'은 점수 등급에서도 사용될 수 있으므로 신뢰도 영역에서 확인
      const reliabilityText = screen.getByText('분석 신뢰도');
      const parent = reliabilityText.closest('div');
      expect(parent).toHaveTextContent('보통');
    });

    it('낮음 신뢰도가 표시된다', () => {
      const result = createMockResult({ analysisReliability: 'low' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('낮음')).toBeInTheDocument();
    });
  });

  describe('다양한 언더톤별 렌더링', () => {
    it('웜톤 아이콘이 표시된다', () => {
      const result = createMockResult({ undertone: 'warm' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('makeup-result-card')).toBeInTheDocument();
    });

    it('쿨톤 라벨이 표시된다', () => {
      const result = createMockResult({ undertone: 'cool', undertoneLabel: '쿨톤' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('쿨톤')).toBeInTheDocument();
    });

    it('뉴트럴 라벨이 표시된다', () => {
      const result = createMockResult({ undertone: 'neutral', undertoneLabel: '뉴트럴' });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('뉴트럴')).toBeInTheDocument();
    });
  });

  describe('다양한 눈 형태별 뱃지', () => {
    const eyeShapes = [
      { shape: 'monolid' as const, label: '무쌍' },
      { shape: 'double' as const, label: '유쌍' },
      { shape: 'hooded' as const, label: '속쌍' },
      { shape: 'round' as const, label: '둥근 눈' },
      { shape: 'downturned' as const, label: '처진 눈' },
    ];

    eyeShapes.forEach(({ shape, label }) => {
      it(`${label} 눈 형태가 표시된다`, () => {
        const result = createMockResult({ eyeShape: shape, eyeShapeLabel: label });
        render(<MakeupResultCard result={result} />);
        expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
      });
    });
  });

  describe('다양한 입술 형태별 뱃지', () => {
    const lipShapes = [
      { shape: 'thin' as const, label: '얇은 입술' },
      { shape: 'wide' as const, label: '넓은 입술' },
      { shape: 'small' as const, label: '작은 입술' },
      { shape: 'heart' as const, label: '하트형' },
      { shape: 'asymmetric' as const, label: '비대칭' },
    ];

    lipShapes.forEach(({ shape, label }) => {
      it(`${label} 입술 형태가 표시된다`, () => {
        const result = createMockResult({ lipShape: shape, lipShapeLabel: label });
        render(<MakeupResultCard result={result} />);
        expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
      });
    });
  });

  describe('다양한 얼굴형별 뱃지', () => {
    const faceShapes = [
      { shape: 'round' as const, label: '둥근형' },
      { shape: 'square' as const, label: '각진형' },
      { shape: 'oblong' as const, label: '긴 얼굴' },
      { shape: 'diamond' as const, label: '다이아몬드' },
    ];

    faceShapes.forEach(({ shape, label }) => {
      it(`${label} 얼굴형이 표시된다`, () => {
        const result = createMockResult({ faceShape: shape, faceShapeLabel: label });
        render(<MakeupResultCard result={result} />);
        expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
      });
    });
  });

  describe('엣지케이스', () => {
    it('모든 배열 필드가 비어 있는 결과가 렌더링된다', () => {
      const result = createMockResult({
        metrics: [],
        concerns: [],
        recommendedStyles: [],
        colorRecommendations: [],
        makeupTips: [],
        personalColorConnection: undefined,
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByTestId('makeup-result-card')).toBeInTheDocument();
    });

    it('점수 0점이 정상 렌더링된다', () => {
      const result = createMockResult({ overallScore: 0 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('관리 필요')).toBeInTheDocument();
    });

    it('점수 100점이 정상 렌더링된다', () => {
      const result = createMockResult({ overallScore: 100 });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('매우 좋음')).toBeInTheDocument();
    });

    it('긴 인사이트 텍스트가 렌더링된다', () => {
      const longInsight = '웜톤에 계란형 얼굴이시네요. '.repeat(10);
      const result = createMockResult({ insight: longInsight });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText(longInsight.trim())).toBeInTheDocument();
    });

    it('긴 컬러 이름이 렌더링된다', () => {
      const result = createMockResult({
        colorRecommendations: [
          {
            category: 'lip',
            categoryLabel: '립',
            colors: [
              {
                name: '매우 긴 색상 이름 테스트용',
                hex: '#AABBCC',
                description: '긴 설명 텍스트 테스트',
              },
            ],
          },
        ],
      });
      render(<MakeupResultCard result={result} />);
      expect(screen.getByText('매우 긴 색상 이름 테스트용')).toBeInTheDocument();
    });
  });
});
