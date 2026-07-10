/**
 * 업로드 전 클라이언트 이미지 축소 (Vercel 본문 제한 대응)
 *
 * 근본 원인(2026-07-11 실증): 배경 제거된 원본 해상도 PNG를 FormData로 전송하면
 * Vercel 서버리스 본문 제한(4.5MB)에 걸려 라우트 실행 전에 413으로 거부된다
 * (스토리지 로그 0·버킷 객체 0으로 확인). 서버에서 못 막으므로 전송 전에 줄인다.
 *
 * - 최대 변 1536px로 축소(투명 배경 유지를 위해 PNG 우선)
 * - 축소 후에도 안전 한도(4MB) 초과 시 WebP(알파 지원)로 재압축 폴백
 * - 원본이 이미 작으면 무변환 통과
 */

/** 업로드 최대 변 길이(px) — 옷장 카드·상세 표시에 충분한 해상도 */
export const MAX_UPLOAD_DIMENSION = 1536;

/** Vercel 서버리스 본문 제한(4.5MB)에 대한 안전 한도 */
export const UPLOAD_SAFE_BYTES = 4 * 1024 * 1024;

/** 축소 필요 여부 판정 (순수 함수 — 테스트 대상) */
export function needsDownscale(bytes: number, width: number, height: number): boolean {
  return bytes > UPLOAD_SAFE_BYTES || Math.max(width, height) > MAX_UPLOAD_DIMENSION;
}

/** 축소 배율 계산 (순수 함수 — 테스트 대상) */
export function downscaleRatio(width: number, height: number): number {
  return Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(width, height));
}

/** data URL → Blob (동기) */
export function dataUrlToBlobSync(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? 'image/png';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/** 이미지 로드 (jsdom 미발화 대비 — 소비 테스트는 이 모듈을 목으로 대체) */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 읽지 못했어요'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했어요'))), type);
  });
}

/**
 * 업로드용 Blob 준비 — 필요 시에만 축소.
 * @param source data URL 또는 Blob(File 포함)
 */
export async function prepareUploadBlob(source: string | Blob): Promise<Blob> {
  const original = typeof source === 'string' ? dataUrlToBlobSync(source) : source;
  const objectUrl = typeof source === 'string' ? source : URL.createObjectURL(original);

  try {
    const img = await loadImage(objectUrl);
    if (!needsDownscale(original.size, img.width, img.height)) {
      return original;
    }

    const ratio = downscaleRatio(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 투명 배경(배경 제거 결과) 보존을 위해 PNG 우선
    const png = await canvasToBlob(canvas, 'image/png');
    if (png.size <= UPLOAD_SAFE_BYTES) return png;

    // PNG로도 크면 WebP(알파 지원) 폴백
    const webp = await canvasToBlob(canvas, 'image/webp');
    return webp.size < png.size ? webp : png;
  } catch {
    // 축소 실패 시 원본 그대로(서버 413 안내가 후방 방어)
    return original;
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(objectUrl);
  }
}

/** 업로드 실패 상태코드 → 사용자 안내 문구 (정직한 에러) */
export function uploadErrorMessage(status: number): string {
  if (status === 413) {
    return '사진 용량이 너무 커서 업로드하지 못했어요. 다른 사진으로 다시 시도해주세요.';
  }
  if (status === 401) {
    return '로그인이 필요해요. 다시 로그인한 뒤 시도해주세요.';
  }
  return '이미지 업로드에 실패했어요. 잠시 후 다시 시도해주세요.';
}
