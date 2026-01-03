/**
 * Web Push 클라이언트 로직
 * Phase L: L-1 Web Push 알림
 *
 * 브라우저에서 Push 구독을 관리하는 함수들
 */

import type { PushSubscriptionData, PushSubscriptionStatus } from './types';

// VAPID 공개 키 (환경변수에서)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * URL-safe Base64 문자열을 Uint8Array로 변환
 * Push 구독 시 applicationServerKey로 사용
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray as Uint8Array<ArrayBuffer>;
}

/**
 * Push 알림 지원 여부 확인
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * 현재 Push 구독 상태 확인
 */
export async function getPushSubscriptionStatus(): Promise<PushSubscriptionStatus> {
  if (!isPushSupported()) {
    return {
      isSupported: false,
      isSubscribed: false,
      permission: 'default',
      subscription: null,
    };
  }

  const permission = Notification.permission;
  let subscription: PushSubscription | null = null;

  try {
    const registration = await navigator.serviceWorker.ready;
    subscription = await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push] Failed to get subscription:', error);
  }

  return {
    isSupported: true,
    isSubscribed: !!subscription,
    permission,
    subscription,
  };
}

/**
 * Push 알림 권한 요청
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('[Push] Permission request failed:', error);
    return 'denied';
  }
}

/**
 * Push 구독 등록
 * 서버에 구독 정보 저장
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VAPID public key not configured');
    return null;
  }

  try {
    // 권한 확인
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Permission not granted:', permission);
      return null;
    }

    // Service Worker 준비 대기
    const registration = await navigator.serviceWorker.ready;

    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    // 새 구독 생성
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // 서버에 구독 정보 저장
    const subscriptionData = subscription.toJSON() as PushSubscriptionData;
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    console.log('[Push] Successfully subscribed');
    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Push 구독 해제
 * 서버에서도 구독 정보 삭제
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('[Push] No subscription to unsubscribe');
      return true;
    }

    // 서버에서 구독 삭제
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) {
      console.warn('[Push] Server unsubscribe failed:', response.status);
    }

    // 브라우저 구독 해제
    const success = await subscription.unsubscribe();
    console.log('[Push] Unsubscribed:', success);
    return success;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * 테스트 푸시 알림 요청
 */
export async function sendTestPush(): Promise<boolean> {
  try {
    const response = await fetch('/api/push/test', {
      method: 'POST',
    });

    return response.ok;
  } catch (error) {
    console.error('[Push] Test push failed:', error);
    return false;
  }
}
