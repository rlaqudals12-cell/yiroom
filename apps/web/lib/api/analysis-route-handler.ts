/**
 * 분석 API 제너릭 라우트 핸들러
 *
 * 새 분석 모듈 추가 시 공통 envelope을 재사용할 수 있는 팩토리.
 * 기존 12개 안정 라우트는 리팩토링하지 않음 (OCP 원칙).
 *
 * @example
 * ```ts
 * // app/api/analyze/new-module/route.ts
 * import { createAnalysisRoute } from '@/lib/api/analysis-route-handler';
 * import { newModuleSchema } from './schema';
 *
 * export const POST = createAnalysisRoute({
 *   moduleName: 'new-module',
 *   inputSchema: newModuleSchema,
 *   analyze: async (input) => analyzeNewModule(input),
 *   generateMock: () => generateMockNewModule(),
 *   saveToDB: async (supabase, userId, result) => {
 *     return supabase.from('new_module_assessments')
 *       .insert({ clerk_user_id: userId, ...result })
 *       .select().single();
 *   },
 *   badgeType: 'new_module',
 * });
 * ```
 *
 * @see ADR-007 Mock Fallback 전략
 * @see OCP 패턴 (.claude/rules/ocp-patterns.md)
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { applyRateLimit } from '@/lib/security/rate-limit';
import {
  awardAnalysisBadge,
  checkAndAwardAllAnalysisBadge,
  addXp,
  type BadgeAwardResult,
} from '@/lib/gamification';
import { unauthorizedError, validationError, internalError } from '@/lib/api/error-response';

// XP 보상 상수
const XP_ANALYSIS_COMPLETE = 10;

// 환경변수: Mock 모드 강제 여부
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * 분석 라우트 핸들러 설정
 */
export interface AnalysisRouteConfig<TInput, TResult> {
  /** 모듈 식별자 (로깅용, e.g., 'OH-1') */
  moduleName: string;

  /** Zod 입력 스키마 */
  inputSchema: z.ZodSchema<TInput>;

  /** AI 분석 함수 */
  analyze: (input: TInput) => Promise<TResult>;

  /** Mock 데이터 생성 함수 (AI 실패 시 폴백) */
  generateMock: (input: TInput) => TResult;

  /** DB 저장 함수 — null 반환 시 저장 생략 */
  saveToDB: (
    supabase: ReturnType<typeof createServiceRoleClient>,
    userId: string,
    result: TResult,
    input: TInput
  ) => Promise<{ data: Record<string, unknown> | null; error: unknown }>;

  /** 게이미피케이션 뱃지 타입 — awardAnalysisBadge가 지원하는 타입만 */
  badgeType: 'personal-color' | 'skin' | 'body' | 'posture';

  /** useMock 필드를 input에서 추출하는 함수 (기본: input.useMock) */
  getUseMock?: (input: TInput) => boolean;
}

/**
 * 분석 API POST 핸들러 팩토리
 *
 * 공통 envelope: auth → rate limit → validation → AI (mock fallback) → DB → gamification → response
 */
export function createAnalysisRoute<TInput, TResult>(
  config: AnalysisRouteConfig<TInput, TResult>
): (req: NextRequest) => Promise<NextResponse> {
  // eslint-disable-next-line sonarjs/cognitive-complexity -- 분석 API 공통 envelope
  return async (req: NextRequest) => {
    try {
      // 1. 인증
      const { userId } = await auth();
      if (!userId) {
        return unauthorizedError();
      }

      // 2. Rate Limit
      const rateLimitResult = applyRateLimit(req, userId);
      if (!rateLimitResult.success) {
        return rateLimitResult.response!;
      }

      // 3. 입력 검증
      const rawBody = await req.json();
      const parsed = config.inputSchema.safeParse(rawBody);
      if (!parsed.success) {
        return validationError(parsed.error.errors[0]?.message || '입력 정보를 확인해주세요.');
      }
      const input = parsed.data;

      // 4. AI 분석 (Mock Fallback)
      let result: TResult;
      let usedMock = false;

      const shouldUseMock = FORCE_MOCK || (config.getUseMock?.(input) ?? false);

      if (shouldUseMock) {
        result = config.generateMock(input);
        usedMock = true;
      } else {
        try {
          result = await config.analyze(input);
        } catch (aiError) {
          console.error(`[${config.moduleName}] AI error, falling back to mock:`, aiError);
          result = config.generateMock(input);
          usedMock = true;
        }
      }

      // 5. DB 저장 (실패해도 분석 결과 반환)
      let saved = true;
      let dbData: Record<string, unknown> | null = null;

      try {
        const supabase = createServiceRoleClient();
        const { data, error } = await config.saveToDB(supabase, userId, result, input);

        if (error) {
          console.error(`[${config.moduleName}] DB insert error:`, error);
          saved = false;
        } else {
          dbData = data;
        }

        // 6. 게이미피케이션 (DB 저장 성공 시)
        const gamificationResult: {
          badgeResults: BadgeAwardResult[];
          xpAwarded: number;
        } = {
          badgeResults: [],
          xpAwarded: 0,
        };

        if (saved) {
          try {
            await addXp(supabase, userId, XP_ANALYSIS_COMPLETE);
            gamificationResult.xpAwarded = XP_ANALYSIS_COMPLETE;

            const badge = await awardAnalysisBadge(supabase, userId, config.badgeType);
            if (badge) {
              gamificationResult.badgeResults.push(badge);
            }

            const allBadge = await checkAndAwardAllAnalysisBadge(supabase, userId);
            if (allBadge) {
              gamificationResult.badgeResults.push(allBadge);
            }
          } catch (gamError) {
            console.error(`[${config.moduleName}] Gamification error:`, gamError);
          }
        }

        return NextResponse.json({
          success: true,
          saved,
          data: dbData,
          result,
          usedMock,
          gamification: gamificationResult,
        });
      } catch (dbOperationError) {
        // DB 실패 시 합성 응답 (AI 결과 보존)
        console.warn(`[${config.moduleName}] DB operations failed, using synthetic response`);
        console.error(`[${config.moduleName}] DB error:`, dbOperationError);

        return NextResponse.json({
          success: true,
          saved: false,
          data: {
            id: crypto.randomUUID(),
            clerk_user_id: userId,
            created_at: new Date().toISOString(),
          },
          result,
          usedMock,
          gamification: { badgeResults: [], xpAwarded: 0 },
          dbSaveFailed: true,
        });
      }
    } catch (error) {
      console.error(`[${config.moduleName}] Analysis error:`, error);
      return internalError();
    }
  };
}
