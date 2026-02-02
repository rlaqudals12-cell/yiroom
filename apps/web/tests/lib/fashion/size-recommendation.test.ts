/**
 * 사이즈 추천 로직 테스트
 *
 * @module tests/lib/fashion/size-recommendation
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 3.3
 */

import { describe, it, expect } from 'vitest';
import {
  determineHeightFit,
  recommendSize,
  convertToUnisexSize,
  convertFromUnisexSize,
  type UserMeasurements,
} from '@/lib/fashion/size-recommendation';

// ============================================================================
// determineHeightFit
// ============================================================================

describe('determineHeightFit', () => {
  describe('여성 키 분류', () => {
    it('should return petite for height <= 155cm', () => {
      expect(determineHeightFit(155, 'female')).toBe('petite');
      expect(determineHeightFit(150, 'female')).toBe('petite');
      expect(determineHeightFit(145, 'female')).toBe('petite');
    });

    it('should return regular for height 156-169cm', () => {
      expect(determineHeightFit(160, 'female')).toBe('regular');
      expect(determineHeightFit(165, 'female')).toBe('regular');
      expect(determineHeightFit(169, 'female')).toBe('regular');
    });

    it('should return long for height >= 170cm', () => {
      expect(determineHeightFit(170, 'female')).toBe('long');
      expect(determineHeightFit(175, 'female')).toBe('long');
      expect(determineHeightFit(180, 'female')).toBe('long');
    });
  });

  describe('남성 키 분류', () => {
    it('should return short for height < 170cm', () => {
      expect(determineHeightFit(165, 'male')).toBe('short');
      expect(determineHeightFit(169, 'male')).toBe('short');
      expect(determineHeightFit(160, 'male')).toBe('short');
    });

    it('should return regular for height 170-179cm', () => {
      expect(determineHeightFit(170, 'male')).toBe('regular');
      expect(determineHeightFit(175, 'male')).toBe('regular');
      expect(determineHeightFit(179, 'male')).toBe('regular');
    });

    it('should return long for height >= 180cm', () => {
      expect(determineHeightFit(180, 'male')).toBe('long');
      expect(determineHeightFit(185, 'male')).toBe('long');
      expect(determineHeightFit(190, 'male')).toBe('long');
    });
  });

  describe('경계값 테스트', () => {
    it('should handle exact boundary values correctly', () => {
      // 여성 경계
      expect(determineHeightFit(155, 'female')).toBe('petite');
      expect(determineHeightFit(156, 'female')).toBe('regular');
      expect(determineHeightFit(170, 'female')).toBe('long');

      // 남성 경계
      expect(determineHeightFit(169, 'male')).toBe('short');
      expect(determineHeightFit(170, 'male')).toBe('regular');
      expect(determineHeightFit(180, 'male')).toBe('long');
    });
  });
});

// ============================================================================
// recommendSize (SizeProfile 반환)
// ============================================================================

describe('recommendSize', () => {
  describe('남성 사이즈 추천', () => {
    it('should return complete SizeProfile for male', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95,
        waist: 80,
        hip: 95,
      };

      const result = recommendSize(measurements, 'male');

      expect(result).toHaveProperty('gender', 'male');
      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('recommendations');
      expect(result.recommendations).toHaveProperty('top');
      expect(result.recommendations).toHaveProperty('bottom');
      expect(result.recommendations).toHaveProperty('outer');
      expect(result.recommendations.dress).toBeNull(); // 남성은 드레스 없음
    });

    it('should recommend 100 based on chest measurement for male', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95, // 94-100 범위 = 100
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top.recommendedSize).toBe('100');
    });

    it('should recommend 105 for larger chest measurement', () => {
      const measurements: UserMeasurements = {
        height: 180,
        weight: 85,
        chest: 102, // 100-106 범위 = 105
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top.recommendedSize).toBe('105');
    });

    it('should recommend 95 for smaller chest measurement', () => {
      const measurements: UserMeasurements = {
        height: 170,
        weight: 60,
        chest: 90, // 88-94 범위 = 95
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top.recommendedSize).toBe('95');
    });
  });

  describe('여성 사이즈 추천', () => {
    it('should return complete SizeProfile for female', () => {
      const measurements: UserMeasurements = {
        height: 165,
        weight: 55,
        chest: 86,
      };

      const result = recommendSize(measurements, 'female');

      expect(result.gender).toBe('female');
      expect(result.recommendations.dress).not.toBeNull(); // 여성은 드레스 추천 있음
    });

    it('should recommend 85 for small chest measurement', () => {
      const measurements: UserMeasurements = {
        height: 155,
        weight: 48,
        chest: 82, // 78-84 범위 = 85
      };

      const result = recommendSize(measurements, 'female');

      expect(result.recommendations.top.recommendedSize).toBe('85');
      expect(result.recommendations.top.heightFit).toBe('petite');
    });

    it('should recommend 90 for standard female measurements', () => {
      const measurements: UserMeasurements = {
        height: 165,
        weight: 55,
        chest: 86, // 84-90 범위 = 90
      };

      const result = recommendSize(measurements, 'female');

      expect(result.recommendations.top.recommendedSize).toBe('90');
    });

    it('should recommend 95 for larger female chest', () => {
      const measurements: UserMeasurements = {
        height: 168,
        weight: 60,
        chest: 92, // 90-96 범위 = 95
      };

      const result = recommendSize(measurements, 'female');

      expect(result.recommendations.top.recommendedSize).toBe('95');
    });
  });

  describe('체형별 조정', () => {
    it('should include body type tips for S (Straight) body type', () => {
      const measurements: UserMeasurements = {
        height: 170,
        weight: 65,
        chest: 92,
      };

      const result = recommendSize(measurements, 'male', 'S');

      expect(result.bodyType).toBe('S');
      expect(result.generalTips.some((t) => t.includes('직선'))).toBe(true);
    });

    it('should include body type tips for W (Wave) body type', () => {
      const measurements: UserMeasurements = {
        height: 165,
        weight: 55,
        chest: 86,
      };

      const result = recommendSize(measurements, 'female', 'W');

      expect(result.bodyType).toBe('W');
      expect(result.generalTips.some((t) => t.includes('허리'))).toBe(true);
    });

    it('should include body type tips for N (Natural) body type', () => {
      const measurements: UserMeasurements = {
        height: 178,
        weight: 75,
        chest: 98,
      };

      const result = recommendSize(measurements, 'male', 'N');

      expect(result.bodyType).toBe('N');
      expect(result.generalTips.some((t) => t.includes('오버핏'))).toBe(true);
    });

    it('should adjust fitType based on body type', () => {
      const measurements: UserMeasurements = {
        height: 165,
        weight: 55,
        chest: 86,
      };

      const waveResult = recommendSize(measurements, 'female', 'W');
      const naturalResult = recommendSize(measurements, 'female', 'N');

      expect(waveResult.recommendations.top.fitType).toBe('slim');
      expect(naturalResult.recommendations.top.fitType).toBe('relaxed');
    });
  });

  describe('아우터 사이즈 추천', () => {
    it('should recommend outer one size up from top', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95, // top = 100
      };

      const result = recommendSize(measurements, 'male');

      // 상의 100 → 아우터 105
      expect(result.recommendations.top.recommendedSize).toBe('100');
      expect(result.recommendations.outer.recommendedSize).toBe('105');
    });
  });

  describe('신발 사이즈 추천', () => {
    it('should return null for shoes when footLength is not provided', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        // footLength 없음
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.shoes).toBeNull();
    });

    it('should recommend shoes when footLength is provided', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        footLength: 265,
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.shoes).not.toBeNull();
      expect(result.recommendations.shoes?.recommendedSize).toBe('265');
    });
  });

  describe('하의 사이즈 추천', () => {
    it('should recommend bottom size based on waist', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        waist: 81, // 81cm = 약 32인치
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.bottom.recommendedSize).toBe('32');
    });

    it('should estimate bottom size from BMI when waist is not provided', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        // waist 없음
      };

      const result = recommendSize(measurements, 'male');

      // BMI 22.9 → regular → 30 예상
      expect(result.recommendations.bottom.recommendedSize).toBeDefined();
      expect(result.recommendations.bottom.confidence).toBeLessThan(90);
    });
  });

  describe('대안 사이즈 제공', () => {
    it('should provide alternative sizes for top', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95,
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top.alternativeSizes).toBeDefined();
      expect(result.recommendations.top.alternativeSizes.length).toBeGreaterThan(0);
    });
  });

  describe('신뢰도 점수', () => {
    it('should have higher confidence with chest measurement', () => {
      const withChest: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95,
      };
      const withoutChest: UserMeasurements = {
        height: 175,
        weight: 70,
      };

      const resultWithChest = recommendSize(withChest, 'male');
      const resultWithoutChest = recommendSize(withoutChest, 'male');

      expect(resultWithChest.recommendations.top.confidence).toBeGreaterThan(
        resultWithoutChest.recommendations.top.confidence
      );
    });
  });
});

// ============================================================================
// convertToUnisexSize / convertFromUnisexSize
// ============================================================================

describe('convertToUnisexSize', () => {
  describe('남성 사이즈 변환', () => {
    it('should convert male 95 to XS', () => {
      expect(convertToUnisexSize('95', 'male')).toBe('XS');
    });

    it('should convert male 100 to S', () => {
      expect(convertToUnisexSize('100', 'male')).toBe('S');
    });

    it('should convert male 105 to M', () => {
      expect(convertToUnisexSize('105', 'male')).toBe('M');
    });

    it('should convert male 110 to L', () => {
      expect(convertToUnisexSize('110', 'male')).toBe('L');
    });

    it('should convert male 115 to XL', () => {
      expect(convertToUnisexSize('115', 'male')).toBe('XL');
    });
  });

  describe('여성 사이즈 변환', () => {
    it('should convert female 85 to XS', () => {
      expect(convertToUnisexSize('85', 'female')).toBe('XS');
    });

    it('should convert female 90 to S', () => {
      expect(convertToUnisexSize('90', 'female')).toBe('S');
    });

    it('should convert female 95 to M', () => {
      expect(convertToUnisexSize('95', 'female')).toBe('M');
    });

    it('should convert female 100 to L', () => {
      expect(convertToUnisexSize('100', 'female')).toBe('L');
    });

    it('should convert female 105 to XL', () => {
      expect(convertToUnisexSize('105', 'female')).toBe('XL');
    });
  });

  describe('알 수 없는 사이즈 처리', () => {
    it('should return M as default for unknown size', () => {
      expect(convertToUnisexSize('120', 'male')).toBe('M');
      expect(convertToUnisexSize('80', 'female')).toBe('M');
    });
  });
});

describe('convertFromUnisexSize', () => {
  describe('유니섹스 → 남성 사이즈 변환', () => {
    it('should convert XS to male 95', () => {
      expect(convertFromUnisexSize('XS', 'male')).toBe('95');
    });

    it('should convert S to male 100', () => {
      expect(convertFromUnisexSize('S', 'male')).toBe('100');
    });

    it('should convert M to male 105', () => {
      expect(convertFromUnisexSize('M', 'male')).toBe('105');
    });

    it('should convert L to male 110', () => {
      expect(convertFromUnisexSize('L', 'male')).toBe('110');
    });

    it('should convert XL to male 115', () => {
      expect(convertFromUnisexSize('XL', 'male')).toBe('115');
    });
  });

  describe('유니섹스 → 여성 사이즈 변환', () => {
    it('should convert XS to female 85', () => {
      expect(convertFromUnisexSize('XS', 'female')).toBe('85');
    });

    it('should convert S to female 90', () => {
      expect(convertFromUnisexSize('S', 'female')).toBe('90');
    });

    it('should convert M to female 95', () => {
      expect(convertFromUnisexSize('M', 'female')).toBe('95');
    });

    it('should convert L to female 100', () => {
      expect(convertFromUnisexSize('L', 'female')).toBe('100');
    });

    it('should convert XL to female 105', () => {
      expect(convertFromUnisexSize('XL', 'female')).toBe('105');
    });
  });

  describe('알 수 없는 사이즈 처리', () => {
    it('should return default size for unknown unisex size', () => {
      expect(convertFromUnisexSize('3XL', 'male')).toBe('100');
      expect(convertFromUnisexSize('4XL', 'female')).toBe('90');
    });
  });
});

// ============================================================================
// 통합 시나리오 테스트
// ============================================================================

describe('통합 시나리오', () => {
  describe('실제 사용 케이스', () => {
    it('should handle complete sizing workflow for male user', () => {
      const measurements: UserMeasurements = {
        height: 178,
        weight: 75,
        chest: 98, // 94-100 범위 = 100
      };

      // 1. 키 핏 결정
      const heightFit = determineHeightFit(measurements.height, 'male');
      expect(heightFit).toBe('regular');

      // 2. 사이즈 추천
      const profile = recommendSize(measurements, 'male');
      expect(profile.recommendations.top.recommendedSize).toBe('100');

      // 3. 유니섹스 변환
      const unisex = convertToUnisexSize(profile.recommendations.top.recommendedSize, 'male');
      expect(unisex).toBe('S');
    });

    it('should handle complete sizing workflow for female user', () => {
      const measurements: UserMeasurements = {
        height: 162,
        weight: 52,
        chest: 86, // 84-90 범위 = 90
      };

      // 1. 키 핏 결정
      const heightFit = determineHeightFit(measurements.height, 'female');
      expect(heightFit).toBe('regular');

      // 2. 사이즈 추천
      const profile = recommendSize(measurements, 'female');
      expect(profile.recommendations.top.recommendedSize).toBe('90');

      // 3. 유니섹스 변환
      const unisex = convertToUnisexSize(profile.recommendations.top.recommendedSize, 'female');
      expect(unisex).toBe('S');
    });

    it('should handle tall female case', () => {
      const measurements: UserMeasurements = {
        height: 172,
        weight: 50,
        chest: 82, // 78-84 범위 = 85
      };

      const profile = recommendSize(measurements, 'female');

      // 키가 큼
      expect(profile.recommendations.top.heightFit).toBe('long');
      // 가슴둘레로 사이즈 결정
      expect(profile.recommendations.top.recommendedSize).toBe('85');
    });
  });

  describe('엣지 케이스', () => {
    it('should handle very small measurements', () => {
      const measurements: UserMeasurements = {
        height: 150,
        weight: 42,
        chest: 78, // 78-84 범위 = 85
      };

      const result = recommendSize(measurements, 'female');

      expect(result.recommendations.top.recommendedSize).toBe('85');
      expect(result.recommendations.top.heightFit).toBe('petite');
    });

    it('should handle very large measurements', () => {
      const measurements: UserMeasurements = {
        height: 190,
        weight: 100,
        chest: 115, // 112-118 범위 = 115
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top.recommendedSize).toBe('115');
      expect(result.recommendations.top.heightFit).toBe('long');
    });

    it('should handle measurements without optional fields', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        // chest, waist, hip 없음
      };

      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top).toBeDefined();
      expect(result.recommendations.bottom).toBeDefined();
      expect(result.recommendations.top.confidence).toBeLessThan(90);
    });
  });
});
