/**
 * 헤어 컬러 시뮬레이션 엔진
 * @description 얼굴 랜드마크 기반 헤어 영역 HSL 색상 시프트
 *
 * 핵심 알고리즘:
 * 1. extractFaceLandmarks()로 468개 랜드마크 추출
 * 2. FACE_OVAL_INDICES로 얼굴 경계 생성
 * 3. 얼굴 위쪽 확장 영역 - 얼굴 내부 = 헤어 마스크
 * 4. 픽셀 필터링: 밝기(8-85%) + 채도(>5%)로 실제 머리카락만 선택
 * 5. HSL hue shift로 타겟 색상 적용
 * 6. 경계 페더링 (box blur)
 */

import { extractFaceLandmarks } from '@/lib/analysis/face-landmark';
import { FACE_OVAL_INDICES } from '@/lib/mock/visual-analysis';
import {
  getConstrainedCanvasSize,
  createOptimizedContext,
  rgbaToHsl,
  hslToRgba,
} from '@/lib/analysis/canvas-utils';
import type { HairColorConfig, HairColorResult } from './types';

/** 기본 헤어 컬러 강도 */
const DEFAULT_HAIR_INTENSITY = 0.6;
/** 기본 페더링 반경 */
const DEFAULT_FEATHER_RADIUS = 3;
/** 밝기 하한 (너무 어두운 픽셀 제외) */
const MIN_LIGHTNESS = 0.08;
/** 밝기 상한 (너무 밝은 픽셀 = 배경/피부) */
const MAX_LIGHTNESS = 0.85;
/** 최소 채도 (밝은 무채색 = 배경 가능성) */
const MIN_SATURATION = 0.05;

/** 헤어 영역 바운딩 박스 */
interface HairBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * 헤어 컬러 시뮬레이션 실행
 * @param image - 원본 이미지
 * @param config - 헤어 컬러 설정
 * @returns 시뮬레이션 결과 (dataUrl, 처리 시간)
 */
export async function applyHairColor(
  image: HTMLImageElement,
  config: HairColorConfig
): Promise<HairColorResult> {
  const startTime = performance.now();
  const intensity = config.intensity ?? DEFAULT_HAIR_INTENSITY;
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

  // 3. 얼굴 윤곽 포인트 추출
  const faceOvalPoints = FACE_OVAL_INDICES.map((idx) => ({
    x: Math.round(landmarks.landmarks[idx].x * width),
    y: Math.round(landmarks.landmarks[idx].y * height),
  }));

  // 4. 헤어 마스크 생성
  const { mask: hairMask, bounds: hairBounds } = createHairMask(faceOvalPoints, width, height);

  // 5. HSL hue shift 적용
  applyHueShift(ctx, hairMask, width, height, hairBounds, config.targetHsl, intensity);

  // 6. 경계 페더링
  if (featherRadius > 0) {
    applyHairFeathering(ctx, hairBounds, featherRadius);
  }

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    config,
    processingTimeMs,
  };
}

/**
 * 헤어 마스크 생성
 * 얼굴 윤곽 위쪽 확장 영역에서 얼굴 내부를 제외한 영역
 */
function createHairMask(
  faceOvalPoints: Array<{ x: number; y: number }>,
  width: number,
  height: number
): { mask: Uint8Array; bounds: HairBounds } {
  const mask = new Uint8Array(width * height);

  // 얼굴 바운딩 박스
  let fMinX = width;
  let fMinY = height;
  let fMaxX = 0;
  let fMaxY = 0;
  for (const p of faceOvalPoints) {
    fMinX = Math.min(fMinX, p.x);
    fMinY = Math.min(fMinY, p.y);
    fMaxX = Math.max(fMaxX, p.x);
    fMaxY = Math.max(fMaxY, p.y);
  }

  const faceWidth = fMaxX - fMinX;
  const faceHeight = fMaxY - fMinY;
  const faceCenterX = (fMinX + fMaxX) / 2;

  // 헤어 영역 범위
  // 위쪽: 얼굴 높이의 60% 위로 확장 (머리카락 영역)
  // 아래쪽: 이마선(얼굴 상단) + 30% 겹침
  // 좌우: 얼굴 너비의 15% 확장
  const hairTop = Math.max(0, Math.floor(fMinY - faceHeight * 0.6));
  const hairBottom = Math.min(height - 1, Math.floor(fMinY + faceHeight * 0.3));
  const sideExpand = faceWidth * 0.15;

  // 얼굴 내부 마스크 (scanline fill)
  const faceInterior = createFaceInteriorMask(faceOvalPoints, width, height);

  // 헤어 영역 바운딩 박스
  let hMinX = width;
  let hMaxX = 0;

  // 헤어 영역 마킹: 타원형 범위 내에서 얼굴 내부가 아닌 영역
  for (let y = hairTop; y <= hairBottom; y++) {
    const t = (y - hairTop) / (hairBottom - hairTop + 1);
    // 위쪽이 좁고 아래쪽(이마 쪽)이 넓은 타원형
    const xRadius = (faceWidth / 2 + sideExpand) * (0.7 + 0.3 * t);

    const startX = Math.max(0, Math.round(faceCenterX - xRadius));
    const endX = Math.min(width - 1, Math.round(faceCenterX + xRadius));

    for (let x = startX; x <= endX; x++) {
      const idx = y * width + x;
      if (faceInterior[idx] === 0) {
        mask[idx] = 255;
        hMinX = Math.min(hMinX, x);
        hMaxX = Math.max(hMaxX, x);
      }
    }
  }

  const bounds: HairBounds = {
    minX: Math.max(0, hMinX - DEFAULT_FEATHER_RADIUS * 2),
    minY: Math.max(0, hairTop - DEFAULT_FEATHER_RADIUS * 2),
    maxX: Math.min(width - 1, hMaxX + DEFAULT_FEATHER_RADIUS * 2),
    maxY: Math.min(height - 1, hairBottom + DEFAULT_FEATHER_RADIUS * 2),
  };

  return { mask, bounds };
}

/**
 * 얼굴 내부 마스크 생성 (scanline fill)
 * lip-engine.ts의 createLipMask와 동일 패턴
 */
function createFaceInteriorMask(
  points: Array<{ x: number; y: number }>,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  if (points.length < 3) return mask;

  let minY = height;
  let maxY = 0;
  for (const p of points) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  minY = Math.max(0, minY);
  maxY = Math.min(height - 1, maxY);

  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x);
        intersections.push(x);
      }
    }

    intersections.sort((a, b) => a - b);

    for (let i = 0; i < intersections.length - 1; i += 2) {
      const x1 = Math.max(0, Math.round(intersections[i]));
      const x2 = Math.min(width - 1, Math.round(intersections[i + 1]));

      for (let x = x1; x <= x2; x++) {
        mask[y * width + x] = 255;
      }
    }
  }

  return mask;
}

/**
 * HSL hue shift 적용
 * 마스크 영역 내 픽셀을 타겟 색상으로 부분 변환
 * 밝기/채도 필터로 실제 머리카락 픽셀만 변환
 */
function applyHueShift(
  ctx: CanvasRenderingContext2D,
  mask: Uint8Array,
  width: number,
  _height: number,
  bounds: HairBounds,
  targetHsl: { h: number; s: number; l: number },
  intensity: number
): void {
  const { minX, minY, maxX, maxY } = bounds;
  const regionWidth = maxX - minX + 1;
  const regionHeight = maxY - minY + 1;
  if (regionWidth <= 0 || regionHeight <= 0) return;

  const imageData = ctx.getImageData(minX, minY, regionWidth, regionHeight);
  const pixels = imageData.data;

  for (let y = 0; y < regionHeight; y++) {
    for (let x = 0; x < regionWidth; x++) {
      const maskIdx = (y + minY) * width + (x + minX);
      if (mask[maskIdx] === 0) continue;

      const pixelIdx = (y * regionWidth + x) * 4;
      const r = pixels[pixelIdx];
      const g = pixels[pixelIdx + 1];
      const b = pixels[pixelIdx + 2];

      const hsl = rgbaToHsl(r, g, b);

      // 밝기/채도 필터: 실제 머리카락인지 확인
      if (hsl.l < MIN_LIGHTNESS || hsl.l > MAX_LIGHTNESS) continue;
      // 밝은 무채색 = 배경 가능성 높음
      if (hsl.s < MIN_SATURATION && hsl.l > 0.3) continue;

      // 타겟 색상으로 부분 변환
      // hue: 완전히 타겟 방향으로
      // 채도: 약하게 변환 (자연스러운 질감 유지)
      // 명도: 최소한으로 변환 (원본 음영 유지)
      const newH = hsl.h + (targetHsl.h - hsl.h) * intensity;
      const newS = hsl.s + (targetHsl.s - hsl.s) * intensity * 0.7;
      const newL = hsl.l + (targetHsl.l - hsl.l) * intensity * 0.3;

      const rgb = hslToRgba(newH, newS, newL);
      pixels[pixelIdx] = rgb.r;
      pixels[pixelIdx + 1] = rgb.g;
      pixels[pixelIdx + 2] = rgb.b;
    }
  }

  ctx.putImageData(imageData, minX, minY);
}

/**
 * 헤어 영역 경계 페더링 (box blur)
 * lip-engine.ts의 applyFeathering과 동일 패턴
 */
function applyHairFeathering(
  ctx: CanvasRenderingContext2D,
  bounds: HairBounds,
  radius: number
): void {
  const rw = bounds.maxX - bounds.minX;
  const rh = bounds.maxY - bounds.minY;
  if (rw <= 0 || rh <= 0) return;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = rw;
  tempCanvas.height = rh;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // 원본 영역 복사
  tempCtx.drawImage(ctx.canvas, bounds.minX, bounds.minY, rw, rh, 0, 0, rw, rh);

  // 블러 적용
  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(tempCanvas, 0, 0);
  tempCtx.filter = 'none';

  // 블러된 영역을 원본에 덮어쓰기
  ctx.drawImage(tempCanvas, 0, 0, rw, rh, bounds.minX, bounds.minY, rw, rh);
}
