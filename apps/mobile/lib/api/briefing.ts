/**
 * 아침 브리핑 HTTP 클라이언트 (웹 API 재사용) — ADR-118 thin client
 *
 * @module lib/api/briefing
 * @description
 *   웹 GET /api/briefing를 모바일에서 호출한다. 문장·배색은 서버(assembleBriefing)가
 *   조립하므로 모바일은 렌더만 한다(조립 로직 복제 없음). Clerk JWT를 Bearer로 전달.
 *
 *   오프라인 지원: 성공 응답을 날짜 키로 AsyncStorage에 캐시하고, 네트워크/서버 실패 시
 *   마지막 브리핑을 stale로 반환한다(홈이 비지 않게). 캐시도 없으면 에러를 던진다.
 *
 * @see apps/web/app/api/briefing/route.ts
 * @see docs/adr/ADR-118-mobile-parity-thin-client.md
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiBaseUrl } from './base-url';
import { clearCacheByPrefix } from '../offline/cache';

// ============================================
// 1. 타입 (웹 라우트 응답 data와 동기화)
// ============================================

export type BriefingTimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

/** 브리핑 문장 — 인사/맺음말은 항상, 관찰/조언은 데이터 있을 때만(정직성 가드) */
export interface BriefingSentences {
  greeting: string;
  observation?: string;
  advice: string[];
  closing: string;
}

export interface BriefingSwatch {
  name: string;
  hex: string;
}

/** 나의 퍼스널컬러 — PC 분석 베스트 컬러가 있을 때만 */
export interface BriefingMyColors {
  analysisId: string;
  colors: BriefingSwatch[];
}

export interface BriefingOutfitColor {
  hex: string;
  role: string;
  name: string;
}

export interface BriefingClosetOutfitItem {
  id: string;
  name: string;
  imageUrl: string;
  role: string;
}

export interface BriefingClosetOutfit {
  items: BriefingClosetOutfitItem[];
  warnings: string[];
}

export interface BriefingTodayStyle {
  fashionTip: string | null;
  outfit: { baseName: string; colors: BriefingOutfitColor[] } | null;
  /** 이전 오프라인 캐시에는 없을 수 있어 optional — 없으면 기존 팔레트로 폴백 */
  closetOutfit?: BriefingClosetOutfit | null;
  /** undefined/null은 미조회·실패, 0만 실제 빈 옷장 */
  closetItemCount?: number | null;
  /** true면 3장짜리 코디를 완성할 실제 슬롯이 부족하다. */
  closetNeedsMoreItems?: boolean | null;
}

export interface BriefingData {
  date: string;
  timeSlot: BriefingTimeSlot;
  briefing: BriefingSentences;
  myColors: BriefingMyColors | null;
  todayStyle: BriefingTodayStyle;
  hasAnalyses: boolean;
}

/** fetchBriefing 결과 — stale=true면 오프라인 캐시(마지막 브리핑) */
export interface BriefingResult {
  data: BriefingData;
  stale: boolean;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class BriefingApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'BriefingApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================
// 3. 캐시 (AsyncStorage)
// ============================================

const CACHE_PREFIX = 'briefing:';
const LEGACY_LATEST_KEY = 'briefing:latest';

function latestCacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}:latest`;
}

function datedCacheKey(userId: string, date: string): string {
  return `${CACHE_PREFIX}${userId}:${date}`;
}

/** 로그아웃·계정 전환 때 해당 사용자의 브리핑과 서명 URL 스냅샷을 함께 폐기한다. */
export async function clearBriefingCache(userId: string): Promise<void> {
  await Promise.all([
    clearCacheByPrefix(`${CACHE_PREFIX}${userId}:`),
    AsyncStorage.removeItem(LEGACY_LATEST_KEY),
  ]);
}

function toCacheSafeData(data: BriefingData): BriefingData {
  return {
    ...data,
    todayStyle: {
      ...data.todayStyle,
      // signed URL은 24시간 뒤 만료된다. 영구 캐시에는 넣지 않고 오프라인에서 팔레트로 폴백한다.
      closetOutfit: null,
    },
  };
}

async function writeCache(userId: string, data: BriefingData): Promise<void> {
  try {
    const json = JSON.stringify(toCacheSafeData(data));
    // 왜: 브리핑에는 개인 진단과 옷 사진 서명 URL이 있으므로 계정 경계를 캐시 키에도 둔다.
    await AsyncStorage.multiSet([
      [latestCacheKey(userId), json],
      [datedCacheKey(userId, data.date), json],
    ]);
  } catch {
    /* 스토리지 용량 초과 등 — 캐시는 베스트 에포트 */
  }
}

async function readCache(userId: string): Promise<BriefingData | null> {
  try {
    const raw = await AsyncStorage.getItem(latestCacheKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as BriefingData;
  } catch {
    return null;
  }
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

/**
 * 브리핑 조회.
 *
 * @param clerkToken Clerk JWT (getToken()으로 획득)
 * @param userId 캐시를 격리할 Clerk 사용자 ID
 * @param baseUrl 웹 API base URL (미지정 시 getApiBaseUrl()이 env·프로덕션 웹 순으로 해석)
 * @returns 신선한 브리핑(stale:false) 또는 오프라인 캐시(stale:true)
 * @throws BriefingApiError 설정 누락·캐시 없는 네트워크/서버 실패
 */
export async function fetchBriefing(
  clerkToken: string,
  userId: string,
  baseUrl?: string
): Promise<BriefingResult> {
  const url = getApiBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(`${url}/api/briefing`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        // 서버사이드 계측용 플랫폼 식별 (통합분석과 동일 관례 — ADR-103)
        'x-yiroom-client': 'mobile',
      },
    });
  } catch {
    // 네트워크 실패 → 마지막 브리핑으로 폴백(홈이 비지 않게)
    const cached = await readCache(userId);
    if (cached) return { data: cached, stale: true };
    throw new BriefingApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: { success?: boolean; data?: BriefingData; error?: string; code?: string } = {};
  try {
    json = (await response.json()) as typeof json;
  } catch {
    json = {};
  }

  if (!response.ok || json.success !== true || !json.data) {
    // 서버/인증 오류라도 캐시가 있으면 stale로라도 보여준다
    const cached = await readCache(userId);
    if (cached) return { data: cached, stale: true };
    throw new BriefingApiError(
      json.error ?? '브리핑을 불러올 수 없어요.',
      response.status,
      json.code
    );
  }

  await writeCache(userId, json.data);
  return { data: json.data, stale: false };
}
