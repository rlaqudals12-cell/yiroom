/**
 * 어필리에이트 웹훅 서명 검증
 * @description HMAC-SHA256 기반 웹훅 페이로드 무결성 검증
 */

import { affiliateLogger } from '@/lib/utils/logger';
import type { AffiliatePartnerName } from '@/types/affiliate';

// 파트너별 서명 헤더 이름
const SIGNATURE_HEADERS: Record<string, string> = {
  coupang: 'x-coupang-signature',
  iherb: 'x-iherb-signature',
  musinsa: 'x-musinsa-signature',
};

// 파트너별 웹훅 시크릿 환경변수 이름
const SECRET_ENV_KEYS: Record<string, string> = {
  coupang: 'COUPANG_WEBHOOK_SECRET',
  iherb: 'IHERB_WEBHOOK_SECRET',
  musinsa: 'MUSINSA_WEBHOOK_SECRET',
};

/**
 * HMAC-SHA256 서명 생성
 */
export async function createHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 웹훅 서명 검증
 * @returns true면 유효한 서명
 */
export async function verifyWebhookSignature(
  partner: AffiliatePartnerName,
  payload: string,
  receivedSignature: string
): Promise<boolean> {
  const secretKey = SECRET_ENV_KEYS[partner];
  if (!secretKey) {
    affiliateLogger.warn(`알 수 없는 파트너: ${partner}`);
    return false;
  }

  const secret = process.env[secretKey];
  if (!secret) {
    // 시크릿 미설정 시 개발 환경에서는 통과, 프로덕션에서는 거부
    if (process.env.NODE_ENV === 'production') {
      affiliateLogger.error(`${partner} 웹훅 시크릿 미설정`);
      return false;
    }
    affiliateLogger.warn(`${partner} 웹훅 시크릿 미설정 (개발 모드 통과)`);
    return true;
  }

  const expectedSignature = await createHmacSignature(payload, secret);

  // 타이밍 공격 방지: 고정 시간 비교
  return timingSafeEqual(expectedSignature, receivedSignature);
}

/**
 * 타이밍 공격 방지 문자열 비교
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * 요청 헤더에서 서명 추출
 */
export function getSignatureFromHeaders(
  partner: AffiliatePartnerName,
  headers: Headers
): string | null {
  const headerName = SIGNATURE_HEADERS[partner];
  if (!headerName) return null;
  return headers.get(headerName);
}

/**
 * 웹훅 타임스탬프 유효성 검증 (리플레이 공격 방지)
 * @param timestamp - 웹훅 발송 시각 (ISO 8601)
 * @param toleranceMs - 허용 시간 차이 (기본 5분)
 */
export function isTimestampValid(timestamp: string, toleranceMs = 5 * 60 * 1000): boolean {
  const webhookTime = new Date(timestamp).getTime();
  if (isNaN(webhookTime)) return false;

  const now = Date.now();
  return Math.abs(now - webhookTime) <= toleranceMs;
}
