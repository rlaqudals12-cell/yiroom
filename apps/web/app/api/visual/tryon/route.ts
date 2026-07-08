/**
 * 표현 레이어: 가상 착장 API (ADR-113)
 *
 * POST /api/visual/tryon
 * Body: { modelImageBase64, garmentImageUrl, category }
 * Returns: { imageUrl, aiGenerated }
 *
 * 인증 필수 · FASHN_API_KEY 없으면 404(유령 UI 방지) · 사용자·일 5회 상한.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { generateTryon, isTryonAvailable, checkAndConsumeBudget } from '@/lib/visual-expression';
import {
  unauthorizedError,
  validationError,
  notFoundError,
  internalError,
} from '@/lib/api/error-response';

// FASHN 폴링(최대 40초) — 함수 제한 방지
export const maxDuration = 60;

/**
 * 가상 착장 사용 가능 여부(FASHN_API_KEY 존재) — 클라이언트 표면 게이팅용.
 * false면 UI가 "입어보기"를 아예 렌더하지 않는다(유령 UI 방지).
 */
export async function GET() {
  return NextResponse.json({ available: isTryonAvailable() });
}

const tryonSchema = z.object({
  modelImageBase64: z
    .string()
    .min(100, '이미지 데이터가 너무 짧아요')
    .max(14_000_000, '이미지가 너무 커요')
    .refine((v) => v.startsWith('data:image/'), '올바른 이미지 형식이 아니에요'),
  garmentImageUrl: z.string().url('올바른 의류 이미지 주소가 아니에요'),
  category: z.enum(['tops', 'bottoms', 'one-pieces']),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedError();
    }

    // 키 미설정 시 기능 자체가 존재하지 않는 것으로 취급
    if (!isTryonAvailable()) {
      return notFoundError('가상 착장 기능을 사용할 수 없어요');
    }

    const body = await req.json().catch(() => null);
    const parsed = tryonSchema.safeParse(body);
    if (!parsed.success) {
      return validationError('입력값이 올바르지 않아요', parsed.error.issues[0]?.message);
    }

    // 비용 가드 (보정+착장 합산 일 5회)
    const budget = checkAndConsumeBudget(userId);
    if (!budget.allowed) {
      return NextResponse.json(
        {
          error: '오늘의 AI 이미지 생성 횟수를 모두 사용했어요. 내일 다시 시도해 주세요.',
          code: 'VISUAL_BUDGET_EXCEEDED',
          remaining: 0,
          limit: budget.limit,
        },
        { status: 429 }
      );
    }

    const result = await generateTryon({
      modelImageBase64: parsed.data.modelImageBase64,
      garmentImageUrl: parsed.data.garmentImageUrl,
      category: parsed.data.category,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/visual/tryon error:', error);
    return internalError('가상 착장 생성 중 오류가 발생했어요');
  }
}
