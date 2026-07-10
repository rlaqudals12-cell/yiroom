/**
 * 오늘의 맞춤 루틴 HTTP 클라이언트 (웹 API 재사용) — ADR-118 thin client
 *
 * @module lib/api/routine
 * @description
 *   웹 GET /api/routine/daily를 모바일에서 호출한다. 고민 파생·케어 단계·shelf-우선 배치·
 *   스킨 사이클링은 서버(assembleDailyRoutine)가 조립하므로 모바일은 렌더만 한다(조립 복제 없음).
 *   Clerk JWT를 Bearer로 전달한다.
 *
 *   오프라인 지원: 성공 응답을 날짜 키로 AsyncStorage에 캐시하고, 네트워크/서버 실패 시
 *   마지막 루틴을 stale로 반환한다(화면이 비지 않게). 캐시도 없으면 에러를 던진다.
 *
 * @see apps/web/app/api/routine/daily/route.ts
 * @see apps/mobile/lib/api/briefing.ts (동일 패턴)
 * @see docs/adr/ADR-118-mobile-parity-thin-client.md
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// 1. 타입 (웹 라우트 응답 data와 동기화)
// ============================================

export type CarePhaseId = 'barrier' | 'goal';
export type CyclingFocus = 'exfoliation' | 'retinoid' | 'recovery' | 'active';

/** 스텝 사용법(초보자 how-to) */
export interface StepHowToData {
  amount: string;
  method: string;
  waitTime?: string;
  tips?: string[];
}

/** 루틴 개별 스텝 */
export interface RoutineStepData {
  order: number;
  category: string;
  /** 일반 명칭("클렌저") */
  name: string;
  /** 상태 기반 성분 스펙명("약산성 클렌저") — 있으면 우선 표시 */
  specName?: string;
  /** specName이 왜 잘 맞는지 한 줄 */
  specReason?: string;
  purpose: string;
  duration?: string;
  tips: string[];
  isOptional: boolean;
  /** 스텝 사용법 — 없으면 null */
  howto: StepHowToData | null;
  /** 내 화장대 보유 제품 ("내 ○○" 배지) — 없으면 생략 */
  ownedProduct?: { name: string; brand?: string };
}

/** 케어 단계 (barrier=장벽 회복 우선 / goal=목표 집중) */
export interface CarePhaseData {
  phase: CarePhaseId;
  label: string;
  message: string;
}

/** 피부 목표(읽기 칩) */
export interface GoalData {
  id: string;
  label: string;
}

/** 오늘 저녁 포커스 */
export interface EveningFocusData {
  focus: CyclingFocus;
  label: string;
  reason: string;
}

/** 주간 사이클 하루 (dow 0=일 … 6=토) */
export interface WeeklyCycleDay {
  dow: number;
  focus: CyclingFocus;
  label: string;
}

/**
 * 루틴 응답 data. 피부 분석 0건이면 hasSkinAnalysis:false만 오고 나머지는 undefined다
 * (서버가 루틴을 지어내지 않음 — 화면이 CTA 렌더).
 */
export interface DailyRoutineData {
  date: string;
  hasSkinAnalysis: boolean;
  skinType?: string;
  skinTypeLabel?: string;
  /** 개인화 노트 (피부 타입·고민 기반 한 줄) */
  personalizationNote?: string;
  carePhase?: CarePhaseData;
  goals?: GoalData[];
  morning?: RoutineStepData[];
  evening?: RoutineStepData[];
  eveningFocus?: EveningFocusData;
  weeklyCycle?: WeeklyCycleDay[];
}

/** fetchDailyRoutine 결과 — stale=true면 오프라인 캐시(마지막 루틴) */
export interface DailyRoutineResult {
  data: DailyRoutineData;
  stale: boolean;
}

// ============================================
// 2. 에러 클래스
// ============================================

export class RoutineApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'RoutineApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================
// 3. 캐시 (AsyncStorage)
// ============================================

const LATEST_KEY = 'routine:latest';
const DATE_PREFIX = 'routine:';

async function writeCache(data: DailyRoutineData): Promise<void> {
  try {
    const json = JSON.stringify(data);
    await AsyncStorage.multiSet([
      [LATEST_KEY, json],
      [`${DATE_PREFIX}${data.date}`, json],
    ]);
  } catch {
    /* 스토리지 용량 초과 등 — 캐시는 베스트 에포트 */
  }
}

async function readCache(): Promise<DailyRoutineData | null> {
  try {
    const raw = await AsyncStorage.getItem(LATEST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyRoutineData;
  } catch {
    return null;
  }
}

// ============================================
// 4. HTTP 클라이언트
// ============================================

/**
 * 오늘의 맞춤 루틴 조회.
 *
 * @param clerkToken Clerk JWT (getToken()으로 획득)
 * @param baseUrl 웹 API base URL (기본: EXPO_PUBLIC_YIROOM_API_URL)
 * @returns 신선한 루틴(stale:false) 또는 오프라인 캐시(stale:true)
 * @throws RoutineApiError 설정 누락·캐시 없는 네트워크/서버 실패
 */
export async function fetchDailyRoutine(
  clerkToken: string,
  baseUrl?: string
): Promise<DailyRoutineResult> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new RoutineApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${url}/api/routine/daily`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        // 서버사이드 계측용 플랫폼 식별 (통합분석·브리핑과 동일 관례 — ADR-103)
        'x-yiroom-client': 'mobile',
      },
    });
  } catch {
    // 네트워크 실패 → 마지막 루틴으로 폴백(화면이 비지 않게)
    const cached = await readCache();
    if (cached) return { data: cached, stale: true };
    throw new RoutineApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: { success?: boolean; data?: DailyRoutineData; error?: string; code?: string } = {};
  try {
    json = (await response.json()) as typeof json;
  } catch {
    json = {};
  }

  if (!response.ok || json.success !== true || !json.data) {
    // 서버/인증 오류라도 캐시가 있으면 stale로라도 보여준다
    const cached = await readCache();
    if (cached) return { data: cached, stale: true };
    throw new RoutineApiError(json.error ?? '루틴을 불러올 수 없어요.', response.status, json.code);
  }

  await writeCache(json.data);
  return { data: json.data, stale: false };
}
