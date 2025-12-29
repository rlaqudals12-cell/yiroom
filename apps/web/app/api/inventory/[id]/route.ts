/**
 * 인벤토리 개별 아이템 API
 * GET: 아이템 상세 조회
 * PUT: 아이템 수정
 * DELETE: 아이템 삭제
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  toggleFavorite,
  recordItemUsage,
} from '@/lib/inventory/repository';
import { UpdateInventoryItemRequest } from '@/types/inventory';

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
    const item = await getInventoryItemById(userId, id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('[API] GET /api/inventory/[id] error:', error);
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

    // 즐겨찾기 토글
    if (searchParams.get('action') === 'toggleFavorite') {
      const newValue = await toggleFavorite(userId, id);
      return NextResponse.json({ isFavorite: newValue });
    }

    // 사용 기록
    if (searchParams.get('action') === 'recordUsage') {
      await recordItemUsage(userId, id);
      return NextResponse.json({ success: true });
    }

    // 일반 수정
    const body: UpdateInventoryItemRequest = await request.json();
    const item = await updateInventoryItem(userId, id, body);

    return NextResponse.json(item);
  } catch (error) {
    console.error('[API] PUT /api/inventory/[id] error:', error);

    if (error instanceof Error && error.message === 'Item not found') {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
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

    // 아이템 존재 확인
    const item = await getInventoryItemById(userId, id);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await deleteInventoryItem(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /api/inventory/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
