/**
 * CIE-4 6존 분석 통합 테스트
 *
 * @module tests/lib/image-engine/cie-4/zone-analyzer-integration
 * @description performZoneAnalysis 종합 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  performZoneAnalysis,
  FACE_ZONES,
  calculateZoneBrightness,
  analyzeZoneBrightness,
  calculateUniformity,
  calculateLeftRightAsymmetry,
  calculateVerticalGradient,
  uniformityToScore,
} from '@/lib/image-engine/cie-4/zone-analyzer';
import type { RGBImageData, NormalizedRect, LightingZoneAnalysis } from '@/lib/image-engine/types';

// 테스트용 이미지 데이터 생성 헬퍼
function createTestImageData(
  width: number,
  height: number,
  fillBrightness: number
): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    data[i * 3] = fillBrightness;
    data[i * 3 + 1] = fillBrightness;
    data[i * 3 + 2] = fillBrightness;
  }

  return { data, width, height, channels: 3 };
}

// 좌우 비대칭 이미지 생성
function createLeftBrightImage(width: number, height: number): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const brightness = x < width / 2 ? 200 : 100; // 왼쪽이 밝음
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }

  return { data, width, height, channels: 3 };
}

// 상하 그라디언트 이미지 생성
function createVerticalGradientImage(
  width: number,
  height: number,
  topBright: boolean
): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const ratio = y / height;
      const brightness = topBright
        ? Math.round(200 - ratio * 100) // 위가 밝음
        : Math.round(100 + ratio * 100); // 아래가 밝음
      data[idx] = brightness;
      data[idx + 1] = brightness;
      data[idx + 2] = brightness;
    }
  }

  return { data, width, height, channels: 3 };
}

describe('performZoneAnalysis 통합 테스트', () => {
  const fullFaceRegion: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };

  // =========================================
  // 기본 기능 테스트
  // =========================================

  describe('기본 기능', () => {
    it('균일한 이미지에서 올바른 결과를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result).toBeDefined();
      expect(result.zones).toHaveLength(6);
      expect(result.uniformity).toBeCloseTo(1, 1);
      expect(result.leftRightBalance).toBeCloseTo(1, 1);
      expect(result.verticalGradient).toBeCloseTo(0, 1);
    });

    it('결과 구조가 LightingZoneAnalysis 타입과 일치한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result).toHaveProperty('zones');
      expect(result).toHaveProperty('uniformity');
      expect(result).toHaveProperty('leftRightBalance');
      expect(result).toHaveProperty('verticalGradient');

      // zones 배열 검증
      expect(Array.isArray(result.zones)).toBe(true);
      result.zones.forEach((zone) => {
        expect(zone).toHaveProperty('name');
        expect(zone).toHaveProperty('brightness');
        expect(zone).toHaveProperty('status');
      });
    });

    it('6개 존이 모두 포함된다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      const zoneNames = result.zones.map((z) => z.name);
      expect(zoneNames).toContain('forehead_left');
      expect(zoneNames).toContain('forehead_right');
      expect(zoneNames).toContain('cheek_left');
      expect(zoneNames).toContain('cheek_right');
      expect(zoneNames).toContain('chin_left');
      expect(zoneNames).toContain('chin_right');
    });
  });

  // =========================================
  // 좌우 비대칭 테스트
  // =========================================

  describe('좌우 비대칭 감지', () => {
    it('좌우 비대칭 이미지에서 낮은 balance를 반환한다', () => {
      const imageData = createLeftBrightImage(100, 100);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      // leftRightBalance는 1에서 비대칭을 뺀 값
      expect(result.leftRightBalance).toBeLessThan(0.9);
    });

    it('좌우 대칭 이미지에서 높은 balance를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 150);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result.leftRightBalance).toBeCloseTo(1, 1);
    });

    it('왼쪽이 밝으면 왼쪽 존들이 더 밝다', () => {
      const imageData = createLeftBrightImage(100, 100);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      const leftZones = result.zones.filter(
        (z) => z.name.includes('left')
      );
      const rightZones = result.zones.filter(
        (z) => z.name.includes('right')
      );

      const leftAvg = leftZones.reduce((a, b) => a + b.brightness, 0) / leftZones.length;
      const rightAvg = rightZones.reduce((a, b) => a + b.brightness, 0) / rightZones.length;

      expect(leftAvg).toBeGreaterThan(rightAvg);
    });
  });

  // =========================================
  // 상하 그라디언트 테스트
  // =========================================

  describe('상하 그라디언트 감지', () => {
    it('위가 밝으면 음수 그라디언트를 반환한다', () => {
      const imageData = createVerticalGradientImage(100, 100, true);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result.verticalGradient).toBeLessThan(0);
    });

    it('아래가 밝으면 양수 그라디언트를 반환한다', () => {
      const imageData = createVerticalGradientImage(100, 100, false);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result.verticalGradient).toBeGreaterThan(0);
    });

    it('균일하면 그라디언트가 0에 가깝다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(Math.abs(result.verticalGradient)).toBeLessThan(0.1);
    });
  });

  // =========================================
  // 밝기 상태 분류 테스트
  // =========================================

  describe('밝기 상태 분류', () => {
    it('어두운 이미지는 dark 상태를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 40);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      result.zones.forEach((zone) => {
        expect(zone.status).toBe('dark');
      });
    });

    it('정상 밝기는 normal 상태를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 120);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      result.zones.forEach((zone) => {
        expect(zone.status).toBe('normal');
      });
    });

    it('밝은 이미지는 bright 또는 overexposed 상태를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 200);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      result.zones.forEach((zone) => {
        expect(['bright', 'overexposed']).toContain(zone.status);
      });
    });

    it('과노출 이미지는 overexposed 상태를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 240);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      result.zones.forEach((zone) => {
        expect(zone.status).toBe('overexposed');
      });
    });
  });

  // =========================================
  // 부분 영역 테스트
  // =========================================

  describe('부분 영역 분석', () => {
    it('부분 영역에서도 정상 작동한다', () => {
      const imageData = createTestImageData(200, 200, 128);
      const partialRegion: NormalizedRect = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };

      const result = performZoneAnalysis(imageData, partialRegion);

      expect(result.zones).toHaveLength(6);
      expect(result.uniformity).toBeGreaterThan(0);
    });

    it('작은 영역에서도 결과를 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const smallRegion: NormalizedRect = { x: 0.4, y: 0.4, width: 0.2, height: 0.2 };

      const result = performZoneAnalysis(imageData, smallRegion);

      expect(result).toBeDefined();
      expect(result.zones).toHaveLength(6);
    });

    it('경계 밖 영역은 기본값을 사용한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const outOfBoundsRegion: NormalizedRect = { x: 1.5, y: 1.5, width: 0.5, height: 0.5 };

      const result = performZoneAnalysis(imageData, outOfBoundsRegion);

      // 에러 없이 완료되어야 함
      expect(result).toBeDefined();
    });
  });

  // =========================================
  // 균일성 점수 테스트
  // =========================================

  describe('균일성 점수', () => {
    it('완벽한 균일성은 높은 점수를 반환한다', () => {
      expect(uniformityToScore(1.0)).toBe(100);
      expect(uniformityToScore(0.9)).toBe(100);
    });

    it('낮은 균일성은 낮은 점수를 반환한다', () => {
      expect(uniformityToScore(0.3)).toBeLessThan(50);
      expect(uniformityToScore(0)).toBe(0);
    });

    it('점수가 0-100 범위 내에 있다', () => {
      for (let u = 0; u <= 1; u += 0.1) {
        const score = uniformityToScore(u);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });

  // =========================================
  // 엣지 케이스 테스트
  // =========================================

  describe('엣지 케이스', () => {
    it('1x1 이미지를 처리한다', () => {
      const imageData = createTestImageData(1, 1, 128);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result).toBeDefined();
    });

    it('0 크기 영역은 기본값을 반환한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const zeroRegion: NormalizedRect = { x: 0.5, y: 0.5, width: 0, height: 0 };

      const result = performZoneAnalysis(imageData, zeroRegion);

      // 기본값으로 처리되어야 함
      expect(result).toBeDefined();
      expect(result.zones).toHaveLength(6);
    });

    it('음수 좌표 영역을 처리한다', () => {
      const imageData = createTestImageData(100, 100, 128);
      const negativeRegion: NormalizedRect = { x: -0.5, y: -0.5, width: 2, height: 2 };

      const result = performZoneAnalysis(imageData, negativeRegion);

      expect(result).toBeDefined();
    });

    it('완전히 어두운 이미지(0)를 처리한다', () => {
      const imageData = createTestImageData(100, 100, 0);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result.uniformity).toBe(1); // 균일하게 어두움
      result.zones.forEach((zone) => {
        expect(zone.brightness).toBe(0);
        expect(zone.status).toBe('dark');
      });
    });

    it('완전히 밝은 이미지(255)를 처리한다', () => {
      const imageData = createTestImageData(100, 100, 255);
      const result = performZoneAnalysis(imageData, fullFaceRegion);

      expect(result.uniformity).toBe(1); // 균일하게 밝음
      result.zones.forEach((zone) => {
        expect(zone.brightness).toBe(255);
        expect(zone.status).toBe('overexposed');
      });
    });
  });
});
