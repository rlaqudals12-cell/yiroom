/**
 * Canvas 최적화 유틸리티
 * @description Canvas 렌더링 최적화 및 이미지 처리 유틸
 */

// 캔버스 최대 해상도 (레이아웃 overflow 방지, 성능과 품질 균형)
// - 폰 카메라 이미지가 4032x5376px 등 매우 클 수 있음
// - 이를 그대로 사용하면 28558px 같은 레이아웃 문제 발생
export const MAX_CANVAS_SIZE = 1024;

/**
 * 이미지 비율을 유지하면서 캔버스 크기 계산 (최대 크기 제한)
 * @param originalWidth - 원본 이미지 너비
 * @param originalHeight - 원본 이미지 높이
 * @param maxSize - 최대 허용 크기 (기본값: MAX_CANVAS_SIZE)
 * @returns 제한된 크기와 스케일 비율
 */
export function getConstrainedCanvasSize(
  originalWidth: number,
  originalHeight: number,
  maxSize: number = MAX_CANVAS_SIZE
): { width: number; height: number; scale: number } {
  const safeWidth = originalWidth || 400;
  const safeHeight = originalHeight || 533;
  const scale = Math.min(1, maxSize / Math.max(safeWidth, safeHeight));

  return {
    width: Math.round(safeWidth * scale),
    height: Math.round(safeHeight * scale),
    scale,
  };
}

/**
 * 최적화된 2D 컨텍스트 생성
 * - willReadFrequently: getImageData 최적화
 * - alpha: 투명도 지원 여부
 */
export function createOptimizedContext(
  canvas: HTMLCanvasElement,
  options?: {
    willReadFrequently?: boolean;
    alpha?: boolean;
    desynchronized?: boolean;
  }
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d', {
    willReadFrequently: options?.willReadFrequently ?? true,
    alpha: options?.alpha ?? true,
    // desynchronized: 입력 지연 감소 (Chrome 전용)
    desynchronized: options?.desynchronized ?? false,
  });

  return ctx;
}

/**
 * OffscreenCanvas 지원 여부 확인
 */
export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

/**
 * OffscreenCanvas 생성 (지원 시)
 * - Web Worker에서 렌더링 가능
 */
export function createOffscreenCanvas(
  width: number,
  height: number
): OffscreenCanvas | HTMLCanvasElement {
  if (supportsOffscreenCanvas()) {
    return new OffscreenCanvas(width, height);
  }

  // Fallback: 일반 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Canvas 크기 설정 (DPR 고려)
 * - High DPI 디스플레이 대응
 */
export function setupCanvasSize(
  canvas: HTMLCanvasElement,
  displayWidth: number,
  displayHeight: number,
  maxDpr: number = 2
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  // 실제 픽셀 크기 설정
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;

  // CSS 크기 설정
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  // 컨텍스트 스케일 조정
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
}

/**
 * 이미지를 Canvas에 그리기
 * - 비율 유지 중앙 정렬
 */
export function drawImageCentered(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
): { scale: number; offsetX: number; offsetY: number } {
  const imageRatio = image.width / image.height;
  const canvasRatio = canvasWidth / canvasHeight;

  let scale: number;
  let offsetX: number;
  let offsetY: number;

  if (imageRatio > canvasRatio) {
    // 이미지가 더 넓음 - 가로 맞춤
    scale = canvasWidth / image.width;
    offsetX = 0;
    offsetY = (canvasHeight - image.height * scale) / 2;
  } else {
    // 이미지가 더 높음 - 세로 맞춤
    scale = canvasHeight / image.height;
    offsetX = (canvasWidth - image.width * scale) / 2;
    offsetY = 0;
  }

  ctx.drawImage(image, offsetX, offsetY, image.width * scale, image.height * scale);

  return { scale, offsetX, offsetY };
}

/**
 * ImageData에서 특정 영역 추출
 */
export function extractRegion(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  ctx.putImageData(imageData, 0, 0);
  return ctx.getImageData(x, y, width, height);
}

/**
 * RGBA를 HSL로 변환
 */
export function rgbaToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h, s, l };
}

/**
 * HSL을 RGBA로 변환
 */
export function hslToRgba(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * 히트맵 색상 생성
 * - 0.0 (파랑) ~ 1.0 (빨강) 그라데이션
 */
export function getHeatmapColor(
  value: number,
  colorScheme: 'brown' | 'red' | 'yellow' = 'brown'
): { r: number; g: number; b: number; a: number } {
  // 0-1 범위로 클램프
  const v = Math.max(0, Math.min(1, value));

  // 색상 스키마별 그라데이션
  const schemes: Record<string, Array<[number, number, number]>> = {
    // 멜라닌 (갈색 계열)
    brown: [
      [255, 248, 220], // 밝은 베이지
      [210, 180, 140], // 탄
      [139, 90, 43], // 갈색
      [101, 67, 33], // 진한 갈색
    ],
    // 헤모글로빈 (빨강 계열)
    red: [
      [255, 240, 240], // 밝은 분홍
      [255, 182, 193], // 연한 분홍
      [255, 99, 71], // 토마토
      [178, 34, 34], // 진한 빨강
    ],
    // 피지 (노랑 계열)
    yellow: [
      [255, 255, 240], // 밝은 아이보리
      [255, 255, 153], // 연한 노랑
      [255, 215, 0], // 골드
      [184, 134, 11], // 진한 골드
    ],
  };

  const colors = schemes[colorScheme] || schemes.brown;

  // 선형 보간
  const segmentCount = colors.length - 1;
  const segment = Math.min(Math.floor(v * segmentCount), segmentCount - 1);
  const localT = v * segmentCount - segment;

  const c1 = colors[segment];
  const c2 = colors[segment + 1];

  return {
    r: Math.round(c1[0] + (c2[0] - c1[0]) * localT),
    g: Math.round(c1[1] + (c2[1] - c1[1]) * localT),
    b: Math.round(c1[2] + (c2[2] - c1[2]) * localT),
    a: Math.round(180 + v * 75), // 투명도: 180-255
  };
}

/**
 * Canvas를 Blob으로 변환
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg' = 'image/png',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Canvas를 DataURL로 변환
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg' = 'image/png',
  quality: number = 0.92
): string {
  return canvas.toDataURL(type, quality);
}

/**
 * Canvas 정리
 */
export function clearCanvas(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * 비네팅 효과 적용 (가장자리 부드럽게 어둡게)
 * - 마스크 불필요, 자연스러운 집중 효과
 * @param ctx - Canvas 2D 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param intensity - 비네팅 강도 (0.0~1.0, 기본 0.4)
 */
export function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.4
): void {
  // 중심점
  const centerX = width / 2;
  const centerY = height / 2;

  // 타원형 그라데이션 (세로가 더 긴 얼굴 형태 고려)
  const radiusX = width * 0.6;
  const radiusY = height * 0.7;

  // 방사형 그라데이션 생성
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    Math.max(radiusX, radiusY)
  );

  // 중앙은 투명, 가장자리는 어둡게
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.8, `rgba(0, 0, 0, ${intensity * 0.5})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

  // 오버레이 적용
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}
