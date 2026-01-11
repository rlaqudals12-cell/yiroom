/**
 * Phase J P3-B: 저장된 코디 API
 * GET: 저장된 코디 목록 조회
 * POST: 코디 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getSavedOutfits, saveOutfit, isOutfitSaved } from '@/lib/api/outfits';
import type { SeasonType } from '@/lib/mock/personal-color';
import type { OutfitOccasion } from '@/types/styling';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const options = {
      seasonType: searchParams.get('seasonType') as SeasonType | undefined,
      occasion: searchParams.get('occasion') as OutfitOccasion | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await getSavedOutfits(supabase, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] GET /api/outfits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();
    const body = await request.json();

    // 필수 필드 검증
    if (!body.outfitId || !body.seasonType || !body.occasion || !body.outfit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 이미 저장되어 있는지 확인
    const alreadySaved = await isOutfitSaved(supabase, body.outfitId);
    if (alreadySaved) {
      return NextResponse.json({ error: 'Already saved', code: 'ALREADY_SAVED' }, { status: 409 });
    }

    const saved = await saveOutfit(supabase, userId, {
      outfitId: body.outfitId,
      seasonType: body.seasonType,
      occasion: body.occasion,
      outfit: body.outfit,
      note: body.note,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/outfits error:', error);

    if (error instanceof Error && error.message === 'ALREADY_SAVED') {
      return NextResponse.json({ error: 'Already saved', code: 'ALREADY_SAVED' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
