/**
 * 파운데이션 시뮬레이션 엔진
 * @description 얼굴 전체에 파운데이션 셰이드 블렌딩
 *
 * 알고리즘:
 * 1. extractFaceLandmarks()로 468개 랜드마크 추출
 * 2. FACE_OVAL_INDICES로 얼굴 마스크 생성 (scanline fill)
 * 3. 눈/입 영역 제외 (자연스러운 결과)
 * 4. 저강도 알파 블렌딩 + 가장자리 페더링
 */

import type { FaceLandmarkResult } from '@/types/visual-analysis';
import {
  extractFaceLandmarks,
  FACE_OVAL_INDICES,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  LIPS_INDICES,
} from '@/lib/analysis/face-landmark';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import type { FoundationConfig, FoundationResult, RgbaColor } from './types';

/** 기본 파운데이션 강도 (자연스러운 커버) */
const DEFAULT_FOUNDATION_OPACITY = 0.25;
/** 기본 페더링 반경 */
const DEFAULT_FEATHER_RADIUS = 5;

/**
 * 파운데이션 시뮬레이션 실행
 * @param image - 원본 이미지
 * @param config - 파운데이션 설정
 * @returns 시뮬레이션 결과
 */
export async function applyFoundation(
  image: HTMLImageElement,
  config: FoundationConfig
): Promise<FoundationResult> {
  const startTime = performance.now();
  const opacity = config.opacity ?? DEFAULT_FOUNDATION_OPACITY;
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

  // 3. 얼굴 마스크 생성 및 블렌딩
  applyFoundationBlending(ctx, landmarks, width, height, config.color, opacity, featherRadius);

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    config,
    processingTimeMs,
  };
}

/**
 * 얼굴 전체에 파운데이션 블렌딩 적용
 * 눈/입 영역은 제외하고 가장자리에서 페이드아웃
 */
function applyFoundationBlending(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkResult,
  width: number,
  height: number,
  color: RgbaColor,
  opacity: number,
  featherRadius: number
): void {
  // 얼굴 윤곽 좌표
  const facePoints = FACE_OVAL_INDICES.map((idx) => ({
    x: Math.round(landmarks.landmarks[idx].x * width),
    y: Math.round(landmarks.landmarks[idx].y * height),
  }));

  // 바운딩 박스
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0;
  for (const p of facePoints) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const margin = featherRadius;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(width - 1, maxX + margin);
  maxY = Math.min(height - 1, maxY + margin);

  const rw = maxX - minX + 1;
  const rh = maxY - minY + 1;
  if (rw <= 0 || rh <= 0) return;

  // 얼굴 마스크 (scanline fill)
  const faceMask = createPolygonMask(facePoints, minX, minY, rw, rh);

  // 눈/입 제외 마스크
  const leftEyePoints = LEFT_EYE_INDICES.map((idx) => ({
    x: Math.round(landmarks.landmarks[idx].x * width),
    y: Math.round(landmarks.landmarks[idx].y * height),
  }));
  const rightEyePoints = RIGHT_EYE_INDICES.map((idx) => ({
    x: Math.round(landmarks.landmarks[idx].x * width),
    y: Math.round(landmarks.landmarks[idx].y * height),
  }));
  const lipPoints = LIPS_INDICES.map((idx) => ({
    x: Math.round(landmarks.landmarks[idx].x * width),
    y: Math.round(landmarks.landmarks[idx].y * height),
  }));

  const leftEyeMask = createPolygonMask(leftEyePoints, minX, minY, rw, rh);
  const rightEyeMask = createPolygonMask(rightEyePoints, minX, minY, rw, rh);
  const lipMask = createPolygonMask(lipPoints, minX, minY, rw, rh);

  // 얼굴 중심 좌표 (페이드아웃 기준)
  const faceCenterX = (minX + maxX) / 2;
  const faceCenterY = (minY + maxY) / 2;
  const faceRadiusX = (maxX - minX) / 2;
  const faceRadiusY = (maxY - minY) / 2;

  const imageData = ctx.getImageData(minX, minY, rw, rh);
  const pixels = imageData.data;

  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const maskIdx = y * rw + x;

      // 얼굴 영역 밖: 건너뜀
      if (faceMask[maskIdx] === 0) continue;

      // 눈/입 영역: 건너뜀
      if (leftEyeMask[maskIdx] > 0 || rightEyeMask[maskIdx] > 0 || lipMask[maskIdx] > 0) continue;

      // 가장자리 페이드아웃: 얼굴 윤곽에 가까울수록 투명
      const worldX = minX + x;
      const worldY = minY + y;
      const normalizedDist = Math.sqrt(
        Math.pow((worldX - faceCenterX) / faceRadiusX, 2) +
          Math.pow((worldY - faceCenterY) / faceRadiusY, 2)
      );

      // 0.7 이내 = 풀 커버, 0.7~1.0 = 페이드아웃
      let edgeFalloff = 1.0;
      if (normalizedDist > 0.7) {
        edgeFalloff = Math.max(0, 1.0 - (normalizedDist - 0.7) / 0.3);
        edgeFalloff = edgeFalloff * edgeFalloff; // 부드러운 커브
      }

      const alpha = opacity * edgeFalloff;
      if (alpha < 0.005) continue;

      const pixelIdx = (y * rw + x) * 4;
      pixels[pixelIdx] = Math.round(pixels[pixelIdx] * (1 - alpha) + color.r * alpha);
      pixels[pixelIdx + 1] = Math.round(pixels[pixelIdx + 1] * (1 - alpha) + color.g * alpha);
      pixels[pixelIdx + 2] = Math.round(pixels[pixelIdx + 2] * (1 - alpha) + color.b * alpha);
    }
  }

  ctx.putImageData(imageData, minX, minY);
}

/**
 * Scanline fill로 다각형 마스크 생성
 * lip-engine.ts의 createLipMask 패턴 재사용
 */
function createPolygonMask(
  points: Array<{ x: number; y: number }>,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  if (points.length < 3) return mask;

  const localPoints = points.map((p) => ({
    x: p.x - offsetX,
    y: p.y - offsetY,
  }));

  let minY = height;
  let maxY = 0;
  for (const p of localPoints) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  minY = Math.max(0, minY);
  maxY = Math.min(height - 1, maxY);

  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];

    for (let i = 0; i < localPoints.length; i++) {
      const p1 = localPoints[i];
      const p2 = localPoints[(i + 1) % localPoints.length];

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
