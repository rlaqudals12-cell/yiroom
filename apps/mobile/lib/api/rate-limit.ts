/**
 * 클라이언트 사이드 Rate Limiting
 * AsyncStorage 기반 일일 API 호출 카운터
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { geminiLogger } from '../utils/logger';

// 일일 분석 호출 제한
const DAILY_LIMIT = 50;
const STORAGE_KEY = '@yiroom/rate-limit';

interface RateLimitData {
  count: number;
  date: string; // YYYY-MM-DD
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

async function getData(): Promise<RateLimitData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, date: getTodayKey() };

    const data: RateLimitData = JSON.parse(raw);

    // 날짜가 바뀌면 카운터 리셋
    if (data.date !== getTodayKey()) {
      return { count: 0, date: getTodayKey() };
    }

    return data;
  } catch {
    return { count: 0, date: getTodayKey() };
  }
}

/**
 * Rate limit 초과 여부 확인
 * @returns true면 호출 가능, false면 제한 초과
 */
export async function checkRateLimit(): Promise<boolean> {
  const data = await getData();
  return data.count < DAILY_LIMIT;
}

/**
 * API 호출 카운터 증가
 */
export async function incrementRateLimit(): Promise<void> {
  const data = await getData();
  const updated: RateLimitData = {
    count: data.count + 1,
    date: getTodayKey(),
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    geminiLogger.warn('Rate limit counter update failed');
  }
}

/**
 * 현재 Rate limit 상태 조회
 */
export async function getRateLimitInfo(): Promise<{
  used: number;
  remaining: number;
  limit: number;
}> {
  const data = await getData();
  return {
    used: data.count,
    remaining: Math.max(0, DAILY_LIMIT - data.count),
    limit: DAILY_LIMIT,
  };
}
