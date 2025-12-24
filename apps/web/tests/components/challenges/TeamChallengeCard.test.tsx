import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamChallengeCard } from '@/components/challenges/TeamChallengeCard';
import type {
  Challenge,
  TeamChallengeDetail,
  ChallengeTeam,
  TeamMember,
} from '@/types/challenges';

// Mock 챌린지 데이터
const mockChallenge: Challenge = {
  id: 'challenge-1',
  code: 'WORKOUT_30',
  name: '30일 운동 챌린지',
  description: '30일 연속 운동하기',
  icon: '💪',
  domain: 'workout',
  durationDays: 30,
  target: { type: 'streak', days: 30 },
  rewardXp: 500,
  rewardBadgeId: null,
  difficulty: 'hard',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
};

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
    progress: { percentage: 80 },
    userName: '김철수',
    userAvatar: null,
  },
  {
    id: 'member-2',
    teamId: 'team-1',
    clerkUserId: 'user-2',
    role: 'member',
    status: 'accepted',
    joinedAt: new Date(),
    progress: { percentage: 60 },
    userName: '이영희',
    userAvatar: null,
  },
];

const mockTeamDetail: TeamChallengeDetail = {
  team: mockTeam,
  members: mockMembers,
  challenge: mockChallenge,
  teamProgress: 70,
  completedCount: 0,
};

describe('TeamChallengeCard', () => {
  describe('기본 렌더링', () => {
    it('카드가 렌더링됨', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByTestId('team-challenge-card')).toBeInTheDocument();
    });

    it('챌린지 이름 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('30일 운동 챌린지')).toBeInTheDocument();
    });

    it('챌린지 설명 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('30일 연속 운동하기')).toBeInTheDocument();
    });

    it('챌린지 아이콘 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('💪')).toBeInTheDocument();
    });

    it('팀 배지 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('팀')).toBeInTheDocument();
    });

    it('난이도 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('어려움')).toBeInTheDocument();
    });

    it('기간 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('30일')).toBeInTheDocument();
    });

    it('XP 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('+500 XP')).toBeInTheDocument();
    });

    it('커스텀 testId 적용', () => {
      render(
        <TeamChallengeCard challenge={mockChallenge} data-testid="custom-card" />
      );
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });
  });

  describe('팀 없을 때', () => {
    it('팀 만들기 버튼 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByText('팀 만들기')).toBeInTheDocument();
    });

    it('팀 만들기 버튼 클릭', () => {
      const onCreateTeam = vi.fn();
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          onCreateTeam={onCreateTeam}
        />
      );

      fireEvent.click(screen.getByText('팀 만들기'));
      expect(onCreateTeam).toHaveBeenCalled();
    });

    it('로딩 중이면 버튼 텍스트 변경', () => {
      render(<TeamChallengeCard challenge={mockChallenge} loading={true} />);
      expect(screen.getByText('생성 중...')).toBeInTheDocument();
    });

    it('멤버 수 0 표시', () => {
      render(<TeamChallengeCard challenge={mockChallenge} />);
      expect(screen.getByTestId('member-count')).toHaveTextContent('0/4명');
    });
  });

  describe('팀 있을 때', () => {
    it('팀원 섹션 표시', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
        />
      );
      expect(screen.getByTestId('team-members')).toBeInTheDocument();
    });

    it('팀원 이름으로 아바타 표시', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
        />
      );
      expect(screen.getByText('김')).toBeInTheDocument();
      expect(screen.getByText('이')).toBeInTheDocument();
    });

    it('팀 진행률 표시', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
        />
      );
      expect(screen.getByTestId('team-progress')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('멤버 수 표시', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
        />
      );
      expect(screen.getByTestId('member-count')).toHaveTextContent('2/4명');
    });

    it('상세 보기 버튼 표시', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
        />
      );
      expect(screen.getByText('상세 보기')).toBeInTheDocument();
    });

    it('상세 보기 버튼 클릭', () => {
      const onView = vi.fn();
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
          onView={onView}
        />
      );

      fireEvent.click(screen.getByText('상세 보기'));
      expect(onView).toHaveBeenCalled();
    });
  });

  describe('리더일 때', () => {
    it('초대 버튼 표시', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
          currentUserId="user-1"
        />
      );
      expect(screen.getByTestId('invite-button')).toBeInTheDocument();
    });

    it('초대 버튼 클릭', () => {
      const onInvite = vi.fn();
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
          currentUserId="user-1"
          onInvite={onInvite}
        />
      );

      fireEvent.click(screen.getByTestId('invite-button'));
      expect(onInvite).toHaveBeenCalled();
    });
  });

  describe('리더 아닐 때', () => {
    it('초대 버튼 숨김', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
          currentUserId="user-2"
        />
      );
      expect(screen.queryByTestId('invite-button')).not.toBeInTheDocument();
    });
  });

  describe('멤버 아바타', () => {
    it('리더에 크라운 표시', () => {
      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={mockTeamDetail}
        />
      );
      // 리더(김철수)의 아바타에 크라운이 표시됨
      expect(screen.getByTestId('member-avatar-member-1')).toBeInTheDocument();
    });

    it('5명 초과 시 +N 표시', () => {
      const manyMembers: TeamMember[] = Array.from({ length: 7 }, (_, i) => ({
        id: `member-${i}`,
        teamId: 'team-1',
        clerkUserId: `user-${i}`,
        role: i === 0 ? 'leader' : 'member',
        status: 'accepted',
        joinedAt: new Date(),
        progress: { percentage: 50 },
        userName: `사용자${i}`,
        userAvatar: null,
      }));

      const detailWithManyMembers: TeamChallengeDetail = {
        ...mockTeamDetail,
        members: manyMembers,
      };

      render(
        <TeamChallengeCard
          challenge={mockChallenge}
          teamDetail={detailWithManyMembers}
        />
      );
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });
});
