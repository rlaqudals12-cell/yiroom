import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import type { FriendRequest } from '@/types/friends';

const mockRequest: FriendRequest = {
  id: 'request-1',
  requesterId: 'user-123',
  requesterName: '김철수',
  requesterAvatar: 'https://example.com/avatar.jpg',
  requesterLevel: 15,
  createdAt: new Date('2024-12-20T10:00:00'),
};

describe('FriendRequestCard', () => {
  it('카드 렌더링', () => {
    render(<FriendRequestCard request={mockRequest} />);
    expect(screen.getByTestId('friend-request-card')).toBeInTheDocument();
  });

  it('요청자 이름 표시', () => {
    render(<FriendRequestCard request={mockRequest} />);
    expect(screen.getByText('김철수')).toBeInTheDocument();
  });

  it('요청자 레벨 표시', () => {
    render(<FriendRequestCard request={mockRequest} />);
    expect(screen.getByText('Lv.15')).toBeInTheDocument();
  });

  it('수락 버튼 클릭 시 onAccept 호출', () => {
    const onAccept = vi.fn();
    render(<FriendRequestCard request={mockRequest} onAccept={onAccept} />);

    const acceptButton = screen.getByRole('button', { name: /친구 요청 수락/ });
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalledWith('request-1');
  });

  it('거절 버튼 클릭 시 onReject 호출', () => {
    const onReject = vi.fn();
    render(<FriendRequestCard request={mockRequest} onReject={onReject} />);

    const rejectButton = screen.getByRole('button', { name: /친구 요청 거절/ });
    fireEvent.click(rejectButton);

    expect(onReject).toHaveBeenCalledWith('request-1');
  });

  it('isProcessing=true일 때 버튼 비활성화', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(
      <FriendRequestCard
        request={mockRequest}
        onAccept={onAccept}
        onReject={onReject}
        isProcessing
      />
    );

    const acceptButton = screen.getByRole('button', { name: /친구 요청 수락/ });
    const rejectButton = screen.getByRole('button', { name: /친구 요청 거절/ });

    expect(acceptButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
  });

  it('onAccept 없으면 수락 버튼 숨김', () => {
    render(<FriendRequestCard request={mockRequest} onReject={() => {}} />);
    expect(screen.queryByRole('button', { name: /친구 요청 수락/ })).not.toBeInTheDocument();
  });

  it('onReject 없으면 거절 버튼 숨김', () => {
    render(<FriendRequestCard request={mockRequest} onAccept={() => {}} />);
    expect(screen.queryByRole('button', { name: /친구 요청 거절/ })).not.toBeInTheDocument();
  });

  it('아바타 컴포넌트 표시', () => {
    const { container } = render(<FriendRequestCard request={mockRequest} />);
    // Avatar 컴포넌트가 렌더링되는지 확인
    const avatar = container.querySelector('[data-slot="avatar"]');
    expect(avatar).toBeInTheDocument();
  });

  it('아바타 없으면 이니셜 표시', () => {
    const requestWithoutAvatar: FriendRequest = {
      ...mockRequest,
      requesterAvatar: null,
    };
    render(<FriendRequestCard request={requestWithoutAvatar} />);
    expect(screen.getByText('김')).toBeInTheDocument();
  });

  it('수락 버튼 텍스트 확인', () => {
    render(<FriendRequestCard request={mockRequest} onAccept={() => {}} />);
    expect(screen.getByText('수락')).toBeInTheDocument();
  });

  it('거절 버튼 텍스트 확인', () => {
    render(<FriendRequestCard request={mockRequest} onReject={() => {}} />);
    expect(screen.getByText('거절')).toBeInTheDocument();
  });
});
