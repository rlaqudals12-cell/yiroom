/**
 * 운동 전용 RAG 테스트
 * @description Phase K - 사용자 운동 계획/기록 기반 맞춤 운동 추천 RAG 시스템 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'workout_plans') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: '1',
                      exercises: [
                        { name: '스쿼트', category: 'strength', sets: 3, reps: 10 },
                        { name: '런닝', category: 'cardio', sets: 1, reps: 1 },
                      ],
                      frequency: 3,
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          })),
        };
      }
      if (table === 'workout_logs') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      exercise_name: '스쿼트',
                      completed_at: new Date().toISOString(),
                      duration_minutes: 30,
                    },
                    {
                      exercise_name: '플랭크',
                      completed_at: new Date().toISOString(),
                      duration_minutes: 15,
                    },
                  ],
                  error: null,
                }),
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
      };
    }),
  })),
}));

// 로거 모킹
vi.mock('@/lib/utils/logger', () => ({
  coachLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// 모듈 임포트는 모킹 후에
import { searchWorkoutItems, formatWorkoutForPrompt } from '@/lib/coach/workout-rag';
import type { UserContext } from '@/lib/coach/types';

describe('Workout RAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchWorkoutItems', () => {
    it('사용자 컨텍스트 없이 기본 검색한다', async () => {
      const result = await searchWorkoutItems(null, '오늘 운동 뭐하지?');

      expect(result).toBeDefined();
      expect(result.goalTips.length).toBeGreaterThan(0);
    });

    it('근력 관련 질문에 근력 팁을 제공한다', async () => {
      const result = await searchWorkoutItems(null, '웨이트 운동 추천해줘');

      expect(result).toBeDefined();
      expect(result.goalTips).toBeDefined();
      const hasStrengthTip = result.goalTips.some(
        (tip) => tip.includes('근력') || tip.includes('세트')
      );
      expect(hasStrengthTip).toBe(true);
    });

    it('유산소 관련 질문에 유산소 팁을 제공한다', async () => {
      const result = await searchWorkoutItems(null, '유산소 운동 추천해줘');

      expect(result).toBeDefined();
      const hasCardioTip = result.goalTips.some(
        (tip) => tip.includes('심박수') || tip.includes('수분')
      );
      expect(hasCardioTip).toBe(true);
    });

    it('스트레칭 관련 질문에 유연성 팁을 제공한다', async () => {
      const result = await searchWorkoutItems(null, '스트레칭 방법 알려줘');

      expect(result).toBeDefined();
      const hasFlexTip = result.goalTips.some(
        (tip) => tip.includes('스트레칭') || tip.includes('유지')
      );
      expect(hasFlexTip).toBe(true);
    });

    it('홈트 관련 질문에 장비 없는 운동을 추천한다', async () => {
      const result = await searchWorkoutItems(null, '집에서 할 수 있는 운동');

      expect(result).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      const hasHomeTip = result.goalTips.some(
        (tip) => tip.includes('집') || tip.includes('맨몸') || tip.includes('매트')
      );
      expect(hasHomeTip).toBe(true);
    });

    it('다이어트 관련 질문에 체중 감량 팁을 제공한다', async () => {
      const result = await searchWorkoutItems(null, '살빼기 좋은 운동 알려줘');

      expect(result).toBeDefined();
      const hasDietTip = result.goalTips.some(
        (tip) => tip.includes('유산소') || tip.includes('HIIT') || tip.includes('칼로리')
      );
      expect(hasDietTip).toBe(true);
    });

    it('userId가 있으면 운동 계획을 조회한다', async () => {
      const result = await searchWorkoutItems(null, '오늘 운동', 'user-123');

      expect(result).toBeDefined();
      expect(result.hasWorkoutPlan).toBe(true);
      expect(result.todayWorkout).not.toBeNull();
    });

    it('최근 운동 진행 상황을 표시한다', async () => {
      const result = await searchWorkoutItems(null, '운동 기록', 'user-123');

      expect(result).toBeDefined();
      expect(result.recentProgress).not.toBeNull();
      expect(result.recentProgress).toContain('최근 운동');
    });

    it('사용자 피트니스 레벨에 맞는 운동을 추천한다', async () => {
      const userContext: UserContext = {
        workout: { fitnessLevel: 'beginner' },
      };

      const result = await searchWorkoutItems(userContext, '운동 추천', 'user-123');

      expect(result).toBeDefined();
      if (result.recommendations.length > 0) {
        // 초보자에게 적합한 운동이 높은 점수를 가져야 함
        const topRec = result.recommendations[0];
        expect(topRec.matchReason).toContain('초보자');
      }
    });

    it('운동 목표가 컨텍스트에 있으면 활용한다', async () => {
      const userContext: UserContext = {
        workout: { goal: 'muscle_gain' },
      };

      const result = await searchWorkoutItems(userContext, '오늘 뭐 하지?', 'user-123');

      expect(result).toBeDefined();
      // 근육 증가 관련 팁이 포함되어야 함
      const hasMuscleGainTip = result.goalTips.some(
        (tip) => tip.includes('단백질') || tip.includes('근육')
      );
      expect(hasMuscleGainTip).toBe(true);
    });
  });

  describe('formatWorkoutForPrompt', () => {
    it('추천이 없으면 팁만 반환한다', () => {
      const result = formatWorkoutForPrompt({
        hasWorkoutPlan: false,
        todayWorkout: null,
        recommendations: [],
        goalTips: ['규칙적인 운동 습관을 만들어보세요!'],
        recentProgress: null,
      });

      expect(result).toContain('운동 팁');
      expect(result).toContain('규칙적인 운동 습관');
    });

    it('오늘의 운동을 포맷한다', () => {
      const result = formatWorkoutForPrompt({
        hasWorkoutPlan: true,
        todayWorkout: {
          id: 'today',
          name: '스쿼트',
          category: 'strength',
          targetMuscle: ['하체'],
          difficulty: 'intermediate',
          duration: 30,
          calories: 200,
          matchScore: 95,
          matchReason: '오늘 예정된 운동',
        },
        recommendations: [],
        goalTips: [],
        recentProgress: null,
      });

      expect(result).toContain('오늘의 운동');
      expect(result).toContain('스쿼트');
      expect(result).toContain('30분');
    });

    it('추천 운동을 포맷한다', () => {
      const result = formatWorkoutForPrompt({
        hasWorkoutPlan: false,
        todayWorkout: null,
        recommendations: [
          {
            id: '1',
            name: '스쿼트',
            category: 'strength',
            targetMuscle: ['하체', '대퇴사두'],
            difficulty: 'beginner',
            duration: 15,
            calories: 120,
            matchScore: 85,
            matchReason: '근력 강화 목표에 적합',
          },
        ],
        goalTips: ['근력 운동은 세트 간 휴식이 중요해요'],
        recentProgress: null,
      });

      expect(result).toContain('추천 운동');
      expect(result).toContain('스쿼트');
      expect(result).toContain('85%');
      expect(result).toContain('strength');
      expect(result).toContain('근력 강화');
      expect(result).toContain('하체');
    });

    it('최근 활동을 포맷한다', () => {
      const result = formatWorkoutForPrompt({
        hasWorkoutPlan: false,
        todayWorkout: null,
        recommendations: [
          {
            id: '1',
            name: '런닝',
            category: 'cardio',
            targetMuscle: ['전신'],
            difficulty: 'beginner',
            duration: 30,
            calories: 300,
            matchScore: 70,
            matchReason: '기본 추천',
          },
        ],
        goalTips: [],
        recentProgress: '최근 운동: 스쿼트 (45분 누적)',
      });

      expect(result).toContain('최근 활동');
      expect(result).toContain('스쿼트');
      expect(result).toContain('45분 누적');
    });

    it('여러 추천 운동을 포맷한다', () => {
      const result = formatWorkoutForPrompt({
        hasWorkoutPlan: false,
        todayWorkout: null,
        recommendations: [
          {
            id: '1',
            name: '운동1',
            category: 'strength',
            targetMuscle: ['상체'],
            difficulty: 'beginner',
            duration: 20,
            calories: 150,
            matchScore: 90,
            matchReason: '추천 이유1',
          },
          {
            id: '2',
            name: '운동2',
            category: 'cardio',
            targetMuscle: ['전신'],
            difficulty: 'intermediate',
            duration: 25,
            calories: 200,
            matchScore: 75,
            matchReason: '추천 이유2',
          },
        ],
        goalTips: ['팁1', '팁2'],
        recentProgress: null,
      });

      expect(result).toContain('1. 운동1');
      expect(result).toContain('2. 운동2');
      expect(result).toContain('90%');
      expect(result).toContain('75%');
      expect(result).toContain('팁1');
    });

    it('빈 결과면 빈 문자열을 반환한다', () => {
      const result = formatWorkoutForPrompt({
        hasWorkoutPlan: false,
        todayWorkout: null,
        recommendations: [],
        goalTips: [],
        recentProgress: null,
      });

      expect(result).toBe('');
    });
  });
});
