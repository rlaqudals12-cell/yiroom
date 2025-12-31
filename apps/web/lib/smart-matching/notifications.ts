/**
 * 스마트 알림 Repository
 * @description 가격 알림, 재입고 알림, 소진 예측 알림 관리
 */

import { supabase } from '@/lib/supabase/client';
import { smartMatchingLogger } from '@/lib/utils/logger';
import type {
  SmartNotification,
  SmartNotificationDB,
  NotificationType,
} from '@/types/smart-matching';
import { mapNotificationRow } from '@/types/smart-matching';

/**
 * 사용자의 알림 목록 조회
 */
export async function getNotifications(
  clerkUserId: string,
  options?: {
    unreadOnly?: boolean;
    type?: NotificationType;
    limit?: number;
  }
): Promise<SmartNotification[]> {
  let query = supabase.from('smart_notifications').select('*').eq('clerk_user_id', clerkUserId);

  if (options?.unreadOnly) {
    query = query.eq('read', false);
  }

  if (options?.type) {
    query = query.eq('notification_type', options.type);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as SmartNotificationDB[]).map(mapNotificationRow);
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadCount(clerkUserId: string): Promise<number> {
  const { count, error } = await supabase
    .from('smart_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('clerk_user_id', clerkUserId)
    .eq('read', false);

  if (error) {
    smartMatchingLogger.error('알림 개수 조회 실패:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * 알림 생성
 */
export async function createNotification(input: {
  clerkUserId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;
  productId?: string;
  inventoryItemId?: string;
  actionUrl?: string;
  scheduledFor?: Date;
}): Promise<SmartNotification | null> {
  const { data, error } = await supabase
    .from('smart_notifications')
    .insert({
      clerk_user_id: input.clerkUserId,
      notification_type: input.notificationType,
      title: input.title,
      message: input.message,
      image_url: input.imageUrl ?? null,
      product_id: input.productId ?? null,
      inventory_item_id: input.inventoryItemId ?? null,
      action_url: input.actionUrl ?? null,
      scheduled_for: input.scheduledFor?.toISOString() ?? null,
    })
    .select()
    .single();

  if (error) {
    smartMatchingLogger.error('알림 생성 실패:', error);
    return null;
  }

  return mapNotificationRow(data as SmartNotificationDB);
}

/**
 * 알림 읽음 처리
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('smart_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    smartMatchingLogger.error('알림 읽음 처리 실패:', error);
    return false;
  }

  return true;
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead(clerkUserId: string): Promise<boolean> {
  const { error } = await supabase
    .from('smart_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId)
    .eq('read', false);

  if (error) {
    smartMatchingLogger.error('알림 전체 읽음 처리 실패:', error);
    return false;
  }

  return true;
}

/**
 * 알림 삭제
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase.from('smart_notifications').delete().eq('id', notificationId);

  if (error) {
    smartMatchingLogger.error('알림 삭제 실패:', error);
    return false;
  }

  return true;
}

/**
 * 오래된 알림 정리 (30일 이상)
 */
export async function cleanupOldNotifications(days: number = 30): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const { data, error } = await supabase
    .from('smart_notifications')
    .delete()
    .lt('created_at', cutoff.toISOString())
    .eq('read', true)
    .select();

  if (error) {
    smartMatchingLogger.error('알림 정리 실패:', error);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * 발송 예정 알림 조회
 */
export async function getScheduledNotifications(): Promise<SmartNotification[]> {
  const { data, error } = await supabase
    .from('smart_notifications')
    .select('*')
    .is('sent_at', null)
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as SmartNotificationDB[]).map(mapNotificationRow);
}

/**
 * 알림 발송 완료 처리
 */
export async function markAsSent(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('smart_notifications')
    .update({
      sent_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    smartMatchingLogger.error('알림 발송 처리 실패:', error);
    return false;
  }

  return true;
}

// ============================================
// 알림 생성 헬퍼 함수
// ============================================

/**
 * 가격 하락 알림 생성
 */
export async function createPriceDropNotification(input: {
  clerkUserId: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  platform: string;
  actionUrl: string;
}): Promise<SmartNotification | null> {
  const discountPercent = Math.round(((input.oldPrice - input.newPrice) / input.oldPrice) * 100);

  return createNotification({
    clerkUserId: input.clerkUserId,
    notificationType: 'price_drop',
    title: '가격 하락 알림',
    message: `${input.productName}이(가) ${discountPercent}% 할인 중이에요! (${input.platform})`,
    productId: input.productId,
    actionUrl: input.actionUrl,
  });
}

/**
 * 재입고 알림 생성
 */
export async function createRestockNotification(input: {
  clerkUserId: string;
  productId: string;
  productName: string;
  size?: string;
  actionUrl: string;
}): Promise<SmartNotification | null> {
  const sizeText = input.size ? ` (${input.size} 사이즈)` : '';

  return createNotification({
    clerkUserId: input.clerkUserId,
    notificationType: 'back_in_stock',
    title: '재입고 알림',
    message: `${input.productName}${sizeText}이(가) 재입고되었어요!`,
    productId: input.productId,
    actionUrl: input.actionUrl,
  });
}

/**
 * 소진 예측 알림 생성
 */
export async function createRunningLowNotification(input: {
  clerkUserId: string;
  inventoryItemId: string;
  productName: string;
  daysRemaining: number;
  actionUrl?: string;
}): Promise<SmartNotification | null> {
  return createNotification({
    clerkUserId: input.clerkUserId,
    notificationType: 'product_running_low',
    title: '소진 예정 알림',
    message: `${input.productName}이(가) 약 ${input.daysRemaining}일 후 소진될 예정이에요.`,
    inventoryItemId: input.inventoryItemId,
    actionUrl: input.actionUrl,
  });
}

/**
 * 유통기한 알림 생성
 */
export async function createExpiryNotification(input: {
  clerkUserId: string;
  inventoryItemId: string;
  productName: string;
  daysUntilExpiry: number;
}): Promise<SmartNotification | null> {
  return createNotification({
    clerkUserId: input.clerkUserId,
    notificationType: 'expiry_approaching',
    title: '유통기한 알림',
    message: `${input.productName}의 유통기한이 ${input.daysUntilExpiry}일 남았어요.`,
    inventoryItemId: input.inventoryItemId,
  });
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
