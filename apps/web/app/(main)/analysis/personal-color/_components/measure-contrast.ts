/**
 * 퍼스널 대비 클라이언트 실측 글루 (ADR-116)
 *
 * @description 브라우저에서 얼굴 이미지 → 픽셀(ImageData) + MediaPipe 랜드마크를 준비해
 * 순수 오케스트레이터(deriveContrastFromPixels)로 개인 대비를 실측한다.
 *
 * 정직성(ADR-116 결정 2): 랜드마크는 **실측만** 사용한다 — MediaPipe가 얼굴을 못 잡거나
 * 로드 실패(detect가 null/[] 반환)면 대비를 지어내지 않고 null을 반환한다. 픽셀 위에
 * mock 랜드마크를 얹어 그럴듯한 값을 만들어내는 일은 하지 않는다.
 *
 * detect는 useFaceLandmarker().detect를 주입받는다(테스트 용이 + 훅 결합 분리).
 */

import type { MediaPipeFaceResult } from '@/lib/image-engine/cie-2/face-detector';
import { deriveContrastFromPixels } from '@/lib/analysis/personal-color-v2';
import type { ContrastLevel } from '@/lib/analysis/personal-color-v2';

/** useFaceLandmarker().detect 시그니처 (실측 실패 시 null/[] 반환 — mock 없음) */
type DetectFn = (
  image: HTMLImageElement | HTMLCanvasElement | ImageData
) => Promise<MediaPipeFaceResult[] | null>;

/** data URL / object URL → HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });
}

/** HTMLImageElement → RGBA 픽셀 (naturalWidth/Height 기준) */
function getImageData(img: HTMLImageElement): {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
} | null {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  return { pixels: data.data, width, height };
}

/**
 * 얼굴 이미지에서 개인 대비를 실측한다. 실패/미감지/저사양은 모두 null(추측 금지).
 *
 * @param detect - useFaceLandmarker().detect (MediaPipe 미가용 시 null 반환)
 * @param imageSrc - 분석 얼굴 이미지 (data URL 또는 object URL)
 */
/** 측정 전체 상한 — 대비는 보조 축이라 이 시간 안에 못 끝나면 포기(분석 지연 금지) */
const MEASURE_TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

export async function measureContrastLevel(
  detect: DetectFn,
  imageSrc: string
): Promise<ContrastLevel | null> {
  return withTimeout(measureContrastLevelInner(detect, imageSrc), MEASURE_TIMEOUT_MS);
}

async function measureContrastLevelInner(
  detect: DetectFn,
  imageSrc: string
): Promise<ContrastLevel | null> {
  try {
    if (typeof document === 'undefined' || !imageSrc) return null;

    const img = await loadImage(imageSrc);

    // 실측 랜드마크 (얼굴 미감지/로드 실패 시 null 또는 빈 배열)
    const faces = await detect(img);
    if (!faces || faces.length === 0) return null;

    const landmarks = faces[0].landmarks;
    if (!landmarks || landmarks.length < 468) return null;

    const image = getImageData(img);
    if (!image) return null;

    // MediaPipe 랜드마크는 정규화(0~1) — 샘플러가 기대하는 px 좌표로 환산
    const pxLandmarks = landmarks.map((l) => ({
      x: l.x * image.width,
      y: l.y * image.height,
      z: l.z,
    }));

    return deriveContrastFromPixels(image.pixels, image.width, image.height, pxLandmarks);
  } catch {
    // 대비는 선택적 보조 축 — 어떤 실패도 분석을 막지 않는다
    return null;
  }
}
