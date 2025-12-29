/**
 * 저장된 코디 API
 * GET: 코디 목록 조회
 * POST: 코디 저장
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getSavedOutfits,
  createOutfit,
} from '@/lib/inventory/repository';
import { CreateOutfitRequest, Season } from '@/types/inventory';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const options: {
      occasion?: string;
      season?: Season;
      limit?: number;
      offset?: number;
    } = {};

    if (searchParams.get('occasion')) {
      options.occasion = searchParams.get('occasion') || undefined;
    }
    if (searchParams.get('season')) {
      options.season = searchParams.get('season') as Season;
    }
    if (searchParams.get('limit')) {
      options.limit = parseInt(searchParams.get('limit') || '20', 10);
    }
    if (searchParams.get('offset')) {
      options.offset = parseInt(searchParams.get('offset') || '0', 10);
    }

    const outfits = await getSavedOutfits(userId, options);
    return NextResponse.json({ outfits });
  } catch (error) {
    console.error('[API] GET /api/inventory/outfits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateOutfitRequest = await request.json();

    // 필수 필드 검증
    if (!body.itemIds || body.itemIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    const outfit = await createOutfit(userId, body);
    return NextResponse.json(outfit, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/inventory/outfits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
