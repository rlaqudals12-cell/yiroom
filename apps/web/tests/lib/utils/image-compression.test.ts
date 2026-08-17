/**
 * 이미지 압축 유틸 테스트
 *
 * 회귀 방지: 압축/디코드 실패가 조용히 원본을 통과시키던 결함
 * (→ 서버 body 제한 초과·디코드 불가 이미지가 "네트워크 오류"로 오귀인됨).
 * 이제 실패는 반드시 reject되고, 결과가 3.5MB를 넘으면 1회 재압축한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  compressBase64Image,
  compressFileToBase64,
  validateImageFile,
  estimateBase64SizeKB,
  ImageProcessingError,
  MAX_UPLOAD_FILE_BYTES,
} from '@/lib/utils/image-compression';

const SMALL_DATA_URL = 'data:image/jpeg;base64,small';
// estimateBase64SizeKB > 3500KB 가 되는 길이 (len * 3 / 4 / 1024)
const HUGE_BASE64 = 'a'.repeat(4_800_000);
const HUGE_DATA_URL = `data:image/jpeg;base64,${HUGE_BASE64}`;

let imageShouldFail = false;
let imageSize = { width: 2000, height: 1000 };

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = imageSize.width;
  height = imageSize.height;

  set src(_value: string) {
    queueMicrotask(() => {
      if (imageShouldFail) this.onerror?.();
      else this.onload?.();
    });
  }
}

/** toDataURL이 호출될 때마다 큐에서 다음 결과를 꺼내 쓰는 canvas 스텁 */
function stubCanvas(results: string[]): { qualities: (number | undefined)[] } {
  const qualities: (number | undefined)[] = [];
  const originalCreateElement = document.createElement.bind(document);

  vi.spyOn(document, 'createElement').mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions
  ) => {
    const element = originalCreateElement(tagName as 'div', options);
    if (tagName === 'canvas') {
      const canvas = element as unknown as HTMLCanvasElement;
      canvas.getContext = vi.fn(() => ({
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
        drawImage: vi.fn(),
      })) as unknown as HTMLCanvasElement['getContext'];
      canvas.toDataURL = vi.fn((_type?: string, quality?: number) => {
        qualities.push(quality);
        return results.shift() ?? SMALL_DATA_URL;
      }) as unknown as HTMLCanvasElement['toDataURL'];
    }
    return element;
  }) as typeof document.createElement);

  return { qualities };
}

describe('image-compression', () => {
  beforeEach(() => {
    imageShouldFail = false;
    imageSize = { width: 2000, height: 1000 };
    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('validateImageFile', () => {
    it('이미지가 아닌 MIME은 ImageProcessingError로 거부한다', () => {
      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
      expect(() => validateImageFile(file)).toThrow(ImageProcessingError);
      expect(() => validateImageFile(file)).toThrow(/이미지 파일만/);
    });

    it('10MB를 넘는 파일은 거부한다', () => {
      const file = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: MAX_UPLOAD_FILE_BYTES + 1 });
      expect(() => validateImageFile(file)).toThrow(/10MB 이하/);
    });

    it('MIME이 비어 있으면 통과시킨다 (디코드 단계에서 판정)', () => {
      const file = new File(['x'], 'unknown', { type: '' });
      expect(() => validateImageFile(file)).not.toThrow();
    });

    it('정상 이미지는 통과한다', () => {
      const file = new File(['x'], 'ok.png', { type: 'image/png' });
      expect(() => validateImageFile(file)).not.toThrow();
    });
  });

  describe('compressBase64Image', () => {
    it('정상 이미지는 압축 결과를 반환한다', async () => {
      stubCanvas(['data:image/jpeg;base64,compressed']);
      await expect(compressBase64Image(SMALL_DATA_URL)).resolves.toBe(
        'data:image/jpeg;base64,compressed'
      );
    });

    it('이미지 로드 실패 시 원본을 통과시키지 않고 reject한다', async () => {
      imageShouldFail = true;
      stubCanvas([]);
      await expect(compressBase64Image(SMALL_DATA_URL)).rejects.toBeInstanceOf(
        ImageProcessingError
      );
    });

    it('Canvas 컨텍스트를 못 얻으면 reject한다', async () => {
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation(((
        tagName: string,
        options?: ElementCreationOptions
      ) => {
        const element = originalCreateElement(tagName as 'div', options);
        if (tagName === 'canvas') {
          (element as unknown as HTMLCanvasElement).getContext = vi.fn(
            () => null
          ) as unknown as HTMLCanvasElement['getContext'];
        }
        return element;
      }) as typeof document.createElement);

      await expect(compressBase64Image(SMALL_DATA_URL)).rejects.toBeInstanceOf(
        ImageProcessingError
      );
    });

    it('압축 결과가 3.5MB를 넘으면 품질을 낮춰 1회 재압축한다', async () => {
      const { qualities } = stubCanvas([HUGE_DATA_URL, 'data:image/jpeg;base64,retry']);

      await expect(compressBase64Image(SMALL_DATA_URL)).resolves.toBe(
        'data:image/jpeg;base64,retry'
      );
      // 1차 0.8 → 2차 0.6 (재압축은 1회만)
      expect(qualities).toEqual([0.8, 0.6]);
    });

    it('재압축 결과가 여전히 커도 2회를 넘겨 시도하지 않는다', async () => {
      const { qualities } = stubCanvas([HUGE_DATA_URL, HUGE_DATA_URL]);

      await expect(compressBase64Image(SMALL_DATA_URL)).resolves.toBe(HUGE_DATA_URL);
      expect(qualities).toHaveLength(2);
    });

    it('폭/높이가 0인 이미지는 reject한다', async () => {
      imageSize = { width: 0, height: 0 };
      stubCanvas([SMALL_DATA_URL]);
      await expect(compressBase64Image(SMALL_DATA_URL)).rejects.toBeInstanceOf(
        ImageProcessingError
      );
    });
  });

  describe('compressFileToBase64', () => {
    it('사전 검증 실패 시 FileReader까지 가지 않고 reject한다', async () => {
      const file = new File(['x'], 'movie.mp4', { type: 'video/mp4' });
      await expect(compressFileToBase64(file)).rejects.toBeInstanceOf(ImageProcessingError);
    });

    it('정상 파일은 압축된 data URL을 반환한다', async () => {
      stubCanvas(['data:image/jpeg;base64,compressed']);
      const file = new File(['x'], 'ok.jpg', { type: 'image/jpeg' });
      await expect(compressFileToBase64(file)).resolves.toBe('data:image/jpeg;base64,compressed');
    });
  });

  describe('estimateBase64SizeKB', () => {
    it('data URL 헤더를 제외하고 KB를 추정한다', () => {
      expect(estimateBase64SizeKB(`data:image/jpeg;base64,${'a'.repeat(1024 * 4)}`)).toBe(3);
    });
  });
});
