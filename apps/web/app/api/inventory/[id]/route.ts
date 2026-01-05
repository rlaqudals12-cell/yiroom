/**
 * Inventory Item API
 * GET: 아이템 상세 조회
 * PATCH: 아이템 수정
 * DELETE: 아이템 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  toggleFavorite,
  recordItemUsage,
} from '@/lib/inventory';

/**
 * GET /api/inventory/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('[Inventory Item API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/inventory/[id]
 * Body: UpdateInventoryItemRequest or action commands
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // 특수 액션 처리
    if (body.action === 'toggleFavorite') {
      const isFavorite = await toggleFavorite(userId, id);
      return NextResponse.json({ success: true, isFavorite });
    }

    if (body.action === 'recordUsage') {
      await recordItemUsage(userId, id);
      return NextResponse.json({ success: true });
    }

    // 일반 업데이트
    const item = await updateInventoryItem(userId, id, {
      name: body.name,
      subCategory: body.subCategory,
      imageUrl: body.imageUrl,
      brand: body.brand,
      tags: body.tags,
      isFavorite: body.isFavorite,
      expiryDate: body.expiryDate,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('[Inventory Item API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/inventory/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteInventoryItem(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Inventory Item API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
