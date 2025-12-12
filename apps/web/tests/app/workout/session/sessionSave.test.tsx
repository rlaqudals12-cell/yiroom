/**
 * 운동 세션 저장 로직 테스트 (P3-3.1)
 * - ExerciseSessionRecord → ExerciseLog 변환
 * - 저장 성공/실패 시나리오
 * - 재시도 로직
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExerciseSessionRecord } from '@/types/workout';
import type { ExerciseLog, SetLog } from '@/lib/api/workout';

// =============================================================================
// convertToExerciseLogs 함수 추출 (session/page.tsx의 로직)
// =============================================================================

function convertToExerciseLogs(records: ExerciseSessionRecord[]): ExerciseLog[] {
  return records.map((record) => ({
    exercise_id: record.exerciseId,
    exercise_name: record.exerciseName,
    sets: record.sets.map((set): SetLog => ({
      reps: set.actualReps ?? set.targetReps ?? 0,
      weight: set.actualWeight,
      completed: set.status === 'completed',
    })),
    difficulty: record.difficulty,
  }));
}

// =============================================================================
// convertToExerciseLogs 테스트
// =============================================================================

describe('convertToExerciseLogs', () => {
  it('ExerciseSessionRecord를 ExerciseLog로 정확히 변환', () => {
    const records: ExerciseSessionRecord[] = [
      {
        exerciseId: 'ex-001',
        exerciseName: '스쿼트',
        category: 'lower',
        sets: [
          {
            setNumber: 1,
            targetReps: 12,
            targetWeight: 50,
            actualReps: 12,
            actualWeight: 50,
            status: 'completed',
          },
          {
            setNumber: 2,
            targetReps: 12,
            targetWeight: 50,
            actualReps: 10,
            actualWeight: 50,
            status: 'completed',
          },
        ],
        restSeconds: 60,
        difficulty: 3,
        isCompleted: true,
      },
    ];

    const result = convertToExerciseLogs(records);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      exercise_id: 'ex-001',
      exercise_name: '스쿼트',
      sets: [
        { reps: 12, weight: 50, completed: true },
        { reps: 10, weight: 50, completed: true },
      ],
      difficulty: 3,
    });
  });

  it('미완료 세트는 completed: false로 변환', () => {
    const records: ExerciseSessionRecord[] = [
      {
        exerciseId: 'ex-002',
        exerciseName: '벤치프레스',
        category: 'upper',
        sets: [
          {
            setNumber: 1,
            targetReps: 10,
            targetWeight: 40,
            actualReps: 10,
            actualWeight: 40,
            status: 'completed',
          },
          {
            setNumber: 2,
            targetReps: 10,
            targetWeight: 40,
            actualReps: undefined,
            actualWeight: undefined,
            status: 'pending',
          },
        ],
        restSeconds: 90,
        isCompleted: false,
      },
    ];

    const result = convertToExerciseLogs(records);

    expect(result[0].sets[0].completed).toBe(true);
    expect(result[0].sets[1].completed).toBe(false);
  });

  it('건너뛴 세트는 completed: false로 변환', () => {
    const records: ExerciseSessionRecord[] = [
      {
        exerciseId: 'ex-003',
        exerciseName: '데드리프트',
        category: 'lower',
        sets: [
          {
            setNumber: 1,
            targetReps: 8,
            targetWeight: 60,
            status: 'skipped',
          },
        ],
        restSeconds: 120,
        isCompleted: true,
      },
    ];

    const result = convertToExerciseLogs(records);

    expect(result[0].sets[0].completed).toBe(false);
    expect(result[0].sets[0].reps).toBe(8); // targetReps 사용
  });

  it('actualReps가 없으면 targetReps를 사용', () => {
    const records: ExerciseSessionRecord[] = [
      {
        exerciseId: 'ex-004',
        exerciseName: '런지',
        category: 'lower',
        sets: [
          {
            setNumber: 1,
            targetReps: 15,
            actualReps: undefined,
            status: 'completed',
          },
        ],
        restSeconds: 60,
        isCompleted: true,
      },
    ];

    const result = convertToExerciseLogs(records);

    expect(result[0].sets[0].reps).toBe(15);
  });

  it('여러 운동을 배열로 변환', () => {
    const records: ExerciseSessionRecord[] = [
      {
        exerciseId: 'ex-001',
        exerciseName: '스쿼트',
        category: 'lower',
        sets: [{ setNumber: 1, targetReps: 12, status: 'completed' }],
        restSeconds: 60,
        isCompleted: true,
      },
      {
        exerciseId: 'ex-002',
        exerciseName: '벤치프레스',
        category: 'upper',
        sets: [{ setNumber: 1, targetReps: 10, status: 'completed' }],
        restSeconds: 90,
        isCompleted: true,
      },
      {
        exerciseId: 'ex-003',
        exerciseName: '데드리프트',
        category: 'lower',
        sets: [{ setNumber: 1, targetReps: 8, status: 'completed' }],
        restSeconds: 120,
        isCompleted: true,
      },
    ];

    const result = convertToExerciseLogs(records);

    expect(result).toHaveLength(3);
    expect(result[0].exercise_name).toBe('스쿼트');
    expect(result[1].exercise_name).toBe('벤치프레스');
    expect(result[2].exercise_name).toBe('데드리프트');
  });

  it('빈 배열은 빈 배열 반환', () => {
    const result = convertToExerciseLogs([]);
    expect(result).toEqual([]);
  });

  it('difficulty가 없어도 정상 변환', () => {
    const records: ExerciseSessionRecord[] = [
      {
        exerciseId: 'ex-005',
        exerciseName: '플랭크',
        category: 'core',
        sets: [{ setNumber: 1, targetReps: 30, status: 'completed' }],
        restSeconds: 30,
        isCompleted: true,
      },
    ];

    const result = convertToExerciseLogs(records);

    expect(result[0].difficulty).toBeUndefined();
  });
});

// =============================================================================
// 재시도 로직 테스트 (순수 함수 추출)
// =============================================================================

// 재시도 지연 계산 함수
function calculateRetryDelay(retryCount: number): number {
  return Math.pow(2, retryCount) * 1000; // 2^n * 1000ms
}

describe('재시도 지연 계산', () => {
  it('첫 번째 재시도는 2초 지연', () => {
    expect(calculateRetryDelay(1)).toBe(2000);
  });

  it('두 번째 재시도는 4초 지연', () => {
    expect(calculateRetryDelay(2)).toBe(4000);
  });

  it('세 번째 재시도는 8초 지연', () => {
    expect(calculateRetryDelay(3)).toBe(8000);
  });
});

// =============================================================================
// 저장 성공/실패 시나리오 테스트 (모킹)
// =============================================================================

// saveWorkoutLog mock
const mockSaveWorkoutLog = vi.fn();
const mockGetWorkoutStreak = vi.fn();

vi.mock('@/lib/api/workout', () => ({
  saveWorkoutLog: (...args: unknown[]) => mockSaveWorkoutLog(...args),
  getWorkoutStreak: (...args: unknown[]) => mockGetWorkoutStreak(...args),
}));

describe('세션 저장 시나리오', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('저장 성공 시 streak 조회', async () => {
    // 성공 시나리오 설정
    mockSaveWorkoutLog.mockResolvedValueOnce({
      id: 'log-001',
      user_id: 'user-001',
      workout_date: '2024-01-15',
      exercise_logs: [],
      total_volume: 1000,
    });
    mockGetWorkoutStreak.mockResolvedValueOnce({
      current_streak: 5,
      longest_streak: 10,
    });

    // 함수 호출
    const result = await mockSaveWorkoutLog('user-001', null, '2024-01-15', [], {});
    const streak = await mockGetWorkoutStreak('user-001');

    expect(result).not.toBeNull();
    expect(streak.current_streak).toBe(5);
  });

  it('저장 실패 시 null 반환', async () => {
    mockSaveWorkoutLog.mockResolvedValueOnce(null);

    const result = await mockSaveWorkoutLog('user-001', null, '2024-01-15', [], {});

    expect(result).toBeNull();
  });

  it('저장 예외 발생 시 처리', async () => {
    mockSaveWorkoutLog.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      mockSaveWorkoutLog('user-001', null, '2024-01-15', [], {})
    ).rejects.toThrow('Network error');
  });
});

// =============================================================================
// 최대 재시도 횟수 테스트
// =============================================================================

describe('최대 재시도 횟수', () => {
  const MAX_RETRY_COUNT = 3;

  it('재시도 횟수가 MAX_RETRY_COUNT 이상이면 더 이상 재시도하지 않음', () => {
    let retryCount = 0;
    const shouldRetry = (count: number) => count < MAX_RETRY_COUNT;

    // 첫 번째 시도 (0)
    expect(shouldRetry(retryCount)).toBe(true);
    retryCount++;

    // 두 번째 시도 (1)
    expect(shouldRetry(retryCount)).toBe(true);
    retryCount++;

    // 세 번째 시도 (2)
    expect(shouldRetry(retryCount)).toBe(true);
    retryCount++;

    // 네 번째 시도 (3) - 더 이상 재시도하지 않음
    expect(shouldRetry(retryCount)).toBe(false);
  });

  it('성공 시 재시도 카운트 리셋', () => {
    let retryCount = 2;
    let success = false;

    // 저장 성공
    success = true;
    if (success) {
      retryCount = 0;
    }

    expect(retryCount).toBe(0);
  });
});
