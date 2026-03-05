import { describe, it, expect, vi, beforeEach } from 'vitest';

// canvas-utils mock
vi.mock('@/lib/analysis/canvas-utils', () => ({
  getConstrainedCanvasSize: vi.fn().mockReturnValue({ width: 100, height: 100 }),
  createOptimizedContext: vi.fn(),
  rgbaToHsl: vi.fn().mockImplementation((r: number, g: number, b: number) => {
    // 간단한 HSL 변환 mock
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      else if (max === gn) h = ((bn - rn) / d + 2) / 6;
      else h = ((rn - gn) / d + 4) / 6;
    }
    return { h, s, l };
  }),
  hslToRgba: vi.fn().mockImplementation((h: number, s: number, l: number) => {
    // 무채색 → 회색
    if (s === 0) {
      const v = Math.round(l * 255);
      return { r: v, g: v, b: v };
    }
    return { r: Math.round(h * 100) % 255, g: Math.round(s * 200), b: Math.round(l * 255) };
  }),
}));

// face-landmark mock
vi.mock('@/lib/analysis/face-landmark', () => ({
  extractFaceLandmarks: vi.fn(),
}));

// FACE_OVAL_INDICES mock (36개 인덱스)
vi.mock('@/lib/mock/visual-analysis', () => ({
  FACE_OVAL_INDICES: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152,
    148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
  ],
}));

import { applyHairColor } from '@/lib/virtual-try-on/hair-engine';
import { extractFaceLandmarks } from '@/lib/analysis/face-landmark';
import { createOptimizedContext } from '@/lib/analysis/canvas-utils';
import type { HairColorConfig } from '@/lib/virtual-try-on/types';
import { HAIR_PRESETS } from '@/lib/virtual-try-on/types';

// 468개 랜드마크 mock 생성 (얼굴 중앙에 배치)
function createMockLandmarks(): { landmarks: Array<{ x: number; y: number; z: number }> } {
  const landmarks = Array.from({ length: 468 }, (_, i) => ({
    x: 0.3 + Math.random() * 0.4, // 30-70% 범위
    y: 0.3 + Math.random() * 0.4,
    z: 0,
  }));
  return { landmarks };
}

// Canvas mock
function createMockContext(): CanvasRenderingContext2D {
  const imageData = {
    data: new Uint8ClampedArray(100 * 100 * 4),
    width: 100,
    height: 100,
  };
  // 다양한 머리카락 색상의 픽셀 데이터 채우기
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 80; // R (갈색 톤)
    imageData.data[i + 1] = 50; // G
    imageData.data[i + 2] = 30; // B
    imageData.data[i + 3] = 255; // A
  }

  return {
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue(imageData),
    putImageData: vi.fn(),
    canvas: {
      width: 100,
      height: 100,
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mockdata'),
      getContext: vi.fn(),
    },
  } as unknown as CanvasRenderingContext2D;
}

// document.createElement mock
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
  if (tag === 'canvas') {
    const canvas = originalCreateElement('canvas');
    // getContext mock

    vi.spyOn(canvas, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      filter: '',
    } as any);
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/jpeg;base64,mockdata');
    return canvas;
  }
  return originalCreateElement(tag);
});

describe('applyHairColor', () => {
  const mockImage = {
    naturalWidth: 400,
    naturalHeight: 400,
  } as HTMLImageElement;

  const defaultConfig: HairColorConfig = {
    targetHsl: { h: 0.07, s: 0.5, l: 0.3 },
    intensity: 0.6,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const mockCtx = createMockContext();
    vi.mocked(createOptimizedContext).mockReturnValue(mockCtx);
  });

  it('should throw when no face detected', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(null);

    await expect(applyHairColor(mockImage, defaultConfig)).rejects.toThrow(
      '얼굴을 감지할 수 없습니다'
    );
  });

  it('should return result with dataUrl and processingTimeMs', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createMockLandmarks() as never);

    const result = await applyHairColor(mockImage, defaultConfig);

    expect(result).toHaveProperty('dataUrl');
    expect(result).toHaveProperty('processingTimeMs');
    expect(result).toHaveProperty('config');
    expect(result.dataUrl).toContain('data:image/jpeg');
    expect(typeof result.processingTimeMs).toBe('number');
  });

  it('should preserve config in result', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createMockLandmarks() as never);

    const result = await applyHairColor(mockImage, defaultConfig);

    expect(result.config).toEqual(defaultConfig);
    expect(result.config.targetHsl.h).toBe(0.07);
    expect(result.config.intensity).toBe(0.6);
  });

  it('should use default intensity when not provided', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createMockLandmarks() as never);

    const config: HairColorConfig = {
      targetHsl: { h: 0.5, s: 0.5, l: 0.5 },
      intensity: 0.6,
    };
    const result = await applyHairColor(mockImage, config);

    expect(result.config.intensity).toBe(0.6);
  });

  it('should call extractFaceLandmarks with the image', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createMockLandmarks() as never);

    await applyHairColor(mockImage, defaultConfig);

    expect(extractFaceLandmarks).toHaveBeenCalledWith(mockImage);
  });

  it('should throw when canvas context fails', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createMockLandmarks() as never);
    vi.mocked(createOptimizedContext).mockReturnValue(null as never);

    await expect(applyHairColor(mockImage, defaultConfig)).rejects.toThrow(
      'Canvas 초기화에 실패했습니다'
    );
  });
});

describe('HAIR_PRESETS', () => {
  it('should have 10 presets', () => {
    expect(HAIR_PRESETS).toHaveLength(10);
  });

  it('should have valid HSL values (0-1 range)', () => {
    for (const preset of HAIR_PRESETS) {
      expect(preset.targetHsl.h).toBeGreaterThanOrEqual(0);
      expect(preset.targetHsl.h).toBeLessThanOrEqual(1);
      expect(preset.targetHsl.s).toBeGreaterThanOrEqual(0);
      expect(preset.targetHsl.s).toBeLessThanOrEqual(1);
      expect(preset.targetHsl.l).toBeGreaterThanOrEqual(0);
      expect(preset.targetHsl.l).toBeLessThanOrEqual(1);
    }
  });

  it('should have valid displayColor (0-255 range)', () => {
    for (const preset of HAIR_PRESETS) {
      expect(preset.displayColor.r).toBeGreaterThanOrEqual(0);
      expect(preset.displayColor.r).toBeLessThanOrEqual(255);
      expect(preset.displayColor.g).toBeGreaterThanOrEqual(0);
      expect(preset.displayColor.g).toBeLessThanOrEqual(255);
      expect(preset.displayColor.b).toBeGreaterThanOrEqual(0);
      expect(preset.displayColor.b).toBeLessThanOrEqual(255);
    }
  });

  it('should have unique names', () => {
    const names = HAIR_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should include expected colors', () => {
    const names = HAIR_PRESETS.map((p) => p.name);
    expect(names).toContain('자연갈색');
    expect(names).toContain('플래티넘');
    expect(names).toContain('버건디');
  });
});
