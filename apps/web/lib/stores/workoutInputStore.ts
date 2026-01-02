import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersonalColorSeason, BodyTypeData } from '@/types/workout';

// types/workout.ts에서 re-export (하위 호환성 유지)
export type { PersonalColorSeason, BodyTypeData } from '@/types/workout';

// Store State 타입
interface WorkoutInputState {
  // 현재 단계
  currentStep: number;

  // Step 1: C-1 데이터 + PC-1 데이터
  bodyTypeData: BodyTypeData | null;
  personalColor: PersonalColorSeason | null;

  // Step 2: 운동 목표 (최대 2개)
  goals: string[];

  // Step 3: 신체 고민 (최대 3개)
  concerns: string[];

  // Step 4: 운동 빈도
  frequency: string;

  // Step 5: 운동 장소 및 장비
  location: string;
  equipment: string[];

  // Step 6: 목표 설정
  targetWeight?: number;
  targetDate?: string;

  // Step 7: 부상/통증
  injuries: string[];

  // Actions
  setStep: (step: number) => void;
  setBodyTypeData: (data: BodyTypeData | null) => void;
  setPersonalColor: (color: PersonalColorSeason | null) => void;
  setGoals: (goals: string[]) => void;
  setConcerns: (concerns: string[]) => void;
  setFrequency: (frequency: string) => void;
  setLocation: (location: string) => void;
  setEquipment: (equipment: string[]) => void;
  setTargetWeight: (weight: number | undefined) => void;
  setTargetDate: (date: string | undefined) => void;
  setInjuries: (injuries: string[]) => void;
  resetAll: () => void;
  getInputData: () => WorkoutInputData;
  // P0-2: 간소화 지원 메서드
  applyDefaults: () => void;
  canSkipStep3: () => boolean;
}

// API 요청용 데이터 타입
export interface WorkoutInputData {
  bodyTypeData: BodyTypeData | null;
  personalColor: PersonalColorSeason | null;
  goals: string[];
  concerns: string[];
  frequency: string;
  location: string;
  equipment: string[];
  targetWeight?: number;
  targetDate?: string;
  injuries: string[];
}

// 초기 상태
const initialState = {
  currentStep: 1,
  bodyTypeData: null,
  personalColor: null as PersonalColorSeason | null,
  goals: [] as string[],
  concerns: [],
  frequency: '',
  location: '',
  equipment: [],
  targetWeight: undefined,
  targetDate: undefined,
  injuries: [],
};

export const useWorkoutInputStore = create<WorkoutInputState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      setBodyTypeData: (data) => set({ bodyTypeData: data }),

      setPersonalColor: (color) => set({ personalColor: color }),

      setGoals: (goals) => set({ goals }),

      setConcerns: (concerns) => set({ concerns }),

      setFrequency: (frequency) => set({ frequency }),

      setLocation: (location) => set({ location }),

      setEquipment: (equipment) => set({ equipment }),

      setTargetWeight: (weight) => set({ targetWeight: weight }),

      setTargetDate: (date) => set({ targetDate: date }),

      setInjuries: (injuries) => set({ injuries }),

      resetAll: () => set(initialState),

      getInputData: () => {
        const state = get();
        return {
          bodyTypeData: state.bodyTypeData,
          personalColor: state.personalColor,
          goals: state.goals,
          concerns: state.concerns,
          frequency: state.frequency,
          location: state.location,
          equipment: state.equipment,
          targetWeight: state.targetWeight,
          targetDate: state.targetDate,
          injuries: state.injuries,
        };
      },

      // P0-2: Step 3 건너뛰기 시 기본값 적용
      applyDefaults: () => {
        set({
          injuries: ['none'], // 부상 없음
          targetWeight: undefined,
          targetDate: undefined,
        });
      },

      // P0-2: Step 3 건너뛰기 가능 여부 (필수 데이터가 모두 있어야 함)
      canSkipStep3: () => {
        const state = get();
        return (
          !!state.bodyTypeData &&
          state.goals.length > 0 &&
          state.concerns.length > 0 &&
          !!state.frequency &&
          !!state.location &&
          state.equipment.length > 0
        );
      },
    }),
    {
      name: 'workout-input-storage',
    }
  )
);
