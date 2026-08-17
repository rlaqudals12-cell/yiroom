/**
 * 통합 분석 API (5축 병렬)
 *
 * @route POST /api/analyze/integrated
 * @description
 *   ADR-099 통합 분석 플로우 — 5축(PC/S/C/H/M) 병렬 실행 단일 진입점.
 *   기존 개별 /api/analyze/{module}-v2 엔드포인트는 그대로 유지 (하위 호환).
 *
 *   ADR-103: 모바일 클라이언트 지원을 위해 CORS 허용 (Bearer JWT로 인증).
 *
 * @see docs/adr/ADR-099-integrated-analysis-flow.md
 * @see docs/adr/ADR-103-cross-origin-mobile-access.md
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §6 ATOM 7
 */

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/security/rate-limit';
import {
  unauthorizedError,
  validationError,
  internalError,
  imageQualityError,
} from '@/lib/api/error-response';
import { requireAgeVerified } from '@/lib/api/age-verification-gate';
import { requireBiometricConsent } from '@/lib/api/biometric-consent';
import { runFullPipeline } from '@/lib/api/image-pipeline';
import { trackActivity } from '@/lib/levels';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  runIntegratedAnalysis,
  integratedAnalysisInputSchema,
  type IntegratedAnalysisResult,
  type CaptureConditions,
} from '@/lib/analysis/integrated';

/**
 * ADR-103 CORS 허용 — 모바일 앱이 웹 API 호출 가능하도록 이 라우트만 개방.
 * 인증은 Authorization Bearer JWT가 담당.
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Gemini 3.5-flash 상세 분석은 축당 15~19초 — 5축 병렬이라도 wall-clock ~20초.
// Vercel Hobby 함수 기본 제한(10초)으로는 완료 불가 → 60초로 확장 (Hobby 최대치).
// 미설정 시 오늘 30초 내부 타임아웃이 함수 제한에 먼저 죽어 504/부분실패 (2026-07-07).
export const maxDuration = 60;

function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/**
 * OPTIONS /api/analyze/integrated (Preflight)
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * 등급 시스템 활동 기록 (analysis, 2점).
 *
 * 비차단 — 계측 실패가 분석 응답을 깨면 안 되므로 모든 예외를 삼키고 로깅만 한다.
 * 활동 로그 INSERT는 DB 트리거가 user_levels를 자동 갱신하며, 트리거가 user_levels에
 * 쓰려면 RLS를 우회해야 하므로 service-role 클라이언트를 쓴다(기존 호출처 4곳과 동일).
 */
async function recordAnalysisActivity(
  userId: string,
  result: IntegratedAnalysisResult
): Promise<void> {
  const realAxes = result.axesCompleted.filter((axis) => !result.usedFallback.includes(axis));
  if (result.status === 'failed' || realAxes.length === 0) return;

  try {
    await trackActivity(createServiceRoleClient(), userId, 'analysis', result.sessionId);
  } catch (error) {
    console.error('[API /analyze/integrated] activity tracking failed:', error);
  }
}

/**
 * POST /api/analyze/integrated
 *
 * Body: IntegratedAnalysisInput (Zod 스키마 참조)
 *
 * 성공 응답 (200):
 * {
 *   success: true,
 *   result: IntegratedAnalysisResult  // status: completed|partial|failed
 * }
 *
 * 에러 응답:
 * - 401 AUTH_ERROR
 * - 429 RATE_LIMIT_ERROR
 * - 400 VALIDATION_ERROR
 * - 500 INTERNAL_ERROR
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- API route handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. 인증
    const { userId } = await auth();
    if (!userId) {
      return withCors(unauthorizedError());
    }

    // 2. Rate Limit (통합은 5축 = 보수적으로 개별 API와 동일 한도 적용)
    const rateLimitResult = applyRateLimit(req, userId);
    if (!rateLimitResult.success) {
      return withCors(rateLimitResult.response!);
    }

    // 3. Body 파싱 + Zod 검증
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return withCors(validationError('요청 본문이 올바른 JSON이 아니에요.'));
    }

    const parsed = integratedAnalysisInputSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? '입력값이 올바르지 않아요.';
      return withCors(validationError(message));
    }

    // 3.4 연령 확인 게이트 (fail-closed) — 생체분석(품질 게이트·5축 분석) 전 만 14세 이상 서버 강제
    const ageDenied = await requireAgeVerified(userId);
    if (ageDenied) return withCors(ageDenied);

    // 생체정보 수집·이용 동의 게이트 (fail-closed) — BIPA/PIPA 제23조, 미동의 시 403
    const bioDenied = await requireBiometricConsent(userId);
    if (bioDenied) return withCors(bioDenied);

    // 3.5 CIE-1 품질 게이트 (2026-07-07, Phase 1-③)
    // 저품질 얼굴 사진은 5축 분석(~20초·5콜 과금) 전에 차단하고 재촬영을 요청한다.
    // V2 개별 라우트엔 이미 있던 게이트가 주 플로우인 통합에만 빠져 있었음 —
    // 게이트 없으면 194px 사진도 신뢰도 medium으로 통과(과신)하는 것을 실측 확인.
    let capture: CaptureConditions | undefined;

    if (process.env.FORCE_MOCK_AI !== 'true' && parsed.data.faceImageBase64) {
      const gate = await runFullPipeline(parsed.data.faceImageBase64, {
        minScore: 40,
        allowWarnings: true,
        skipExtendedPipeline: true, // 게이트 판정만 — CIE-3/4 메타는 축별 분석이 담당
      });
      if (!gate.success) {
        return withCors(imageQualityError(gate.error.userMessage, gate.error.message));
      }

      // 게이트가 이미 측정한 촬영 조건을 축 저장까지 흘려보낸다.
      // 지금까지는 통과/차단 판정에만 쓰고 버렸으나, 촬영 조건은 소급 복구가 불가능하다 —
      // 사진이 남아 있어도 과거 회차의 조명·선명도를 되살릴 방법이 없으므로,
      // 저장하지 않은 회차는 영구히 "조건 미상"으로 남는다. (신규 연산 0 — 이미 계산된 값)
      capture = {
        qualityScore: gate.cie1.overallScore,
        sharpnessScore: gate.cie1.sharpness.score,
        sharpnessVerdict: gate.cie1.sharpness.verdict,
        exposureVerdict: gate.cie1.exposure.verdict,
        cctKelvin: gate.cie1.colorTemperature.kelvin,
        cctVerdict: gate.cie1.colorTemperature.verdict,
        resolutionValid: gate.cie1.resolution?.isValid ?? null,
        confidence: gate.cie1.confidence,
        measuredAt: new Date().toISOString(),
      };
    }

    // 4. 통합 분석 실행 (Partial/Failed도 정상 응답 경로)
    const result: IntegratedAnalysisResult = await runIntegratedAnalysis(
      parsed.data,
      userId,
      capture
    );

    // 4.4 등급 활동 기록 — 통합 분석 완료는 뷰티 사용자의 대표 활동이다.
    // activity_logs 호출처가 숨김 모듈(운동·영양)뿐이라 분석·옷장·루틴만 쓰는 사용자는
    // 영구 Lv.1·0회로 남았다(DB CHECK 제약은 'analysis'를 이미 허용 — 배선만 빠져 있었음).
    // 전 축 실패이거나 모든 성공 축이 Mock 폴백이면 실제 판정이 0이므로 활동으로 치지 않는다.
    await recordAnalysisActivity(userId, result);

    // 4.5 모바일 앱 퍼널 계측 — 웹은 클라이언트 track()이 이미 잡으므로 모바일 요청만 서버 track (중복 방지).
    // 계측 실패가 분석 응답을 깨면 안 되므로 방어적으로 무시.
    if (req.headers.get('x-yiroom-client') === 'mobile') {
      try {
        const { track } = await import('@vercel/analytics/server');
        await track('integrated_analysis_complete', {
          platform: 'mobile',
          mode: parsed.data.mode ?? 'full',
          axisCount: parsed.data.mode === 'update' ? (parsed.data.axes?.length ?? 5) : 5,
          status: result.status,
        });
      } catch {
        // no-op
      }
    }

    // 5. 응답 — Partial/Failed도 HTTP 200 (result.status로 분기)
    return withCors(
      NextResponse.json(
        {
          success: true,
          result,
        },
        { status: 200 }
      )
    );
  } catch (error) {
    // 왜: orchestrator가 throw하는 건 세션 생성 실패 같은 복구 불가 케이스
    console.error('[API /analyze/integrated] fatal error:', error);
    return withCors(
      internalError(
        error instanceof Error ? error.message : '통합 분석 중 예상치 못한 오류가 발생했어요.'
      )
    );
  }
}
