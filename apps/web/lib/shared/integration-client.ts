/**
 * Cross-Module Integration Client
 * CMP-A3: 연동 클라이언트
 *
 * @module lib/shared/integration-client
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 *
 * Pull 방식 데이터 조회를 위한 클라이언트
 * 조회 우선순위: 캐시 → DB → 기본값 (Fallback)
 */

import type {
  SourceModule,
  TargetModule,
  IntegrationMetadata,
  PC2ToM1IntegrationData,
  PC2ToH1IntegrationData,
  S2ToSK1IntegrationData,
  S2ToM1IntegrationData,
  C2ToW2IntegrationData,
  OH1ToN1IntegrationData,
  CIE3ToAnalysisData,
  CIE4ToAnalysisData,
} from './integration-types';

import { DEFAULT_INTEGRATION_DATA } from './integration-types';

import {
  IntegrationDataNotFoundError,
  IntegrationTimeoutError,
  handleIntegrationError,
  type IntegrationResult,
} from './integration-error';

// ============================================
// 타입 정의
// ============================================

export interface FetchOptions {
  /** 캐시 최대 유효 시간 (ms) - 기본 24시간 */
  maxAge?: number;
  /** Fallback 허용 여부 - 기본 true */
  fallbackToDefault?: boolean;
  /** 타임아웃 (ms) - 기본 5000ms */
  timeout?: number;
  /** 캐시 무시 (강제 새로고침) */
  skipCache?: boolean;
}

export interface CachedData<T> {
  data: T;
  metadata: IntegrationMetadata;
  cachedAt: string;
  expiresAt?: string;
}

// 연동 타입 매핑
export type IntegrationDataType<T extends SourceModule> = T extends 'PC-2'
  ? PC2ToM1IntegrationData | PC2ToH1IntegrationData
  : T extends 'S-2'
    ? S2ToSK1IntegrationData | S2ToM1IntegrationData
    : T extends 'C-2'
      ? C2ToW2IntegrationData
      : T extends 'OH-1'
        ? OH1ToN1IntegrationData
        : T extends 'CIE-3'
          ? CIE3ToAnalysisData
          : T extends 'CIE-4'
            ? CIE4ToAnalysisData
            : unknown;

// ============================================
// 캐시 저장소 (메모리 기반)
// ============================================

const memoryCache: Map<string, CachedData<unknown>> = new Map();

/**
 * 캐시 키 생성
 */
function getCacheKey(sourceModule: SourceModule, userId: string): string {
  return `integration:${sourceModule}:${userId}`;
}

/**
 * 캐시 만료 여부 확인
 */
function isExpired(cached: CachedData<unknown>, maxAge: number): boolean {
  const cachedTime = new Date(cached.cachedAt).getTime();
  const now = Date.now();
  return now - cachedTime > maxAge;
}

// ============================================
// 캐시 조회/저장
// ============================================

/**
 * 캐시에서 연동 데이터 조회
 */
async function getCachedIntegration<T>(
  sourceModule: SourceModule,
  userId: string
): Promise<CachedData<T> | null> {
  const cacheKey = getCacheKey(sourceModule, userId);
  const cached = memoryCache.get(cacheKey);
  return cached as CachedData<T> | null;
}

/**
 * 캐시에 연동 데이터 저장
 */
async function cacheIntegration<T>(
  sourceModule: SourceModule,
  userId: string,
  data: T,
  metadata: IntegrationMetadata
): Promise<void> {
  const cacheKey = getCacheKey(sourceModule, userId);
  memoryCache.set(cacheKey, {
    data,
    metadata,
    cachedAt: new Date().toISOString(),
  });
}

/**
 * 캐시 삭제
 */
export async function invalidateCache(
  sourceModule: SourceModule,
  userId: string
): Promise<void> {
  const cacheKey = getCacheKey(sourceModule, userId);
  memoryCache.delete(cacheKey);
}

/**
 * 사용자의 모든 캐시 삭제
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  for (const key of memoryCache.keys()) {
    if (key.endsWith(`:${userId}`)) {
      memoryCache.delete(key);
    }
  }
}

// ============================================
// DB 조회 (Mock)
// ============================================

/**
 * DB에서 최신 분석 결과 조회
 * 실제 구현에서는 Supabase 클라이언트 사용
 */
async function getLatestAnalysis<T>(
  sourceModule: SourceModule,
  userId: string
): Promise<{ data: T; metadata: IntegrationMetadata } | null> {
  // 실제 구현:
  // const { data, error } = await supabase
  //   .from(getTableName(sourceModule))
  //   .select('*')
  //   .eq('clerk_user_id', userId)
  //   .order('created_at', { ascending: false })
  //   .limit(1)
  //   .single();

  // Mock: 항상 null 반환 (Fallback 테스트)
  return null;
}

/** 모든 모듈 타입 (소스 + 타겟) */
type AllModules = SourceModule | TargetModule | 'W-1';

/**
 * 모듈별 테이블명 반환
 */
export function getTableName(module: SourceModule | TargetModule | string): string {
  const tables: Record<AllModules, string> = {
    'PC-1': 'personal_color_assessments',
    'PC-2': 'personal_color_v2_assessments',
    'S-1': 'skin_assessments',
    'S-2': 'skin_v2_assessments',
    'C-1': 'body_assessments',
    'C-2': 'body_v2_assessments',
    'OH-1': 'oral_health_assessments',
    'CIE-1': 'image_quality_checks',
    'CIE-2': 'face_detections',
    'CIE-3': 'awb_corrections',
    'CIE-4': 'lighting_analyses',
    'M-1': 'makeup_recommendations',
    'H-1': 'hair_recommendations',
    'SK-1': 'procedure_recommendations',
    'W-1': 'workout_plans',
    'W-2': 'stretching_plans',
    'N-1': 'nutrition_assessments',
    'Report': 'reports',
  };
  return tables[module as AllModules] ?? module.toLowerCase().replace('-', '_');
}

// ============================================
// 기본값 (Fallback) 조회
// ============================================

/**
 * 연동 기본값 반환
 */
export function getDefaultIntegrationData<T>(
  sourceModule: SourceModule,
  targetModule?: string
): T {
  const key = targetModule
    ? `${sourceModule}→${targetModule}`
    : sourceModule;

  // integration-types.ts의 DEFAULT_INTEGRATION_DATA 사용
  const defaultData = DEFAULT_INTEGRATION_DATA[key as keyof typeof DEFAULT_INTEGRATION_DATA];

  if (defaultData) {
    return defaultData as T;
  }

  // 모듈별 기본 Fallback (SourceModule만)
  const moduleDefaults: Record<SourceModule, unknown> = {
    'PC-1': {
      season: 'summer',
      subType: 'summer-mute',
      confidence: 50,
    },
    'PC-2': {
      season: 'summer',
      subType: 'summer-mute',
      recommendedColors: [],
      avoidColors: [],
      skinTone: 'neutral',
      contrastLevel: 'medium',
      confidence: 50,
    },
    'S-1': {
      skinType: 'combination',
      confidence: 50,
    },
    'S-2': {
      skinType: 'combination',
      tZoneOiliness: 50,
      poreVisibility: 50,
      sensitivityLevel: 'medium',
      skinToneLab: { L: 70, a: 8, b: 18 },
      confidence: 50,
    },
    'C-1': {
      bodyType: 'average',
      confidence: 50,
    },
    'C-2': {
      postureType: 'normal',
      imbalanceAreas: [],
      asymmetryScore: 0,
      confidence: 50,
    },
    'OH-1': {
      gumHealth: 'normal',
      inflammationScore: 0,
      toothStaining: 'none',
      cavityRisk: 'low',
      confidence: 50,
    },
    'CIE-1': {
      isValid: true,
      sharpness: 50,
      resolution: { width: 1024, height: 1024 },
      qualityIssues: [],
      confidence: 80,
    },
    'CIE-2': {
      detected: false,
      landmarks: [],
      confidence: 0,
    },
    'CIE-3': {
      correctionApplied: false,
      confidence: 50,
    },
    'CIE-4': {
      lightingQuality: 'acceptable',
      uniformityScore: 70,
      confidence: 70,
    },
  };

  return (moduleDefaults[sourceModule] ?? {}) as T;
}

// ============================================
// 메인 조회 함수
// ============================================

/**
 * 소스 모듈의 연동 데이터 조회
 *
 * @example
 * const skinData = await fetchIntegrationData<S2ToSK1IntegrationData>(
 *   'S-2',
 *   userId,
 *   { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7일
 * );
 */
export async function fetchIntegrationData<T>(
  sourceModule: SourceModule,
  userId: string,
  options: FetchOptions = {}
): Promise<IntegrationResult<T>> {
  const {
    maxAge = 24 * 60 * 60 * 1000, // 24시간
    fallbackToDefault = true,
    timeout = 5000,
    skipCache = false,
  } = options;

  try {
    // 1. 캐시 확인 (skipCache가 아닌 경우)
    if (!skipCache) {
      const cached = await getCachedIntegration<T>(sourceModule, userId);
      if (cached && !isExpired(cached, maxAge)) {
        return {
          data: cached.data,
          fromCache: true,
        };
      }
    }

    // 2. DB에서 최신 결과 조회 (타임아웃 적용)
    const fetchPromise = getLatestAnalysis<T>(sourceModule, userId);
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(
        () => reject(new IntegrationTimeoutError(sourceModule, timeout)),
        timeout
      );
    });

    const latest = await Promise.race([fetchPromise, timeoutPromise]);

    if (latest) {
      // 3. 캐시 갱신
      await cacheIntegration(sourceModule, userId, latest.data, latest.metadata);
      return {
        data: latest.data,
        fromCache: false,
      };
    }

    // 4. 데이터 없음 - Fallback 처리
    if (fallbackToDefault) {
      const defaultData = getDefaultIntegrationData<T>(sourceModule);
      return {
        data: defaultData,
        fromCache: false,
        usedDefault: true,
        requiresAnalysis: true,
      };
    }

    // 5. Fallback 비활성화 시 에러
    throw new IntegrationDataNotFoundError(sourceModule, userId);
  } catch (error) {
    // 에러 처리
    if (error instanceof IntegrationDataNotFoundError ||
        error instanceof IntegrationTimeoutError) {
      if (fallbackToDefault) {
        const defaultData = getDefaultIntegrationData<T>(sourceModule);
        return handleIntegrationError(error, defaultData);
      }
      throw error;
    }

    // 예상치 못한 에러
    throw error;
  }
}

// ============================================
// 특화 조회 함수
// ============================================

/**
 * PC-2 → M-1 연동 데이터 조회
 */
export async function fetchPC2ForMakeup(
  userId: string,
  options?: FetchOptions
): Promise<IntegrationResult<PC2ToM1IntegrationData>> {
  return fetchIntegrationData<PC2ToM1IntegrationData>('PC-2', userId, options);
}

/**
 * PC-2 → H-1 연동 데이터 조회
 */
export async function fetchPC2ForHair(
  userId: string,
  options?: FetchOptions
): Promise<IntegrationResult<PC2ToH1IntegrationData>> {
  return fetchIntegrationData<PC2ToH1IntegrationData>('PC-2', userId, options);
}

/**
 * S-2 → SK-1 연동 데이터 조회
 */
export async function fetchS2ForProcedure(
  userId: string,
  options?: FetchOptions
): Promise<IntegrationResult<S2ToSK1IntegrationData>> {
  return fetchIntegrationData<S2ToSK1IntegrationData>('S-2', userId, options);
}

/**
 * S-2 → M-1 연동 데이터 조회
 */
export async function fetchS2ForMakeup(
  userId: string,
  options?: FetchOptions
): Promise<IntegrationResult<S2ToM1IntegrationData>> {
  return fetchIntegrationData<S2ToM1IntegrationData>('S-2', userId, options);
}

/**
 * C-2 → W-2 연동 데이터 조회
 */
export async function fetchC2ForStretching(
  userId: string,
  options?: FetchOptions
): Promise<IntegrationResult<C2ToW2IntegrationData>> {
  return fetchIntegrationData<C2ToW2IntegrationData>('C-2', userId, options);
}

/**
 * OH-1 → N-1 연동 데이터 조회
 */
export async function fetchOH1ForNutrition(
  userId: string,
  options?: FetchOptions
): Promise<IntegrationResult<OH1ToN1IntegrationData>> {
  return fetchIntegrationData<OH1ToN1IntegrationData>('OH-1', userId, options);
}

// ============================================
// 배치 조회
// ============================================

/**
 * 여러 소스 모듈 데이터 동시 조회
 */
export async function fetchMultipleIntegrationData(
  sourceModules: SourceModule[],
  userId: string,
  options?: FetchOptions
): Promise<Record<SourceModule, IntegrationResult<unknown>>> {
  const results = await Promise.all(
    sourceModules.map(async (module) => {
      const result = await fetchIntegrationData(module, userId, options);
      return [module, result] as const;
    })
  );

  return Object.fromEntries(results) as Record<SourceModule, IntegrationResult<unknown>>;
}

// ============================================
// 캐시 통계
// ============================================

export interface CacheStats {
  totalEntries: number;
  moduleBreakdown: Record<string, number>;
}

/**
 * 캐시 통계 반환
 */
export function getCacheStats(): CacheStats {
  const moduleBreakdown: Record<string, number> = {};

  for (const key of memoryCache.keys()) {
    const [, module] = key.split(':');
    moduleBreakdown[module] = (moduleBreakdown[module] ?? 0) + 1;
  }

  return {
    totalEntries: memoryCache.size,
    moduleBreakdown,
  };
}

/**
 * 캐시 전체 초기화 (테스트용)
 */
export function clearAllCache(): void {
  memoryCache.clear();
}
