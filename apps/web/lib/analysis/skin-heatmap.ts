/**
 * 피부 히트맵 분석 모듈
 * @description S-1+ 광원 시뮬레이션 (멜라닌/헤모글로빈 분석)
 */

import type {
  FaceLandmark,
  PigmentMaps,
  PigmentAnalysisSummary,
  LightMode,
} from '@/types/visual-analysis';
import {
  createOptimizedContext,
  getHeatmapColor,
  rgbaToHsl,
  getConstrainedCanvasSize,
} from './canvas-utils';
import { createFaceMask, FACE_OVAL_INDICES } from './face-landmark';
import { releaseTypedArray, releaseCanvas } from './memory-manager';
import { generateMockPigmentAnalysis } from '@/lib/mock/visual-analysis';

// ============================================
// 상수 정의
// ============================================

/** 멜라닌 산출 계수 (Brown-Yellowness) */
const MELANIN_COEFF = { r: 0.333, g: 0.333, b: -0.666 };

/** 헤모글로빈 산출 계수 (Redness) */
const HEMOGLOBIN_COEFF = { r: 0.666, g: -0.333, b: -0.333 };

/** 피부 감지 HSL 범위 */
const SKIN_HUE_RANGE = { min: 0, max: 50 }; // 0-50도 (피부톤)
const SKIN_SAT_RANGE = { min: 0.1, max: 0.7 }; // 10-70%
const SKIN_LIGHT_RANGE = { min: 0.2, max: 0.85 }; // 20-85%

// ============================================
// 색소 분석 함수
// ============================================

/**
 * 이미지에서 색소 맵 분석
 * @param imageData - 이미지 데이터
 * @param faceMask - 얼굴 마스크 (피부 영역만)
 * @returns 멜라닌/헤모글로빈 맵
 */
export function analyzePigments(imageData: ImageData, faceMask: Uint8Array): PigmentMaps {
  const { width, height, data } = imageData;
  const pixelCount = width * height;

  // Float32Array로 색소 맵 생성
  const melaninMap = new Float32Array(pixelCount);
  const hemoglobinMap = new Float32Array(pixelCount);

  // 정규화를 위한 최소/최대값 추적
  let melaninMin = Infinity;
  let melaninMax = -Infinity;
  let hemoglobinMin = Infinity;
  let hemoglobinMax = -Infinity;

  // 1차 패스: 색소 값 계산
  for (let i = 0; i < pixelCount; i++) {
    // 마스크 영역만 처리
    if (faceMask[i] === 0) {
      melaninMap[i] = 0;
      hemoglobinMap[i] = 0;
      continue;
    }

    const idx = i * 4;
    const r = data[idx] / 255;
    const g = data[idx + 1] / 255;
    const b = data[idx + 2] / 255;

    // 피부 영역 검증 (HSL 범위 체크)
    const { h, s, l } = rgbaToHsl(data[idx], data[idx + 1], data[idx + 2]);
    const hue = h * 360;

    if (
      hue < SKIN_HUE_RANGE.min ||
      hue > SKIN_HUE_RANGE.max ||
      s < SKIN_SAT_RANGE.min ||
      s > SKIN_SAT_RANGE.max ||
      l < SKIN_LIGHT_RANGE.min ||
      l > SKIN_LIGHT_RANGE.max
    ) {
      melaninMap[i] = 0;
      hemoglobinMap[i] = 0;
      continue;
    }

    // 멜라닌 지수 계산 (갈색-노란색 성분)
    const melanin = r * MELANIN_COEFF.r + g * MELANIN_COEFF.g + b * MELANIN_COEFF.b;

    // 헤모글로빈 지수 계산 (붉은색 성분)
    const hemoglobin = r * HEMOGLOBIN_COEFF.r + g * HEMOGLOBIN_COEFF.g + b * HEMOGLOBIN_COEFF.b;

    melaninMap[i] = melanin;
    hemoglobinMap[i] = hemoglobin;

    // 최소/최대값 업데이트
    melaninMin = Math.min(melaninMin, melanin);
    melaninMax = Math.max(melaninMax, melanin);
    hemoglobinMin = Math.min(hemoglobinMin, hemoglobin);
    hemoglobinMax = Math.max(hemoglobinMax, hemoglobin);
  }

  // 2차 패스: 0-1 범위로 정규화
  const melaninRange = melaninMax - melaninMin || 1;
  const hemoglobinRange = hemoglobinMax - hemoglobinMin || 1;

  for (let i = 0; i < pixelCount; i++) {
    if (faceMask[i] === 0) continue;

    melaninMap[i] = (melaninMap[i] - melaninMin) / melaninRange;
    hemoglobinMap[i] = (hemoglobinMap[i] - hemoglobinMin) / hemoglobinRange;
  }

  return {
    melanin: melaninMap,
    hemoglobin: hemoglobinMap,
  };
}

/**
 * 색소 맵에서 요약 통계 생성 (DB 저장용)
 */
export function summarizePigments(
  pigmentMaps: PigmentMaps,
  faceMask: Uint8Array
): PigmentAnalysisSummary {
  const { melanin, hemoglobin } = pigmentMaps;
  const pixelCount = melanin.length;

  let melaninSum = 0;
  let hemoglobinSum = 0;
  let validPixels = 0;

  // 10구간 히스토그램
  const distribution = new Array(10).fill(0);

  for (let i = 0; i < pixelCount; i++) {
    if (faceMask[i] === 0) continue;

    melaninSum += melanin[i];
    hemoglobinSum += hemoglobin[i];
    validPixels++;

    // 멜라닌 기준 히스토그램
    const bin = Math.min(9, Math.floor(melanin[i] * 10));
    distribution[bin]++;
  }

  // 평균 계산
  const melaninAvg = validPixels > 0 ? melaninSum / validPixels : 0;
  const hemoglobinAvg = validPixels > 0 ? hemoglobinSum / validPixels : 0;

  // 분포 정규화 (비율로 변환)
  const totalDist = distribution.reduce((a, b) => a + b, 0) || 1;
  const normalizedDist = distribution.map((v) => Math.round((v / totalDist) * 100) / 100);

  return {
    melanin_avg: Math.round(melaninAvg * 100) / 100,
    hemoglobin_avg: Math.round(hemoglobinAvg * 100) / 100,
    distribution: normalizedDist,
  };
}

// ============================================
// 히트맵 렌더링
// ============================================

/**
 * 히트맵 오버레이 렌더링
 * @param canvas - 타겟 캔버스
 * @param originalImage - 원본 이미지
 * @param pigmentMaps - 색소 맵
 * @param faceMask - 얼굴 마스크
 * @param lightMode - 광원 모드
 * @param opacity - 히트맵 투명도 (0.0 ~ 1.0)
 */
export function renderHeatmapOverlay(
  canvas: HTMLCanvasElement,
  originalImage: HTMLImageElement,
  pigmentMaps: PigmentMaps,
  faceMask: Uint8Array,
  lightMode: LightMode,
  opacity: number = 0.6
): void {
  const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
  if (!ctx) return;

  // 캔버스 크기 제한 (28558px 같은 레이아웃 overflow 방지)
  const { width, height } = getConstrainedCanvasSize(
    originalImage.naturalWidth || originalImage.width,
    originalImage.naturalHeight || originalImage.height
  );
  canvas.width = width;
  canvas.height = height;

  // 원본 이미지 그리기 (스케일 적용)
  ctx.drawImage(originalImage, 0, 0, width, height);

  // normal 모드면 히트맵 없이 원본만
  if (lightMode === 'normal') {
    return;
  }

  // 히트맵 데이터 선택
  const colorScheme = getColorSchemeForMode(lightMode);
  const valueMap = lightMode === 'polarized' ? pigmentMaps.melanin : pigmentMaps.hemoglobin;

  // 피지(sebum) 모드는 멜라닌과 헤모글로빈 조합
  const combinedMap = lightMode === 'sebum' ? combineMapsForSebum(pigmentMaps) : valueMap;

  // 히트맵 오버레이 생성
  const overlayData = ctx.getImageData(0, 0, width, height);
  const pixels = overlayData.data;

  for (let i = 0; i < width * height; i++) {
    if (faceMask[i] === 0) continue;

    const value = combinedMap[i];
    const heatColor = getHeatmapColor(value, colorScheme);

    const idx = i * 4;
    const blendAlpha = opacity * (heatColor.a / 255);

    // Alpha 블렌딩
    pixels[idx] = Math.round(pixels[idx] * (1 - blendAlpha) + heatColor.r * blendAlpha);
    pixels[idx + 1] = Math.round(pixels[idx + 1] * (1 - blendAlpha) + heatColor.g * blendAlpha);
    pixels[idx + 2] = Math.round(pixels[idx + 2] * (1 - blendAlpha) + heatColor.b * blendAlpha);
  }

  ctx.putImageData(overlayData, 0, 0);
}

/**
 * 광원 모드별 색상 스키마 반환
 */
function getColorSchemeForMode(mode: LightMode): 'brown' | 'red' | 'yellow' {
  switch (mode) {
    case 'polarized':
      return 'brown'; // 멜라닌
    case 'uv':
      return 'red'; // 헤모글로빈
    case 'sebum':
      return 'yellow'; // 피지
    default:
      return 'brown';
  }
}

/**
 * 피지 모드용 맵 조합
 */
function combineMapsForSebum(pigmentMaps: PigmentMaps): Float32Array {
  const { melanin, hemoglobin } = pigmentMaps;
  const combined = new Float32Array(melanin.length);

  for (let i = 0; i < melanin.length; i++) {
    // 피지 = 밝기 기반 (멜라닌 역수 + 헤모글로빈 보정)
    combined[i] = Math.max(0, Math.min(1, (1 - melanin[i]) * 0.7 + hemoglobin[i] * 0.3));
  }

  return combined;
}

// ============================================
// 전체 분석 파이프라인
// ============================================

/**
 * 이미지에서 피부 색소 분석 전체 실행
 * @param image - 분석할 이미지
 * @param landmarks - 얼굴 랜드마크
 * @returns 색소 맵 및 요약
 */
export async function analyzeSkinPigments(
  image: HTMLImageElement,
  landmarks: FaceLandmark[]
): Promise<{
  pigmentMaps: PigmentMaps;
  summary: PigmentAnalysisSummary;
  faceMask: Uint8Array;
}> {
  try {
    // 임시 캔버스 생성 (크기 제한으로 레이아웃 overflow 방지)
    const canvas = document.createElement('canvas');
    const { width, height } = getConstrainedCanvasSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height
    );
    canvas.width = width;
    canvas.height = height;

    const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas 컨텍스트 생성 실패');
    }

    // 이미지 그리기 및 ImageData 추출 (스케일 적용)
    ctx.drawImage(image, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 얼굴 마스크 생성
    const faceMask = createFaceMask(landmarks, canvas.width, canvas.height);

    // 색소 분석
    const pigmentMaps = analyzePigments(imageData, faceMask);
    const summary = summarizePigments(pigmentMaps, faceMask);

    // 캔버스 정리
    releaseCanvas(canvas);

    return { pigmentMaps, summary, faceMask };
  } catch (error) {
    console.error('[SkinHeatmap] 분석 실패, Mock Fallback:', error);

    // Mock Fallback (제한된 크기 사용)
    const mockSummary = generateMockPigmentAnalysis();
    const constrainedSize = getConstrainedCanvasSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height
    );
    const pixelCount = constrainedSize.width * constrainedSize.height;

    return {
      pigmentMaps: {
        melanin: new Float32Array(pixelCount).fill(mockSummary.melanin_avg),
        hemoglobin: new Float32Array(pixelCount).fill(mockSummary.hemoglobin_avg),
      },
      summary: mockSummary,
      faceMask: new Uint8Array(pixelCount).fill(255),
    };
  }
}

// ============================================
// 메모리 정리
// ============================================

/**
 * 색소 맵 메모리 해제
 */
export function releasePigmentMaps(pigmentMaps: PigmentMaps | null): void {
  if (!pigmentMaps) return;

  releaseTypedArray(pigmentMaps.melanin);
  releaseTypedArray(pigmentMaps.hemoglobin);
}

/**
 * 얼굴 마스크 메모리 해제
 */
export function releaseFaceMask(faceMask: Uint8Array | null): void {
  releaseTypedArray(faceMask);
}

// ============================================
// 영역별 분석
// ============================================

/**
 * 특정 영역의 색소 평균 계산
 * @param pigmentMaps - 색소 맵
 * @param faceMask - 얼굴 마스크
 * @param landmarks - 랜드마크
 * @param region - 영역 ('forehead' | 'cheek_left' | 'cheek_right' | 'nose' | 'chin')
 * @param imageWidth - 이미지 너비
 * @param imageHeight - 이미지 높이
 */
export function analyzeRegion(
  pigmentMaps: PigmentMaps,
  faceMask: Uint8Array,
  landmarks: FaceLandmark[],
  region: 'forehead' | 'cheek_left' | 'cheek_right' | 'nose' | 'chin',
  imageWidth: number,
  imageHeight: number
): { melanin: number; hemoglobin: number } {
  // 영역별 대표 랜드마크 인덱스
  const regionIndices: Record<string, number[]> = {
    forehead: [10, 151, 108, 69], // 이마 상단
    cheek_left: [117, 118, 119, 120], // 왼쪽 볼
    cheek_right: [346, 347, 348, 349], // 오른쪽 볼
    nose: [1, 2, 98, 327], // 코
    chin: [152, 377, 400, 378], // 턱
  };

  const indices = regionIndices[region] || FACE_OVAL_INDICES;

  // 영역 중심 계산
  let centerX = 0;
  let centerY = 0;
  indices.forEach((idx) => {
    centerX += landmarks[idx].x * imageWidth;
    centerY += landmarks[idx].y * imageHeight;
  });
  centerX /= indices.length;
  centerY /= indices.length;

  // 중심 주변 샘플링 (반경 20px)
  const radius = 20;
  let melaninSum = 0;
  let hemoglobinSum = 0;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;

      const x = Math.round(centerX + dx);
      const y = Math.round(centerY + dy);

      if (x < 0 || x >= imageWidth || y < 0 || y >= imageHeight) continue;

      const idx = y * imageWidth + x;
      if (faceMask[idx] === 0) continue;

      melaninSum += pigmentMaps.melanin[idx];
      hemoglobinSum += pigmentMaps.hemoglobin[idx];
      count++;
    }
  }

  return {
    melanin: count > 0 ? Math.round((melaninSum / count) * 100) / 100 : 0,
    hemoglobin: count > 0 ? Math.round((hemoglobinSum / count) * 100) / 100 : 0,
  };
}
