/**
 * 표현 레이어: AI 자연 보정 API (ADR-113)
 *
 * POST /api/visual/beautify
 * Body: { imageBase64: string }  // data URL, 공유 흐름 전용
 * Returns: { imageBase64, aiEdited?, model? }
 *
 * 인증 필수 · 사용자·일 5회 상한 · 실패 시 원본 반환(보정 은폐 금지).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { beautifyForShare, checkAndConsumeBudget } from '@/lib/visual-expression';
import { unauthorizedError, validationError, internalError } from '@/lib/api/error-response';

// 이미지 편집은 수 초 소요 — Hobby 함수 기본 10초 제한 방지
export const maxDuration = 60;

// data URL 형식 이미지 (분석 업로드와 동일하게 넉넉히 허용, 상한만 방어)
const beautifySchema = z.object({
  imageBase64: z
    .string()
    .min(100, '이미지 데이터가 너무 짧아요')
    // 약 10MB(base64 문자 기준) 상한 — 과대 업로드 방어
    .max(14_000_000, '이미지가 너무 커요')
    .refine((v) => v.startsWith('data:image/'), '올바른 이미지 형식이 아니에요'),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return unauthorizedError();
    }

    const body = await req.json().catch(() => null);
    const parsed = beautifySchema.safeParse(body);
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

    const result = await beautifyForShare({ imageBase64: parsed.data.imageBase64 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] POST /api/visual/beautify error:', error);
    return internalError('보정 처리 중 오류가 발생했어요');
  }
}
