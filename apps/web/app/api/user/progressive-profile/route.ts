/**
 * Progressive Profiling — 추가 정보 저장 API
 *
 * 분석 후 사용자가 자발적으로 제공하는 추가 정보를 저장
 * BeautyProfile의 해당 모듈 필드에 병합
 *
 * @route POST /api/user/progressive-profile
 * @auth required
 * @see docs/TODO.md 섹션 6 갭 #5
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const requestSchema = z.object({
  moduleId: z.enum([
    'personal-color',
    'skin',
    'body',
    'nutrition',
    'hair',
    'makeup',
    'oral-health',
  ]),
  data: z.record(z.union([z.string(), z.array(z.string())])),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            userMessage: '입력 정보를 확인해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { moduleId, data } = validated.data;
    const supabase = createServiceRoleClient();

    // beauty_profiles에 progressive_data 필드로 저장
    // JSONB merge — 기존 데이터와 병합
    const { data: existing } = await supabase
      .from('beauty_profiles')
      .select('id, progressive_data')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    const currentProgressiveData = (existing?.progressive_data as Record<string, unknown>) ?? {};

    const updatedProgressiveData = {
      ...currentProgressiveData,
      [moduleId]: {
        ...((currentProgressiveData[moduleId] as Record<string, unknown>) ?? {}),
        ...data,
        updatedAt: new Date().toISOString(),
      },
    };

    if (existing) {
      // 기존 프로필 업데이트
      const { error } = await supabase
        .from('beauty_profiles')
        .update({
          progressive_data: updatedProgressiveData,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', userId);

      if (error) {
        console.error('[Progressive] 업데이트 실패:', error);
        return NextResponse.json(
          {
            success: false,
            error: { code: 'DB_ERROR', userMessage: '저장 중 오류가 발생했습니다.' },
          },
          { status: 500 }
        );
      }
    } else {
      // 프로필 없으면 생성
      const { error } = await supabase.from('beauty_profiles').insert({
        clerk_user_id: userId,
        progressive_data: updatedProgressiveData,
        completed_modules: [],
        personalization_level: 1,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[Progressive] 생성 실패:', error);
        return NextResponse.json(
          {
            success: false,
            error: { code: 'DB_ERROR', userMessage: '저장 중 오류가 발생했습니다.' },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: '추가 정보가 저장되었습니다.',
      moduleId,
      savedFields: Object.keys(data),
    });
  } catch (error) {
    console.error('[Progressive] 서버 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', userMessage: '서버 오류가 발생했습니다.' },
      },
      { status: 500 }
    );
  }
}
