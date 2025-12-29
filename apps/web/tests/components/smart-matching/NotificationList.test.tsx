/**
 * NotificationList 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationList } from '@/components/smart-matching/NotificationList';
import type { SmartNotification } from '@/types/smart-matching';

describe('NotificationList', () => {
  const mockNotifications: SmartNotification[] = [
    {
      id: 'notif-1',
      clerkUserId: 'user-1',
      notificationType: 'price_drop',
      title: '가격 하락 알림',
      message: '제품1이 할인 중이에요',
      read: false,
      createdAt: new Date(),
    },
    {
      id: 'notif-2',
      clerkUserId: 'user-1',
      notificationType: 'back_in_stock',
      title: '재입고 알림',
      message: '제품2가 재입고되었어요',
      read: true,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: 'notif-3',
      clerkUserId: 'user-1',
      notificationType: 'product_running_low',
      title: '소진 예정 알림',
      message: '제품3이 곧 떨어질 것 같아요',
      read: false,
      createdAt: new Date(Date.now() - 7200000),
    },
  ];

  it('알림 목록을 표시한다', () => {
    render(<NotificationList notifications={mockNotifications} />);

    expect(screen.getByText('가격 하락 알림')).toBeInTheDocument();
    expect(screen.getByText('재입고 알림')).toBeInTheDocument();
    expect(screen.getByText('소진 예정 알림')).toBeInTheDocument();
  });

  it('읽지 않은 알림 개수를 표시한다', () => {
    render(<NotificationList notifications={mockNotifications} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('모두 읽음 버튼을 클릭하면 콜백을 호출한다', () => {
    const onMarkAllAsRead = vi.fn();
    render(
      <NotificationList
        notifications={mockNotifications}
        onMarkAllAsRead={onMarkAllAsRead}
      />
    );

    fireEvent.click(screen.getByText('모두 읽음'));

    expect(onMarkAllAsRead).toHaveBeenCalled();
  });

  it('필터를 변경할 수 있다', () => {
    render(<NotificationList notifications={mockNotifications} />);

    // 가격 필터 클릭
    fireEvent.click(screen.getByText('가격'));

    // 가격 관련 알림만 표시
    expect(screen.getByText('가격 하락 알림')).toBeInTheDocument();
    expect(screen.queryByText('재입고 알림')).not.toBeInTheDocument();
    expect(screen.queryByText('소진 예정 알림')).not.toBeInTheDocument();
  });

  it('알림이 없으면 안내 메시지를 표시한다', () => {
    render(<NotificationList notifications={[]} />);

    expect(screen.getByText('알림이 없어요')).toBeInTheDocument();
  });

  it('필터링 결과가 없으면 해당 알림이 없다고 표시한다', () => {
    render(<NotificationList notifications={mockNotifications} />);

    // 유통기한 필터 클릭 (해당 알림 없음)
    fireEvent.click(screen.getByText('유통기한'));

    expect(screen.getByText('해당 알림이 없어요')).toBeInTheDocument();
  });

  it('로딩 중일 때 로딩 메시지를 표시한다', () => {
    render(<NotificationList notifications={[]} loading />);

    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('data-testid가 설정되어 있다', () => {
    render(<NotificationList notifications={mockNotifications} />);

    expect(screen.getByTestId('notification-list')).toBeInTheDocument();
  });

  it('읽지 않은 알림이 없으면 모두 읽음 버튼을 숨긴다', () => {
    const allReadNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
    render(
      <NotificationList
        notifications={allReadNotifications}
        onMarkAllAsRead={vi.fn()}
      />
    );

    expect(screen.queryByText('모두 읽음')).not.toBeInTheDocument();
  });
});
