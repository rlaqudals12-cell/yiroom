/**
 * 드레이프 반사광 효과 모듈
 * @description PC-1+ 드레이핑 시뮬레이션 - 반사광 및 균일도 측정
 */

import type { MetalType, ReflectanceConfig, DrapeResult } from '@/types/visual-analysis';
import { rgbaToHsl, hslToRgba, createOptimizedContext } from './canvas-utils';

// ============================================
// 금속 반사광 설정
// ============================================

/**
 * 금속별 반사광 설정
 * - 실버: 쿨톤 강조 (밝게 + 채도 낮춤)
 * - 골드: 웜톤 강조 (약간 밝게 + 채도 높임)
 */
export const METAL_REFLECTANCE: Record<MetalType, ReflectanceConfig> = {
  silver: { brightness: +10, saturation: -5 },
  gold: { brightness: +5, saturation: +5 },
};

// ============================================
// 반사광 적용
// ============================================

/**
 * 얼굴 영역에 반사광 효과 적용
 * @param ctx - Canvas 2D 컨텍스트
 * @param faceMask - 얼굴 마스크
 * @param config - 반사광 설정
 */
export function applyReflectance(
  ctx: CanvasRenderingContext2D,
  faceMask: Uint8Array,
  config: ReflectanceConfig
): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    if (faceMask[pixelIndex] === 0) continue;

    // RGB → HSL 변환
    const { h, s, l } = rgbaToHsl(data[i], data[i + 1], data[i + 2]);

    // 밝기/채도 조정
    const newL = Math.max(0, Math.min(1, l + config.brightness / 100));
    const newS = Math.max(0, Math.min(1, s + config.saturation / 100));

    // HSL → RGB 변환
    const { r, g, b } = hslToRgba(h, newS, newL);

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * 금속 타입에 따른 반사광 적용
 */
export function applyMetalReflectance(
  ctx: CanvasRenderingContext2D,
  faceMask: Uint8Array,
  metalType: MetalType
): void {
  applyReflectance(ctx, faceMask, METAL_REFLECTANCE[metalType]);
}

// ============================================
// 드레이프 색상 적용
// ============================================

/**
 * 드레이프 색상을 얼굴 하단에 적용
 * @param ctx - Canvas 2D 컨텍스트
 * @param drapeColor - 드레이프 색상 (HEX)
 * @param faceMask - 얼굴 마스크
 * @param canvasHeight - 캔버스 높이
 */
export function applyDrapeColor(
  ctx: CanvasRenderingContext2D,
  drapeColor: string,
  faceMask: Uint8Array,
  canvasHeight: number
): void {
  const canvasWidth = ctx.canvas.width;

  // HEX → RGB 변환
  const r = parseInt(drapeColor.slice(1, 3), 16);
  const g = parseInt(drapeColor.slice(3, 5), 16);
  const b = parseInt(drapeColor.slice(5, 7), 16);

  // 드레이프 영역 (하단 30%)
  const drapeStartY = Math.floor(canvasHeight * 0.7);

  // 드레이프 색상 적용
  const imageData = ctx.getImageData(0, drapeStartY, canvasWidth, canvasHeight - drapeStartY);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const localY = Math.floor(i / 4 / canvasWidth);
    const globalY = drapeStartY + localY;
    const x = (i / 4) % canvasWidth;
    const pixelIndex = globalY * canvasWidth + x;

    // 마스크 영역 외부만 드레이프 적용
    if (faceMask[pixelIndex] === 0) {
      // 블렌딩 (드레이프 색상 80%)
      data[i] = Math.round(data[i] * 0.2 + r * 0.8);
      data[i + 1] = Math.round(data[i + 1] * 0.2 + g * 0.8);
      data[i + 2] = Math.round(data[i + 2] * 0.2 + b * 0.8);
    }
  }

  ctx.putImageData(imageData, 0, drapeStartY);
}

// ============================================
// 균일도 측정
// ============================================

/**
 * 피부톤 균일도 측정 (표준편차 기반)
 * - 낮을수록 균일함 = 해당 색상이 잘 어울림
 * @param imageData - 이미지 데이터
 * @param faceMask - 얼굴 마스크
 * @returns 균일도 점수 (0~100, 낮을수록 좋음)
 */
export function measureUniformity(imageData: ImageData, faceMask: Uint8Array): number {
  const luminances: number[] = [];
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    if (faceMask[pixelIndex] === 0) continue;

    // 휘도 계산 (ITU-R BT.601)
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luminances.push(luminance);
  }

  if (luminances.length === 0) return 100;

  // 평균 계산
  const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;

  // 표준편차 계산
  const variance = luminances.reduce((sum, val) => sum + (val - mean) ** 2, 0) / luminances.length;
  const stdDev = Math.sqrt(variance);

  // 0-100 범위로 정규화 (표준편차 0~50 → 점수 0~100)
  return Math.min(100, Math.round(stdDev * 2));
}

// ============================================
// 드레이프 분석 파이프라인
// ============================================

/**
 * 단일 드레이프 색상 분석
 */
export function analyzeSingleDrape(
  originalImage: HTMLImageElement,
  faceMask: Uint8Array,
  drapeColor: string,
  metalType: MetalType
): number {
  // 임시 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = originalImage.naturalWidth || originalImage.width;
  canvas.height = originalImage.naturalHeight || originalImage.height;

  const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
  if (!ctx) return 100;

  // 원본 이미지 그리기
  ctx.drawImage(originalImage, 0, 0);

  // 드레이프 색상 적용
  applyDrapeColor(ctx, drapeColor, faceMask, canvas.height);

  // 금속 반사광 적용
  applyMetalReflectance(ctx, faceMask, metalType);

  // 균일도 측정
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const uniformity = measureUniformity(imageData, faceMask);

  // 캔버스 정리
  canvas.width = 0;
  canvas.height = 0;

  return uniformity;
}

/**
 * 전체 드레이프 팔레트 분석
 * @param originalImage - 원본 이미지
 * @param faceMask - 얼굴 마스크
 * @param colors - 분석할 색상 배열
 * @param metalType - 금속 타입
 * @param onProgress - 진행률 콜백
 * @returns 드레이프 결과 배열 (균일도 오름차순 정렬)
 */
export async function analyzeFullPalette(
  originalImage: HTMLImageElement,
  faceMask: Uint8Array,
  colors: string[],
  metalType: MetalType,
  onProgress?: (progress: number) => void
): Promise<DrapeResult[]> {
  const results: DrapeResult[] = [];

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    const uniformity = analyzeSingleDrape(originalImage, faceMask, color, metalType);

    results.push({
      color,
      uniformity,
      rank: 0, // 나중에 설정
    });

    // 진행률 콜백
    if (onProgress) {
      onProgress(Math.round(((i + 1) / colors.length) * 100));
    }

    // UI 블로킹 방지 (10개마다 yield)
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // 균일도 기준 정렬 (낮을수록 좋음)
  results.sort((a, b) => a.uniformity - b.uniformity);

  // 순위 설정
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  return results;
}

/**
 * 베스트 TOP N 색상 추출
 */
export function getBestColors(results: DrapeResult[], topN: number = 5): DrapeResult[] {
  return results.slice(0, topN);
}

/**
 * 드레이프 결과를 DB 저장용 형식으로 변환
 */
export function drapeResultsToDbFormat(
  results: DrapeResult[],
  metalType: MetalType
): {
  best_colors: string[];
  uniformity_scores: Record<string, number>;
  metal_test: MetalType;
} {
  const bestColors = getBestColors(results);

  return {
    best_colors: bestColors.map((r) => r.color),
    uniformity_scores: Object.fromEntries(bestColors.map((r) => [r.color, r.uniformity])),
    metal_test: metalType,
  };
}
