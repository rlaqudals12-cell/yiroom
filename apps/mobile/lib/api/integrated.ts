/**
 * 통합 분석 HTTP 클라이언트 (웹 API 재사용)
 *
 * @module lib/api/integrated
 * @description
 *   웹의 POST /api/analyze/integrated 엔드포인트를 모바일에서 호출.
 *   Clerk JWT를 `Authorization: Bearer` 헤더로 전달.
 *
 * @see docs/adr/ADR-102-mobile-integrated-porting.md §5.2
 * @see docs/specs/SDD-MOBILE-INTEGRATED.md §2
 */

import { randomUUID } from 'expo-crypto';

import { getApiBaseUrl } from './base-url';

// ============================================
// 1. 타입 (웹 apps/web/lib/analysis/integrated/types.ts와 동기화)
// ============================================

export type AxisCode = 'personal_color' | 'skin' | 'body' | 'hair' | 'makeup';

export interface SkinQuestionnaire {
  selfReportedType: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive' | 'unknown';
  concerns?: string[];
}

export interface HairQuestionnaire {
  length?: 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
  density?: 'thin' | 'medium' | 'thick';
  curlType?: 'straight' | 'wavy' | 'curly' | 'coily';
}

export interface BodyQuestionnaire {
  heightCm?: number;
  weightKg?: number;
  shoulderWidthCm?: number;
  waistCm?: number;
}

export interface IntegratedAnalysisInput {
  faceImageBase64: string;
  bodyImageBase64?: string;
  /** 동일 제출의 재전송을 서버가 같은 세션으로 합칠 수 있게 하는 UUID 상관 ID. */
  clientRequestId: string;
  questionnaire: {
    skin: SkinQuestionnaire;
    hair: HairQuestionnaire;
    body: BodyQuestionnaire;
    /** 이번 분석 원본 사진의 선택 저장 동의. 누락 시 서버에서 false로 처리한다. */
    imageStorageConsent?: boolean;
  };
  options?: {
    locale?: 'ko' | 'en' | 'ja' | 'zh';
    skipMakeup?: boolean;
  };
  /** 선택 재분석 (ADR-109 2A): 'update'면 axes의 축만 재실행, 나머지는 프로필 최신값 유지 */
  mode?: 'full' | 'update';
  axes?: AxisCode[];
}

/**
 * 웹 통합분석과 같은 UUID v4 상관 ID를 만든다.
 * 분석 결과를 만드는 난수가 아니라 중복 과금·중복 세션을 막는 요청 식별자다.
 */
export function createIntegratedClientRequestId(): string {
  return randomUUID();
}

export interface AxisError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

export type AxisResult<T> =
  | { success: true; data: T; usedFallback: boolean }
  | { success: false; error: AxisError };

export interface AxisData {
  id?: string;
  [key: string]: unknown;
}

/**
 * 나 프로필 (ADR-104 체크리스트 #1) — 웹 types.ts와 동기화.
 * 5축 결과를 합성한 "1명의 나" 내러티브.
 */
export interface PersonaProfile {
  oneLine: string;
  narrative: string;
  keyInsights: string[];
  usedFallback: boolean;
}

export interface IntegratedAnalysisResult {
  sessionId: string;
  status: 'completed' | 'partial' | 'failed';
  /** 새 분석의 완전한 결과에는 reused가 없거나 false다. */
  reused?: false;
  axes: {
    personalColor: AxisResult<AxisData>;
    skin: AxisResult<AxisData>;
    body: AxisResult<AxisData>;
    hair: AxisResult<AxisData>;
    makeup: AxisResult<AxisData>;
  };
  /** ADR-104 나 프로필. 성공 축 0개면 null */
  persona: PersonaProfile | null;
  axesCompleted: AxisCode[];
  axesFailed: AxisCode[];
  usedFallback: AxisCode[];
  createdAt: string;
  completedAt: string;
}

/** 멱등 재요청은 축 payload를 반복 전송하지 않고 기존 세션의 상태만 반환한다. */
export interface ReusedIntegratedAnalysisResult {
  sessionId: string;
  status: 'pending' | 'partial' | 'completed' | 'failed';
  reused: true;
}

export type IntegratedAnalysisResponse = IntegratedAnalysisResult | ReusedIntegratedAnalysisResult;

const AXIS_KEYS = ['personalColor', 'skin', 'body', 'hair', 'makeup'] as const;

/** 쿼리 payload가 실제 완전 결과인지 확인해 축 없는 멱등 요약의 결과 화면 주입을 막는다. */
export function isIntegratedAnalysisResult(value: unknown): value is IntegratedAnalysisResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  const axes = result.axes;
  if (typeof axes !== 'object' || axes === null) return false;
  const axisRecord = axes as Record<string, unknown>;

  return (
    typeof result.sessionId === 'string' &&
    (result.status === 'completed' || result.status === 'partial' || result.status === 'failed') &&
    AXIS_KEYS.every((key) => typeof axisRecord[key] === 'object' && axisRecord[key] !== null) &&
    Array.isArray(result.axesCompleted) &&
    Array.isArray(result.axesFailed) &&
    Array.isArray(result.usedFallback) &&
    typeof result.createdAt === 'string' &&
    typeof result.completedAt === 'string'
  );
}

// ============================================
// 2. 에러 클래스
// ============================================

export class IntegratedApiError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'IntegratedApiError';
    this.status = status;
    this.code = code;
  }
}

// ============================================
// 3. HTTP 클라이언트
// ============================================

interface ApiSuccessResponse {
  success: true;
  result: unknown;
}

export const INTEGRATED_REQUEST_TIMEOUT_MS = 90_000;

interface IntegratedRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * 웹 API 에러 응답에서 사용자 메시지·코드를 추출한다.
 *
 * 왜 두 형태를 모두 파싱하나 (근본 원인):
 *   통합분석 라우트는 error-response.ts 헬퍼(forbiddenError 등)를 쓰는데, 이 헬퍼는
 *   **플랫** 형태 { error: "<한국어 메시지>", code: "<코드>" }를 반환한다.
 *   기존 코드는 **중첩** { error: { userMessage, message } }만 파싱해, 연령 게이트 403의
 *   "만 14세 이상만..." 메시지를 잃고 일반 문구로 뭉갰다. 두 형태를 모두 지원한다.
 */
function extractApiError(json: unknown): { message?: string; code?: string } {
  if (typeof json !== 'object' || json === null) return {};
  const obj = json as Record<string, unknown>;
  const err = obj.error;

  // 플랫: error가 문자열 → 그 자체가 사용자 메시지, code는 형제 필드
  if (typeof err === 'string') {
    return { message: err, code: typeof obj.code === 'string' ? obj.code : undefined };
  }

  // 중첩(방어적): error가 객체 → userMessage 우선, 없으면 message
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const message =
      (typeof e.userMessage === 'string' && e.userMessage) ||
      (typeof e.message === 'string' ? e.message : undefined);
    const code =
      (typeof e.code === 'string' && e.code) ||
      (typeof obj.code === 'string' ? obj.code : undefined);
    return { message: message || undefined, code: code || undefined };
  }

  // error 필드가 없으면 최상위 message/code 시도
  return {
    message: typeof obj.message === 'string' ? obj.message : undefined,
    code: typeof obj.code === 'string' ? obj.code : undefined,
  };
}

/**
 * 통합 분석 요청.
 *
 * @param input 통합 분석 입력
 * @param clerkToken Clerk JWT (getToken()으로 획득)
 * @param baseUrl 웹 API base URL (미지정 시 getApiBaseUrl()이 env·프로덕션 웹 순으로 해석)
 * @throws IntegratedApiError 인증/검증/서버 에러
 */
export async function requestIntegratedAnalysis(
  input: IntegratedAnalysisInput,
  clerkToken: string,
  baseUrl?: string,
  options: IntegratedRequestOptions = {}
): Promise<IntegratedAnalysisResponse> {
  const url = getApiBaseUrl(baseUrl);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? INTEGRATED_REQUEST_TIMEOUT_MS;
  let timedOut = false;

  const relayAbort = (): void => controller.abort();
  if (options.signal?.aborted) {
    controller.abort();
  } else {
    options.signal?.addEventListener('abort', relayAbort, { once: true });
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/integrated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        // 서버사이드 계측용 플랫폼 식별 (웹은 클라이언트 track, 앱은 서버 track — 중복 방지)
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
  } catch {
    if (timedOut) {
      throw new IntegratedApiError(
        '응답이 지연되고 있어요. 진행 중인 분석은 잠시 후 다시 확인해주세요.',
        0,
        'REQUEST_TIMEOUT'
      );
    }
    if (controller.signal.aborted) {
      throw new IntegratedApiError(
        '분석 요청을 취소했어요. 진행 중인 분석은 다시 확인할 수 있어요.',
        0,
        'REQUEST_ABORTED'
      );
    }
    throw new IntegratedApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', relayAbort);
  }

  // 왜: JSON 파싱 실패해도 안전한 기본값 반환하도록 처리
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  const isSuccess =
    typeof json === 'object' && json !== null && (json as Record<string, unknown>).success === true;

  if (!response.ok || !isSuccess) {
    const { message, code } = extractApiError(json);
    throw new IntegratedApiError(message ?? '분석 요청에 실패했어요.', response.status, code);
  }

  const result = (json as ApiSuccessResponse).result;
  if (typeof result !== 'object' || result === null) {
    throw new IntegratedApiError(
      '분석 결과 형식이 올바르지 않아요.',
      response.status,
      'INVALID_RESPONSE'
    );
  }

  const summary = result as Record<string, unknown>;
  const validSessionId = typeof summary.sessionId === 'string';
  const validStatus =
    summary.status === 'pending' ||
    summary.status === 'partial' ||
    summary.status === 'completed' ||
    summary.status === 'failed';

  if (summary.reused === true && validSessionId && validStatus) {
    return {
      sessionId: summary.sessionId as string,
      status: summary.status as ReusedIntegratedAnalysisResult['status'],
      reused: true,
    };
  }

  if (!isIntegratedAnalysisResult(result)) {
    throw new IntegratedApiError(
      '분석 결과 형식이 올바르지 않아요.',
      response.status,
      'INVALID_RESPONSE'
    );
  }
  return result;
}
