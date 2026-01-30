/**
 * N-1 개인화 영양 프로필링 테스트
 *
 * @see lib/nutrition/personalized-profile.ts
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePersonalizedRDA,
  getPersonalizedNutrientRDA,
  calculateIntakePercentage,
  evaluateIntakeStatus,
  getIntakeRange,
  getAgeGroup,
  type NutritionProfile,
} from '@/lib/nutrition/personalized-profile';

// ============================================
// getAgeGroup 테스트
// ============================================

describe('getAgeGroup', () => {
  it('19세 미만은 19-29 그룹 반환', () => {
    expect(getAgeGroup(15)).toBe('19-29');
    expect(getAgeGroup(18)).toBe('19-29');
  });

  it('19-29세 범위 정확히 분류', () => {
    expect(getAgeGroup(19)).toBe('19-29');
    expect(getAgeGroup(25)).toBe('19-29');
    expect(getAgeGroup(29)).toBe('19-29');
  });

  it('30-49세 범위 정확히 분류', () => {
    expect(getAgeGroup(30)).toBe('30-49');
    expect(getAgeGroup(40)).toBe('30-49');
    expect(getAgeGroup(49)).toBe('30-49');
  });

  it('50-64세 범위 정확히 분류', () => {
    expect(getAgeGroup(50)).toBe('50-64');
    expect(getAgeGroup(57)).toBe('50-64');
    expect(getAgeGroup(64)).toBe('50-64');
  });

  it('65-74세 범위 정확히 분류', () => {
    expect(getAgeGroup(65)).toBe('65-74');
    expect(getAgeGroup(70)).toBe('65-74');
    expect(getAgeGroup(74)).toBe('65-74');
  });

  it('75세 이상 정확히 분류', () => {
    expect(getAgeGroup(75)).toBe('75+');
    expect(getAgeGroup(80)).toBe('75+');
    expect(getAgeGroup(95)).toBe('75+');
  });
});

// ============================================
// calculatePersonalizedRDA 기본 테스트
// ============================================

describe('calculatePersonalizedRDA', () => {
  describe('기본 프로필 (조정 없음)', () => {
    const baseProfile: NutritionProfile = {
      gender: 'male',
      age: 30,
      weightKg: 70,
      heightCm: 175,
    };

    it('성별에 따른 기본 RDA 반환', () => {
      const result = calculatePersonalizedRDA(baseProfile);

      // 남성 기본 RDA 확인
      expect(result.nutrients.vitaminA.adjustedRda).toBe(800);
      expect(result.nutrients.vitaminC.adjustedRda).toBe(100);
      expect(result.nutrients.iron.adjustedRda).toBe(10);
    });

    it('연령대 정보 포함', () => {
      const result = calculatePersonalizedRDA(baseProfile);
      expect(result.ageGroup).toBe('30-49');
    });

    it('조정 없으면 adjustmentFactor = 1.0', () => {
      const result = calculatePersonalizedRDA(baseProfile);
      expect(result.nutrients.vitaminC.adjustmentFactor).toBe(1);
    });

    it('appliedAdjustments 빈 배열', () => {
      const result = calculatePersonalizedRDA(baseProfile);
      expect(result.appliedAdjustments).toHaveLength(0);
    });
  });

  describe('여성 프로필', () => {
    const femaleProfile: NutritionProfile = {
      gender: 'female',
      age: 28,
      weightKg: 55,
      heightCm: 162,
    };

    it('여성 기본 RDA 반환', () => {
      const result = calculatePersonalizedRDA(femaleProfile);

      expect(result.nutrients.vitaminA.adjustedRda).toBe(650);
      expect(result.nutrients.iron.adjustedRda).toBe(14);
      expect(result.nutrients.zinc.adjustedRda).toBe(8);
    });
  });
});

// ============================================
// 연령대별 조정 테스트
// ============================================

describe('연령대별 조정', () => {
  describe('65-74세 노년', () => {
    const elderlyProfile: NutritionProfile = {
      gender: 'male',
      age: 70,
      weightKg: 65,
      heightCm: 168,
    };

    it('비타민 D 2배 증가 (400 → 800 IU)', () => {
      const result = calculatePersonalizedRDA(elderlyProfile);
      // 기본 400 × 2.0 = 800
      expect(result.nutrients.vitaminD.adjustedRda).toBe(800);
      expect(result.nutrients.vitaminD.adjustmentFactor).toBe(2);
    });

    it('비타민 B12 1.5배 증가', () => {
      const result = calculatePersonalizedRDA(elderlyProfile);
      // 기본 2.4 × 1.5 = 3.6
      expect(result.nutrients.vitaminB12.adjustedRda).toBe(3.6);
    });

    it('칼슘 1.5배 증가 (800 → 1200 mg, 대한골대사학회 권장)', () => {
      const result = calculatePersonalizedRDA(elderlyProfile);
      // 출처: docs/principles/nutrition-science.md 섹션 9.1
      expect(result.nutrients.calcium.adjustedRda).toBe(1200);
    });

    it('appliedAdjustments에 연령대 기록', () => {
      const result = calculatePersonalizedRDA(elderlyProfile);
      expect(result.appliedAdjustments).toContain('연령대: 65-74');
    });
  });

  describe('50-64세 중년', () => {
    const middleAgedFemale: NutritionProfile = {
      gender: 'female',
      age: 55,
      weightKg: 58,
      heightCm: 160,
    };

    it('비타민 D 1.5배 증가', () => {
      const result = calculatePersonalizedRDA(middleAgedFemale);
      expect(result.nutrients.vitaminD.adjustedRda).toBe(600);
    });

    it('여성 철분 감소 (폐경 후 14 → ~10)', () => {
      const result = calculatePersonalizedRDA(middleAgedFemale);
      // 14 × 0.71 ≈ 9.9 → 반올림 10
      expect(result.nutrients.iron.adjustedRda).toBeCloseTo(9.9, 1);
    });
  });
});

// ============================================
// 특수 상태별 조정 테스트
// ============================================

describe('특수 상태별 조정', () => {
  describe('임신 2분기', () => {
    const pregnantProfile: NutritionProfile = {
      gender: 'female',
      age: 30,
      weightKg: 60,
      heightCm: 163,
      condition: 'pregnant-2nd',
    };

    it('엽산 1.5배 증가 (400 → 600 μg DFE)', () => {
      const result = calculatePersonalizedRDA(pregnantProfile);
      expect(result.nutrients.folate.adjustedRda).toBe(600);
    });

    it('철분 1.71배 증가 (14 → 24 mg)', () => {
      const result = calculatePersonalizedRDA(pregnantProfile);
      // 14 × 1.71 ≈ 23.9 → 반올림 23.9
      expect(result.nutrients.iron.adjustedRda).toBeCloseTo(23.9, 1);
    });

    it('아연 1.25배 증가', () => {
      const result = calculatePersonalizedRDA(pregnantProfile);
      // 8 × 1.25 = 10
      expect(result.nutrients.zinc.adjustedRda).toBe(10);
    });

    it('appliedAdjustments에 상태 기록', () => {
      const result = calculatePersonalizedRDA(pregnantProfile);
      expect(result.appliedAdjustments).toContain('상태: 임신 2분기');
    });
  });

  describe('수유', () => {
    const breastfeedingProfile: NutritionProfile = {
      gender: 'female',
      age: 32,
      weightKg: 58,
      heightCm: 162,
      condition: 'breastfeeding',
    };

    it('비타민 A 1.62배 증가', () => {
      const result = calculatePersonalizedRDA(breastfeedingProfile);
      // 650 × 1.62 = 1053
      expect(result.nutrients.vitaminA.adjustedRda).toBeCloseTo(1053, 0);
    });

    it('비타민 C 1.35배 증가', () => {
      const result = calculatePersonalizedRDA(breastfeedingProfile);
      // 100 × 1.35 = 135
      expect(result.nutrients.vitaminC.adjustedRda).toBe(135);
    });
  });

  describe('운동선수', () => {
    const athleteProfile: NutritionProfile = {
      gender: 'male',
      age: 25,
      weightKg: 75,
      heightCm: 180,
      condition: 'athlete',
    };

    it('철분 1.5배 증가', () => {
      const result = calculatePersonalizedRDA(athleteProfile);
      // 10 × 1.5 = 15
      expect(result.nutrients.iron.adjustedRda).toBe(15);
    });

    it('비타민 B1 1.3배 증가 (에너지 대사)', () => {
      const result = calculatePersonalizedRDA(athleteProfile);
      // 1.2 × 1.3 = 1.56
      expect(result.nutrients.vitaminB1.adjustedRda).toBeCloseTo(1.6, 1);
    });
  });
});

// ============================================
// 건강 목표별 조정 테스트
// ============================================

describe('건강 목표별 조정', () => {
  describe('뼈 건강 목표', () => {
    const boneHealthProfile: NutritionProfile = {
      gender: 'female',
      age: 45,
      weightKg: 58,
      heightCm: 162,
      goals: ['bone-health'],
    };

    it('칼슘 1.25배 증가', () => {
      const result = calculatePersonalizedRDA(boneHealthProfile);
      // 800 × 1.25 = 1000
      expect(result.nutrients.calcium.adjustedRda).toBe(1000);
    });

    it('비타민 D 1.5배 증가', () => {
      const result = calculatePersonalizedRDA(boneHealthProfile);
      expect(result.nutrients.vitaminD.adjustedRda).toBe(600);
    });

    it('appliedAdjustments에 목표 기록', () => {
      const result = calculatePersonalizedRDA(boneHealthProfile);
      expect(result.appliedAdjustments).toContain('목표: 뼈 건강');
    });
  });

  describe('피부 건강 목표', () => {
    const skinHealthProfile: NutritionProfile = {
      gender: 'female',
      age: 28,
      weightKg: 52,
      heightCm: 160,
      goals: ['skin-health'],
    };

    it('비타민 C 1.3배 증가 (콜라겐 합성)', () => {
      const result = calculatePersonalizedRDA(skinHealthProfile);
      expect(result.nutrients.vitaminC.adjustedRda).toBe(130);
    });

    it('비오틴 1.2배 증가', () => {
      const result = calculatePersonalizedRDA(skinHealthProfile);
      // 30 × 1.2 = 36
      expect(result.nutrients.biotin.adjustedRda).toBe(36);
    });
  });

  describe('복합 목표', () => {
    const multiGoalProfile: NutritionProfile = {
      gender: 'male',
      age: 35,
      weightKg: 70,
      heightCm: 175,
      goals: ['bone-health', 'heart-health'],
    };

    it('비타민 D - 두 목표 중 높은 값 적용 (1.5)', () => {
      const result = calculatePersonalizedRDA(multiGoalProfile);
      // bone-health: 1.5, heart-health: 없음 → 1.5
      expect(result.nutrients.vitaminD.adjustedRda).toBe(600);
    });

    it('오메가-3 - heart-health 1.6 적용', () => {
      const result = calculatePersonalizedRDA(multiGoalProfile);
      // 500 × 1.6 = 800
      expect(result.nutrients.omega3.adjustedRda).toBe(800);
    });
  });
});

// ============================================
// 복합 조정 테스트 (연령 + 상태 + 목표)
// ============================================

describe('복합 조정', () => {
  it('65세 + 폐경 + 뼈 건강 → 칼슘 최대 조정', () => {
    const complexProfile: NutritionProfile = {
      gender: 'female',
      age: 67,
      weightKg: 55,
      heightCm: 158,
      condition: 'menopause',
      goals: ['bone-health'],
    };

    const result = calculatePersonalizedRDA(complexProfile);

    // 연령 1.25 × 폐경 1.25 × 뼈건강 1.25 = 1.953...
    // 기본 800 × ~1.95 = ~1562
    // 실제로는 곱셈이므로 확인
    expect(result.nutrients.calcium.adjustedRda).toBeGreaterThan(1500);
    expect(result.appliedAdjustments).toContain('연령대: 65-74');
    expect(result.appliedAdjustments).toContain('상태: 폐경기');
    expect(result.appliedAdjustments).toContain('목표: 뼈 건강');
  });

  it('30대 임신부 + 피부건강 → 비타민 C 복합 조정', () => {
    const complexProfile: NutritionProfile = {
      gender: 'female',
      age: 32,
      weightKg: 60,
      heightCm: 163,
      condition: 'pregnant-3rd',
      goals: ['skin-health'],
    };

    const result = calculatePersonalizedRDA(complexProfile);

    // 임신 3분기: vitaminC 조정 없음 (1.0)
    // 피부건강: vitaminC 1.3
    // 100 × 1.0 × 1.3 = 130
    expect(result.nutrients.vitaminC.adjustedRda).toBe(130);
  });
});

// ============================================
// getPersonalizedNutrientRDA 테스트
// ============================================

describe('getPersonalizedNutrientRDA', () => {
  const profile: NutritionProfile = {
    gender: 'female',
    age: 30,
    weightKg: 55,
    heightCm: 162,
  };

  it('특정 영양소 RDA만 반환', () => {
    const result = getPersonalizedNutrientRDA(profile, 'vitaminC');

    expect(result.adjustedRda).toBe(100);
    expect(result.unit).toBe('mg');
    expect(result.nameKo).toBe('비타민 C');
  });
});

// ============================================
// calculateIntakePercentage 테스트
// ============================================

describe('calculateIntakePercentage', () => {
  const profile: NutritionProfile = {
    gender: 'male',
    age: 30,
    weightKg: 70,
    heightCm: 175,
  };

  it('100% 달성 시 100 반환', () => {
    // 비타민 C RDA = 100mg
    const percentage = calculateIntakePercentage(profile, 'vitaminC', 100);
    expect(percentage).toBe(100);
  });

  it('50% 달성 시 50 반환', () => {
    const percentage = calculateIntakePercentage(profile, 'vitaminC', 50);
    expect(percentage).toBe(50);
  });

  it('150% 초과 섭취도 계산', () => {
    const percentage = calculateIntakePercentage(profile, 'vitaminC', 150);
    expect(percentage).toBe(150);
  });
});

// ============================================
// evaluateIntakeStatus 테스트
// ============================================

describe('evaluateIntakeStatus', () => {
  const profile: NutritionProfile = {
    gender: 'male',
    age: 30,
    weightKg: 70,
    heightCm: 175,
  };

  it('50% 미만 → deficient', () => {
    // vitaminC RDA = 100mg, 40mg 섭취 = 40%
    const status = evaluateIntakeStatus(profile, 'vitaminC', 40);
    expect(status).toBe('deficient');
  });

  it('50-80% → low', () => {
    // 60mg = 60%
    const status = evaluateIntakeStatus(profile, 'vitaminC', 60);
    expect(status).toBe('low');
  });

  it('80-120% → optimal', () => {
    // 100mg = 100%
    const status = evaluateIntakeStatus(profile, 'vitaminC', 100);
    expect(status).toBe('optimal');
  });

  it('120% 초과 → high', () => {
    // 150mg = 150%
    const status = evaluateIntakeStatus(profile, 'vitaminC', 150);
    expect(status).toBe('high');
  });

  it('UL 초과 → excessive', () => {
    // vitaminC UL = 2000mg
    const status = evaluateIntakeStatus(profile, 'vitaminC', 2500);
    expect(status).toBe('excessive');
  });
});

// ============================================
// getIntakeRange 테스트
// ============================================

describe('getIntakeRange', () => {
  const profile: NutritionProfile = {
    gender: 'female',
    age: 28,
    weightKg: 55,
    heightCm: 162,
  };

  it('vitaminC 범위 반환 (UL 있음)', () => {
    const range = getIntakeRange(profile, 'vitaminC');

    expect(range.min).toBe(80);       // 100 × 0.8
    expect(range.optimal).toBe(100);  // RDA
    expect(range.max).toBe(2000);     // UL
  });

  it('vitaminK 범위 반환 (UL 없음)', () => {
    const range = getIntakeRange(profile, 'vitaminK');

    // 여성 vitaminK RDA = 65
    expect(range.min).toBe(52);       // 65 × 0.8
    expect(range.optimal).toBe(65);
    expect(range.max).toBe(130);      // 65 × 2 (UL 없으므로)
  });
});

// ============================================
// 엣지 케이스 테스트
// ============================================

describe('엣지 케이스', () => {
  it('미성년자 (15세) → 19-29 그룹으로 처리', () => {
    const profile: NutritionProfile = {
      gender: 'male',
      age: 15,
      weightKg: 55,
      heightCm: 165,
    };

    const result = calculatePersonalizedRDA(profile);
    expect(result.ageGroup).toBe('19-29');
  });

  it('condition 없이 goals만 있는 경우', () => {
    const profile: NutritionProfile = {
      gender: 'male',
      age: 40,
      weightKg: 75,
      heightCm: 178,
      goals: ['heart-health'],
    };

    const result = calculatePersonalizedRDA(profile);
    expect(result.nutrients.omega3.adjustedRda).toBe(800);
    expect(result.appliedAdjustments).not.toContain('상태:');
  });

  it('goals 빈 배열인 경우', () => {
    const profile: NutritionProfile = {
      gender: 'female',
      age: 35,
      weightKg: 58,
      heightCm: 163,
      goals: [],
    };

    const result = calculatePersonalizedRDA(profile);
    // 기본 RDA 유지
    expect(result.nutrients.vitaminC.adjustmentFactor).toBe(1);
  });

  it('maintain 목표만 있는 경우 조정 없음', () => {
    const profile: NutritionProfile = {
      gender: 'male',
      age: 30,
      weightKg: 70,
      heightCm: 175,
      goals: ['maintain'],
    };

    const result = calculatePersonalizedRDA(profile);
    expect(result.appliedAdjustments).toHaveLength(0);
  });
});
