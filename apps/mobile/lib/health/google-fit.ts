/**
 * Google Fit 래퍼
 * Android 전용 - react-native-google-fit 기반
 */

import { Platform } from 'react-native';

import type {
  HealthPermissions,
  HealthPermissionType,
  StepCountData,
  ActiveCaloriesData,
  HeartRateSummary,
  SleepSummary,
  BodyMassData,
  WorkoutRecord,
  WorkoutActivityType,
  HealthDataSummary,
  SyncState,
  SyncResult,
} from './types';

interface _GoogleFitSample {
  value: number;
  startDate: string;
  endDate: string;
  sourceName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GoogleFit: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GoogleFit = require('react-native-google-fit').default;
} catch {
  // Mock 모드
}

export function isGoogleFitAvailable(): boolean {
  return Platform.OS === 'android' && GoogleFit !== null;
}

// Google Fit 권한 매핑
function toGoogleFitScope(type: HealthPermissionType): string[] {
  const map: Record<HealthPermissionType, string[]> = {
    StepCount: ['https://www.googleapis.com/auth/fitness.activity.read'],
    ActiveEnergyBurned: [
      'https://www.googleapis.com/auth/fitness.activity.read',
    ],
    HeartRate: ['https://www.googleapis.com/auth/fitness.heart_rate.read'],
    SleepAnalysis: ['https://www.googleapis.com/auth/fitness.sleep.read'],
    BodyMass: ['https://www.googleapis.com/auth/fitness.body.read'],
    Height: ['https://www.googleapis.com/auth/fitness.body.read'],
    Workout: [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.activity.write',
    ],
    DietaryWater: ['https://www.googleapis.com/auth/fitness.nutrition.read'],
    DietaryEnergyConsumed: [
      'https://www.googleapis.com/auth/fitness.nutrition.read',
    ],
  };
  return map[type] || [];
}

export async function initializeGoogleFit(
  permissions: HealthPermissions = {
    read: [
      'StepCount',
      'ActiveEnergyBurned',
      'HeartRate',
      'SleepAnalysis',
      'BodyMass',
    ],
    write: ['Workout'],
  }
): Promise<boolean> {
  if (!isGoogleFitAvailable()) return false;

  return new Promise((resolve) => {
    const scopes = [...new Set(permissions.read.flatMap(toGoogleFitScope))];

    GoogleFit.authorize({
      scopes,
    })
      .then((authResult: { success: boolean }) => {
        resolve(authResult.success);
      })
      .catch(() => resolve(false));
  });
}

export async function checkGoogleFitPermissions(): Promise<{
  read: HealthPermissionType[];
  write: HealthPermissionType[];
}> {
  if (!isGoogleFitAvailable()) return { read: [], write: [] };

  return new Promise((resolve) => {
    GoogleFit.isAuthorized()
      .then((isAuthorized: boolean) => {
        if (isAuthorized) {
          resolve({
            read: [
              'StepCount',
              'ActiveEnergyBurned',
              'HeartRate',
              'SleepAnalysis',
              'BodyMass',
            ],
            write: ['Workout'],
          });
        } else {
          resolve({ read: [], write: [] });
        }
      })
      .catch(() => resolve({ read: [], write: [] }));
  });
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

function getDateRange(days: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

// Mock 데이터 (Apple Health와 동일)
function getMockSteps(): StepCountData {
  return {
    date: new Date().toISOString().split('T')[0],
    steps: Math.floor(Math.random() * 5000) + 3000,
    source: 'Mock',
  };
}

function getMockStepHistory(days: number): StepCountData[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      date: d.toISOString().split('T')[0],
      steps: Math.floor(Math.random() * 5000) + 3000,
      source: 'Mock',
    };
  });
}

function getMockActiveCalories(): ActiveCaloriesData {
  return {
    date: new Date().toISOString().split('T')[0],
    calories: Math.floor(Math.random() * 300) + 200,
    source: 'Mock',
  };
}

function getMockHeartRateSummary(): HeartRateSummary {
  const r = Math.floor(Math.random() * 10) + 60;
  return {
    date: new Date().toISOString().split('T')[0],
    average: r + 15,
    min: r,
    max: r + 50,
    resting: r,
  };
}

function getMockSleepSummary(): SleepSummary {
  const mins = Math.floor(Math.random() * 120) + 360;
  const bed = new Date();
  bed.setDate(bed.getDate() - 1);
  bed.setHours(23, Math.floor(Math.random() * 60), 0, 0);
  const wake = new Date(bed);
  wake.setMinutes(wake.getMinutes() + mins);
  return {
    date: new Date().toISOString().split('T')[0],
    totalSleepMinutes: mins,
    inBedMinutes: mins + 30,
    sleepQuality: mins >= 420 ? 'excellent' : mins >= 360 ? 'good' : 'fair',
    bedTime: bed.toISOString(),
    wakeTime: wake.toISOString(),
  };
}

function getMockWeight(): BodyMassData {
  return {
    date: new Date().toISOString().split('T')[0],
    weight: Math.floor(Math.random() * 20) + 60,
    source: 'Mock',
  };
}

// 데이터 조회
export async function getTodaySteps(): Promise<StepCountData | null> {
  if (!isGoogleFitAvailable()) return getMockSteps();

  return new Promise((resolve) => {
    const { startDate, endDate } = getTodayRange();

    GoogleFit.getDailyStepCountSamples({
      startDate,
      endDate,
    })
      .then(
        (
          results: {
            source: string;
            steps: { value: number; date: string }[];
          }[]
        ) => {
          // Google Fit은 여러 소스에서 데이터를 반환
          const mergedSource = results.find(
            (r) => r.source === 'com.google.android.gms:merge_step_deltas'
          );

          if (mergedSource && mergedSource.steps.length > 0) {
            const totalSteps = mergedSource.steps.reduce(
              (sum, s) => sum + s.value,
              0
            );
            resolve({
              date: new Date().toISOString().split('T')[0],
              steps: Math.round(totalSteps),
              source: 'Google Fit',
            });
          } else {
            resolve(getMockSteps());
          }
        }
      )
      .catch(() => resolve(getMockSteps()));
  });
}

export async function getStepHistory(days = 7): Promise<StepCountData[]> {
  if (!isGoogleFitAvailable()) return getMockStepHistory(days);

  return new Promise((resolve) => {
    const { startDate, endDate } = getDateRange(days);

    GoogleFit.getDailyStepCountSamples({
      startDate,
      endDate,
    })
      .then(
        (
          results: {
            source: string;
            steps: { value: number; date: string }[];
          }[]
        ) => {
          const mergedSource = results.find(
            (r) => r.source === 'com.google.android.gms:merge_step_deltas'
          );

          if (mergedSource && mergedSource.steps.length > 0) {
            const byDate: Record<string, number> = {};
            mergedSource.steps.forEach((s) => {
              const dateKey = s.date.split('T')[0];
              byDate[dateKey] = (byDate[dateKey] || 0) + s.value;
            });

            resolve(
              Object.entries(byDate)
                .map(([date, steps]) => ({
                  date,
                  steps: Math.round(steps),
                  source: 'Google Fit',
                }))
                .sort((a, b) => b.date.localeCompare(a.date))
            );
          } else {
            resolve(getMockStepHistory(days));
          }
        }
      )
      .catch(() => resolve(getMockStepHistory(days)));
  });
}

export async function getTodayActiveCalories(): Promise<ActiveCaloriesData | null> {
  if (!isGoogleFitAvailable()) return getMockActiveCalories();

  return new Promise((resolve) => {
    const { startDate, endDate } = getTodayRange();

    GoogleFit.getDailyCalorieSamples({
      startDate,
      endDate,
      basalCalculation: false, // 활동 칼로리만
    })
      .then(
        (
          results: { calorie: number; startDate: string; endDate: string }[]
        ) => {
          if (results && results.length > 0) {
            const totalCalories = results.reduce(
              (sum, r) => sum + r.calorie,
              0
            );
            resolve({
              date: new Date().toISOString().split('T')[0],
              calories: Math.round(totalCalories),
              source: 'Google Fit',
            });
          } else {
            resolve(getMockActiveCalories());
          }
        }
      )
      .catch(() => resolve(getMockActiveCalories()));
  });
}

export async function getTodayHeartRate(): Promise<HeartRateSummary | null> {
  if (!isGoogleFitAvailable()) return getMockHeartRateSummary();

  return new Promise((resolve) => {
    const { startDate, endDate } = getTodayRange();

    GoogleFit.getHeartRateSamples({
      startDate,
      endDate,
    })
      .then(
        (results: { value: number; startDate: string; endDate: string }[]) => {
          if (results && results.length > 0) {
            const values = results.map((r) => r.value);
            const sorted = [...values].sort((a, b) => a - b);
            const restingCount = Math.max(1, Math.floor(sorted.length * 0.1));

            resolve({
              date: new Date().toISOString().split('T')[0],
              average: Math.round(
                values.reduce((a, b) => a + b, 0) / values.length
              ),
              min: Math.round(Math.min(...values)),
              max: Math.round(Math.max(...values)),
              resting: Math.round(
                sorted.slice(0, restingCount).reduce((a, b) => a + b, 0) /
                  restingCount
              ),
            });
          } else {
            resolve(getMockHeartRateSummary());
          }
        }
      )
      .catch(() => resolve(getMockHeartRateSummary()));
  });
}

export async function getLastNightSleep(): Promise<SleepSummary | null> {
  if (!isGoogleFitAvailable()) return getMockSleepSummary();

  return new Promise((resolve) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 0, 0, 0);

    GoogleFit.getSleepSamples({
      startDate: yesterday.toISOString(),
      endDate: now.toISOString(),
    })
      .then(
        (
          results: {
            startDate: string;
            endDate: string;
            addedBy: string;
            granularity: { sleepStage: number }[];
          }[]
        ) => {
          if (results && results.length > 0) {
            let totalSleepMinutes = 0;
            let inBedMinutes = 0;
            let bedTime: string | null = null;
            let wakeTime: string | null = null;

            results.forEach((session) => {
              const start = new Date(session.startDate);
              const end = new Date(session.endDate);
              const durationMins = (end.getTime() - start.getTime()) / 60000;

              // Google Fit sleep stages: 1=Awake, 2=Sleep, 3=Out-of-bed, 4=Light, 5=Deep, 6=REM
              const sleepStages = session.granularity || [];
              const sleepMins = sleepStages.filter((g) =>
                [2, 4, 5, 6].includes(g.sleepStage)
              ).length;

              totalSleepMinutes += sleepMins > 0 ? sleepMins : durationMins;
              inBedMinutes += durationMins;

              if (!bedTime || start.getTime() < new Date(bedTime).getTime()) {
                bedTime = session.startDate;
              }
              if (!wakeTime || end.getTime() > new Date(wakeTime).getTime()) {
                wakeTime = session.endDate;
              }
            });

            const hours = totalSleepMinutes / 60;
            resolve({
              date: new Date().toISOString().split('T')[0],
              totalSleepMinutes: Math.round(totalSleepMinutes),
              inBedMinutes: Math.round(inBedMinutes),
              sleepQuality:
                hours >= 7 && hours <= 9
                  ? 'excellent'
                  : hours >= 6
                    ? 'good'
                    : hours >= 5
                      ? 'fair'
                      : 'poor',
              bedTime,
              wakeTime,
            });
          } else {
            resolve(getMockSleepSummary());
          }
        }
      )
      .catch(() => resolve(getMockSleepSummary()));
  });
}

export async function getLatestWeight(): Promise<BodyMassData | null> {
  if (!isGoogleFitAvailable()) return getMockWeight();

  return new Promise((resolve) => {
    const { startDate, endDate } = getDateRange(30); // 최근 30일

    GoogleFit.getWeightSamples({
      startDate,
      endDate,
    })
      .then(
        (results: { value: number; startDate: string; endDate: string }[]) => {
          if (results && results.length > 0) {
            // 가장 최근 데이터
            const latest = results.sort(
              (a, b) =>
                new Date(b.startDate).getTime() -
                new Date(a.startDate).getTime()
            )[0];

            resolve({
              date: latest.startDate.split('T')[0],
              weight: Math.round(latest.value * 10) / 10,
              source: 'Google Fit',
            });
          } else {
            resolve(getMockWeight());
          }
        }
      )
      .catch(() => resolve(getMockWeight()));
  });
}

// 운동 타입 매핑
function mapWorkoutTypeToGoogleFit(type: WorkoutActivityType): number {
  // Google Fit activity types
  const map: Record<WorkoutActivityType, number> = {
    Walking: 7, // Walking
    Running: 8, // Running
    Cycling: 1, // Biking
    Swimming: 82, // Swimming
    Yoga: 100, // Yoga
    StrengthTraining: 80, // Strength training
    HIIT: 79, // High intensity interval training
    Dance: 26, // Dancing
    Pilates: 76, // Pilates
    FunctionalTraining: 80, // Functional strength training -> Strength training
    Other: 108, // Other
  };
  return map[type] || 108;
}

export async function saveWorkout(workout: WorkoutRecord): Promise<boolean> {
  if (!isGoogleFitAvailable()) return true;

  return new Promise((resolve) => {
    GoogleFit.saveWorkout({
      activityType: mapWorkoutTypeToGoogleFit(workout.type),
      startDate: workout.startTime.toISOString(),
      endDate: workout.endTime.toISOString(),
      calories: workout.energyBurned || 0,
      distance: workout.distance || 0,
    })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

// 집계
export async function getTodayHealthSummary(): Promise<HealthDataSummary> {
  const [steps, calories, heartRate, sleep, weight] = await Promise.all([
    getTodaySteps(),
    getTodayActiveCalories(),
    getTodayHeartRate(),
    getLastNightSleep(),
    getLatestWeight(),
  ]);

  return {
    date: new Date().toISOString().split('T')[0],
    steps: steps?.steps || 0,
    activeCalories: calories?.calories || 0,
    heartRate,
    sleep,
    weight: weight?.weight || null,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getGoogleFitSyncState(): Promise<SyncState> {
  if (!isGoogleFitAvailable()) {
    return {
      lastSyncTime: null,
      isEnabled: false,
      permissions: { read: [], write: [] },
    };
  }

  const permissions = await checkGoogleFitPermissions();
  return {
    lastSyncTime: null,
    isEnabled: permissions.read.length > 0,
    permissions,
  };
}

export async function performGoogleFitSync(): Promise<SyncResult> {
  const timestamp = new Date().toISOString();

  try {
    const summary = await getTodayHealthSummary();

    return {
      success: true,
      syncedAt: timestamp,
      itemsSynced: {
        steps: summary.steps > 0 ? 1 : 0,
        calories: summary.activeCalories > 0 ? 1 : 0,
        heartRate: summary.heartRate ? 1 : 0,
        sleep: summary.sleep ? 1 : 0,
        workouts: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      syncedAt: timestamp,
      itemsSynced: {
        steps: 0,
        calories: 0,
        heartRate: 0,
        sleep: 0,
        workouts: 0,
      },
      errors: [error instanceof Error ? error.message : '동기화 실패'],
    };
  }
}
