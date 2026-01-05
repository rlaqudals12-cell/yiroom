/**
 * 사용자 선호/기피 API (통합)
 *
 * GET /api/preferences - 선호/기피 목록 조회
 * POST /api/preferences - 선호/기피 항목 추가
 *
 * @see docs/SDD-USER-PREFERENCES.md
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getUserPreferences, addPreference } from '@/lib/preferences';
import type {
  UserPreference,
  PreferenceDomain,
  PreferenceItemType,
  AvoidLevel,
  AvoidReason,
} from '@/types/preferences';

// 선호/기피 추가 요청 타입
interface AddPreferenceRequest {
  domain: PreferenceDomain;
  itemType: PreferenceItemType;
  itemId?: string;
  itemName: string;
  itemNameEn?: string;
  isFavorite: boolean;
  avoidLevel?: AvoidLevel;
  avoidReason?: AvoidReason;
  avoidNote?: string;
  priority?: number;
  source?: 'user' | 'analysis' | 'recommendation';
}

/**
 * GET /api/preferences
 * 사용자의 선호/기피 목록 조회 (도메인/타입별 필터링 가능)
 *
 * @query domain - 도메인 필터 (beauty, style, nutrition, workout, color)
 * @query itemType - 아이템 타입 필터
 * @query isFavorite - 선호 여부 필터
 * @query avoidLevel - 기피 수준 필터
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') as PreferenceDomain | null;
    const itemType = searchParams.get('itemType');
    const isFavorite = searchParams.get('isFavorite');
    const avoidLevel = searchParams.get('avoidLevel') as AvoidLevel | null;

    const supabase = createClerkSupabaseClient();

    // 필터 객체 구성
    const filters: Parameters<typeof getUserPreferences>[2] = {};
    if (domain) filters.domain = domain;
    if (itemType) filters.itemType = itemType as PreferenceItemType;
    if (isFavorite !== null) filters.isFavorite = isFavorite === 'true';
    if (avoidLevel) filters.avoidLevel = avoidLevel;

    const preferences = await getUserPreferences(supabase, userId, filters);

    return NextResponse.json(
      {
        success: true,
        data: preferences,
        count: preferences.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Preferences] GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/preferences
 * 새로운 선호/기피 항목 추가
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: AddPreferenceRequest = await req.json();

    // 필수 필드 검증
    if (!body.domain || !body.itemType || !body.itemName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: domain, itemType, itemName',
        },
        { status: 400 }
      );
    }

    if (typeof body.isFavorite !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isFavorite must be a boolean' },
        { status: 400 }
      );
    }

    // 기피 항목의 경우 avoidLevel 검증
    if (!body.isFavorite && !body.avoidLevel) {
      return NextResponse.json(
        {
          success: false,
          error: 'avoidLevel is required for non-favorite items',
        },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 선호/기피 항목 추가
    const preference: Omit<UserPreference, 'id' | 'createdAt' | 'updatedAt'> = {
      clerkUserId: userId,
      domain: body.domain,
      itemType: body.itemType,
      itemId: body.itemId,
      itemName: body.itemName.trim(),
      itemNameEn: body.itemNameEn?.trim(),
      isFavorite: body.isFavorite,
      avoidLevel: body.avoidLevel,
      avoidReason: body.avoidReason as any,
      avoidNote: body.avoidNote?.trim(),
      priority: body.priority ?? 3,
      source: body.source ?? 'user',
    };

    const result = await addPreference(supabase, preference);

    if (!result) {
      console.error('[Preferences] Failed to add preference for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Failed to add preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('[Preferences] POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
