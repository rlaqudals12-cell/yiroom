/**
 * 운동 온보딩 입력 스토어
 * @description 다단계 폼 상태 관리 (AsyncStorage 영속)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 타입 정의
export type WorkoutGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'endurance'
  | 'flexibility'
  | 'health';
export type WorkoutLocation = 'gym' | 'home' | 'outdoor' | 'mixed';
export type WorkoutFrequency = '1-2' | '3-4' | '5-6' | 'daily';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'resistance_band'
  | 'pull_up_bar'
  | 'bench'
  | 'cable_machine'
  | 'cardio_machine'
  | 'none';

interface WorkoutInputState {
  // 현재 단계 (1-7)
  currentStep: number;

  // Step 1: 운동 목표 (최대 2개)
  goals: WorkoutGoal[];

  // Step 2: 신체 고민 (최대 3개)
  concerns: string[];

  // Step 3: 운동 빈도
  frequency: WorkoutFrequency | null;

  // Step 4: 운동 장소
  location: WorkoutLocation | null;

  // Step 5: 보유 장비
  equipment: EquipmentType[];

  // Step 6: 피트니스 레벨
  fitnessLevel: FitnessLevel | null;

  // Step 7: 목표 설정
  targetWeight: number | null;
  targetDate: string | null;

  // 부상/제한사항
  injuries: string[];

  // Actions
  setStep: (step: number) => void;
  setGoals: (goals: WorkoutGoal[]) => void;
  addGoal: (goal: WorkoutGoal) => void;
  removeGoal: (goal: WorkoutGoal) => void;
  setConcerns: (concerns: string[]) => void;
  setFrequency: (frequency: WorkoutFrequency | null) => void;
  setLocation: (location: WorkoutLocation | null) => void;
  setEquipment: (equipment: EquipmentType[]) => void;
  toggleEquipment: (equipment: EquipmentType) => void;
  setFitnessLevel: (level: FitnessLevel | null) => void;
  setTargetWeight: (weight: number | null) => void;
  setTargetDate: (date: string | null) => void;
  setInjuries: (injuries: string[]) => void;
  resetAll: () => void;
  isStepComplete: (step: number) => boolean;
}

const MAX_GOALS = 2;
const MAX_CONCERNS = 3;

const initialState = {
  currentStep: 1,
  goals: [] as WorkoutGoal[],
  concerns: [] as string[],
  frequency: null as WorkoutFrequency | null,
  location: null as WorkoutLocation | null,
  equipment: [] as EquipmentType[],
  fitnessLevel: null as FitnessLevel | null,
  targetWeight: null as number | null,
  targetDate: null as string | null,
  injuries: [] as string[],
};

export const useWorkoutInputStore = create<WorkoutInputState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (currentStep) => set({ currentStep }),

      setGoals: (goals) => set({ goals: goals.slice(0, MAX_GOALS) }),

      addGoal: (goal) =>
        set((state) => {
          if (state.goals.length >= MAX_GOALS) return state;
          if (state.goals.includes(goal)) return state;
          return { goals: [...state.goals, goal] };
        }),

      removeGoal: (goal) =>
        set((state) => ({
          goals: state.goals.filter((g) => g !== goal),
        })),

      setConcerns: (concerns) =>
        set({ concerns: concerns.slice(0, MAX_CONCERNS) }),

      setFrequency: (frequency) => set({ frequency }),

      setLocation: (location) => set({ location }),

      setEquipment: (equipment) => set({ equipment }),

      toggleEquipment: (equip) =>
        set((state) => {
          if (state.equipment.includes(equip)) {
            return { equipment: state.equipment.filter((e) => e !== equip) };
          }
          return { equipment: [...state.equipment, equip] };
        }),

      setFitnessLevel: (fitnessLevel) => set({ fitnessLevel }),

      setTargetWeight: (targetWeight) => set({ targetWeight }),

      setTargetDate: (targetDate) => set({ targetDate }),

      setInjuries: (injuries) => set({ injuries }),

      resetAll: () => set(initialState),

      isStepComplete: (step) => {
        const state = get();
        switch (step) {
          case 1:
            return state.goals.length > 0;
          case 2:
            return true; // 고민은 선택사항
          case 3:
            return state.frequency !== null;
          case 4:
            return state.location !== null;
          case 5:
            return true; // 장비는 선택사항 (홈트레이닝)
          case 6:
            return state.fitnessLevel !== null;
          case 7:
            return true; // 목표는 선택사항
          default:
            return false;
        }
      },
    }),
    {
      name: 'yiroom-workout-input',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * 온보딩 완료 여부 확인
 */
export function isWorkoutOnboardingComplete(): boolean {
  const state = useWorkoutInputStore.getState();
  return (
    state.goals.length > 0 &&
    state.frequency !== null &&
    state.location !== null &&
    state.fitnessLevel !== null
  );
}

/**
 * 목표 라벨
 */
export const WORKOUT_GOAL_LABELS: Record<WorkoutGoal, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가',
  endurance: '체력 향상',
  flexibility: '유연성',
  health: '건강 유지',
};

/**
 * 빈도 라벨
 */
export const FREQUENCY_LABELS: Record<WorkoutFrequency, string> = {
  '1-2': '주 1-2회',
  '3-4': '주 3-4회',
  '5-6': '주 5-6회',
  daily: '매일',
};
