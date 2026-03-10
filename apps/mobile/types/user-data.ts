/**
 * 사용자 데이터 관리 타입 정의
 * SDD-L2-USER-DATA
 */

// 기본 사용자 정보
export interface UserBasicInfo {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

// 분석 결과
export interface UserAnalyses {
  personalColor: {
    season: string;
    subtype: string;
    analyzedAt: string;
  } | null;
  skin: {
    skinType: string;
    concerns: string[];
    analyzedAt: string;
  } | null;
  body: {
    bodyType: string;
    analyzedAt: string;
  } | null;
  workout: {
    fitnessLevel: string;
    goals: string[];
    analyzedAt: string;
  } | null;
}

// 운동/영양 기록
export interface UserRecords {
  workoutLogs: Array<{
    id: string;
    exerciseId: string;
    duration: number;
    completedAt: string;
  }>;
  mealRecords: Array<{
    id: string;
    mealType: string;
    calories: number;
    recordedAt: string;
  }>;
  waterRecords: Array<{
    id: string;
    amount: number;
    recordedAt: string;
  }>;
}

// 소셜 데이터
export interface UserSocial {
  friends: Array<{
    friendId: string;
    friendName: string;
    since: string;
  }>;
  badges: Array<{
    id: string;
    name: string;
    earnedAt: string;
  }>;
  level: {
    level: number;
    exp: number;
  } | null;
  wellnessScores: Array<{
    date: string;
    score: number;
  }>;
}

// 설정/환경설정
export interface UserPreferences {
  nutritionSettings: {
    dailyCalorieGoal: number;
    dailyWaterGoal: number;
  } | null;
  wishlists: Array<{
    productId: string;
    productName: string;
    addedAt: string;
  }>;
}

// 전체 내보내기 데이터
export interface UserExportData {
  user: UserBasicInfo;
  analyses: UserAnalyses;
  records: UserRecords;
  social: UserSocial;
  preferences: UserPreferences;
}

// 내보내기 응답
export interface ExportResponse {
  success: true;
  data: UserExportData;
  exportedAt: string;
  format: 'json';
}

// 계정 삭제 요청
export interface DeleteAccountRequest {
  confirmation: string; // 이메일 확인용
}

// 계정 삭제 응답
export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  deletedAt?: string;
  error?: 'CONFIRMATION_MISMATCH' | 'DELETION_FAILED';
}
