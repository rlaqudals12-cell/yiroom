/**
 * 립스틱 시뮬레이션 엔진
 * @description 얼굴 랜드마크 기반 입술 영역에 색상 블렌딩
 *
 * 핵심 알고리즘:
 * 1. extractFaceLandmarks()로 468개 랜드마크 추출
 * 2. LIPS_INDICES로 입술 마스크 생성 (scanline fill)
 * 3. 마스크 영역에 알파 블렌딩: pixel = original × (1 - α) + color × α
 * 4. 가우시안 블러로 경계 페더링
 */

import type { FaceLandmarkResult } from '@/types/visual-analysis';
import { extractFaceLandmarks, LIPS_INDICES } from '@/lib/analysis/face-landmark';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import type { MakeupConfig, MakeupResult, RgbaColor } from './types';

/** 기본 립스틱 강도 */
const DEFAULT_LIP_OPACITY = 0.55;
/** 기본 페더링 반경 */
const DEFAULT_FEATHER_RADIUS = 2;

/**
 * 립스틱 시뮬레이션 실행
 * @param image - 원본 이미지
 * @param config - 메이크업 설정
 * @returns 시뮬레이션 결과 (dataUrl, 처리 시간)
 */
export async function applyLipColor(
  image: HTMLImageElement,
  config: MakeupConfig
): Promise<MakeupResult> {
  const startTime = performance.now();
  const opacity = config.opacity ?? DEFAULT_LIP_OPACITY;
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

  // 원본 이미지 그리기
  ctx.drawImage(image, 0, 0, width, height);

  // 3. 입술 마스크 생성 + 블렌딩
  applyLipBlending(ctx, landmarks, width, height, config.color, opacity);

  // 4. 경계 페더링
  if (featherRadius > 0) {
    applyFeathering(ctx, landmarks, width, height, featherRadius);
  }

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    config,
    processingTimeMs,
  };
}

/**
 * 입술 영역에 색상 블렌딩 적용
 * 알파 블렌딩 공식: output = original × (1 - α) + color × α
 */
function applyLipBlending(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkResult,
  width: number,
  height: number,
  color: RgbaColor,
  opacity: number
): void {
  // 입술 영역 바운딩 박스 계산
  const lipPoints = LIPS_INDICES.map((idx) => ({
    x: Math.round(landmarks.landmarks[idx].x * width),
    y: Math.round(landmarks.landmarks[idx].y * height),
  }));

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const p of lipPoints) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  // 여유 마진
  const margin = 4;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(width - 1, maxX + margin);
  maxY = Math.min(height - 1, maxY + margin);

  const regionWidth = maxX - minX + 1;
  const regionHeight = maxY - minY + 1;
  if (regionWidth <= 0 || regionHeight <= 0) return;

  // 입술 마스크 생성 (scanline fill)
  const mask = createLipMask(lipPoints, minX, minY, regionWidth, regionHeight);

  // 바운딩 박스 영역 픽셀 읽기
  const imageData = ctx.getImageData(minX, minY, regionWidth, regionHeight);
  const pixels = imageData.data;

  // 알파 블렌딩 적용
  for (let y = 0; y < regionHeight; y++) {
    for (let x = 0; x < regionWidth; x++) {
      const maskIdx = y * regionWidth + x;
      if (mask[maskIdx] === 0) continue;

      // 마스크 강도에 따른 실제 알파
      const maskAlpha = (mask[maskIdx] / 255) * opacity;
      const pixelIdx = (y * regionWidth + x) * 4;

      pixels[pixelIdx] = Math.round(pixels[pixelIdx] * (1 - maskAlpha) + color.r * maskAlpha);
      pixels[pixelIdx + 1] = Math.round(
        pixels[pixelIdx + 1] * (1 - maskAlpha) + color.g * maskAlpha
      );
      pixels[pixelIdx + 2] = Math.round(
        pixels[pixelIdx + 2] * (1 - maskAlpha) + color.b * maskAlpha
      );
    }
  }

  ctx.putImageData(imageData, minX, minY);
}

/**
 * Scanline fill로 입술 마스크 생성
 * face-landmark.ts의 fillPolygon 패턴 재사용
 */
function createLipMask(
  points: Array<{ x: number; y: number }>,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  if (points.length < 3) return mask;

  // 로컬 좌표로 변환
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

  // 각 스캔라인 처리
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

/**
 * 경계 페더링 (단순 box blur)
 * 입술 영역 경계를 자연스럽게 블렌딩
 */
function applyFeathering(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkResult,
  width: number,
  height: number,
  radius: number
): void {
  // 입술 영역만 블러 적용 (전체 이미지 블러 방지)
  const lipPoints = LIPS_INDICES.map((idx) => ({
    x: landmarks.landmarks[idx].x * width,
    y: landmarks.landmarks[idx].y * height,
  }));

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const p of lipPoints) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  const expand = radius * 2;
  minX = Math.max(0, Math.floor(minX) - expand);
  minY = Math.max(0, Math.floor(minY) - expand);
  maxX = Math.min(width, Math.ceil(maxX) + expand);
  maxY = Math.min(height, Math.ceil(maxY) + expand);

  const rw = maxX - minX;
  const rh = maxY - minY;
  if (rw <= 0 || rh <= 0) return;

  // CSS filter로 box blur 적용 (경량)
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = rw;
  tempCanvas.height = rh;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // 원본 영역 복사
  tempCtx.drawImage(canvas(ctx), minX, minY, rw, rh, 0, 0, rw, rh);

  // 블러 적용
  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(tempCanvas, 0, 0);
  tempCtx.filter = 'none';

  // 블러된 영역을 원본에 덮어쓰기
  ctx.drawImage(tempCanvas, 0, 0, rw, rh, minX, minY, rw, rh);
}

/** ctx에서 canvas 추출 헬퍼 */
function canvas(ctx: CanvasRenderingContext2D): HTMLCanvasElement {
  return ctx.canvas;
}
