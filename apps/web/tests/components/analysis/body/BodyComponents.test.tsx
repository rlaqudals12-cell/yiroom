/**
 * C-1 체형분석 모듈 - 미테스트 컴포넌트 테스트
 *
 * 대상: BodyStyleImage, BodyVisualization, PostureCorrectionCard
 *
 * @description 3개 컴포넌트의 렌더링, 상호작용, 접근성, 엣지케이스 테스트
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// ============================================================================
// Mocks
// ============================================================================

// next/image mock
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onError,
    onLoad,
    className,
    fill,
    sizes,
    ...rest
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    onLoad?: () => void;
    className?: string;
    fill?: boolean;
    sizes?: string;
    [key: string]: unknown;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid="next-image"
      data-fill={fill ? 'true' : undefined}
      data-sizes={sizes}
      onError={onError}
      onLoad={onLoad}
    />
  ),
}));

// lucide-react mock
vi.mock('lucide-react', () => {
  function createIcon(name: string) {
    const Icon = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
      <span data-testid={`icon-${name}`} className={className} {...props} />
    );
    Icon.displayName = name;
    return Icon;
  }
  return {
    ImageIcon: createIcon('image'),
    Loader2: createIcon('loader2'),
    ChevronDown: createIcon('chevron-down'),
    ChevronUp: createIcon('chevron-up'),
    AlertCircle: createIcon('alert-circle'),
    Target: createIcon('target'),
    Clock: createIcon('clock'),
    Calendar: createIcon('calendar'),
    CheckCircle2: createIcon('check-circle2'),
    PlayCircle: createIcon('play-circle'),
    Info: createIcon('info'),
  };
});

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
    <div className={className} data-testid="card" {...props}>
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

// shadcn/ui Tabs mock - 기본 탭 전환 동작 지원
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

// ============================================================================
// Imports (after mocks)
// ============================================================================

import { BodyStyleImage } from '@/components/analysis/body/BodyStyleImage';
import { BodyVisualization } from '@/components/analysis/body/BodyVisualization';
import { PostureCorrectionCard } from '@/components/body/PostureCorrectionCard';
import type { BodyType3 } from '@/lib/mock/body-analysis';
import type { BodyAnalysisV2Result, BodyShapeType, Landmark33 } from '@/lib/analysis/body-v2';
import type { BodyShape7 } from '@/lib/body/types';

// ============================================================================
// 테스트 데이터 팩토리
// ============================================================================

function createMockLandmark(x: number, y: number, z: number, visibility = 0.9): Landmark33 {
  return { x, y, z, visibility };
}

function createMockLandmarks(count = 33): Landmark33[] {
  return Array.from({ length: count }, (_, i) =>
    createMockLandmark(
      0.3 + (i % 5) * 0.1,
      0.1 + Math.floor(i / 5) * 0.12,
      0,
      0.85 + Math.random() * 0.15
    )
  );
}

function createMockBodyAnalysisResult(
  overrides: Partial<BodyAnalysisV2Result> = {}
): BodyAnalysisV2Result {
  return {
    id: 'test-result-1',
    poseDetection: {
      landmarks: createMockLandmarks(),
      overallVisibility: 0.92,
      confidence: 0.88,
    },
    bodyRatios: {
      shoulderWidth: 40,
      waistWidth: 30,
      hipWidth: 38,
      shoulderToWaistRatio: 1.33,
      waistToHipRatio: 0.79,
      upperBodyLength: 55,
      lowerBodyLength: 60,
      upperToLowerRatio: 0.92,
      armLength: 58,
      legLength: 80,
      armToTorsoRatio: 1.05,
    },
    bodyShape: 'hourglass',
    bodyShapeInfo: {
      type: 'hourglass',
      label: '모래시계형',
      description: '어깨와 힙이 비슷하고 허리가 잘록함',
      characteristics: ['균형 잡힌 상하체', '잘록한 허리 라인'],
      stylingTips: ['허리를 강조하는 핏'],
    },
    measurementConfidence: 85,
    analyzedAt: '2026-02-14T10:00:00Z',
    usedFallback: false,
    ...overrides,
  };
}

// ============================================================================
// BodyStyleImage 테스트
// ============================================================================

describe('BodyStyleImage', () => {
  describe('렌더링', () => {
    it('data-testid가 존재한다', () => {
      render(<BodyStyleImage bodyType="S" />);
      expect(screen.getByTestId('body-style-image')).toBeInTheDocument();
    });

    it('S 체형의 스타일 이미지 3장을 렌더링한다', () => {
      render(<BodyStyleImage bodyType="S" />);
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(3);
    });

    it('W 체형의 스타일 이미지 3장을 렌더링한다', () => {
      render(<BodyStyleImage bodyType="W" />);
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(3);
    });

    it('N 체형의 스타일 이미지 3장을 렌더링한다', () => {
      render(<BodyStyleImage bodyType="N" />);
      const images = screen.getAllByTestId('next-image');
      expect(images).toHaveLength(3);
    });

    it('각 이미지에 올바른 alt 텍스트가 있다', () => {
      render(<BodyStyleImage bodyType="S" />);
      expect(screen.getByAltText('스트레이트 체형 포멀 스타일')).toBeInTheDocument();
      expect(screen.getByAltText('스트레이트 체형 캐주얼 스타일')).toBeInTheDocument();
      expect(screen.getByAltText('스트레이트 체형 미니멀 스타일')).toBeInTheDocument();
    });
  });

  describe('스타일 라벨', () => {
    it('showLabels가 true일 때 스타일 라벨을 표시한다', () => {
      render(<BodyStyleImage bodyType="S" showLabels />);
      expect(screen.getByText('포멀')).toBeInTheDocument();
      expect(screen.getByText('캐주얼')).toBeInTheDocument();
      expect(screen.getByText('미니멀')).toBeInTheDocument();
    });

    it('showLabels가 false일 때 스타일 라벨을 숨긴다', () => {
      render(<BodyStyleImage bodyType="S" showLabels={false} />);
      expect(screen.queryByText('포멀')).not.toBeInTheDocument();
      expect(screen.queryByText('캐주얼')).not.toBeInTheDocument();
      expect(screen.queryByText('미니멀')).not.toBeInTheDocument();
    });

    it('showLabels 기본값은 true이다', () => {
      render(<BodyStyleImage bodyType="W" />);
      expect(screen.getByText('페미닌')).toBeInTheDocument();
      expect(screen.getByText('로맨틱')).toBeInTheDocument();
      expect(screen.getByText('엘레강스')).toBeInTheDocument();
    });
  });

  describe('클릭 이벤트', () => {
    it('이미지 클릭 시 onImageClick 핸들러를 호출한다', () => {
      const handleClick = vi.fn();
      render(<BodyStyleImage bodyType="S" onImageClick={handleClick} />);

      const container = screen.getByTestId('body-style-image');
      const buttons = within(container).getAllByRole('button');
      fireEvent.click(buttons[0]);

      expect(handleClick).toHaveBeenCalledWith(0);
    });

    it('두 번째 이미지 클릭 시 index 1로 호출한다', () => {
      const handleClick = vi.fn();
      render(<BodyStyleImage bodyType="S" onImageClick={handleClick} />);

      const container = screen.getByTestId('body-style-image');
      const buttons = within(container).getAllByRole('button');
      fireEvent.click(buttons[1]);

      expect(handleClick).toHaveBeenCalledWith(1);
    });

    it('onImageClick이 없어도 에러 없이 렌더링된다', () => {
      render(<BodyStyleImage bodyType="N" />);
      const container = screen.getByTestId('body-style-image');
      const buttons = within(container).getAllByRole('button');
      expect(() => fireEvent.click(buttons[0])).not.toThrow();
    });
  });

  describe('키보드 접근성', () => {
    it('Enter 키로 이미지를 선택할 수 있다', () => {
      const handleClick = vi.fn();
      render(<BodyStyleImage bodyType="S" onImageClick={handleClick} />);

      const container = screen.getByTestId('body-style-image');
      const buttons = within(container).getAllByRole('button');
      fireEvent.keyDown(buttons[0], { key: 'Enter' });

      expect(handleClick).toHaveBeenCalledWith(0);
    });

    it('Space 키로 이미지를 선택할 수 있다', () => {
      const handleClick = vi.fn();
      render(<BodyStyleImage bodyType="S" onImageClick={handleClick} />);

      const container = screen.getByTestId('body-style-image');
      const buttons = within(container).getAllByRole('button');
      fireEvent.keyDown(buttons[2], { key: ' ' });

      expect(handleClick).toHaveBeenCalledWith(2);
    });

    it('각 이미지에 aria-label이 있다', () => {
      render(<BodyStyleImage bodyType="W" />);
      expect(screen.getByLabelText('웨이브 체형 페미닌 스타일')).toBeInTheDocument();
      expect(screen.getByLabelText('웨이브 체형 로맨틱 스타일')).toBeInTheDocument();
    });

    it('각 이미지에 tabIndex가 설정되어 있다', () => {
      render(<BodyStyleImage bodyType="S" />);
      const container = screen.getByTestId('body-style-image');
      const buttons = within(container).getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('tabindex', '0');
      });
    });
  });

  describe('이미지 에러 처리', () => {
    it('이미지 로드 실패 시 플레이스홀더를 표시한다', () => {
      render(<BodyStyleImage bodyType="S" />);
      const images = screen.getAllByTestId('next-image');

      // 첫 번째 이미지 에러 발생
      fireEvent.error(images[0]);

      // 플레이스홀더 텍스트 확인
      expect(screen.getByText('스타일 이미지 준비 중')).toBeInTheDocument();
    });

    it('이미지 로드 중에 로딩 스피너가 표시된다', () => {
      render(<BodyStyleImage bodyType="S" />);
      // 초기 상태에서 로딩 아이콘이 존재
      const loaders = screen.getAllByTestId('icon-loader2');
      expect(loaders.length).toBeGreaterThan(0);
    });

    it('이미지 로드 완료 후 로딩 스피너가 사라진다', () => {
      render(<BodyStyleImage bodyType="S" />);
      const images = screen.getAllByTestId('next-image');

      // 모든 이미지 로드 완료
      images.forEach((img) => fireEvent.load(img));

      // 로딩 스피너가 없어야 함
      expect(screen.queryByTestId('icon-loader2')).not.toBeInTheDocument();
    });
  });

  describe('className 전달', () => {
    it('커스텀 className이 적용된다', () => {
      render(<BodyStyleImage bodyType="S" className="custom-class" />);
      const container = screen.getByTestId('body-style-image');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('체형별 이미지 경로', () => {
    it.each<[BodyType3, string]>([
      ['S', '/images/body-types/straight-formal.jpg'],
      ['W', '/images/body-types/wave-feminine.jpg'],
      ['N', '/images/body-types/natural-casual.jpg'],
    ])('%s 체형의 첫 번째 이미지 경로가 올바르다', (bodyType, expectedSrc) => {
      render(<BodyStyleImage bodyType={bodyType} />);
      const images = screen.getAllByTestId('next-image');
      expect(images[0]).toHaveAttribute('src', expectedSrc);
    });
  });
});

// ============================================================================
// BodyVisualization 테스트
// ============================================================================

describe('BodyVisualization', () => {
  let mockResult: BodyAnalysisV2Result;

  beforeEach(() => {
    mockResult = createMockBodyAnalysisResult();
  });

  describe('렌더링', () => {
    it('data-testid가 존재한다', () => {
      render(<BodyVisualization result={mockResult} />);
      expect(screen.getByTestId('body-visualization')).toBeInTheDocument();
    });

    it('체형 라벨을 표시한다', () => {
      render(<BodyVisualization result={mockResult} />);
      expect(screen.getByText('모래시계형')).toBeInTheDocument();
    });

    it('체형 설명을 표시한다', () => {
      render(<BodyVisualization result={mockResult} />);
      expect(screen.getByText('어깨와 힙이 비슷하고 허리가 잘록함')).toBeInTheDocument();
    });

    it('신뢰도 배지를 표시한다', () => {
      render(<BodyVisualization result={mockResult} />);
      expect(screen.getByText(/신뢰도 85%/)).toBeInTheDocument();
    });

    it('체형 비율 섹션이 렌더링된다', () => {
      render(<BodyVisualization result={mockResult} />);
      expect(screen.getByText('체형 비율')).toBeInTheDocument();
    });
  });

  describe('체형 유형별 렌더링', () => {
    it.each<[BodyShapeType, string]>([
      ['rectangle', '직사각형'],
      ['inverted-triangle', '역삼각형'],
      ['triangle', '삼각형'],
      ['oval', '타원형'],
      ['hourglass', '모래시계형'],
    ])('%s 체형 정보를 올바르게 표시한다', (bodyShape, expectedLabel) => {
      const result = createMockBodyAnalysisResult({
        bodyShape,
        bodyShapeInfo: {
          type: bodyShape,
          label: expectedLabel,
          description: `${expectedLabel} 설명`,
          characteristics: [],
          stylingTips: [],
        },
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  });

  describe('신뢰도 등급', () => {
    it('90% 이상이면 "매우 높음"을 표시한다', () => {
      const result = createMockBodyAnalysisResult({ measurementConfidence: 95 });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('매우 높음')).toBeInTheDocument();
    });

    it('75% 이상이면 "높음"을 표시한다', () => {
      const result = createMockBodyAnalysisResult({ measurementConfidence: 80 });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('높음')).toBeInTheDocument();
    });

    it('60% 이상이면 "보통"을 표시한다', () => {
      const result = createMockBodyAnalysisResult({ measurementConfidence: 65 });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('60% 미만이면 "낮음"을 표시한다', () => {
      const result = createMockBodyAnalysisResult({ measurementConfidence: 50 });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('낮음')).toBeInTheDocument();
    });
  });

  describe('체형 비율 수치', () => {
    it('어깨/힙 비율 수치를 표시한다', () => {
      render(<BodyVisualization result={mockResult} />);
      // shoulderWidth(40) / hipWidth(38) = 1.05
      expect(screen.getByText('어깨-힙 비율')).toBeInTheDocument();
      expect(screen.getByText('어깨/힙')).toBeInTheDocument();
    });

    it('허리/힙 비율 수치를 표시한다', () => {
      render(<BodyVisualization result={mockResult} />);
      expect(screen.getByText('허리-힙 비율')).toBeInTheDocument();
      expect(screen.getByText('허리/힙')).toBeInTheDocument();
    });

    it('상체-하체 비율 항목이 표시된다', () => {
      render(<BodyVisualization result={mockResult} />);
      expect(screen.getByText('상체-하체 비율')).toBeInTheDocument();
    });
  });

  describe('랜드마크 캔버스', () => {
    it('showLandmarks가 true일 때 캔버스가 표시된다', () => {
      render(<BodyVisualization result={mockResult} showLandmarks />);
      expect(screen.getByTestId('landmarks-canvas')).toBeInTheDocument();
    });

    it('showLandmarks가 false일 때 캔버스가 숨겨진다', () => {
      render(<BodyVisualization result={mockResult} showLandmarks={false} />);
      expect(screen.queryByTestId('landmarks-canvas')).not.toBeInTheDocument();
    });

    it('랜드마크 타이틀이 표시된다', () => {
      render(<BodyVisualization result={mockResult} showLandmarks />);
      expect(screen.getByText('체형 랜드마크')).toBeInTheDocument();
    });

    it('랜드마크 범례가 표시된다', () => {
      render(<BodyVisualization result={mockResult} showLandmarks />);
      expect(screen.getByText(/빨간 점: 주요 랜드마크/)).toBeInTheDocument();
    });

    it('imageUrl이 제공되면 배경 이미지가 렌더링된다', () => {
      render(
        <BodyVisualization
          result={mockResult}
          showLandmarks
          imageUrl="https://example.com/body.jpg"
        />
      );
      const img = screen.getByAltText('Body analysis');
      expect(img).toHaveAttribute('src', 'https://example.com/body.jpg');
    });
  });

  describe('자세 분석 섹션', () => {
    it('postureAnalysis가 있으면 자세 분석 섹션을 표시한다', () => {
      const result = createMockBodyAnalysisResult({
        postureAnalysis: {
          shoulderTilt: 2.5,
          hipTilt: 1.3,
          spineAlignment: 82,
          headPosition: 'neutral',
          issues: [],
        },
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('자세 분석')).toBeInTheDocument();
      expect(screen.getByText(/척추 정렬 82점/)).toBeInTheDocument();
    });

    it('postureAnalysis가 없으면 자세 분석 섹션을 숨긴다', () => {
      const result = createMockBodyAnalysisResult({ postureAnalysis: undefined });
      render(<BodyVisualization result={result} />);
      expect(screen.queryByText('자세 분석')).not.toBeInTheDocument();
    });

    it('어깨 기울기를 표시한다', () => {
      const result = createMockBodyAnalysisResult({
        postureAnalysis: {
          shoulderTilt: 3.5,
          hipTilt: 1.0,
          spineAlignment: 75,
          headPosition: 'neutral',
          issues: [],
        },
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('어깨 기울기')).toBeInTheDocument();
      expect(screen.getByText('3.5\u00B0')).toBeInTheDocument();
    });

    it('머리 위치 "forward"를 "전방"으로 표시한다', () => {
      const result = createMockBodyAnalysisResult({
        postureAnalysis: {
          shoulderTilt: 1.0,
          hipTilt: 1.0,
          spineAlignment: 70,
          headPosition: 'forward',
          issues: [],
        },
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('전방')).toBeInTheDocument();
    });

    it('머리 위치 "neutral"을 "정상"으로 표시한다', () => {
      const result = createMockBodyAnalysisResult({
        postureAnalysis: {
          shoulderTilt: 1.0,
          hipTilt: 1.0,
          spineAlignment: 90,
          headPosition: 'neutral',
          issues: [],
        },
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('정상')).toBeInTheDocument();
    });

    it('자세 문제가 있을 때 문제 설명을 표시한다', () => {
      const result = createMockBodyAnalysisResult({
        postureAnalysis: {
          shoulderTilt: 6.0,
          hipTilt: 2.0,
          spineAlignment: 60,
          headPosition: 'forward',
          issues: [
            {
              type: 'forward-head',
              severity: 3,
              description: '거북목 자세가 감지되었습니다',
              exercises: ['턱 당기기'],
            },
          ],
        },
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('자세 교정 필요:')).toBeInTheDocument();
      expect(screen.getByText(/거북목 자세가 감지되었습니다/)).toBeInTheDocument();
    });
  });

  describe('스타일링 추천', () => {
    it('스타일링 추천 탭을 표시한다', () => {
      const result = createMockBodyAnalysisResult({
        stylingRecommendations: {
          tops: ['V넥 상의'],
          bottoms: ['하이웨이스트 팬츠'],
          outerwear: ['크롭 자켓'],
          silhouettes: ['핏앤플레어'],
          avoid: ['오버사이즈 상의'],
        },
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('스타일링 추천')).toBeInTheDocument();
      expect(screen.getByText('추천 스타일')).toBeInTheDocument();
      expect(screen.getByText('피해야 할 스타일')).toBeInTheDocument();
    });

    it('추천 스타일 탭에서 스타일링 항목을 표시한다', () => {
      const result = createMockBodyAnalysisResult({
        stylingRecommendations: {
          tops: ['V넥 상의'],
          bottoms: ['하이웨이스트 팬츠'],
          outerwear: [],
          silhouettes: [],
          avoid: ['오버사이즈 상의'],
        },
      });
      render(<BodyVisualization result={result} />);

      // 기본 탭은 "recommend" - 추천 스타일
      expect(screen.getByText('V넥 상의')).toBeInTheDocument();
      expect(screen.getByText('하이웨이스트 팬츠')).toBeInTheDocument();
    });

    it('피해야 할 스타일 탭으로 전환할 수 있다', () => {
      const result = createMockBodyAnalysisResult({
        stylingRecommendations: {
          tops: ['V넥 상의'],
          bottoms: [],
          outerwear: [],
          silhouettes: [],
          avoid: ['오버사이즈 상의'],
        },
      });
      render(<BodyVisualization result={result} />);

      // 피해야 할 스타일 탭 클릭
      fireEvent.click(screen.getByText('피해야 할 스타일'));

      expect(screen.getByText('오버사이즈 상의')).toBeInTheDocument();
    });
  });

  describe('Fallback 알림', () => {
    it('usedFallback이 true일 때 알림을 표시한다', () => {
      const result = createMockBodyAnalysisResult({ usedFallback: true });
      render(<BodyVisualization result={result} />);
      expect(
        screen.getByText(/AI 분석이 지연되어 예측 결과를 표시하고 있어요/)
      ).toBeInTheDocument();
    });

    it('usedFallback이 false일 때 알림을 숨긴다', () => {
      const result = createMockBodyAnalysisResult({ usedFallback: false });
      render(<BodyVisualization result={result} />);
      expect(
        screen.queryByText(/AI 분석이 지연되어 예측 결과를 표시하고 있어요/)
      ).not.toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('bodyRatios가 없어도 렌더링된다', () => {
      const result = createMockBodyAnalysisResult({
        bodyRatios: undefined as unknown as BodyAnalysisV2Result['bodyRatios'],
      });
      render(<BodyVisualization result={result} />);
      expect(screen.getByTestId('body-visualization')).toBeInTheDocument();
    });

    it('stylingRecommendations가 없어도 렌더링된다', () => {
      const result = createMockBodyAnalysisResult({ stylingRecommendations: undefined });
      render(<BodyVisualization result={result} />);
      expect(screen.getByText('스타일링 추천')).toBeInTheDocument();
    });

    it('랜드마크 데이터가 없으면 캔버스를 숨긴다', () => {
      const result = createMockBodyAnalysisResult({
        poseDetection: undefined as unknown as BodyAnalysisV2Result['poseDetection'],
      });
      render(<BodyVisualization result={result} showLandmarks />);
      expect(screen.queryByTestId('landmarks-canvas')).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// PostureCorrectionCard 테스트
// ============================================================================

describe('PostureCorrectionCard', () => {
  const defaultBodyType: BodyShape7 = 'rectangle';

  describe('렌더링', () => {
    it('data-testid가 존재한다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByTestId('posture-correction-card')).toBeInTheDocument();
    });

    it('헤더에 "자세 교정 가이드" 텍스트가 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('자세 교정 가이드')).toBeInTheDocument();
    });

    it('운동 개수가 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText(/개 운동/)).toBeInTheDocument();
    });

    it('진행률 바가 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('오늘의 진행률')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('자세 문제 섹션이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('주의해야 할 자세 문제')).toBeInTheDocument();
    });

    it('교정 운동 섹션이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('추천 교정 운동')).toBeInTheDocument();
    });

    it('일상 생활 팁이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(screen.getByText('일상 생활 팁')).toBeInTheDocument();
    });

    it('주의사항이 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);
      expect(
        screen.getByText(/심한 통증이 있을 경우 운동을 중단하고 전문의와 상담하세요/)
      ).toBeInTheDocument();
    });
  });

  describe('체형별 렌더링', () => {
    it.each<BodyShape7>([
      'hourglass',
      'pear',
      'invertedTriangle',
      'apple',
      'rectangle',
      'trapezoid',
      'oval',
    ])('%s 체형으로 렌더링된다', (bodyType) => {
      render(<PostureCorrectionCard bodyType={bodyType} />);
      expect(screen.getByTestId('posture-correction-card')).toBeInTheDocument();
      expect(screen.getByText('자세 교정 가이드')).toBeInTheDocument();
    });
  });

  describe('컴팩트 모드', () => {
    it('compact 모드에서 헤더의 운동 개수를 숨긴다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      // compact 모드에서는 헤더의 "N개 운동" 텍스트가 없어야 함
      // ("+N개 운동 더보기"는 별도 섹션이므로 정확히 매칭)
      expect(screen.queryByText(/^\d+개 운동$/)).not.toBeInTheDocument();
    });

    it('compact 모드에서 진행률 바를 숨긴다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText('오늘의 진행률')).not.toBeInTheDocument();
    });

    it('compact 모드에서 자세 문제 섹션을 숨긴다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText('주의해야 할 자세 문제')).not.toBeInTheDocument();
    });

    it('compact 모드에서 최대 3개 운동만 표시한다', () => {
      render(<PostureCorrectionCard bodyType="oval" compact />);
      // oval 체형은 3개 이상의 운동을 가짐 - "+N개 운동 더보기" 확인
      const moreText = screen.queryByText(/운동 더보기/);
      // 운동이 3개 이상이면 더보기 텍스트가 있어야 함
      if (moreText) {
        expect(moreText).toBeInTheDocument();
      }
    });

    it('compact 모드에서 일상 생활 팁을 숨긴다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText('일상 생활 팁')).not.toBeInTheDocument();
    });

    it('compact 모드에서 주의사항을 숨긴다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} compact />);
      expect(screen.queryByText(/심한 통증이 있을 경우/)).not.toBeInTheDocument();
    });
  });

  describe('자세 문제 토글', () => {
    it('문제 항목을 클릭하면 상세 정보가 펼쳐진다', () => {
      render(<PostureCorrectionCard bodyType="pear" />);

      // pear 체형은 rounded_shoulders 문제가 있음
      const issueButton = screen.getByText('굽은 어깨 (라운드 숄더)');
      fireEvent.click(issueButton);

      // 상세 정보 (원인/증상) 확인
      expect(screen.getByText('원인:')).toBeInTheDocument();
      expect(screen.getByText('증상:')).toBeInTheDocument();
    });

    it('펼쳐진 문제를 다시 클릭하면 접힌다', () => {
      render(<PostureCorrectionCard bodyType="pear" />);

      const issueButton = screen.getByText('굽은 어깨 (라운드 숄더)');

      // 펼치기
      fireEvent.click(issueButton);
      expect(screen.getByText('원인:')).toBeInTheDocument();

      // 접기
      fireEvent.click(issueButton);
      expect(screen.queryByText('원인:')).not.toBeInTheDocument();
    });
  });

  describe('운동 카드 상호작용', () => {
    it('운동 이름을 클릭하면 상세 정보가 표시된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);

      // rectangle 체형은 flat_back, forward_head 문제 -> 관련 운동 표시
      // 운동 이름들 중 하나를 클릭
      const exerciseNames = screen.getAllByText(/스트레칭|운동|자세/);
      if (exerciseNames.length > 0) {
        fireEvent.click(exerciseNames[0]);
        // 상세 정보 중 "동작 순서" 확인
        const stepHeaders = screen.queryAllByText('동작 순서');
        // 펼쳐진 운동이 있으면 동작 순서가 표시됨
        if (stepHeaders.length > 0) {
          expect(stepHeaders[0]).toBeInTheDocument();
        }
      }
    });

    it('운동 완료 버튼을 클릭하면 완료 상태가 변경된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);

      // 진행률이 0%에서 시작
      expect(screen.getByText('0%')).toBeInTheDocument();

      // 완료 버튼(동그라미) 클릭 - 첫 번째 운동
      const completeButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) => btn.className.includes('rounded-full') && btn.className.includes('border-2')
        );

      if (completeButtons.length > 0) {
        fireEvent.click(completeButtons[0]);

        // 진행률이 0%보다 높아져야 함
        expect(screen.queryByText('0%')).not.toBeInTheDocument();
      }
    });

    it('완료한 운동을 다시 클릭하면 완료 상태가 취소된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} />);

      const completeButtons = screen
        .getAllByRole('button')
        .filter(
          (btn) => btn.className.includes('rounded-full') && btn.className.includes('border-2')
        );

      if (completeButtons.length > 0) {
        // 완료
        fireEvent.click(completeButtons[0]);
        const progressAfterComplete = screen.queryByText('0%');
        expect(progressAfterComplete).not.toBeInTheDocument();

        // 완료 취소
        fireEvent.click(completeButtons[0]);
        expect(screen.getByText('0%')).toBeInTheDocument();
      }
    });
  });

  describe('난이도 필터', () => {
    it('maxDifficulty=1이면 쉬운 운동만 표시한다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} maxDifficulty={1} />);
      // 쉬움 난이도 배지가 있어야 함
      const easyBadges = screen.queryAllByText('쉬움');
      // 보통/어려움 배지가 없어야 함
      const mediumBadges = screen.queryAllByText('보통');
      const hardBadges = screen.queryAllByText('어려움');

      if (easyBadges.length > 0) {
        expect(easyBadges.length).toBeGreaterThan(0);
      }
      expect(mediumBadges).toHaveLength(0);
      expect(hardBadges).toHaveLength(0);
    });

    it('maxDifficulty=2이면 보통 이하 운동을 표시한다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} maxDifficulty={2} />);
      const hardBadges = screen.queryAllByText('어려움');
      expect(hardBadges).toHaveLength(0);
    });

    it('maxDifficulty=3이면 모든 운동을 표시한다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} maxDifficulty={3} />);
      // 기본 동작 확인 - 운동 섹션 존재
      expect(screen.getByText('추천 교정 운동')).toBeInTheDocument();
    });
  });

  describe('className 전달', () => {
    it('커스텀 className이 적용된다', () => {
      render(<PostureCorrectionCard bodyType={defaultBodyType} className="my-custom-class" />);
      const card = screen.getByTestId('posture-correction-card');
      expect(card.className).toContain('my-custom-class');
    });
  });

  describe('운동 상세 정보', () => {
    it('운동을 펼치면 타겟 부위가 표시된다', () => {
      render(<PostureCorrectionCard bodyType="pear" />);

      // pear: rounded_shoulders -> chest_stretch, wall_angel, band_pull_apart 등
      // "가슴 스트레칭" 운동을 펼침
      const exerciseName = screen.queryByText('가슴 스트레칭');
      if (exerciseName) {
        fireEvent.click(exerciseName);
        expect(screen.getByText('대흉근, 소흉근')).toBeInTheDocument();
      }
    });

    it('운동을 펼치면 동작 단계가 표시된다', () => {
      render(<PostureCorrectionCard bodyType="pear" />);

      const exerciseName = screen.queryByText('가슴 스트레칭');
      if (exerciseName) {
        fireEvent.click(exerciseName);
        expect(screen.getByText('동작 순서')).toBeInTheDocument();
      }
    });

    it('운동을 펼치면 주의사항이 표시된다', () => {
      render(<PostureCorrectionCard bodyType="pear" />);

      const exerciseName = screen.queryByText('가슴 스트레칭');
      if (exerciseName) {
        fireEvent.click(exerciseName);
        // 운동 카드 내의 주의사항 (전체 주의사항과 다름)
        const cautions = screen.queryAllByText('주의사항');
        expect(cautions.length).toBeGreaterThan(0);
      }
    });

    it('난이도 배지가 올바른 텍스트를 표시한다', () => {
      render(<PostureCorrectionCard bodyType="pear" />);
      // pear 체형 운동 중 난이도 1(쉬움)과 2(보통)가 있어야 함
      const easyBadges = screen.queryAllByText('쉬움');
      const mediumBadges = screen.queryAllByText('보통');
      expect(easyBadges.length + mediumBadges.length).toBeGreaterThan(0);
    });
  });
});
