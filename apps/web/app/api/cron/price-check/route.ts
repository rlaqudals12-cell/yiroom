/**
 * Cron 가격 알림 체크 API
 * @description 활성 price_watches의 가격 조건 충족 여부를 체크하고 알림 생성
 *
 * GET /api/cron/price-check
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/price-check",
 *     "schedule": "0 9 * * *"  // 매일 오전 9시 (UTC)
 *   }]
 * }
 *
 * 동작 방식:
 * 1. 활성 price_watches 조회 (notified=false, 만료되지 않은 것)
 * 2. 각 watch의 가격 조건 충족 여부 체크
 *    - target_price: 현재가 <= 목표가
 *    - percent_drop: 현재 하락률 >= 목표 %
 * 3. 조건 충족 시 smart_notifications에 알림 생성 + notified=true 처리
 * 4. 만료된 watch 정리
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 가격 조건 체크 결과
interface PriceCheckResult {
  processed: number;
  notified: number;
  expired: number;
  errors: number;
}

// Vercel Cron 인증 검증
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  const vercelSignature = request.headers.get('x-vercel-cron-signature');
  if (vercelSignature) {
    return true;
  }

  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/**
 * 가격 조건 충족 여부 판단
 * - target_price: 현재 최저가가 목표가 이하인지
 * - percent_drop: 가격 히스토리 기반 하락률이 목표 % 이상인지
 */
function isPriceConditionMet(watch: {
  target_price: number | null;
  percent_drop: number | null;
  current_lowest_price: number | null;
  original_price: number | null;
}): boolean {
  const currentPrice = watch.current_lowest_price;
  if (currentPrice === null || currentPrice === undefined) {
    return false;
  }

  // 목표가 조건
  if (watch.target_price !== null && currentPrice <= watch.target_price) {
    return true;
  }

  // 하락률 조건: 원래 가격 대비 현재가 하락률 체크
  if (watch.percent_drop !== null && watch.original_price !== null && watch.original_price > 0) {
    const dropPercent = ((watch.original_price - currentPrice) / watch.original_price) * 100;
    if (dropPercent >= watch.percent_drop) {
      return true;
    }
  }

  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 인증 검증
  if (!validateCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.info('[Cron] Starting price-check...');

  try {
    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    const result: PriceCheckResult = {
      processed: 0,
      notified: 0,
      expired: 0,
      errors: 0,
    };

    // 1. 만료된 watch 정리
    const { data: expiredData } = await supabase
      .from('price_watches')
      .delete()
      .lt('expires_at', now)
      .not('expires_at', 'is', null)
      .select('id');

    result.expired = expiredData?.length ?? 0;

    if (result.expired > 0) {
      console.info(`[Cron] price-check: ${result.expired}건 만료 watch 정리`);
    }

    // 2. 활성 price_watches 조회 (알림 미발송 + 만료되지 않은 것)
    const { data: watches, error: watchError } = await supabase
      .from('price_watches')
      .select(
        'id, clerk_user_id, product_id, target_price, percent_drop, current_lowest_price, lowest_platform'
      )
      .eq('notified', false);

    if (watchError) {
      console.error('[Cron] price-check: watch 조회 실패', watchError);
      return NextResponse.json(
        { error: 'Failed to query watches', message: '서버 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!watches || watches.length === 0) {
      console.info('[Cron] price-check: 활성 watch 없음');
      return NextResponse.json({
        success: true,
        ...result,
        completedAt: now,
      });
    }

    // 3. 제품 정보 일괄 조회 (이름, 원래 가격)
    const productIds = [...new Set(watches.map((w) => w.product_id))];
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds);

    const productMap = new Map(
      (products ?? []).map((p: { id: string; name: string; price: number | null }) => [
        p.id,
        { name: p.name, price: p.price },
      ])
    );

    // 4. 각 watch 가격 조건 체크
    for (const watch of watches) {
      result.processed++;

      try {
        const product = productMap.get(watch.product_id);
        const productName = product?.name ?? '알 수 없는 제품';
        const originalPrice = product?.price ?? null;

        const conditionMet = isPriceConditionMet({
          target_price: watch.target_price,
          percent_drop: watch.percent_drop,
          current_lowest_price: watch.current_lowest_price,
          original_price: originalPrice,
        });

        if (!conditionMet) {
          continue;
        }

        // 조건 충족: 알림 생성
        const currentPrice = watch.current_lowest_price ?? 0;
        const platform = watch.lowest_platform ?? '';
        const discountPercent =
          originalPrice && originalPrice > 0
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

        const { error: notifError } = await supabase.from('smart_notifications').insert({
          clerk_user_id: watch.clerk_user_id,
          notification_type: 'price_drop',
          title: '가격 하락 알림',
          message: `${productName}이(가) ${discountPercent}% 할인 중이에요! (${platform})`,
          product_id: watch.product_id,
          action_url: `/products/${watch.product_id}`,
        });

        if (notifError) {
          console.error('[Cron] price-check: 알림 생성 실패', notifError);
          result.errors++;
          continue;
        }

        // 알림 발송 완료 처리
        const { error: markError } = await supabase
          .from('price_watches')
          .update({
            notified: true,
            notified_at: new Date().toISOString(),
          })
          .eq('id', watch.id);

        if (markError) {
          console.error('[Cron] price-check: notified 마킹 실패', markError);
          result.errors++;
          continue;
        }

        result.notified++;
      } catch (err) {
        console.error('[Cron] price-check: watch 처리 실패', err);
        result.errors++;
      }
    }

    console.info(
      `[Cron] price-check 완료: ${result.processed}건 처리, ${result.notified}건 알림, ${result.expired}건 만료 정리`
    );

    return NextResponse.json({
      success: true,
      ...result,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] price-check:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

// POST도 지원 (수동 트리거용)
export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
