/**
 * 팀 챌린지 유틸리티
 * Sprint C Day 7: 챌린지 확장
 */

import {
  type ChallengeTeam,
  type ChallengeTeamRow,
  type TeamMember,
  type TeamMemberRow,
  type ChallengeInvite,
  type ChallengeInviteRow,
  type ChallengeProgress,
  type TeamMemberStatus,
  type TeamRole,
} from '@/types/challenges';

// ============================================================
// Row → Entity 변환 함수
// ============================================================

/**
 * ChallengeTeamRow → ChallengeTeam 변환
 */
export function toChallengeTeam(row: ChallengeTeamRow): ChallengeTeam {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    name: row.name,
    leaderId: row.leader_id,
    maxMembers: row.max_members,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * TeamMemberRow → TeamMember 변환
 */
export function toTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    teamId: row.team_id,
    clerkUserId: row.clerk_user_id,
    role: row.role as TeamRole,
    status: row.status as TeamMemberStatus,
    joinedAt: row.joined_at ? new Date(row.joined_at) : null,
    progress: row.progress as ChallengeProgress,
    userName: row.users?.full_name,
    userAvatar: row.users?.avatar_url,
  };
}

/**
 * ChallengeInviteRow → ChallengeInvite 변환
 */
export function toChallengeInvite(row: ChallengeInviteRow): ChallengeInvite {
  return {
    id: row.id,
    teamId: row.team_id,
    inviterId: row.inviter_id,
    inviteeId: row.invitee_id,
    status: row.status as TeamMemberStatus,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    inviterName: row.inviter?.full_name,
    teamName: row.challenge_teams?.name,
    challengeName: row.challenge_teams?.challenges?.name,
  };
}

// ============================================================
// 팀 진행률 계산
// ============================================================

/**
 * 팀 전체 진행률 계산 (멤버 평균)
 */
export function calculateTeamProgress(members: TeamMember[]): number {
  const acceptedMembers = members.filter((m) => m.status === 'accepted');
  if (acceptedMembers.length === 0) return 0;

  const totalProgress = acceptedMembers.reduce((sum, member) => {
    return sum + (member.progress.percentage || 0);
  }, 0);

  return Math.round(totalProgress / acceptedMembers.length);
}

/**
 * 팀 완료 멤버 수 계산
 */
export function countCompletedMembers(members: TeamMember[]): number {
  return members.filter(
    (m) => m.status === 'accepted' && (m.progress.percentage || 0) >= 100
  ).length;
}

// ============================================================
// 초대 유효성 검사
// ============================================================

/**
 * 초대 만료 여부 확인
 */
export function isInviteExpired(invite: ChallengeInvite): boolean {
  return new Date() > invite.expiresAt;
}

/**
 * 초대 가능 여부 확인
 */
export function canInvite(invite: ChallengeInvite): boolean {
  return invite.status === 'pending' && !isInviteExpired(invite);
}

// ============================================================
// 팀 가입 가능 여부
// ============================================================

/**
 * 팀에 가입 가능한지 확인
 */
export function canJoinTeam(
  team: ChallengeTeam,
  members: TeamMember[]
): boolean {
  const acceptedCount = members.filter((m) => m.status === 'accepted').length;
  return acceptedCount < team.maxMembers;
}

/**
 * 팀 리더인지 확인
 */
export function isTeamLeader(team: ChallengeTeam, userId: string): boolean {
  return team.leaderId === userId;
}

/**
 * 팀 멤버인지 확인
 */
export function isTeamMember(members: TeamMember[], userId: string): boolean {
  return members.some(
    (m) => m.clerkUserId === userId && m.status === 'accepted'
  );
}

// ============================================================
// 팀 이름 생성
// ============================================================

/**
 * 기본 팀 이름 생성
 */
export function generateTeamName(leaderName: string): string {
  return `${leaderName}의 팀`;
}

// ============================================================
// 초대 만료 시간 계산
// ============================================================

/**
 * 초대 만료 시간 생성 (기본 7일)
 */
export function createInviteExpiry(days: number = 7): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

// ============================================================
// 멤버 정렬
// ============================================================

/**
 * 멤버 정렬 (리더 먼저, 그 다음 진행률 순)
 */
export function sortTeamMembers(members: TeamMember[]): TeamMember[] {
  return [...members].sort((a, b) => {
    // 리더가 먼저
    if (a.role === 'leader' && b.role !== 'leader') return -1;
    if (a.role !== 'leader' && b.role === 'leader') return 1;

    // 수락된 멤버가 먼저
    if (a.status === 'accepted' && b.status !== 'accepted') return -1;
    if (a.status !== 'accepted' && b.status === 'accepted') return 1;

    // 진행률 높은 순
    const aProgress = a.progress.percentage || 0;
    const bProgress = b.progress.percentage || 0;
    return bProgress - aProgress;
  });
}

// ============================================================
// 팀 상태 텍스트
// ============================================================

/**
 * 팀 멤버 수 텍스트
 */
export function getTeamMemberCountText(
  members: TeamMember[],
  maxMembers: number
): string {
  const acceptedCount = members.filter((m) => m.status === 'accepted').length;
  return `${acceptedCount}/${maxMembers}명`;
}

/**
 * 팀 진행 상태 텍스트
 */
export function getTeamProgressText(
  members: TeamMember[],
  teamProgress: number
): string {
  const completedCount = countCompletedMembers(members);
  const acceptedCount = members.filter((m) => m.status === 'accepted').length;

  if (completedCount === acceptedCount && acceptedCount > 0) {
    return '팀 전체 완료!';
  }

  return `팀 진행률 ${teamProgress}%`;
}
