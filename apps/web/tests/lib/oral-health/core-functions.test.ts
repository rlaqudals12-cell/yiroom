/**
 * OH-1 구강건강 모듈 핵심 함수 단위 테스트
 *
 * @description VITA 셰이드 매칭, 밝기/황색도 해석, 잇몸 건강 등급, 미백 진행률 등
 *              순수 함수만 대상 (외부 의존성 없이 mock 불필요)
 *
 * @internal 테스트 전용 - internal 함수 직접 import
 */

import { describe, it, expect } from 'vitest';

// internal 함수 (테스트 전용 직접 import)
import {
  findBestShadeMatch,
  interpretBrightness,
  interpretYellowness,
  calculateShadeSteps,
} from '@/lib/oral-health/internal/vita-database';

// public API
import {
  getGumHealthGrade,
  generateToothColorSummary,
  trackWhiteningProgress,
  generateWhiteningPrecautions,
} from '@/lib/oral-health';

import type { ToothColorResult } from '@/types/oral-health';

// ============================================================================
// 1. findBestShadeMatch
// ============================================================================

describe('findBestShadeMatch', () => {
  describe('정상 케이스', () => {
    it('B1 Lab 값에 가까운 입력 시 B1을 반환한다', () => {
      // B1 참조값: { L: 71, a: 1.5, b: 15 }
      const result = findBestShadeMatch({ L: 71, a: 1.5, b: 15 });

      expect(result.shade).toBe('B1');
      expect(result.deltaE).toBeLessThan(1);
      expect(result.reference.shade).toBe('B1');
      expect(result.reference.series).toBe('B');
    });

    it('A4 Lab 값에 가까운 입력 시 A4를 반환한다', () => {
      // A4 참조값: { L: 56.5, a: 5.5, b: 25.5 }
      const result = findBestShadeMatch({ L: 56.5, a: 5.5, b: 25.5 });

      expect(result.shade).toBe('A4');
      expect(result.deltaE).toBeLessThan(1);
      expect(result.reference.series).toBe('A');
    });

    it('A3 Lab 값에 가까운 입력 시 A3를 반환한다', () => {
      // A3 참조값: { L: 63.5, a: 3.5, b: 21.5 }
      const result = findBestShadeMatch({ L: 63.5, a: 3.5, b: 21.5 });

      expect(result.shade).toBe('A3');
      expect(result.deltaE).toBeLessThan(1);
    });

    it('0M1 Lab 값에 가까운 입력 시 0M1을 반환한다', () => {
      // 0M1 참조값: { L: 74, a: 0, b: 10 }
      const result = findBestShadeMatch({ L: 74, a: 0, b: 10 });

      expect(result.shade).toBe('0M1');
      expect(result.deltaE).toBeLessThan(1);
    });

    it('대체 매치를 3개 반환한다', () => {
      const result = findBestShadeMatch({ L: 67, a: 2.5, b: 19 });

      expect(result.alternativeMatches).toHaveLength(3);
      // 대체 매치는 deltaE 오름차순이어야 함
      for (let i = 1; i < result.alternativeMatches.length; i++) {
        expect(result.alternativeMatches[i].deltaE).toBeGreaterThanOrEqual(
          result.alternativeMatches[i - 1].deltaE
        );
      }
    });

    it('대체 매치의 deltaE는 최적 매치보다 크다', () => {
      const result = findBestShadeMatch({ L: 65, a: 2, b: 17 });

      for (const alt of result.alternativeMatches) {
        expect(alt.deltaE).toBeGreaterThanOrEqual(result.deltaE);
      }
    });
  });

  describe('Bleached 제외 옵션', () => {
    it('excludeBleached=true 시 0M 셰이드를 제외한다', () => {
      // 0M1에 가장 가까운 Lab 값으로 테스트
      const result = findBestShadeMatch({ L: 74, a: 0, b: 10 }, true);

      expect(result.shade).not.toMatch(/^0M/);
      // 대체 매치에도 0M 셰이드가 없어야 함
      for (const alt of result.alternativeMatches) {
        expect(alt.shade).not.toMatch(/^0M/);
      }
    });

    it('excludeBleached=false 시 0M 셰이드를 포함한다', () => {
      // 0M1에 정확히 일치하는 Lab 값
      const result = findBestShadeMatch({ L: 74, a: 0, b: 10 }, false);

      expect(result.shade).toBe('0M1');
    });

    it('excludeBleached 기본값은 false이다', () => {
      const result = findBestShadeMatch({ L: 74, a: 0, b: 10 });

      expect(result.shade).toBe('0M1');
    });
  });

  describe('엣지 케이스', () => {
    it('두 셰이드 경계에 있는 Lab 값도 정상 매칭한다', () => {
      // B1(L:71)과 A1(L:70) 중간 영역
      const result = findBestShadeMatch({ L: 70.5, a: 1.75, b: 15.5 });

      expect(['B1', 'A1']).toContain(result.shade);
      expect(result.deltaE).toBeDefined();
      expect(result.reference).toBeDefined();
    });

    it('매우 밝은 Lab 값에도 유효한 결과를 반환한다', () => {
      const result = findBestShadeMatch({ L: 90, a: 0, b: 5 });

      expect(result.shade).toBeDefined();
      expect(result.deltaE).toBeGreaterThan(0);
    });

    it('매우 어두운 Lab 값에도 유효한 결과를 반환한다', () => {
      const result = findBestShadeMatch({ L: 30, a: 5, b: 10 });

      expect(result.shade).toBeDefined();
      expect(result.deltaE).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// 2. interpretBrightness
// ============================================================================

describe('interpretBrightness', () => {
  describe('정상 케이스', () => {
    it('B1은 very_bright를 반환한다 (brightnessRank: 1)', () => {
      const result = interpretBrightness('B1');

      expect(result.level).toBe('very_bright');
      expect(result.description).toContain('밝');
    });

    it('A1은 very_bright를 반환한다 (brightnessRank: 2)', () => {
      const result = interpretBrightness('A1');

      expect(result.level).toBe('very_bright');
    });

    it('D2는 very_bright를 반환한다 (brightnessRank: 4)', () => {
      const result = interpretBrightness('D2');

      expect(result.level).toBe('very_bright');
    });

    it('C1은 bright를 반환한다 (brightnessRank: 6)', () => {
      const result = interpretBrightness('C1');

      expect(result.level).toBe('bright');
    });

    it('A3는 medium을 반환한다 (brightnessRank: 9)', () => {
      const result = interpretBrightness('A3');

      expect(result.level).toBe('medium');
      expect(result.description).toContain('중간');
    });

    it('C3는 dark를 반환한다 (brightnessRank: 14)', () => {
      const result = interpretBrightness('C3');

      expect(result.level).toBe('dark');
    });

    it('A4는 very_dark를 반환한다 (brightnessRank: 15)', () => {
      const result = interpretBrightness('A4');

      expect(result.level).toBe('very_dark');
    });

    it('C4는 very_dark를 반환한다 (brightnessRank: 16)', () => {
      const result = interpretBrightness('C4');

      expect(result.level).toBe('very_dark');
    });

    it('0M1은 very_bright를 반환한다 (Bleached, brightnessRank: 0)', () => {
      const result = interpretBrightness('0M1');

      expect(result.level).toBe('very_bright');
      expect(result.description).toContain('미백');
    });
  });

  describe('밝기 등급 경계', () => {
    // rank 1-4: very_bright, 5-8: bright, 9-12: medium, 13-14: dark, 15-16: very_dark
    it('A2(rank 5)는 bright를 반환한다', () => {
      expect(interpretBrightness('A2').level).toBe('bright');
    });

    it('D4(rank 8)는 bright를 반환한다', () => {
      expect(interpretBrightness('D4').level).toBe('bright');
    });

    it('A3.5(rank 12)는 medium을 반환한다', () => {
      expect(interpretBrightness('A3.5').level).toBe('medium');
    });

    it('B4(rank 13)는 dark를 반환한다', () => {
      expect(interpretBrightness('B4').level).toBe('dark');
    });
  });
});

// ============================================================================
// 3. interpretYellowness
// ============================================================================

describe('interpretYellowness', () => {
  describe('정상 케이스', () => {
    it('b=10일 때 minimal을 반환한다', () => {
      const result = interpretYellowness({ L: 65, a: 2, b: 10 });

      expect(result.level).toBe('minimal');
      expect(result.description).toContain('거의 없');
    });

    it('b=14일 때 mild를 반환한다', () => {
      const result = interpretYellowness({ L: 65, a: 2, b: 14 });

      expect(result.level).toBe('mild');
      expect(result.description).toContain('아이보리');
    });

    it('b=18일 때 moderate를 반환한다', () => {
      const result = interpretYellowness({ L: 65, a: 2, b: 18 });

      expect(result.level).toBe('moderate');
      expect(result.description).toContain('중간');
    });

    it('b=22일 때 significant를 반환한다', () => {
      const result = interpretYellowness({ L: 65, a: 2, b: 22 });

      expect(result.level).toBe('significant');
      expect(result.description).toContain('뚜렷');
    });
  });

  describe('경계값 테스트', () => {
    it('b=12일 때 minimal을 반환한다 (경계: b <= 12)', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 12 }).level).toBe('minimal');
    });

    it('b=12.1일 때 mild를 반환한다 (경계: b > 12)', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 12.1 }).level).toBe('mild');
    });

    it('b=16일 때 mild를 반환한다 (경계: b <= 16)', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 16 }).level).toBe('mild');
    });

    it('b=16.1일 때 moderate를 반환한다 (경계: b > 16)', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 16.1 }).level).toBe('moderate');
    });

    it('b=20일 때 moderate를 반환한다 (경계: b <= 20)', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 20 }).level).toBe('moderate');
    });

    it('b=20.1일 때 significant를 반환한다 (경계: b > 20)', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 20.1 }).level).toBe('significant');
    });
  });

  describe('엣지 케이스', () => {
    it('b=0일 때 minimal을 반환한다', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 0 }).level).toBe('minimal');
    });

    it('b=30일 때 significant를 반환한다', () => {
      expect(interpretYellowness({ L: 65, a: 2, b: 30 }).level).toBe('significant');
    });

    it('L, a 값과 무관하게 b 값만으로 판단한다', () => {
      const result1 = interpretYellowness({ L: 40, a: 10, b: 14 });
      const result2 = interpretYellowness({ L: 80, a: -5, b: 14 });

      expect(result1.level).toBe(result2.level);
    });
  });
});

// ============================================================================
// 4. calculateShadeSteps
// ============================================================================

describe('calculateShadeSteps', () => {
  describe('정상 케이스', () => {
    it('같은 셰이드 간 단계 차이는 0이다', () => {
      expect(calculateShadeSteps('A2', 'A2')).toBe(0);
    });

    it('B1→A4: 양수 (A4가 더 어두우므로 B1→A4 방향은 큰 양수)', () => {
      // BRIGHTNESS_ORDER에서 B1은 인덱스 3, A4는 인덱스 17
      const steps = calculateShadeSteps('B1', 'A4');

      // shade1 인덱스 - shade2 인덱스이므로 음수 (shade2가 더 어두움)
      // B1 idx=3, A4 idx=17 → 3-17 = -14
      expect(steps).toBeLessThan(0);
    });

    it('A4→B1: 양수 (B1이 더 밝으므로)', () => {
      // A4 idx=17, B1 idx=3 → 17-3 = 14
      const steps = calculateShadeSteps('A4', 'B1');

      expect(steps).toBeGreaterThan(0);
    });

    it('단계 차이의 절대값은 순서의 관계를 반영한다', () => {
      const forward = calculateShadeSteps('A4', 'B1');
      const backward = calculateShadeSteps('B1', 'A4');

      expect(forward).toBe(-backward);
    });
  });

  describe('인접 셰이드 간 단계 차이', () => {
    it('B1→A1: 1단계 차이', () => {
      // BRIGHTNESS_ORDER: ..., B1(3), A1(4), ...
      const steps = calculateShadeSteps('A1', 'B1');

      expect(steps).toBe(1);
    });

    it('A3→D3: 1단계 차이', () => {
      // BRIGHTNESS_ORDER: ..., A3(11), D3(12), ...
      const steps = calculateShadeSteps('D3', 'A3');

      expect(steps).toBe(1);
    });
  });

  describe('Bleached 셰이드 단계 계산', () => {
    it('0M1→B1: 3단계 차이', () => {
      // 0M1(0), 0M2(1), 0M3(2), B1(3)
      const steps = calculateShadeSteps('B1', '0M1');

      expect(steps).toBe(3);
    });
  });
});

// ============================================================================
// 5. getGumHealthGrade
// ============================================================================

describe('getGumHealthGrade', () => {
  describe('정상 케이스', () => {
    it('점수 10일 때 A등급을 반환한다', () => {
      const result = getGumHealthGrade(10);

      expect(result.grade).toBe('A');
      expect(result.label).toBe('매우 좋음');
      expect(result.description).toContain('건강');
    });

    it('점수 30일 때 B등급을 반환한다', () => {
      const result = getGumHealthGrade(30);

      expect(result.grade).toBe('B');
      expect(result.label).toBe('좋음');
    });

    it('점수 50일 때 C등급을 반환한다', () => {
      const result = getGumHealthGrade(50);

      expect(result.grade).toBe('C');
      expect(result.label).toBe('보통');
      expect(result.description).toContain('염증');
    });

    it('점수 70일 때 D등급을 반환한다', () => {
      const result = getGumHealthGrade(70);

      expect(result.grade).toBe('D');
      expect(result.label).toBe('주의');
      expect(result.description).toContain('치과');
    });

    it('점수 90일 때 F등급을 반환한다', () => {
      const result = getGumHealthGrade(90);

      expect(result.grade).toBe('F');
      expect(result.label).toBe('위험');
      expect(result.description).toContain('치과');
    });
  });

  describe('경계값 테스트', () => {
    it('점수 0일 때 A등급을 반환한다', () => {
      expect(getGumHealthGrade(0).grade).toBe('A');
    });

    it('점수 19일 때 A등급을 반환한다', () => {
      expect(getGumHealthGrade(19).grade).toBe('A');
    });

    it('점수 20일 때 B등급을 반환한다', () => {
      expect(getGumHealthGrade(20).grade).toBe('B');
    });

    it('점수 39일 때 B등급을 반환한다', () => {
      expect(getGumHealthGrade(39).grade).toBe('B');
    });

    it('점수 40일 때 C등급을 반환한다', () => {
      expect(getGumHealthGrade(40).grade).toBe('C');
    });

    it('점수 59일 때 C등급을 반환한다', () => {
      expect(getGumHealthGrade(59).grade).toBe('C');
    });

    it('점수 60일 때 D등급을 반환한다', () => {
      expect(getGumHealthGrade(60).grade).toBe('D');
    });

    it('점수 79일 때 D등급을 반환한다', () => {
      expect(getGumHealthGrade(79).grade).toBe('D');
    });

    it('점수 80일 때 F등급을 반환한다', () => {
      expect(getGumHealthGrade(80).grade).toBe('F');
    });

    it('점수 100일 때 F등급을 반환한다', () => {
      expect(getGumHealthGrade(100).grade).toBe('F');
    });
  });
});

// ============================================================================
// 6. generateToothColorSummary
// ============================================================================

describe('generateToothColorSummary', () => {
  // 테스트용 기본 결과 생성 헬퍼
  function createMockToothColorResult(overrides: Partial<ToothColorResult> = {}): ToothColorResult {
    return {
      measuredLab: { L: 67, a: 2.5, b: 19 },
      matchedShade: 'A2',
      deltaE: 1.5,
      confidence: 85,
      alternativeMatches: [
        { shade: 'A3', deltaE: 3.2 },
        { shade: 'B2', deltaE: 4.1 },
      ],
      interpretation: {
        brightness: 'bright',
        yellowness: 'moderate',
        series: 'A',
      },
      ...overrides,
    };
  }

  describe('정상 케이스', () => {
    it('셰이드, 밝기, 황색도, 계열, 신뢰도 정보를 포함한 요약을 생성한다', () => {
      const result = createMockToothColorResult();
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('VITA A2');
      expect(summary).toContain('밝은');
      expect(summary).toContain('황색기');
      expect(summary).toContain('황갈색 계열');
      expect(summary).toContain('85%');
    });

    it('very_bright + minimal 조합의 요약을 올바르게 생성한다', () => {
      const result = createMockToothColorResult({
        matchedShade: 'B1',
        confidence: 95,
        interpretation: {
          brightness: 'very_bright',
          yellowness: 'minimal',
          series: 'B',
        },
      });
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('VITA B1');
      expect(summary).toContain('매우 밝은');
      expect(summary).toContain('거의 없는');
      expect(summary).toContain('황색 계열');
      expect(summary).toContain('95%');
    });

    it('very_dark + significant 조합의 요약을 올바르게 생성한다', () => {
      const result = createMockToothColorResult({
        matchedShade: 'C4',
        confidence: 60,
        interpretation: {
          brightness: 'very_dark',
          yellowness: 'significant',
          series: 'C',
        },
      });
      const summary = generateToothColorSummary(result);

      expect(summary).toContain('VITA C4');
      expect(summary).toContain('어두운');
      expect(summary).toContain('뚜렷한');
      expect(summary).toContain('회색 계열');
      expect(summary).toContain('60%');
    });
  });

  describe('모든 시리즈 텍스트 매핑', () => {
    it('A 시리즈는 황갈색 계열이다', () => {
      const result = createMockToothColorResult({
        interpretation: { brightness: 'medium', yellowness: 'moderate', series: 'A' },
      });
      expect(generateToothColorSummary(result)).toContain('황갈색 계열');
    });

    it('B 시리즈는 황색 계열이다', () => {
      const result = createMockToothColorResult({
        interpretation: { brightness: 'medium', yellowness: 'moderate', series: 'B' },
      });
      expect(generateToothColorSummary(result)).toContain('황색 계열');
    });

    it('C 시리즈는 회색 계열이다', () => {
      const result = createMockToothColorResult({
        interpretation: { brightness: 'medium', yellowness: 'moderate', series: 'C' },
      });
      expect(generateToothColorSummary(result)).toContain('회색 계열');
    });

    it('D 시리즈는 적회색 계열이다', () => {
      const result = createMockToothColorResult({
        interpretation: { brightness: 'medium', yellowness: 'moderate', series: 'D' },
      });
      expect(generateToothColorSummary(result)).toContain('적회색 계열');
    });
  });
});

// ============================================================================
// 7. trackWhiteningProgress
// ============================================================================

describe('trackWhiteningProgress', () => {
  describe('정상 케이스', () => {
    it('A4에서 A3로 진행, 목표 B1일 때 중간 진행률을 반환한다', () => {
      const result = trackWhiteningProgress('A4', 'A3', 'B1');

      expect(result.progressPercentage).toBeGreaterThan(0);
      expect(result.progressPercentage).toBeLessThan(100);
      expect(result.stepsCompleted).toBeGreaterThan(0);
      expect(result.stepsRemaining).toBeGreaterThan(0);
      expect(result.isGoalReached).toBe(false);
    });

    it('목표에 도달했을 때 100% 진행률을 반환한다', () => {
      const result = trackWhiteningProgress('A3', 'B1', 'B1');

      expect(result.progressPercentage).toBe(100);
      expect(result.stepsRemaining).toBe(0);
      expect(result.isGoalReached).toBe(true);
      expect(result.message).toContain('축하');
    });

    it('시작 셰이드와 현재 셰이드가 같으면 0% 진행률이다', () => {
      const result = trackWhiteningProgress('A4', 'A4', 'B1');

      expect(result.progressPercentage).toBe(0);
      expect(result.stepsCompleted).toBe(0);
      expect(result.stepsRemaining).toBeGreaterThan(0);
      expect(result.isGoalReached).toBe(false);
    });
  });

  describe('진행률 메시지', () => {
    it('75% 이상 진행 시 거의 도달 메시지를 반환한다', () => {
      // A4(idx 17) → B1(idx 3): 14단계
      // A4 → A1(idx 4): 13단계 완료 → 13/14 = 92%
      const result = trackWhiteningProgress('A4', 'A1', 'B1');

      expect(result.progressPercentage).toBeGreaterThanOrEqual(75);
      if (!result.isGoalReached) {
        expect(result.message).toContain('거의');
      }
    });

    it('목표 도달 시 축하 메시지를 반환한다', () => {
      const result = trackWhiteningProgress('A3', 'A1', 'A2');

      // A3(idx 11) → A2(idx 7) = 4 total
      // A3 → A1(idx 4) = 7 completed > 4 total
      // 목표 이미 초과 → isGoalReached: true
      expect(result.isGoalReached).toBe(true);
      expect(result.message).toContain('축하');
    });
  });

  describe('엣지 케이스', () => {
    it('목표를 초과 달성해도 진행률은 100%를 넘지 않는다', () => {
      // A3에서 0M1까지 목표인데 이미 B1 도달
      const result = trackWhiteningProgress('A3', 'B1', 'A2');

      expect(result.progressPercentage).toBeLessThanOrEqual(100);
    });

    it('같은 셰이드 3개 모두 같으면 목표 도달이다', () => {
      const result = trackWhiteningProgress('A2', 'A2', 'A2');

      expect(result.isGoalReached).toBe(true);
      expect(result.progressPercentage).toBe(100);
    });
  });
});

// ============================================================================
// 8. generateWhiteningPrecautions
// ============================================================================

describe('generateWhiteningPrecautions', () => {
  describe('정상 케이스', () => {
    it('기본 3개 주의사항을 반환한다', () => {
      const precautions = generateWhiteningPrecautions('summer', 2);

      expect(precautions.length).toBeGreaterThanOrEqual(3);
      // 기본 주의사항 포함 확인
      expect(precautions.some((p) => p.includes('착색 음식'))).toBe(true);
      expect(precautions.some((p) => p.includes('잇몸'))).toBe(true);
      expect(precautions.some((p) => p.includes('민감도'))).toBe(true);
    });

    it('shadeSteps >= 4일 때 5개 이상 주의사항을 반환한다', () => {
      const precautions = generateWhiteningPrecautions('summer', 4);

      expect(precautions.length).toBeGreaterThanOrEqual(5);
      expect(precautions.some((p) => p.includes('점진적'))).toBe(true);
      expect(precautions.some((p) => p.includes('전문가'))).toBe(true);
    });

    it('shadeSteps < 4일 때 급격한 미백 주의사항을 포함하지 않는다', () => {
      const precautions = generateWhiteningPrecautions('summer', 3);

      expect(precautions.some((p) => p.includes('급격한 미백'))).toBe(false);
    });
  });

  describe('시즌별 주의사항', () => {
    it('autumn 시즌은 추가 주의사항을 포함한다', () => {
      const precautions = generateWhiteningPrecautions('autumn', 2);

      // autumn의 whiteningNotes가 포함되어야 함
      expect(precautions.some((p) => p.includes('피부') || p.includes('과도한'))).toBe(true);
    });

    it('spring 시즌은 추가 주의사항을 포함한다', () => {
      const precautions = generateWhiteningPrecautions('spring', 2);

      // spring의 whiteningNotes가 포함되어야 함
      expect(precautions.some((p) => p.includes('블루 화이트') || p.includes('피부 톤'))).toBe(
        true
      );
    });

    it('summer 시즌은 시즌별 추가 주의사항이 없다', () => {
      const summerPrecautions = generateWhiteningPrecautions('summer', 2);
      const winterPrecautions = generateWhiteningPrecautions('winter', 2);

      // summer/winter는 시즌 추가 없이 기본 3개만
      expect(summerPrecautions).toHaveLength(3);
      expect(winterPrecautions).toHaveLength(3);
    });
  });

  describe('복합 케이스', () => {
    it('autumn + shadeSteps=6 시 모든 주의사항이 포함된다', () => {
      const precautions = generateWhiteningPrecautions('autumn', 6);

      // 기본 3개 + 급격한 미백 2개 + 시즌별 1개 = 6개
      expect(precautions.length).toBeGreaterThanOrEqual(6);
      // 기본
      expect(precautions.some((p) => p.includes('착색 음식'))).toBe(true);
      // 급격한 미백
      expect(precautions.some((p) => p.includes('점진적'))).toBe(true);
      // 시즌별
      expect(precautions.some((p) => p.includes('피부') || p.includes('과도한'))).toBe(true);
    });
  });
});
