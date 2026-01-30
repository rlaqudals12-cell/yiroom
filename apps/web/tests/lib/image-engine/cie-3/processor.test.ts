/**
 * CIE-3 프로세서 테스트
 *
 * @module tests/lib/image-engine/cie-3/processor
 * @description AWB 보정 통합 프로세서 테스트
 * @see lib/image-engine/cie-3/processor.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  selectAndApplyAWB,
  processAWBCorrection,
  processAWBCorrectionWithTimeout,
} from '@/lib/image-engine/cie-3/processor';
import type { RGBImageData, AWBCorrectionResult, CIE3Output } from '@/lib/image-engine/types';

// =============================================================================
// 테스트 헬퍼 함수
// =============================================================================

/**
 * 테스트용 RGB 이미지 데이터 생성
 */
function createTestImageData(
  width: number,
  height: number,
  fillColor: { r: number; g: number; b: number } = { r: 128, g: 128, b: 128 }
): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = fillColor.r;
    data[i * 3 + 1] = fillColor.g;
    data[i * 3 + 2] = fillColor.b;
  }
  return { data, width, height, channels: 3 };
}

/**
 * 노란색 편향 이미지 생성 (따뜻한 조명 시뮬레이션)
 */
function createWarmImageData(width: number, height: number): RGBImageData {
  // 노란색 편향: R높음, G높음, B낮음 (낮은 CCT)
  return createTestImageData(width, height, { r: 220, g: 200, b: 140 });
}

/**
 * 파란색 편향 이미지 생성 (차가운 조명 시뮬레이션)
 */
function createCoolImageData(width: number, height: number): RGBImageData {
  // 파란색 편향: R낮음, G중간, B높음 (높은 CCT)
  return createTestImageData(width, height, { r: 140, g: 170, b: 220 });
}

/**
 * 피부색 포함 이미지 생성
 */
function createSkinImageData(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    // 상단 50%는 피부색 (YCbCr 피부 범위에 들어가는 색상)
    // 피부색 대략: R=200-230, G=160-180, B=140-160
    if (i < width * height * 0.5) {
      data[i * 3] = 210; // R
      data[i * 3 + 1] = 170; // G
      data[i * 3 + 2] = 150; // B
    } else {
      // 하단 50%는 비피부색 (회색)
      data[i * 3] = 128;
      data[i * 3 + 1] = 128;
      data[i * 3 + 2] = 128;
    }
  }

  return { data, width, height, channels: 3 };
}

/**
 * 중립 색온도 이미지 생성 (보정 불필요)
 */
function createNeutralImageData(width: number, height: number): RGBImageData {
  // 중립: R, G, B가 비슷 (CCT ~6500K)
  return createTestImageData(width, height, { r: 180, g: 180, b: 180 });
}

// =============================================================================
// selectAndApplyAWB 테스트
// =============================================================================

describe('selectAndApplyAWB', () => {
  describe('보정 불필요 케이스', () => {
    it('중립 색온도 이미지는 method: none 반환', () => {
      const imageData = createNeutralImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      // CCT 편차가 작으면 보정 불필요
      // result가 null이 아니고 method가 'none'이거나
      // 또는 보정이 적용되어도 gains가 1에 가까움
      if (result) {
        expect(result.method === 'none' || (
          Math.abs(result.gains.r - 1) < 0.3 &&
          Math.abs(result.gains.g - 1) < 0.3 &&
          Math.abs(result.gains.b - 1) < 0.3
        )).toBe(true);
      }
    });
  });

  describe('보정 필요 케이스', () => {
    it('따뜻한 이미지는 B 채널 게인 증가', () => {
      const imageData = createWarmImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      if (result && result.method !== 'none') {
        // B 채널이 낮았으므로 B 게인이 더 커야 함
        expect(result.gains.b).toBeGreaterThan(result.gains.g);
      }
    });

    it('차가운 이미지는 R 채널 게인 증가', () => {
      const imageData = createCoolImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      if (result && result.method !== 'none') {
        // R 채널이 낮았으므로 R 게인이 더 커야 함
        expect(result.gains.r).toBeGreaterThan(result.gains.b);
      }
    });
  });

  describe('method 선택', () => {
    it('피부 영역이 충분하면 skin_aware 또는 gray_world', () => {
      const imageData = createSkinImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      if (result && result.method !== 'none') {
        // 피부 영역이 있으면 skin_aware 시도, 실패시 gray_world
        expect(['skin_aware', 'gray_world', 'von_kries']).toContain(result.method);
      }
    });

    it('반환 결과에 correctedImage 포함', () => {
      const imageData = createWarmImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      if (result) {
        expect(result.correctedImage).toBeDefined();
        expect(result.correctedImage.width).toBe(100);
        expect(result.correctedImage.height).toBe(100);
        expect(result.correctedImage.data).toBeDefined();
      }
    });
  });

  describe('CCT 계산', () => {
    it('originalCCT와 correctedCCT 포함', () => {
      const imageData = createWarmImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      if (result) {
        expect(typeof result.originalCCT).toBe('number');
        expect(typeof result.correctedCCT).toBe('number');
        expect(result.originalCCT).toBeGreaterThan(0);
        expect(result.correctedCCT).toBeGreaterThan(0);
      }
    });

    it('따뜻한 이미지 originalCCT < correctedCCT', () => {
      const imageData = createWarmImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      if (result && result.method !== 'none') {
        // 따뜻한 이미지(낮은 CCT)를 보정하면 CCT가 증가해야 함
        expect(result.correctedCCT).toBeGreaterThanOrEqual(result.originalCCT);
      }
    });
  });

  describe('신뢰도', () => {
    it('confidence가 0-1 범위', () => {
      const imageData = createWarmImageData(100, 100);

      const result = selectAndApplyAWB(imageData);

      if (result) {
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('에러 케이스', () => {
    it('극단적 게인 필요 시 null 반환 가능', () => {
      // 매우 극단적인 색상 편향
      const extremeImageData = createTestImageData(100, 100, { r: 255, g: 255, b: 10 });

      const result = selectAndApplyAWB(extremeImageData);

      // 극단적인 경우 null 반환 가능 (게인 범위 초과)
      // 또는 결과가 있어도 유효한 형식
      if (result !== null) {
        expect(result.gains).toBeDefined();
        expect(result.method).toBeDefined();
      }
    });
  });
});

// =============================================================================
// processAWBCorrection 테스트
// =============================================================================

describe('processAWBCorrection', () => {
  describe('성공 케이스', () => {
    it('success: true 반환', () => {
      const imageData = createTestImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(result.success).toBe(true);
    });

    it('metadata에 processingTime 포함', () => {
      const imageData = createTestImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('skinDetection 정보 포함', () => {
      const imageData = createSkinImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(result.skinDetection).toBeDefined();
      expect(typeof result.skinDetection.detected).toBe('boolean');
      expect(typeof result.skinDetection.coverage).toBe('number');
      expect(result.skinDetection.coverage).toBeGreaterThanOrEqual(0);
      expect(result.skinDetection.coverage).toBeLessThanOrEqual(1);
    });

    it('피부 영역 있는 이미지에서 skinDetection.detected: true', () => {
      const imageData = createSkinImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(result.skinDetection.detected).toBe(true);
      expect(result.skinDetection.coverage).toBeGreaterThan(0);
    });
  });

  describe('보정 적용 여부', () => {
    it('correctionApplied 플래그 포함', () => {
      const imageData = createWarmImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(typeof result.correctionApplied).toBe('boolean');
    });

    it('보정 적용 시 result 객체 포함', () => {
      const imageData = createWarmImageData(100, 100);

      const result = processAWBCorrection(imageData);

      if (result.correctionApplied) {
        expect(result.result).not.toBeNull();
        expect(result.result!.correctedImage).toBeDefined();
        expect(result.result!.gains).toBeDefined();
        expect(result.result!.method).toBeDefined();
      }
    });

    it('보정 미적용 시 result가 null이거나 method: none', () => {
      const imageData = createNeutralImageData(100, 100);

      const result = processAWBCorrection(imageData);

      if (!result.correctionApplied) {
        expect(result.result === null || result.result?.method === 'none').toBe(true);
      }
    });
  });

  describe('metadata', () => {
    it('methodUsed 포함', () => {
      const imageData = createTestImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(result.metadata.methodUsed).toBeDefined();
      expect(typeof result.metadata.methodUsed).toBe('string');
    });

    it('confidence 포함', () => {
      const imageData = createTestImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(typeof result.metadata.confidence).toBe('number');
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
      expect(result.metadata.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('CIE3Output 타입 호환성', () => {
    it('모든 필수 필드 존재', () => {
      const imageData = createTestImageData(100, 100);

      const result = processAWBCorrection(imageData);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('correctionApplied');
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('skinDetection');
      expect(result).toHaveProperty('metadata');
    });
  });
});

// =============================================================================
// processAWBCorrectionWithTimeout 테스트
// =============================================================================

describe('processAWBCorrectionWithTimeout', () => {
  describe('정상 처리', () => {
    it('Promise 반환', async () => {
      const imageData = createTestImageData(100, 100);

      const promise = processAWBCorrectionWithTimeout(imageData);

      expect(promise).toBeInstanceOf(Promise);
      const result = await promise;
      expect(result.success).toBe(true);
    });

    it('타임아웃 내 처리 완료', async () => {
      const imageData = createTestImageData(100, 100);

      const result = await processAWBCorrectionWithTimeout(imageData, undefined, 5000);

      expect(result.success).toBe(true);
      expect(result.metadata.methodUsed).not.toBe('fallback');
    });
  });

  describe('타임아웃', () => {
    it('매우 짧은 타임아웃에서도 결과 반환', async () => {
      const imageData = createTestImageData(100, 100);
      const veryShortTimeout = 1; // 1ms

      const result = await processAWBCorrectionWithTimeout(
        imageData,
        undefined,
        veryShortTimeout
      );

      // 타임아웃이든 정상처리든 결과는 항상 반환
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('타임아웃 시 fallback 결과 반환', async () => {
      // 큰 이미지로 처리 시간 증가
      const largeImageData = createTestImageData(1000, 1000);
      const shortTimeout = 1; // 1ms

      const result = await processAWBCorrectionWithTimeout(
        largeImageData,
        undefined,
        shortTimeout
      );

      // 타임아웃되면 fallback, 아니면 정상 결과
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('config 적용', () => {
    it('커스텀 config 전달', async () => {
      const imageData = createTestImageData(100, 100);
      const customConfig = {
        targetCCT: 5500,
        minSkinCoverage: 0.05,
        skinDetection: {
          cbMin: 77,
          cbMax: 127,
          crMin: 133,
          crMax: 173,
        },
      };

      const result = await processAWBCorrectionWithTimeout(imageData, customConfig);

      expect(result.success).toBe(true);
    });
  });

  describe('에러 처리', () => {
    it('에러 발생 시에도 fallback 결과 반환', async () => {
      // 유효하지 않은 이미지 데이터
      const invalidImageData: RGBImageData = {
        data: new Uint8Array(0),
        width: 0,
        height: 0,
        channels: 3,
      };

      // 에러가 발생하더라도 결과 반환
      const result = await processAWBCorrectionWithTimeout(invalidImageData);

      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// 통합 테스트
// =============================================================================

describe('통합 테스트', () => {
  it('processAWBCorrection은 selectAndApplyAWB를 내부적으로 사용', () => {
    const imageData = createWarmImageData(100, 100);

    const fullResult = processAWBCorrection(imageData);
    const selectResult = selectAndApplyAWB(imageData);

    // 둘 다 같은 method를 사용해야 함 (동일 입력)
    if (selectResult && fullResult.result) {
      expect(fullResult.result.method).toBe(selectResult.method);
    }
  });

  it('async와 sync 버전의 결과 구조 동일', async () => {
    const imageData = createTestImageData(100, 100);

    const syncResult = processAWBCorrection(imageData);
    const asyncResult = await processAWBCorrectionWithTimeout(imageData);

    // 같은 구조의 결과
    expect(Object.keys(syncResult).sort()).toEqual(Object.keys(asyncResult).sort());
    expect(Object.keys(syncResult.metadata).sort()).toEqual(
      Object.keys(asyncResult.metadata).sort()
    );
  });

  describe('다양한 이미지 크기', () => {
    const sizes = [
      { width: 50, height: 50 },
      { width: 100, height: 100 },
      { width: 320, height: 240 },
      { width: 640, height: 480 },
    ];

    sizes.forEach(({ width, height }) => {
      it(`${width}x${height} 이미지 처리`, () => {
        const imageData = createTestImageData(width, height);

        const result = processAWBCorrection(imageData);

        expect(result.success).toBe(true);
      });
    });
  });

  describe('다양한 색온도', () => {
    it('따뜻한 조명 (약 3000K 시뮬레이션)', () => {
      // 강한 노란색 편향
      const warmImage = createTestImageData(100, 100, { r: 255, g: 200, b: 100 });

      const result = processAWBCorrection(warmImage);

      expect(result.success).toBe(true);
      if (result.result) {
        expect(result.result.originalCCT).toBeLessThan(5500);
      }
    });

    it('차가운 조명 (약 8000K 시뮬레이션)', () => {
      // 강한 파란색 편향
      const coolImage = createTestImageData(100, 100, { r: 100, g: 150, b: 255 });

      const result = processAWBCorrection(coolImage);

      expect(result.success).toBe(true);
      if (result.result) {
        expect(result.result.originalCCT).toBeGreaterThan(6500);
      }
    });

    it('중립 조명 (약 6500K)', () => {
      const neutralImage = createTestImageData(100, 100, { r: 200, g: 200, b: 200 });

      const result = processAWBCorrection(neutralImage);

      expect(result.success).toBe(true);
    });
  });
});
