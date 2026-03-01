/**
 * session-storage — AsyncStorage 기반 분석 결과 캐시 폴백
 *
 * 네트워크 오류 시 마지막 분석 결과를 캐시에서 복원한다.
 * TTL 기반 자동 만료 (기본 24시간).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@yiroom/cache/';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24시간

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * 분석 결과를 캐시에 저장
 *
 * @param key - 캐시 키 (예: 'analysis/skin/latest')
 * @param data - 저장할 데이터
 * @param ttlMs - 유효 시간 (밀리초, 기본 24시간)
 */
export async function cacheResult<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };

  await AsyncStorage.setItem(
    CACHE_PREFIX + key,
    JSON.stringify(entry),
  );
}

/**
 * 캐시에서 분석 결과 복원
 *
 * @param key - 캐시 키
 * @returns 캐시된 데이터 또는 null (만료/미존재)
 */
export async function getCachedResult<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
  if (!raw) return null;

  const entry: CacheEntry<T> = JSON.parse(raw);

  // 만료 확인
  if (Date.now() > entry.expiresAt) {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }

  return entry.data;
}

/**
 * 특정 캐시 항목 삭제
 */
export async function removeCachedResult(key: string): Promise<void> {
  await AsyncStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * 모든 캐시 항목 삭제 (만료된 것만)
 */
export async function clearExpiredCache(): Promise<number> {
  const allKeys = await AsyncStorage.getAllKeys();
  const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));

  let removedCount = 0;

  for (const fullKey of cacheKeys) {
    const raw = await AsyncStorage.getItem(fullKey);
    if (!raw) continue;

    const entry: CacheEntry<unknown> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(fullKey);
      removedCount++;
    }
  }

  return removedCount;
}

/**
 * 네트워크 우선 + 캐시 폴백 패턴
 *
 * @param key - 캐시 키
 * @param fetchFn - 네트워크 요청 함수
 * @param ttlMs - 캐시 TTL
 * @returns { data, fromCache } — fromCache가 true이면 캐시에서 복원됨
 */
export async function fetchWithCacheFallback<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const data = await fetchFn();
    // 네트워크 성공 → 캐시 갱신
    await cacheResult(key, data, ttlMs);
    return { data, fromCache: false };
  } catch {
    // 네트워크 실패 → 캐시 폴백
    const cached = await getCachedResult<T>(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
    // 캐시도 없으면 원래 에러 전파
    throw new Error('네트워크 오류가 발생했고 캐시된 데이터도 없습니다.');
  }
}

/** 모듈별 캐시 키 헬퍼 */
export const CacheKeys = {
  analysisResult: (module: string): string => `analysis/${module}/latest`,
  userProfile: (): string => 'user/profile',
  recommendations: (module: string): string => `recommendations/${module}`,
  wellnessScore: (): string => 'wellness/score',
} as const;
