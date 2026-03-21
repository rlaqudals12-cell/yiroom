/**
 * 온보딩 타입/유틸리티 테스트
 */

import {
  // 타입
  type OnboardingGoal,
  type ActivityLevel,
  type Gender,
  type WorkoutFrequency,
  type MealPreference,
  type OnboardingData,
  // 상수
  GOAL_LABELS,
  GOAL_ICONS,
  ACTIVITY_LEVEL_LABELS,
  GENDER_LABELS,
  WORKOUT_FREQUENCY_LABELS,
  MEAL_PREFERENCE_LABELS,
  DEFAULT_ONBOARDING_DATA,
  // 유틸리티 함수
  isOnboardingComplete,
  calculateBMI,
  getBMICategory,
  calculateAge,
} from '../../lib/onboarding/types';

describe('온보딩 타입', () => {
  describe('OnboardingGoal 타입', () => {
    it('목표 타입이 올바르게 정의됨', () => {
      const goals: OnboardingGoal[] = [
        'weight_loss',
        'muscle_gain',
        'health_maintenance',
        'stress_relief',
        'better_sleep',
      ];
      expect(goals).toHaveLength(5);
    });
  });

  describe('ActivityLevel 타입', () => {
    it('활동 레벨이 올바르게 정의됨', () => {
      const levels: ActivityLevel[] = [
        'sedentary',
        'light',
        'moderate',
        'active',
        'very_active',
      ];
      expect(levels).toHaveLength(5);
    });
  });

  describe('Gender 타입', () => {
    it('성별이 올바르게 정의됨', () => {
      const genders: Gender[] = ['male', 'female', 'neutral'];
      expect(genders).toHaveLength(3);
    });
  });

  describe('WorkoutFrequency 타입', () => {
    it('운동 빈도가 올바르게 정의됨', () => {
      const freqs: WorkoutFrequency[] = ['none', '1-2', '3-4', '5+'];
      expect(freqs).toHaveLength(4);
    });
  });

  describe('MealPreference 타입', () => {
    it('식사 선호도가 올바르게 정의됨', () => {
      const prefs: MealPreference[] = [
        'regular',
        'intermittent',
        'low_carb',
        'high_protein',
      ];
      expect(prefs).toHaveLength(4);
    });
  });
});

describe('온보딩 상수', () => {
  describe('GOAL_LABELS', () => {
    it('모든 목표에 대한 라벨이 있음', () => {
      expect(GOAL_LABELS.weight_loss).toBe('체중 감량');
      expect(GOAL_LABELS.muscle_gain).toBe('근육 증가');
      expect(GOAL_LABELS.health_maintenance).toBe('건강 유지');
      expect(GOAL_LABELS.stress_relief).toBe('스트레스 해소');
      expect(GOAL_LABELS.better_sleep).toBe('수면 개선');
    });
  });

  describe('GOAL_ICONS', () => {
    it('모든 목표에 대한 아이콘이 있음', () => {
      expect(GOAL_ICONS.weight_loss).toBe('⚖️');
      expect(GOAL_ICONS.muscle_gain).toBe('💪');
      expect(GOAL_ICONS.health_maintenance).toBe('❤️');
      expect(GOAL_ICONS.stress_relief).toBe('🧘');
      expect(GOAL_ICONS.better_sleep).toBe('😴');
    });
  });

  describe('ACTIVITY_LEVEL_LABELS', () => {
    it('모든 활동 레벨에 대한 라벨이 있음', () => {
      expect(ACTIVITY_LEVEL_LABELS.sedentary).toBe('거의 안함');
      expect(ACTIVITY_LEVEL_LABELS.light).toBe('가벼운 활동');
      expect(ACTIVITY_LEVEL_LABELS.moderate).toBe('보통');
      expect(ACTIVITY_LEVEL_LABELS.active).toBe('활발함');
      expect(ACTIVITY_LEVEL_LABELS.very_active).toBe('매우 활발함');
    });
  });

  describe('GENDER_LABELS', () => {
    it('모든 성별에 대한 라벨이 있음', () => {
      expect(GENDER_LABELS.male).toBe('남성');
      expect(GENDER_LABELS.female).toBe('여성');
      expect(GENDER_LABELS.neutral).toBe('선택 안 함');
    });
  });

  describe('WORKOUT_FREQUENCY_LABELS', () => {
    it('모든 운동 빈도에 대한 라벨이 있음', () => {
      expect(WORKOUT_FREQUENCY_LABELS.none).toBe('운동 안 함');
      expect(WORKOUT_FREQUENCY_LABELS['1-2']).toBe('주 1-2회');
      expect(WORKOUT_FREQUENCY_LABELS['3-4']).toBe('주 3-4회');
      expect(WORKOUT_FREQUENCY_LABELS['5+']).toBe('주 5회 이상');
    });
  });

  describe('MEAL_PREFERENCE_LABELS', () => {
    it('모든 식사 선호도에 대한 라벨이 있음', () => {
      expect(MEAL_PREFERENCE_LABELS.regular).toBe('규칙적인 식사');
      expect(MEAL_PREFERENCE_LABELS.intermittent).toBe('간헐적 단식');
      expect(MEAL_PREFERENCE_LABELS.low_carb).toBe('저탄수화물');
      expect(MEAL_PREFERENCE_LABELS.high_protein).toBe('고단백');
    });
  });

  describe('DEFAULT_ONBOARDING_DATA', () => {
    it('기본값이 올바르게 설정됨', () => {
      expect(DEFAULT_ONBOARDING_DATA.analysisInterests).toEqual([]);
      expect(DEFAULT_ONBOARDING_DATA.goals).toEqual([]);
      expect(DEFAULT_ONBOARDING_DATA.basicInfo).toEqual({});
      expect(DEFAULT_ONBOARDING_DATA.preferences).toEqual({});
    });
  });
});

describe('온보딩 유틸리티 함수', () => {
  describe('isOnboardingComplete', () => {
    it('관심 분석이 없으면 false', () => {
      const data: OnboardingData = {
        analysisInterests: [],
        goals: [],
        basicInfo: { gender: 'male', birthYear: 1990 },
        preferences: {},
      };
      expect(isOnboardingComplete(data)).toBe(false);
    });

    it('성별이 없으면 false', () => {
      const data: OnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: { birthYear: 1990 },
        preferences: {},
      };
      expect(isOnboardingComplete(data)).toBe(false);
    });

    it('출생년도가 없으면 false', () => {
      const data: OnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: { gender: 'male' },
        preferences: {},
      };
      expect(isOnboardingComplete(data)).toBe(false);
    });

    it('선호도가 없어도 true (Step 3은 선택 사항)', () => {
      const data: OnboardingData = {
        analysisInterests: ['skin'],
        goals: [],
        basicInfo: { gender: 'male', birthYear: 1990 },
        preferences: {},
      };
      expect(isOnboardingComplete(data)).toBe(true);
    });

    it('관심 분석 + 성별 + 출생년도만 있으면 true', () => {
      const data: OnboardingData = {
        analysisInterests: ['personal_color'],
        goals: [],
        basicInfo: { gender: 'male', birthYear: 1990 },
        preferences: {},
      };
      expect(isOnboardingComplete(data)).toBe(true);
    });

    it('관심 분석 여러 개 선택해도 true', () => {
      const data: OnboardingData = {
        analysisInterests: ['skin', 'body', 'hair'],
        goals: ['weight_loss'],
        basicInfo: { gender: 'female', birthYear: 1995 },
        preferences: { mealPreference: 'regular' },
      };
      expect(isOnboardingComplete(data)).toBe(true);
    });

    it('모든 필드가 있으면 true', () => {
      const data: OnboardingData = {
        analysisInterests: ['skin', 'personal_color'],
        goals: ['weight_loss', 'muscle_gain'],
        basicInfo: {
          gender: 'male',
          birthYear: 1990,
          height: 175,
          weight: 70,
          activityLevel: 'moderate',
        },
        preferences: {
          workoutFrequency: '3-4',
          mealPreference: 'high_protein',
          notificationsEnabled: true,
        },
        completedAt: '2024-01-01T00:00:00Z',
      };
      expect(isOnboardingComplete(data)).toBe(true);
    });
  });

  describe('calculateBMI', () => {
    it('BMI를 올바르게 계산함', () => {
      // 175cm, 70kg → BMI = 70 / (1.75)² = 22.86
      expect(calculateBMI(175, 70)).toBeCloseTo(22.9, 1);
    });

    it('저체중 BMI 계산', () => {
      // 170cm, 50kg → BMI = 50 / (1.7)² = 17.30
      expect(calculateBMI(170, 50)).toBeCloseTo(17.3, 1);
    });

    it('비만 BMI 계산', () => {
      // 160cm, 80kg → BMI = 80 / (1.6)² = 31.25 → 반올림 31.2
      expect(calculateBMI(160, 80)).toBeCloseTo(31.2, 1);
    });
  });

  describe('getBMICategory', () => {
    it('저체중 판정', () => {
      expect(getBMICategory(17)).toBe('저체중');
      expect(getBMICategory(18.4)).toBe('저체중');
    });

    it('정상 판정', () => {
      expect(getBMICategory(18.5)).toBe('정상');
      expect(getBMICategory(22)).toBe('정상');
      expect(getBMICategory(22.9)).toBe('정상');
    });

    it('과체중 판정', () => {
      expect(getBMICategory(23)).toBe('과체중');
      expect(getBMICategory(24)).toBe('과체중');
      expect(getBMICategory(24.9)).toBe('과체중');
    });

    it('비만 판정', () => {
      expect(getBMICategory(25)).toBe('비만');
      expect(getBMICategory(30)).toBe('비만');
      expect(getBMICategory(40)).toBe('비만');
    });
  });

  describe('calculateAge', () => {
    it('나이를 올바르게 계산함', () => {
      const currentYear = new Date().getFullYear();

      expect(calculateAge(currentYear - 30)).toBe(30);
      expect(calculateAge(currentYear - 25)).toBe(25);
      expect(calculateAge(1990)).toBe(currentYear - 1990);
    });

    it('올해 태어난 경우 0세', () => {
      const currentYear = new Date().getFullYear();
      expect(calculateAge(currentYear)).toBe(0);
    });
  });
});
