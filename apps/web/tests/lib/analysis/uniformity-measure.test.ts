/**
 * uniformity-measure.ts 테스트
 * @description 피부 균일도 측정 모듈 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeSkinUniformity,
  calculateRegionalUniformity,
  uniformityToDbFormat,
  generateMockUniformityResult,
  type SkinUniformityResult,
} from '@/lib/analysis/uniformity-measure';
import type { PigmentMaps, FaceLandmark } from '@/types/visual-analysis';

// ============================================
// 테스트 헬퍼
// ============================================

/**
 * 균일한 이미지 데이터 생성
 */
function createUniformImageData(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return {
    data,
    width,
    height,
    colorSpace: 'srgb' as PredefinedColorSpace,
  };
}

/**
 * 불균일한 이미지 데이터 생성 (노이즈 포함)
 */
function createUnevenImageData(
  width: number,
  height: number,
  baseR: number,
  baseG: number,
  baseB: number,
  noiseLevel: number
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;
    data[i * 4] = Math.max(0, Math.min(255, baseR + noise));
    data[i * 4 + 1] = Math.max(0, Math.min(255, baseG + noise * 0.8));
    data[i * 4 + 2] = Math.max(0, Math.min(255, baseB + noise * 0.6));
    data[i * 4 + 3] = 255;
  }
  return {
    data,
    width,
    height,
    colorSpace: 'srgb' as PredefinedColorSpace,
  };
}

/**
 * 균일한 색소 맵 생성
 */
function createUniformPigmentMaps(
  length: number,
  melaninValue: number,
  hemoglobinValue: number
): PigmentMaps {
  return {
    melanin: new Float32Array(length).fill(melaninValue),
    hemoglobin: new Float32Array(length).fill(hemoglobinValue),
  };
}

/**
 * 잡티가 있는 색소 맵 생성
 */
function createSpottedPigmentMaps(
  length: number,
  baseMelanin: number,
  baseHemoglobin: number,
  spotCount: number,
  spotIntensity: number
): PigmentMaps {
  const melanin = new Float32Array(length).fill(baseMelanin);
  const hemoglobin = new Float32Array(length).fill(baseHemoglobin);

  // 랜덤 위치에 잡티 추가
  for (let i = 0; i < spotCount; i++) {
    const spotIndex = Math.floor(Math.random() * length);
    melanin[spotIndex] = baseMelanin + spotIntensity;
  }

  return { melanin, hemoglobin };
}

/**
 * 전체 마스크 생성 (모든 픽셀 포함)
 */
function createFullMask(length: number): Uint8Array {
  return new Uint8Array(length).fill(255);
}

describe('uniformity-measure', () => {
  // ============================================
  // analyzeSkinUniformity
  // ============================================

  describe('analyzeSkinUniformity', () => {
    it('균일한 피부에 높은 점수를 부여해야 함', () => {
      const width = 100;
      const height = 100;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 0.4, 0.3);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.colorUniformity).toBeGreaterThan(80);
      expect(result.melaninUniformity).toBeGreaterThan(80);
      expect(result.hemoglobinUniformity).toBeGreaterThan(80);
      // 완전히 균일한 이미지는 excellent 또는 good
      expect(['excellent', 'good']).toContain(result.grade);
    });

    it('불균일한 피부에 낮은 점수를 부여해야 함', () => {
      const width = 100;
      const height = 100;
      const length = width * height;

      // 높은 노이즈로 불균일한 이미지
      const imageData = createUnevenImageData(width, height, 180, 160, 150, 50);
      const faceMask = createFullMask(length);
      // 잡티가 많은 색소 맵
      const pigmentMaps = createSpottedPigmentMaps(length, 0.4, 0.3, 500, 0.4);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.overallScore).toBeLessThan(70);
      expect(result.spotCount).toBeGreaterThan(0);
    });

    it('결과에 모든 필수 필드가 포함되어야 함', () => {
      const width = 50;
      const height = 50;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 0.4, 0.3);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('colorUniformity');
      expect(result).toHaveProperty('melaninUniformity');
      expect(result).toHaveProperty('hemoglobinUniformity');
      expect(result).toHaveProperty('textureUniformity');
      expect(result).toHaveProperty('spotCount');
      expect(result).toHaveProperty('problemAreas');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('description');
    });

    it('점수는 0-100 범위여야 함', () => {
      const width = 50;
      const height = 50;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 0.5, 0.4);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.colorUniformity).toBeGreaterThanOrEqual(0);
      expect(result.colorUniformity).toBeLessThanOrEqual(100);
    });

    it('빈 마스크에 대해 기본값을 반환해야 함', () => {
      const width = 10;
      const height = 10;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const emptyMask = new Uint8Array(length); // 모두 0
      const pigmentMaps = createUniformPigmentMaps(length, 0.4, 0.3);

      const result = analyzeSkinUniformity(imageData, emptyMask, pigmentMaps);

      // 빈 마스크면 기본값 반환
      expect(result.overallScore).toBeDefined();
    });
  });

  // ============================================
  // 등급 판정
  // ============================================

  describe('등급 판정', () => {
    it('excellent 등급: 85점 이상', () => {
      const width = 100;
      const height = 100;
      const length = width * height;

      // 매우 균일한 데이터
      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 0.4, 0.3);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      // 완전히 균일하면 excellent 가능
      if (result.overallScore >= 85) {
        expect(result.grade).toBe('excellent');
      }
    });

    it('poor 등급: 50점 미만', () => {
      const width = 100;
      const height = 100;
      const length = width * height;

      // 매우 불균일한 데이터
      const imageData = createUnevenImageData(width, height, 180, 160, 150, 80);
      const faceMask = createFullMask(length);
      const pigmentMaps = createSpottedPigmentMaps(length, 0.4, 0.3, 1000, 0.5);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      if (result.overallScore < 50) {
        expect(result.grade).toBe('poor');
      }
    });
  });

  // ============================================
  // 문제 영역 감지
  // ============================================

  describe('문제 영역 감지', () => {
    it('멜라닌 이상치가 많으면 spot 문제를 감지해야 함', () => {
      const width = 100;
      const height = 100;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      // 많은 잡티
      const pigmentMaps = createSpottedPigmentMaps(length, 0.3, 0.2, 800, 0.6);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      // 잡티가 많으면 problemAreas에 포함될 수 있음
      if (result.melaninUniformity < 50) {
        expect(result.problemAreas.length).toBeGreaterThan(0);
      }
    });

    it('문제 영역은 심각도 순으로 정렬되어야 함', () => {
      const width = 100;
      const height = 100;
      const length = width * height;

      const imageData = createUnevenImageData(width, height, 180, 160, 150, 60);
      const faceMask = createFullMask(length);
      const pigmentMaps = createSpottedPigmentMaps(length, 0.3, 0.3, 500, 0.5);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      if (result.problemAreas.length > 1) {
        for (let i = 0; i < result.problemAreas.length - 1; i++) {
          expect(result.problemAreas[i].severity).toBeGreaterThanOrEqual(
            result.problemAreas[i + 1].severity
          );
        }
      }
    });
  });

  // ============================================
  // uniformityToDbFormat
  // ============================================

  describe('uniformityToDbFormat', () => {
    it('DB 저장 형식으로 올바르게 변환해야 함', () => {
      const mockResult: SkinUniformityResult = {
        overallScore: 75,
        colorUniformity: 80,
        melaninUniformity: 70,
        hemoglobinUniformity: 72,
        textureUniformity: 78,
        spotCount: 3,
        problemAreas: [
          { type: 'spot', region: 'left_cheek', severity: 40, description: '왼쪽 볼에 색소 침착' },
        ],
        grade: 'good',
        description: '피부 톤이 대체로 균일해요.',
      };

      const dbFormat = uniformityToDbFormat(mockResult);

      expect(dbFormat.uniformity_score).toBe(75);
      expect(dbFormat.grade).toBe('good');
      expect(dbFormat.spot_count).toBe(3);
      expect(dbFormat.details.color).toBe(80);
      expect(dbFormat.details.melanin).toBe(70);
      expect(dbFormat.details.hemoglobin).toBe(72);
      expect(dbFormat.details.texture).toBe(78);
      expect(dbFormat.problem_areas).toHaveLength(1);
      expect(dbFormat.problem_areas[0].type).toBe('spot');
    });
  });

  // ============================================
  // generateMockUniformityResult
  // ============================================

  describe('generateMockUniformityResult', () => {
    it('유효한 Mock 결과를 생성해야 함', () => {
      const mock = generateMockUniformityResult();

      expect(mock.overallScore).toBeGreaterThanOrEqual(65);
      expect(mock.overallScore).toBeLessThanOrEqual(90);
      expect(mock.grade).toBeDefined();
      expect(mock.description).toBeTruthy();
      expect(mock.spotCount).toBeGreaterThanOrEqual(0);
      expect(mock.spotCount).toBeLessThanOrEqual(5);
    });

    it('여러 번 호출 시 다른 결과를 생성해야 함', () => {
      const results = Array.from({ length: 10 }, () => generateMockUniformityResult());
      const scores = results.map((r) => r.overallScore);
      const uniqueScores = new Set(scores);

      // 10번 호출 시 최소 2개 이상 다른 점수가 있어야 함
      expect(uniqueScores.size).toBeGreaterThan(1);
    });
  });

  // ============================================
  // calculateRegionalUniformity
  // ============================================

  describe('calculateRegionalUniformity', () => {
    it('랜드마크 없이도 기본값을 반환해야 함', () => {
      const width = 100;
      const height = 100;
      const length = width * height;

      const pigmentMaps = createUniformPigmentMaps(length, 0.4, 0.3);
      const faceMask = createFullMask(length);

      // 가짜 랜드마크 (468개)
      const landmarks: FaceLandmark[] = Array.from({ length: 468 }, (_, i) => ({
        x: (i % 20) / 20,
        y: Math.floor(i / 20) / 24,
        z: 0,
      }));

      const regional = calculateRegionalUniformity(pigmentMaps, faceMask, landmarks, width, height);

      expect(regional).toHaveProperty('forehead');
      expect(regional).toHaveProperty('leftCheek');
      expect(regional).toHaveProperty('rightCheek');
      expect(regional).toHaveProperty('nose');
      expect(regional).toHaveProperty('chin');

      Object.values(regional).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  // ============================================
  // 설명 텍스트
  // ============================================

  describe('설명 텍스트', () => {
    it('등급에 따라 적절한 설명을 생성해야 함', () => {
      const width = 50;
      const height = 50;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 0.4, 0.3);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.description).toBeTruthy();
      expect(typeof result.description).toBe('string');
      expect(result.description.length).toBeGreaterThan(10);
    });
  });

  // ============================================
  // 경계값 테스트
  // ============================================

  describe('경계값 테스트', () => {
    it('1x1 픽셀 이미지에도 동작해야 함', () => {
      const imageData = createUniformImageData(1, 1, 200, 180, 170);
      const faceMask = new Uint8Array([255]);
      const pigmentMaps = createUniformPigmentMaps(1, 0.4, 0.3);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.overallScore).toBeDefined();
    });

    it('매우 큰 이미지에도 동작해야 함', () => {
      const width = 500;
      const height = 500;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 0.4, 0.3);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.overallScore).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('색소값이 모두 0인 경우에도 동작해야 함', () => {
      const width = 50;
      const height = 50;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 0, 0);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.overallScore).toBeDefined();
    });

    it('색소값이 모두 1인 경우에도 동작해야 함', () => {
      const width = 50;
      const height = 50;
      const length = width * height;

      const imageData = createUniformImageData(width, height, 200, 180, 170);
      const faceMask = createFullMask(length);
      const pigmentMaps = createUniformPigmentMaps(length, 1, 1);

      const result = analyzeSkinUniformity(imageData, faceMask, pigmentMaps);

      expect(result.overallScore).toBeDefined();
    });
  });
});
