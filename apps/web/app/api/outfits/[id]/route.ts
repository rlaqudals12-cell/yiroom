/**
 * Phase J P3-B: 저장된 코디 개별 API
 * GET: 저장된 코디 단일 조회
 * DELETE: 저장된 코디 삭제
 * PATCH: 메모 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getSavedOutfitById, deleteSavedOutfit, updateSavedOutfitNote } from '@/lib/api/outfits';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createClerkSupabaseClient();

    const outfit = await getSavedOutfitById(supabase, id);

    if (!outfit) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(outfit);
  } catch (error) {
    console.error('[API] GET /api/outfits/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createClerkSupabaseClient();

    // outfit_id로 삭제인지 확인 (쿼리 파라미터)
    const searchParams = request.nextUrl.searchParams;
    const byOutfitId = searchParams.get('byOutfitId') === 'true';

    if (byOutfitId) {
      // outfit_id로 삭제
      const { deleteSavedOutfitByOutfitId } = await import('@/lib/api/outfits');
      await deleteSavedOutfitByOutfitId(supabase, id);
    } else {
      // UUID로 삭제
      await deleteSavedOutfit(supabase, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/outfits/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createClerkSupabaseClient();
    const body = await request.json();

    // 메모 업데이트만 지원
    if ('note' in body) {
      const updated = await updateSavedOutfitNote(supabase, id, body.note);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  } catch (error) {
    console.error('[API] PATCH /api/outfits/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
