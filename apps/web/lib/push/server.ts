/**
 * Web Push 서버 로직
 * Phase L: L-1 Web Push 알림
 *
 * 서버에서 Push 알림을 발송하는 함수들
 */

import webpush from 'web-push';
import type {
  PushPayload,
  PushSubscriptionRow,
  PushSendResult,
  PushSubscriptionData,
} from './types';

// VAPID 키 설정
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@yiroom.app';

// web-push 초기화
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * VAPID 설정이 완료되었는지 확인
 */
export function isVapidConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

/**
 * 단일 구독에 Push 알림 발송
 */
export async function sendPushToSubscription(
  subscription: PushSubscriptionRow | PushSubscriptionData,
  payload: PushPayload
): Promise<PushSendResult> {
  if (!isVapidConfigured()) {
    return {
      success: false,
      endpoint: 'endpoint' in subscription ? subscription.endpoint : '',
      error: 'VAPID keys not configured',
    };
  }

  // PushSubscriptionRow 형식을 web-push 형식으로 변환
  const pushSubscription: webpush.PushSubscription =
    'keys' in subscription
      ? {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        }
      : {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 60 * 60, // 1시간 (초 단위)
      urgency: 'normal',
    });

    return {
      success: true,
      endpoint: pushSubscription.endpoint,
    };
  } catch (err) {
    const error = err as Error & { statusCode?: number };
    const errorMessage = error.message || 'Unknown error';

    // 410 Gone: 구독이 만료됨 (삭제 필요)
    // 404 Not Found: 구독이 존재하지 않음 (삭제 필요)
    const isExpired = error.statusCode === 410 || error.statusCode === 404;

    return {
      success: false,
      endpoint: pushSubscription.endpoint,
      error: isExpired ? 'SUBSCRIPTION_EXPIRED' : errorMessage,
    };
  }
}

/**
 * 여러 구독에 Push 알림 일괄 발송
 */
export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: PushPayload
): Promise<PushSendResult[]> {
  const results = await Promise.all(
    subscriptions.map((sub) => sendPushToSubscription(sub, payload))
  );

  return results;
}

/**
 * 만료된 구독 필터링 (삭제 대상)
 */
export function getExpiredSubscriptions(results: PushSendResult[]): string[] {
  return results
    .filter((r) => !r.success && r.error === 'SUBSCRIPTION_EXPIRED')
    .map((r) => r.endpoint);
}

/**
 * 발송 결과 요약
 */
export function summarizeResults(results: PushSendResult[]): {
  sent: number;
  failed: number;
  expired: number;
} {
  const sent = results.filter((r) => r.success).length;
  const expired = results.filter((r) => r.error === 'SUBSCRIPTION_EXPIRED').length;
  const failed = results.length - sent;

  return { sent, failed, expired };
}
