'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  Bell,
  UserPlus,
  Trophy,
  Clock,
  Sparkles,
  Megaphone,
  Check,
  Trash2,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';

/**
 * 알림 페이지 - UX 리스트럭처링
 * - 읽지 않은 알림 배지
 * - 알림 유형: 친구 요청, 챌린지, 리마인더, 추천, 업데이트
 * - 알림 그룹화 (오늘/이번주/이전)
 * - 알림 설정 바로가기
 */

type NotificationType = 'friend_request' | 'challenge' | 'reminder' | 'recommendation' | 'update';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

// 알림 타입별 아이콘 매핑
const notificationIcons: Record<NotificationType, typeof Bell> = {
  friend_request: UserPlus,
  challenge: Trophy,
  reminder: Clock,
  recommendation: Sparkles,
  update: Megaphone,
};

// 알림 타입별 색상 매핑
const notificationColors: Record<NotificationType, string> = {
  friend_request: 'bg-blue-100 text-blue-600',
  challenge: 'bg-yellow-100 text-yellow-600',
  reminder: 'bg-purple-100 text-purple-600',
  recommendation: 'bg-pink-100 text-pink-600',
  update: 'bg-green-100 text-green-600',
};

// 임시 알림 데이터
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'friend_request',
    title: '친구 요청',
    message: '김이룸님이 친구 요청을 보냈어요',
    time: '방금 전',
    read: false,
    actionUrl: '/friends/requests',
  },
  {
    id: '2',
    type: 'challenge',
    title: '챌린지 알림',
    message: '7일 운동 챌린지가 내일 시작됩니다!',
    time: '1시간 전',
    read: false,
    actionUrl: '/challenges/weekly-workout',
  },
  {
    id: '3',
    type: 'reminder',
    title: '물 마시기 리마인더',
    message: '오늘 목표량까지 500ml 남았어요',
    time: '2시간 전',
    read: false,
    actionUrl: '/nutrition',
  },
  {
    id: '4',
    type: 'recommendation',
    title: '맞춤 추천',
    message: '피부 타입에 맞는 새로운 제품을 발견했어요!',
    time: '어제',
    read: true,
    actionUrl: '/beauty',
  },
  {
    id: '5',
    type: 'update',
    title: '앱 업데이트',
    message: '연말 리뷰 기능이 추가되었어요',
    time: '3일 전',
    read: true,
    actionUrl: '/year-review',
  },
  {
    id: '6',
    type: 'challenge',
    title: '챌린지 완료',
    message: '축하해요! 3일 연속 운동 챌린지를 완료했어요',
    time: '1주 전',
    read: true,
  },
];

// 알림 그룹화 함수
function groupNotifications(notifications: Notification[]) {
  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  notifications.forEach((notification) => {
    if (
      notification.time.includes('전') &&
      !notification.time.includes('주') &&
      !notification.time.includes('일')
    ) {
      today.push(notification);
    } else if (notification.time.includes('어제') || notification.time.includes('일 전')) {
      thisWeek.push(notification);
    } else {
      earlier.push(notification);
    }
  });

  return { today, thisWeek, earlier };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const grouped = groupNotifications(notifications);

  // 알림 읽음 처리
  const handleReadNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  // 알림 클릭 처리
  const handleNotificationClick = (notification: Notification) => {
    handleReadNotification(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // 모두 읽음 처리
  const handleReadAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // 알림 삭제
  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 알림 그룹 렌더링
  const renderNotificationGroup = (
    title: string,
    items: Notification[],
    delay: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  ) => {
    if (items.length === 0) return null;

    return (
      <FadeInUp delay={delay}>
        <section className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">{title}</h2>
          <div className="space-y-2">
            {items.map((notification) => {
              const Icon = notificationIcons[notification.type];
              const colorClass = notificationColors[notification.type];

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 rounded-xl text-left transition-colors',
                    notification.read
                      ? 'bg-card hover:bg-muted/50'
                      : 'bg-primary/5 hover:bg-primary/10'
                  )}
                >
                  {/* 아이콘 */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      colorClass
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'text-sm',
                          notification.read
                            ? 'font-medium text-foreground'
                            : 'font-semibold text-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                    aria-label="알림 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              );
            })}
          </div>
        </section>
      </FadeInUp>
    );
  };

  return (
    <div className="min-h-screen bg-background" data-testid="notifications-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">알림</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <Check className="w-4 h-4" />
                모두 읽음
              </button>
            )}
            <button
              onClick={() => router.push('/profile/settings?tab=notifications')}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              aria-label="알림 설정"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="px-4 py-4">
        {notifications.length === 0 ? (
          // 알림 없음 상태
          <FadeInUp>
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground">알림이 없어요</p>
              <p className="text-sm text-muted-foreground mt-1">
                새로운 알림이 오면 여기에 표시됩니다
              </p>
            </div>
          </FadeInUp>
        ) : (
          // 알림 목록
          <>
            {renderNotificationGroup('오늘', grouped.today, 0)}
            {renderNotificationGroup('이번 주', grouped.thisWeek, 1)}
            {renderNotificationGroup('이전', grouped.earlier, 2)}
          </>
        )}
      </div>
    </div>
  );
}
