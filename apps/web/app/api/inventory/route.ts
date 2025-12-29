/**
 * 인벤토리 API
 * GET: 아이템 목록 조회
 * POST: 아이템 생성
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  getInventoryItems,
  createInventoryItem,
  getInventoryStats,
} from '@/lib/inventory/repository';
import {
  InventoryListFilter,
  CreateInventoryItemRequest,
  InventoryCategory,
  Season,
} from '@/types/inventory';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // 통계 조회 모드
    if (searchParams.get('stats') === 'true') {
      const category = searchParams.get('category') as InventoryCategory;
      if (!category) {
        return NextResponse.json(
          { error: 'Category is required for stats' },
          { status: 400 }
        );
      }

      const stats = await getInventoryStats(userId, category);
      return NextResponse.json(stats);
    }

    // 목록 조회
    const filter: InventoryListFilter = {};

    if (searchParams.get('category')) {
      filter.category = searchParams.get('category') as InventoryCategory;
    }
    if (searchParams.get('subCategory')) {
      filter.subCategory = searchParams.get('subCategory') || undefined;
    }
    if (searchParams.get('season')) {
      filter.season = searchParams.get('season') as Season;
    }
    if (searchParams.get('occasion')) {
      filter.occasion = searchParams.get('occasion') as InventoryListFilter['occasion'];
    }
    if (searchParams.get('color')) {
      filter.color = searchParams.get('color') || undefined;
    }
    if (searchParams.get('favorite') === 'true') {
      filter.isFavorite = true;
    }
    if (searchParams.get('search')) {
      filter.search = searchParams.get('search') || undefined;
    }
    if (searchParams.get('tags')) {
      filter.tags = searchParams.get('tags')?.split(',');
    }
    if (searchParams.get('limit')) {
      filter.limit = parseInt(searchParams.get('limit') || '20', 10);
    }
    if (searchParams.get('offset')) {
      filter.offset = parseInt(searchParams.get('offset') || '0', 10);
    }
    if (searchParams.get('orderBy')) {
      filter.orderBy = searchParams.get('orderBy') as InventoryListFilter['orderBy'];
    }
    if (searchParams.get('orderDir')) {
      filter.orderDir = searchParams.get('orderDir') as InventoryListFilter['orderDir'];
    }

    const items = await getInventoryItems(userId, filter);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[API] GET /api/inventory error:', error);
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

    const body: CreateInventoryItemRequest = await request.json();

    // 필수 필드 검증
    if (!body.category || !body.name || !body.imageUrl) {
      return NextResponse.json(
        { error: 'category, name, and imageUrl are required' },
        { status: 400 }
      );
    }

    // 카테고리 검증
    const validCategories: InventoryCategory[] = [
      'closet',
      'beauty',
      'equipment',
      'supplement',
      'pantry',
    ];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const item = await createInventoryItem(userId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
