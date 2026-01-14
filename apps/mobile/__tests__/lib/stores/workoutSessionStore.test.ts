/**
 * 운동 세션 스토어 테스트
 */

import {
  useWorkoutSessionStore,
  isSessionActive,
  formatSessionTime,
} from '@/lib/stores';

describe('useWorkoutSessionStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useWorkoutSessionStore.getState().cancelSession();
  });

  describe('initSession', () => {
    it('새 세션을 초기화해야 함', () => {
      const { initSession } = useWorkoutSessionStore.getState();

      initSession({
        workoutType: 'strength',
        exercises: [
          {
            exerciseId: 'ex_1',
            name: '벤치 프레스',
            sets: [
              {
                setNumber: 1,
                targetReps: 10,
                targetWeight: 60,
                isCompleted: false,
                skipped: false,
              },
              {
                setNumber: 2,
                targetReps: 10,
                targetWeight: 60,
                isCompleted: false,
                skipped: false,
              },
            ],
          },
        ],
      });

      const state = useWorkoutSessionStore.getState();
      expect(state.sessionId).toMatch(/^session_/);
      expect(state.workoutType).toBe('strength');
      expect(state.status).toBe('not_started');
      expect(state.exercises).toHaveLength(1);
    });
  });

  describe('세션 제어', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession({
        workoutType: 'strength',
        exercises: [
          {
            exerciseId: 'ex_1',
            name: '벤치 프레스',
            sets: [
              {
                setNumber: 1,
                targetReps: 10,
                targetWeight: 60,
                isCompleted: false,
                skipped: false,
              },
            ],
          },
        ],
      });
    });

    it('startSession으로 세션 시작', () => {
      const { startSession } = useWorkoutSessionStore.getState();

      startSession();

      const state = useWorkoutSessionStore.getState();
      expect(state.status).toBe('in_progress');
      expect(state.startedAt).not.toBeNull();
    });

    it('pauseSession으로 세션 일시정지', () => {
      const { startSession, pauseSession } = useWorkoutSessionStore.getState();

      startSession();
      pauseSession();

      const state = useWorkoutSessionStore.getState();
      expect(state.status).toBe('paused');
      expect(state.pausedAt).not.toBeNull();
    });

    it('resumeSession으로 세션 재개', () => {
      const { startSession, pauseSession, resumeSession } =
        useWorkoutSessionStore.getState();

      startSession();
      pauseSession();
      resumeSession();

      const state = useWorkoutSessionStore.getState();
      expect(state.status).toBe('in_progress');
      expect(state.pausedAt).toBeNull();
    });

    it('completeSession으로 세션 완료', () => {
      const { startSession, completeSession } =
        useWorkoutSessionStore.getState();

      startSession();
      completeSession();

      const state = useWorkoutSessionStore.getState();
      expect(state.status).toBe('completed');
      expect(state.completedAt).not.toBeNull();
    });
  });

  describe('세트 완료', () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().initSession({
        workoutType: 'strength',
        exercises: [
          {
            exerciseId: 'ex_1',
            name: '벤치 프레스',
            sets: [
              {
                setNumber: 1,
                targetReps: 10,
                targetWeight: 60,
                isCompleted: false,
                skipped: false,
              },
              {
                setNumber: 2,
                targetReps: 10,
                targetWeight: 60,
                isCompleted: false,
                skipped: false,
              },
            ],
          },
        ],
      });
    });

    it('completeSet으로 세트 완료', () => {
      const { completeSet } = useWorkoutSessionStore.getState();

      completeSet(10, 60);

      const state = useWorkoutSessionStore.getState();
      const exercise = state.exercises[0];

      expect(exercise.sets[0].isCompleted).toBe(true);
      expect(exercise.sets[0].completedReps).toBe(10);
      expect(exercise.sets[0].actualWeight).toBe(60);
      expect(exercise.currentSetIndex).toBe(1);
    });

    it('skipSet으로 세트 건너뛰기', () => {
      const { skipSet } = useWorkoutSessionStore.getState();

      skipSet();

      const state = useWorkoutSessionStore.getState();
      const exercise = state.exercises[0];

      expect(exercise.sets[0].skipped).toBe(true);
      expect(exercise.sets[0].isCompleted).toBe(true);
      expect(exercise.currentSetIndex).toBe(1);
    });

    it('모든 세트 완료 시 운동 완료 처리', () => {
      const { completeSet } = useWorkoutSessionStore.getState();

      completeSet(10, 60); // 첫 번째 세트
      completeSet(10, 60); // 두 번째 세트

      const state = useWorkoutSessionStore.getState();
      expect(state.exercises[0].isCompleted).toBe(true);
    });
  });

  describe('휴식 타이머', () => {
    it('startRestTimer로 휴식 시작', () => {
      const { startRestTimer } = useWorkoutSessionStore.getState();

      startRestTimer(60);

      const state = useWorkoutSessionStore.getState();
      expect(state.isResting).toBe(true);
      expect(state.restTimeRemaining).toBe(60);
      expect(state.restDuration).toBe(60);
    });

    it('updateRestTimer로 시간 감소', () => {
      const { startRestTimer, updateRestTimer } =
        useWorkoutSessionStore.getState();

      startRestTimer(60);
      updateRestTimer();

      const state = useWorkoutSessionStore.getState();
      expect(state.restTimeRemaining).toBe(59);
    });

    it('휴식 시간 0이 되면 휴식 종료', () => {
      const { startRestTimer, updateRestTimer } =
        useWorkoutSessionStore.getState();

      startRestTimer(1);
      updateRestTimer();

      const state = useWorkoutSessionStore.getState();
      expect(state.isResting).toBe(false);
      expect(state.restTimeRemaining).toBe(0);
    });

    it('skipRest으로 휴식 건너뛰기', () => {
      const { startRestTimer, skipRest } = useWorkoutSessionStore.getState();

      startRestTimer(60);
      skipRest();

      const state = useWorkoutSessionStore.getState();
      expect(state.isResting).toBe(false);
      expect(state.restTimeRemaining).toBe(0);
    });
  });

  describe('getProgress', () => {
    it('진행률을 올바르게 계산해야 함', () => {
      const { initSession, completeSet } = useWorkoutSessionStore.getState();

      initSession({
        workoutType: 'strength',
        exercises: [
          {
            exerciseId: 'ex_1',
            name: '운동 1',
            sets: [
              {
                setNumber: 1,
                targetReps: 10,
                isCompleted: false,
                skipped: false,
              },
            ],
          },
          {
            exerciseId: 'ex_2',
            name: '운동 2',
            sets: [
              {
                setNumber: 1,
                targetReps: 10,
                isCompleted: false,
                skipped: false,
              },
            ],
          },
        ],
      });

      let progress = useWorkoutSessionStore.getState().getProgress();
      expect(progress).toEqual({ completed: 0, total: 2, percentage: 0 });

      completeSet(10);

      progress = useWorkoutSessionStore.getState().getProgress();
      expect(progress).toEqual({ completed: 1, total: 2, percentage: 50 });
    });
  });

  describe('유틸리티 함수', () => {
    it('isSessionActive가 올바르게 동작해야 함', () => {
      expect(isSessionActive()).toBe(false);

      useWorkoutSessionStore.getState().initSession({
        workoutType: 'strength',
        exercises: [],
      });

      expect(isSessionActive()).toBe(false);

      useWorkoutSessionStore.getState().startSession();
      expect(isSessionActive()).toBe(true);

      useWorkoutSessionStore.getState().pauseSession();
      expect(isSessionActive()).toBe(true);

      useWorkoutSessionStore.getState().completeSession();
      expect(isSessionActive()).toBe(false);
    });

    it('formatSessionTime이 올바르게 포맷해야 함', () => {
      expect(formatSessionTime(0)).toBe('00:00');
      expect(formatSessionTime(30)).toBe('00:30');
      expect(formatSessionTime(60)).toBe('01:00');
      expect(formatSessionTime(90)).toBe('01:30');
      expect(formatSessionTime(3661)).toBe('61:01');
    });
  });
});
