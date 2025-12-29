/**
 * NotificationItem 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from '@/components/smart-matching/NotificationItem';
import type { SmartNotification } from '@/types/smart-matching';

describe('NotificationItem', () => {
  const mockNotification: SmartNotification = {
    id: 'notif-1',
    clerkUserId: 'user-1',
    notificationType: 'price_drop',
    title: '가격 하락 알림',
    message: '테스트 제품이 20% 할인 중이에요!',
    read: false,
    createdAt: new Date(),
  };

  it('알림 제목과 메시지를 표시한다', () => {
    render(<NotificationItem notification={mockNotification} />);

    expect(screen.getByText('가격 하락 알림')).toBeInTheDocument();
    expect(screen.getByText(/테스트 제품이 20% 할인/)).toBeInTheDocument();
  });

  it('읽지 않은 알림에 배경색을 적용한다', () => {
    const { container } = render(<NotificationItem notification={mockNotification} />);

    const item = container.querySelector('[data-testid="notification-item"]');
    expect(item).toHaveClass('bg-green-50');
  });

  it('읽은 알림은 기본 배경색을 사용한다', () => {
    const readNotification = { ...mockNotification, read: true };
    const { container } = render(<NotificationItem notification={readNotification} />);

    const item = container.querySelector('[data-testid="notification-item"]');
    expect(item).toHaveClass('bg-background');
  });

  it('클릭 시 onRead와 onClick 콜백을 호출한다', () => {
    const onRead = vi.fn();
    const onClick = vi.fn();
    render(
      <NotificationItem
        notification={mockNotification}
        onRead={onRead}
        onClick={onClick}
      />
    );

    fireEvent.click(screen.getByTestId('notification-item'));

    expect(onRead).toHaveBeenCalledWith('notif-1');
    expect(onClick).toHaveBeenCalledWith(mockNotification);
  });

  it('이미 읽은 알림은 onRead를 호출하지 않는다', () => {
    const onRead = vi.fn();
    const readNotification = { ...mockNotification, read: true };
    render(<NotificationItem notification={readNotification} onRead={onRead} />);

    fireEvent.click(screen.getByTestId('notification-item'));

    expect(onRead).not.toHaveBeenCalled();
  });

  it('알림 타입에 맞는 아이콘을 표시한다', () => {
    render(<NotificationItem notification={mockNotification} />);

    // 가격 하락 아이콘
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('시간 표시를 포맷한다', () => {
    const recentNotification = {
      ...mockNotification,
      createdAt: new Date(Date.now() - 5 * 60000), // 5분 전
    };
    render(<NotificationItem notification={recentNotification} />);

    expect(screen.getByText('5분 전')).toBeInTheDocument();
  });

  it('data-testid가 설정되어 있다', () => {
    render(<NotificationItem notification={mockNotification} />);

    expect(screen.getByTestId('notification-item')).toBeInTheDocument();
  });
});
