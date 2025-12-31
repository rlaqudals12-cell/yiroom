/**
 * 사용자 상태 스토어
 */
import { create } from 'zustand';
import type { PersonalColorSeason, SkinType, BodyType, WorkoutType } from '@yiroom/shared';

interface UserAnalysisData {
  // 퍼스널 컬러 분석 결과
  personalColor?: {
    season: PersonalColorSeason;
    tone: string;
    analyzedAt: string;
  };
  // 피부 분석 결과
  skin?: {
    type: SkinType;
    concerns: string[];
    analyzedAt: string;
  };
  // 체형 분석 결과
  body?: {
    type: BodyType;
    bmi: number;
    analyzedAt: string;
  };
  // 운동 타입 분석 결과
  workout?: {
    type: WorkoutType;
    analyzedAt: string;
  };
}

interface UserState {
  // 사용자 정보
  userId: string | null;
  isLoading: boolean;
  analysisData: UserAnalysisData;

  // 액션
  setUserId: (userId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setAnalysisData: (data: Partial<UserAnalysisData>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  isLoading: false,
  analysisData: {},

  setUserId: (userId) => set({ userId }),
  setLoading: (isLoading) => set({ isLoading }),
  setAnalysisData: (data) =>
    set((state) => ({
      analysisData: { ...state.analysisData, ...data },
    })),
  clearUser: () =>
    set({
      userId: null,
      isLoading: false,
      analysisData: {},
    }),
}));
