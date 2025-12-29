'use client';

/**
 * 알림 아이템 컴포넌트
 * @description 개별 알림 표시 (읽음 처리, 삭제 지원)
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SmartNotification, NotificationType } from '@/types/smart-matching';

interface NotificationItemProps {
  notification: SmartNotification;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: SmartNotification) => void;
  className?: string;
}

// 알림 타입별 스타일
const typeStyles: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
  product_running_low: { icon: '⚠️', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  expiry_approaching: { icon: '⏰', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  price_drop: { icon: '💰', color: 'text-green-600', bgColor: 'bg-green-50' },
  back_in_stock: { icon: '📦', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  new_recommendation: { icon: '✨', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  size_available: { icon: '👕', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  similar_product: { icon: '🔍', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  reorder_reminder: { icon: '🔔', color: 'text-pink-600', bgColor: 'bg-pink-50' },
};

export function NotificationItem({
  notification,
  onRead,
  onDelete,
  onClick,
  className,
}: NotificationItemProps) {
  const style = typeStyles[notification.notificationType] ?? typeStyles.new_recommendation;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const handleClick = () => {
    if (!notification.read && onRead) {
      onRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        notification.read ? 'bg-background' : style.bgColor,
        !notification.read && 'border-l-4',
        !notification.read && style.color.replace('text-', 'border-l-'),
        className
      )}
      onClick={handleClick}
      data-testid="notification-item"
    >
      {/* 아이콘 */}
      <div className={cn('text-xl flex-shrink-0', notification.read && 'opacity-50')}>
        {style.icon}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={cn(
              'text-sm font-medium truncate',
              notification.read && 'text-muted-foreground'
            )}
          >
            {notification.title}
          </h4>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(notification.createdAt)}
          </span>
        </div>
        <p
          className={cn(
            'text-sm mt-0.5',
            notification.read ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          {notification.message}
        </p>
      </div>

      {/* 삭제 버튼 */}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
        >
          <span className="text-xs">&#x2715;</span>
        </Button>
      )}
    </div>
  );
}
