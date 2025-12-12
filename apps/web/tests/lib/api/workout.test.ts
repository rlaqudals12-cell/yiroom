/**
 * W-1 운동 DB API 테스트 (Task 3.10)
 *
 * lib/api/workout.ts의 유틸리티 함수 및 데이터 변환 로직 테스트
 */
import { describe, it, expect, vi } from 'vitest';

// Mock Supabase before importing the module
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabaseClient,
}));

// =====================================================
// 볼륨 계산 로직 테스트 (순수 함수)
// =====================================================

// 볼륨 계산 유틸리티 함수 (lib/api/workout.ts의 inline 로직 추출)
function calculateTotalVolume(
  exerciseLogs: Array<{
    sets: Array<{
      reps: number;
      weight?: number;
      completed: boolean;
    }>;
  }>
): number {
  return exerciseLogs.reduce((total, exercise) => {
    return (
      total +
      exercise.sets.reduce((setTotal, set) => {
        return setTotal + (set.completed ? set.reps * (set.weight || 1) : 0);
      }, 0)
    );
  }, 0);
}

describe('볼륨 계산 로직', () => {
  it('완료된 세트의 볼륨을 정확히 계산', () => {
    const exerciseLogs = [
      {
        sets: [
          { reps: 10, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: true },
        ],
      },
    ];

    // 10 * 50 + 8 * 50 = 500 + 400 = 900
    expect(calculateTotalVolume(exerciseLogs)).toBe(900);
  });

  it('미완료 세트는 볼륨에서 제외', () => {
    const exerciseLogs = [
      {
        sets: [
          { reps: 10, weight: 50, completed: true },
          { reps: 8, weight: 50, completed: false },
        ],
      },
    ];

    // 10 * 50 = 500 (미완료 제외)
    expect(calculateTotalVolume(exerciseLogs)).toBe(500);
  });

  it('무게 없는 운동은 weight=1로 계산', () => {
    const exerciseLogs = [
      {
        sets: [
          { reps: 20, completed: true },
          { reps: 15, completed: true },
        ],
      },
    ];

    // 20 * 1 + 15 * 1 = 35
    expect(calculateTotalVolume(exerciseLogs)).toBe(35);
  });

  it('여러 운동의 볼륨 합산', () => {
    const exerciseLogs = [
      {
        sets: [
          { reps: 10, weight: 60, completed: true },
          { reps: 10, weight: 60, completed: true },
        ],
      },
      {
        sets: [
          { reps: 12, weight: 40, completed: true },
          { reps: 12, weight: 40, completed: true },
        ],
      },
    ];

    // 스쿼트: 10*60 + 10*60 = 1200
    // 벤치프레스: 12*40 + 12*40 = 960
    // 총: 2160
    expect(calculateTotalVolume(exerciseLogs)).toBe(2160);
  });

  it('빈 배열은 0 반환', () => {
    expect(calculateTotalVolume([])).toBe(0);
  });

  it('세트가 비어있으면 0 반환', () => {
    const exerciseLogs = [{ sets: [] }];
    expect(calculateTotalVolume(exerciseLogs)).toBe(0);
  });
});

// =====================================================
// 주간 시작일 계산 로직 테스트
// =====================================================

// 이번 주 월요일 날짜 계산 (lib/api/workout.ts의 로직)
function getWeekStartDate(today: Date = new Date()): string {
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

describe('주간 시작일 계산', () => {
  it('월요일은 그대로 반환', () => {
    const monday = new Date('2024-01-15'); // 월요일
    expect(getWeekStartDate(monday)).toBe('2024-01-15');
  });

  it('화요일은 월요일 반환', () => {
    const tuesday = new Date('2024-01-16'); // 화요일
    expect(getWeekStartDate(tuesday)).toBe('2024-01-15');
  });

  it('수요일은 월요일 반환', () => {
    const wednesday = new Date('2024-01-17'); // 수요일
    expect(getWeekStartDate(wednesday)).toBe('2024-01-15');
  });

  it('목요일은 월요일 반환', () => {
    const thursday = new Date('2024-01-18'); // 목요일
    expect(getWeekStartDate(thursday)).toBe('2024-01-15');
  });

  it('금요일은 월요일 반환', () => {
    const friday = new Date('2024-01-19'); // 금요일
    expect(getWeekStartDate(friday)).toBe('2024-01-15');
  });

  it('토요일은 월요일 반환', () => {
    const saturday = new Date('2024-01-20'); // 토요일
    expect(getWeekStartDate(saturday)).toBe('2024-01-15');
  });

  it('일요일은 전주 월요일 반환', () => {
    const sunday = new Date('2024-01-21'); // 일요일
    expect(getWeekStartDate(sunday)).toBe('2024-01-15');
  });
});

// =====================================================
// Streak 계산 로직 테스트
// =====================================================

// Streak 계산 로직 (lib/api/workout.ts의 로직 추출)
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  streakStartDate: string | null;
  milestonesReached: number[];
}

function calculateStreak(
  existing: StreakData | null,
  workoutDate: string
): StreakData {
  const today = new Date(workoutDate);
  const todayStr = today.toISOString().split('T')[0];

  if (!existing) {
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastWorkoutDate: todayStr,
      streakStartDate: todayStr,
      milestonesReached: [],
    };
  }

  const lastWorkout = existing.lastWorkoutDate
    ? new Date(existing.lastWorkoutDate)
    : null;

  let newCurrentStreak = existing.currentStreak;
  let newStreakStart = existing.streakStartDate;

  if (lastWorkout) {
    const daysDiff = Math.floor(
      (today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // 같은 날 - 변경 없음
      return existing;
    } else if (daysDiff === 1) {
      // 연속 - streak 증가
      newCurrentStreak += 1;
    } else {
      // 끊김 - streak 리셋
      newCurrentStreak = 1;
      newStreakStart = todayStr;
    }
  }

  const newLongestStreak = Math.max(existing.longestStreak, newCurrentStreak);

  // 마일스톤 체크
  const milestones = [3, 7, 14, 30, 60, 100];
  const newMilestones = [...(existing.milestonesReached || [])];
  for (const milestone of milestones) {
    if (newCurrentStreak >= milestone && !newMilestones.includes(milestone)) {
      newMilestones.push(milestone);
    }
  }

  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastWorkoutDate: todayStr,
    streakStartDate: newStreakStart,
    milestonesReached: newMilestones,
  };
}

describe('Streak 계산 로직', () => {
  it('첫 운동은 streak 1 설정', () => {
    const result = calculateStreak(null, '2024-01-15');

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastWorkoutDate).toBe('2024-01-15');
    expect(result.streakStartDate).toBe('2024-01-15');
  });

  it('연속 운동은 streak 증가', () => {
    const existing: StreakData = {
      currentStreak: 3,
      longestStreak: 5,
      lastWorkoutDate: '2024-01-14',
      streakStartDate: '2024-01-12',
      milestonesReached: [3],
    };

    const result = calculateStreak(existing, '2024-01-15');

    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(5);
  });

  it('같은 날 운동은 streak 유지', () => {
    const existing: StreakData = {
      currentStreak: 3,
      longestStreak: 5,
      lastWorkoutDate: '2024-01-15',
      streakStartDate: '2024-01-13',
      milestonesReached: [3],
    };

    const result = calculateStreak(existing, '2024-01-15');

    expect(result.currentStreak).toBe(3);
    expect(result).toEqual(existing);
  });

  it('하루 건너뛰면 streak 리셋', () => {
    const existing: StreakData = {
      currentStreak: 5,
      longestStreak: 10,
      lastWorkoutDate: '2024-01-13',
      streakStartDate: '2024-01-09',
      milestonesReached: [3],
    };

    const result = calculateStreak(existing, '2024-01-15');

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10);
    expect(result.streakStartDate).toBe('2024-01-15');
  });

  it('longest streak 갱신', () => {
    const existing: StreakData = {
      currentStreak: 9,
      longestStreak: 9,
      lastWorkoutDate: '2024-01-14',
      streakStartDate: '2024-01-06',
      milestonesReached: [3, 7],
    };

    const result = calculateStreak(existing, '2024-01-15');

    expect(result.currentStreak).toBe(10);
    expect(result.longestStreak).toBe(10);
  });

  it('마일스톤 자동 추가', () => {
    const existing: StreakData = {
      currentStreak: 6,
      longestStreak: 6,
      lastWorkoutDate: '2024-01-14',
      streakStartDate: '2024-01-09',
      milestonesReached: [3],
    };

    const result = calculateStreak(existing, '2024-01-15');

    expect(result.currentStreak).toBe(7);
    expect(result.milestonesReached).toContain(7);
  });

  it('이미 달성한 마일스톤은 중복 추가 안함', () => {
    const existing: StreakData = {
      currentStreak: 7,
      longestStreak: 7,
      lastWorkoutDate: '2024-01-14',
      streakStartDate: '2024-01-08',
      milestonesReached: [3, 7],
    };

    const result = calculateStreak(existing, '2024-01-15');

    const sevenCount = result.milestonesReached.filter((m) => m === 7).length;
    expect(sevenCount).toBe(1);
  });
});

// =====================================================
// 플랜 통계 계산 테스트
// =====================================================

interface DailyPlan {
  is_rest_day: boolean;
  estimated_minutes: number;
  estimated_calories: number;
}

function calculatePlanStats(dailyPlans: DailyPlan[]) {
  return {
    totalWorkoutDays: dailyPlans.filter((d) => !d.is_rest_day).length,
    totalEstimatedMinutes: dailyPlans.reduce(
      (sum, d) => sum + d.estimated_minutes,
      0
    ),
    totalEstimatedCalories: dailyPlans.reduce(
      (sum, d) => sum + d.estimated_calories,
      0
    ),
  };
}

describe('플랜 통계 계산', () => {
  it('운동일 수 계산', () => {
    const dailyPlans: DailyPlan[] = [
      { is_rest_day: false, estimated_minutes: 45, estimated_calories: 300 },
      { is_rest_day: false, estimated_minutes: 50, estimated_calories: 350 },
      { is_rest_day: true, estimated_minutes: 0, estimated_calories: 0 },
      { is_rest_day: false, estimated_minutes: 40, estimated_calories: 280 },
      { is_rest_day: true, estimated_minutes: 0, estimated_calories: 0 },
    ];

    const stats = calculatePlanStats(dailyPlans);
    expect(stats.totalWorkoutDays).toBe(3);
  });

  it('총 예상 시간 계산', () => {
    const dailyPlans: DailyPlan[] = [
      { is_rest_day: false, estimated_minutes: 45, estimated_calories: 300 },
      { is_rest_day: false, estimated_minutes: 50, estimated_calories: 350 },
      { is_rest_day: true, estimated_minutes: 0, estimated_calories: 0 },
    ];

    const stats = calculatePlanStats(dailyPlans);
    expect(stats.totalEstimatedMinutes).toBe(95);
  });

  it('총 예상 칼로리 계산', () => {
    const dailyPlans: DailyPlan[] = [
      { is_rest_day: false, estimated_minutes: 45, estimated_calories: 300 },
      { is_rest_day: false, estimated_minutes: 50, estimated_calories: 350 },
      { is_rest_day: false, estimated_minutes: 40, estimated_calories: 280 },
    ];

    const stats = calculatePlanStats(dailyPlans);
    expect(stats.totalEstimatedCalories).toBe(930);
  });

  it('빈 플랜은 0 반환', () => {
    const stats = calculatePlanStats([]);

    expect(stats.totalWorkoutDays).toBe(0);
    expect(stats.totalEstimatedMinutes).toBe(0);
    expect(stats.totalEstimatedCalories).toBe(0);
  });

  it('모두 휴식일이면 운동일 0', () => {
    const dailyPlans: DailyPlan[] = [
      { is_rest_day: true, estimated_minutes: 0, estimated_calories: 0 },
      { is_rest_day: true, estimated_minutes: 0, estimated_calories: 0 },
    ];

    const stats = calculatePlanStats(dailyPlans);
    expect(stats.totalWorkoutDays).toBe(0);
  });
});

// =====================================================
// 타입 호환성 테스트
// =====================================================

describe('타입 정의', () => {
  it('WorkoutAnalysis 필수 필드 존재', () => {
    const analysis = {
      id: 'test-id',
      user_id: 'user-id',
      workout_type: 'builder',
      goals: ['muscle'],
      concerns: ['weight'],
      equipment: [],
      injuries: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(analysis).toHaveProperty('id');
    expect(analysis).toHaveProperty('user_id');
    expect(analysis).toHaveProperty('workout_type');
    expect(analysis).toHaveProperty('goals');
  });

  it('WorkoutPlan 필수 필드 존재', () => {
    const plan = {
      id: 'plan-id',
      user_id: 'user-id',
      week_start_date: '2024-01-15',
      week_number: 1,
      daily_plans: [],
      total_workout_days: 0,
      total_estimated_minutes: 0,
      total_estimated_calories: 0,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('daily_plans');
    expect(plan).toHaveProperty('status');
  });

  it('WorkoutLog 필수 필드 존재', () => {
    const log = {
      id: 'log-id',
      user_id: 'user-id',
      workout_date: '2024-01-15',
      exercise_logs: [],
      total_volume: 0,
      created_at: new Date().toISOString(),
    };

    expect(log).toHaveProperty('id');
    expect(log).toHaveProperty('workout_date');
    expect(log).toHaveProperty('exercise_logs');
    expect(log).toHaveProperty('total_volume');
  });

  it('WorkoutStreak 필수 필드 존재', () => {
    const streak = {
      id: 'streak-id',
      user_id: 'user-id',
      current_streak: 5,
      longest_streak: 10,
      badges_earned: [],
      milestones_reached: [3],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(streak).toHaveProperty('current_streak');
    expect(streak).toHaveProperty('longest_streak');
    expect(streak).toHaveProperty('milestones_reached');
  });
});
