/**
 * 즐겨찾기(성분/소재) API 라우트
 * GET: 사용자의 즐겨찾기 목록 조회
 * POST: 즐겨찾기 추가
 * DELETE: 즐겨찾기 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { HybridDomain, FavoriteItem } from '@/types/hybrid';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as HybridDomain | null;

    const supabase = createClerkSupabaseClient();

    let query = supabase
      .from('user_favorites')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Favorites] Error fetching:', error);
      return NextResponse.json({ error: '즐겨찾기를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 좋아함과 기피 분리
    const favorites = (data || []).filter((item: FavoriteItem) => item.isFavorite);
    const avoids = (data || []).filter((item: FavoriteItem) => !item.isFavorite);

    return NextResponse.json({ favorites, avoids });
  } catch (error) {
    console.error('[Favorites] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, itemType, itemName, itemNameEn, isFavorite = true } = body;

    // 유효성 검사
    if (!domain || !['beauty', 'style'].includes(domain)) {
      return NextResponse.json({ error: '유효하지 않은 도메인입니다.' }, { status: 400 });
    }
    if (!itemType || !['ingredient', 'material'].includes(itemType)) {
      return NextResponse.json({ error: '유효하지 않은 아이템 타입입니다.' }, { status: 400 });
    }
    if (!itemName || typeof itemName !== 'string') {
      return NextResponse.json({ error: '아이템 이름이 필요합니다.' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    // UPSERT: 이미 있으면 업데이트, 없으면 삽입
    const { data, error } = await supabase
      .from('user_favorites')
      .upsert(
        {
          clerk_user_id: userId,
          domain,
          item_type: itemType,
          item_name: itemName,
          item_name_en: itemNameEn || null,
          is_favorite: isFavorite,
        },
        { onConflict: 'clerk_user_id,domain,item_type,item_name' }
      )
      .select()
      .single();

    if (error) {
      console.error('[Favorites] Error creating:', error);
      return NextResponse.json({ error: '즐겨찾기 추가 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Favorites] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const itemName = searchParams.get('itemName');
    const domain = searchParams.get('domain');
    const itemType = searchParams.get('itemType');

    const supabase = createClerkSupabaseClient();

    // ID로 삭제 또는 조합으로 삭제
    if (id) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', id)
        .eq('clerk_user_id', userId);

      if (error) {
        console.error('[Favorites] Error deleting by id:', error);
        return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
      }
    } else if (itemName && domain && itemType) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('clerk_user_id', userId)
        .eq('domain', domain)
        .eq('item_type', itemType)
        .eq('item_name', itemName);

      if (error) {
        console.error('[Favorites] Error deleting by name:', error);
        return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'id 또는 (itemName, domain, itemType)이 필요합니다.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Favorites] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
