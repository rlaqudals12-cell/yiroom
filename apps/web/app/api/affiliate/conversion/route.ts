/**
 * 어필리에이트 전환 웹훅 API
 * POST /api/affiliate/conversion
 *
 * @description 파트너사에서 전환(구매 완료) 발생 시 호출되는 콜백 API
 * 각 파트너사의 Postback/Webhook 설정에서 이 URL로 전환 데이터 전송
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateClickConversion } from '@/lib/affiliate/clicks';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import crypto from 'crypto';

/** 웹훅 요청 Body (공통 형식) */
interface ConversionWebhookBody {
  /** 파트너 식별자 */
  partner: 'iherb' | 'coupang' | 'musinsa';
  /** 이룸에서 전달한 서브 ID (클릭 ID) */
  subId?: string;
  clickId?: string;
  /** 주문 ID (파트너사 기준) */
  orderId?: string;
  transactionId?: string;
  /** 주문 금액 (원화) */
  orderAmount?: number;
  saleAmount?: number;
  /** 수수료 금액 (원화) */
  commission?: number;
  commissionAmount?: number;
  /** 전환 발생 시간 */
  convertedAt?: string;
  transactionDate?: string;
  /** 서명 (보안 검증용) */
  signature?: string;
}

/** 파트너별 Secret Key 환경변수 */
const WEBHOOK_SECRETS: Record<string, string | undefined> = {
  iherb: process.env.IHERB_WEBHOOK_SECRET,
  coupang: process.env.COUPANG_WEBHOOK_SECRET,
  musinsa: process.env.MUSINSA_WEBHOOK_SECRET,
};

/**
 * 서명 검증 (HMAC-SHA256)
 * @description 파트너사에서 전송한 서명을 검증하여 요청의 유효성 확인
 */
function verifySignature(partner: string, payload: string, signature: string): boolean {
  const secret = WEBHOOK_SECRETS[partner];

  // Secret이 없으면 검증 스킵 (개발/테스트 환경)
  if (!secret) {
    console.warn(`[Conversion] ${partner} webhook secret 미설정, 서명 검증 스킵`);
    return true;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * 클릭 ID 추출 (파트너별 필드명 대응)
 */
function extractClickId(body: ConversionWebhookBody): string | null {
  return body.clickId || body.subId || null;
}

/**
 * 주문 금액 추출 (파트너별 필드명 대응)
 */
function extractOrderAmount(body: ConversionWebhookBody): number {
  return body.orderAmount || body.saleAmount || 0;
}

/**
 * 수수료 추출 (파트너별 필드명 대응)
 */
function extractCommission(body: ConversionWebhookBody): number {
  return body.commission || body.commissionAmount || 0;
}

/**
 * POST /api/affiliate/conversion
 * 전환 웹훅 수신 및 처리
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body: ConversionWebhookBody;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 파트너 검증
    const partner = body.partner;
    if (!partner || !['iherb', 'coupang', 'musinsa'].includes(partner)) {
      return NextResponse.json({ error: 'Invalid or missing partner' }, { status: 400 });
    }

    // 서명 검증
    if (body.signature) {
      // 서명 필드 제외한 페이로드로 검증
      const { signature, ...payloadWithoutSignature } = body;
      const payloadString = JSON.stringify(payloadWithoutSignature);

      if (!verifySignature(partner, payloadString, signature)) {
        console.error(`[Conversion] ${partner} 서명 검증 실패`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // 클릭 ID 추출
    const clickId = extractClickId(body);
    if (!clickId) {
      console.warn('[Conversion] 클릭 ID 없음, 로깅만 수행');
      // 클릭 ID 없어도 로깅은 진행
      await logConversionEvent(body);
      return NextResponse.json({
        success: true,
        message: 'Logged without click association',
      });
    }

    // 전환 금액 추출
    const conversionValue = extractOrderAmount(body);
    const commission = extractCommission(body);

    // 클릭 레코드 업데이트
    const updated = await updateClickConversion(clickId, conversionValue, commission);

    if (!updated) {
      console.warn(`[Conversion] 클릭 ID ${clickId} 업데이트 실패`);
      // 실패해도 200 반환 (재시도 방지)
      return NextResponse.json({
        success: false,
        message: 'Click not found or update failed',
      });
    }

    // 일별 통계 업데이트 (비동기)
    updateDailyStats(partner, conversionValue, commission).catch((err) => {
      console.error('[Conversion] 일별 통계 업데이트 실패:', err);
    });

    console.log(
      `[Conversion] ${partner} 전환 처리 완료: clickId=${clickId}, value=${conversionValue}, commission=${commission}`
    );

    return NextResponse.json({
      success: true,
      clickId,
      conversionValue,
      commission,
    });
  } catch (error) {
    console.error('[Conversion] 웹훅 처리 에러:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 전환 이벤트 로깅 (클릭 ID 없는 경우)
 */
async function logConversionEvent(body: ConversionWebhookBody): Promise<void> {
  const supabase = createServiceRoleClient();

  // 별도 로깅 테이블이나 로그 서비스로 전송
  console.log('[Conversion] Orphan conversion event:', {
    partner: body.partner,
    orderId: body.orderId || body.transactionId,
    amount: extractOrderAmount(body),
    commission: extractCommission(body),
    timestamp: new Date().toISOString(),
  });

  // 향후 affiliate_conversion_logs 테이블 추가 가능
  // await supabase.from('affiliate_conversion_logs').insert({...});
}

/**
 * 일별 통계 테이블 업데이트
 */
async function updateDailyStats(
  partner: string,
  conversionValue: number,
  commission: number
): Promise<void> {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().split('T')[0];

  // 파트너 ID 조회
  const { data: partnerData } = await supabase
    .from('affiliate_partners')
    .select('id')
    .eq('name', partner)
    .single();

  if (!partnerData) {
    console.warn(`[Conversion] 파트너 ${partner} 없음`);
    return;
  }

  // 오늘 통계 존재 여부 확인
  const { data: existing } = await supabase
    .from('affiliate_daily_stats')
    .select('*')
    .eq('partner_id', partnerData.id)
    .eq('date', today)
    .single();

  if (existing) {
    // 기존 레코드 업데이트
    await supabase
      .from('affiliate_daily_stats')
      .update({
        conversions: (existing.conversions || 0) + 1,
        total_sales_krw: (existing.total_sales_krw || 0) + conversionValue,
        total_commission_krw: (existing.total_commission_krw || 0) + commission,
        conversion_rate:
          existing.total_clicks > 0
            ? (((existing.conversions || 0) + 1) / existing.total_clicks) * 100
            : 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // 새 레코드 생성
    await supabase.from('affiliate_daily_stats').insert({
      partner_id: partnerData.id,
      date: today,
      conversions: 1,
      total_sales_krw: conversionValue,
      total_commission_krw: commission,
      total_clicks: 0,
      unique_clicks: 0,
      conversion_rate: 0,
    });
  }
}

/**
 * GET /api/affiliate/conversion
 * 헬스체크 및 문서
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/affiliate/conversion',
    method: 'POST',
    description: '어필리에이트 전환 웹훅 수신 API',
    partners: ['iherb', 'coupang', 'musinsa'],
    requiredFields: {
      partner: 'string (iherb | coupang | musinsa)',
      subId: 'string (클릭 ID)',
    },
    optionalFields: {
      orderId: 'string',
      orderAmount: 'number',
      commission: 'number',
      signature: 'string (HMAC-SHA256)',
    },
    status: 'active',
  });
}
