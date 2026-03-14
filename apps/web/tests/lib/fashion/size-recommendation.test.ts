/**
 * 사이즈 추천 로직 테스트
 *
 * @module tests/lib/fashion/size-recommendation
 * @description 키 기반 핏, 종합 사이즈 추천, 유니섹스 변환 테스트
 */

import { describe, it, expect, vi } from 'vitest';

// closetMatcher 모듈 모킹 (BodyType3 타입만 사용)
vi.mock('@/lib/inventory/closetMatcher', () => ({}));

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
    it('155cm 이하면 petite를 반환한다', () => {
      expect(determineHeightFit(155, 'female')).toBe('petite');
      expect(determineHeightFit(150, 'female')).toBe('petite');
      expect(determineHeightFit(145, 'female')).toBe('petite');
    });

    it('156~169cm이면 regular를 반환한다', () => {
      expect(determineHeightFit(156, 'female')).toBe('regular');
      expect(determineHeightFit(160, 'female')).toBe('regular');
      expect(determineHeightFit(165, 'female')).toBe('regular');
      expect(determineHeightFit(169, 'female')).toBe('regular');
    });

    it('170cm 이상이면 long을 반환한다', () => {
      expect(determineHeightFit(170, 'female')).toBe('long');
      expect(determineHeightFit(175, 'female')).toBe('long');
      expect(determineHeightFit(180, 'female')).toBe('long');
    });
  });

  describe('남성 키 분류', () => {
    it('170cm 미만이면 short를 반환한다', () => {
      expect(determineHeightFit(169, 'male')).toBe('short');
      expect(determineHeightFit(165, 'male')).toBe('short');
      expect(determineHeightFit(160, 'male')).toBe('short');
    });

    it('170~179cm이면 regular를 반환한다', () => {
      expect(determineHeightFit(170, 'male')).toBe('regular');
      expect(determineHeightFit(175, 'male')).toBe('regular');
      expect(determineHeightFit(179, 'male')).toBe('regular');
    });

    it('180cm 이상이면 long을 반환한다', () => {
      expect(determineHeightFit(180, 'male')).toBe('long');
      expect(determineHeightFit(185, 'male')).toBe('long');
      expect(determineHeightFit(190, 'male')).toBe('long');
    });
  });

  describe('경계값 테스트', () => {
    it('여성 경계값이 정확하다 (155 → petite, 156 → regular, 170 → long)', () => {
      expect(determineHeightFit(155, 'female')).toBe('petite');
      expect(determineHeightFit(156, 'female')).toBe('regular');
      expect(determineHeightFit(170, 'female')).toBe('long');
    });

    it('남성 경계값이 정확하다 (169 → short, 170 → regular, 180 → long)', () => {
      expect(determineHeightFit(169, 'male')).toBe('short');
      expect(determineHeightFit(170, 'male')).toBe('regular');
      expect(determineHeightFit(180, 'male')).toBe('long');
    });
  });
});

// ============================================================================
// recommendSize
// ============================================================================
describe('recommendSize', () => {
  // ─── 남성 상의 사이즈 ──────────────────────────────────────────
  describe('남성 상의 사이즈', () => {
    it('체중 기반으로 상의 사이즈를 추천한다 (가슴둘레 없을 때)', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70, // 65-75 범위 → 100
      };

      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.top.recommendedSize).toBe('100');
      expect(result.recommendations.top.confidence).toBe(75);
    });

    it('가슴둘레 기반으로 상의 사이즈를 추천한다 (더 높은 신뢰도)', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95, // 94-100 범위 → 100
      };

      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.top.recommendedSize).toBe('100');
      expect(result.recommendations.top.confidence).toBe(95);
    });

    it('가슴둘레가 있을 때 체중보다 신뢰도가 높다', () => {
      const withChest: UserMeasurements = { height: 175, weight: 70, chest: 95 };
      const withoutChest: UserMeasurements = { height: 175, weight: 70 };

      const r1 = recommendSize(withChest, 'male');
      const r2 = recommendSize(withoutChest, 'male');

      expect(r1.recommendations.top.confidence).toBeGreaterThan(r2.recommendations.top.confidence);
    });

    it('남성 95 사이즈를 추천한다 (가슴둘레 88-94)', () => {
      const measurements: UserMeasurements = { height: 170, weight: 60, chest: 90 };
      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.top.recommendedSize).toBe('95');
    });

    it('남성 105 사이즈를 추천한다 (가슴둘레 100-106)', () => {
      const measurements: UserMeasurements = { height: 180, weight: 85, chest: 102 };
      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.top.recommendedSize).toBe('105');
    });

    it('남성 115 사이즈를 추천한다 (가슴둘레 112-118)', () => {
      const measurements: UserMeasurements = { height: 190, weight: 100, chest: 115 };
      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.top.recommendedSize).toBe('115');
    });
  });

  // ─── 여성 사이즈 차트 ──────────────────────────────────────────
  describe('여성 사이즈 차트', () => {
    it('여성 85 사이즈를 추천한다 (가슴둘레 78-84)', () => {
      const measurements: UserMeasurements = { height: 155, weight: 48, chest: 82 };
      const result = recommendSize(measurements, 'female');
      expect(result.recommendations.top.recommendedSize).toBe('85');
    });

    it('여성 90 사이즈를 추천한다 (가슴둘레 84-90)', () => {
      const measurements: UserMeasurements = { height: 165, weight: 55, chest: 86 };
      const result = recommendSize(measurements, 'female');
      expect(result.recommendations.top.recommendedSize).toBe('90');
    });

    it('여성 95 사이즈를 추천한다 (가슴둘레 90-96)', () => {
      const measurements: UserMeasurements = { height: 168, weight: 60, chest: 92 };
      const result = recommendSize(measurements, 'female');
      expect(result.recommendations.top.recommendedSize).toBe('95');
    });

    it('여성 100 사이즈를 추천한다 (가슴둘레 96-102)', () => {
      const measurements: UserMeasurements = { height: 165, weight: 68, chest: 98 };
      const result = recommendSize(measurements, 'female');
      expect(result.recommendations.top.recommendedSize).toBe('100');
    });

    it('여성은 dress 추천이 포함된다', () => {
      const measurements: UserMeasurements = { height: 165, weight: 55, chest: 86 };
      const result = recommendSize(measurements, 'female');
      expect(result.recommendations.dress).not.toBeNull();
    });
  });

  // ─── 하의 사이즈 ───────────────────────────────────────────────
  describe('하의 사이즈', () => {
    it('허리둘레 기반으로 인치 변환하여 추천한다', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        waist: 81, // 81 / 2.54 ≈ 32
      };

      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.bottom.recommendedSize).toBe('32');
      expect(result.recommendations.bottom.confidence).toBe(90);
    });

    it('허리둘레 없으면 BMI 기반으로 추정한다', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        // waist 없음 → BMI ≈ 22.9 → 남성: 30
      };

      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.bottom.recommendedSize).toBe('30');
      expect(result.recommendations.bottom.confidence).toBe(65);
    });

    it('허리둘레 없으면 신뢰도가 낮다', () => {
      const withWaist: UserMeasurements = { height: 175, weight: 70, waist: 81 };
      const withoutWaist: UserMeasurements = { height: 175, weight: 70 };

      const r1 = recommendSize(withWaist, 'male');
      const r2 = recommendSize(withoutWaist, 'male');

      expect(r1.recommendations.bottom.confidence).toBeGreaterThan(
        r2.recommendations.bottom.confidence
      );
    });
  });

  // ─── 아우터 사이즈 ─────────────────────────────────────────────
  describe('아우터 사이즈', () => {
    it('상의보다 한 사이즈 업을 추천한다', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95, // top = 100
      };

      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.top.recommendedSize).toBe('100');
      expect(result.recommendations.outer.recommendedSize).toBe('105');
    });

    it('아우터 팁에 레이어드 안내가 포함된다', () => {
      const measurements: UserMeasurements = { height: 175, weight: 70, chest: 95 };
      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.outer.tips.some((t) => t.includes('레이어드'))).toBe(true);
    });

    it('아우터 신뢰도는 상의보다 5 낮다', () => {
      const measurements: UserMeasurements = { height: 175, weight: 70, chest: 95 };
      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.outer.confidence).toBe(
        result.recommendations.top.confidence - 5
      );
    });
  });

  // ─── 신발 사이즈 ───────────────────────────────────────────────
  describe('신발 사이즈', () => {
    it('footLength가 있으면 신발 사이즈를 추천한다', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        footLength: 265, // 260-269 범위 → 265
      };

      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.shoes).not.toBeNull();
      expect(result.recommendations.shoes?.recommendedSize).toBe('265');
      expect(result.recommendations.shoes?.confidence).toBe(95);
    });

    it('footLength가 없으면 null을 반환한다', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
      };

      const result = recommendSize(measurements, 'male');
      expect(result.recommendations.shoes).toBeNull();
    });

    it('여성 신발 사이즈를 추천한다', () => {
      const measurements: UserMeasurements = {
        height: 165,
        weight: 55,
        footLength: 235, // 230-239 범위 → 235
      };

      const result = recommendSize(measurements, 'female');
      expect(result.recommendations.shoes?.recommendedSize).toBe('235');
    });
  });

  // ─── dress 추천 (여성 전용) ────────────────────────────────────
  describe('드레스 추천', () => {
    it('여성에게만 dress 추천이 포함된다', () => {
      const measurements: UserMeasurements = { height: 165, weight: 55, chest: 86 };

      const female = recommendSize(measurements, 'female');
      const male = recommendSize(measurements, 'male');

      expect(female.recommendations.dress).not.toBeNull();
      expect(male.recommendations.dress).toBeNull();
    });
  });

  // ─── 체형(BodyType) 기반 핏 조정 ──────────────────────────────
  describe('체형 기반 핏 조정', () => {
    it('W 체형은 slim fit을 추천한다', () => {
      const measurements: UserMeasurements = { height: 165, weight: 55, chest: 86 };
      const result = recommendSize(measurements, 'female', 'W');
      expect(result.recommendations.top.fitType).toBe('slim');
    });

    it('N 체형은 relaxed fit을 추천한다', () => {
      const measurements: UserMeasurements = { height: 165, weight: 55, chest: 86 };
      const result = recommendSize(measurements, 'female', 'N');
      expect(result.recommendations.top.fitType).toBe('relaxed');
    });

    it('S 체형은 relaxed를 regular로 조정한다', () => {
      // BMI > 25 → baseFit = relaxed → S 체형 → regular
      const measurements: UserMeasurements = { height: 165, weight: 75, chest: 98 };
      const result = recommendSize(measurements, 'female', 'S');
      expect(result.recommendations.top.fitType).toBe('regular');
    });

    it('체형별 일반 팁이 포함된다', () => {
      const measurements: UserMeasurements = { height: 175, weight: 70, chest: 95 };

      const sResult = recommendSize(measurements, 'male', 'S');
      expect(sResult.generalTips.some((t) => t.includes('직선'))).toBe(true);

      const wResult = recommendSize(measurements, 'female', 'W');
      expect(wResult.generalTips.some((t) => t.includes('허리'))).toBe(true);

      const nResult = recommendSize(measurements, 'male', 'N');
      expect(nResult.generalTips.some((t) => t.includes('오버핏'))).toBe(true);
    });
  });

  // ─── BMI 기반 팁 ───────────────────────────────────────────────
  describe('BMI 기반 일반 팁', () => {
    it('BMI < 18.5이면 레이어드 팁이 포함된다', () => {
      // BMI = 45 / (1.70 * 1.70) ≈ 15.6
      const measurements: UserMeasurements = { height: 170, weight: 45 };
      const result = recommendSize(measurements, 'female');

      expect(result.generalTips.some((t) => t.includes('레이어드'))).toBe(true);
    });

    it('BMI > 25이면 여유있는 핏 팁이 포함된다', () => {
      // BMI = 90 / (1.75 * 1.75) ≈ 29.4
      const measurements: UserMeasurements = { height: 175, weight: 90 };
      const result = recommendSize(measurements, 'male');

      expect(result.generalTips.some((t) => t.includes('여유있는'))).toBe(true);
    });

    it('정상 BMI에는 BMI 팁이 없다', () => {
      // BMI = 70 / (1.75 * 1.75) ≈ 22.9
      const measurements: UserMeasurements = { height: 175, weight: 70 };
      const result = recommendSize(measurements, 'male');

      expect(result.generalTips.some((t) => t.includes('레이어드'))).toBe(false);
      expect(result.generalTips.some((t) => t.includes('여유있는'))).toBe(false);
    });
  });

  // ─── 완전한 SizeProfile 구조 ──────────────────────────────────
  describe('SizeProfile 구조', () => {
    it('남성 프로필에 모든 필드가 포함된다', () => {
      const measurements: UserMeasurements = {
        height: 175,
        weight: 70,
        chest: 95,
        waist: 80,
        footLength: 265,
      };

      const result = recommendSize(measurements, 'male');

      expect(result.gender).toBe('male');
      expect(result.measurements).toBe(measurements);
      expect(result.recommendations.top).toBeDefined();
      expect(result.recommendations.bottom).toBeDefined();
      expect(result.recommendations.outer).toBeDefined();
      expect(result.recommendations.shoes).not.toBeNull();
      expect(result.recommendations.dress).toBeNull();
    });

    it('각 추천에 alternativeSizes가 포함된다', () => {
      const measurements: UserMeasurements = { height: 175, weight: 70, chest: 95 };
      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top.alternativeSizes.length).toBeGreaterThan(0);
    });
  });

  // ─── 엣지 케이스 ──────────────────────────────────────────────
  describe('엣지 케이스', () => {
    it('매우 작은 신체 측정치를 처리한다', () => {
      const measurements: UserMeasurements = { height: 150, weight: 42, chest: 78 };
      const result = recommendSize(measurements, 'female');

      expect(result.recommendations.top.recommendedSize).toBe('85');
      expect(result.recommendations.top.heightFit).toBe('petite');
    });

    it('매우 큰 신체 측정치를 처리한다', () => {
      const measurements: UserMeasurements = { height: 190, weight: 100, chest: 115 };
      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top.recommendedSize).toBe('115');
      expect(result.recommendations.top.heightFit).toBe('long');
    });

    it('선택 필드 없이도 동작한다', () => {
      const measurements: UserMeasurements = { height: 175, weight: 70 };
      const result = recommendSize(measurements, 'male');

      expect(result.recommendations.top).toBeDefined();
      expect(result.recommendations.bottom).toBeDefined();
      expect(result.recommendations.outer).toBeDefined();
    });
  });
});

// ============================================================================
// convertToUnisexSize
// ============================================================================
describe('convertToUnisexSize', () => {
  describe('남성 한국 사이즈 → 유니섹스 변환', () => {
    it('남성 100은 S를 반환한다', () => {
      expect(convertToUnisexSize('100', 'male')).toBe('S');
    });

    it('남성 105는 M을 반환한다', () => {
      expect(convertToUnisexSize('105', 'male')).toBe('M');
    });

    it('남성 전체 사이즈 매핑이 정확하다', () => {
      expect(convertToUnisexSize('95', 'male')).toBe('XS');
      expect(convertToUnisexSize('110', 'male')).toBe('L');
      expect(convertToUnisexSize('115', 'male')).toBe('XL');
    });
  });

  describe('여성 한국 사이즈 → 유니섹스 변환', () => {
    it('여성 90은 S를 반환한다', () => {
      expect(convertToUnisexSize('90', 'female')).toBe('S');
    });

    it('여성 전체 사이즈 매핑이 정확하다', () => {
      expect(convertToUnisexSize('85', 'female')).toBe('XS');
      expect(convertToUnisexSize('95', 'female')).toBe('M');
      expect(convertToUnisexSize('100', 'female')).toBe('L');
      expect(convertToUnisexSize('105', 'female')).toBe('XL');
    });
  });

  describe('알 수 없는 사이즈 처리', () => {
    it('매핑에 없는 사이즈는 기본값 M을 반환한다', () => {
      expect(convertToUnisexSize('120', 'male')).toBe('M');
      expect(convertToUnisexSize('80', 'female')).toBe('M');
      expect(convertToUnisexSize('999', 'male')).toBe('M');
    });
  });
});

// ============================================================================
// convertFromUnisexSize
// ============================================================================
describe('convertFromUnisexSize', () => {
  describe('유니섹스 → 남성 한국 사이즈 변환', () => {
    it('M은 남성 105를 반환한다', () => {
      expect(convertFromUnisexSize('M', 'male')).toBe('105');
    });

    it('남성 전체 사이즈 매핑이 정확하다', () => {
      expect(convertFromUnisexSize('XS', 'male')).toBe('95');
      expect(convertFromUnisexSize('S', 'male')).toBe('100');
      expect(convertFromUnisexSize('L', 'male')).toBe('110');
      expect(convertFromUnisexSize('XL', 'male')).toBe('115');
    });
  });

  describe('유니섹스 → 여성 한국 사이즈 변환', () => {
    it('M은 여성 95를 반환한다', () => {
      expect(convertFromUnisexSize('M', 'female')).toBe('95');
    });

    it('여성 전체 사이즈 매핑이 정확하다', () => {
      expect(convertFromUnisexSize('XS', 'female')).toBe('85');
      expect(convertFromUnisexSize('S', 'female')).toBe('90');
      expect(convertFromUnisexSize('L', 'female')).toBe('100');
      expect(convertFromUnisexSize('XL', 'female')).toBe('105');
    });
  });

  describe('알 수 없는 유니섹스 사이즈 처리', () => {
    it('남성 기본값은 100이다', () => {
      expect(convertFromUnisexSize('3XL', 'male')).toBe('100');
      expect(convertFromUnisexSize('UNKNOWN', 'male')).toBe('100');
    });

    it('여성 기본값은 90이다', () => {
      expect(convertFromUnisexSize('4XL', 'female')).toBe('90');
      expect(convertFromUnisexSize('UNKNOWN', 'female')).toBe('90');
    });
  });
});

// ============================================================================
// 통합 시나리오
// ============================================================================
describe('통합 시나리오', () => {
  it('남성 전체 사이징 워크플로우가 동작한다', () => {
    const measurements: UserMeasurements = {
      height: 178,
      weight: 75,
      chest: 98, // → 100
      footLength: 270,
    };

    const heightFit = determineHeightFit(178, 'male');
    expect(heightFit).toBe('regular');

    const profile = recommendSize(measurements, 'male');
    expect(profile.recommendations.top.recommendedSize).toBe('100');

    const unisex = convertToUnisexSize('100', 'male');
    expect(unisex).toBe('S');

    const backToKorean = convertFromUnisexSize('S', 'male');
    expect(backToKorean).toBe('100');
  });

  it('여성 전체 사이징 워크플로우가 동작한다', () => {
    const measurements: UserMeasurements = {
      height: 162,
      weight: 52,
      chest: 86, // → 90
    };

    const heightFit = determineHeightFit(162, 'female');
    expect(heightFit).toBe('regular');

    const profile = recommendSize(measurements, 'female');
    expect(profile.recommendations.top.recommendedSize).toBe('90');
    expect(profile.recommendations.dress).not.toBeNull();

    const unisex = convertToUnisexSize('90', 'female');
    expect(unisex).toBe('S');
  });

  it('키 큰 여성 케이스를 처리한다', () => {
    const measurements: UserMeasurements = {
      height: 172,
      weight: 50,
      chest: 82, // → 85
    };

    const profile = recommendSize(measurements, 'female');
    expect(profile.recommendations.top.heightFit).toBe('long');
    expect(profile.recommendations.top.recommendedSize).toBe('85');
  });
});
