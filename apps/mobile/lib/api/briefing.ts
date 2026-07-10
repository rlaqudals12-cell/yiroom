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

export interface BriefingTodayStyle {
  fashionTip: string | null;
  outfit: { baseName: string; colors: BriefingOutfitColor[] } | null;
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

const LATEST_KEY = 'briefing:latest';
const DATE_PREFIX = 'briefing:';

async function writeCache(data: BriefingData): Promise<void> {
  try {
    const json = JSON.stringify(data);
    // 최신 포인터 + 날짜별 스냅샷(당일/전일 구분용)
    await AsyncStorage.multiSet([
      [LATEST_KEY, json],
      [`${DATE_PREFIX}${data.date}`, json],
    ]);
  } catch {
    /* 스토리지 용량 초과 등 — 캐시는 베스트 에포트 */
  }
}

async function readCache(): Promise<BriefingData | null> {
  try {
    const raw = await AsyncStorage.getItem(LATEST_KEY);
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
 * @param baseUrl 웹 API base URL (기본: EXPO_PUBLIC_YIROOM_API_URL)
 * @returns 신선한 브리핑(stale:false) 또는 오프라인 캐시(stale:true)
 * @throws BriefingApiError 설정 누락·캐시 없는 네트워크/서버 실패
 */
export async function fetchBriefing(clerkToken: string, baseUrl?: string): Promise<BriefingResult> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new BriefingApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }

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
    const cached = await readCache();
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
    const cached = await readCache();
    if (cached) return { data: cached, stale: true };
    throw new BriefingApiError(
      json.error ?? '브리핑을 불러올 수 없어요.',
      response.status,
      json.code
    );
  }

  await writeCache(json.data);
  return { data: json.data, stale: false };
}
