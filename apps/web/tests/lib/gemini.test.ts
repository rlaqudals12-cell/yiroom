/**
 * lib/gemini.ts 테스트
 * @description Gemini AI 분석 함수 및 Mock Fallback 로직 테스트
 *
 * 주의: gemini.ts는 API 키가 없거나 에러 발생 시 자동으로 Mock Fallback을 실행합니다.
 * 이 테스트에서는 Mock Fallback 동작을 검증합니다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeSkin,
  analyzeBody,
  analyzePersonalColor,
  analyzeWorkout,
  type WorkoutAnalysisInput,
} from '@/lib/gemini';

describe('lib/gemini.ts - Mock Fallback 검증', () => {
  const mockImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

  beforeEach(() => {
    // API 키가 없는 환경에서 테스트 (Mock Fallback 보장)
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  });

  describe('analyzeSkin - 피부 분석', () => {
    it('API 키가 없으면 Mock 데이터를 반환한다', async () => {
      // When: API 키 없이 피부 분석 실행
      const result = await analyzeSkin(mockImageBase64);

      // Then: Mock 데이터 반환 (기본 필드만 검증)
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.insight).toBeDefined();
      expect(result.recommendedIngredients).toBeDefined();
    });

    it('빈 이미지 문자열도 처리한다', async () => {
      // When
      const result = await analyzeSkin('');

      // Then: 에러 없이 처리됨
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('분석 결과에 필수 필드가 포함된다', async () => {
      // When
      const result = await analyzeSkin(mockImageBase64);

      // Then: 필수 필드 검증
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.metrics.length).toBeGreaterThan(0);
      expect(result.recommendedIngredients).toBeDefined();
    });
  });

  describe('analyzeBody - 체형 분석', () => {
    it('API 키가 없으면 Mock 데이터를 반환한다', async () => {
      // When: 체형 분석 실행
      const result = await analyzeBody(mockImageBase64);

      // Then: Mock 데이터 반환
      expect(result).toBeDefined();
      expect(result.bodyType).toMatch(/S|W|N/);
      expect(result.bodyTypeLabel).toBeDefined();
      expect(result.bodyTypeLabelEn).toBeDefined();
      expect(result.characteristics).toBeDefined();
    });

    it('분석 결과에 스타일 추천이 포함된다', async () => {
      // When
      const result = await analyzeBody(mockImageBase64);

      // Then
      expect(result.strengths).toBeDefined();
      expect(result.avoidStyles).toBeDefined();
      expect(result.styleRecommendations).toBeDefined();
      expect(result.insight).toBeDefined();
    });
  });

  describe('analyzePersonalColor - 퍼스널 컬러 분석', () => {
    it('API 키가 없으면 Mock 데이터를 반환한다', async () => {
      // When: 퍼스널 컬러 분석 실행
      const result = await analyzePersonalColor(mockImageBase64);

      // Then: Mock 데이터 반환
      expect(result).toBeDefined();
      expect(result.seasonType).toMatch(/spring|summer|autumn|winter/);
      expect(result.tone).toMatch(/warm|cool/);
      expect(result.depth).toMatch(/light|deep/);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('손목 이미지를 함께 전달할 수 있다', async () => {
      // Given
      const wristImage = 'data:image/jpeg;base64,wrist123';

      // When
      const result = await analyzePersonalColor(mockImageBase64, wristImage);

      // Then: 에러 없이 처리됨
      expect(result).toBeDefined();
      expect(result.seasonType).toBeDefined();
    });

    it('다각도 이미지 입력을 처리한다', async () => {
      // Given: 다각도 입력
      const multiAngleInput = {
        frontImageBase64: mockImageBase64,
        leftImageBase64: 'data:image/jpeg;base64,left123',
        rightImageBase64: 'data:image/jpeg;base64,right123',
      };

      // When
      const result = await analyzePersonalColor(multiAngleInput);

      // Then
      expect(result).toBeDefined();
      expect(result.seasonType).toBeDefined();
    });

    it('색상 추천이 포함된다', async () => {
      // When
      const result = await analyzePersonalColor(mockImageBase64);

      // Then
      expect(result.bestColors).toBeDefined();
      expect(result.worstColors).toBeDefined();
      expect(result.lipstickRecommendations).toBeDefined();
      expect(result.clothingRecommendations).toBeDefined();
    });
  });

  describe('analyzeWorkout - 운동 타입 분석', () => {
    const mockWorkoutInput: WorkoutAnalysisInput = {
      goals: ['weight_loss'],
      concerns: ['belly'],
      frequency: '3-4',
      location: 'home',
      equipment: ['dumbbell'],
      height: 170,
      currentWeight: 70,
      age: 30,
      gender: 'female',
    };

    it('API 키가 없으면 Mock 데이터를 반환한다', async () => {
      // When: 운동 분석 실행
      const result = await analyzeWorkout(mockWorkoutInput);

      // Then: Mock 데이터 반환
      expect(result).toBeDefined();
      expect(result.workoutType).toMatch(/toner|builder|burner|mover|flexer/);
      expect(result.workoutTypeLabel).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('운동 추천 및 조언이 포함된다', async () => {
      // When
      const result = await analyzeWorkout(mockWorkoutInput);

      // Then
      expect(result.reason).toBeDefined();
      expect(result.bodyTypeAdvice).toBeDefined();
      expect(result.goalAdvice).toBeDefined();
      expect(result.recommendedExercises).toBeDefined();
      expect(result.weeklyPlanSuggestion).toBeDefined();
    });

    it('체형 정보가 있으면 함께 처리한다', async () => {
      // Given: 체형 정보 포함
      const inputWithBodyType: WorkoutAnalysisInput = {
        ...mockWorkoutInput,
        bodyType: 'S',
        bodyProportions: {
          shoulder: 85,
          waist: 70,
          hip: 75,
        },
      };

      // When
      const result = await analyzeWorkout(inputWithBodyType);

      // Then: 에러 없이 처리됨
      expect(result).toBeDefined();
      expect(result.workoutType).toBeDefined();
    });

    it('부상 정보가 있으면 주의사항이 포함될 수 있다', async () => {
      // Given: 부상 정보 포함
      const inputWithInjuries: WorkoutAnalysisInput = {
        ...mockWorkoutInput,
        injuries: ['knee', 'shoulder'],
      };

      // When
      const result = await analyzeWorkout(inputWithInjuries);

      // Then
      expect(result).toBeDefined();
      // cautionAdvice는 선택적 필드
    });
  });

  describe('엣지 케이스', () => {
    it('analyzeSkin: 잘못된 MIME 타입도 처리한다', async () => {
      // When
      const result = await analyzeSkin('data:image/invalid;base64,abc123');

      // Then: 에러 없이 처리됨
      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('analyzeBody: data URL 형식이 아닌 문자열도 처리한다', async () => {
      // When
      const result = await analyzeBody('not-a-valid-image');

      // Then: 에러 없이 처리됨
      expect(result).toBeDefined();
      expect(result.bodyType).toBeDefined();
    });

    it('analyzePersonalColor: 빈 다각도 입력도 처리한다', async () => {
      // Given
      const emptyInput = {
        frontImageBase64: '',
      };

      // When
      const result = await analyzePersonalColor(emptyInput);

      // Then
      expect(result).toBeDefined();
      expect(result.seasonType).toBeDefined();
    });

    it('analyzeWorkout: 최소 입력만으로도 동작한다', async () => {
      // Given: 최소 필수 필드만
      const minimalInput: WorkoutAnalysisInput = {
        goals: ['weight_loss'],
        concerns: [],
        frequency: '3-4',
        location: 'home',
        equipment: [],
      };

      // When
      const result = await analyzeWorkout(minimalInput);

      // Then
      expect(result).toBeDefined();
      expect(result.workoutType).toBeDefined();
    });
  });

  describe('일관성 검증', () => {
    it('analyzeSkin: 동일한 입력에 대해 일관된 결과를 반환한다', async () => {
      // Given: 동일한 이미지
      const image = mockImageBase64;

      // When: 두 번 분석
      const result1 = await analyzeSkin(image);
      const result2 = await analyzeSkin(image);

      // Then: 결과가 일관됨 (기본 필드 검증)
      expect(result1.overallScore).toBeGreaterThan(0);
      expect(result2.overallScore).toBeGreaterThan(0);
      expect(result1.metrics.length).toBe(result2.metrics.length);
    });

    it('analyzeBody: 모든 체형 타입이 유효하다', async () => {
      // When
      const result = await analyzeBody(mockImageBase64);

      // Then: 유효한 체형 타입만 반환
      expect(['S', 'W', 'N']).toContain(result.bodyType);
      expect(result.bodyTypeLabel).toMatch(/스트레이트|웨이브|내추럴/);
      expect(result.keywords).toBeDefined();
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('analyzePersonalColor: 시즌과 톤이 일치한다', async () => {
      // When
      const result = await analyzePersonalColor(mockImageBase64);

      // Then: 시즌-톤 논리적 일치성
      if (result.seasonType === 'spring' || result.seasonType === 'autumn') {
        expect(result.tone).toBe('warm');
      } else {
        expect(result.tone).toBe('cool');
      }
    });
  });
});
