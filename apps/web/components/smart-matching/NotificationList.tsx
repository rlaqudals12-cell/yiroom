'use client';

/**
 * 알림 목록 컴포넌트
 * @description 알림 리스트 표시, 전체 읽음, 필터링
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationItem } from './NotificationItem';
import type { SmartNotification, NotificationType } from '@/types/smart-matching';

interface NotificationListProps {
  notifications: SmartNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: SmartNotification) => void;
  loading?: boolean;
  className?: string;
}

const typeFilters: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'price_drop', label: '가격' },
  { value: 'back_in_stock', label: '재입고' },
  { value: 'product_running_low', label: '소진' },
  { value: 'expiry_approaching', label: '유통기한' },
];

export function NotificationList({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClick,
  loading = false,
  className,
}: NotificationListProps) {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : notifications.filter((n) => n.notificationType === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={cn('flex flex-col', className)} data-testid="notification-list">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">알림</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllAsRead && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            모두 읽음
          </Button>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {typeFilters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            className="flex-shrink-0"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* 알림 목록 */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <span className="text-muted-foreground">불러오는 중...</span>
        </div>
      )}
      {!loading && filteredNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-2xl mb-2">🔔</span>
          <p className="text-muted-foreground">
            {filter === 'all' ? '알림이 없어요' : '해당 알림이 없어요'}
          </p>
        </div>
      )}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={onMarkAsRead}
              onDelete={onDelete}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
