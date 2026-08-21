/**
 * 스마트 알림 API 클라이언트
 * @description 가격 알림, 재입고 알림, 소진 예측 알림 관리를 웹 정본 API에 위임
 */

import type { SmartNotification, NotificationType } from '@/types/smart-matching';

import { missingSmartMatchingApi, requestSmartMatching } from './api-client';

type SerializedNotification = Omit<
  SmartNotification,
  'readAt' | 'scheduledFor' | 'sentAt' | 'createdAt'
> & {
  readAt?: string;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
};

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

function toNotification(payload: SerializedNotification): SmartNotification {
  return {
    ...payload,
    readAt: payload.readAt ? new Date(payload.readAt) : undefined,
    scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : undefined,
    sentAt: payload.sentAt ? new Date(payload.sentAt) : undefined,
    createdAt: new Date(payload.createdAt),
  };
}

/**
 * 사용자의 알림 목록 조회
 */
export async function getNotifications(
  _clerkUserId: string,
  options?: {
    unreadOnly?: boolean;
    type?: NotificationType;
    limit?: number;
  },
  clerkToken?: string
): Promise<SmartNotification[]> {
  const query = new URLSearchParams();
  if (options?.unreadOnly) query.set('unread', 'true');
  if (options?.type) query.set('type', options.type);

  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  const payload = await requestSmartMatching<
    ApiEnvelope<{
      notifications: SerializedNotification[];
      unreadCount: number;
    }>
  >(`/api/smart-matching/notifications${suffix}`, clerkToken, { method: 'GET' });

  const notifications = payload.data.notifications.map(toNotification);
  return options?.limit ? notifications.slice(0, options.limit) : notifications;
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadCount(_clerkUserId: string, clerkToken?: string): Promise<number> {
  const payload = await requestSmartMatching<ApiEnvelope<{ unreadCount: number }>>(
    '/api/smart-matching/notifications?count=true',
    clerkToken,
    { method: 'GET' }
  );
  return payload.data.unreadCount;
}

/**
 * 알림 생성
 */
export async function createNotification(
  input: {
    clerkUserId: string;
    notificationType: NotificationType;
    title: string;
    message: string;
    imageUrl?: string;
    productId?: string;
    inventoryItemId?: string;
    actionUrl?: string;
    scheduledFor?: Date;
  },
  clerkToken?: string
): Promise<SmartNotification | null> {
  const payload = await requestSmartMatching<ApiEnvelope<SerializedNotification>>(
    '/api/smart-matching/notifications',
    clerkToken,
    {
      method: 'POST',
      body: JSON.stringify({
        notificationType: input.notificationType,
        title: input.title,
        message: input.message,
        imageUrl: input.imageUrl,
        productId: input.productId,
        inventoryItemId: input.inventoryItemId,
        actionUrl: input.actionUrl,
        scheduledFor: input.scheduledFor?.toISOString(),
      }),
    }
  );
  return toNotification(payload.data);
}

/**
 * 알림 읽음 처리
 */
export async function markAsRead(notificationId: string, clerkToken?: string): Promise<boolean> {
  const payload = await requestSmartMatching<ApiEnvelope<{ success: boolean }>>(
    `/api/smart-matching/notifications/${encodeURIComponent(notificationId)}`,
    clerkToken,
    { method: 'PATCH' }
  );
  return payload.data.success;
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead(_clerkUserId: string, clerkToken?: string): Promise<boolean> {
  const payload = await requestSmartMatching<ApiEnvelope<{ success: boolean }>>(
    '/api/smart-matching/notifications',
    clerkToken,
    {
      method: 'POST',
      body: JSON.stringify({ action: 'markAllAsRead' }),
    }
  );
  return payload.data.success;
}

/**
 * 알림 삭제
 */
export async function deleteNotification(
  notificationId: string,
  clerkToken?: string
): Promise<boolean> {
  const payload = await requestSmartMatching<ApiEnvelope<{ success: boolean }>>(
    `/api/smart-matching/notifications/${encodeURIComponent(notificationId)}`,
    clerkToken,
    { method: 'DELETE' }
  );
  return payload.data.success;
}

/**
 * 오래된 알림 정리 (30일 이상)
 */
export async function cleanupOldNotifications(days: number = 30): Promise<number> {
  return missingSmartMatchingApi(`${days}일 이전 알림 정리`);
}

/**
 * 발송 예정 알림 조회
 */
export async function getScheduledNotifications(): Promise<SmartNotification[]> {
  return missingSmartMatchingApi('발송 예정 알림 조회');
}

/**
 * 알림 발송 완료 처리
 */
export async function markAsSent(_notificationId: string): Promise<boolean> {
  return missingSmartMatchingApi('알림 발송 완료 처리');
}

// ============================================
// 알림 생성 헬퍼 함수
// ============================================

/**
 * 가격 하락 알림 생성
 */
export async function createPriceDropNotification(
  input: {
    clerkUserId: string;
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    platform: string;
    actionUrl: string;
  },
  clerkToken?: string
): Promise<SmartNotification | null> {
  const discountPercent = Math.round(((input.oldPrice - input.newPrice) / input.oldPrice) * 100);

  return createNotification(
    {
      clerkUserId: input.clerkUserId,
      notificationType: 'price_drop',
      title: '가격 하락 알림',
      message: `${input.productName}이(가) ${discountPercent}% 할인 중이에요! (${input.platform})`,
      productId: input.productId,
      actionUrl: input.actionUrl,
    },
    clerkToken
  );
}

/**
 * 재입고 알림 생성
 */
export async function createRestockNotification(
  input: {
    clerkUserId: string;
    productId: string;
    productName: string;
    size?: string;
    actionUrl: string;
  },
  clerkToken?: string
): Promise<SmartNotification | null> {
  const sizeText = input.size ? ` (${input.size} 사이즈)` : '';

  return createNotification(
    {
      clerkUserId: input.clerkUserId,
      notificationType: 'back_in_stock',
      title: '재입고 알림',
      message: `${input.productName}${sizeText}이(가) 재입고되었어요!`,
      productId: input.productId,
      actionUrl: input.actionUrl,
    },
    clerkToken
  );
}

/**
 * 소진 예측 알림 생성
 */
export async function createRunningLowNotification(
  input: {
    clerkUserId: string;
    inventoryItemId: string;
    productName: string;
    daysRemaining: number;
    actionUrl?: string;
  },
  clerkToken?: string
): Promise<SmartNotification | null> {
  return createNotification(
    {
      clerkUserId: input.clerkUserId,
      notificationType: 'product_running_low',
      title: '소진 예정 알림',
      message: `${input.productName}이(가) 약 ${input.daysRemaining}일 후 소진될 예정이에요.`,
      inventoryItemId: input.inventoryItemId,
      actionUrl: input.actionUrl,
    },
    clerkToken
  );
}

/**
 * 유통기한 알림 생성
 */
export async function createExpiryNotification(
  input: {
    clerkUserId: string;
    inventoryItemId: string;
    productName: string;
    daysUntilExpiry: number;
  },
  clerkToken?: string
): Promise<SmartNotification | null> {
  return createNotification(
    {
      clerkUserId: input.clerkUserId,
      notificationType: 'expiry_approaching',
      title: '유통기한 알림',
      message: `${input.productName}의 유통기한이 ${input.daysUntilExpiry}일 남았어요.`,
      inventoryItemId: input.inventoryItemId,
    },
    clerkToken
  );
}

// ============================================
// 소진 예측
// ============================================

export interface ConsumptionPrediction {
  inventoryItemId: string;
  purchaseDate: Date;
  averageUsageDays: number;
  usagePattern: 'daily' | 'weekly' | 'occasional';
  estimatedEmptyDate: Date;
  confidenceLevel: number;
  reminderDays: number;
  autoReorderEnabled: boolean;
}

/**
 * 제품 소진일 예측
 */
export function predictConsumption(
  purchaseDate: Date,
  productCategory: string,
  usageFrequency?: 'daily' | 'weekly' | 'occasional'
): ConsumptionPrediction {
  // 카테고리별 평균 사용 기간 (일)
  const categoryDuration: Record<string, number> = {
    skincare: 60,
    makeup: 120,
    supplement: 30,
    haircare: 90,
    bodycare: 45,
    default: 60,
  };

  const baseUsageDays = categoryDuration[productCategory] ?? categoryDuration.default;

  // 사용 빈도에 따른 조정
  const frequencyMultiplier = {
    daily: 1.0,
    weekly: 2.5,
    occasional: 4.0,
  };

  const pattern = usageFrequency ?? 'daily';
  const adjustedUsageDays = Math.round(baseUsageDays * frequencyMultiplier[pattern]);

  const estimatedEmptyDate = new Date(purchaseDate);
  estimatedEmptyDate.setDate(estimatedEmptyDate.getDate() + adjustedUsageDays);

  const confidenceLevel = usageFrequency ? 0.7 : 0.5;

  return {
    inventoryItemId: '',
    purchaseDate,
    averageUsageDays: adjustedUsageDays,
    usagePattern: pattern,
    estimatedEmptyDate,
    confidenceLevel,
    reminderDays: 7,
    autoReorderEnabled: false,
  };
}

/**
 * 재주문 알림 필요 여부 확인
 */
export function shouldSendReorderReminder(
  prediction: ConsumptionPrediction,
  currentDate: Date = new Date()
): boolean {
  const reminderDate = new Date(prediction.estimatedEmptyDate);
  reminderDate.setDate(reminderDate.getDate() - prediction.reminderDays);

  return currentDate >= reminderDate && currentDate < prediction.estimatedEmptyDate;
}

/**
 * 유통기한 임박 확인
 */
export function isExpiryApproaching(
  expiryDate: Date,
  warningDays: number = 30,
  currentDate: Date = new Date()
): boolean {
  const warningDate = new Date(expiryDate);
  warningDate.setDate(warningDate.getDate() - warningDays);

  return currentDate >= warningDate && currentDate < expiryDate;
}

// ============================================
// 알림 스타일 헬퍼
// ============================================

/**
 * 알림 타입별 스타일 반환
 */
export function getNotificationStyle(type: NotificationType): {
  icon: string;
  color: string;
  bgColor: string;
} {
  const styles: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
    product_running_low: { icon: '⚠️', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    expiry_approaching: { icon: '⏰', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    price_drop: { icon: '💰', color: 'text-green-600', bgColor: 'bg-green-50' },
    back_in_stock: { icon: '📦', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    new_recommendation: { icon: '✨', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    size_available: { icon: '👕', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    similar_product: { icon: '🔍', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    reorder_reminder: { icon: '🔔', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  };

  return styles[type];
}
