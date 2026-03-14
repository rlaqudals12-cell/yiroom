/**
 * 이미지 처리 유틸리티 테스트
 * 색상 추출, 분류, 유효성 검사, 변환 함수 검증
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/logger', () => ({
  inventoryLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  validateImageFile,
  dataUrlToBlob,
  classifyClothing,
} from '@/lib/inventory/imageProcessing';

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================
// validateImageFile
// =====================================================

describe('validateImageFile', () => {
  it('유효한 JPEG 파일을 허용한다', () => {
    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

    const result = validateImageFile(file);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('유효한 PNG 파일을 허용한다', () => {
    const file = new File(['test'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB

    const result = validateImageFile(file);

    expect(result.valid).toBe(true);
  });

  it('유효한 WebP 파일을 허용한다', () => {
    const file = new File(['test'], 'photo.webp', { type: 'image/webp' });
    Object.defineProperty(file, 'size', { value: 1024 }); // 1KB

    const result = validateImageFile(file);

    expect(result.valid).toBe(true);
  });

  it('유효한 HEIC 파일을 허용한다', () => {
    const file = new File(['test'], 'photo.heic', { type: 'image/heic' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }); // 2MB

    const result = validateImageFile(file);

    expect(result.valid).toBe(true);
  });

  it('지원하지 않는 형식을 거부한다', () => {
    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });

    const result = validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('JPG, PNG, WebP, HEIC');
  });

  it('GIF 형식을 거부한다', () => {
    const file = new File(['test'], 'animation.gif', { type: 'image/gif' });

    const result = validateImageFile(file);

    expect(result.valid).toBe(false);
  });

  it('10MB 초과 파일을 거부한다', () => {
    const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB

    const result = validateImageFile(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB');
  });

  it('정확히 10MB 파일은 허용한다', () => {
    const file = new File(['test'], 'exact.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

    const result = validateImageFile(file);

    expect(result.valid).toBe(true);
  });
});

// =====================================================
// dataUrlToBlob
// =====================================================

describe('dataUrlToBlob', () => {
  it('JPEG data URL을 Blob으로 변환한다', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ';

    const blob = dataUrlToBlob(dataUrl);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('PNG data URL을 Blob으로 변환한다', () => {
    // 유효한 base64 문자열 사용
    const dataUrl = 'data:image/png;base64,dGVzdA==';

    const blob = dataUrlToBlob(dataUrl);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('MIME 타입이 없으면 기본 image/png를 사용한다', () => {
    // MIME 패턴에 매치하지 않는 경우
    const dataUrl = 'data:;base64,dGVzdA==';

    const blob = dataUrlToBlob(dataUrl);

    expect(blob).toBeInstanceOf(Blob);
    // MIME 추출 실패 시 기본값 사용
    expect(blob.type).toBe('image/png');
  });
});

// =====================================================
// classifyClothing
// =====================================================

describe('classifyClothing', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('API 성공 시 분류 결과를 반환한다', async () => {
    const mockResult = {
      category: 'outer',
      subCategory: '코트',
      suggestedName: '울 코트',
      colors: ['블랙'],
      pattern: 'solid',
      confidence: 92,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    const result = await classifyClothing('https://example.com/coat.jpg');

    expect(result.category).toBe('outer');
    expect(result.suggestedName).toBe('울 코트');
    expect(result.confidence).toBe(92);
  });

  it('API 실패 시 기본 fallback을 반환한다', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await classifyClothing('https://example.com/broken.jpg');

    expect(result.category).toBe('top');
    expect(result.suggestedName).toBe('의류');
    expect(result.confidence).toBe(0);
    expect(result.colors).toEqual([]);
  });

  it('네트워크 에러 시 기본 fallback을 반환한다', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const result = await classifyClothing('https://example.com/img.jpg');

    expect(result.category).toBe('top');
    expect(result.confidence).toBe(0);
  });
});

// =====================================================
// extractDominantColors / removeBackgroundClient / resizeImage
// jsdom 환경에서는 window가 정의되므로 Canvas API 호출 시도
// createImageBitmap이 없어 에러가 발생하는 동작 검증
// =====================================================

describe('extractDominantColors (jsdom 환경)', () => {
  it('createImageBitmap 미지원 시 에러를 throw 한다', async () => {
    const { extractDominantColors } = await import('@/lib/inventory/imageProcessing');

    const blob = new Blob(['test'], { type: 'image/png' });
    // jsdom에서는 createImageBitmap이 없으므로 ReferenceError 발생
    await expect(extractDominantColors(blob)).rejects.toThrow();
  });
});

describe('removeBackgroundClient (jsdom 환경)', () => {
  it('@imgly/background-removal 없으면 Blob을 반환한다 (graceful fallback)', async () => {
    const { removeBackgroundClient } = await import('@/lib/inventory/imageProcessing');

    const blob = new Blob(['test'], { type: 'image/png' });
    // 패키지 미설치 시 import 실패 -> catch에서 원본 반환
    const result = await removeBackgroundClient(blob);

    expect(result).toBeInstanceOf(Blob);
  });
});

describe('resizeImage (jsdom 환경)', () => {
  it('createImageBitmap 미지원 시 에러를 throw 한다', async () => {
    const { resizeImage } = await import('@/lib/inventory/imageProcessing');

    const blob = new Blob(['test'], { type: 'image/png' });
    // jsdom에서는 createImageBitmap이 없으므로 ReferenceError 발생
    await expect(resizeImage(blob)).rejects.toThrow();
  });
});

// =====================================================
// blobToDataUrl
// =====================================================

describe('blobToDataUrl', () => {
  it('Blob을 Data URL로 변환한다', async () => {
    const { blobToDataUrl } = await import('@/lib/inventory/imageProcessing');

    const blob = new Blob(['hello'], { type: 'text/plain' });
    const result = await blobToDataUrl(blob);

    expect(result).toContain('data:');
    expect(typeof result).toBe('string');
  });
});
