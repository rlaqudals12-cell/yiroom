/**
 * 인벤토리 유통기한 알림
 * @description 만료 임박/만료 아이템 필터링 및 알림 생성
 */

import type { InventoryItem } from '@/types/inventory';

// ============================================
// 상수
// ============================================

/** 만료 임박 기준 (일) */
const EXPIRY_WARNING_DAYS = 30;

/** 곧 만료 기준 (일) */
const EXPIRY_URGENT_DAYS = 7;

// ============================================
// 타입
// ============================================

/** 만료 상태 */
export type ExpiryStatus = 'expired' | 'urgent' | 'warning' | 'safe' | 'unknown';

/** 만료 알림 아이템 */
export interface ExpiryAlert {
  item: InventoryItem;
  status: ExpiryStatus;
  /** 만료까지 남은 일수 (음수면 이미 만료) */
  daysRemaining: number | null;
  /** 사용자 메시지 */
  message: string;
}

/** 만료 요약 */
export interface ExpirySummary {
  expired: number;
  urgent: number;
  warning: number;
  safe: number;
  unknown: number;
  total: number;
  alerts: ExpiryAlert[];
}

// ============================================
// 만료 상태 계산
// ============================================

/**
 * 만료 상태 판별
 */
export function getExpiryStatus(expiryDate: string | null, now?: Date): ExpiryStatus {
  if (!expiryDate) return 'unknown';

  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return 'unknown';

  const today = now ?? new Date();
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= EXPIRY_URGENT_DAYS) return 'urgent';
  if (diffDays <= EXPIRY_WARNING_DAYS) return 'warning';
  return 'safe';
}

/**
 * 만료까지 남은 일수 계산
 */
export function getDaysRemaining(expiryDate: string | null, now?: Date): number | null {
  if (!expiryDate) return null;

  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;

  const today = now ?? new Date();
  const diffMs = expiry.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 만료 알림 메시지 생성
 */
export function getExpiryMessage(status: ExpiryStatus, daysRemaining: number | null): string {
  switch (status) {
    case 'expired': {
      const overDays = daysRemaining !== null ? Math.abs(daysRemaining) : 0;
      return overDays > 0
        ? `${overDays}일 전에 만료되었어요. 교체를 고려해보세요.`
        : '유통기한이 지났어요. 교체를 고려해보세요.';
    }
    case 'urgent':
      return `${daysRemaining}일 후 만료 예정이에요! 빠른 사용을 추천해요.`;
    case 'warning':
      return `${daysRemaining}일 후 만료 예정이에요. 사용 계획을 세워보세요.`;
    case 'safe':
      return '유통기한이 충분해요.';
    case 'unknown':
      return '유통기한 정보가 없어요.';
  }
}

// ============================================
// 알림 생성
// ============================================

/**
 * 인벤토리 아이템 목록에서 만료 알림 생성
 */
export function generateExpiryAlerts(items: InventoryItem[], now?: Date): ExpiryAlert[] {
  return items.map((item) => {
    const expiryDate = item.expiryDate ?? null;
    const status = getExpiryStatus(expiryDate, now);
    const daysRemaining = getDaysRemaining(expiryDate, now);
    const message = getExpiryMessage(status, daysRemaining);

    return { item, status, daysRemaining, message };
  });
}

/**
 * 만료 임박/만료 아이템만 필터링
 */
export function getExpiringItems(items: InventoryItem[], now?: Date): ExpiryAlert[] {
  return generateExpiryAlerts(items, now).filter(
    (alert) => alert.status === 'expired' || alert.status === 'urgent' || alert.status === 'warning'
  );
}

/**
 * 만료 요약 통계
 */
export function getExpirySummary(items: InventoryItem[], now?: Date): ExpirySummary {
  const alerts = generateExpiryAlerts(items, now);

  const counts: Record<ExpiryStatus, number> = {
    expired: 0,
    urgent: 0,
    warning: 0,
    safe: 0,
    unknown: 0,
  };

  for (const alert of alerts) {
    counts[alert.status]++;
  }

  // 위험도 순 정렬: expired > urgent > warning
  const sortedAlerts = alerts
    .filter((a) => a.status !== 'safe' && a.status !== 'unknown')
    .sort((a, b) => {
      const priority: Record<ExpiryStatus, number> = {
        expired: 0,
        urgent: 1,
        warning: 2,
        safe: 3,
        unknown: 4,
      };
      return priority[a.status] - priority[b.status];
    });

  return {
    ...counts,
    total: items.length,
    alerts: sortedAlerts,
  };
}
