/**
 * capsule 타입 유틸리티 테스트
 *
 * 대상: types/capsule.ts
 * 검증: getCCSGrade, getPersonalizationLevel, 상수 정확성
 */

import {
  getCCSGrade,
  getPersonalizationLevel,
  CCS_WEIGHTS,
  MODULE_LABELS,
  ALL_MODULE_CODES,
  CCS_GRADE_RANGES,
  PERSONALIZATION_LABELS,
  CCS_THRESHOLD,
} from '../../types/capsule';

// =============================================================================
// getCCSGrade
// =============================================================================

describe('getCCSGrade', () => {
  describe('S 등급 (90+)', () => {
    it('90점은 S 등급이어야 한다', () => {
      expect(getCCSGrade(90)).toBe('S');
    });

    it('95점은 S 등급이어야 한다', () => {
      expect(getCCSGrade(95)).toBe('S');
    });

    it('100점은 S 등급이어야 한다', () => {
      expect(getCCSGrade(100)).toBe('S');
    });

    it('89점은 S 등급이 아니어야 한다', () => {
      expect(getCCSGrade(89)).not.toBe('S');
    });
  });

  describe('A 등급 (70-89)', () => {
    it('70점은 A 등급이어야 한다', () => {
      expect(getCCSGrade(70)).toBe('A');
    });

    it('80점은 A 등급이어야 한다', () => {
      expect(getCCSGrade(80)).toBe('A');
    });

    it('89점은 A 등급이어야 한다', () => {
      expect(getCCSGrade(89)).toBe('A');
    });

    it('69점은 A 등급이 아니어야 한다', () => {
      expect(getCCSGrade(69)).not.toBe('A');
    });
  });

  describe('B 등급 (50-69)', () => {
    it('50점은 B 등급이어야 한다', () => {
      expect(getCCSGrade(50)).toBe('B');
    });

    it('60점은 B 등급이어야 한다', () => {
      expect(getCCSGrade(60)).toBe('B');
    });

    it('69점은 B 등급이어야 한다', () => {
      expect(getCCSGrade(69)).toBe('B');
    });
  });

  describe('C 등급 (30-49)', () => {
    it('30점은 C 등급이어야 한다', () => {
      expect(getCCSGrade(30)).toBe('C');
    });

    it('40점은 C 등급이어야 한다', () => {
      expect(getCCSGrade(40)).toBe('C');
    });

    it('49점은 C 등급이어야 한다', () => {
      expect(getCCSGrade(49)).toBe('C');
    });
  });

  describe('F 등급 (0-29)', () => {
    it('0점은 F 등급이어야 한다', () => {
      expect(getCCSGrade(0)).toBe('F');
    });

    it('15점은 F 등급이어야 한다', () => {
      expect(getCCSGrade(15)).toBe('F');
    });

    it('29점은 F 등급이어야 한다', () => {
      expect(getCCSGrade(29)).toBe('F');
    });
  });

  describe('경계값', () => {
    it('30/50/70/90 경계에서 각 등급이 올바르게 분류되어야 한다', () => {
      expect(getCCSGrade(29)).toBe('F');
      expect(getCCSGrade(30)).toBe('C');
      expect(getCCSGrade(49)).toBe('C');
      expect(getCCSGrade(50)).toBe('B');
      expect(getCCSGrade(69)).toBe('B');
      expect(getCCSGrade(70)).toBe('A');
      expect(getCCSGrade(89)).toBe('A');
      expect(getCCSGrade(90)).toBe('S');
    });
  });
});

// =============================================================================
// getPersonalizationLevel
// =============================================================================

describe('getPersonalizationLevel', () => {
  it('완료 모듈 0개 → 레벨 1 (기본 분류)', () => {
    expect(getPersonalizationLevel(0)).toBe(1);
  });

  it('완료 모듈 1개 → 레벨 1 (기본 분류)', () => {
    expect(getPersonalizationLevel(1)).toBe(1);
  });

  it('완료 모듈 2개 → 레벨 2 (상세 점수)', () => {
    expect(getPersonalizationLevel(2)).toBe(2);
  });

  it('완료 모듈 3개 → 레벨 2 (상세 점수)', () => {
    expect(getPersonalizationLevel(3)).toBe(2);
  });

  it('완료 모듈 4개 → 레벨 3 (사용 이력)', () => {
    expect(getPersonalizationLevel(4)).toBe(3);
  });

  it('완료 모듈 6개 → 레벨 3 (사용 이력)', () => {
    expect(getPersonalizationLevel(6)).toBe(3);
  });

  it('완료 모듈 7개 → 레벨 4 (행동 패턴)', () => {
    expect(getPersonalizationLevel(7)).toBe(4);
  });

  it('완료 모듈 9개 (전체) → 레벨 4 (행동 패턴)', () => {
    expect(getPersonalizationLevel(9)).toBe(4);
  });

  describe('경계값', () => {
    it('1→2, 4→3, 7→4 경계에서 레벨이 올바르게 분류되어야 한다', () => {
      expect(getPersonalizationLevel(1)).toBe(1);
      expect(getPersonalizationLevel(2)).toBe(2);
      expect(getPersonalizationLevel(3)).toBe(2);
      expect(getPersonalizationLevel(4)).toBe(3);
      expect(getPersonalizationLevel(6)).toBe(3);
      expect(getPersonalizationLevel(7)).toBe(4);
    });
  });
});

// =============================================================================
// CCS_WEIGHTS 상수
// =============================================================================

describe('CCS_WEIGHTS', () => {
  it('L1_INTRA_DOMAIN 가중치는 0.40이어야 한다', () => {
    expect(CCS_WEIGHTS.L1_INTRA_DOMAIN).toBe(0.4);
  });

  it('L2_CROSS_DOMAIN 가중치는 0.25이어야 한다', () => {
    expect(CCS_WEIGHTS.L2_CROSS_DOMAIN).toBe(0.25);
  });

  it('L3_PROFILE_FIT 가중치는 0.35이어야 한다', () => {
    expect(CCS_WEIGHTS.L3_PROFILE_FIT).toBe(0.35);
  });

  it('3개 가중치의 합은 1.0이어야 한다', () => {
    const sum =
      CCS_WEIGHTS.L1_INTRA_DOMAIN +
      CCS_WEIGHTS.L2_CROSS_DOMAIN +
      CCS_WEIGHTS.L3_PROFILE_FIT;
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

// =============================================================================
// MODULE_LABELS 상수
// =============================================================================

describe('MODULE_LABELS', () => {
  it('9개 모듈 코드 모두 레이블을 가져야 한다', () => {
    const expectedCodes = ['PC', 'S', 'C', 'W', 'N', 'H', 'M', 'OH', 'Fashion'];
    expectedCodes.forEach((code) => {
      expect(MODULE_LABELS[code as keyof typeof MODULE_LABELS]).toBeDefined();
      expect(MODULE_LABELS[code as keyof typeof MODULE_LABELS].length).toBeGreaterThan(0);
    });
  });

  it('각 레이블은 한국어 문자열이어야 한다', () => {
    Object.values(MODULE_LABELS).forEach((label) => {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });

  it('PC는 "퍼스널컬러"이어야 한다', () => {
    expect(MODULE_LABELS.PC).toBe('퍼스널컬러');
  });

  it('S는 "피부"이어야 한다', () => {
    expect(MODULE_LABELS.S).toBe('피부');
  });

  it('OH는 "구강건강"이어야 한다', () => {
    expect(MODULE_LABELS.OH).toBe('구강건강');
  });
});

// =============================================================================
// ALL_MODULE_CODES 상수
// =============================================================================

describe('ALL_MODULE_CODES', () => {
  it('정확히 9개의 모듈 코드를 포함해야 한다', () => {
    expect(ALL_MODULE_CODES).toHaveLength(9);
  });

  it('9개 필수 코드를 모두 포함해야 한다', () => {
    const requiredCodes = ['PC', 'S', 'C', 'W', 'N', 'H', 'M', 'OH', 'Fashion'];
    requiredCodes.forEach((code) => {
      expect(ALL_MODULE_CODES).toContain(code);
    });
  });

  it('중복 코드가 없어야 한다', () => {
    const unique = new Set(ALL_MODULE_CODES);
    expect(unique.size).toBe(ALL_MODULE_CODES.length);
  });
});

// =============================================================================
// CCS_GRADE_RANGES 상수
// =============================================================================

describe('CCS_GRADE_RANGES', () => {
  it('5개 등급(S,A,B,C,F)에 대한 범위가 모두 정의되어야 한다', () => {
    const grades = ['S', 'A', 'B', 'C', 'F'] as const;
    grades.forEach((grade) => {
      expect(CCS_GRADE_RANGES[grade]).toBeDefined();
      expect(Array.isArray(CCS_GRADE_RANGES[grade])).toBe(true);
      expect(CCS_GRADE_RANGES[grade]).toHaveLength(2);
    });
  });

  it('S 등급 범위는 [90, 100]이어야 한다', () => {
    expect(CCS_GRADE_RANGES.S).toEqual([90, 100]);
  });

  it('F 등급 범위는 [0, 29]이어야 한다', () => {
    expect(CCS_GRADE_RANGES.F).toEqual([0, 29]);
  });
});

// =============================================================================
// CCS_THRESHOLD 상수
// =============================================================================

describe('CCS_THRESHOLD', () => {
  it('임계값이 70이어야 한다 (A 등급 하한)', () => {
    expect(CCS_THRESHOLD).toBe(70);
  });
});

// =============================================================================
// PERSONALIZATION_LABELS 상수
// =============================================================================

describe('PERSONALIZATION_LABELS', () => {
  it('4개 레벨 레이블이 모두 정의되어야 한다', () => {
    ([1, 2, 3, 4] as const).forEach((level) => {
      expect(PERSONALIZATION_LABELS[level]).toBeDefined();
    });
  });

  it('레벨 1은 "기본 분류"이어야 한다', () => {
    expect(PERSONALIZATION_LABELS[1]).toBe('기본 분류');
  });

  it('레벨 4는 "행동 패턴"이어야 한다', () => {
    expect(PERSONALIZATION_LABELS[4]).toBe('행동 패턴');
  });
});
