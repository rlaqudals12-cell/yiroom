import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteFriendSheet } from '@/components/challenges/InviteFriendSheet';
import type { Friend } from '@/types/friends';
import type { ChallengeTeam, TeamMember } from '@/types/challenges';

const mockTeam: ChallengeTeam = {
  id: 'team-1',
  challengeId: 'challenge-1',
  name: '철수의 팀',
  leaderId: 'user-1',
  maxMembers: 4,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMembers: TeamMember[] = [
  {
    id: 'member-1',
    teamId: 'team-1',
    clerkUserId: 'user-1',
    role: 'leader',
    status: 'accepted',
    joinedAt: new Date(),
    progress: { percentage: 50 },
    userName: '김철수',
  },
];

const mockFriends: Friend[] = [
  {
    userId: 'friend-1',
    friendshipId: 'f1',
    displayName: '이영희',
    avatarUrl: null,
    totalXp: 1000,
    level: 5,
    tier: 'silver',
    friendSince: new Date(),
  },
  {
    userId: 'friend-2',
    friendshipId: 'f2',
    displayName: '박지민',
    avatarUrl: null,
    totalXp: 2000,
    level: 8,
    tier: 'gold',
    friendSince: new Date(),
  },
  {
    userId: 'user-1', // 이미 팀원
    friendshipId: 'f3',
    displayName: '김철수',
    avatarUrl: null,
    totalXp: 1500,
    level: 6,
    tier: 'silver',
    friendSince: new Date(),
  },
];

describe('InviteFriendSheet', () => {
  describe('시트 열기/닫기', () => {
    it('기본 트리거 버튼 표시', () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );
      expect(screen.getByText('친구 초대')).toBeInTheDocument();
    });

    it('커스텀 트리거 사용', () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
          trigger={<button>커스텀 트리거</button>}
        />
      );
      expect(screen.getByText('커스텀 트리거')).toBeInTheDocument();
    });

    it('트리거 클릭 시 시트 열림', () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));
      expect(screen.getByTestId('invite-friend-sheet')).toBeInTheDocument();
    });
  });

  describe('친구 목록', () => {
    it('친구 목록 표시', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText('이영희')).toBeInTheDocument();
        expect(screen.getByText('박지민')).toBeInTheDocument();
      });
    });

    it('친구 레벨 표시', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText('Lv.5 · silver')).toBeInTheDocument();
        expect(screen.getByText('Lv.8 · gold')).toBeInTheDocument();
      });
    });

    it('이미 팀원인 친구는 팀원 표시', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText('팀원')).toBeInTheDocument();
      });
    });

    it('남은 자리 수 표시', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText(/남은 자리: 3명/)).toBeInTheDocument();
      });
    });
  });

  describe('검색', () => {
    it('검색 입력 표시', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByTestId('friend-search-input')).toBeInTheDocument();
      });
    });

    it('검색어 입력 시 필터링', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByTestId('friend-search-input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('friend-search-input'), {
        target: { value: '영희' },
      });

      await waitFor(() => {
        expect(screen.getByText('이영희')).toBeInTheDocument();
        expect(screen.queryByText('박지민')).not.toBeInTheDocument();
      });
    });

    it('검색 결과 없음', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByTestId('friend-search-input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('friend-search-input'), {
        target: { value: '없는이름' },
      });

      await waitFor(() => {
        expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
      });
    });
  });

  describe('초대 기능', () => {
    it('초대 버튼 클릭 시 핸들러 호출', async () => {
      const onInvite = vi.fn().mockResolvedValue(true);
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
          onInvite={onInvite}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText('이영희')).toBeInTheDocument();
      });

      const inviteButtons = screen.getAllByTestId('invite-button');
      fireEvent.click(inviteButtons[0]);

      await waitFor(() => {
        expect(onInvite).toHaveBeenCalledWith('friend-1');
      });
    });

    it('초대 성공 시 콜백 호출', async () => {
      const onInvite = vi.fn().mockResolvedValue(true);
      const onInviteSent = vi.fn();

      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
          onInvite={onInvite}
          onInviteSent={onInviteSent}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText('이영희')).toBeInTheDocument();
      });

      const inviteButtons = screen.getAllByTestId('invite-button');
      fireEvent.click(inviteButtons[0]);

      await waitFor(() => {
        expect(onInviteSent).toHaveBeenCalled();
      });
    });

    it('초대 성공 시 초대됨 상태로 변경', async () => {
      const onInvite = vi.fn().mockResolvedValue(true);

      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={mockFriends}
          onInvite={onInvite}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText('이영희')).toBeInTheDocument();
      });

      const inviteButtons = screen.getAllByTestId('invite-button');
      fireEvent.click(inviteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('초대됨')).toBeInTheDocument();
      });
    });
  });

  describe('빈 친구 목록', () => {
    it('친구 없을 때 메시지 표시', async () => {
      render(
        <InviteFriendSheet
          team={mockTeam}
          members={mockMembers}
          friends={[]}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(
          screen.getByText('초대할 수 있는 친구가 없습니다')
        ).toBeInTheDocument();
      });
    });
  });

  describe('자리 꽉 찼을 때', () => {
    it('초대 버튼 비활성화', async () => {
      const fullMembers: TeamMember[] = Array.from({ length: 4 }, (_, i) => ({
        id: `member-${i}`,
        teamId: 'team-1',
        clerkUserId: `user-${i}`,
        role: i === 0 ? 'leader' : 'member',
        status: 'accepted',
        joinedAt: new Date(),
        progress: { percentage: 50 },
        userName: `사용자${i}`,
      }));

      render(
        <InviteFriendSheet
          team={mockTeam}
          members={fullMembers}
          friends={mockFriends}
        />
      );

      fireEvent.click(screen.getByText('친구 초대'));

      await waitFor(() => {
        expect(screen.getByText(/남은 자리: 0명/)).toBeInTheDocument();
      });

      // 초대 버튼이 비활성화됨
      const inviteButtons = screen.queryAllByTestId('invite-button');
      inviteButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });
});
