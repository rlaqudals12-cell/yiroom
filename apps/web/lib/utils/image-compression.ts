/**
 * 이미지 압축 유틸리티
 * AI 분석 전 이미지 전처리로 타임아웃 감소
 *
 * 계약: 실패는 조용히 원본을 통과시키지 않고 reject한다.
 * (원본 통과 = 4.5MB body 제한 초과/디코드 불가 이미지가 서버까지 가서
 *  "네트워크 오류"로 오귀인되던 결함. 호출부는 모두 try/catch로 사용자 고지.)
 */

// 최대 이미지 크기 (픽셀)
const MAX_IMAGE_SIZE = 1024;
// JPEG 압축 품질 (0-1)
const JPEG_QUALITY = 0.8;
// 재압축 임계값 — Vercel 4.5MB body 제한 아래로 유지 (JSON 봉투·다중 이미지 여유분 포함)
const MAX_COMPRESSED_KB = 3500;
// 재압축 시 더 강한 축소·품질 (1회만 시도)
const RETRY_MAX_IMAGE_SIZE = 800;
const RETRY_JPEG_QUALITY = 0.6;

/** 업로드 허용 최대 원본 파일 크기 (10MB) */
export const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;

/**
 * 사용자에게 그대로 보여줄 수 있는 이미지 처리 실패
 * — UI는 `userMessage`를 인라인 에러로 노출한다.
 */
export class ImageProcessingError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.name = 'ImageProcessingError';
    this.userMessage = userMessage;
  }
}

/**
 * Canvas로 리사이즈 + JPEG 인코딩 (1회)
 */
function renderToJpeg(img: HTMLImageElement, maxSize: number, quality: number): string {
  let { width, height } = img;

  if (width <= 0 || height <= 0) {
    throw new ImageProcessingError('이미지를 읽을 수 없어요. 다른 사진을 선택해주세요.');
  }

  // 리사이즈 비율 계산
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ImageProcessingError('이미지 처리에 실패했어요. 다른 사진을 선택해주세요.');
  }

  // 고품질 리사이즈
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // JPEG로 압축 (투명도 없는 사진에 적합)
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Base64 이미지를 압축하여 반환
 * - 1024x1024 이하로 리사이즈
 * - JPEG 80% 품질로 압축
 * - 결과가 3.5MB를 넘으면 800px·60% 품질로 1회 재압축
 *
 * @param base64 - data:image/... 형식의 Base64 문자열
 * @returns 압축된 Base64 문자열
 * @throws {ImageProcessingError} 디코드/인코드 실패 시 (원본 통과 없음)
 */
export async function compressBase64Image(base64: string): Promise<string> {
  // 서버 사이드에서는 압축 없이 반환 (Canvas API 미지원)
  if (typeof window === 'undefined') {
    return base64;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const compressed = renderToJpeg(img, MAX_IMAGE_SIZE, JPEG_QUALITY);

        // 여전히 무거우면(고해상도·복잡한 질감) 한 번 더 낮춰서 재압축 —
        // 서버 body 제한 초과로 요청 전체가 죽는 것보다 화질 손해가 낫다.
        if (estimateBase64SizeKB(compressed) > MAX_COMPRESSED_KB) {
          resolve(renderToJpeg(img, RETRY_MAX_IMAGE_SIZE, RETRY_JPEG_QUALITY));
          return;
        }

        resolve(compressed);
      } catch (err) {
        console.error('[IMG-COMPRESS] Error:', err);
        reject(
          err instanceof ImageProcessingError
            ? err
            : new ImageProcessingError('이미지 처리에 실패했어요. 다른 사진을 선택해주세요.')
        );
      }
    };

    img.onerror = () => {
      console.error('[IMG-COMPRESS] Failed to load image');
      reject(new ImageProcessingError('이미지를 읽을 수 없어요. 다른 사진을 선택해주세요.'));
    };

    img.src = base64;
  });
}

/**
 * 업로드 파일 사전 검증 (MIME·크기)
 * — 디코드조차 못 할 파일을 압축 단계까지 끌고 가지 않는다.
 */
export function validateImageFile(file: File): void {
  // type이 빈 문자열인 경우(일부 OS/브라우저)는 통과시키고 디코드 단계에서 판정
  if (file.type !== '' && !file.type.startsWith('image/')) {
    throw new ImageProcessingError('이미지 파일만 올릴 수 있어요. (JPG·PNG·WebP 권장)');
  }
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    throw new ImageProcessingError('사진 용량이 너무 커요. 10MB 이하 사진을 선택해주세요.');
  }
}

/**
 * File을 압축된 Base64로 변환 (원스텝)
 * - MIME/크기 사전 검증 → FileReader로 읽기 → 1024px 리사이즈 → JPEG 80% 압축
 * - Vercel 4.5MB body 제한 대응: 12MP 사진(~8MB) → ~200KB로 압축
 *
 * @param file - 이미지 File 객체
 * @returns 압축된 data:image/jpeg;base64,... 문자열
 * @throws {ImageProcessingError} 검증/읽기/압축 실패 시
 */
export async function compressFileToBase64(file: File): Promise<string> {
  validateImageFile(file);

  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new ImageProcessingError('파일을 읽지 못했어요. 다른 사진을 선택해주세요.'));
    reader.readAsDataURL(file);
  });
  return compressBase64Image(raw);
}

/**
 * 여러 Base64 이미지를 병렬로 압축
 *
 * @param images - Base64 이미지 배열
 * @returns 압축된 Base64 이미지 배열
 */
export async function compressMultipleImages(images: string[]): Promise<string[]> {
  return Promise.all(images.map((img) => compressBase64Image(img)));
}

/**
 * Base64 이미지 크기 추정 (KB)
 */
export function estimateBase64SizeKB(base64: string): number {
  // Base64는 원본 대비 약 4/3 크기
  // data:image/xxx;base64, 헤더 제외
  const base64Data = base64.split(',')[1] || base64;
  return Math.round((base64Data.length * 3) / 4 / 1024);
}
