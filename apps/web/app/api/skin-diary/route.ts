/**
 * 피부 일기 API
 *
 * @route GET /api/skin-diary?period=30d&year=2026&month=3
 * @route POST /api/skin-diary (메모 저장)
 * @auth required
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getDiaryEntries,
  getCalendarMonth,
  analyzeTrend,
  saveDiaryNote,
  CONDITION_EMOJIS,
} from '@/lib/skin-diary';
import type { TrendPeriod, SkinDiaryResponse } from '@/lib/skin-diary';

// ============================================
// GET: 트렌드 + 캘린더 조회
// ============================================

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  year: z.coerce.number().int().min(2020).max(2030).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Unauthorized', userMessage: '로그인이 필요합니다.' },
      },
      { status: 401 }
    );
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query',
          userMessage: '잘못된 요청입니다.',
        },
      },
      { status: 400 }
    );
  }

  const { period, year, month } = parsed.data;
  const now = new Date();
  const calYear = year ?? now.getFullYear();
  const calMonth = month ?? now.getMonth() + 1;

  try {
    const supabase = createClerkSupabaseClient();

    // 시계열 엔트리 + 캘린더 병렬 조회
    const [entries, calendar] = await Promise.all([
      getDiaryEntries(supabase, userId, period as TrendPeriod),
      getCalendarMonth(supabase, userId, calYear, calMonth),
    ]);

    // 트렌드 분석
    const trend = analyzeTrend(entries, period as TrendPeriod);

    const data: SkinDiaryResponse = {
      trend,
      calendar,
      recentEntries: entries.slice(0, 5),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[API] GET /api/skin-diary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal error',
          userMessage: '데이터를 불러올 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 메모 저장
// ============================================

const noteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  conditionEmoji: z.enum(CONDITION_EMOJIS),
  text: z.string().max(200).default(''),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Unauthorized', userMessage: '로그인이 필요합니다.' },
      },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid JSON',
          userMessage: '잘못된 요청입니다.',
        },
      },
      { status: 400 }
    );
  }

  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid body',
          userMessage: '입력 정보를 확인해주세요.',
        },
      },
      { status: 400 }
    );
  }

  try {
    const supabase = createClerkSupabaseClient();
    const result = await saveDiaryNote(supabase, userId, parsed.data.date, {
      conditionEmoji: parsed.data.conditionEmoji,
      text: parsed.data.text,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: result.error,
            userMessage: result.error ?? '저장에 실패했어요',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] POST /api/skin-diary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal error',
          userMessage: '저장에 실패했어요',
        },
      },
      { status: 500 }
    );
  }
}
