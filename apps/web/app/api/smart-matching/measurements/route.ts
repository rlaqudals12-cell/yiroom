/**
 * 신체 치수 API
 * GET - 치수 조회
 * PUT - 치수 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getMeasurements, upsertMeasurements } from '@/lib/smart-matching';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const measurements = await getMeasurements(userId);

    // 치수 정보가 없으면 기본값 반환
    if (!measurements) {
      return NextResponse.json({
        clerkUserId: userId,
        preferredFit: 'regular',
      });
    }

    return NextResponse.json(measurements);
  } catch (error) {
    console.error('[API] Measurements GET error:', error);
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

    const result = await upsertMeasurements(userId, {
      height: body.height,
      weight: body.weight,
      bodyType: body.bodyType,
      chest: body.chest,
      waist: body.waist,
      hip: body.hip,
      shoulder: body.shoulder,
      armLength: body.armLength,
      inseam: body.inseam,
      footLength: body.footLength,
      preferredFit: body.preferredFit,
    });

    if (!result) {
      return NextResponse.json({ error: '치수 저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Measurements PUT error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
