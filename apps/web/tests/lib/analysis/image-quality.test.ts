/**
 * CIE-1 이미지 품질 검증 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  calculateSharpness,
  validateResolution,
  analyzeBrightness,
  assessImageQuality,
} from '@/lib/analysis/image-quality';

// ImageData를 생성하는 헬퍼 (브라우저 API 없이 테스트)
function createImageData(
  width: number,
  height: number,
  fillFn: (x: number, y: number) => [number, number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const [r, g, b, a] = fillFn(x, y);
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

// 균일한 색상의 ImageData (에지 없음 → sharpness 0)
function createUniformImage(width: number, height: number, gray: number): ImageData {
  return createImageData(width, height, () => [gray, gray, gray, 255]);
}

// 체커보드 패턴 (고대비 에지 풍부 → sharpness 높음)
function createCheckerboardImage(width: number, height: number): ImageData {
  return createImageData(width, height, (x, y) => {
    const isWhite = (x + y) % 2 === 0;
    const v = isWhite ? 255 : 0;
    return [v, v, v, 255];
  });
}

// 어두운 이미지
function createDarkImage(width: number, height: number): ImageData {
  return createUniformImage(width, height, 20);
}

// 밝은 이미지
function createBrightImage(width: number, height: number): ImageData {
  return createUniformImage(width, height, 240);
}

// 적정 밝기 이미지
function createNormalBrightnessImage(width: number, height: number): ImageData {
  return createUniformImage(width, height, 128);
}

describe('validateResolution', () => {
  it('최소 크기 미달 시 valid=false 반환', () => {
    const result = validateResolution(100, 100, 200);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('200x200px');
  });

  it('최소 크기 충족 시 valid=true 반환', () => {
    const result = validateResolution(400, 600, 200);
    expect(result.valid).toBe(true);
    expect(result.message).toContain('충분');
  });

  it('너비만 미달인 경우 valid=false', () => {
    const result = validateResolution(100, 500, 200);
    expect(result.valid).toBe(false);
  });

  it('높이만 미달인 경우 valid=false', () => {
    const result = validateResolution(500, 100, 200);
    expect(result.valid).toBe(false);
  });

  it('0 또는 음수 크기는 유효하지 않음', () => {
    expect(validateResolution(0, 100).valid).toBe(false);
    expect(validateResolution(100, -1).valid).toBe(false);
    expect(validateResolution(-5, -5).valid).toBe(false);
  });

  it('기본 최소 크기(200)를 사용', () => {
    const under = validateResolution(150, 150);
    expect(under.valid).toBe(false);

    const over = validateResolution(200, 200);
    expect(over.valid).toBe(true);
  });
});

describe('analyzeBrightness', () => {
  it('어두운 이미지는 too_dark 반환', () => {
    const img = createDarkImage(10, 10);
    const result = analyzeBrightness(img);
    expect(result.level).toBe('too_dark');
    expect(result.average).toBeLessThan(60);
  });

  it('밝은 이미지는 too_bright 반환', () => {
    const img = createBrightImage(10, 10);
    const result = analyzeBrightness(img);
    expect(result.level).toBe('too_bright');
    expect(result.average).toBeGreaterThan(220);
  });

  it('적정 밝기 이미지는 ok 반환', () => {
    const img = createNormalBrightnessImage(10, 10);
    const result = analyzeBrightness(img);
    expect(result.level).toBe('ok');
    expect(result.average).toBeGreaterThanOrEqual(60);
    expect(result.average).toBeLessThanOrEqual(220);
  });

  it('average 값이 정수로 반올림됨', () => {
    const img = createUniformImage(10, 10, 127);
    const result = analyzeBrightness(img);
    expect(Number.isInteger(result.average)).toBe(true);
  });
});

describe('calculateSharpness', () => {
  it('균일한 이미지(에지 없음)는 sharpness 0', () => {
    const img = createUniformImage(20, 20, 128);
    const sharpness = calculateSharpness(img);
    expect(sharpness).toBe(0);
  });

  it('체커보드(고대비)는 균일 이미지보다 sharpness 높음', () => {
    const uniform = createUniformImage(20, 20, 128);
    const checker = createCheckerboardImage(20, 20);
    const uniformScore = calculateSharpness(uniform);
    const checkerScore = calculateSharpness(checker);
    expect(checkerScore).toBeGreaterThan(uniformScore);
  });

  it('sharpness는 0 이상의 값', () => {
    const img = createUniformImage(10, 10, 100);
    const sharpness = calculateSharpness(img);
    expect(sharpness).toBeGreaterThanOrEqual(0);
  });

  it('최소 3x3 크기 이미지에서도 동작', () => {
    const img = createCheckerboardImage(3, 3);
    const sharpness = calculateSharpness(img);
    expect(sharpness).toBeGreaterThanOrEqual(0);
  });
});

describe('assessImageQuality', () => {
  it('좋은 품질 이미지: isAcceptable=true, 높은 점수', () => {
    // 고대비 + 적정 밝기 + 충분한 해상도
    const img = createCheckerboardImage(400, 400);
    const result = assessImageQuality(img, 400, 400);
    expect(result.isAcceptable).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(40);
    expect(result.resolution.valid).toBe(true);
    expect(result.brightness.level).toBe('ok');
  });

  it('흐리고 어둡고 작은 이미지: isAcceptable=false, 낮은 점수', () => {
    // 균일(흐림) + 어두움 + 작은 해상도
    const img = createDarkImage(50, 50);
    const result = assessImageQuality(img, 50, 50);
    expect(result.isAcceptable).toBe(false);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.resolution.valid).toBe(false);
  });

  it('해상도만 부족한 경우 감점', () => {
    const img = createCheckerboardImage(100, 100);
    const result = assessImageQuality(img, 100, 100);
    expect(result.resolution.valid).toBe(false);
    // 해상도 감점으로 점수가 좋은 품질보다 낮아야 함
    const goodResult = assessImageQuality(createCheckerboardImage(400, 400), 400, 400);
    expect(result.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it('한국어 제안 메시지가 포함됨', () => {
    // 어둡고 작은 이미지
    const img = createDarkImage(50, 50);
    const result = assessImageQuality(img, 50, 50);
    expect(result.suggestions.length).toBeGreaterThan(0);

    // 한국어 포함 확인
    const hasKorean = result.suggestions.some((s) => /[가-힣]/.test(s));
    expect(hasKorean).toBe(true);
  });

  it('너무 밝은 이미지에 대한 제안 포함', () => {
    const img = createBrightImage(400, 400);
    const result = assessImageQuality(img, 400, 400);
    const hasBrightSuggestion = result.suggestions.some((s) => s.includes('밝아요'));
    expect(hasBrightSuggestion).toBe(true);
  });

  it('너무 어두운 이미지에 대한 제안 포함', () => {
    const img = createDarkImage(400, 400);
    const result = assessImageQuality(img, 400, 400);
    const hasDarkSuggestion = result.suggestions.some((s) => s.includes('어두워요'));
    expect(hasDarkSuggestion).toBe(true);
  });

  it('흐린 이미지에 대한 제안 포함', () => {
    // 균일한 이미지 = sharpness 0 → 흐림 메시지
    const img = createNormalBrightnessImage(400, 400);
    const result = assessImageQuality(img, 400, 400);
    const hasBlurSuggestion = result.suggestions.some((s) => s.includes('흐려요'));
    expect(hasBlurSuggestion).toBe(true);
  });

  it('좋은 품질이면 긍정 메시지 포함', () => {
    const img = createCheckerboardImage(400, 400);
    const result = assessImageQuality(img, 400, 400);
    // 선명도가 충분하고 밝기도 OK면 긍정 메시지
    if (result.sharpness >= 40 && result.brightness.level === 'ok') {
      const hasPositive = result.suggestions.some((s) => s.includes('좋아요'));
      expect(hasPositive).toBe(true);
    }
  });

  it('overallScore가 0-100 범위', () => {
    const cases = [
      createDarkImage(50, 50),
      createBrightImage(400, 400),
      createCheckerboardImage(400, 400),
      createNormalBrightnessImage(400, 400),
    ];
    const sizes = [
      [50, 50],
      [400, 400],
      [400, 400],
      [400, 400],
    ];

    cases.forEach((img, i) => {
      const result = assessImageQuality(img, sizes[i][0], sizes[i][1]);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
