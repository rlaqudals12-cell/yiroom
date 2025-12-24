import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toChallengeTeam,
  toTeamMember,
  toChallengeInvite,
  calculateTeamProgress,
  countCompletedMembers,
  isInviteExpired,
  canInvite,
  canJoinTeam,
  isTeamLeader,
  isTeamMember,
  generateTeamName,
  createInviteExpiry,
  sortTeamMembers,
  getTeamMemberCountText,
  getTeamProgressText,
} from '@/lib/challenges/team';
import type {
  ChallengeTeamRow,
  TeamMemberRow,
  ChallengeInviteRow,
  ChallengeTeam,
  TeamMember,
  ChallengeInvite,
} from '@/types/challenges';

// Mock 데이터
const mockTeamRow: ChallengeTeamRow = {
  id: 'team-1',
  challenge_id: 'challenge-1',
  name: '철수의 팀',
  leader_id: 'user-1',
  max_members: 4,
  created_at: '2025-12-24T00:00:00Z',
  updated_at: '2025-12-24T00:00:00Z',
};

const mockMemberRow: TeamMemberRow = {
  id: 'member-1',
  team_id: 'team-1',
  clerk_user_id: 'user-1',
  role: 'leader',
  status: 'accepted',
  joined_at: '2025-12-24T00:00:00Z',
  progress: { percentage: 50 },
  users: {
    full_name: '김철수',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

const mockInviteRow: ChallengeInviteRow = {
  id: 'invite-1',
  team_id: 'team-1',
  inviter_id: 'user-1',
  invitee_id: 'user-2',
  status: 'pending',
  created_at: '2025-12-24T00:00:00Z',
  expires_at: '2025-12-31T00:00:00Z',
  inviter: { full_name: '김철수' },
  challenge_teams: {
    name: '철수의 팀',
    challenges: { name: '30일 운동 챌린지' },
  },
};

describe('toChallengeTeam', () => {
  it('ChallengeTeamRow를 ChallengeTeam으로 변환', () => {
    const result = toChallengeTeam(mockTeamRow);

    expect(result.id).toBe('team-1');
    expect(result.challengeId).toBe('challenge-1');
    expect(result.name).toBe('철수의 팀');
    expect(result.leaderId).toBe('user-1');
    expect(result.maxMembers).toBe(4);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});

describe('toTeamMember', () => {
  it('TeamMemberRow를 TeamMember로 변환', () => {
    const result = toTeamMember(mockMemberRow);

    expect(result.id).toBe('member-1');
    expect(result.teamId).toBe('team-1');
    expect(result.clerkUserId).toBe('user-1');
    expect(result.role).toBe('leader');
    expect(result.status).toBe('accepted');
    expect(result.userName).toBe('김철수');
    expect(result.userAvatar).toBe('https://example.com/avatar.jpg');
    expect(result.progress.percentage).toBe(50);
  });

  it('joinedAt이 null이면 null 반환', () => {
    const rowWithNullJoined = { ...mockMemberRow, joined_at: null };
    const result = toTeamMember(rowWithNullJoined);
    expect(result.joinedAt).toBeNull();
  });
});

describe('toChallengeInvite', () => {
  it('ChallengeInviteRow를 ChallengeInvite로 변환', () => {
    const result = toChallengeInvite(mockInviteRow);

    expect(result.id).toBe('invite-1');
    expect(result.teamId).toBe('team-1');
    expect(result.inviterId).toBe('user-1');
    expect(result.inviteeId).toBe('user-2');
    expect(result.status).toBe('pending');
    expect(result.inviterName).toBe('김철수');
    expect(result.teamName).toBe('철수의 팀');
    expect(result.challengeName).toBe('30일 운동 챌린지');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.expiresAt).toBeInstanceOf(Date);
  });
});

describe('calculateTeamProgress', () => {
  const createMember = (
    id: string,
    status: 'accepted' | 'pending',
    percentage: number
  ): TeamMember => ({
    id,
    teamId: 'team-1',
    clerkUserId: `user-${id}`,
    role: 'member',
    status,
    joinedAt: new Date(),
    progress: { percentage },
  });

  it('멤버 평균 진행률 계산', () => {
    const members = [
      createMember('1', 'accepted', 50),
      createMember('2', 'accepted', 100),
      createMember('3', 'accepted', 75),
    ];

    const result = calculateTeamProgress(members);
    expect(result).toBe(75); // (50 + 100 + 75) / 3 = 75
  });

  it('대기 중인 멤버 제외', () => {
    const members = [
      createMember('1', 'accepted', 50),
      createMember('2', 'pending', 0),
      createMember('3', 'accepted', 100),
    ];

    const result = calculateTeamProgress(members);
    expect(result).toBe(75); // (50 + 100) / 2 = 75
  });

  it('accepted 멤버 없으면 0 반환', () => {
    const members = [createMember('1', 'pending', 0)];
    expect(calculateTeamProgress(members)).toBe(0);
  });

  it('빈 배열이면 0 반환', () => {
    expect(calculateTeamProgress([])).toBe(0);
  });
});

describe('countCompletedMembers', () => {
  const createMember = (
    id: string,
    status: 'accepted' | 'pending',
    percentage: number
  ): TeamMember => ({
    id,
    teamId: 'team-1',
    clerkUserId: `user-${id}`,
    role: 'member',
    status,
    joinedAt: new Date(),
    progress: { percentage },
  });

  it('완료한 멤버 수 계산', () => {
    const members = [
      createMember('1', 'accepted', 100),
      createMember('2', 'accepted', 50),
      createMember('3', 'accepted', 100),
    ];

    expect(countCompletedMembers(members)).toBe(2);
  });

  it('대기 중인 멤버는 완료해도 카운트 안 함', () => {
    const members = [
      createMember('1', 'accepted', 100),
      createMember('2', 'pending', 100),
    ];

    expect(countCompletedMembers(members)).toBe(1);
  });
});

describe('isInviteExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('만료되지 않은 초대', () => {
    const invite: ChallengeInvite = {
      id: '1',
      teamId: 'team-1',
      inviterId: 'user-1',
      inviteeId: 'user-2',
      status: 'pending',
      createdAt: new Date('2025-12-24T00:00:00Z'),
      expiresAt: new Date('2025-12-31T00:00:00Z'),
    };

    expect(isInviteExpired(invite)).toBe(false);
  });

  it('만료된 초대', () => {
    const invite: ChallengeInvite = {
      id: '1',
      teamId: 'team-1',
      inviterId: 'user-1',
      inviteeId: 'user-2',
      status: 'pending',
      createdAt: new Date('2025-12-20T00:00:00Z'),
      expiresAt: new Date('2025-12-24T00:00:00Z'),
    };

    expect(isInviteExpired(invite)).toBe(true);
  });
});

describe('canInvite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-25T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초대 가능 (pending + 미만료)', () => {
    const invite: ChallengeInvite = {
      id: '1',
      teamId: 'team-1',
      inviterId: 'user-1',
      inviteeId: 'user-2',
      status: 'pending',
      createdAt: new Date('2025-12-24T00:00:00Z'),
      expiresAt: new Date('2025-12-31T00:00:00Z'),
    };

    expect(canInvite(invite)).toBe(true);
  });

  it('초대 불가 (이미 수락됨)', () => {
    const invite: ChallengeInvite = {
      id: '1',
      teamId: 'team-1',
      inviterId: 'user-1',
      inviteeId: 'user-2',
      status: 'accepted',
      createdAt: new Date('2025-12-24T00:00:00Z'),
      expiresAt: new Date('2025-12-31T00:00:00Z'),
    };

    expect(canInvite(invite)).toBe(false);
  });

  it('초대 불가 (만료됨)', () => {
    const invite: ChallengeInvite = {
      id: '1',
      teamId: 'team-1',
      inviterId: 'user-1',
      inviteeId: 'user-2',
      status: 'pending',
      createdAt: new Date('2025-12-20T00:00:00Z'),
      expiresAt: new Date('2025-12-24T00:00:00Z'),
    };

    expect(canInvite(invite)).toBe(false);
  });
});

describe('canJoinTeam', () => {
  const mockTeam: ChallengeTeam = {
    id: 'team-1',
    challengeId: 'challenge-1',
    name: '테스트 팀',
    leaderId: 'user-1',
    maxMembers: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMember = (id: string, status: 'accepted' | 'pending'): TeamMember => ({
    id,
    teamId: 'team-1',
    clerkUserId: `user-${id}`,
    role: 'member',
    status,
    joinedAt: new Date(),
    progress: {},
  });

  it('가입 가능 (자리 남음)', () => {
    const members = [
      createMember('1', 'accepted'),
      createMember('2', 'accepted'),
    ];

    expect(canJoinTeam(mockTeam, members)).toBe(true);
  });

  it('가입 불가 (자리 없음)', () => {
    const members = [
      createMember('1', 'accepted'),
      createMember('2', 'accepted'),
      createMember('3', 'accepted'),
      createMember('4', 'accepted'),
    ];

    expect(canJoinTeam(mockTeam, members)).toBe(false);
  });

  it('대기 중인 멤버는 자리 계산에서 제외', () => {
    const members = [
      createMember('1', 'accepted'),
      createMember('2', 'accepted'),
      createMember('3', 'pending'),
      createMember('4', 'pending'),
    ];

    expect(canJoinTeam(mockTeam, members)).toBe(true);
  });
});

describe('isTeamLeader', () => {
  const mockTeam: ChallengeTeam = {
    id: 'team-1',
    challengeId: 'challenge-1',
    name: '테스트 팀',
    leaderId: 'user-1',
    maxMembers: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('리더면 true', () => {
    expect(isTeamLeader(mockTeam, 'user-1')).toBe(true);
  });

  it('리더 아니면 false', () => {
    expect(isTeamLeader(mockTeam, 'user-2')).toBe(false);
  });
});

describe('isTeamMember', () => {
  const createMember = (
    userId: string,
    status: 'accepted' | 'pending'
  ): TeamMember => ({
    id: `member-${userId}`,
    teamId: 'team-1',
    clerkUserId: userId,
    role: 'member',
    status,
    joinedAt: new Date(),
    progress: {},
  });

  it('accepted 멤버면 true', () => {
    const members = [createMember('user-1', 'accepted')];
    expect(isTeamMember(members, 'user-1')).toBe(true);
  });

  it('pending 멤버면 false', () => {
    const members = [createMember('user-1', 'pending')];
    expect(isTeamMember(members, 'user-1')).toBe(false);
  });

  it('멤버 아니면 false', () => {
    const members = [createMember('user-1', 'accepted')];
    expect(isTeamMember(members, 'user-2')).toBe(false);
  });
});

describe('generateTeamName', () => {
  it('리더 이름으로 팀 이름 생성', () => {
    expect(generateTeamName('김철수')).toBe('김철수의 팀');
    expect(generateTeamName('이영희')).toBe('이영희의 팀');
  });
});

describe('createInviteExpiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('기본 7일 후 만료', () => {
    const expiry = createInviteExpiry();
    expect(expiry.toISOString()).toBe('2025-12-31T12:00:00.000Z');
  });

  it('커스텀 일수', () => {
    const expiry = createInviteExpiry(14);
    expect(expiry.toISOString()).toBe('2026-01-07T12:00:00.000Z');
  });
});

describe('sortTeamMembers', () => {
  const createMember = (
    id: string,
    role: 'leader' | 'member',
    status: 'accepted' | 'pending',
    percentage: number
  ): TeamMember => ({
    id,
    teamId: 'team-1',
    clerkUserId: `user-${id}`,
    role,
    status,
    joinedAt: new Date(),
    progress: { percentage },
  });

  it('리더가 먼저', () => {
    const members = [
      createMember('1', 'member', 'accepted', 100),
      createMember('2', 'leader', 'accepted', 50),
    ];

    const sorted = sortTeamMembers(members);
    expect(sorted[0].role).toBe('leader');
  });

  it('수락된 멤버가 대기 중보다 먼저', () => {
    const members = [
      createMember('1', 'member', 'pending', 0),
      createMember('2', 'member', 'accepted', 50),
    ];

    const sorted = sortTeamMembers(members);
    expect(sorted[0].status).toBe('accepted');
  });

  it('진행률 높은 순', () => {
    const members = [
      createMember('1', 'member', 'accepted', 30),
      createMember('2', 'member', 'accepted', 80),
      createMember('3', 'member', 'accepted', 50),
    ];

    const sorted = sortTeamMembers(members);
    expect(sorted[0].progress.percentage).toBe(80);
    expect(sorted[1].progress.percentage).toBe(50);
    expect(sorted[2].progress.percentage).toBe(30);
  });
});

describe('getTeamMemberCountText', () => {
  const createMember = (status: 'accepted' | 'pending'): TeamMember => ({
    id: 'member-1',
    teamId: 'team-1',
    clerkUserId: 'user-1',
    role: 'member',
    status,
    joinedAt: new Date(),
    progress: {},
  });

  it('멤버 수 텍스트 반환', () => {
    const members = [createMember('accepted'), createMember('accepted')];
    expect(getTeamMemberCountText(members, 4)).toBe('2/4명');
  });

  it('대기 중인 멤버 제외', () => {
    const members = [createMember('accepted'), createMember('pending')];
    expect(getTeamMemberCountText(members, 4)).toBe('1/4명');
  });
});

describe('getTeamProgressText', () => {
  const createMember = (percentage: number): TeamMember => ({
    id: 'member-1',
    teamId: 'team-1',
    clerkUserId: 'user-1',
    role: 'member',
    status: 'accepted',
    joinedAt: new Date(),
    progress: { percentage },
  });

  it('진행률 텍스트 반환', () => {
    const members = [createMember(50), createMember(70)];
    expect(getTeamProgressText(members, 60)).toBe('팀 진행률 60%');
  });

  it('전체 완료 시 완료 텍스트', () => {
    const members = [createMember(100), createMember(100)];
    expect(getTeamProgressText(members, 100)).toBe('팀 전체 완료!');
  });
});
