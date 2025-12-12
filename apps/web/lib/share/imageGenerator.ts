'use client';

/**
 * HTML 요소를 PNG 이미지로 캡처
 * @param element 캡처할 HTML 요소
 * @param options 캡처 옵션
 * @returns PNG Blob 또는 null (실패 시)
 */
export async function captureElementAsImage(
  element: HTMLElement,
  options?: {
    quality?: number;
    scale?: number;
    backgroundColor?: string;
  }
): Promise<Blob | null> {
  // 동적 import로 SSR 안전하게 처리
  const { toPng } = await import('html-to-image');

  try {
    const dataUrl = await toPng(element, {
      quality: options?.quality ?? 0.95,
      pixelRatio: options?.scale ?? 2,
      cacheBust: true,
      backgroundColor: options?.backgroundColor ?? '#ffffff',
      // 외부 이미지 CORS 처리
      skipAutoScale: false,
      includeQueryParams: true,
    });

    // dataUrl을 Blob으로 변환
    const response = await fetch(dataUrl);
    return response.blob();
  } catch (error) {
    console.error('[이룸] 이미지 생성 실패:', error);
    return null;
  }
}

/**
 * HTML 요소를 Data URL로 캡처
 * @param element 캡처할 HTML 요소
 * @returns PNG Data URL 또는 null (실패 시)
 */
export async function captureElementAsDataUrl(
  element: HTMLElement
): Promise<string | null> {
  const { toPng } = await import('html-to-image');

  try {
    return await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#ffffff',
    });
  } catch (error) {
    console.error('[이룸] 이미지 생성 실패:', error);
    return null;
  }
}
