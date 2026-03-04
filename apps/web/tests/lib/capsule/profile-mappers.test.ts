/**
 * BeautyProfile 매퍼 테스트
 *
 * @module tests/lib/capsule/profile-mappers
 * @description 9개 분석 모듈 DB row → BeautyProfile 필드 변환 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  mapPCAssessment,
  mapSkinAssessment,
  mapBodyAssessment,
  mapPostureToWorkout,
  mapNutritionSettings,
  mapHairAssessment,
  mapMakeupAnalysis,
  mapOralHealthAssessment,
  mapFashionFromBodyAndInventory,
} from '@/lib/capsule/profile-mappers';

// =============================================================================
// PC: 퍼스널컬러 매퍼
// =============================================================================

describe('mapPCAssessment', () => {
  it('should extract season, subType, palette from PC assessment', () => {
    const row = {
      season: 'spring',
      undertone: 'warm',
      image_analysis: { tone: 'light' },
      best_colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
    };

    const result = mapPCAssessment(row);

    expect(result.season).toBe('spring');
    expect(result.subType).toBe('light');
    expect(result.palette).toEqual(['#FF6B6B', '#4ECDC4', '#FFE66D']);
  });

  it('should fallback to undertone when image_analysis.tone is missing', () => {
    const row = {
      season: 'autumn',
      undertone: 'warm',
      image_analysis: null,
      best_colors: null,
    };

    const result = mapPCAssessment(row);

    expect(result.season).toBe('autumn');
    expect(result.subType).toBe('warm');
    expect(result.palette).toEqual([]);
  });

  it('should handle empty row gracefully', () => {
    const result = mapPCAssessment({});

    expect(result.season).toBe('');
    expect(result.subType).toBe('');
    expect(result.palette).toEqual([]);
  });
});

// =============================================================================
// S: 피부 분석 매퍼
// =============================================================================

describe('mapSkinAssessment', () => {
  it('should extract skin type, concerns, scores', () => {
    const row = {
      skin_type: 'combination',
      concerns: ['acne', 'dryness'],
      scores: { scoreBreakdown: { hydration: 65, oiliness: 40 } },
    };

    const result = mapSkinAssessment(row);

    expect(result.type).toBe('combination');
    expect(result.concerns).toEqual(['acne', 'dryness']);
    expect(result.scores).toEqual({ hydration: 65, oiliness: 40 });
  });

  it('should handle null scores and concerns', () => {
    const row = {
      skin_type: 'oily',
      concerns: null,
      scores: null,
    };

    const result = mapSkinAssessment(row);

    expect(result.type).toBe('oily');
    expect(result.concerns).toEqual([]);
    expect(result.scores).toEqual({});
  });

  it('should handle missing scoreBreakdown', () => {
    const row = {
      skin_type: 'normal',
      scores: { overallScore: 80 },
    };

    const result = mapSkinAssessment(row);

    expect(result.scores).toEqual({});
  });
});

// =============================================================================
// C: 체형 분석 매퍼
// =============================================================================

describe('mapBodyAssessment', () => {
  it('should extract body shape and key ratios', () => {
    const row = {
      body_shape: 'hourglass',
      analysis_data: {
        ratios: {
          shoulderToWaistRatio: 1.35,
          waistToHipRatio: 0.75,
          upperToLowerRatio: 0.95,
          armLength: 55,
        },
      },
    };

    const result = mapBodyAssessment(row);

    expect(result.shape).toBe('hourglass');
    // 핵심 비율 3개만 추출
    expect(result.measurements.shoulderToWaistRatio).toBe(1.35);
    expect(result.measurements.waistToHipRatio).toBe(0.75);
    expect(result.measurements.upperToLowerRatio).toBe(0.95);
    // armLength 같은 추가 비율은 포함되지 않음
    expect(result.measurements.armLength).toBeUndefined();
  });

  it('should fallback to body_type when body_shape missing', () => {
    const row = { body_type: 'N', analysis_data: null };

    const result = mapBodyAssessment(row);

    expect(result.shape).toBe('N');
    expect(result.measurements).toEqual({});
  });

  it('should handle empty row', () => {
    const result = mapBodyAssessment({});

    expect(result.shape).toBe('');
    expect(result.measurements).toEqual({});
  });
});

// =============================================================================
// W: 운동 프로필 매퍼 (자세→운동)
// =============================================================================

describe('mapPostureToWorkout', () => {
  it('should derive goals from posture type and concerns', () => {
    const row = {
      posture_type: 'forward-head',
      concerns: ['거북목', '어깨 비대칭', '골반 틀어짐'],
    };

    const result = mapPostureToWorkout(row);

    expect(result.fitnessLevel).toBe('beginner');
    expect(result.goals).toContain('자세 교정: forward-head');
    expect(result.goals).toContain('거북목');
    expect(result.history).toEqual([]);
  });

  it('should set advanced level with 30+ exercise logs', () => {
    const logs = Array.from({ length: 35 }, (_, i) => ({ id: String(i) }));

    const result = mapPostureToWorkout(null, logs);

    expect(result.fitnessLevel).toBe('advanced');
    expect(result.goals).toEqual([]);
  });

  it('should set intermediate level with 10-29 logs', () => {
    const logs = Array.from({ length: 15 }, (_, i) => ({ id: String(i) }));

    const result = mapPostureToWorkout(null, logs);

    expect(result.fitnessLevel).toBe('intermediate');
  });

  it('should handle null posture row', () => {
    const result = mapPostureToWorkout(null);

    expect(result.fitnessLevel).toBe('beginner');
    expect(result.goals).toEqual([]);
  });

  it('should limit concerns to 3', () => {
    const row = {
      posture_type: '',
      concerns: ['a', 'b', 'c', 'd', 'e'],
    };

    const result = mapPostureToWorkout(row);

    // goals에 concerns.slice(0,3)만 포함
    expect(result.goals.length).toBeLessThanOrEqual(3);
  });
});

// =============================================================================
// N: 영양 프로필 매퍼
// =============================================================================

describe('mapNutritionSettings', () => {
  it('should extract diet type and allergies', () => {
    const row = {
      goal: 'weight_loss',
      meal_style: 'balanced',
      allergies: ['dairy', 'gluten'],
    };

    const result = mapNutritionSettings(row);

    expect(result.dietType).toBe('balanced');
    expect(result.allergies).toEqual(['dairy', 'gluten']);
    expect(result.deficiencies).toEqual([]);
  });

  it('should fallback to goal when meal_style is empty', () => {
    const row = { goal: 'muscle_gain', meal_style: '', allergies: null };

    const result = mapNutritionSettings(row);

    expect(result.dietType).toBe('muscle_gain');
    expect(result.allergies).toEqual([]);
  });

  it('should handle empty row', () => {
    const result = mapNutritionSettings({});

    expect(result.dietType).toBe('');
    expect(result.allergies).toEqual([]);
  });
});

// =============================================================================
// H: 헤어 분석 매퍼
// =============================================================================

describe('mapHairAssessment', () => {
  it('should extract hair type, scalp, and concerns from care tips', () => {
    const row = {
      analysis_data: {
        currentHairInfo: {
          texture: 'wavy',
          scalpCondition: 'oily',
        },
      },
      care_tips: [
        { category: '수분 관리', tip: '수분 에센스' },
        { category: '두피 관리', tip: '두피 스케일링' },
      ],
    };

    const result = mapHairAssessment(row);

    expect(result.type).toBe('wavy');
    expect(result.scalp).toBe('oily');
    expect(result.concerns).toContain('수분 관리');
    expect(result.concerns).toContain('두피 관리');
  });

  it('should fallback to length when texture is missing', () => {
    const row = {
      analysis_data: {
        currentHairInfo: {
          length: 'medium',
        },
      },
    };

    const result = mapHairAssessment(row);

    expect(result.type).toBe('medium');
  });

  it('should handle missing analysis_data', () => {
    const result = mapHairAssessment({});

    expect(result.type).toBe('');
    expect(result.scalp).toBe('');
    expect(result.concerns).toEqual([]);
  });
});

// =============================================================================
// M: 메이크업 분석 매퍼
// =============================================================================

describe('mapMakeupAnalysis', () => {
  it('should extract preferences and skill level', () => {
    const row = {
      undertone: 'warm',
      face_shape: 'oval',
      eye_shape: 'almond',
      lip_shape: 'full',
      overall_score: 85,
      recommendations: { styles: ['natural', 'glam'] },
    };

    const result = mapMakeupAnalysis(row);

    expect(result.preferences.undertone).toBe('warm');
    expect(result.preferences.faceShape).toBe('oval');
    expect(result.preferences.eyeShape).toBe('almond');
    expect(result.preferences.lipShape).toBe('full');
    expect(result.preferences.preferredStyle).toBe('natural');
    expect(result.skillLevel).toBe('advanced'); // score 85 >= 80
  });

  it('should set intermediate for score 60-79', () => {
    const row = { overall_score: 65, recommendations: null };

    const result = mapMakeupAnalysis(row);

    expect(result.skillLevel).toBe('intermediate');
  });

  it('should set beginner for score < 60', () => {
    const row = { overall_score: 45, recommendations: null };

    const result = mapMakeupAnalysis(row);

    expect(result.skillLevel).toBe('beginner');
  });

  it('should handle empty row', () => {
    const result = mapMakeupAnalysis({});

    expect(result.preferences).toEqual({});
    expect(result.skillLevel).toBe('beginner');
  });
});

// =============================================================================
// OH: 구강건강 매퍼
// =============================================================================

describe('mapOralHealthAssessment', () => {
  it('should extract conditions and goals', () => {
    const row = {
      gum_health: { healthStatus: '양호', needsDentalVisit: true },
      whitening_goal: { targetShade: 'A2' },
      recommendations: ['정기 검진', '미백 제품 사용'],
    };

    const result = mapOralHealthAssessment(row);

    expect(result.conditions).toContain('양호');
    expect(result.conditions).toContain('치과 방문 권장');
    expect(result.goals).toContain('미백 목표: A2');
    expect(result.goals).toContain('정기 검진');
  });

  it('should handle null gum_health and whitening_goal', () => {
    const row = {
      gum_health: null,
      whitening_goal: null,
      recommendations: null,
    };

    const result = mapOralHealthAssessment(row);

    expect(result.conditions).toEqual([]);
    expect(result.goals).toEqual([]);
  });

  it('should handle empty row', () => {
    const result = mapOralHealthAssessment({});

    expect(result.conditions).toEqual([]);
    expect(result.goals).toEqual([]);
  });
});

// =============================================================================
// Fashion: 패션 프로필 매퍼
// =============================================================================

describe('mapFashionFromBodyAndInventory', () => {
  it('should derive style from body analysis and inventory', () => {
    const bodyRow = {
      body_shape: 'hourglass',
      styling_recommendations: {
        silhouettes: ['핏앤플레어', 'A라인'],
        avoid: ['박시'],
      },
    };
    const inventory = ['top', 'bottom', 'outerwear'];

    const result = mapFashionFromBodyAndInventory(bodyRow, inventory);

    expect(result.style).toBe('핏앤플레어');
    expect(result.sizeProfile.bodyShape).toBe('hourglass');
    expect(result.wardrobe).toEqual(['top', 'bottom', 'outerwear']);
  });

  it('should handle null body row', () => {
    const result = mapFashionFromBodyAndInventory(null);

    expect(result.style).toBe('');
    expect(result.sizeProfile).toEqual({});
    expect(result.wardrobe).toEqual([]);
  });

  it('should handle empty styling_recommendations', () => {
    const bodyRow = { body_shape: 'rectangle', styling_recommendations: null };

    const result = mapFashionFromBodyAndInventory(bodyRow);

    expect(result.style).toBe('');
    expect(result.sizeProfile.bodyShape).toBe('rectangle');
  });
});
