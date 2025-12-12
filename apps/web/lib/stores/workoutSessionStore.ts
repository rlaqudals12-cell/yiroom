import { create } from 'zustand';
import type {
  DayPlan,
  Exercise,
  WorkoutSessionState,
  ExerciseSessionRecord,
  SetRecord,
  WorkoutType,
  ExerciseCategory,
} from '@/types/workout';
import { DEFAULT_REST_TIMES, CATEGORY_REST_TIMES } from '@/types/workout';

// Store 상태 타입
interface WorkoutSessionStore extends WorkoutSessionState {
  // 세션 초기화/시작
  initSession: (planId: string, dayPlan: DayPlan, userId: string, workoutType: WorkoutType) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  resetSession: () => void;

  // 운동 진행
  startExercise: (exerciseIndex: number) => void;
  completeSet: (reps?: number, weight?: number) => void;
  skipSet: () => void;
  completeExercise: (difficulty?: number, notes?: string) => void;
  skipExercise: () => void;
  moveToNextExercise: () => void;

  // 휴식 타이머
  startRestTimer: (seconds?: number) => void;
  updateRestTimer: (secondsRemaining: number) => void;
  skipRest: () => void;
  adjustRestTime: (delta: number) => void;

  // 시간 추적
  updateElapsedTime: (seconds: number) => void;

  // 통계 계산
  getCompletionStats: () => {
    completedExercises: number;
    totalExercises: number;
    completedSets: number;
    totalSets: number;
    progressPercent: number;
  };
}

// 초기 상태
const initialState: WorkoutSessionState = {
  sessionId: '',
  planId: '',
  dayPlan: {
    day: 'mon',
    dayLabel: '월요일',
    isRestDay: false,
    exercises: [],
    estimatedMinutes: 0,
    estimatedCalories: 0,
  },
  userId: '',
  workoutDate: new Date().toISOString().split('T')[0],
  status: 'not_started',
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  exerciseRecords: [],
  isResting: false,
  totalSetsCompleted: 0,
  totalSetsPlanned: 0,
  elapsedTime: 0,
  estimatedCalories: 0,
};

// 세트 기본값 생성
function createDefaultSets(exercise: Exercise): SetRecord[] {
  const defaultSets = 3;
  const defaultReps = exercise.category === 'cardio' ? 1 : 12;

  return Array.from({ length: defaultSets }, (_, i) => ({
    setNumber: i + 1,
    targetReps: defaultReps,
    status: 'pending' as const,
  }));
}

// 운동 레코드 생성
function createExerciseRecord(exercise: Exercise, restSeconds: number): ExerciseSessionRecord {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    category: exercise.category,
    sets: createDefaultSets(exercise),
    restSeconds,
    isCompleted: false,
  };
}

export const useWorkoutSessionStore = create<WorkoutSessionStore>((set, get) => ({
  ...initialState,

  // 세션 초기화
  initSession: (planId, dayPlan, userId, workoutType) => {
    const sessionId = `session-${Date.now()}`;
    const workoutDate = new Date().toISOString().split('T')[0];

    // 기본 휴식 시간 결정 (운동 타입 기반)
    const defaultRest = DEFAULT_REST_TIMES[workoutType] || 60;

    // 각 운동에 대한 레코드 생성 (카테고리별 휴식 시간 적용)
    const exerciseRecords: ExerciseSessionRecord[] = dayPlan.exercises.map((exercise) => {
      const restSeconds = CATEGORY_REST_TIMES[exercise.category as ExerciseCategory] || defaultRest;
      return createExerciseRecord(exercise, restSeconds);
    });

    // 총 세트 수 계산
    const totalSetsPlanned = exerciseRecords.reduce(
      (sum, record) => sum + record.sets.length,
      0
    );

    set({
      sessionId,
      planId,
      dayPlan,
      userId,
      workoutDate,
      status: 'not_started',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      exerciseRecords,
      isResting: false,
      totalSetsCompleted: 0,
      totalSetsPlanned,
      elapsedTime: 0,
      estimatedCalories: 0,
      startedAt: undefined,
      completedAt: undefined,
    });
  },

  // 세션 시작
  startSession: () => {
    const state = get();
    if (state.status !== 'not_started' && state.status !== 'paused') return;

    const startedAt = state.startedAt || new Date().toISOString();

    // 첫 번째 운동의 첫 번째 세트 시작
    const exerciseRecords = [...state.exerciseRecords];
    if (exerciseRecords.length > 0 && exerciseRecords[0].sets.length > 0) {
      exerciseRecords[0].startedAt = startedAt;
      exerciseRecords[0].sets[0].status = 'in_progress';
    }

    set({
      status: 'in_progress',
      startedAt,
      exerciseRecords,
    });
  },

  // 세션 일시정지
  pauseSession: () => {
    set({ status: 'paused' });
  },

  // 세션 재개
  resumeSession: () => {
    set({ status: 'in_progress' });
  },

  // 세션 종료
  endSession: () => {
    set({
      status: 'completed',
      completedAt: new Date().toISOString(),
      isResting: false,
    });
  },

  // 세션 리셋
  resetSession: () => {
    set(initialState);
  },

  // 특정 운동 시작
  startExercise: (exerciseIndex) => {
    const state = get();
    const exerciseRecords = [...state.exerciseRecords];

    if (exerciseIndex < exerciseRecords.length) {
      exerciseRecords[exerciseIndex].startedAt = new Date().toISOString();
      if (exerciseRecords[exerciseIndex].sets.length > 0) {
        exerciseRecords[exerciseIndex].sets[0].status = 'in_progress';
      }
      set({
        currentExerciseIndex: exerciseIndex,
        currentSetIndex: 0,
        exerciseRecords,
        isResting: false,
      });
    }
  },

  // 세트 완료
  completeSet: (reps, weight) => {
    const state = get();
    const { currentExerciseIndex, currentSetIndex, exerciseRecords, dayPlan } = state;

    const newRecords = [...exerciseRecords];
    const currentRecord = newRecords[currentExerciseIndex];

    if (!currentRecord) return;

    const currentSet = currentRecord.sets[currentSetIndex];
    if (!currentSet) return;

    // 현재 세트 완료 처리
    currentSet.status = 'completed';
    currentSet.actualReps = reps ?? currentSet.targetReps;
    currentSet.actualWeight = weight ?? currentSet.targetWeight;
    currentSet.completedAt = new Date().toISOString();

    // 칼로리 계산 (간단한 추정)
    const exercise = dayPlan.exercises[currentExerciseIndex];
    const exerciseMinutes = 0.5; // 세트당 약 30초
    const caloriesForSet = exercise
      ? exercise.caloriesPerMinute * exerciseMinutes
      : 5;

    const newTotalSetsCompleted = state.totalSetsCompleted + 1;
    const nextSetIndex = currentSetIndex + 1;

    // 다음 세트가 있으면 휴식 후 진행
    if (nextSetIndex < currentRecord.sets.length) {
      currentRecord.sets[nextSetIndex].status = 'in_progress';
      set({
        exerciseRecords: newRecords,
        totalSetsCompleted: newTotalSetsCompleted,
        currentSetIndex: nextSetIndex,
        isResting: true,
        restTimeRemaining: currentRecord.restSeconds,
        status: 'resting',
        estimatedCalories: state.estimatedCalories + caloriesForSet,
      });
    } else {
      // 운동의 모든 세트 완료
      currentRecord.isCompleted = true;
      currentRecord.completedAt = new Date().toISOString();

      set({
        exerciseRecords: newRecords,
        totalSetsCompleted: newTotalSetsCompleted,
        estimatedCalories: state.estimatedCalories + caloriesForSet,
      });
    }
  },

  // 세트 건너뛰기
  skipSet: () => {
    const state = get();
    const { currentExerciseIndex, currentSetIndex, exerciseRecords } = state;

    const newRecords = [...exerciseRecords];
    const currentRecord = newRecords[currentExerciseIndex];

    if (!currentRecord) return;

    const currentSet = currentRecord.sets[currentSetIndex];
    if (!currentSet) return;

    currentSet.status = 'skipped';
    const nextSetIndex = currentSetIndex + 1;

    if (nextSetIndex < currentRecord.sets.length) {
      currentRecord.sets[nextSetIndex].status = 'in_progress';
      set({
        exerciseRecords: newRecords,
        currentSetIndex: nextSetIndex,
      });
    } else {
      currentRecord.isCompleted = true;
      currentRecord.completedAt = new Date().toISOString();
      set({ exerciseRecords: newRecords });
    }
  },

  // 운동 완료
  completeExercise: (difficulty, notes) => {
    const state = get();
    const { currentExerciseIndex, exerciseRecords } = state;

    const newRecords = [...exerciseRecords];
    const currentRecord = newRecords[currentExerciseIndex];

    if (!currentRecord) return;

    currentRecord.isCompleted = true;
    currentRecord.completedAt = new Date().toISOString();
    if (difficulty !== undefined) currentRecord.difficulty = difficulty;
    if (notes !== undefined) currentRecord.notes = notes;

    // 미완료 세트들 skipped 처리
    currentRecord.sets.forEach((s) => {
      if (s.status === 'pending' || s.status === 'in_progress') {
        s.status = 'skipped';
      }
    });

    set({ exerciseRecords: newRecords });
  },

  // 운동 건너뛰기
  skipExercise: () => {
    const state = get();
    const { currentExerciseIndex, exerciseRecords } = state;

    const newRecords = [...exerciseRecords];
    const currentRecord = newRecords[currentExerciseIndex];

    if (!currentRecord) return;

    currentRecord.isCompleted = true;
    currentRecord.completedAt = new Date().toISOString();
    currentRecord.sets.forEach((s) => {
      s.status = 'skipped';
    });

    set({ exerciseRecords: newRecords });
  },

  // 다음 운동으로 이동
  moveToNextExercise: () => {
    const state = get();
    const nextIndex = state.currentExerciseIndex + 1;

    if (nextIndex < state.exerciseRecords.length) {
      const newRecords = [...state.exerciseRecords];
      newRecords[nextIndex].startedAt = new Date().toISOString();
      if (newRecords[nextIndex].sets.length > 0) {
        newRecords[nextIndex].sets[0].status = 'in_progress';
      }

      set({
        currentExerciseIndex: nextIndex,
        currentSetIndex: 0,
        exerciseRecords: newRecords,
        isResting: false,
        status: 'in_progress',
      });
    } else {
      // 모든 운동 완료
      set({
        status: 'completed',
        completedAt: new Date().toISOString(),
        isResting: false,
      });
    }
  },

  // 휴식 타이머 시작
  startRestTimer: (seconds) => {
    const state = get();
    const { currentExerciseIndex, exerciseRecords } = state;
    const currentRecord = exerciseRecords[currentExerciseIndex];
    const restTime = seconds ?? currentRecord?.restSeconds ?? 60;

    set({
      isResting: true,
      restTimeRemaining: restTime,
      status: 'resting',
    });
  },

  // 휴식 타이머 업데이트
  updateRestTimer: (secondsRemaining) => {
    if (secondsRemaining <= 0) {
      set({
        isResting: false,
        restTimeRemaining: 0,
        status: 'in_progress',
      });
    } else {
      set({ restTimeRemaining: secondsRemaining });
    }
  },

  // 휴식 건너뛰기
  skipRest: () => {
    set({
      isResting: false,
      restTimeRemaining: 0,
      status: 'in_progress',
    });
  },

  // 휴식 시간 조절 (스펙: 30초 ~ 3분)
  adjustRestTime: (delta) => {
    const state = get();
    const current = state.restTimeRemaining ?? 60;
    const newTime = Math.max(30, Math.min(180, current + delta));
    set({ restTimeRemaining: newTime });
  },

  // 경과 시간 업데이트
  updateElapsedTime: (seconds) => {
    set({ elapsedTime: seconds });
  },

  // 완료 통계
  getCompletionStats: () => {
    const state = get();
    const { exerciseRecords } = state;

    const completedExercises = exerciseRecords.filter((r) => r.isCompleted).length;
    const totalExercises = exerciseRecords.length;

    let completedSets = 0;
    let totalSets = 0;

    exerciseRecords.forEach((record) => {
      totalSets += record.sets.length;
      completedSets += record.sets.filter((s) => s.status === 'completed').length;
    });

    const progressPercent = totalSets > 0
      ? Math.round((completedSets / totalSets) * 100)
      : 0;

    return {
      completedExercises,
      totalExercises,
      completedSets,
      totalSets,
      progressPercent,
    };
  },
}));
