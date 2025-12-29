/**
 * 저장된 코디 개별 API
 * GET: 코디 상세 조회 (아이템 포함)
 * PUT: 코디 수정
 * DELETE: 코디 삭제
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getSavedOutfitById,
  updateOutfit,
  deleteOutfit,
  recordOutfitWear,
} from '@/lib/inventory/repository';
import { UpdateOutfitRequest } from '@/types/inventory';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const outfit = await getSavedOutfitById(userId, id);

    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    return NextResponse.json(outfit);
  } catch (error) {
    console.error('[API] GET /api/inventory/outfits/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // 착용 기록
    if (searchParams.get('action') === 'recordWear') {
      await recordOutfitWear(userId, id);
      return NextResponse.json({ success: true });
    }

    // 일반 수정
    const body: UpdateOutfitRequest = await request.json();
    const outfit = await updateOutfit(userId, id, body);

    return NextResponse.json(outfit);
  } catch (error) {
    console.error('[API] PUT /api/inventory/outfits/[id] error:', error);

    if (error instanceof Error && error.message === 'Outfit not found') {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // 코디 존재 확인
    const outfit = await getSavedOutfitById(userId, id);
    if (!outfit) {
      return NextResponse.json({ error: 'Outfit not found' }, { status: 404 });
    }

    await deleteOutfit(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/inventory/outfits/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
