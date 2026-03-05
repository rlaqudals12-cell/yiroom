/**
 * 블러셔 시뮬레이션 엔진
 * @description 광대뼈 영역에 블러셔 색상 블렌딩
 *
 * 알고리즘:
 * 1. 랜드마크에서 좌/우 광대뼈 영역 추출
 * 2. 타원형 그래디언트 마스크 생성 (중심→외곽 페이드아웃)
 * 3. 알파 블렌딩: pixel = original × (1 - α) + color × α
 */

import type { FaceLandmarkResult } from '@/types/visual-analysis';
import { extractFaceLandmarks } from '@/lib/analysis/face-landmark';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import type { MakeupConfig, MakeupResult, RgbaColor } from './types';

/** 기본 블러셔 강도 */
const DEFAULT_BLUSH_OPACITY = 0.3;

// MediaPipe 광대뼈 근처 랜드마크 인덱스
// 좌측 광대: 50, 101, 116, 117, 118, 119, 123
// 우측 광대: 280, 330, 345, 346, 347, 348, 352
const LEFT_CHEEK_CENTER_IDX = 116;
const RIGHT_CHEEK_CENTER_IDX = 345;
const LEFT_CHEEK_OUTER_IDX = 123;
const RIGHT_CHEEK_OUTER_IDX = 352;

/**
 * 블러셔 시뮬레이션 실행
 */
export async function applyBlush(
  image: HTMLImageElement,
  config: MakeupConfig
): Promise<MakeupResult> {
  const startTime = performance.now();
  const opacity = config.opacity ?? DEFAULT_BLUSH_OPACITY;

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

  // 3. 좌/우 광대뼈 영역에 블러셔 적용
  applyBlushToRegion(ctx, landmarks, width, height, config.color, opacity, 'left');
  applyBlushToRegion(ctx, landmarks, width, height, config.color, opacity, 'right');

  const processingTimeMs = Math.round(performance.now() - startTime);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    config,
    processingTimeMs,
  };
}

/**
 * 한쪽 광대뼈 영역에 블러셔 적용
 * 타원형 그래디언트로 자연스러운 페이드아웃
 */
function applyBlushToRegion(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkResult,
  width: number,
  height: number,
  color: RgbaColor,
  opacity: number,
  side: 'left' | 'right'
): void {
  const centerIdx = side === 'left' ? LEFT_CHEEK_CENTER_IDX : RIGHT_CHEEK_CENTER_IDX;
  const outerIdx = side === 'left' ? LEFT_CHEEK_OUTER_IDX : RIGHT_CHEEK_OUTER_IDX;

  const centerLm = landmarks.landmarks[centerIdx];
  const outerLm = landmarks.landmarks[outerIdx];

  const cx = centerLm.x * width;
  const cy = centerLm.y * height;

  // 타원 반경: 중심~외곽 거리의 1.2배
  const dx = Math.abs(outerLm.x * width - cx);
  const dy = Math.abs(outerLm.y * height - cy);
  const rx = Math.max(dx * 1.2, 15);
  const ry = Math.max(dy * 1.2, 10);

  // 바운딩 박스
  const minX = Math.max(0, Math.floor(cx - rx));
  const minY = Math.max(0, Math.floor(cy - ry));
  const maxX = Math.min(width - 1, Math.ceil(cx + rx));
  const maxY = Math.min(height - 1, Math.ceil(cy + ry));

  const rw = maxX - minX + 1;
  const rh = maxY - minY + 1;
  if (rw <= 0 || rh <= 0) return;

  const imageData = ctx.getImageData(minX, minY, rw, rh);
  const pixels = imageData.data;

  // 타원형 그래디언트 블렌딩
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const worldX = minX + x;
      const worldY = minY + y;

      // 타원 내부 거리 (0=중심, 1=경계)
      const normalizedDist = Math.pow((worldX - cx) / rx, 2) + Math.pow((worldY - cy) / ry, 2);

      if (normalizedDist > 1) continue;

      // 가우시안-like 페이드아웃
      const falloff = Math.exp(-normalizedDist * 3);
      const alpha = opacity * falloff;

      const pixelIdx = (y * rw + x) * 4;
      pixels[pixelIdx] = Math.round(pixels[pixelIdx] * (1 - alpha) + color.r * alpha);
      pixels[pixelIdx + 1] = Math.round(pixels[pixelIdx + 1] * (1 - alpha) + color.g * alpha);
      pixels[pixelIdx + 2] = Math.round(pixels[pixelIdx + 2] * (1 - alpha) + color.b * alpha);
    }
  }

  ctx.putImageData(imageData, minX, minY);
}
