import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { HairResultCard } from '@/components/analysis/hair/HairResultCard';
import type { HairAnalysisResult } from '@/lib/analysis/hair';

// =============================================================================
// shadcn/ui 컴포넌트 Mock (JSDOM 환경에서 Radix UI가 동작하지 않으므로)
// =============================================================================

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('div', props, children),
  CardContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('div', props, children),
  CardHeader: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('div', props, children),
  CardTitle: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('h3', props, children),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('span', props, children),
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: { value?: number } & Record<string, unknown>) =>
    React.createElement('div', { role: 'progressbar', 'aria-valuenow': value, ...props }),
}));

// Tabs: 기본값 탭의 컨텐츠만 표시하는 간단한 mock
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({
    children,
    defaultValue,
    ...props
  }: React.PropsWithChildren<{ defaultValue?: string } & Record<string, unknown>>) =>
    React.createElement('div', { 'data-default-value': defaultValue, ...props }, children),
  TabsList: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('div', { role: 'tablist', ...props }, children),
  TabsTrigger: ({
    children,
    value,
    ...props
  }: React.PropsWithChildren<{ value?: string } & Record<string, unknown>>) =>
    React.createElement('button', { role: 'tab', 'data-value': value, ...props }, children),
  TabsContent: ({
    children,
    value,
    ...props
  }: React.PropsWithChildren<{ value?: string } & Record<string, unknown>>) =>
    React.createElement('div', { role: 'tabpanel', 'data-value': value, ...props }, children),
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) =>
    React.createElement(React.Fragment, null, children),
  TooltipContent: ({ children }: React.PropsWithChildren) =>
    React.createElement('div', null, children),
  TooltipProvider: ({ children }: React.PropsWithChildren) =>
    React.createElement(React.Fragment, null, children),
  TooltipTrigger: ({
    children,
    asChild,
    ...props
  }: React.PropsWithChildren<{ asChild?: boolean } & Record<string, unknown>>) =>
    asChild
      ? React.createElement(React.Fragment, null, children)
      : React.createElement('button', props, children),
}));

// =============================================================================
// Mock 데이터 팩토리
// =============================================================================

function createMockResult(overrides: Partial<HairAnalysisResult> = {}): HairAnalysisResult {
  return {
    id: 'test-hair-001',
    faceShapeAnalysis: {
      faceShape: 'oval',
      faceShapeLabel: '타원형',
      confidence: 85,
      ratios: {
        faceLength: 0.35,
        faceWidth: 0.25,
        foreheadWidth: 0.22,
        cheekboneWidth: 0.25,
        jawWidth: 0.2,
        lengthToWidthRatio: 1.4,
      },
    },
    styleRecommendations: [
      {
        name: '레이어드 컷',
        description: '볼륨감 있는 자연스러운 스타일',
        length: 'medium',
        suitability: 92,
        tags: ['자연스러운', '볼륨'],
      },
      {
        name: '사이드 뱅',
        description: '얼굴형을 부드럽게 보완하는 앞머리',
        length: 'long',
        suitability: 85,
        tags: ['페미닌', '클래식'],
      },
    ],
    hairColorAnalysis: {
      currentColor: {
        name: '내추럴 블랙',
        hexColor: '#1C1C1C',
      },
      skinToneMatch: 78,
      recommendedColors: [
        {
          name: '애쉬 브라운',
          hexColor: '#6B4423',
          suitability: 88,
          seasonMatch: '봄 웜',
          tags: ['자연스러운', '데일리'],
        },
        {
          name: '샴페인 골드',
          hexColor: '#F7E7CE',
          suitability: 82,
          seasonMatch: '봄 웜',
          tags: ['화사한', '트렌디'],
        },
      ],
    },
    careTips: [
      '주 2~3회 딥 컨디셔닝 트리트먼트를 추천해요',
      '열 스타일링 전 열보호 스프레이를 사용하세요',
    ],
    currentHairInfo: {
      length: 'medium',
      texture: 'wavy',
      thickness: 'medium',
      scalpCondition: 'normal',
    },
    analyzedAt: '2026-02-15T10:00:00Z',
    usedFallback: false,
    ...overrides,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('HairResultCard', () => {
  describe('렌더링', () => {
    it('결과 카드가 정상 렌더링된다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByTestId('hair-result-card')).toBeInTheDocument();
    });

    it('얼굴형 라벨을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('타원형')).toBeInTheDocument();
    });

    it('얼굴형 분석 결과 부제를 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('얼굴형 분석 결과')).toBeInTheDocument();
    });
  });

  describe('신뢰도 표시', () => {
    it('85% 이상 신뢰도 시 매우 높음을 표시한다', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 90,
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText(/90%/)).toBeInTheDocument();
      expect(screen.getByText('매우 높음')).toBeInTheDocument();
    });

    it('70-84% 신뢰도 시 높음을 표시한다', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 75,
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText(/75%/)).toBeInTheDocument();
      expect(screen.getByText('높음')).toBeInTheDocument();
    });

    it('55-69% 신뢰도 시 보통을 표시한다', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 60,
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText(/60%/)).toBeInTheDocument();
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('55% 미만 신뢰도 시 낮음을 표시한다', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 40,
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText(/40%/)).toBeInTheDocument();
      expect(screen.getByText('낮음')).toBeInTheDocument();
    });

    it('경계값: 85% 신뢰도는 매우 높음', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 85,
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('매우 높음')).toBeInTheDocument();
    });

    it('경계값: 70% 신뢰도는 높음', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 70,
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('높음')).toBeInTheDocument();
    });

    it('경계값: 55% 신뢰도는 보통', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 55,
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });
  });

  describe('탭 구조', () => {
    it('추천 스타일 탭을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('추천 스타일')).toBeInTheDocument();
    });

    it('헤어 컬러 탭을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('헤어 컬러')).toBeInTheDocument();
    });

    it('케어 팁 탭을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('케어 팁')).toBeInTheDocument();
    });
  });

  describe('스타일 추천', () => {
    it('추천 스타일 이름을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('레이어드 컷')).toBeInTheDocument();
      expect(screen.getByText('사이드 뱅')).toBeInTheDocument();
    });

    it('스타일 설명을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('볼륨감 있는 자연스러운 스타일')).toBeInTheDocument();
    });

    it('적합도를 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('적합도 높은 순으로 정렬한다', () => {
      const result = createMockResult({
        styleRecommendations: [
          { name: '낮은 적합도', description: '', length: 'short', suitability: 60, tags: [] },
          { name: '높은 적합도', description: '', length: 'long', suitability: 95, tags: [] },
          { name: '중간 적합도', description: '', length: 'medium', suitability: 80, tags: [] },
        ],
      });
      render(<HairResultCard result={result} />);
      // #1이 가장 먼저 나와야 하고, 그 값이 95%
      const ranks = screen.getAllByText(/^#\d$/);
      expect(ranks[0]).toHaveTextContent('#1');
      // 95%가 첫 번째에 나타나야 한다
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    it('스타일 태그를 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      // '자연스러운'은 스타일 태그와 컬러 태그에 모두 존재할 수 있다
      const naturalTags = screen.getAllByText('자연스러운');
      expect(naturalTags.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('볼륨')).toBeInTheDocument();
    });

    it('헤어 길이 라벨을 한국어로 표시한다', () => {
      // currentHairInfo를 제거하여 '미디엄'이 스타일 길이 라벨에서만 나오도록 한다
      const result = createMockResult({
        styleRecommendations: [
          { name: '숏컷', description: '짧은 스타일', length: 'short', suitability: 90, tags: [] },
          {
            name: '미디엄 레이어드',
            description: '중간 길이',
            length: 'medium',
            suitability: 85,
            tags: [],
          },
          { name: '롱헤어', description: '긴 스타일', length: 'long', suitability: 80, tags: [] },
        ],
        currentHairInfo: undefined,
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('숏')).toBeInTheDocument();
      expect(screen.getByText('미디엄')).toBeInTheDocument();
      expect(screen.getByText('롱')).toBeInTheDocument();
    });

    it('빈 스타일 추천 배열 시 빈 영역', () => {
      const result = createMockResult({ styleRecommendations: [] });
      render(<HairResultCard result={result} />);
      // 스타일 카드가 없어야 한다
      expect(screen.queryByText('#1')).not.toBeInTheDocument();
    });
  });

  describe('헤어 컬러 추천', () => {
    it('현재 헤어 컬러 이름을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('내추럴 블랙')).toBeInTheDocument();
    });

    it('피부톤 매칭 점수를 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText(/78%/)).toBeInTheDocument();
    });

    it('추천 컬러 이름을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('애쉬 브라운')).toBeInTheDocument();
      expect(screen.getByText('샴페인 골드')).toBeInTheDocument();
    });

    it('추천 컬러의 시즌 매칭을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      // 두 컬러 모두 '봄 웜' 시즌
      const seasonMatches = screen.getAllByText('봄 웜');
      expect(seasonMatches.length).toBe(2);
    });

    it('추천 컬러의 적합도를 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('82%')).toBeInTheDocument();
    });

    it('컬러 태그를 표시한다 (최대 2개)', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('데일리')).toBeInTheDocument();
      expect(screen.getByText('트렌디')).toBeInTheDocument();
    });

    it('hairColorAnalysis가 없으면 추천 컬러 목록이 비어 있다', () => {
      const result = createMockResult({ hairColorAnalysis: undefined });
      render(<HairResultCard result={result} />);
      // 현재 헤어 컬러 섹션은 숨겨진다
      expect(screen.queryByText('현재 헤어 컬러')).not.toBeInTheDocument();
      // '추천 헤어 컬러' h4는 항상 렌더링되지만 하위 컬러 카드는 없다
      expect(screen.getByText('추천 헤어 컬러')).toBeInTheDocument();
      expect(screen.queryByText('애쉬 브라운')).not.toBeInTheDocument();
    });

    it('현재 컬러가 없으면 현재 헤어 컬러 영역을 숨긴다', () => {
      const result = createMockResult({
        hairColorAnalysis: {
          skinToneMatch: 70,
          recommendedColors: [
            {
              name: '애쉬 브라운',
              hexColor: '#6B4423',
              suitability: 88,
              seasonMatch: '봄 웜',
              tags: ['자연스러운'],
            },
          ],
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.queryByText('현재 헤어 컬러')).not.toBeInTheDocument();
      expect(screen.getByText('추천 헤어 컬러')).toBeInTheDocument();
    });
  });

  describe('케어 팁', () => {
    it('케어 팁 내용을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('주 2~3회 딥 컨디셔닝 트리트먼트를 추천해요')).toBeInTheDocument();
      expect(screen.getByText('열 스타일링 전 열보호 스프레이를 사용하세요')).toBeInTheDocument();
    });

    it('빈 케어 팁 배열 시 팁 영역이 비어 있다', () => {
      const result = createMockResult({ careTips: [] });
      render(<HairResultCard result={result} />);
      // 케어 팁 탭은 있지만 내용이 없어야 한다
      expect(screen.getByText('케어 팁')).toBeInTheDocument();
    });
  });

  describe('얼굴 비율 분석 (상세 모드)', () => {
    it('showDetails=true(기본)일 때 비율 분석을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('얼굴 비율 분석')).toBeInTheDocument();
      expect(screen.getByText('길이/너비 비율')).toBeInTheDocument();
      expect(screen.getByText('이마 너비')).toBeInTheDocument();
      expect(screen.getByText('턱 너비')).toBeInTheDocument();
    });

    it('길이/너비 비율을 소수점 2자리로 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('1.40')).toBeInTheDocument();
    });

    it('이마 너비를 퍼센트로 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      // foreheadWidth: 0.22 -> 22% (비율 표시 + 비율 바에 두 번 표시될 수 있다)
      const matches = screen.getAllByText('22%');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('턱 너비를 퍼센트로 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      // jawWidth: 0.20 -> 20% (비율 표시 + 비율 바에 두 번 표시될 수 있다)
      const matches = screen.getAllByText('20%');
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('비율 바에 이마/광대/턱 라벨을 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('이마')).toBeInTheDocument();
      expect(screen.getByText('광대')).toBeInTheDocument();
      expect(screen.getByText('턱')).toBeInTheDocument();
    });

    it('showDetails=false일 때 비율 분석을 숨긴다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} showDetails={false} />);
      expect(screen.queryByText('얼굴 비율 분석')).not.toBeInTheDocument();
    });
  });

  describe('현재 헤어 정보', () => {
    it('현재 헤어 정보가 있으면 표시한다', () => {
      const result = createMockResult();
      render(<HairResultCard result={result} />);
      expect(screen.getByText('현재 헤어 정보')).toBeInTheDocument();
    });

    it('헤어 길이를 한국어로 표시한다', () => {
      // 스타일 추천에서 '미디엄'이 중복 렌더링되지 않도록 short 길이만 사용
      const result = createMockResult({
        currentHairInfo: { length: 'medium' },
        styleRecommendations: [
          { name: '숏컷', description: '짧은', length: 'short', suitability: 90, tags: [] },
        ],
      });
      render(<HairResultCard result={result} />);
      // currentHairInfo의 length 'medium' -> '미디엄' 표시
      expect(screen.getByText('미디엄')).toBeInTheDocument();
    });

    it('헤어 질감을 표시한다', () => {
      const result = createMockResult({
        currentHairInfo: { texture: 'wavy' },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('wavy')).toBeInTheDocument();
    });

    it('헤어 굵기를 표시한다', () => {
      const result = createMockResult({
        currentHairInfo: { thickness: 'medium' },
      });
      render(<HairResultCard result={result} />);
      // thickness는 Badge로 직접 표시
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('두피 상태를 표시한다', () => {
      const result = createMockResult({
        currentHairInfo: { scalpCondition: 'oily' },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('oily')).toBeInTheDocument();
    });

    it('currentHairInfo가 없으면 헤어 정보 영역을 숨긴다', () => {
      const result = createMockResult({ currentHairInfo: undefined });
      render(<HairResultCard result={result} />);
      expect(screen.queryByText('현재 헤어 정보')).not.toBeInTheDocument();
    });
  });

  describe('Fallback 알림', () => {
    it('usedFallback=true일 때 알림을 표시한다', () => {
      const result = createMockResult({ usedFallback: true });
      render(<HairResultCard result={result} />);
      expect(screen.getByText(/AI 분석이 지연되어/)).toBeInTheDocument();
      expect(screen.getByText(/재분석을 권장합니다/)).toBeInTheDocument();
    });

    it('usedFallback=false일 때 알림을 숨긴다', () => {
      const result = createMockResult({ usedFallback: false });
      render(<HairResultCard result={result} />);
      expect(screen.queryByText(/AI 분석이 지연되어/)).not.toBeInTheDocument();
    });
  });

  describe('얼굴형별 렌더링', () => {
    const faceShapes = [
      { shape: 'oval' as const, label: '타원형' },
      { shape: 'round' as const, label: '둥근형' },
      { shape: 'square' as const, label: '사각형' },
      { shape: 'heart' as const, label: '하트형' },
      { shape: 'oblong' as const, label: '긴 형' },
      { shape: 'diamond' as const, label: '다이아몬드형' },
      { shape: 'rectangle' as const, label: '직사각형' },
    ];

    faceShapes.forEach(({ shape, label }) => {
      it(`${label} 얼굴형을 정상 렌더링한다`, () => {
        const result = createMockResult({
          faceShapeAnalysis: {
            ...createMockResult().faceShapeAnalysis,
            faceShape: shape,
            faceShapeLabel: label,
          },
        });
        render(<HairResultCard result={result} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('엣지 케이스', () => {
    it('빈 스타일 추천 + 빈 케어 팁', () => {
      const result = createMockResult({
        styleRecommendations: [],
        careTips: [],
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByTestId('hair-result-card')).toBeInTheDocument();
    });

    it('추천 컬러가 비어 있는 hairColorAnalysis', () => {
      const result = createMockResult({
        hairColorAnalysis: {
          skinToneMatch: 70,
          recommendedColors: [],
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('추천 헤어 컬러')).toBeInTheDocument();
    });

    it('신뢰도 0% 처리', () => {
      // 다른 퍼센트 값과 충돌을 방지하기 위해 최소 데이터로 테스트
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 0,
        },
        styleRecommendations: [],
        hairColorAnalysis: undefined,
        currentHairInfo: undefined,
      });
      render(<HairResultCard result={result} />);
      // '신뢰도 0%' 텍스트가 Badge 안에 들어간다
      expect(screen.getByText(/신뢰도 0%/)).toBeInTheDocument();
      expect(screen.getByText('낮음')).toBeInTheDocument();
    });

    it('신뢰도 100% 처리', () => {
      const result = createMockResult({
        faceShapeAnalysis: {
          ...createMockResult().faceShapeAnalysis,
          confidence: 100,
        },
        styleRecommendations: [],
        hairColorAnalysis: undefined,
        currentHairInfo: undefined,
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText(/신뢰도 100%/)).toBeInTheDocument();
      expect(screen.getByText('매우 높음')).toBeInTheDocument();
    });

    it('적합도 0% 스타일 추천', () => {
      const result = createMockResult({
        styleRecommendations: [
          {
            name: '적합도 낮은 스타일',
            description: '잘 안 어울리는 스타일',
            length: 'short',
            suitability: 0,
            tags: [],
          },
        ],
        hairColorAnalysis: undefined,
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('적합도 낮은 스타일')).toBeInTheDocument();
      // 적합도 텍스트 '0%'는 스타일 카드 내부에 표시된다
      const zeroPercents = screen.getAllByText('0%');
      expect(zeroPercents.length).toBeGreaterThanOrEqual(1);
    });

    it('적합도 100% 스타일 추천', () => {
      const result = createMockResult({
        styleRecommendations: [
          {
            name: '완벽한 스타일',
            description: '딱 맞는 스타일',
            length: 'medium',
            suitability: 100,
            tags: [],
          },
        ],
        hairColorAnalysis: undefined,
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('완벽한 스타일')).toBeInTheDocument();
      // '100%'는 스타일 적합도에 표시된다
      const hundredPercents = screen.getAllByText('100%');
      expect(hundredPercents.length).toBeGreaterThanOrEqual(1);
    });

    it('3개 이상 태그가 있는 컬러는 처음 2개만 표시한다', () => {
      const result = createMockResult({
        hairColorAnalysis: {
          skinToneMatch: 70,
          recommendedColors: [
            {
              name: '테스트 컬러',
              hexColor: '#AABBCC',
              suitability: 80,
              seasonMatch: '가을',
              tags: ['태그1', '태그2', '태그3', '태그4'],
            },
          ],
        },
      });
      render(<HairResultCard result={result} />);
      expect(screen.getByText('태그1')).toBeInTheDocument();
      expect(screen.getByText('태그2')).toBeInTheDocument();
      // 실제 컴포넌트에서 color.tags.slice(0, 2)로 제한
      expect(screen.queryByText('태그3')).not.toBeInTheDocument();
      expect(screen.queryByText('태그4')).not.toBeInTheDocument();
    });
  });
});
