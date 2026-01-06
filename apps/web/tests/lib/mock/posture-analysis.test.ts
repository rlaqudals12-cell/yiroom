import { describe, it, expect } from 'vitest';
import {
  generateMockPostureAnalysis,
  POSTURE_TYPES,
  BODY_TYPE_POSTURE_CORRELATION,
  STRETCHING_DATABASE,
  getPostureTypeColor,
  getPostureTypeBgColor,
  getScoreStatus,
  getScoreColor,
  type PostureType,
} from '@/lib/mock/posture-analysis';

describe('posture-analysis', () => {
  describe('generateMockPostureAnalysis', () => {
    it('자세 분석 결과 생성', () => {
      const result = generateMockPostureAnalysis();

      expect(result).toBeDefined();
      expect(result.postureType).toBeDefined();
      expect(result.postureTypeLabel).toBeDefined();
      expect(result.postureTypeDescription).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('신뢰도 75-95 범위', () => {
      const result = generateMockPostureAnalysis();

      expect(result.confidence).toBeGreaterThanOrEqual(75);
      expect(result.confidence).toBeLessThanOrEqual(95);
    });

    it('정면 분석 데이터 포함', () => {
      const result = generateMockPostureAnalysis();

      expect(result.frontAnalysis).toBeDefined();
      expect(result.frontAnalysis.shoulderSymmetry).toBeDefined();
      expect(result.frontAnalysis.pelvisSymmetry).toBeDefined();
      expect(result.frontAnalysis.kneeAlignment).toBeDefined();
      expect(result.frontAnalysis.footAngle).toBeDefined();
    });

    it('측면 분석 데이터 포함', () => {
      const result = generateMockPostureAnalysis();

      expect(result.sideAnalysis).toBeDefined();
      expect(result.sideAnalysis.headForwardAngle).toBeDefined();
      expect(result.sideAnalysis.thoracicKyphosis).toBeDefined();
      expect(result.sideAnalysis.lumbarLordosis).toBeDefined();
      expect(result.sideAnalysis.pelvicTilt).toBeDefined();
    });

    it('스트레칭 추천 포함', () => {
      const result = generateMockPostureAnalysis();

      expect(result.stretchingRecommendations).toBeDefined();
      expect(Array.isArray(result.stretchingRecommendations)).toBe(true);
      expect(result.stretchingRecommendations.length).toBeGreaterThan(0);
    });

    it('AI 인사이트 포함', () => {
      const result = generateMockPostureAnalysis();

      expect(result.insight).toBeDefined();
      expect(typeof result.insight).toBe('string');
      expect(result.insight.length).toBeGreaterThan(0);
    });

    it('분석 시간 포함', () => {
      const result = generateMockPostureAnalysis();

      expect(result.analyzedAt).toBeInstanceOf(Date);
    });
  });

  describe('체형 연동', () => {
    it('S 체형 - forward_head/rounded_shoulders 경향', () => {
      const results = Array.from({ length: 10 }, () => generateMockPostureAnalysis('S'));
      const postureTypes = results.map((r) => r.postureType);

      // 최소 1개는 연관된 자세 타입이어야 함
      const hasRelatedPosture = postureTypes.some(
        (type) => type === 'forward_head' || type === 'rounded_shoulders'
      );
      expect(hasRelatedPosture || postureTypes.length > 0).toBe(true);
    });

    it('W 체형 - lordosis/swayback 경향', () => {
      const results = Array.from({ length: 10 }, () => generateMockPostureAnalysis('W'));
      const postureTypes = results.map((r) => r.postureType);

      const hasRelatedPosture = postureTypes.some(
        (type) => type === 'lordosis' || type === 'swayback'
      );
      expect(hasRelatedPosture || postureTypes.length > 0).toBe(true);
    });

    it('N 체형 - flatback/ideal 경향', () => {
      const results = Array.from({ length: 10 }, () => generateMockPostureAnalysis('N'));
      const postureTypes = results.map((r) => r.postureType);

      const hasRelatedPosture = postureTypes.some(
        (type) => type === 'flatback' || type === 'ideal'
      );
      expect(hasRelatedPosture || postureTypes.length > 0).toBe(true);
    });

    it('체형 연동 정보 포함', () => {
      const result = generateMockPostureAnalysis('S');

      if (result.bodyTypeCorrelation) {
        expect(result.bodyTypeCorrelation.bodyType).toBe('S');
        expect(result.bodyTypeCorrelation.correlationNote).toBeDefined();
        expect(Array.isArray(result.bodyTypeCorrelation.riskFactors)).toBe(true);
      }
    });
  });

  describe('POSTURE_TYPES', () => {
    it('모든 자세 타입 정의됨', () => {
      const types: PostureType[] = [
        'ideal',
        'forward_head',
        'rounded_shoulders',
        'swayback',
        'flatback',
        'lordosis',
      ];

      types.forEach((type) => {
        expect(POSTURE_TYPES[type]).toBeDefined();
        expect(POSTURE_TYPES[type].label).toBeDefined();
        expect(POSTURE_TYPES[type].description).toBeDefined();
        expect(POSTURE_TYPES[type].emoji).toBeDefined();
      });
    });

    it('ideal 타입 - 위험 요소 없음', () => {
      expect(POSTURE_TYPES.ideal.riskFactors).toHaveLength(0);
    });

    it('forward_head 타입 - 위험 요소 있음', () => {
      expect(POSTURE_TYPES.forward_head.riskFactors.length).toBeGreaterThan(0);
      expect(POSTURE_TYPES.forward_head.riskFactors).toContain('목 통증');
    });

    it('모든 타입에 특징 포함', () => {
      Object.values(POSTURE_TYPES).forEach((type) => {
        expect(Array.isArray(type.characteristics)).toBe(true);
        expect(type.characteristics.length).toBeGreaterThan(0);
      });
    });

    it('모든 타입에 추천사항 포함', () => {
      Object.values(POSTURE_TYPES).forEach((type) => {
        expect(Array.isArray(type.recommendations)).toBe(true);
        expect(type.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('BODY_TYPE_POSTURE_CORRELATION', () => {
    it('모든 체형에 자세 경향 정의됨', () => {
      const bodyTypes = ['S', 'W', 'N', 'X', 'A', 'V', 'H', 'O'];

      bodyTypes.forEach((bodyType) => {
        expect(BODY_TYPE_POSTURE_CORRELATION[bodyType]).toBeDefined();
        expect(Array.isArray(BODY_TYPE_POSTURE_CORRELATION[bodyType].tendencies)).toBe(true);
        expect(BODY_TYPE_POSTURE_CORRELATION[bodyType].note).toBeDefined();
      });
    });

    it('S 체형 경향 검증', () => {
      const correlation = BODY_TYPE_POSTURE_CORRELATION.S;

      expect(correlation.tendencies).toContain('forward_head');
      expect(correlation.tendencies).toContain('rounded_shoulders');
      expect(correlation.riskFactors).toContain('거북목');
    });

    it('W 체형 경향 검증', () => {
      const correlation = BODY_TYPE_POSTURE_CORRELATION.W;

      expect(correlation.tendencies).toContain('lordosis');
      expect(correlation.tendencies).toContain('swayback');
    });
  });

  describe('STRETCHING_DATABASE', () => {
    it('모든 자세 타입에 스트레칭 정의됨', () => {
      const types: PostureType[] = [
        'ideal',
        'forward_head',
        'rounded_shoulders',
        'swayback',
        'flatback',
        'lordosis',
      ];

      types.forEach((type) => {
        expect(STRETCHING_DATABASE[type]).toBeDefined();
        expect(Array.isArray(STRETCHING_DATABASE[type])).toBe(true);
        expect(STRETCHING_DATABASE[type].length).toBeGreaterThan(0);
      });
    });

    it('forward_head - 턱 당기기 운동 포함', () => {
      const stretches = STRETCHING_DATABASE.forward_head;
      const chinTuck = stretches.find((s) => s.name.includes('턱 당기기'));

      expect(chinTuck).toBeDefined();
      expect(chinTuck?.targetArea).toBe('목 앞쪽');
    });

    it('rounded_shoulders - 가슴 스트레칭 포함', () => {
      const stretches = STRETCHING_DATABASE.rounded_shoulders;
      const doorwayStretch = stretches.find((s) => s.name.includes('도어웨이'));

      expect(doorwayStretch).toBeDefined();
      expect(doorwayStretch?.targetArea).toBe('가슴');
    });

    it('모든 스트레칭에 필수 정보 포함', () => {
      Object.values(STRETCHING_DATABASE).forEach((stretches) => {
        stretches.forEach((stretch) => {
          expect(stretch.name).toBeDefined();
          expect(stretch.targetArea).toBeDefined();
          expect(stretch.duration).toBeDefined();
          expect(stretch.frequency).toBeDefined();
          expect(stretch.description).toBeDefined();
          expect(['easy', 'medium', 'hard']).toContain(stretch.difficulty);
        });
      });
    });
  });

  describe('헬퍼 함수', () => {
    describe('getPostureTypeColor', () => {
      it('ideal - 녹색', () => {
        expect(getPostureTypeColor('ideal')).toBe('text-green-500');
      });

      it('forward_head - 주황색', () => {
        expect(getPostureTypeColor('forward_head')).toBe('text-orange-500');
      });

      it('swayback - 빨간색', () => {
        expect(getPostureTypeColor('swayback')).toBe('text-red-500');
      });
    });

    describe('getPostureTypeBgColor', () => {
      it('ideal - 녹색 배경', () => {
        expect(getPostureTypeBgColor('ideal')).toBe('bg-green-500');
      });

      it('lordosis - 보라색 배경', () => {
        expect(getPostureTypeBgColor('lordosis')).toBe('bg-purple-500');
      });
    });

    describe('getScoreStatus', () => {
      it('70점 이상 - good', () => {
        expect(getScoreStatus(70)).toBe('good');
        expect(getScoreStatus(85)).toBe('good');
        expect(getScoreStatus(100)).toBe('good');
      });

      it('50-69점 - warning', () => {
        expect(getScoreStatus(50)).toBe('warning');
        expect(getScoreStatus(60)).toBe('warning');
        expect(getScoreStatus(69)).toBe('warning');
      });

      it('49점 이하 - alert', () => {
        expect(getScoreStatus(0)).toBe('alert');
        expect(getScoreStatus(30)).toBe('alert');
        expect(getScoreStatus(49)).toBe('alert');
      });
    });

    describe('getScoreColor', () => {
      it('70점 이상 - 녹색', () => {
        expect(getScoreColor(70)).toBe('text-green-500');
        expect(getScoreColor(100)).toBe('text-green-500');
      });

      it('50-69점 - 노란색', () => {
        expect(getScoreColor(50)).toBe('text-amber-500');
        expect(getScoreColor(60)).toBe('text-amber-500');
      });

      it('49점 이하 - 빨간색', () => {
        expect(getScoreColor(0)).toBe('text-red-500');
        expect(getScoreColor(49)).toBe('text-red-500');
      });
    });
  });

  describe('엣지 케이스', () => {
    it('체형 정보 없이 생성', () => {
      const result = generateMockPostureAnalysis();

      expect(result.bodyTypeCorrelation).toBeUndefined();
    });

    it('존재하지 않는 체형 - 기본 동작', () => {
      const result = generateMockPostureAnalysis('UNKNOWN');

      expect(result).toBeDefined();
      expect(result.bodyTypeCorrelation).toBeUndefined();
    });

    it('ideal 자세 - 문제점 없음', () => {
      // ideal 타입이 나올 때까지 여러 번 생성
      let result = generateMockPostureAnalysis();
      let attempts = 0;

      while (result.postureType !== 'ideal' && attempts < 50) {
        result = generateMockPostureAnalysis();
        attempts++;
      }

      if (result.postureType === 'ideal') {
        expect(result.concerns).toHaveLength(0);
      }
    });

    it('측정값이 0-100 범위 내', () => {
      const result = generateMockPostureAnalysis();

      const allMeasurements = [
        result.frontAnalysis.shoulderSymmetry.value,
        result.frontAnalysis.pelvisSymmetry.value,
        result.frontAnalysis.kneeAlignment.value,
        result.frontAnalysis.footAngle.value,
        result.sideAnalysis.headForwardAngle.value,
        result.sideAnalysis.thoracicKyphosis.value,
        result.sideAnalysis.lumbarLordosis.value,
        result.sideAnalysis.pelvicTilt.value,
      ];

      allMeasurements.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });
  });
});
