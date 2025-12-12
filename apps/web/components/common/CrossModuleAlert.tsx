/**
 * P3-5.3: 통합 알림 시스템 - CrossModuleAlert 컴포넌트
 *
 * 크로스 모듈 알림을 통합 관리하는 컴포넌트
 * - 여러 모듈 간 연동 알림 표시
 * - 우선순위에 따른 정렬
 * - 일관된 UI/UX
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  ChevronRight,
  Flame,
  Utensils,
  Droplets,
  Droplet,
  Scale,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type CrossModuleAlertData,
  type AlertLevel,
  ALERT_LEVEL_STYLES,
  MODULE_LABELS,
} from '@/lib/alerts';

export interface CrossModuleAlertProps {
  /** 알림 데이터 */
  alert: CrossModuleAlertData;
  /** 닫기 핸들러 */
  onDismiss?: (alertId: string) => void;
  /** 클릭 핸들러 (CTA 대신 커스텀 동작) */
  onClick?: (alert: CrossModuleAlertData) => void;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 알림 타입에 따른 아이콘 반환
 */
function getAlertIcon(iconType: string, level: AlertLevel) {
  const styles = ALERT_LEVEL_STYLES[level];
  const iconProps = { className: cn('w-5 h-5 flex-shrink-0', styles.iconColor) };

  switch (iconType) {
    case 'flame':
      return <Flame {...iconProps} />;
    case 'utensils':
      return <Utensils {...iconProps} />;
    case 'droplets':
      return <Droplets {...iconProps} />;
    case 'droplet':
      return <Droplet {...iconProps} />;
    case 'scale':
      return <Scale {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
}

/**
 * 알림 레벨에 따른 배지 아이콘
 */
function getLevelBadgeIcon(level: AlertLevel) {
  const baseClass = 'w-4 h-4';
  switch (level) {
    case 'danger':
      return <AlertTriangle className={cn(baseClass, 'text-red-500')} />;
    case 'warning':
      return <Flame className={cn(baseClass, 'text-amber-500')} />;
    case 'success':
      return <CheckCircle className={cn(baseClass, 'text-green-500')} />;
    default:
      return <Info className={cn(baseClass, 'text-blue-500')} />;
  }
}

/**
 * 단일 크로스 모듈 알림 컴포넌트
 */
export default function CrossModuleAlert({
  alert,
  onDismiss,
  onClick,
  compact = false,
}: CrossModuleAlertProps) {
  const styles = ALERT_LEVEL_STYLES[alert.level];

  const handleDismiss = () => {
    onDismiss?.(alert.id);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(alert);
    }
  };

  // 컴팩트 모드
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          styles.bg,
          styles.border
        )}
        data-testid="cross-module-alert-compact"
      >
        {getAlertIcon(alert.metadata?.icon as string || 'info', alert.level)}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', styles.text)}>
            {alert.title}
          </p>
        </div>
        <Link
          href={alert.ctaHref}
          className={cn(
            'text-xs font-medium px-2 py-1 rounded',
            styles.button,
            'text-white'
          )}
        >
          {alert.ctaText}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 border shadow-sm animate-in slide-in-from-top-2 duration-300',
        styles.bg,
        styles.border
      )}
      role="alert"
      aria-live="polite"
      data-testid="cross-module-alert"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getLevelBadgeIcon(alert.level)}
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn('font-semibold text-sm', styles.text)}>
                {alert.title}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {MODULE_LABELS[alert.sourceModule]} → {MODULE_LABELS[alert.targetModule]}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {alert.message}
            </p>
          </div>
        </div>
        {/* 닫기 버튼 */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="알림 닫기"
            data-testid="cross-module-alert-dismiss"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* CTA 버튼 */}
      {onClick ? (
        <button
          onClick={handleClick}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 text-white font-medium rounded-lg transition-colors',
            styles.button
          )}
          data-testid="cross-module-alert-cta"
        >
          <span>{alert.ctaText}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <Link
          href={alert.ctaHref}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 text-white font-medium rounded-lg transition-colors',
            styles.button
          )}
          data-testid="cross-module-alert-cta"
        >
          <span>{alert.ctaText}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/**
 * 알림 목록 컴포넌트
 */
export interface CrossModuleAlertListProps {
  /** 알림 목록 */
  alerts: CrossModuleAlertData[];
  /** 알림 닫기 핸들러 */
  onDismiss?: (alertId: string) => void;
  /** 최대 표시 개수 */
  maxCount?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 클래스명 */
  className?: string;
}

/**
 * 여러 알림을 표시하는 목록 컴포넌트
 */
export function CrossModuleAlertList({
  alerts,
  onDismiss,
  maxCount = 3,
  compact = false,
  className,
}: CrossModuleAlertListProps) {
  // 닫힌 알림 ID 관리
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // 표시할 알림 필터링
  const visibleAlerts = useMemo(() => {
    return alerts
      .filter((alert) => !dismissedIds.has(alert.id))
      .slice(0, maxCount);
  }, [alerts, dismissedIds, maxCount]);

  const handleDismiss = (alertId: string) => {
    setDismissedIds((prev) => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="cross-module-alert-list"
    >
      {visibleAlerts.map((alert) => (
        <CrossModuleAlert
          key={alert.id}
          alert={alert}
          onDismiss={handleDismiss}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * 스켈레톤 로딩 컴포넌트
 */
export function CrossModuleAlertSkeleton() {
  return (
    <div
      className="rounded-xl p-4 border border-gray-200 bg-gray-50 animate-pulse"
      data-testid="cross-module-alert-skeleton"
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-gray-300" />
        <div className="flex-1">
          <div className="w-32 h-4 bg-gray-300 rounded mb-1" />
          <div className="w-48 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-full h-12 bg-gray-300 rounded-lg" />
    </div>
  );
}
