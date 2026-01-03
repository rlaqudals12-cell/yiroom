/**
 * Service Worker Push Notification Handler
 * Phase L: L-1 Web Push 알림
 *
 * 이 파일은 @ducanh2912/next-pwa에 의해 Service Worker에 포함됩니다.
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// 알림 타입별 아이콘 및 경로 매핑
const NOTIFICATION_CONFIG: Record<string, { icon: string; badge: string; url: string }> = {
  workout_reminder: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/workout',
  },
  nutrition_reminder: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/nutrition',
  },
  streak_warning: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/home',
  },
  daily_checkin: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/home',
  },
  badge_earned: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/profile/badges',
  },
  level_up: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/profile',
  },
  friend_request: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/friends/requests',
  },
  challenge_invite: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/challenges',
  },
  default: {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/home',
  },
};

interface PushData {
  title: string;
  body: string;
  type?: string;
  tag?: string;
  data?: Record<string, unknown>;
  url?: string;
}

// Service Worker의 NotificationOptions는 actions를 지원하지만 TypeScript DOM lib에는 없음
interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: Array<{ action: string; title: string }>;
}

// Push 이벤트 핸들러: 서버에서 푸시 메시지 수신 시
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW] Push event received but no data');
    return;
  }

  try {
    const data = event.data.json() as PushData;

    const notificationType = data.type || 'default';
    const config = NOTIFICATION_CONFIG[notificationType] || NOTIFICATION_CONFIG.default;

    const options: ExtendedNotificationOptions = {
      body: data.body,
      icon: config.icon,
      badge: config.badge,
      tag: data.tag || notificationType,
      data: {
        url: data.url || config.url,
        ...data.data,
      },
      // 알림 유지 시간 (자동 닫힘 방지)
      requireInteraction: notificationType === 'streak_warning',
      // 알림 동작 버튼
      actions:
        notificationType === 'workout_reminder'
          ? [
              { action: 'start', title: '운동 시작' },
              { action: 'later', title: '나중에' },
            ]
          : undefined,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error('[SW] Failed to process push event:', error);
  }
});

// 알림 클릭 핸들러: 사용자가 알림 클릭 시
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data as { url?: string };
  let targetUrl = notificationData?.url || '/home';

  // 액션 버튼 처리
  if (action === 'start') {
    targetUrl = '/workout/session';
  } else if (action === 'later') {
    // 나중에 버튼: 알림만 닫고 아무것도 안함
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }
      // 같은 도메인의 창이 있으면 네비게이트
      for (const client of clientList) {
        if ('navigate' in client && 'focus' in client) {
          return (client as WindowClient)
            .navigate(targetUrl)
            .then(() => (client as WindowClient).focus());
        }
      }
      // 새 창 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});

// 알림 닫힘 핸들러 (분석용)
self.addEventListener('notificationclose', (event) => {
  const notificationData = event.notification.data;
  console.log('[SW] Notification closed:', notificationData);
});

// Push 구독 변경 핸들러
self.addEventListener('pushsubscriptionchange', ((event: Event) => {
  console.log('[SW] Push subscription changed');

  const extendableEvent = event as ExtendableEvent;
  // 새 구독 요청 및 서버 동기화
  extendableEvent.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
      })
      .then((subscription: PushSubscription) => {
        // 서버에 새 구독 정보 전송
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
      })
      .catch((error: Error) => {
        console.error('[SW] Failed to resubscribe:', error);
      })
  );
}) as EventListener);

export {};
