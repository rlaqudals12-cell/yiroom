/**
 * Apple Health 연동 타입 정의
 */

export type HealthPermissionType =
  | 'StepCount'
  | 'ActiveEnergyBurned'
  | 'HeartRate'
  | 'SleepAnalysis'
  | 'BodyMass'
  | 'Height'
  | 'Workout'
  | 'DietaryWater'
  | 'DietaryEnergyConsumed';

export interface HealthPermissions {
  read: HealthPermissionType[];
  write: HealthPermissionType[];
}

export const DEFAULT_HEALTH_PERMISSIONS: HealthPermissions = {
  read: [
    'StepCount',
    'ActiveEnergyBurned',
    'HeartRate',
    'SleepAnalysis',
    'BodyMass',
    'Height',
  ],
  write: ['Workout', 'DietaryWater', 'DietaryEnergyConsumed'],
};

export interface StepCountData {
  date: string;
  steps: number;
  source: string;
}

export interface ActiveCaloriesData {
  date: string;
  calories: number;
  source: string;
}

export interface HeartRateData {
  date: string;
  timestamp: string;
  bpm: number;
  source: string;
}

export interface HeartRateSummary {
  date: string;
  average: number;
  min: number;
  max: number;
  resting: number | null;
}

export interface SleepData {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  sleepType: 'asleep' | 'awake' | 'inBed' | 'core' | 'deep' | 'rem';
  source: string;
}

export interface SleepSummary {
  date: string;
  totalSleepMinutes: number;
  inBedMinutes: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  bedTime: string | null;
  wakeTime: string | null;
}

export interface BodyMassData {
  date: string;
  weight: number;
  source: string;
}

export interface WorkoutRecord {
  type: WorkoutActivityType;
  startTime: Date;
  endTime: Date;
  duration: number;
  energyBurned?: number;
  distance?: number;
}

export type WorkoutActivityType =
  | 'Walking'
  | 'Running'
  | 'Cycling'
  | 'Swimming'
  | 'Yoga'
  | 'StrengthTraining'
  | 'HIIT'
  | 'Dance'
  | 'Pilates'
  | 'FunctionalTraining'
  | 'Other';

export interface SyncState {
  lastSyncTime: string | null;
  isEnabled: boolean;
  permissions: { read: HealthPermissionType[]; write: HealthPermissionType[] };
}

export interface SyncResult {
  success: boolean;
  syncedAt: string;
  itemsSynced: {
    steps: number;
    calories: number;
    heartRate: number;
    sleep: number;
    workouts: number;
  };
  errors?: string[];
}

export interface HealthDataSummary {
  date: string;
  steps: number;
  activeCalories: number;
  heartRate: HeartRateSummary | null;
  sleep: SleepSummary | null;
  weight: number | null;
  lastUpdated: string;
}

export interface HealthSyncRequest {
  stepData?: StepCountData[];
  calorieData?: ActiveCaloriesData[];
  sleepData?: SleepSummary[];
  heartRateData?: HeartRateSummary[];
  weightData?: BodyMassData[];
}

export interface HealthSyncResponse {
  success: boolean;
  message: string;
  syncedItems: number;
}
