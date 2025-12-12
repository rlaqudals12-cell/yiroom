/**
 * N-1 수분 섭취 API (Task 2.10)
 *
 * GET /api/nutrition/water?date=YYYY-MM-DD - 일일 수분 조회
 * POST /api/nutrition/water - 수분 기록 추가
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 음료 종류별 수분 흡수율 (스펙 섹션 2.7)
const HYDRATION_FACTORS: Record<string, number> = {
  water: 1.0, // 물: 100%
  tea: 0.9, // 차: 90% (소량 카페인)
  coffee: 0.8, // 커피: 80% (카페인 이뇨 작용)
  juice: 0.7, // 주스: 70% (당분 포함)
  soda: 0.6, // 탄산음료: 60% (당분 + 탄산)
  other: 0.8, // 기타: 80%
};

// 유효한 음료 타입
const VALID_DRINK_TYPES = [
  'water',
  'tea',
  'coffee',
  'juice',
  'soda',
  'other',
] as const;
// DrinkType은 VALID_DRINK_TYPES에서 추론됨 (타입 검증용)

/**
 * GET /api/nutrition/water?date=YYYY-MM-DD
 * 해당 날짜의 수분 섭취 기록 조회
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터에서 날짜 추출
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    // 날짜 형식 검증 (YYYY-MM-DD)
    let targetDate: string;
    if (dateParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      targetDate = dateParam;
    } else {
      // 오늘 날짜 (한국 시간 기준)
      const now = new Date();
      const koreaOffset = 9 * 60; // UTC+9
      const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
      targetDate = koreaTime.toISOString().split('T')[0];
    }

    const supabase = createServiceRoleClient();

    // 해당 날짜의 모든 수분 기록 조회
    const { data: records, error } = await supabase
      .from('water_records')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('record_date', targetDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[N-1] Water records fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch water records' },
        { status: 500 }
      );
    }

    // 총 수분량 계산
    let totalAmountMl = 0;
    let totalEffectiveMl = 0;

    const recordsWithDetails =
      records?.map((record) => {
        totalAmountMl += record.amount_ml || 0;
        totalEffectiveMl += record.effective_ml || record.amount_ml || 0;

        return {
          id: record.id,
          drinkType: record.drink_type,
          amountMl: record.amount_ml,
          hydrationFactor: record.hydration_factor,
          effectiveMl: record.effective_ml,
          recordTime: record.record_time,
          createdAt: record.created_at,
        };
      }) || [];

    // 음료 타입별 합계
    const byDrinkType: Record<string, { amountMl: number; effectiveMl: number }> =
      {};
    records?.forEach((record) => {
      const type = record.drink_type || 'water';
      if (!byDrinkType[type]) {
        byDrinkType[type] = { amountMl: 0, effectiveMl: 0 };
      }
      byDrinkType[type].amountMl += record.amount_ml || 0;
      byDrinkType[type].effectiveMl += record.effective_ml || record.amount_ml || 0;
    });

    return NextResponse.json({
      date: targetDate,
      totalAmountMl,
      totalEffectiveMl,
      recordCount: records?.length || 0,
      records: recordsWithDetails,
      byDrinkType,
    });
  } catch (error) {
    console.error('[N-1] Water GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nutrition/water
 * 수분 섭취 기록 추가
 *
 * Body:
 * - drinkType: 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'other'
 * - amountMl: number (ml 단위)
 * - recordTime?: string (HH:MM 형식, 없으면 현재 시간)
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { drinkType = 'water', amountMl, recordTime } = body;

    // 입력 검증
    if (!amountMl || typeof amountMl !== 'number' || amountMl <= 0) {
      return NextResponse.json(
        { error: 'Invalid amountMl. Must be a positive number.' },
        { status: 400 }
      );
    }

    if (amountMl > 5000) {
      return NextResponse.json(
        { error: 'amountMl cannot exceed 5000ml' },
        { status: 400 }
      );
    }

    // 음료 타입 검증
    if (!VALID_DRINK_TYPES.includes(drinkType)) {
      return NextResponse.json(
        {
          error: `Invalid drinkType. Must be one of: ${VALID_DRINK_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 수분 흡수율 및 실제 수분량 계산
    const hydrationFactor = HYDRATION_FACTORS[drinkType] || 1.0;
    const effectiveMl = Math.round(amountMl * hydrationFactor);

    // 현재 시간 (한국 시간 기준)
    const now = new Date();
    const koreaOffset = 9 * 60; // UTC+9
    const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
    const recordDate = koreaTime.toISOString().split('T')[0];

    // recordTime 검증 (HH:MM 형식)
    let finalRecordTime: string;
    if (recordTime) {
      if (!/^\d{2}:\d{2}$/.test(recordTime)) {
        return NextResponse.json(
          { error: 'Invalid recordTime format. Use HH:MM' },
          { status: 400 }
        );
      }
      finalRecordTime = recordTime;
    } else {
      finalRecordTime = koreaTime.toISOString().split('T')[1].substring(0, 5);
    }

    const supabase = createServiceRoleClient();

    // 수분 기록 저장
    const { data: record, error } = await supabase
      .from('water_records')
      .insert({
        clerk_user_id: userId,
        record_date: recordDate,
        record_time: finalRecordTime,
        drink_type: drinkType,
        amount_ml: amountMl,
        hydration_factor: hydrationFactor,
        effective_ml: effectiveMl,
      })
      .select()
      .single();

    if (error) {
      console.error('[N-1] Water record insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save water record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: {
        id: record.id,
        drinkType: record.drink_type,
        amountMl: record.amount_ml,
        hydrationFactor: record.hydration_factor,
        effectiveMl: record.effective_ml,
        recordDate: record.record_date,
        recordTime: record.record_time,
        createdAt: record.created_at,
      },
    });
  } catch (error) {
    console.error('[N-1] Water POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
