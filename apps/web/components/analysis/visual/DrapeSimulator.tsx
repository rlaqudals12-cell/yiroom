'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { DrapeSimulatorProps, DrapeResult, MetalType } from '@/types/visual-analysis';
import {
  analyzeFullPalette,
  getBestColors,
  applyDrapeColor,
  applyMetalReflectance,
  createOptimizedContext,
  getConstrainedCanvasSize,
  applyVignette,
  releaseCanvas,
} from '@/lib/analysis';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

/**
 * PC-1+ 드레이프 시뮬레이터
 * - 실시간 드레이프 미리보기
 * - 전체 팔레트 분석
 * - 베스트 컬러 추천
 */
export default function DrapeSimulator({
  image,
  faceMask,
  deviceCapability,
  metalType,
  onAnalysisComplete,
  skinInsight,
  externalSelectedColor,
  className,
}: DrapeSimulatorProps & { skinInsight?: string; externalSelectedColor?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [bestResults, setBestResults] = useState<DrapeResult[]>([]);
  const [worstResults, setWorstResults] = useState<DrapeResult[]>([]);

  /**
   * 단일 색상 미리보기
   */
  const previewDrape = useCallback(
    (color: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;

      const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
      if (!ctx) return;

      // 캔버스 크기 설정 (제한된 크기 사용)
      const { width, height } = getConstrainedCanvasSize(
        image.naturalWidth || image.width,
        image.naturalHeight || image.height
      );
      canvas.width = width;
      canvas.height = height;

      // 원본 이미지 그리기 (리사이징 적용)
      ctx.drawImage(image, 0, 0, width, height);

      // 드레이프 색상 적용
      applyDrapeColor(ctx, color, faceMask, canvas.height);

      // 금속 반사광 적용
      applyMetalReflectance(ctx, faceMask, metalType);

      // 비네팅 효과 (가장자리 부드럽게 어둡게)
      applyVignette(ctx, width, height, 0.3);

      setSelectedColor(color);
    },
    [image, faceMask, metalType]
  );

  /**
   * 전체 팔레트 분석
   */
  const runFullAnalysis = useCallback(async () => {
    if (!image || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // 색상 팔레트 생성
      const colors = generateColorPalette(deviceCapability.drapeColors);

      // 전체 분석 실행
      const results = await analyzeFullPalette(image, faceMask, colors, metalType, (progress) =>
        setAnalysisProgress(progress)
      );

      // 베스트 5 저장
      const best = getBestColors(results, 5);
      setBestResults(best);

      // 워스트 5 저장 (가장 어울리지 않는 색상)
      const worst = results.slice(-5).reverse();
      setWorstResults(worst);

      // 완료 콜백
      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }

      // 베스트 1 미리보기
      if (best.length > 0) {
        previewDrape(best[0].color);
      }
    } catch (error) {
      console.error('[DrapeSimulator] 분석 오류:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [
    image,
    faceMask,
    metalType,
    deviceCapability.drapeColors,
    isAnalyzing,
    onAnalysisComplete,
    previewDrape,
  ]);

  // 외부 색상 변경 시 미리보기 자동 적용
  useEffect(() => {
    if (externalSelectedColor && image && faceMask) {
      previewDrape(externalSelectedColor);
    }
  }, [externalSelectedColor, image, faceMask, previewDrape]);

  // 컴포넌트 언마운트 시 캔버스 정리
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        releaseCanvas(canvas);
      }
    };
  }, []);

  // 초기 이미지 표시
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = createOptimizedContext(canvas);
    if (!ctx) return;

    // 캔버스 크기 설정 (제한된 크기 사용)
    const { width, height } = getConstrainedCanvasSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height
    );
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    // 비네팅 효과 (가장자리 부드럽게 어둡게)
    applyVignette(ctx, width, height, 0.3);
  }, [image]);

  return (
    <div className={cn('space-y-3', className)} data-testid="drape-simulator">
      {/* 1. 이미지 - 높이 제한으로 버튼 항상 보이도록 */}
      <div className="relative w-full aspect-[3/4] max-h-[25vh] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          aria-label="드레이프 시뮬레이션"
        />

        {/* 분석 진행률 오버레이 */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
            <p className="text-sm font-medium">분석 중...</p>
            <Progress value={analysisProgress} className="w-3/4" />
            <p className="text-xs text-muted-foreground">{analysisProgress}%</p>
          </div>
        )}
      </div>

      {/* 2. 베스트 컬러 결과 (분석 완료 시 - 이미지 바로 아래) */}
      {bestResults.length > 0 && (
        <BestColorsSection
          results={bestResults}
          selectedColor={selectedColor}
          onColorSelect={previewDrape}
          skinInsight={skinInsight}
        />
      )}

      {/* 3. 베스트 vs 워스트 비교 (분석 완료 시) */}
      {bestResults.length > 0 && worstResults.length > 0 && (
        <ComparisonSection
          bestColor={bestResults[0].color}
          worstColor={worstResults[0].color}
          image={image}
          faceMask={faceMask}
          metalType={metalType}
        />
      )}

      {/* 4. 분석 버튼 */}
      <Button onClick={runFullAnalysis} disabled={isAnalyzing || !image} className="w-full">
        {isAnalyzing ? '분석 중...' : bestResults.length > 0 ? '다시 분석' : '전체 컬러 분석 시작'}
      </Button>
    </div>
  );
}

/**
 * 베스트 컬러 섹션
 */
function BestColorsSection({
  results,
  selectedColor,
  onColorSelect,
  skinInsight,
}: {
  results: DrapeResult[];
  selectedColor: string | null;
  onColorSelect: (color: string) => void;
  skinInsight?: string;
}) {
  const selectedIndex = results.findIndex((r) => r.color === selectedColor);
  const rank = selectedIndex >= 0 ? selectedIndex + 1 : 0;

  return (
    <div className="space-y-2" data-testid="best-colors-section">
      <h4 className="text-sm font-medium">베스트 컬러 TOP 5</h4>
      {skinInsight && <p className="text-xs text-muted-foreground">{skinInsight}</p>}
      <div className="flex gap-2">
        {results.map((result, index) => (
          <button
            key={result.color}
            onClick={() => onColorSelect(result.color)}
            className={cn(
              'relative w-12 h-12 rounded-lg border-2 transition-all',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary',
              selectedColor === result.color
                ? 'border-primary ring-2 ring-primary'
                : 'border-transparent'
            )}
            style={{ backgroundColor: result.color }}
            aria-label={`${index + 1}위 컬러 선택`}
          >
            <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {index + 1}
            </span>
          </button>
        ))}
      </div>

      {/* 선택된 색상 상세 */}
      {selectedColor && rank > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <div className="w-10 h-10 rounded border" style={{ backgroundColor: selectedColor }} />
          <div className="flex-1">
            <p className="text-sm font-medium">{getKoreanColorName(selectedColor)}</p>
            <p className="text-xs text-muted-foreground">
              어울림 {rank}위 {renderStars(rank)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 베스트 vs 워스트 비교 섹션
 * 캔버스로 두 색상을 나란히 렌더링하여 차이를 직관적으로 보여줌
 */
function ComparisonSection({
  bestColor,
  worstColor,
  image,
  faceMask,
  metalType,
}: {
  bestColor: string;
  worstColor: string;
  image: HTMLImageElement;
  faceMask: Uint8Array;
  metalType: MetalType;
}) {
  const bestCanvasRef = useRef<HTMLCanvasElement>(null);
  const worstCanvasRef = useRef<HTMLCanvasElement>(null);

  // 비교 캔버스에 드레이프 렌더링
  const renderToCanvas = useCallback(
    (canvas: HTMLCanvasElement | null, color: string) => {
      if (!canvas || !image) return;

      const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
      if (!ctx) return;

      const { width, height } = getConstrainedCanvasSize(
        image.naturalWidth || image.width,
        image.naturalHeight || image.height
      );
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, 0, 0, width, height);
      applyDrapeColor(ctx, color, faceMask, canvas.height);
      applyMetalReflectance(ctx, faceMask, metalType);
      applyVignette(ctx, width, height, 0.3);
    },
    [image, faceMask, metalType]
  );

  useEffect(() => {
    renderToCanvas(bestCanvasRef.current, bestColor);
    renderToCanvas(worstCanvasRef.current, worstColor);
  }, [bestColor, worstColor, renderToCanvas]);

  // 언마운트 시 캔버스 정리
  useEffect(() => {
    const bestCanvas = bestCanvasRef.current;
    const worstCanvas = worstCanvasRef.current;
    return () => {
      if (bestCanvas) releaseCanvas(bestCanvas);
      if (worstCanvas) releaseCanvas(worstCanvas);
    };
  }, []);

  return (
    <div className="space-y-2" data-testid="comparison-section">
      <h4 className="text-sm font-medium">어울리는 색 vs 피해야 할 색</h4>
      <div className="grid grid-cols-2 gap-3">
        {/* 베스트 1위 */}
        <div className="space-y-1.5">
          <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <canvas
              ref={bestCanvasRef}
              className="max-w-full max-h-full object-contain"
              aria-label="가장 어울리는 컬러 미리보기"
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded border flex-shrink-0"
              style={{ backgroundColor: bestColor }}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 truncate">
                {getKoreanColorName(bestColor)}
              </p>
              <p className="text-[10px] text-muted-foreground">가장 어울려요</p>
            </div>
          </div>
        </div>

        {/* 워스트 1위 */}
        <div className="space-y-1.5">
          <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <canvas
              ref={worstCanvasRef}
              className="max-w-full max-h-full object-contain"
              aria-label="피해야 할 컬러 미리보기"
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded border flex-shrink-0"
              style={{ backgroundColor: worstColor }}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-red-500 dark:text-red-400 truncate">
                {getKoreanColorName(worstColor)}
              </p>
              <p className="text-[10px] text-muted-foreground">피하는 게 좋아요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 순위에 따른 별점 표시 (1위=5개, 5위=1개)
function renderStars(rank: number): string {
  const filled = Math.max(1, 6 - rank);
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

// HEX → 한국어 색상명 변환 (HSL 기반)
function getKoreanColorName(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) / 255;

  // 무채색 판정
  if (s < 0.1) {
    if (l > 0.9) return '화이트';
    if (l > 0.7) return '라이트 그레이';
    if (l > 0.3) return '그레이';
    return '차콜';
  }

  // 색상(Hue) 계산
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }

  // 채도+명도에 따른 접두사
  const prefix = l > 0.75 ? '라이트 ' : l < 0.35 ? '딥 ' : '';

  // 색상명 매핑
  if (h < 15 || h >= 345) return `${prefix}레드`;
  if (h < 30) return `${prefix}코랄`;
  if (h < 45) return `${prefix}오렌지`;
  if (h < 60) return `${prefix}골드`;
  if (h < 75) return `${prefix}옐로`;
  if (h < 150) return `${prefix}그린`;
  if (h < 195) return `${prefix}민트`;
  if (h < 240) return `${prefix}블루`;
  if (h < 270) return `${prefix}퍼플`;
  if (h < 300) return `${prefix}바이올렛`;
  if (h < 330) return `${prefix}핑크`;
  return `${prefix}로즈`;
}

/**
 * 색상 팔레트 생성
 */
function generateColorPalette(count: 16 | 64 | 128): string[] {
  const baseColors = [
    // Spring
    '#FF7F50',
    '#FFCBA4',
    '#FA8072',
    '#FFFFF0',
    // Summer
    '#E6E6FA',
    '#FF007F',
    '#87CEEB',
    '#98FF98',
    // Autumn
    '#E2725B',
    '#808000',
    '#FFDB58',
    '#800020',
    // Winter
    '#FF00FF',
    '#4169E1',
    '#50C878',
    '#000000',
  ];

  if (count === 16) return baseColors;

  // 확장 색상 생성
  const extended: string[] = [];
  const variations = count / 16;

  baseColors.forEach((hex) => {
    extended.push(hex);
    for (let i = 1; i < variations; i++) {
      const factor = 1 - i * (0.6 / variations);
      extended.push(adjustBrightness(hex, factor));
    }
  });

  return extended.slice(0, count);
}

/**
 * 밝기 조정
 */
function adjustBrightness(hex: string, factor: number): string {
  const r = Math.round(Math.min(255, parseInt(hex.slice(1, 3), 16) * factor));
  const g = Math.round(Math.min(255, parseInt(hex.slice(3, 5), 16) * factor));
  const b = Math.round(Math.min(255, parseInt(hex.slice(5, 7), 16) * factor));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}
