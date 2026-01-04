/**
 * 운동 세션 스토어
 * @description 실시간 운동 세션 상태 관리 (비영속)
 */

import { create } from 'zustand';

// 타입 정의
export type SessionStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

export interface ExerciseSet {
  setNumber: number;
  targetReps: number;
  targetWeight?: number;
  completedReps?: number;
  actualWeight?: number;
  isCompleted: boolean;
  skipped: boolean;
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
  currentSetIndex: number;
  difficulty?: 'easy' | 'normal' | 'hard';
  notes?: string;
  isCompleted: boolean;
}

export interface WorkoutSession {
  sessionId: string;
  planId?: string;
  workoutType: string;
  status: SessionStatus;
  startedAt: number | null;
  pausedAt: number | null;
  completedAt: number | null;
  exercises: SessionExercise[];
  currentExerciseIndex: number;
  totalElapsedTime: number;
  estimatedCalories: number;
}

interface WorkoutSessionState extends WorkoutSession {
  // 휴식 타이머
  isResting: boolean;
  restTimeRemaining: number;
  restDuration: number;

  // Actions - 세션 제어
  initSession: (params: {
    planId?: string;
    workoutType: string;
    exercises: Omit<SessionExercise, 'currentSetIndex' | 'isCompleted'>[];
  }) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  cancelSession: () => void;

  // Actions - 운동 제어
  completeSet: (reps: number, weight?: number) => void;
  skipSet: () => void;
  completeExercise: (difficulty: 'easy' | 'normal' | 'hard', notes?: string) => void;
  skipExercise: () => void;
  nextExercise: () => void;
  prevExercise: () => void;

  // Actions - 휴식 타이머
  startRestTimer: (duration: number) => void;
  updateRestTimer: () => void;
  skipRest: () => void;

  // Actions - 시간 업데이트
  updateElapsedTime: () => void;

  // Getters
  getCurrentExercise: () => SessionExercise | null;
  getProgress: () => { completed: number; total: number; percentage: number };
}

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const initialSession: WorkoutSession = {
  sessionId: '',
  planId: undefined,
  workoutType: '',
  status: 'not_started',
  startedAt: null,
  pausedAt: null,
  completedAt: null,
  exercises: [],
  currentExerciseIndex: 0,
  totalElapsedTime: 0,
  estimatedCalories: 0,
};

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
  ...initialSession,
  isResting: false,
  restTimeRemaining: 0,
  restDuration: 60,

  initSession: ({ planId, workoutType, exercises }) => {
    const sessionExercises: SessionExercise[] = exercises.map((ex) => ({
      ...ex,
      currentSetIndex: 0,
      isCompleted: false,
    }));

    set({
      ...initialSession,
      sessionId: generateSessionId(),
      planId,
      workoutType,
      exercises: sessionExercises,
      status: 'not_started',
    });
  },

  startSession: () => {
    set({
      status: 'in_progress',
      startedAt: Date.now(),
    });
  },

  pauseSession: () => {
    set({
      status: 'paused',
      pausedAt: Date.now(),
    });
  },

  resumeSession: () => {
    set({
      status: 'in_progress',
      pausedAt: null,
    });
  },

  completeSession: () => {
    set({
      status: 'completed',
      completedAt: Date.now(),
    });
  },

  cancelSession: () => {
    set({
      ...initialSession,
      isResting: false,
      restTimeRemaining: 0,
    });
  },

  completeSet: (reps, weight) => {
    set((state) => {
      const exercises = [...state.exercises];
      const currentExercise = exercises[state.currentExerciseIndex];
      if (!currentExercise) return state;

      const sets = [...currentExercise.sets];
      const currentSet = sets[currentExercise.currentSetIndex];
      if (!currentSet) return state;

      sets[currentExercise.currentSetIndex] = {
        ...currentSet,
        completedReps: reps,
        actualWeight: weight,
        isCompleted: true,
        skipped: false,
      };

      // 다음 세트로 이동
      const nextSetIndex = currentExercise.currentSetIndex + 1;

      exercises[state.currentExerciseIndex] = {
        ...currentExercise,
        sets,
        currentSetIndex: nextSetIndex,
        isCompleted: nextSetIndex >= sets.length,
      };

      // 칼로리 추정 (간단 계산)
      const caloriesBurned = Math.round(reps * (weight || 0) * 0.01 + 5);

      return {
        exercises,
        estimatedCalories: state.estimatedCalories + caloriesBurned,
      };
    });
  },

  skipSet: () => {
    set((state) => {
      const exercises = [...state.exercises];
      const currentExercise = exercises[state.currentExerciseIndex];
      if (!currentExercise) return state;

      const sets = [...currentExercise.sets];
      sets[currentExercise.currentSetIndex] = {
        ...sets[currentExercise.currentSetIndex],
        skipped: true,
        isCompleted: true,
      };

      const nextSetIndex = currentExercise.currentSetIndex + 1;

      exercises[state.currentExerciseIndex] = {
        ...currentExercise,
        sets,
        currentSetIndex: nextSetIndex,
        isCompleted: nextSetIndex >= sets.length,
      };

      return { exercises };
    });
  },

  completeExercise: (difficulty, notes) => {
    set((state) => {
      const exercises = [...state.exercises];
      exercises[state.currentExerciseIndex] = {
        ...exercises[state.currentExerciseIndex],
        difficulty,
        notes,
        isCompleted: true,
      };

      return { exercises };
    });
  },

  skipExercise: () => {
    set((state) => {
      const exercises = [...state.exercises];
      exercises[state.currentExerciseIndex] = {
        ...exercises[state.currentExerciseIndex],
        isCompleted: true,
      };

      const nextIndex = state.currentExerciseIndex + 1;

      return {
        exercises,
        currentExerciseIndex: Math.min(nextIndex, exercises.length - 1),
      };
    });
  },

  nextExercise: () => {
    set((state) => ({
      currentExerciseIndex: Math.min(
        state.currentExerciseIndex + 1,
        state.exercises.length - 1
      ),
    }));
  },

  prevExercise: () => {
    set((state) => ({
      currentExerciseIndex: Math.max(state.currentExerciseIndex - 1, 0),
    }));
  },

  startRestTimer: (duration) => {
    set({
      isResting: true,
      restTimeRemaining: duration,
      restDuration: duration,
    });
  },

  updateRestTimer: () => {
    set((state) => {
      if (!state.isResting) return state;

      const newTime = state.restTimeRemaining - 1;
      if (newTime <= 0) {
        return { isResting: false, restTimeRemaining: 0 };
      }
      return { restTimeRemaining: newTime };
    });
  },

  skipRest: () => {
    set({ isResting: false, restTimeRemaining: 0 });
  },

  updateElapsedTime: () => {
    set((state) => {
      if (state.status !== 'in_progress') return state;
      return { totalElapsedTime: state.totalElapsedTime + 1 };
    });
  },

  getCurrentExercise: () => {
    const state = get();
    return state.exercises[state.currentExerciseIndex] || null;
  },

  getProgress: () => {
    const state = get();
    const total = state.exercises.length;
    const completed = state.exercises.filter((e) => e.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  },
}));

/**
 * 세션 진행 중 여부
 */
export function isSessionActive(): boolean {
  const status = useWorkoutSessionStore.getState().status;
  return status === 'in_progress' || status === 'paused';
}

/**
 * 세션 시간 포맷팅
 */
export function formatSessionTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
