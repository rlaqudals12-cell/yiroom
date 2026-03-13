/**
 * 아이섀도 시뮬레이션 엔진
 * @description 눈꺼풀 영역에 아이섀도 색상 블렌딩
 *
 * 알고리즘:
 * 1. extractFaceLandmarks()로 468개 랜드마크 추출
 * 2. LEFT_EYE_INDICES / RIGHT_EYE_INDICES로 눈 영역 마스크 생성
 * 3. 눈꺼풀 상부 영역에 그래디언트 블렌딩
 * 4. 듀얼 컬러(선택) 지원: 내측/외측 다른 색상
 */

import type { FaceLandmarkResult } from '@/types/visual-analysis';
import {
  extractFaceLandmarks,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
} from '@/lib/analysis/face-landmark';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import type { EyeshadowConfig, EyeshadowResult, RgbaColor } from './types';

/** 기본 아이섀도 강도 */
const DEFAULT_EYESHADOW_OPACITY = 0.4;
/** 기본 페더링 반경 */
const DEFAULT_FEATHER_RADIUS = 3;

// 눈썹 근처 랜드마크 (위쪽 확장용)
// 좌측 눈썹: 70, 63, 105, 66, 107
// 우측 눈썹: 300, 293, 334, 296, 336
const LEFT_BROW_INDICES = [70, 63, 105, 66, 107];
const RIGHT_BROW_INDICES = [300, 293, 334, 296, 336];

/**
 * 아이섀도 시뮬레이션 실행
 * @param image - 원본 이미지
 * @param config - 아이섀도 설정
 * @returns 시뮬레이션 결과
 */
export async function applyEyeshadow(
  image: HTMLImageElement,
  config: EyeshadowConfig
): Promise<EyeshadowResult> {
  const startTime = performance.now();
  const opacity = config.opacity ?? DEFAULT_EYESHADOW_OPACITY;
  const featherRadius = config.featherRadius ?? DEFAULT_FEATHER_RADIUS;

  // 1. 랜드마크 추출
  const landmarks = await extractFaceLandmarks(image);
  if (!landmarks) {
    throw new Error('얼굴을 감지할 수 없습니다. 정면 사진을 사용해주세요.');
  }

  // 2. 캔버스 준비
  const { width, height } = getConstrainedCanvasSize(image.naturalWidth, image.naturalHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = createOptimizedContext(canvas);
  if (!ctx) {
    throw new Error('Canvas 초기화에 실패했습니다.');
  }

  ctx.drawImage(image, 0, 0, width, height);

  // 3. 좌/우 눈꺼풀에 아이섀도 적용
  const primaryColor = config.color;
  const secondaryColor = config.secondaryColor ?? null;

  applyEyeshadowToEye(
    ctx,
    landmarks,
    width,
    height,
    primaryColor,
    secondaryColor,
    opacity,
    featherRadius,
    LEFT_EYE_INDICES,
    LEFT_BROW_INDICES
  );
  applyEyeshadowToEye(
    ctx,
    landmarks,
    width,
    height,
    primaryColor,
    secondaryColor,
    opacity,
    featherRadius,
    RIGHT_EYE_INDICES,
    RIGHT_BROW_INDICES
  );

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    config,
    processingTimeMs,
  };
}

/**
 * 한쪽 눈꺼풀에 아이섀도 적용
 * 눈 상단~눈썹 하단 사이에 그래디언트 블렌딩
 */
function applyEyeshadowToEye(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkResult,
  width: number,
  height: number,
  primaryColor: RgbaColor,
  secondaryColor: RgbaColor | null,
  opacity: number,
  featherRadius: number,
  eyeIndices: number[],
  browIndices: number[]
): void {
  // 눈 꼭짓점 좌표
  const eyePoints = eyeIndices.map((idx) => ({
    x: landmarks.landmarks[idx].x * width,
    y: landmarks.landmarks[idx].y * height,
  }));

  // 눈썹 좌표
  const browPoints = browIndices.map((idx) => ({
    x: landmarks.landmarks[idx].x * width,
    y: landmarks.landmarks[idx].y * height,
  }));

  const bounds = computeEyeBounds(eyePoints, browPoints, width, height, featherRadius);
  if (!bounds) return;

  const { eyeMinX, eyeMaxX, eyeMinY, eyeMaxY, shadowTopY, regionMinX, regionMinY, rw, rh } = bounds;

  const imageData = ctx.getImageData(regionMinX, regionMinY, rw, rh);
  const pixels = imageData.data;

  blendEyeshadowPixels(
    pixels,
    rw,
    rh,
    regionMinX,
    regionMinY,
    eyeMinX,
    eyeMaxX,
    eyeMinY,
    eyeMaxY,
    shadowTopY,
    opacity,
    featherRadius,
    primaryColor,
    secondaryColor
  );

  ctx.putImageData(imageData, regionMinX, regionMinY);
}

/** 눈 영역 바운딩 박스 및 아이섀도 영역 계산 */
function computeEyeBounds(
  eyePoints: Array<{ x: number; y: number }>,
  browPoints: Array<{ x: number; y: number }>,
  width: number,
  height: number,
  featherRadius: number
): {
  eyeMinX: number;
  eyeMaxX: number;
  eyeMinY: number;
  eyeMaxY: number;
  shadowTopY: number;
  regionMinX: number;
  regionMinY: number;
  rw: number;
  rh: number;
} | null {
  let eyeMinX = width,
    eyeMaxX = 0;
  let eyeMinY = height,
    eyeMaxY = 0;
  for (const p of eyePoints) {
    eyeMinX = Math.min(eyeMinX, p.x);
    eyeMaxX = Math.max(eyeMaxX, p.x);
    eyeMinY = Math.min(eyeMinY, p.y);
    eyeMaxY = Math.max(eyeMaxY, p.y);
  }

  // 눈썹 최소 Y (아이섀도 상단 경계)
  let browMinY = height;
  for (const p of browPoints) {
    browMinY = Math.min(browMinY, p.y);
  }

  // 아이섀도 영역: 눈 상단 ~ 눈썹 하단
  const eyeTopY = eyeMinY;
  const shadowTopY = browMinY + (eyeTopY - browMinY) * 0.3; // 눈썹에서 30% 떨어진 지점

  const margin = featherRadius * 2;
  const regionMinX = Math.max(0, Math.floor(eyeMinX - margin));
  const regionMinY = Math.max(0, Math.floor(shadowTopY - margin));
  const regionMaxX = Math.min(width - 1, Math.ceil(eyeMaxX + margin));
  const regionMaxY = Math.min(height - 1, Math.ceil(eyeMaxY));

  const rw = regionMaxX - regionMinX + 1;
  const rh = regionMaxY - regionMinY + 1;
  if (rw <= 0 || rh <= 0) return null;

  return { eyeMinX, eyeMaxX, eyeMinY, eyeMaxY, shadowTopY, regionMinX, regionMinY, rw, rh };
}

/** 수평 페이드: 양 끝에서 페이드아웃 계산 */
function computeHorizontalFalloff(
  worldX: number,
  eyeMinX: number,
  eyeMaxX: number,
  featherRadius: number
): number {
  const distFromLeft = worldX - eyeMinX;
  if (distFromLeft < featherRadius) return Math.max(0, distFromLeft / featherRadius);
  const distFromRight = eyeMaxX - worldX;
  if (distFromRight < featherRadius) return Math.max(0, distFromRight / featherRadius);
  return 1.0;
}

/** 듀얼 컬러 보간: 내측 primaryColor, 외측 secondaryColor */
function interpolateDualColor(
  worldX: number,
  eyeMinX: number,
  eyeMaxX: number,
  primaryColor: RgbaColor,
  secondaryColor: RgbaColor
): RgbaColor {
  const horizontalT = (worldX - eyeMinX) / (eyeMaxX - eyeMinX);
  if (horizontalT <= 0.5) return primaryColor;
  const blendT = (horizontalT - 0.5) * 2;
  return {
    r: Math.round(primaryColor.r * (1 - blendT) + secondaryColor.r * blendT),
    g: Math.round(primaryColor.g * (1 - blendT) + secondaryColor.g * blendT),
    b: Math.round(primaryColor.b * (1 - blendT) + secondaryColor.b * blendT),
    a: 1,
  };
}

/** 단일 행 아이섀도 블렌딩 */
function blendEyeshadowRow(
  pixels: Uint8ClampedArray,
  y: number,
  rw: number,
  regionMinX: number,
  eyeMinX: number,
  eyeMaxX: number,
  opacity: number,
  verticalFalloff: number,
  featherRadius: number,
  primaryColor: RgbaColor,
  secondaryColor: RgbaColor | null
): void {
  for (let x = 0; x < rw; x++) {
    const worldX = regionMinX + x;
    if (worldX < eyeMinX - featherRadius || worldX > eyeMaxX + featherRadius) continue;

    const horizontalFalloff = computeHorizontalFalloff(worldX, eyeMinX, eyeMaxX, featherRadius);
    const alpha = opacity * verticalFalloff * horizontalFalloff;
    if (alpha < 0.01) continue;

    const color = secondaryColor
      ? interpolateDualColor(worldX, eyeMinX, eyeMaxX, primaryColor, secondaryColor)
      : primaryColor;

    const pixelIdx = (y * rw + x) * 4;
    pixels[pixelIdx] = Math.round(pixels[pixelIdx] * (1 - alpha) + color.r * alpha);
    pixels[pixelIdx + 1] = Math.round(pixels[pixelIdx + 1] * (1 - alpha) + color.g * alpha);
    pixels[pixelIdx + 2] = Math.round(pixels[pixelIdx + 2] * (1 - alpha) + color.b * alpha);
  }
}

/** 아이섀도 픽셀 블렌딩 루프 */
function blendEyeshadowPixels(
  pixels: Uint8ClampedArray,
  rw: number,
  rh: number,
  regionMinX: number,
  regionMinY: number,
  eyeMinX: number,
  eyeMaxX: number,
  eyeMinY: number,
  _eyeMaxY: number,
  shadowTopY: number,
  opacity: number,
  featherRadius: number,
  primaryColor: RgbaColor,
  secondaryColor: RgbaColor | null
): void {
  const lidTop = shadowTopY;
  const lidBottom = eyeMinY;
  const lidHeight = lidBottom - lidTop;
  if (lidHeight <= 0) return;

  for (let y = 0; y < rh; y++) {
    const worldY = regionMinY + y;
    if (worldY < lidTop || worldY > lidBottom) continue;

    // 수직 그래디언트: 아래(눈 경계)가 진하고 위(눈썹)로 갈수록 연해짐
    const verticalT = (worldY - lidTop) / lidHeight;
    const verticalFalloff = verticalT * verticalT;

    blendEyeshadowRow(
      pixels,
      y,
      rw,
      regionMinX,
      eyeMinX,
      eyeMaxX,
      opacity,
      verticalFalloff,
      featherRadius,
      primaryColor,
      secondaryColor
    );
  }
}
