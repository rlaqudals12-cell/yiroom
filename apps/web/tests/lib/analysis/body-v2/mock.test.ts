/**
 * C-2: body-v2 mock 모듈 테스트
 *
 * @description 체형 분석 Mock 데이터 생성 테스트
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockLandmarks,
  generateMockPoseResult,
  generateMockBodyRatios,
  generateMockPostureAnalysis,
  generateMockBodyAnalysisResult,
  mockGenerators,
} from '@/lib/analysis/body-v2/mock';
import type { BodyShapeType, Landmark33 } from '@/lib/analysis/body-v2';

// =============================================================================
// generateMockLandmarks 테스트
// =============================================================================

describe('generateMockLandmarks', () => {
  it('should generate exactly 33 landmarks', () => {
    const landmarks = generateMockLandmarks();
    expect(landmarks).toHaveLength(33);
  });

  it('should include all required landmark properties', () => {
    const landmarks = generateMockLandmarks();

    landmarks.forEach((landmark, index) => {
      expect(landmark).toHaveProperty('x');
      expect(landmark).toHaveProperty('y');
      expect(landmark).toHaveProperty('z');
      expect(landmark).toHaveProperty('visibility');
    });
  });

  it('should have x, y values between 0 and 1', () => {
    const landmarks = generateMockLandmarks();

    landmarks.forEach((landmark) => {
      expect(landmark.x).toBeGreaterThanOrEqual(0);
      expect(landmark.x).toBeLessThanOrEqual(1);
      expect(landmark.y).toBeGreaterThanOrEqual(0);
      expect(landmark.y).toBeLessThanOrEqual(1);
    });
  });

  it('should have visibility between 0 and 1', () => {
    const landmarks = generateMockLandmarks();

    landmarks.forEach((landmark) => {
      expect(landmark.visibility).toBeGreaterThanOrEqual(0);
      expect(landmark.visibility).toBeLessThanOrEqual(1);
    });
  });

  it('should have anatomically reasonable landmark positions', () => {
    const landmarks = generateMockLandmarks();

    // 머리(0)가 어깨(11, 12)보다 위에 있어야 함
    expect(landmarks[0].y).toBeLessThan(landmarks[11].y);
    expect(landmarks[0].y).toBeLessThan(landmarks[12].y);

    // 어깨(11, 12)가 골반(23, 24)보다 위에 있어야 함
    expect(landmarks[11].y).toBeLessThan(landmarks[23].y);
    expect(landmarks[12].y).toBeLessThan(landmarks[24].y);

    // 골반(23, 24)이 발목(27, 28)보다 위에 있어야 함
    expect(landmarks[23].y).toBeLessThan(landmarks[27].y);
    expect(landmarks[24].y).toBeLessThan(landmarks[28].y);
  });

  it('should have symmetric left/right landmarks', () => {
    const landmarks = generateMockLandmarks();

    // 왼쪽 어깨(11)와 오른쪽 어깨(12)가 대칭
    expect(landmarks[11].y).toBeCloseTo(landmarks[12].y, 1);

    // 왼쪽 골반(23)과 오른쪽 골반(24)이 대칭
    expect(landmarks[23].y).toBeCloseTo(landmarks[24].y, 1);
  });

  it('should generate different values on each call (randomness)', () => {
    const landmarks1 = generateMockLandmarks();
    const landmarks2 = generateMockLandmarks();

    // 어깨 너비가 다를 수 있음 (randomInRange 사용)
    const shoulderWidth1 = Math.abs(landmarks1[11].x - landmarks1[12].x);
    const shoulderWidth2 = Math.abs(landmarks2[11].x - landmarks2[12].x);

    // 완전히 같을 확률은 매우 낮음
    expect(
      shoulderWidth1 !== shoulderWidth2 ||
        landmarks1[23].x !== landmarks2[23].x
    ).toBe(true);
  });
});

// =============================================================================
// generateMockPoseResult 테스트
// =============================================================================

describe('generateMockPoseResult', () => {
  it('should generate complete pose detection result', () => {
    const result = generateMockPoseResult();

    expect(result).toHaveProperty('landmarks');
    expect(result).toHaveProperty('overallVisibility');
    expect(result).toHaveProperty('confidence');
  });

  it('should include 33 landmarks', () => {
    const result = generateMockPoseResult();
    expect(result.landmarks).toHaveLength(33);
  });

  it('should have valid overall visibility (0-1)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateMockPoseResult();
      expect(result.overallVisibility).toBeGreaterThanOrEqual(0);
      expect(result.overallVisibility).toBeLessThanOrEqual(1);
    }
  });

  it('should have valid confidence (0.7-0.9)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateMockPoseResult();
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.confidence).toBeLessThanOrEqual(0.9);
    }
  });

  it('should calculate overall visibility as average of all landmarks', () => {
    const result = generateMockPoseResult();

    const calculatedAvg =
      result.landmarks.reduce((sum, lm) => sum + lm.visibility, 0) /
      result.landmarks.length;

    expect(result.overallVisibility).toBeCloseTo(calculatedAvg, 5);
  });
});

// =============================================================================
// generateMockBodyRatios 테스트
// =============================================================================

describe('generateMockBodyRatios', () => {
  it('should generate all required ratio fields', () => {
    const ratios = generateMockBodyRatios();

    expect(ratios).toHaveProperty('shoulderWidth');
    expect(ratios).toHaveProperty('waistWidth');
    expect(ratios).toHaveProperty('hipWidth');
    expect(ratios).toHaveProperty('shoulderToWaistRatio');
    expect(ratios).toHaveProperty('waistToHipRatio');
    expect(ratios).toHaveProperty('upperBodyLength');
    expect(ratios).toHaveProperty('lowerBodyLength');
    expect(ratios).toHaveProperty('upperToLowerRatio');
    expect(ratios).toHaveProperty('armLength');
    expect(ratios).toHaveProperty('legLength');
    expect(ratios).toHaveProperty('armToTorsoRatio');
  });

  it('should generate valid positive values', () => {
    const ratios = generateMockBodyRatios();

    expect(ratios.shoulderWidth).toBeGreaterThan(0);
    expect(ratios.waistWidth).toBeGreaterThan(0);
    expect(ratios.hipWidth).toBeGreaterThan(0);
    expect(ratios.upperBodyLength).toBeGreaterThan(0);
    expect(ratios.lowerBodyLength).toBeGreaterThan(0);
    expect(ratios.armLength).toBeGreaterThan(0);
    expect(ratios.legLength).toBeGreaterThan(0);
  });

  it('should generate ratios for specified body type', () => {
    const bodyTypes: BodyShapeType[] = [
      'rectangle',
      'inverted-triangle',
      'triangle',
      'oval',
      'hourglass',
    ];

    bodyTypes.forEach((type) => {
      const ratios = generateMockBodyRatios(type);

      // 비율이 체형에 맞게 생성되어야 함
      expect(ratios.shoulderWidth).toBeGreaterThan(0);
      expect(ratios.hipWidth).toBeGreaterThan(0);
    });
  });

  it('should generate hourglass ratios with narrow waist', () => {
    const ratios = generateMockBodyRatios('hourglass');

    // 모래시계형: 허리가 어깨/힙 평균의 65-75%
    const avgShoulderHip = (ratios.shoulderWidth + ratios.hipWidth) / 2;
    const waistToAvgRatio = ratios.waistWidth / avgShoulderHip;

    expect(waistToAvgRatio).toBeGreaterThanOrEqual(0.65);
    expect(waistToAvgRatio).toBeLessThanOrEqual(0.75);
  });

  it('should generate inverted-triangle ratios with wide shoulders', () => {
    const ratios = generateMockBodyRatios('inverted-triangle');

    // 역삼각형: 어깨가 힙보다 넓음 (110-130%)
    const shoulderHipRatio = ratios.shoulderWidth / ratios.hipWidth;

    expect(shoulderHipRatio).toBeGreaterThanOrEqual(1.1);
    expect(shoulderHipRatio).toBeLessThanOrEqual(1.3);
  });

  it('should generate triangle ratios with wide hips', () => {
    const ratios = generateMockBodyRatios('triangle');

    // 삼각형: 힙이 어깨보다 넓음 (어깨/힙 = 0.75-0.9)
    const shoulderHipRatio = ratios.shoulderWidth / ratios.hipWidth;

    expect(shoulderHipRatio).toBeGreaterThanOrEqual(0.75);
    expect(shoulderHipRatio).toBeLessThanOrEqual(0.9);
  });

  it('should generate oval ratios with wide waist', () => {
    const ratios = generateMockBodyRatios('oval');

    // 타원형: 허리가 어깨/힙 평균의 95-110%
    const avgShoulderHip = (ratios.shoulderWidth + ratios.hipWidth) / 2;
    const waistToAvgRatio = ratios.waistWidth / avgShoulderHip;

    expect(waistToAvgRatio).toBeGreaterThanOrEqual(0.95);
    expect(waistToAvgRatio).toBeLessThanOrEqual(1.1);
  });

  it('should generate rectangle ratios with balanced proportions', () => {
    const ratios = generateMockBodyRatios('rectangle');

    // 직사각형: 어깨/힙 비슷 (95-105%)
    const shoulderHipRatio = ratios.shoulderWidth / ratios.hipWidth;

    expect(shoulderHipRatio).toBeGreaterThanOrEqual(0.95);
    expect(shoulderHipRatio).toBeLessThanOrEqual(1.05);
  });

  it('should calculate derived ratios correctly', () => {
    const ratios = generateMockBodyRatios();

    // shoulderToWaistRatio = shoulderWidth / waistWidth
    expect(ratios.shoulderToWaistRatio).toBeCloseTo(
      ratios.shoulderWidth / ratios.waistWidth,
      5
    );

    // waistToHipRatio = waistWidth / hipWidth
    expect(ratios.waistToHipRatio).toBeCloseTo(
      ratios.waistWidth / ratios.hipWidth,
      5
    );

    // upperToLowerRatio = upperBodyLength / lowerBodyLength
    expect(ratios.upperToLowerRatio).toBeCloseTo(
      ratios.upperBodyLength / ratios.lowerBodyLength,
      5
    );

    // armToTorsoRatio = armLength / upperBodyLength
    expect(ratios.armToTorsoRatio).toBeCloseTo(
      ratios.armLength / ratios.upperBodyLength,
      5
    );
  });
});

// =============================================================================
// generateMockPostureAnalysis 테스트
// =============================================================================

describe('generateMockPostureAnalysis', () => {
  it('should generate complete posture analysis', () => {
    const analysis = generateMockPostureAnalysis();

    expect(analysis).toHaveProperty('shoulderTilt');
    expect(analysis).toHaveProperty('hipTilt');
    expect(analysis).toHaveProperty('spineAlignment');
    expect(analysis).toHaveProperty('headPosition');
    expect(analysis).toHaveProperty('issues');
  });

  it('should have valid shoulder tilt (-5 to 5)', () => {
    for (let i = 0; i < 10; i++) {
      const analysis = generateMockPostureAnalysis();
      expect(analysis.shoulderTilt).toBeGreaterThanOrEqual(-5);
      expect(analysis.shoulderTilt).toBeLessThanOrEqual(5);
    }
  });

  it('should have valid hip tilt (-4 to 4)', () => {
    for (let i = 0; i < 10; i++) {
      const analysis = generateMockPostureAnalysis();
      expect(analysis.hipTilt).toBeGreaterThanOrEqual(-4);
      expect(analysis.hipTilt).toBeLessThanOrEqual(4);
    }
  });

  it('should have valid spine alignment (70-95)', () => {
    for (let i = 0; i < 10; i++) {
      const analysis = generateMockPostureAnalysis();
      expect(analysis.spineAlignment).toBeGreaterThanOrEqual(70);
      expect(analysis.spineAlignment).toBeLessThanOrEqual(95);
    }
  });

  it('should have valid head position', () => {
    const analysis = generateMockPostureAnalysis();
    expect(['forward', 'neutral', 'backward']).toContain(analysis.headPosition);
  });

  it('should include issues when includeIssues is true', () => {
    // 여러 번 실행하여 issues가 포함된 경우 확인
    let hasIssues = false;
    for (let i = 0; i < 20; i++) {
      const analysis = generateMockPostureAnalysis(true);
      if (analysis.issues.length > 0) {
        hasIssues = true;
        break;
      }
    }
    // 확률적으로 70% 이상 문제가 포함됨
    expect(hasIssues).toBe(true);
  });

  it('should not include issues when includeIssues is false', () => {
    const analysis = generateMockPostureAnalysis(false);
    expect(analysis.issues).toHaveLength(0);
  });

  it('should have valid issue structure when issues exist', () => {
    // issues가 있는 결과 찾기
    let analysisWithIssues = null;
    for (let i = 0; i < 30; i++) {
      const analysis = generateMockPostureAnalysis(true);
      if (analysis.issues.length > 0) {
        analysisWithIssues = analysis;
        break;
      }
    }

    if (analysisWithIssues) {
      analysisWithIssues.issues.forEach((issue) => {
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('exercises');

        expect(issue.severity).toBeGreaterThanOrEqual(1);
        expect(issue.severity).toBeLessThanOrEqual(4);
        expect(issue.exercises).toBeInstanceOf(Array);
        expect(issue.exercises.length).toBeGreaterThan(0);
      });
    }
  });

  it('should generate 1-2 issues when issues are included', () => {
    let issueCount = 0;
    let totalWithIssues = 0;

    for (let i = 0; i < 50; i++) {
      const analysis = generateMockPostureAnalysis(true);
      if (analysis.issues.length > 0) {
        issueCount += analysis.issues.length;
        totalWithIssues++;
      }
    }

    if (totalWithIssues > 0) {
      const avgIssues = issueCount / totalWithIssues;
      expect(avgIssues).toBeGreaterThanOrEqual(1);
      expect(avgIssues).toBeLessThanOrEqual(2);
    }
  });
});

// =============================================================================
// generateMockBodyAnalysisResult 테스트
// =============================================================================

describe('generateMockBodyAnalysisResult', () => {
  it('should generate complete body analysis result', () => {
    const result = generateMockBodyAnalysisResult();

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('poseDetection');
    expect(result).toHaveProperty('bodyRatios');
    expect(result).toHaveProperty('bodyShape');
    expect(result).toHaveProperty('bodyShapeInfo');
    expect(result).toHaveProperty('measurementConfidence');
    expect(result).toHaveProperty('analyzedAt');
    expect(result).toHaveProperty('usedFallback');
  });

  it('should mark result as fallback', () => {
    const result = generateMockBodyAnalysisResult();
    expect(result.usedFallback).toBe(true);
  });

  it('should generate unique UUIDs', () => {
    const results = Array.from({ length: 10 }, () =>
      generateMockBodyAnalysisResult()
    );

    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });

  it('should generate valid body shape', () => {
    const validShapes: BodyShapeType[] = [
      'rectangle',
      'inverted-triangle',
      'triangle',
      'oval',
      'hourglass',
    ];

    for (let i = 0; i < 20; i++) {
      const result = generateMockBodyAnalysisResult();
      expect(validShapes).toContain(result.bodyShape);
    }
  });

  it('should use specified target body type', () => {
    const bodyTypes: BodyShapeType[] = [
      'rectangle',
      'inverted-triangle',
      'triangle',
      'oval',
      'hourglass',
    ];

    bodyTypes.forEach((type) => {
      const result = generateMockBodyAnalysisResult({ targetBodyType: type });
      expect(result.bodyShape).toBe(type);
    });
  });

  it('should include posture analysis by default', () => {
    const result = generateMockBodyAnalysisResult();
    expect(result.postureAnalysis).toBeDefined();
  });

  it('should exclude posture analysis when includePosture is false', () => {
    const result = generateMockBodyAnalysisResult({ includePosture: false });
    expect(result.postureAnalysis).toBeUndefined();
  });

  it('should include styling recommendations by default', () => {
    const result = generateMockBodyAnalysisResult();
    expect(result.stylingRecommendations).toBeDefined();
  });

  it('should exclude styling when includeStyling is false', () => {
    const result = generateMockBodyAnalysisResult({ includeStyling: false });
    expect(result.stylingRecommendations).toBeUndefined();
  });

  it('should have valid measurement confidence (65-85)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateMockBodyAnalysisResult();
      expect(result.measurementConfidence).toBeGreaterThanOrEqual(65);
      expect(result.measurementConfidence).toBeLessThanOrEqual(85);
    }
  });

  it('should include valid ISO date string for analyzedAt', () => {
    const result = generateMockBodyAnalysisResult();

    expect(result.analyzedAt).toBeDefined();
    expect(() => new Date(result.analyzedAt)).not.toThrow();
  });

  it('should include body shape info with styling tips', () => {
    const result = generateMockBodyAnalysisResult();

    expect(result.bodyShapeInfo).toHaveProperty('label');
    expect(result.bodyShapeInfo).toHaveProperty('characteristics');
    expect(result.bodyShapeInfo).toHaveProperty('stylingTips');
    expect(result.bodyShapeInfo.stylingTips.length).toBeGreaterThan(0);
  });

  it('should have styling recommendations with all categories', () => {
    const result = generateMockBodyAnalysisResult({ includeStyling: true });

    if (result.stylingRecommendations) {
      expect(result.stylingRecommendations).toHaveProperty('tops');
      expect(result.stylingRecommendations).toHaveProperty('bottoms');
      expect(result.stylingRecommendations).toHaveProperty('outerwear');
      expect(result.stylingRecommendations).toHaveProperty('silhouettes');
      expect(result.stylingRecommendations).toHaveProperty('avoid');
    }
  });
});

// =============================================================================
// mockGenerators 테스트
// =============================================================================

describe('mockGenerators', () => {
  it('should have generators for all 5 body types', () => {
    expect(mockGenerators).toHaveProperty('rectangle');
    expect(mockGenerators).toHaveProperty('invertedTriangle');
    expect(mockGenerators).toHaveProperty('triangle');
    expect(mockGenerators).toHaveProperty('oval');
    expect(mockGenerators).toHaveProperty('hourglass');
  });

  it('should generate rectangle body type', () => {
    const result = mockGenerators.rectangle();
    expect(result.bodyShape).toBe('rectangle');
  });

  it('should generate inverted-triangle body type', () => {
    const result = mockGenerators.invertedTriangle();
    expect(result.bodyShape).toBe('inverted-triangle');
  });

  it('should generate triangle body type', () => {
    const result = mockGenerators.triangle();
    expect(result.bodyShape).toBe('triangle');
  });

  it('should generate oval body type', () => {
    const result = mockGenerators.oval();
    expect(result.bodyShape).toBe('oval');
  });

  it('should generate hourglass body type', () => {
    const result = mockGenerators.hourglass();
    expect(result.bodyShape).toBe('hourglass');
  });

  it('all generators should return complete results', () => {
    const generators = [
      mockGenerators.rectangle,
      mockGenerators.invertedTriangle,
      mockGenerators.triangle,
      mockGenerators.oval,
      mockGenerators.hourglass,
    ];

    generators.forEach((generator) => {
      const result = generator();

      expect(result.id).toBeDefined();
      expect(result.poseDetection).toBeDefined();
      expect(result.bodyRatios).toBeDefined();
      expect(result.bodyShape).toBeDefined();
      expect(result.usedFallback).toBe(true);
    });
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Body-v2 Mock Edge Cases', () => {
  it('should handle undefined options gracefully', () => {
    const result = generateMockBodyAnalysisResult(undefined);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('should handle empty options object gracefully', () => {
    const result = generateMockBodyAnalysisResult({});
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('should handle partial options gracefully', () => {
    const result = generateMockBodyAnalysisResult({ includePosture: true });
    expect(result.postureAnalysis).toBeDefined();
    expect(result.stylingRecommendations).toBeDefined();
  });

  it('should generate valid data even with all options disabled', () => {
    const result = generateMockBodyAnalysisResult({
      includePosture: false,
      includeStyling: false,
    });

    expect(result.id).toBeDefined();
    expect(result.bodyShape).toBeDefined();
    expect(result.bodyRatios).toBeDefined();
    expect(result.postureAnalysis).toBeUndefined();
    expect(result.stylingRecommendations).toBeUndefined();
  });

  it('should maintain consistency between body type and ratios', () => {
    const types: BodyShapeType[] = ['hourglass', 'inverted-triangle', 'triangle'];

    types.forEach((type) => {
      const result = generateMockBodyAnalysisResult({ targetBodyType: type });

      // 체형과 비율이 일치해야 함
      expect(result.bodyShape).toBe(type);

      // 비율이 해당 체형 범위 내에 있어야 함
      const { shoulderWidth, waistWidth, hipWidth } = result.bodyRatios;
      const avgShoulderHip = (shoulderWidth + hipWidth) / 2;
      const waistToAvgRatio = waistWidth / avgShoulderHip;

      if (type === 'hourglass') {
        expect(waistToAvgRatio).toBeLessThan(0.8);
      }
    });
  });

  it('should handle rapid successive calls without issues', () => {
    const results = Array.from({ length: 100 }, () =>
      generateMockBodyAnalysisResult()
    );

    // 모든 결과가 유효해야 함
    results.forEach((result) => {
      expect(result.id).toBeDefined();
      expect(result.bodyShape).toBeDefined();
    });

    // 모든 ID가 고유해야 함
    const ids = new Set(results.map((r) => r.id));
    expect(ids.size).toBe(100);
  });
});
