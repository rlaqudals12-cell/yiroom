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
  questionnaire: {
    skin: SkinQuestionnaire;
    hair: HairQuestionnaire;
    body: BodyQuestionnaire;
  };
  options?: {
    locale?: 'ko' | 'en' | 'ja' | 'zh';
    skipMakeup?: boolean;
  };
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

/** 웹 API의 표준 에러 응답 (error-response.ts 참조) */
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage?: string;
  };
}

interface ApiSuccessResponse {
  success: true;
  result: IntegratedAnalysisResult;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

/**
 * 통합 분석 요청.
 *
 * @param input 통합 분석 입력
 * @param clerkToken Clerk JWT (getToken()으로 획득)
 * @param baseUrl 웹 API base URL (기본: process.env.EXPO_PUBLIC_YIROOM_API_URL)
 * @throws IntegratedApiError 인증/검증/서버 에러
 */
export async function requestIntegratedAnalysis(
  input: IntegratedAnalysisInput,
  clerkToken: string,
  baseUrl?: string
): Promise<IntegratedAnalysisResult> {
  const url = baseUrl ?? process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!url) {
    throw new IntegratedApiError(
      'API 서버 주소가 설정되지 않았어요. 앱 설정을 확인해주세요.',
      0,
      'CONFIG_ERROR'
    );
  }

  let response: Response;
  try {
    response = await fetch(`${url}/api/analyze/integrated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify(input),
    });
  } catch (networkError) {
    throw new IntegratedApiError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  // 왜: JSON 파싱 실패해도 안전한 기본값 반환하도록 처리
  let json: ApiResponse | Record<string, never>;
  try {
    json = (await response.json()) as ApiResponse;
  } catch {
    json = {};
  }

  if (!response.ok || !('success' in json) || json.success !== true) {
    const errorObj = ('error' in json ? json.error : undefined) as
      | ApiErrorResponse['error']
      | undefined;
    const message = errorObj?.userMessage ?? errorObj?.message ?? '분석 요청에 실패했어요.';
    throw new IntegratedApiError(message, response.status, errorObj?.code);
  }

  return json.result;
}
