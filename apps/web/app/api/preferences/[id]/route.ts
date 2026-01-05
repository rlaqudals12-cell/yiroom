/**
 * 사용자 선호/기피 개별 API
 *
 * PATCH /api/preferences/[id] - 선호/기피 항목 수정
 * DELETE /api/preferences/[id] - 선호/기피 항목 삭제
 *
 * @see docs/SDD-USER-PREFERENCES.md
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getPreferenceById, updatePreference, removePreference } from '@/lib/preferences';
import type { AvoidLevel, AvoidReason } from '@/types/preferences';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 선호/기피 수정 요청 타입
interface UpdatePreferenceRequest {
  avoidLevel?: AvoidLevel;
  avoidReason?: AvoidReason;
  avoidNote?: string;
  priority?: number;
}

/**
 * PATCH /api/preferences/[id]
 * 선호/기피 항목 수정 (기피 수준, 이유, 메모, 우선순위)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing preference ID' }, { status: 400 });
    }

    const body: UpdatePreferenceRequest = await req.json();

    const supabase = createClerkSupabaseClient();

    // 해당 선호/기피 항목이 사용자의 것인지 확인
    const existing = await getPreferenceById(supabase, id);

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Preference not found' }, { status: 404 });
    }

    if (existing.clerkUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this preference' },
        { status: 403 }
      );
    }

    // 우선순위 범위 검증
    if (body.priority !== undefined && (body.priority < 1 || body.priority > 5)) {
      return NextResponse.json(
        { success: false, error: 'Priority must be between 1 and 5' },
        { status: 400 }
      );
    }

    // 선호/기피 항목 수정
    const result = await updatePreference(supabase, id, {
      avoidLevel: body.avoidLevel,
      avoidReason: body.avoidReason,
      avoidNote: body.avoidNote?.trim(),
      priority: body.priority,
    });

    if (!result) {
      console.error('[Preferences] Failed to update preference:', id);
      return NextResponse.json(
        { success: false, error: 'Failed to update preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('[Preferences] PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/preferences/[id]
 * 선호/기피 항목 삭제
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing preference ID' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    // 해당 선호/기피 항목이 사용자의 것인지 확인
    const existing = await getPreferenceById(supabase, id);

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Preference not found' }, { status: 404 });
    }

    if (existing.clerkUserId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this preference' },
        { status: 403 }
      );
    }

    // 선호/기피 항목 삭제
    const success = await removePreference(supabase, id);

    if (!success) {
      console.error('[Preferences] Failed to remove preference:', id);
      return NextResponse.json(
        { success: false, error: 'Failed to delete preference' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: { message: '선호/기피 항목이 삭제되었습니다', id } },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Preferences] DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
