/**
 * 사용자 설정 API
 * GET - 설정 조회
 * PUT - 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPreferences, upsertPreferences } from '@/lib/smart-matching';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const preferences = await getPreferences(userId);

    // 설정이 없으면 기본값 반환
    if (!preferences) {
      return NextResponse.json({
        clerkUserId: userId,
        budget: {},
        favoriteBrands: [],
        blockedBrands: [],
        preferredPlatforms: [],
        prioritizeFreeDelivery: true,
        prioritizeFastDelivery: false,
        prioritizePoints: false,
        showAlternatives: true,
        showPriceComparison: true,
        notifyPriceDrop: true,
        notifyRestock: true,
        notificationEmail: true,
        notificationPush: true,
        notificationFrequency: 'daily',
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('[API] Preferences GET error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();

    const result = await upsertPreferences(userId, {
      budget: body.budget,
      favoriteBrands: body.favoriteBrands,
      blockedBrands: body.blockedBrands,
      preferredPlatforms: body.preferredPlatforms,
      prioritizeFreeDelivery: body.prioritizeFreeDelivery,
      prioritizeFastDelivery: body.prioritizeFastDelivery,
      prioritizePoints: body.prioritizePoints,
      showAlternatives: body.showAlternatives,
      showPriceComparison: body.showPriceComparison,
      notifyPriceDrop: body.notifyPriceDrop,
      notifyRestock: body.notifyRestock,
      notificationEmail: body.notificationEmail,
      notificationPush: body.notificationPush,
      notificationFrequency: body.notificationFrequency,
    });

    if (!result) {
      return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Preferences PUT error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
