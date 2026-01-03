/**
 * Web Push 모듈
 * Phase L: L-1 Web Push 알림
 */

// 타입 정의
export type {
  PushSubscriptionData,
  PushSubscriptionRow,
  PushPayload,
  PushNotificationType,
  PushSendResult,
  PushSubscriptionStatus,
  PushSubscribeResponse,
  PushSendResponse,
} from './types';

// 클라이언트 함수 (브라우저 전용)
export {
  isPushSupported,
  getPushSubscriptionStatus,
  requestPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
} from './client';

// 서버 함수는 별도로 import 필요
// import { sendPushToSubscription } from '@/lib/push/server';
