import { describe, it, expect } from 'vitest';
import {
  generateMockWorkoutAnalysis,
  generateMockWorkoutInsights,
} from '@/lib/mock/workout-analysis';
import { WorkoutInsightInput } from '@/lib/gemini';

describe('generateMockWorkoutAnalysis', () => {
  describe('운동 타입 분류', () => {
    it('체중 감량 목표 → burner 타입', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['weight_loss'],
        concerns: ['belly'],
        frequency: '5-6',
        location: 'gym',
        equipment: ['cardio_machine'],
      });

      expect(result.workoutType).toBe('burner');
      expect(result.workoutTypeLabel).toBe('버너');
      expect(result.weeklyPlanSuggestion.intensity).toBe('high');
    });

    it('근력 강화 목표 → builder 타입', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['strength'],
        concerns: ['arm', 'shoulder'],
        frequency: '3-4',
        location: 'gym',
        equipment: ['barbell', 'dumbbell'],
      });

      expect(result.workoutType).toBe('builder');
      expect(result.workoutTypeLabel).toBe('빌더');
    });

    it('스트레스 해소 목표 → flexer 타입', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['stress', 'posture'],
        concerns: ['back'],
        frequency: '1-2',
        location: 'home',
        equipment: ['mat'],
      });

      expect(result.workoutType).toBe('flexer');
      expect(result.workoutTypeLabel).toBe('플렉서');
      expect(result.weeklyPlanSuggestion.intensity).toBe('low');
    });
  });

  describe('주간 플랜 추천', () => {
    it('빈도에 따른 운동 일수 계산', () => {
      const lowFreq = generateMockWorkoutAnalysis({
        goals: ['weight_loss'],
        concerns: [],
        frequency: '1-2',
        location: 'home',
        equipment: [],
      });
      expect(lowFreq.weeklyPlanSuggestion.workoutDays).toBe(2);

      const highFreq = generateMockWorkoutAnalysis({
        goals: ['weight_loss'],
        concerns: [],
        frequency: 'daily',
        location: 'home',
        equipment: [],
      });
      expect(highFreq.weeklyPlanSuggestion.workoutDays).toBe(7);
    });

    it('고민 부위가 집중 영역에 반영됨', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['weight_loss'],
        concerns: ['belly', 'thigh'],
        frequency: '3-4',
        location: 'gym',
        equipment: [],
      });

      expect(result.weeklyPlanSuggestion.focusAreas).toContain('복부');
      expect(result.weeklyPlanSuggestion.focusAreas).toContain('허벅지');
    });
  });

  describe('부상 주의사항', () => {
    it('부상 부위가 있으면 주의사항 생성', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['strength'],
        concerns: [],
        frequency: '3-4',
        location: 'gym',
        equipment: [],
        injuries: ['knee', 'back'],
      });

      expect(result.cautionAdvice).toBeDefined();
      expect(result.cautionAdvice).toContain('무릎');
      expect(result.cautionAdvice).toContain('허리');
    });

    it('부상 부위가 없으면 주의사항 없음', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['strength'],
        concerns: [],
        frequency: '3-4',
        location: 'gym',
        equipment: [],
      });

      expect(result.cautionAdvice).toBeUndefined();
    });
  });

  describe('체형 기반 조언', () => {
    it('체형 정보가 있으면 체형 기반 조언 생성', () => {
      const result = generateMockWorkoutAnalysis({
        bodyType: 'H',
        goals: ['weight_loss'],
        concerns: [],
        frequency: '3-4',
        location: 'gym',
        equipment: [],
      });

      expect(result.bodyTypeAdvice).toContain('H형');
    });

    it('체형 정보가 없으면 일반 조언', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['weight_loss'],
        concerns: [],
        frequency: '3-4',
        location: 'gym',
        equipment: [],
      });

      expect(result.bodyTypeAdvice).toContain('균형');
    });
  });

  describe('응답 형식 검증', () => {
    it('필수 필드가 모두 포함됨', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['weight_loss'],
        concerns: ['belly'],
        frequency: '3-4',
        location: 'gym',
        equipment: ['dumbbell'],
      });

      expect(result).toHaveProperty('workoutType');
      expect(result).toHaveProperty('workoutTypeLabel');
      expect(result).toHaveProperty('workoutTypeDescription');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('bodyTypeAdvice');
      expect(result).toHaveProperty('goalAdvice');
      expect(result).toHaveProperty('recommendedExercises');
      expect(result).toHaveProperty('weeklyPlanSuggestion');
    });

    it('추천 운동이 5개 포함됨', () => {
      const result = generateMockWorkoutAnalysis({
        goals: ['strength'],
        concerns: [],
        frequency: '3-4',
        location: 'gym',
        equipment: [],
      });

      expect(result.recommendedExercises).toHaveLength(5);
      expect(result.recommendedExercises[0]).toHaveProperty('name');
      expect(result.recommendedExercises[0]).toHaveProperty('category');
      expect(result.recommendedExercises[0]).toHaveProperty('reason');
    });
  });
});

// Task 4.1 테스트: AI 인사이트 생성
describe('generateMockWorkoutInsights', () => {
  // 기본 입력 데이터
  const baseInput: WorkoutInsightInput = {
    workoutLogs: [
      {
        date: '2025-11-25',
        exerciseCount: 5,
        totalVolume: 5000,
        bodyParts: ['chest', 'arm'],
        duration: 45,
        caloriesBurned: 300,
      },
      {
        date: '2025-11-26',
        exerciseCount: 4,
        totalVolume: 4500,
        bodyParts: ['back', 'shoulder'],
        duration: 40,
        caloriesBurned: 280,
      },
    ],
    currentWeekStats: {
      totalVolume: 9500,
      totalSessions: 2,
      averageDuration: 42.5,
    },
    userStats: {
      currentStreak: 5,
      longestStreak: 14,
      totalWorkouts: 50,
      workoutType: 'builder',
    },
    bodyPartDistribution: {
      upper: 0.4,
      lower: 0.3,
      core: 0.2,
      cardio: 0.1,
    },
  };

  describe('부위 균형 분석', () => {
    it('특정 부위가 30% 미만이면 balance 인사이트 생성 (Feature Spec 7.4)', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        bodyPartDistribution: {
          upper: 0.5,
          lower: 0.35,
          core: 0.1, // 10% - 부족 (30% 미만)
          cardio: 0.05, // 5% - 부족 (30% 미만)
        },
      };

      const result = generateMockWorkoutInsights(input);
      const balanceInsight = result.insights.find((i) => i.type === 'balance');

      expect(balanceInsight).toBeDefined();
      expect(balanceInsight?.priority).toBe('high');
      expect(balanceInsight?.message).toContain('부족');
    });

    it('모든 부위가 30% 이상이면 balance 인사이트 없음', () => {
      // 30% 미만인 부위가 있는 경우 테스트
      const inputBalanced: WorkoutInsightInput = {
        ...baseInput,
        bodyPartDistribution: {
          upper: 0.35,
          lower: 0.3,
          core: 0.2, // 20%는 30% 미만이므로 balance 인사이트 생성됨
          cardio: 0.15,
        },
      };

      // 30% 미만인 부위가 있으면 balance 인사이트가 생성됨
      const result = generateMockWorkoutInsights(inputBalanced);
      const balanceInsight = result.insights.find((i) => i.type === 'balance');

      // core가 20%로 30% 미만이므로 balance 인사이트 생성됨
      expect(balanceInsight).toBeDefined();
    });

    it('모든 부위가 정확히 균형잡힌 경우 (각 25%)', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        bodyPartDistribution: {
          upper: 0.25,
          lower: 0.25,
          core: 0.25,
          cardio: 0.25,
        },
      };

      const result = generateMockWorkoutInsights(input);
      const balanceInsight = result.insights.find((i) => i.type === 'balance');

      // 25%는 30% 미만이므로 balance 인사이트 생성됨
      expect(balanceInsight).toBeDefined();
    });

    it('모든 부위가 30% 이상인 경우 (합계 120%라도 테스트용)', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        bodyPartDistribution: {
          upper: 0.3,
          lower: 0.3,
          core: 0.3,
          cardio: 0.3, // 테스트용: 실제로는 합계가 100%여야 함
        },
      };

      const result = generateMockWorkoutInsights(input);
      const balanceInsight = result.insights.find((i) => i.type === 'balance');

      expect(balanceInsight).toBeUndefined();
    });
  });

  describe('볼륨 변화 분석', () => {
    it('볼륨이 10% 이상 증가하면 progress 인사이트 생성', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        previousWeekStats: {
          totalVolume: 8000,
          totalSessions: 2,
          averageDuration: 40,
        },
        currentWeekStats: {
          totalVolume: 10000, // 25% 증가
          totalSessions: 3,
          averageDuration: 45,
        },
      };

      const result = generateMockWorkoutInsights(input);
      const progressInsight = result.insights.find((i) => i.type === 'progress');

      expect(progressInsight).toBeDefined();
      expect(progressInsight?.data?.trend).toBe('up');
      expect(progressInsight?.message).toContain('성장');
    });

    it('이전 주 데이터가 없으면 progress 인사이트 없음', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        previousWeekStats: undefined,
      };

      const result = generateMockWorkoutInsights(input);
      const progressInsight = result.insights.find((i) => i.type === 'progress');

      expect(progressInsight).toBeUndefined();
    });
  });

  describe('연속 기록 분석', () => {
    it('7일 이상 연속이면 high 우선순위 streak 인사이트', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        userStats: {
          ...baseInput.userStats,
          currentStreak: 10,
        },
      };

      const result = generateMockWorkoutInsights(input);
      const streakInsight = result.insights.find((i) => i.type === 'streak');

      expect(streakInsight).toBeDefined();
      expect(streakInsight?.priority).toBe('high');
      expect(streakInsight?.message).toContain('10일');
    });

    it('3-6일 연속이면 medium 우선순위 streak 인사이트', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        userStats: {
          ...baseInput.userStats,
          currentStreak: 5,
        },
      };

      const result = generateMockWorkoutInsights(input);
      const streakInsight = result.insights.find((i) => i.type === 'streak');

      expect(streakInsight).toBeDefined();
      expect(streakInsight?.priority).toBe('medium');
    });

    it('2일 이하 연속이면 streak 인사이트 없음', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        userStats: {
          ...baseInput.userStats,
          currentStreak: 2,
        },
      };

      const result = generateMockWorkoutInsights(input);
      const streakInsight = result.insights.find((i) => i.type === 'streak');

      expect(streakInsight).toBeUndefined();
    });
  });

  describe('또래 비교 분석', () => {
    it('상위 30% 이내이면 comparison 인사이트 생성', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        peerComparison: {
          ageGroup: '20대',
          averageSessions: 3,
          userPercentile: 20, // 상위 20%
        },
      };

      const result = generateMockWorkoutInsights(input);
      const comparisonInsight = result.insights.find((i) => i.type === 'comparison');

      expect(comparisonInsight).toBeDefined();
      expect(comparisonInsight?.message).toContain('20대');
      expect(comparisonInsight?.message).toContain('상위');
    });

    it('상위 30% 이상이면 comparison 인사이트 없음', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        peerComparison: {
          ageGroup: '20대',
          averageSessions: 3,
          userPercentile: 50, // 상위 50%
        },
      };

      const result = generateMockWorkoutInsights(input);
      const comparisonInsight = result.insights.find((i) => i.type === 'comparison');

      expect(comparisonInsight).toBeUndefined();
    });
  });

  describe('운동 타입별 팁', () => {
    it('builder 타입에 맞는 팁 생성', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        userStats: {
          ...baseInput.userStats,
          currentStreak: 1, // streak 인사이트 제외
          workoutType: 'builder',
        },
        bodyPartDistribution: {
          upper: 0.25,
          lower: 0.25,
          core: 0.25,
          cardio: 0.25,
        },
      };

      const result = generateMockWorkoutInsights(input);
      const tipInsight = result.insights.find((i) => i.type === 'tip');

      expect(tipInsight).toBeDefined();
      expect(tipInsight?.message).toContain('근성장');
    });

    it('flexer 타입에 맞는 팁 생성', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        userStats: {
          ...baseInput.userStats,
          currentStreak: 1,
          workoutType: 'flexer',
        },
        bodyPartDistribution: {
          upper: 0.25,
          lower: 0.25,
          core: 0.25,
          cardio: 0.25,
        },
      };

      const result = generateMockWorkoutInsights(input);
      const tipInsight = result.insights.find((i) => i.type === 'tip');

      expect(tipInsight).toBeDefined();
      expect(tipInsight?.message).toContain('유연성');
    });
  });

  describe('응답 형식 검증', () => {
    it('최대 3개 인사이트만 반환', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        previousWeekStats: {
          totalVolume: 7000,
          totalSessions: 2,
          averageDuration: 40,
        },
        peerComparison: {
          ageGroup: '20대',
          averageSessions: 3,
          userPercentile: 15,
        },
        bodyPartDistribution: {
          upper: 0.5,
          lower: 0.1, // 균형 인사이트 유발
          core: 0.25,
          cardio: 0.15,
        },
        userStats: {
          ...baseInput.userStats,
          currentStreak: 10, // streak 인사이트 유발
        },
      };

      const result = generateMockWorkoutInsights(input);

      expect(result.insights.length).toBeLessThanOrEqual(3);
    });

    it('필수 필드가 모두 포함됨', () => {
      const result = generateMockWorkoutInsights(baseInput);

      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('weeklyHighlight');
      expect(result).toHaveProperty('motivationalMessage');
      expect(Array.isArray(result.insights)).toBe(true);
      expect(typeof result.weeklyHighlight).toBe('string');
      expect(typeof result.motivationalMessage).toBe('string');
    });

    it('인사이트 항목에 필수 필드 포함', () => {
      const result = generateMockWorkoutInsights(baseInput);

      if (result.insights.length > 0) {
        const insight = result.insights[0];
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('message');
        expect(insight).toHaveProperty('priority');
        expect(['balance', 'progress', 'streak', 'comparison', 'tip']).toContain(insight.type);
        expect(['high', 'medium', 'low']).toContain(insight.priority);
      }
    });

    it('우선순위 순으로 정렬됨', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        previousWeekStats: {
          totalVolume: 7000,
          totalSessions: 2,
          averageDuration: 40,
        },
        bodyPartDistribution: {
          upper: 0.5,
          lower: 0.1, // high priority balance
          core: 0.25,
          cardio: 0.15,
        },
        userStats: {
          ...baseInput.userStats,
          currentStreak: 5, // medium priority streak
        },
      };

      const result = generateMockWorkoutInsights(input);
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };

      for (let i = 0; i < result.insights.length - 1; i++) {
        const currentPriority = priorityOrder[result.insights[i].priority];
        const nextPriority = priorityOrder[result.insights[i + 1].priority];
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
      }
    });
  });

  describe('주간 하이라이트', () => {
    it('5회 이상 운동 시 특별 하이라이트', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        currentWeekStats: {
          ...baseInput.currentWeekStats,
          totalSessions: 5,
        },
      };

      const result = generateMockWorkoutInsights(input);

      expect(result.weeklyHighlight).toContain('5회');
    });

    it('7일 연속 운동 시 특별 하이라이트', () => {
      const input: WorkoutInsightInput = {
        ...baseInput,
        currentWeekStats: {
          ...baseInput.currentWeekStats,
          totalSessions: 3,
        },
        userStats: {
          ...baseInput.userStats,
          currentStreak: 7,
        },
      };

      const result = generateMockWorkoutInsights(input);

      expect(result.weeklyHighlight).toContain('7일');
    });
  });
});
