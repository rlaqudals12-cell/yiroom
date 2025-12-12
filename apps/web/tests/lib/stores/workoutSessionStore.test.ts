/**
 * workoutSessionStore 테스트
 * @description 운동 세션 상태 관리 스토어 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkoutSessionStore } from '@/lib/stores/workoutSessionStore';
import type { DayPlan, Exercise, WorkoutType } from '@/types/workout';

// Mock 운동 데이터
const mockExercises: Exercise[] = [
  {
    id: 'pushup',
    name: '푸쉬업',
    category: 'upper',
    bodyParts: ['chest', 'arm'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: ['바닥에 엎드려 손을 어깨 너비로 벌립니다'],
    tips: ['코어에 힘을 줍니다'],
    met: 3.8,
    caloriesPerMinute: 5,
    suitableFor: { bodyTypes: ['all'], goals: ['strength'] },
  },
  {
    id: 'squat',
    name: '스쿼트',
    category: 'lower',
    bodyParts: ['thigh', 'hip'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: ['발을 어깨 너비로 벌립니다'],
    tips: ['무릎이 발끝을 넘지 않게 합니다'],
    met: 5.0,
    caloriesPerMinute: 7,
    suitableFor: { bodyTypes: ['all'], goals: ['strength'] },
  },
  {
    id: 'plank',
    name: '플랭크',
    category: 'core',
    bodyParts: ['abs', 'waist'],
    equipment: ['none'],
    difficulty: 'beginner',
    instructions: ['팔꿈치로 상체를 지지합니다'],
    tips: ['허리가 꺾이지 않게 합니다'],
    met: 3.0,
    caloriesPerMinute: 4,
    suitableFor: { bodyTypes: ['all'], goals: ['core'] },
  },
];

const mockDayPlan: DayPlan = {
  day: 'mon',
  dayLabel: '월요일',
  isRestDay: false,
  exercises: mockExercises,
  estimatedMinutes: 30,
  estimatedCalories: 200,
};

describe('workoutSessionStore', () => {
  beforeEach(() => {
    useWorkoutSessionStore.getState().resetSession();
  });

  describe('초기 상태', () => {
    it('기본값이 올바르게 설정된다', () => {
      const state = useWorkoutSessionStore.getState();

      expect(state.sessionId).toBe('');
      expect(state.planId).toBe('');
      expect(state.status).toBe('not_started');
      expect(state.currentExerciseIndex).toBe(0);
      expect(state.currentSetIndex).toBe(0);
      expect(state.exerciseRecords).toEqual([]);
      expect(state.isResting).toBe(false);
      expect(state.elapsedTime).toBe(0);
    });
  });

  describe('initSession', () => {
    it('세션을 초기화한다', () => {
      const store = useWorkoutSessionStore.getState();
      store.initSession('plan-123', mockDayPlan, 'user-123', 'toner');

      const state = useWorkoutSessionStore.getState();
      expect(state.sessionId).toContain('session-');
      expect(state.planId).toBe('plan-123');
      expect(state.userId).toBe('user-123');
      expect(state.status).toBe('not_started');
      expect(state.exerciseRecords).toHaveLength(3);
    });

    it('운동 레코드가 올바르게 생성된다', () => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'builder');

      const { exerciseRecords } = useWorkoutSessionStore.getState();

      expect(exerciseRecords[0].exerciseId).toBe('pushup');
      expect(exerciseRecords[0].exerciseName).toBe('푸쉬업');
      expect(exerciseRecords[0].sets).toHaveLength(3);
      expect(exerciseRecords[0].isCompleted).toBe(false);
    });

    it('총 세트 수가 계산된다', () => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');

      const { totalSetsPlanned } = useWorkoutSessionStore.getState();
      // 3 exercises × 3 sets = 9
      expect(totalSetsPlanned).toBe(9);
    });
  });

  describe('startSession', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
    });

    it('세션을 시작한다', () => {
      useWorkoutSessionStore.getState().startSession();

      const state = useWorkoutSessionStore.getState();
      expect(state.status).toBe('in_progress');
      expect(state.startedAt).toBeDefined();
    });

    it('첫 번째 운동의 첫 번째 세트가 in_progress 상태가 된다', () => {
      useWorkoutSessionStore.getState().startSession();

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[0].sets[0].status).toBe('in_progress');
    });

    it('이미 진행 중인 세션에서는 동작하지 않는다', () => {
      const store = useWorkoutSessionStore.getState();
      store.startSession();
      const firstStartedAt = useWorkoutSessionStore.getState().startedAt;

      store.startSession(); // 두 번째 시작 시도
      expect(useWorkoutSessionStore.getState().startedAt).toBe(firstStartedAt);
    });
  });

  describe('pauseSession / resumeSession', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('세션을 일시정지한다', () => {
      useWorkoutSessionStore.getState().pauseSession();
      expect(useWorkoutSessionStore.getState().status).toBe('paused');
    });

    it('세션을 재개한다', () => {
      useWorkoutSessionStore.getState().pauseSession();
      useWorkoutSessionStore.getState().resumeSession();
      expect(useWorkoutSessionStore.getState().status).toBe('in_progress');
    });
  });

  describe('endSession', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('세션을 종료한다', () => {
      useWorkoutSessionStore.getState().endSession();

      const state = useWorkoutSessionStore.getState();
      expect(state.status).toBe('completed');
      expect(state.completedAt).toBeDefined();
      expect(state.isResting).toBe(false);
    });
  });

  describe('resetSession', () => {
    it('세션을 초기 상태로 리셋한다', () => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
      useWorkoutSessionStore.getState().resetSession();

      const state = useWorkoutSessionStore.getState();
      expect(state.sessionId).toBe('');
      expect(state.status).toBe('not_started');
      expect(state.exerciseRecords).toEqual([]);
    });
  });

  describe('startExercise', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
    });

    it('특정 운동을 시작한다', () => {
      useWorkoutSessionStore.getState().startExercise(1);

      const state = useWorkoutSessionStore.getState();
      expect(state.currentExerciseIndex).toBe(1);
      expect(state.currentSetIndex).toBe(0);
      expect(state.exerciseRecords[1].startedAt).toBeDefined();
    });

    it('해당 운동의 첫 번째 세트가 in_progress가 된다', () => {
      useWorkoutSessionStore.getState().startExercise(0);

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[0].sets[0].status).toBe('in_progress');
    });
  });

  describe('completeSet', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('현재 세트를 완료한다', () => {
      useWorkoutSessionStore.getState().completeSet(12, 0);

      const state = useWorkoutSessionStore.getState();
      expect(state.exerciseRecords[0].sets[0].status).toBe('completed');
      expect(state.exerciseRecords[0].sets[0].actualReps).toBe(12);
      expect(state.totalSetsCompleted).toBe(1);
    });

    it('다음 세트가 있으면 휴식 상태가 된다', () => {
      useWorkoutSessionStore.getState().completeSet();

      const state = useWorkoutSessionStore.getState();
      expect(state.isResting).toBe(true);
      expect(state.status).toBe('resting');
      expect(state.currentSetIndex).toBe(1);
    });

    it('마지막 세트면 운동이 완료된다', () => {
      const store = useWorkoutSessionStore.getState();
      store.completeSet(); // Set 1
      store.skipRest();
      store.completeSet(); // Set 2
      store.skipRest();
      store.completeSet(); // Set 3

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[0].isCompleted).toBe(true);
      expect(exerciseRecords[0].completedAt).toBeDefined();
    });

    it('칼로리가 계산된다', () => {
      useWorkoutSessionStore.getState().completeSet();

      const { estimatedCalories } = useWorkoutSessionStore.getState();
      expect(estimatedCalories).toBeGreaterThan(0);
    });
  });

  describe('skipSet', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('현재 세트를 건너뛴다', () => {
      useWorkoutSessionStore.getState().skipSet();

      const { exerciseRecords, currentSetIndex } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[0].sets[0].status).toBe('skipped');
      expect(currentSetIndex).toBe(1);
    });

    it('다음 세트가 in_progress가 된다', () => {
      useWorkoutSessionStore.getState().skipSet();

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[0].sets[1].status).toBe('in_progress');
    });
  });

  describe('completeExercise', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('현재 운동을 완료한다', () => {
      useWorkoutSessionStore.getState().completeExercise(3, '좋았음');

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[0].isCompleted).toBe(true);
      expect(exerciseRecords[0].difficulty).toBe(3);
      expect(exerciseRecords[0].notes).toBe('좋았음');
    });

    it('미완료 세트들이 skipped 처리된다', () => {
      useWorkoutSessionStore.getState().completeExercise();

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      exerciseRecords[0].sets.forEach((set, idx) => {
        if (idx === 0) {
          expect(set.status).toBe('skipped'); // in_progress였던 세트
        } else {
          expect(set.status).toBe('skipped');
        }
      });
    });
  });

  describe('skipExercise', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('현재 운동을 건너뛴다', () => {
      useWorkoutSessionStore.getState().skipExercise();

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[0].isCompleted).toBe(true);
      exerciseRecords[0].sets.forEach(set => {
        expect(set.status).toBe('skipped');
      });
    });
  });

  describe('moveToNextExercise', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('다음 운동으로 이동한다', () => {
      useWorkoutSessionStore.getState().moveToNextExercise();

      const state = useWorkoutSessionStore.getState();
      expect(state.currentExerciseIndex).toBe(1);
      expect(state.currentSetIndex).toBe(0);
      expect(state.isResting).toBe(false);
    });

    it('다음 운동의 첫 번째 세트가 in_progress가 된다', () => {
      useWorkoutSessionStore.getState().moveToNextExercise();

      const { exerciseRecords } = useWorkoutSessionStore.getState();
      expect(exerciseRecords[1].sets[0].status).toBe('in_progress');
      expect(exerciseRecords[1].startedAt).toBeDefined();
    });

    it('마지막 운동이면 세션이 완료된다', () => {
      const store = useWorkoutSessionStore.getState();
      store.moveToNextExercise(); // -> exercise 1
      store.moveToNextExercise(); // -> exercise 2
      store.moveToNextExercise(); // -> completed

      expect(useWorkoutSessionStore.getState().status).toBe('completed');
    });
  });

  describe('휴식 타이머', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('휴식 타이머를 시작한다', () => {
      useWorkoutSessionStore.getState().startRestTimer(60);

      const state = useWorkoutSessionStore.getState();
      expect(state.isResting).toBe(true);
      expect(state.restTimeRemaining).toBe(60);
      expect(state.status).toBe('resting');
    });

    it('휴식 타이머를 업데이트한다', () => {
      useWorkoutSessionStore.getState().startRestTimer(60);
      useWorkoutSessionStore.getState().updateRestTimer(30);

      expect(useWorkoutSessionStore.getState().restTimeRemaining).toBe(30);
    });

    it('휴식 시간이 0이 되면 휴식이 종료된다', () => {
      useWorkoutSessionStore.getState().startRestTimer(60);
      useWorkoutSessionStore.getState().updateRestTimer(0);

      const state = useWorkoutSessionStore.getState();
      expect(state.isResting).toBe(false);
      expect(state.restTimeRemaining).toBe(0);
      expect(state.status).toBe('in_progress');
    });

    it('휴식을 건너뛴다', () => {
      useWorkoutSessionStore.getState().startRestTimer(60);
      useWorkoutSessionStore.getState().skipRest();

      const state = useWorkoutSessionStore.getState();
      expect(state.isResting).toBe(false);
      expect(state.restTimeRemaining).toBe(0);
      expect(state.status).toBe('in_progress');
    });

    it('휴식 시간을 조절한다 (30초 ~ 3분 범위)', () => {
      useWorkoutSessionStore.getState().startRestTimer(60);

      // +30초
      useWorkoutSessionStore.getState().adjustRestTime(30);
      expect(useWorkoutSessionStore.getState().restTimeRemaining).toBe(90);

      // -30초
      useWorkoutSessionStore.getState().adjustRestTime(-30);
      expect(useWorkoutSessionStore.getState().restTimeRemaining).toBe(60);

      // 최소값 30초
      useWorkoutSessionStore.getState().adjustRestTime(-100);
      expect(useWorkoutSessionStore.getState().restTimeRemaining).toBe(30);

      // 최대값 180초 (3분)
      useWorkoutSessionStore.getState().adjustRestTime(200);
      expect(useWorkoutSessionStore.getState().restTimeRemaining).toBe(180);
    });
  });

  describe('updateElapsedTime', () => {
    it('경과 시간을 업데이트한다', () => {
      useWorkoutSessionStore.getState().updateElapsedTime(120);
      expect(useWorkoutSessionStore.getState().elapsedTime).toBe(120);
    });
  });

  describe('getCompletionStats', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      useWorkoutSessionStore.getState().startSession();
    });

    it('초기 상태의 통계를 반환한다', () => {
      const stats = useWorkoutSessionStore.getState().getCompletionStats();

      expect(stats.completedExercises).toBe(0);
      expect(stats.totalExercises).toBe(3);
      expect(stats.completedSets).toBe(0);
      expect(stats.totalSets).toBe(9);
      expect(stats.progressPercent).toBe(0);
    });

    it('세트 완료 후 통계가 업데이트된다', () => {
      useWorkoutSessionStore.getState().completeSet();
      const stats = useWorkoutSessionStore.getState().getCompletionStats();

      expect(stats.completedSets).toBe(1);
      expect(stats.progressPercent).toBe(11); // 1/9 ≈ 11%
    });

    it('운동 완료 후 통계가 업데이트된다', () => {
      const store = useWorkoutSessionStore.getState();

      // 첫 번째 운동의 모든 세트 완료
      store.completeSet();
      store.skipRest();
      store.completeSet();
      store.skipRest();
      store.completeSet();

      const stats = store.getCompletionStats();
      expect(stats.completedExercises).toBe(1);
      expect(stats.completedSets).toBe(3);
      expect(stats.progressPercent).toBe(33); // 3/9 ≈ 33%
    });
  });

  describe('전체 운동 플로우 시나리오', () => {
    it('운동 세션 전체 플로우를 테스트한다', () => {
      const store = useWorkoutSessionStore.getState();

      // 1. 세션 초기화
      store.initSession('plan-123', mockDayPlan, 'user-123', 'toner');
      expect(store.status).toBe('not_started');

      // 2. 세션 시작
      store.startSession();
      expect(useWorkoutSessionStore.getState().status).toBe('in_progress');

      // 3. 첫 번째 운동 (푸쉬업) 수행
      useWorkoutSessionStore.getState().completeSet(12);
      expect(useWorkoutSessionStore.getState().isResting).toBe(true);

      useWorkoutSessionStore.getState().skipRest();
      useWorkoutSessionStore.getState().completeSet(10);
      useWorkoutSessionStore.getState().skipRest();
      useWorkoutSessionStore.getState().completeSet(8);

      // 4. 두 번째 운동으로 이동
      useWorkoutSessionStore.getState().moveToNextExercise();
      expect(useWorkoutSessionStore.getState().currentExerciseIndex).toBe(1);

      // 5. 두 번째 운동 건너뛰기
      useWorkoutSessionStore.getState().skipExercise();

      // 6. 세 번째 운동으로 이동
      useWorkoutSessionStore.getState().moveToNextExercise();
      expect(useWorkoutSessionStore.getState().currentExerciseIndex).toBe(2);

      // 7. 세 번째 운동 완료
      useWorkoutSessionStore.getState().completeExercise(4, '힘들었음');

      // 8. 세션 완료
      useWorkoutSessionStore.getState().moveToNextExercise();
      expect(useWorkoutSessionStore.getState().status).toBe('completed');

      // 9. 최종 통계 확인
      const stats = useWorkoutSessionStore.getState().getCompletionStats();
      expect(stats.completedExercises).toBe(3);
      expect(stats.totalExercises).toBe(3);
    });
  });
});
