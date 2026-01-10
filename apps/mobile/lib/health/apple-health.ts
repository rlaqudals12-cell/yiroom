/**
 * Apple Health (HealthKit) 래퍼
 * iOS 전용 - react-native-health 기반
 */

import { Platform } from 'react-native';

import type {
  HealthPermissions,
  HealthPermissionType,
  StepCountData,
  ActiveCaloriesData,
  HeartRateData,
  HeartRateSummary,
  SleepSummary,
  BodyMassData,
  WorkoutRecord,
  WorkoutActivityType,
  HealthDataSummary,
  SyncState,
  SyncResult,
} from './types';
import { DEFAULT_HEALTH_PERMISSIONS } from './types';

interface HealthKitSample {
  value: number;
  startDate: string;
  endDate: string;
  sourceName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AppleHealthKit: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AppleHealthKit = require('react-native-health').default;
} catch {
  // Mock 모드
}

export function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios' && AppleHealthKit !== null;
}

function toHealthKitPermission(type: HealthPermissionType): string {
  const map: Record<HealthPermissionType, string> = {
    StepCount: 'StepCount',
    ActiveEnergyBurned: 'ActiveEnergyBurned',
    HeartRate: 'HeartRate',
    SleepAnalysis: 'SleepAnalysis',
    BodyMass: 'BodyMass',
    Height: 'Height',
    Workout: 'Workout',
    DietaryWater: 'Water',
    DietaryEnergyConsumed: 'EnergyConsumed',
  };
  return map[type];
}

export async function initializeHealthKit(
  permissions: HealthPermissions = DEFAULT_HEALTH_PERMISSIONS
): Promise<boolean> {
  if (!isHealthKitAvailable()) return false;
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(
      {
        permissions: {
          read: permissions.read.map(toHealthKitPermission),
          write: permissions.write.map(toHealthKitPermission),
        },
      },
      (error: Error | null) => resolve(!error)
    );
  });
}

export async function checkPermissions(
  permissions: HealthPermissions = DEFAULT_HEALTH_PERMISSIONS
): Promise<{ read: HealthPermissionType[]; write: HealthPermissionType[] }> {
  if (!isHealthKitAvailable()) return { read: [], write: [] };
  return new Promise((resolve) => {
    AppleHealthKit.getAuthStatus(
      {
        permissions: {
          read: permissions.read.map(toHealthKitPermission),
          write: permissions.write.map(toHealthKitPermission),
        },
      },
      (
        error: Error | null,
        results: { permissions: { read: string[]; write: string[] } }
      ) => {
        if (error) resolve({ read: [], write: [] });
        else
          resolve({
            read: permissions.read.filter((p) =>
              results.permissions.read.includes(toHealthKitPermission(p))
            ),
            write: permissions.write.filter((p) =>
              results.permissions.write.includes(toHealthKitPermission(p))
            ),
          });
      }
    );
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

// Mock 데이터
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

function getMockHeartRateDetails(): HeartRateData[] {
  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date();
    t.setHours(t.getHours() - i);
    return {
      date: t.toISOString().split('T')[0],
      timestamp: t.toISOString(),
      bpm: Math.floor(Math.random() * 30) + 65,
      source: 'Mock',
    };
  });
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
  if (!isHealthKitAvailable()) return getMockSteps();
  return new Promise((resolve) => {
    AppleHealthKit.getDailyStepCountSamples(
      getTodayRange(),
      (err: Error | null, res: HealthKitSample[]) => {
        if (err || !res?.length) return resolve(getMockSteps());
        resolve({
          date: new Date().toISOString().split('T')[0],
          steps: Math.round(res.reduce((s, r) => s + r.value, 0)),
          source: res[0]?.sourceName || 'Apple Health',
        });
      }
    );
  });
}

export async function getStepHistory(days = 7): Promise<StepCountData[]> {
  if (!isHealthKitAvailable()) return getMockStepHistory(days);
  return new Promise((resolve) => {
    AppleHealthKit.getDailyStepCountSamples(
      getDateRange(days),
      (err: Error | null, res: HealthKitSample[]) => {
        if (err || !res?.length) return resolve(getMockStepHistory(days));
        const byDate: Record<string, { steps: number; source: string }> = {};
        res.forEach((s) => {
          const d = s.startDate.split('T')[0];
          if (!byDate[d])
            byDate[d] = { steps: 0, source: s.sourceName || 'Apple Health' };
          byDate[d].steps += s.value;
        });
        resolve(
          Object.entries(byDate)
            .map(([date, data]) => ({
              date,
              steps: Math.round(data.steps),
              source: data.source,
            }))
            .sort((a, b) => b.date.localeCompare(a.date))
        );
      }
    );
  });
}

export async function getTodayActiveCalories(): Promise<ActiveCaloriesData | null> {
  if (!isHealthKitAvailable()) return getMockActiveCalories();
  return new Promise((resolve) => {
    AppleHealthKit.getActiveEnergyBurned(
      getTodayRange(),
      (err: Error | null, res: HealthKitSample[]) => {
        if (err || !res?.length) return resolve(getMockActiveCalories());
        resolve({
          date: new Date().toISOString().split('T')[0],
          calories: Math.round(res.reduce((s, r) => s + r.value, 0)),
          source: res[0]?.sourceName || 'Apple Health',
        });
      }
    );
  });
}

export async function getTodayHeartRate(): Promise<HeartRateSummary | null> {
  if (!isHealthKitAvailable()) return getMockHeartRateSummary();
  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateSamples(
      getTodayRange(),
      (err: Error | null, res: HealthKitSample[]) => {
        if (err || !res?.length) return resolve(getMockHeartRateSummary());
        const vals = res.map((r) => r.value);
        const sorted = [...vals].sort((a, b) => a - b);
        const restCount = Math.max(1, Math.floor(sorted.length * 0.1));
        resolve({
          date: new Date().toISOString().split('T')[0],
          average: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          min: Math.round(Math.min(...vals)),
          max: Math.round(Math.max(...vals)),
          resting: Math.round(
            sorted.slice(0, restCount).reduce((a, b) => a + b, 0) / restCount
          ),
        });
      }
    );
  });
}

export async function getHeartRateDetails(days = 1): Promise<HeartRateData[]> {
  if (!isHealthKitAvailable()) return getMockHeartRateDetails();
  return new Promise((resolve) => {
    AppleHealthKit.getHeartRateSamples(
      getDateRange(days),
      (err: Error | null, res: HealthKitSample[]) => {
        if (err || !res?.length) return resolve(getMockHeartRateDetails());
        resolve(
          res.map((s) => ({
            date: s.startDate.split('T')[0],
            timestamp: s.startDate,
            bpm: Math.round(s.value),
            source: s.sourceName || 'Apple Health',
          }))
        );
      }
    );
  });
}

export async function getLastNightSleep(): Promise<SleepSummary | null> {
  if (!isHealthKitAvailable()) return getMockSleepSummary();
  return new Promise((resolve) => {
    const now = new Date();
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    yest.setHours(18, 0, 0, 0);
    AppleHealthKit.getSleepSamples(
      { startDate: yest.toISOString(), endDate: now.toISOString() },
      (err: Error | null, res: (HealthKitSample & { value: string })[]) => {
        if (err || !res?.length) return resolve(getMockSleepSummary());
        let total = 0;
        let inBed = 0;
        let bedTimeStr: string | null = null;
        let wakeTimeStr: string | null = null;
        res.forEach((s) => {
          const st = new Date(s.startDate);
          const en = new Date(s.endDate);
          const dur = (en.getTime() - st.getTime()) / 60000;
          if (['ASLEEP', 'CORE', 'DEEP', 'REM'].includes(s.value)) total += dur;
          if (s.value === 'INBED') inBed += dur;
          if (!bedTimeStr || st.getTime() < new Date(bedTimeStr).getTime())
            bedTimeStr = st.toISOString();
          if (!wakeTimeStr || en.getTime() > new Date(wakeTimeStr).getTime())
            wakeTimeStr = en.toISOString();
        });
        const hrs = total / 60;
        resolve({
          date: new Date().toISOString().split('T')[0],
          totalSleepMinutes: Math.round(total),
          inBedMinutes: Math.round(inBed || total),
          sleepQuality:
            hrs >= 7 && hrs <= 9
              ? 'excellent'
              : hrs >= 6
                ? 'good'
                : hrs >= 5
                  ? 'fair'
                  : 'poor',
          bedTime: bedTimeStr,
          wakeTime: wakeTimeStr,
        });
      }
    );
  });
}

export async function getLatestWeight(): Promise<BodyMassData | null> {
  if (!isHealthKitAvailable()) return getMockWeight();
  return new Promise((resolve) => {
    AppleHealthKit.getLatestWeight(
      {},
      (err: Error | null, res: { value: number; startDate: string } | null) => {
        if (err || !res) return resolve(getMockWeight());
        resolve({
          date: res.startDate.split('T')[0],
          weight: Math.round(res.value * 10) / 10,
          source: 'Apple Health',
        });
      }
    );
  });
}

// 데이터 저장
function mapWorkoutType(type: WorkoutActivityType): string {
  const m: Record<WorkoutActivityType, string> = {
    Walking: 'Walking',
    Running: 'Running',
    Cycling: 'Cycling',
    Swimming: 'Swimming',
    Yoga: 'Yoga',
    StrengthTraining: 'TraditionalStrengthTraining',
    HIIT: 'HighIntensityIntervalTraining',
    Dance: 'Dance',
    Pilates: 'Pilates',
    FunctionalTraining: 'FunctionalStrengthTraining',
    Other: 'Other',
  };
  return m[type] || 'Other';
}

export async function saveWorkout(workout: WorkoutRecord): Promise<boolean> {
  if (!isHealthKitAvailable()) return true;
  return new Promise((resolve) => {
    AppleHealthKit.saveWorkout(
      {
        type: mapWorkoutType(workout.type),
        startDate: workout.startTime,
        endDate: workout.endTime,
        energyBurned: workout.energyBurned,
        distance: workout.distance,
      },
      (err: Error | null) => resolve(!err)
    );
  });
}

export async function saveWaterIntake(
  ml: number,
  date = new Date()
): Promise<boolean> {
  if (!isHealthKitAvailable()) return true;
  return new Promise((resolve) => {
    AppleHealthKit.saveWater({ value: ml, date }, (err: Error | null) =>
      resolve(!err)
    );
  });
}

export async function saveCalorieIntake(
  cal: number,
  date = new Date()
): Promise<boolean> {
  if (!isHealthKitAvailable()) return true;
  return new Promise((resolve) => {
    AppleHealthKit.saveFood({ value: cal, date }, (err: Error | null) =>
      resolve(!err)
    );
  });
}

// 집계
export async function getTodayHealthSummary(): Promise<HealthDataSummary> {
  const [steps, cal, hr, sleep, wt] = await Promise.all([
    getTodaySteps(),
    getTodayActiveCalories(),
    getTodayHeartRate(),
    getLastNightSleep(),
    getLatestWeight(),
  ]);
  return {
    date: new Date().toISOString().split('T')[0],
    steps: steps?.steps || 0,
    activeCalories: cal?.calories || 0,
    heartRate: hr,
    sleep,
    weight: wt?.weight || null,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getSyncState(): Promise<SyncState> {
  if (!isHealthKitAvailable())
    return {
      lastSyncTime: null,
      isEnabled: false,
      permissions: { read: [], write: [] },
    };
  const perms = await checkPermissions();
  return {
    lastSyncTime: null,
    isEnabled: perms.read.length > 0,
    permissions: perms,
  };
}

export async function performFullSync(): Promise<SyncResult> {
  const t = new Date().toISOString();
  try {
    const s = await getTodayHealthSummary();
    return {
      success: true,
      syncedAt: t,
      itemsSynced: {
        steps: s.steps > 0 ? 1 : 0,
        calories: s.activeCalories > 0 ? 1 : 0,
        heartRate: s.heartRate ? 1 : 0,
        sleep: s.sleep ? 1 : 0,
        workouts: 0,
      },
    };
  } catch (e) {
    return {
      success: false,
      syncedAt: t,
      itemsSynced: {
        steps: 0,
        calories: 0,
        heartRate: 0,
        sleep: 0,
        workouts: 0,
      },
      errors: [e instanceof Error ? e.message : '동기화 실패'],
    };
  }
}
