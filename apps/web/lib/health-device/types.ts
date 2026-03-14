/**
 * 헬스 디바이스 연동 타입 정의
 * @description Apple HealthKit / Google Health Connect 데이터 모델
 */

// ============================================
// 디바이스 플랫폼
// ============================================

export type HealthPlatform = 'apple_health' | 'google_health_connect' | 'manual';

// ============================================
// 데이터 카테고리
// ============================================

export type HealthDataCategory =
  | 'sleep' // 수면
  | 'heart_rate' // 심박수
  | 'steps' // 걸음수
  | 'stress' // 스트레스 (HRV 기반)
  | 'activity'; // 활동량 (칼로리)

// ============================================
// 수면 데이터
// ============================================

export type SleepStage = 'awake' | 'light' | 'deep' | 'rem';

export interface SleepRecord {
  /** ISO 8601 날짜 */
  date: string;
  /** 취침 시각 (ISO) */
  bedTime: string;
  /** 기상 시각 (ISO) */
  wakeTime: string;
  /** 총 수면 시간 (분) */
  totalMinutes: number;
  /** 수면 단계별 시간 (분) */
  stages: Record<SleepStage, number>;
  /** 수면 품질 점수 (0-100) */
  qualityScore: number;
  /** 데이터 출처 */
  source: HealthPlatform;
}

// ============================================
// 심박수 데이터
// ============================================

export interface HeartRateRecord {
  date: string;
  /** 안정 시 심박수 (bpm) */
  restingBpm: number;
  /** 평균 심박수 (bpm) */
  avgBpm: number;
  /** 최대 심박수 (bpm) */
  maxBpm: number;
  /** 심박 변이도 (ms) — 스트레스 지표 */
  hrvMs: number | null;
  source: HealthPlatform;
}

// ============================================
// 활동 데이터
// ============================================

export interface ActivityRecord {
  date: string;
  /** 걸음수 */
  steps: number;
  /** 활동 칼로리 (kcal) */
  activeCalories: number;
  /** 이동 거리 (m) */
  distanceMeters: number;
  /** 운동 시간 (분) */
  exerciseMinutes: number;
  source: HealthPlatform;
}

// ============================================
// 통합 일일 건강 데이터
// ============================================

export interface DailyHealthData {
  date: string;
  sleep: SleepRecord | null;
  heartRate: HeartRateRecord | null;
  activity: ActivityRecord | null;
}

// ============================================
// 수면-피부 상관 분석 결과
// ============================================

export type SleepSkinImpact = 'positive' | 'neutral' | 'negative';

export interface SleepSkinCorrelation {
  /** 분석 기간 (일 수) */
  periodDays: number;
  /** 평균 수면 점수 */
  avgSleepScore: number;
  /** 수면 품질 트렌드 */
  sleepTrend: 'improving' | 'declining' | 'stable';
  /** 피부 영향 예측 */
  skinImpact: SleepSkinImpact;
  /** 피부 영향 상세 */
  skinImpactDetails: string[];
  /** 운동 강도 조정 권장 */
  workoutAdjustment: 'increase' | 'maintain' | 'decrease';
  /** 권장 사항 */
  recommendations: string[];
}

// ============================================
// 데이터 동의
// ============================================

export type ConsentScope = 'sleep' | 'heart_rate' | 'steps' | 'activity' | 'stress';

export interface HealthDataConsent {
  userId: string;
  /** 동의한 데이터 범위 */
  scopes: ConsentScope[];
  /** 연결된 플랫폼 */
  platform: HealthPlatform;
  /** 동의 일시 (ISO) */
  consentedAt: string;
  /** 동의 철회 일시 */
  revokedAt: string | null;
  /** GDPR: 데이터 보관 기간 (일) */
  retentionDays: number;
}

// ============================================
// 어댑터 인터페이스
// ============================================

export interface HealthDeviceAdapter {
  platform: HealthPlatform;
  /** 연결 상태 확인 */
  isConnected(): Promise<boolean>;
  /** 권한 요청 */
  requestPermissions(scopes: ConsentScope[]): Promise<boolean>;
  /** 수면 데이터 조회 */
  fetchSleepData(startDate: string, endDate: string): Promise<SleepRecord[]>;
  /** 심박수 데이터 조회 */
  fetchHeartRateData(startDate: string, endDate: string): Promise<HeartRateRecord[]>;
  /** 활동 데이터 조회 */
  fetchActivityData(startDate: string, endDate: string): Promise<ActivityRecord[]>;
  /** 연결 해제 */
  disconnect(): Promise<void>;
}
