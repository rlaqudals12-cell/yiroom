/**
 * 변색 원인별 미백 목표 계산기 테스트
 *
 * @module tests/lib/oral-health/whitening-cause-calculator
 * @description 4종 변색 원인별 미백 추천 경로 검증
 */

import { describe, it, expect } from 'vitest';
import { calculateWhiteningGoalByCause } from '@/lib/oral-health/whitening-cause-calculator';
import type { DiscolorationCause } from '@/types/oral-health';

describe('lib/oral-health/whitening-cause-calculator', () => {
  // 공통 테스트 파라미터
  const BASE_SHADE = 'A3' as const;
  const SEASON = 'spring' as const;
  const LEVEL = 'moderate' as const;

  describe('surface 원인 (표면 착색)', () => {
    it('selfBleachingEffectiveness가 0.9이다 (높은 자가 미백 효과)', () => {
      // Arrange & Act
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'surface');

      // Assert
      expect(result.selfBleachingEffectiveness).toBe(0.9);
    });

    it('전문 시술이 필요하지 않다', () => {
      // Arrange & Act
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'surface');

      // Assert
      expect(result.needsProfessional).toBe(false);
    });

    it('기본 목표와 동일하거나 유사한 targetShade를 반환한다', () => {
      // Arrange & Act
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'surface');

      // Assert
      // surface는 needsProfessional=false이므로 realisticTargetShade = baseGoal.targetShade
      expect(result.realisticTargetShade).toBe(result.targetShade);
    });
  });

  describe('intrinsic 원인 (내재적 변색)', () => {
    it('전문 시술이 필요하다', () => {
      // Arrange & Act
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'intrinsic');

      // Assert
      expect(result.needsProfessional).toBe(true);
    });

    it('selfBleachingEffectiveness가 0.4이다', () => {
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'intrinsic');

      expect(result.selfBleachingEffectiveness).toBe(0.4);
    });
  });

  describe('antibiotic 원인 (항생제 변색)', () => {
    it('selfBleachingEffectiveness가 0.2이다 (가장 낮은 효과)', () => {
      // Arrange & Act
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'antibiotic');

      // Assert
      expect(result.selfBleachingEffectiveness).toBe(0.2);
    });

    it('추천 방법이 preferredMethods 우선순위대로 정렬된다', () => {
      // Arrange & Act
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'antibiotic');

      // Assert
      // antibiotic의 preferredMethods는 ['in_office']
      // in_office가 목록에 있으면 앞에 위치, 없으면 기존 방법이 우선순위 99로 정렬
      expect(result.recommendedMethods.length).toBeGreaterThan(0);

      // in_office가 목록에 있으면 첫 번째여야 함
      const hasInOffice = result.recommendedMethods.some((m) => m.method === 'in_office');
      if (hasInOffice) {
        expect(result.recommendedMethods[0].method).toBe('in_office');
      }
    });

    it('전문 시술이 필요하다', () => {
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'antibiotic');

      expect(result.needsProfessional).toBe(true);
    });
  });

  describe('aging 원인 (노화 변색)', () => {
    it('selfBleachingEffectiveness가 0.6이다 (중간 효과)', () => {
      // Arrange & Act
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'aging');

      // Assert
      expect(result.selfBleachingEffectiveness).toBe(0.6);
    });

    it('전문 시술이 필요하지 않다', () => {
      const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'aging');

      expect(result.needsProfessional).toBe(false);
    });
  });

  describe('모든 원인 공통 검증', () => {
    const ALL_CAUSES: DiscolorationCause[] = ['surface', 'intrinsic', 'aging', 'antibiotic'];

    it('4종 원인 모두 causeName과 causePrecautions를 반환한다', () => {
      for (const cause of ALL_CAUSES) {
        // Act
        const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, cause);

        // Assert
        expect(result.causeName).toBeDefined();
        expect(result.causeName.length).toBeGreaterThan(0);
        expect(Array.isArray(result.causePrecautions)).toBe(true);
        expect(result.causePrecautions.length).toBeGreaterThan(0);
      }
    });

    it('모든 원인의 causePrecautions가 비어있지 않다', () => {
      for (const cause of ALL_CAUSES) {
        const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, cause);

        expect(result.causePrecautions.length).toBeGreaterThan(0);
        for (const precaution of result.causePrecautions) {
          expect(typeof precaution).toBe('string');
          expect(precaution.length).toBeGreaterThan(0);
        }
      }
    });

    it('효과가 낮은 원인일수록 기간이 더 길다', () => {
      // Arrange
      const surfaceResult = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, 'surface');
      const antibioticResult = calculateWhiteningGoalByCause(
        BASE_SHADE,
        SEASON,
        LEVEL,
        'antibiotic'
      );

      // Assert - antibiotic(0.2)은 surface(0.9)보다 기간이 길어야 한다
      expect(antibioticResult.expectedDuration.maxWeeks).toBeGreaterThanOrEqual(
        surfaceResult.expectedDuration.maxWeeks
      );
    });

    it('4종 원인 모두 유효한 cause 필드를 반환한다', () => {
      for (const cause of ALL_CAUSES) {
        const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, cause);

        expect(result.cause).toBe(cause);
      }
    });

    it('4종 원인 모두 causeDescription이 존재한다', () => {
      for (const cause of ALL_CAUSES) {
        const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, cause);

        expect(result.causeDescription).toBeDefined();
        expect(result.causeDescription.length).toBeGreaterThan(0);
      }
    });

    it('4종 원인 모두 realisticShadeSteps가 1 이상이다', () => {
      for (const cause of ALL_CAUSES) {
        const result = calculateWhiteningGoalByCause(BASE_SHADE, SEASON, LEVEL, cause);

        expect(result.realisticShadeSteps).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
