/**
 * W-2 스트레칭 루틴 생성 테스트
 *
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 * @see docs/principles/exercise-physiology.md
 */

import { describe, it, expect } from 'vitest';
import {
  generatePostureCorrectionPrescription,
  generateSportStretchingPrescription,
  generateGeneralFlexibilityPrescription,
  generateWeeklyStretchingPlan,
  generatePrescriptionSummary,
  generateWeeklyPlanSummary,
  mapPostureToStretches,
  getStretchesForSport,
  POSTURE_PROTOCOLS,
  STRETCH_DATABASE,
  ACSM_GUIDELINES,
} from '@/lib/workout/stretching';
import type {
  StretchingUserProfile,
  PostureAnalysisResult,
} from '@/lib/workout/stretching';

describe('W-2 Stretching Routine Generator', () => {
  // ==========================================================================
  // Test Data
  // ==========================================================================
  const mockUserProfile: StretchingUserProfile = {
    userId: 'user_123',
    age: 30,
    gender: 'male',
    fitnessLevel: 'intermediate',
    stretchingExperience: 'some',
    primarySports: ['running'],
    sportsFrequency: 'weekly',
    contraindications: [],
    specialConditions: [],
    availableEquipment: ['mat', 'foam_roller'],
    preferredSessionDuration: 20,
    preferredLanguage: 'ko',
  };

  const mockPostureAnalysis: PostureAnalysisResult = {
    assessmentId: 'assessment_123',
    createdAt: new Date().toISOString(),
    angles: {
      cva: 45,
      shoulderTilt: 5,
      thoracicKyphosis: 45,
      lumbarLordosis: 50,
      pelvicTilt: 10,
    },
    overallScore: 65,
    category: 'moderate',
    imbalances: [
      {
        type: 'upper_cross',
        severity: 'moderate',
        affectedAngles: ['cva', 'thoracicKyphosis'],
        description: '상부교차증후군 - 거북목과 라운드숄더',
      },
    ],
    tightMuscles: ['upper_trapezius', 'levator_scapulae', 'pectoralis_major'],
    weakMuscles: ['deep_neck_flexors', 'mid_lower_trapezius', 'serratus_anterior'],
  };

  // ==========================================================================
  // POSTURE_PROTOCOLS
  // ==========================================================================
  describe('POSTURE_PROTOCOLS', () => {
    it('should have protocols for common posture issues', () => {
      expect(POSTURE_PROTOCOLS.upper_cross).toBeDefined();
      expect(POSTURE_PROTOCOLS.lower_cross).toBeDefined();
    });

    it('should have tightMuscles and weakMuscles for each protocol', () => {
      const upperCross = POSTURE_PROTOCOLS.upper_cross;

      expect(upperCross.tightMuscles).toBeDefined();
      expect(upperCross.tightMuscles.length).toBeGreaterThan(0);
      expect(upperCross.weakMuscles).toBeDefined();
      expect(upperCross.weakMuscles.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // STRETCH_DATABASE
  // ==========================================================================
  describe('STRETCH_DATABASE', () => {
    it('should have multiple stretches', () => {
      expect(STRETCH_DATABASE.length).toBeGreaterThan(5);
    });

    it('should have required properties for each stretch', () => {
      STRETCH_DATABASE.forEach((stretch) => {
        expect(stretch.id).toBeDefined();
        expect(stretch.nameKo).toBeDefined();
        expect(stretch.targetMuscles).toBeDefined();
        expect(stretch.targetMuscles.length).toBeGreaterThan(0);
        expect(stretch.type).toBeDefined();
        expect(stretch.difficulty).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // ACSM_GUIDELINES
  // ==========================================================================
  describe('ACSM_GUIDELINES', () => {
    it('should have valid duration range', () => {
      expect(ACSM_GUIDELINES.minDuration).toBe(15);
      expect(ACSM_GUIDELINES.optimalDuration).toBe(30);
      expect(ACSM_GUIDELINES.maxDuration).toBe(60);
    });

    it('should have valid sets range', () => {
      expect(ACSM_GUIDELINES.minSets).toBe(2);
      expect(ACSM_GUIDELINES.optimalSets).toBe(3);
      expect(ACSM_GUIDELINES.maxSets).toBe(4);
    });
  });

  // ==========================================================================
  // mapPostureToStretches
  // ==========================================================================
  describe('mapPostureToStretches', () => {
    it('should return stretches for posture issues', () => {
      const result = mapPostureToStretches(mockPostureAnalysis);

      expect(result).toBeDefined();
      expect(result.stretches).toBeDefined();
      expect(result.imbalances).toBeDefined();
    });

    it('should return activations for weak muscles', () => {
      const result = mapPostureToStretches(mockPostureAnalysis);

      expect(result.activations).toBeDefined();
    });

    it('should return priority order', () => {
      const result = mapPostureToStretches(mockPostureAnalysis);

      expect(result.priorityOrder).toBeDefined();
    });
  });

  // ==========================================================================
  // getStretchesForSport
  // ==========================================================================
  describe('getStretchesForSport', () => {
    it('should return stretches for running warmup', () => {
      const stretches = getStretchesForSport('running', 'warmup');

      expect(stretches).toBeDefined();
      expect(Array.isArray(stretches)).toBe(true);
    });

    it('should return stretches for running cooldown', () => {
      const stretches = getStretchesForSport('running', 'cooldown');

      expect(stretches).toBeDefined();
      expect(Array.isArray(stretches)).toBe(true);
    });

    it('should return stretches for golf', () => {
      const warmup = getStretchesForSport('golf', 'warmup');
      const cooldown = getStretchesForSport('golf', 'cooldown');

      expect(warmup).toBeDefined();
      expect(cooldown).toBeDefined();
    });
  });

  // ==========================================================================
  // generatePostureCorrectionPrescription
  // ==========================================================================
  describe('generatePostureCorrectionPrescription', () => {
    it('should generate prescription for posture correction', () => {
      const prescription = generatePostureCorrectionPrescription(
        mockPostureAnalysis,
        mockUserProfile
      );

      expect(prescription).toBeDefined();
      expect(prescription.stretches).toBeDefined();
      expect(prescription.stretches.length).toBeGreaterThan(0);
      expect(prescription.totalDuration).toBeGreaterThan(0);
      expect(prescription.basedOn.purpose).toBe('posture_correction');
    });

    it('should include medical disclaimer', () => {
      const prescription = generatePostureCorrectionPrescription(
        mockPostureAnalysis,
        mockUserProfile
      );

      expect(prescription.medicalDisclaimer).toBeDefined();
      expect(prescription.medicalDisclaimer.length).toBeGreaterThan(0);
    });

    it('should respect time constraints', () => {
      const prescription = generatePostureCorrectionPrescription(
        mockPostureAnalysis,
        mockUserProfile,
        10 // 10분 제한
      );

      // 시간 제한에 맞춰 조정됨
      expect(prescription.totalDuration).toBeLessThanOrEqual(12);
    });

    it('should adjust difficulty based on fitness level', () => {
      const beginnerProfile: StretchingUserProfile = {
        ...mockUserProfile,
        fitnessLevel: 'beginner',
      };

      const prescription = generatePostureCorrectionPrescription(
        mockPostureAnalysis,
        beginnerProfile
      );

      // 초보자는 ACSM 최소-최대 범위 내 유지 시간
      prescription.stretches.forEach((s) => {
        if (s.exercise.durationUnit === 'seconds') {
          expect(s.adjustedDuration).toBeGreaterThanOrEqual(ACSM_GUIDELINES.minDuration);
          expect(s.adjustedDuration).toBeLessThanOrEqual(ACSM_GUIDELINES.maxDuration);
        }
      });
    });

    it('should exclude contraindicated exercises for special conditions', () => {
      const pregnantProfile: StretchingUserProfile = {
        ...mockUserProfile,
        specialConditions: ['pregnancy'],
      };

      const prescription = generatePostureCorrectionPrescription(
        mockPostureAnalysis,
        pregnantProfile
      );

      // 임산부 금지 운동 제외 확인
      const exerciseIds = prescription.stretches.map((s) => s.exercise.id);
      expect(exerciseIds).not.toContain('str_chest_floor');
    });

    it('should include warnings for severe imbalances', () => {
      const severeAnalysis: PostureAnalysisResult = {
        ...mockPostureAnalysis,
        imbalances: [
          {
            type: 'upper_cross',
            severity: 'severe',
            affectedAngles: ['cva', 'thoracicKyphosis'],
            description: '심한 상부교차증후군',
          },
        ],
      };

      const prescription = generatePostureCorrectionPrescription(
        severeAnalysis,
        mockUserProfile
      );

      expect(prescription.warnings.length).toBeGreaterThan(0);
      expect(prescription.warnings.some((w) => w.includes('심한'))).toBe(true);
    });
  });

  // ==========================================================================
  // generateSportStretchingPrescription
  // ==========================================================================
  describe('generateSportStretchingPrescription', () => {
    it('should generate sport-specific warmup', () => {
      const prescription = generateSportStretchingPrescription(
        'running',
        'warmup',
        mockUserProfile
      );

      expect(prescription).toBeDefined();
      expect(prescription.stretches).toBeDefined();
      expect(prescription.basedOn.purpose).toBe('warmup');
      expect(prescription.basedOn.sport).toBe('running');
    });

    it('should generate sport-specific cooldown', () => {
      const prescription = generateSportStretchingPrescription(
        'golf',
        'cooldown',
        mockUserProfile
      );

      expect(prescription).toBeDefined();
      expect(prescription.basedOn.purpose).toBe('cooldown');
      expect(prescription.basedOn.sport).toBe('golf');
    });

    it('should include medical disclaimer', () => {
      const prescription = generateSportStretchingPrescription(
        'running',
        'warmup',
        mockUserProfile
      );

      expect(prescription.medicalDisclaimer).toBeDefined();
    });
  });

  // ==========================================================================
  // generateGeneralFlexibilityPrescription
  // ==========================================================================
  describe('generateGeneralFlexibilityPrescription', () => {
    it('should generate general flexibility routine', () => {
      const prescription = generateGeneralFlexibilityPrescription(mockUserProfile);

      expect(prescription).toBeDefined();
      expect(prescription.stretches).toBeDefined();
      expect(prescription.basedOn.purpose).toBe('general');
    });

    it('should include frequency recommendation', () => {
      const prescription = generateGeneralFlexibilityPrescription(mockUserProfile);

      expect(prescription.frequency).toBeDefined();
      expect(prescription.frequency).toContain('주');
    });

    it('should include medical disclaimer', () => {
      const prescription = generateGeneralFlexibilityPrescription(mockUserProfile);

      expect(prescription.medicalDisclaimer).toBeDefined();
      expect(prescription.medicalDisclaimer.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // generateWeeklyStretchingPlan
  // ==========================================================================
  describe('generateWeeklyStretchingPlan', () => {
    it('should generate weekly plan with all days', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(mockUserProfile);

      expect(weeklyPlan).toBeDefined();
      expect(weeklyPlan.days).toBeDefined();
      expect(weeklyPlan.days.monday).toBeDefined();
      expect(weeklyPlan.days.tuesday).toBeDefined();
      expect(weeklyPlan.days.wednesday).toBeDefined();
      expect(weeklyPlan.days.thursday).toBeDefined();
      expect(weeklyPlan.days.friday).toBeDefined();
      expect(weeklyPlan.days.saturday).toBeDefined();
      expect(weeklyPlan.days.sunday).toBeDefined();
    });

    it('should include rest days', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(mockUserProfile);

      const dayTypes = Object.values(weeklyPlan.days).map((d) => d.type);
      expect(dayTypes).toContain('rest');
    });

    it('should include stretch days', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(mockUserProfile);

      const dayTypes = Object.values(weeklyPlan.days).map((d) => d.type);
      expect(dayTypes).toContain('stretch');
    });

    it('should generate plan with posture analysis', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(
        mockUserProfile,
        mockPostureAnalysis
      );

      expect(weeklyPlan).toBeDefined();
      expect(weeklyPlan.planId).toBeDefined();
      expect(weeklyPlan.userId).toBe(mockUserProfile.userId);
    });

    it('should generate plan with sport', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(
        mockUserProfile,
        undefined,
        'running'
      );

      expect(weeklyPlan).toBeDefined();
      expect(weeklyPlan.progressionWeek).toBe(1);
    });

    it('should have valid week start date', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(mockUserProfile);

      expect(weeklyPlan.weekStartDate).toBeDefined();
      expect(weeklyPlan.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ==========================================================================
  // Summary Functions
  // ==========================================================================
  describe('generatePrescriptionSummary', () => {
    it('should generate readable summary', () => {
      const prescription = generatePostureCorrectionPrescription(
        mockPostureAnalysis,
        mockUserProfile
      );

      const summary = generatePrescriptionSummary(prescription);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should include exercise count and duration', () => {
      const prescription = generatePostureCorrectionPrescription(
        mockPostureAnalysis,
        mockUserProfile
      );

      const summary = generatePrescriptionSummary(prescription);

      expect(summary).toContain('운동');
      expect(summary).toContain('분');
    });
  });

  describe('generateWeeklyPlanSummary', () => {
    it('should generate weekly plan summary', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(mockUserProfile);

      const summary = generateWeeklyPlanSummary(weeklyPlan);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should include day names in Korean', () => {
      const weeklyPlan = generateWeeklyStretchingPlan(mockUserProfile);

      const summary = generateWeeklyPlanSummary(weeklyPlan);

      expect(summary).toContain('월요일');
      expect(summary).toContain('일요일');
    });
  });
});
