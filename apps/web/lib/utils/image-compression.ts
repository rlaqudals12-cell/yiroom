/**
 * 이미지 압축 유틸리티
 * AI 분석 전 이미지 전처리로 타임아웃 감소
 */

// 최대 이미지 크기 (픽셀)
const MAX_IMAGE_SIZE = 1024;
// JPEG 압축 품질 (0-1)
const JPEG_QUALITY = 0.8;

/**
 * Base64 이미지를 압축하여 반환
 * - 1024x1024 이하로 리사이즈
 * - JPEG 80% 품질로 압축
 *
 * @param base64 - data:image/... 형식의 Base64 문자열
 * @returns 압축된 Base64 문자열
 */
export async function compressBase64Image(base64: string): Promise<string> {
  // 서버 사이드에서는 압축 없이 반환 (Canvas API 미지원)
  if (typeof window === 'undefined') {
    return base64;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        // 원본 크기
        let { width, height } = img;
        const originalSize = base64.length;

        // 리사이즈 비율 계산
        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Canvas로 리사이즈 + 압축
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64); // Canvas 실패 시 원본 반환
          return;
        }

        // 고품질 리사이즈
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // JPEG로 압축 (투명도 없는 사진에 적합)
        const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const compressedSize = compressed.length;

        // 압축률 로깅
        const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);
        console.log(
          `[IMG-COMPRESS] ${img.naturalWidth}x${img.naturalHeight} → ${width}x${height}, ` +
            `${Math.round(originalSize / 1024)}KB → ${Math.round(compressedSize / 1024)}KB (${savedPercent}% 절감)`
        );

        resolve(compressed);
      } catch (err) {
        console.error('[IMG-COMPRESS] Error:', err);
        resolve(base64); // 에러 시 원본 반환
      }
    };

    img.onerror = () => {
      console.error('[IMG-COMPRESS] Failed to load image');
      resolve(base64); // 로드 실패 시 원본 반환
    };

    img.src = base64;
  });
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
