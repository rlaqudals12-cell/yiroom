/**
 * C-2: 체형분석 v2 모듈 배럴 익스포트 테스트
 *
 * @module tests/lib/analysis/body-v2/index
 * @description MediaPipe Pose 33 랜드마크 기반 체형 분석
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
 */

import { describe, it, expect } from 'vitest';
import * as BodyV2Module from '@/lib/analysis/body-v2';

describe('lib/analysis/body-v2 배럴 익스포트', () => {
  // ==========================================================================
  // 상수 익스포트
  // ==========================================================================
  describe('상수 익스포트', () => {
    it('POSE_LANDMARK_INDEX가 export된다', () => {
      expect(BodyV2Module.POSE_LANDMARK_INDEX).toBeDefined();
      expect(typeof BodyV2Module.POSE_LANDMARK_INDEX).toBe('object');
    });

    it('BODY_SHAPE_INFO가 export된다', () => {
      expect(BodyV2Module.BODY_SHAPE_INFO).toBeDefined();
      expect(typeof BodyV2Module.BODY_SHAPE_INFO).toBe('object');
    });

    it('BODY_SHAPE_THRESHOLDS가 export된다', () => {
      expect(BodyV2Module.BODY_SHAPE_THRESHOLDS).toBeDefined();
      expect(typeof BodyV2Module.BODY_SHAPE_THRESHOLDS).toBe('object');
    });

    it('POSTURE_ISSUE_LABELS가 export된다', () => {
      expect(BodyV2Module.POSTURE_ISSUE_LABELS).toBeDefined();
      expect(typeof BodyV2Module.POSTURE_ISSUE_LABELS).toBe('object');
    });

    it('POSTURE_EXERCISES가 export된다', () => {
      expect(BodyV2Module.POSTURE_EXERCISES).toBeDefined();
      expect(typeof BodyV2Module.POSTURE_EXERCISES).toBe('object');
    });
  });

  // ==========================================================================
  // Pose 검출 함수 (C2-1)
  // ==========================================================================
  describe('Pose 검출 함수 (C2-1)', () => {
    it('initPose가 export된다', () => {
      expect(BodyV2Module.initPose).toBeDefined();
      expect(typeof BodyV2Module.initPose).toBe('function');
    });

    it('closePose가 export된다', () => {
      expect(BodyV2Module.closePose).toBeDefined();
      expect(typeof BodyV2Module.closePose).toBe('function');
    });

    it('isPoseLoaded가 export된다', () => {
      expect(BodyV2Module.isPoseLoaded).toBeDefined();
      expect(typeof BodyV2Module.isPoseLoaded).toBe('function');
    });

    it('detectPose가 export된다', () => {
      expect(BodyV2Module.detectPose).toBeDefined();
      expect(typeof BodyV2Module.detectPose).toBe('function');
    });

    it('validatePoseLandmarks가 export된다', () => {
      expect(BodyV2Module.validatePoseLandmarks).toBeDefined();
      expect(typeof BodyV2Module.validatePoseLandmarks).toBe('function');
    });

    it('landmarkToPixel이 export된다', () => {
      expect(BodyV2Module.landmarkToPixel).toBeDefined();
      expect(typeof BodyV2Module.landmarkToPixel).toBe('function');
    });

    it('calculateLandmarkDistance가 export된다', () => {
      expect(BodyV2Module.calculateLandmarkDistance).toBeDefined();
      expect(typeof BodyV2Module.calculateLandmarkDistance).toBe('function');
    });

    it('calculateLandmarkDistance3D가 export된다', () => {
      expect(BodyV2Module.calculateLandmarkDistance3D).toBeDefined();
      expect(typeof BodyV2Module.calculateLandmarkDistance3D).toBe('function');
    });

    it('calculateMidpoint가 export된다', () => {
      expect(BodyV2Module.calculateMidpoint).toBeDefined();
      expect(typeof BodyV2Module.calculateMidpoint).toBe('function');
    });
  });

  // ==========================================================================
  // 체형 비율 계산 (C2-2)
  // ==========================================================================
  describe('체형 비율 계산 (C2-2)', () => {
    it('calculateBodyRatios가 export된다', () => {
      expect(BodyV2Module.calculateBodyRatios).toBeDefined();
      expect(typeof BodyV2Module.calculateBodyRatios).toBe('function');
    });

    it('convertToCentimeters가 export된다', () => {
      expect(BodyV2Module.convertToCentimeters).toBeDefined();
      expect(typeof BodyV2Module.convertToCentimeters).toBe('function');
    });

    it('calculateRatioConfidence가 export된다', () => {
      expect(BodyV2Module.calculateRatioConfidence).toBeDefined();
      expect(typeof BodyV2Module.calculateRatioConfidence).toBe('function');
    });

    it('calculateSymmetry가 export된다', () => {
      expect(BodyV2Module.calculateSymmetry).toBeDefined();
      expect(typeof BodyV2Module.calculateSymmetry).toBe('function');
    });
  });

  // ==========================================================================
  // 체형 유형 분류 (C2-3)
  // ==========================================================================
  describe('체형 유형 분류 (C2-3)', () => {
    it('classifyBodyType이 export된다', () => {
      expect(BodyV2Module.classifyBodyType).toBeDefined();
      expect(typeof BodyV2Module.classifyBodyType).toBe('function');
    });

    it('getBodyShapeInfo가 export된다', () => {
      expect(BodyV2Module.getBodyShapeInfo).toBeDefined();
      expect(typeof BodyV2Module.getBodyShapeInfo).toBe('function');
    });

    it('getAllBodyShapeInfo가 export된다', () => {
      expect(BodyV2Module.getAllBodyShapeInfo).toBeDefined();
      expect(typeof BodyV2Module.getAllBodyShapeInfo).toBe('function');
    });

    it('calculateClassificationConfidence가 export된다', () => {
      expect(BodyV2Module.calculateClassificationConfidence).toBeDefined();
      expect(typeof BodyV2Module.calculateClassificationConfidence).toBe('function');
    });

    it('getStylingPriorities가 export된다', () => {
      expect(BodyV2Module.getStylingPriorities).toBeDefined();
      expect(typeof BodyV2Module.getStylingPriorities).toBe('function');
    });

    it('getStylesToAvoid가 export된다', () => {
      expect(BodyV2Module.getStylesToAvoid).toBeDefined();
      expect(typeof BodyV2Module.getStylesToAvoid).toBe('function');
    });

    it('getBodyShapeInfo가 유효한 정보를 반환한다', () => {
      const info = BodyV2Module.getBodyShapeInfo('hourglass');
      expect(info).toBeDefined();
      expect(info).toHaveProperty('label');
      expect(info).toHaveProperty('description');
    });

    it('getAllBodyShapeInfo가 모든 체형 정보를 반환한다', () => {
      const allInfo = BodyV2Module.getAllBodyShapeInfo();
      expect(allInfo).toBeDefined();
      expect(typeof allInfo).toBe('object');
    });
  });

  // ==========================================================================
  // 자세 교정 추천 (C2-4)
  // ==========================================================================
  describe('자세 교정 추천 (C2-4)', () => {
    it('analyzePosture가 export된다', () => {
      expect(BodyV2Module.analyzePosture).toBeDefined();
      expect(typeof BodyV2Module.analyzePosture).toBe('function');
    });

    it('getPostureIssueLabel이 export된다', () => {
      expect(BodyV2Module.getPostureIssueLabel).toBeDefined();
      expect(typeof BodyV2Module.getPostureIssueLabel).toBe('function');
    });

    it('calculatePostureScore가 export된다', () => {
      expect(BodyV2Module.calculatePostureScore).toBeDefined();
      expect(typeof BodyV2Module.calculatePostureScore).toBe('function');
    });

    it('getPriorityIssues가 export된다', () => {
      expect(BodyV2Module.getPriorityIssues).toBeDefined();
      expect(typeof BodyV2Module.getPriorityIssues).toBe('function');
    });

    it('getRecommendedExercises가 export된다', () => {
      expect(BodyV2Module.getRecommendedExercises).toBeDefined();
      expect(typeof BodyV2Module.getRecommendedExercises).toBe('function');
    });

    it('generatePostureSummary가 export된다', () => {
      expect(BodyV2Module.generatePostureSummary).toBeDefined();
      expect(typeof BodyV2Module.generatePostureSummary).toBe('function');
    });
  });

  // ==========================================================================
  // Mock 데이터 생성 (C2-6)
  // ==========================================================================
  describe('Mock 데이터 생성 (C2-6)', () => {
    it('generateMockLandmarks가 export된다', () => {
      expect(BodyV2Module.generateMockLandmarks).toBeDefined();
      expect(typeof BodyV2Module.generateMockLandmarks).toBe('function');
    });

    it('generateMockPoseResult가 export된다', () => {
      expect(BodyV2Module.generateMockPoseResult).toBeDefined();
      expect(typeof BodyV2Module.generateMockPoseResult).toBe('function');
    });

    it('generateMockBodyRatios가 export된다', () => {
      expect(BodyV2Module.generateMockBodyRatios).toBeDefined();
      expect(typeof BodyV2Module.generateMockBodyRatios).toBe('function');
    });

    it('generateMockPostureAnalysis가 export된다', () => {
      expect(BodyV2Module.generateMockPostureAnalysis).toBeDefined();
      expect(typeof BodyV2Module.generateMockPostureAnalysis).toBe('function');
    });

    it('generateMockBodyAnalysisResult가 export된다', () => {
      expect(BodyV2Module.generateMockBodyAnalysisResult).toBeDefined();
      expect(typeof BodyV2Module.generateMockBodyAnalysisResult).toBe('function');
    });

    it('mockGenerators가 export된다', () => {
      expect(BodyV2Module.mockGenerators).toBeDefined();
      expect(typeof BodyV2Module.mockGenerators).toBe('object');
    });

    it('generateMockLandmarks가 33개 랜드마크를 반환한다', () => {
      const landmarks = BodyV2Module.generateMockLandmarks();
      expect(landmarks).toBeDefined();
      expect(Array.isArray(landmarks)).toBe(true);
      expect(landmarks.length).toBe(33);
    });

    it('generateMockBodyAnalysisResult가 유효한 결과를 반환한다', () => {
      const mockResult = BodyV2Module.generateMockBodyAnalysisResult();
      expect(mockResult).toHaveProperty('id');
      expect(mockResult).toHaveProperty('bodyShape');
      expect(mockResult).toHaveProperty('bodyRatios');
      expect(mockResult).toHaveProperty('poseDetection');
      expect(mockResult).toHaveProperty('bodyShapeInfo');
      expect(mockResult).toHaveProperty('measurementConfidence');
      expect(mockResult.measurementConfidence).toBeGreaterThanOrEqual(0);
      expect(mockResult.measurementConfidence).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // 통합 테스트
  // ==========================================================================
  describe('통합 테스트', () => {
    it('Mock 랜드마크 -> 비율 계산 -> 체형 분류 파이프라인이 동작한다', () => {
      // Mock 포즈 결과 생성
      const poseResult = BodyV2Module.generateMockPoseResult();
      expect(poseResult).toHaveProperty('landmarks');
      expect(poseResult.landmarks.length).toBe(33);

      // 비율 계산
      const ratios = BodyV2Module.calculateBodyRatios(poseResult);
      expect(ratios).toHaveProperty('shoulderWidth');
      expect(ratios).toHaveProperty('hipWidth');
      expect(ratios).toHaveProperty('shoulderToWaistRatio');
      expect(ratios).toHaveProperty('waistToHipRatio');

      // 체형 분류
      const bodyType = BodyV2Module.classifyBodyType(ratios);
      expect(bodyType).toBeDefined();
      expect(typeof bodyType).toBe('string');
    });

    it('Mock 포즈 결과 -> 자세 분석 파이프라인이 동작한다', () => {
      // Mock 포즈 결과 생성
      const poseResult = BodyV2Module.generateMockPoseResult();

      // 자세 분석
      const postureAnalysis = BodyV2Module.analyzePosture(poseResult);
      expect(postureAnalysis).toHaveProperty('shoulderTilt');
      expect(postureAnalysis).toHaveProperty('hipTilt');
      expect(postureAnalysis).toHaveProperty('spineAlignment');
      expect(postureAnalysis).toHaveProperty('headPosition');
      expect(postureAnalysis).toHaveProperty('issues');
      expect(Array.isArray(postureAnalysis.issues)).toBe(true);

      // 자세 점수 계산 (별도 함수)
      const postureScore = BodyV2Module.calculatePostureScore(postureAnalysis);
      expect(typeof postureScore).toBe('number');
      expect(postureScore).toBeGreaterThanOrEqual(0);
      expect(postureScore).toBeLessThanOrEqual(100);
    });

    it('POSE_LANDMARK_INDEX에 33개 랜드마크가 정의된다', () => {
      const index = BodyV2Module.POSE_LANDMARK_INDEX;
      expect(index.NOSE).toBe(0);
      expect(index.LEFT_SHOULDER).toBeDefined();
      expect(index.RIGHT_SHOULDER).toBeDefined();
      expect(index.LEFT_HIP).toBeDefined();
      expect(index.RIGHT_HIP).toBeDefined();
    });
  });

  // ==========================================================================
  // 모듈 구조 검증
  // ==========================================================================
  describe('모듈 구조', () => {
    it('필수 export가 모두 존재한다', () => {
      const exports = Object.keys(BodyV2Module);

      // 상수
      expect(exports).toContain('POSE_LANDMARK_INDEX');
      expect(exports).toContain('BODY_SHAPE_INFO');
      expect(exports).toContain('BODY_SHAPE_THRESHOLDS');
      expect(exports).toContain('POSTURE_ISSUE_LABELS');
      expect(exports).toContain('POSTURE_EXERCISES');

      // Pose 검출
      expect(exports).toContain('initPose');
      expect(exports).toContain('closePose');
      expect(exports).toContain('detectPose');
      expect(exports).toContain('validatePoseLandmarks');

      // 비율 계산
      expect(exports).toContain('calculateBodyRatios');
      expect(exports).toContain('calculateSymmetry');

      // 체형 분류
      expect(exports).toContain('classifyBodyType');
      expect(exports).toContain('getBodyShapeInfo');

      // 자세 교정
      expect(exports).toContain('analyzePosture');
      expect(exports).toContain('calculatePostureScore');
      expect(exports).toContain('getRecommendedExercises');

      // Mock
      expect(exports).toContain('generateMockLandmarks');
      expect(exports).toContain('generateMockBodyAnalysisResult');
    });

    it('최소 25개 이상의 export가 존재한다', () => {
      const exports = Object.keys(BodyV2Module);
      expect(exports.length).toBeGreaterThanOrEqual(25);
    });

    it('내부 함수가 노출되지 않는다', () => {
      const exports = Object.keys(BodyV2Module);

      expect(exports).not.toContain('_internal');
      expect(exports).not.toContain('private');
    });
  });
});
