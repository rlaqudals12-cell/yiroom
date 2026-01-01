/**
 * 데이터 캐싱 유틸리티
 * AsyncStorage 기반 오프라인 캐싱
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { CacheMetadata, DEFAULT_CACHE_TTL } from './types';

// 캐시 항목 구조
interface CacheItem<T> {
  data: T;
  metadata: CacheMetadata;
}

/**
 * 캐시에 데이터 저장
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<void> {
  try {
    const now = new Date();
    const item: CacheItem<T> = {
      data,
      metadata: {
        key,
        expiresAt: ttl > 0 ? new Date(now.getTime() + ttl).toISOString() : null,
        updatedAt: now.toISOString(),
        version: 1,
      },
    };

    await AsyncStorage.setItem(key, JSON.stringify(item));
    console.log('[Cache] Saved:', key);
  } catch (error) {
    console.error('[Cache] Failed to save:', key, error);
    throw error;
  }
}

/**
 * 캐시에서 데이터 조회
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const item: CacheItem<T> = JSON.parse(stored);

    // 만료 확인
    if (item.metadata.expiresAt) {
      const expiresAt = new Date(item.metadata.expiresAt);
      if (expiresAt < new Date()) {
        console.log('[Cache] Expired:', key);
        await removeCache(key);
        return null;
      }
    }

    console.log('[Cache] Hit:', key);
    return item.data;
  } catch (error) {
    console.error('[Cache] Failed to get:', key, error);
    return null;
  }
}

/**
 * 캐시 삭제
 */
export async function removeCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
    console.log('[Cache] Removed:', key);
  } catch (error) {
    console.error('[Cache] Failed to remove:', key, error);
  }
}

/**
 * 캐시 메타데이터 조회
 */
export async function getCacheMetadata(
  key: string
): Promise<CacheMetadata | null> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const item = JSON.parse(stored);
    return item.metadata || null;
  } catch (error) {
    console.error('[Cache] Failed to get metadata:', key, error);
    return null;
  }
}

/**
 * 캐시 존재 여부 확인
 */
export async function hasCache(key: string): Promise<boolean> {
  const data = await getCache(key);
  return data !== null;
}

/**
 * 캐시 유효 여부 확인
 */
export async function isCacheValid(key: string): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata(key);
    if (!metadata) {
      return false;
    }

    if (metadata.expiresAt) {
      return new Date(metadata.expiresAt) > new Date();
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 모든 캐시 삭제 (특정 접두사)
 */
export async function clearCacheByPrefix(prefix: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const keysToRemove = keys.filter((key) => key.startsWith(prefix));

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('[Cache] Cleared by prefix:', prefix, keysToRemove.length);
    }
  } catch (error) {
    console.error('[Cache] Failed to clear by prefix:', prefix, error);
  }
}

/**
 * 전체 캐시 삭제
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith('@yiroom_cache'));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('[Cache] Cleared all:', cacheKeys.length);
    }
  } catch (error) {
    console.error('[Cache] Failed to clear all:', error);
  }
}

/**
 * 캐시 또는 네트워크에서 데이터 조회
 * 캐시 우선, 실패 시 네트워크 호출
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  // 캐시 먼저 확인
  const cached = await getCache<T>(key);
  if (cached !== null) {
    // 백그라운드에서 갱신 (stale-while-revalidate)
    fetchFn()
      .then((data) => setCache(key, data, ttl))
      .catch((error) =>
        console.error('[Cache] Background refresh failed:', error)
      );

    return cached;
  }

  // 캐시 없으면 네트워크 호출
  const data = await fetchFn();
  await setCache(key, data, ttl);
  return data;
}
