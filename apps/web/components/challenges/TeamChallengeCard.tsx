'use client';

import { Users, Crown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import type {
  Challenge,
  TeamChallengeDetail,
  TeamMember,
} from '@/types/challenges';
import {
  DOMAIN_COLORS,
  DIFFICULTY_NAMES,
  DIFFICULTY_COLORS,
  ROLE_NAMES,
} from '@/types/challenges';
import {
  getTeamMemberCountText,
  getTeamProgressText,
  sortTeamMembers,
} from '@/lib/challenges/team';

interface TeamChallengeCardProps {
  challenge: Challenge;
  teamDetail?: TeamChallengeDetail;
  /** 초대 버튼 클릭 */
  onInvite?: () => void;
  /** 상세 보기 클릭 */
  onView?: () => void;
  /** 팀 생성 클릭 (팀 없을 때) */
  onCreateTeam?: () => void;
  /** 현재 사용자 ID */
  currentUserId?: string;
  /** 로딩 상태 */
  loading?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * 팀 챌린지 카드 컴포넌트
 * - 팀 멤버 목록 표시
 * - 팀 진행률 표시
 * - 초대하기 버튼
 */
export function TeamChallengeCard({
  challenge,
  teamDetail,
  onInvite,
  onView,
  onCreateTeam,
  currentUserId,
  loading = false,
  className,
  'data-testid': testId,
}: TeamChallengeCardProps) {
  const domainColor = DOMAIN_COLORS[challenge.domain];
  const difficultyColor = DIFFICULTY_COLORS[challenge.difficulty];
  const hasTeam = !!teamDetail;
  const isLeader =
    hasTeam && currentUserId && teamDetail.team.leaderId === currentUserId;

  // 정렬된 멤버 목록
  const sortedMembers = hasTeam ? sortTeamMembers(teamDetail.members) : [];

  // 멤버 수 텍스트
  const memberCountText = hasTeam
    ? getTeamMemberCountText(teamDetail.members, teamDetail.team.maxMembers)
    : '0/4명';

  // 팀 진행률 텍스트
  const progressText = hasTeam
    ? getTeamProgressText(teamDetail.members, teamDetail.teamProgress)
    : '팀 진행률 0%';

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-all hover:shadow-md',
        className
      )}
      data-testid={testId || 'team-challenge-card'}
    >
      {/* 상단: 아이콘 + 제목 + 팀 배지 */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl text-2xl',
            domainColor.bg
          )}
        >
          {challenge.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {challenge.name}
            </h3>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <Users className="h-3 w-3" />
              팀
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {challenge.description}
          </p>
        </div>
      </div>

      {/* 태그: 난이도 + 기간 + XP + 멤버 수 */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            difficultyColor.bg,
            difficultyColor.text
          )}
        >
          {DIFFICULTY_NAMES[challenge.difficulty]}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {challenge.durationDays}일
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          +{challenge.rewardXp} XP
        </span>
        <span
          className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
          data-testid="member-count"
        >
          <Users className="h-3 w-3" />
          {memberCountText}
        </span>
      </div>

      {/* 팀 멤버 목록 (팀이 있는 경우) */}
      {hasTeam && sortedMembers.length > 0 && (
        <div className="mt-4" data-testid="team-members">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">팀원</span>
            <span className="text-xs text-muted-foreground">{progressText}</span>
          </div>

          {/* 멤버 아바타 목록 */}
          <div className="flex flex-wrap gap-2">
            {sortedMembers.slice(0, 5).map((member) => (
              <MemberAvatar key={member.id} member={member} />
            ))}
            {sortedMembers.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                +{sortedMembers.length - 5}
              </div>
            )}
          </div>

          {/* 팀 진행률 바 */}
          <div className="mt-3">
            <Progress
              value={teamDetail.teamProgress}
              className="h-2"
              data-testid="team-progress"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>
                {teamDetail.completedCount}/{sortedMembers.length}명 완료
              </span>
              <span>{teamDetail.teamProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="mt-4 flex gap-2">
        {!hasTeam ? (
          <Button
            onClick={onCreateTeam}
            disabled={loading}
            className="flex-1"
            size="sm"
          >
            {loading ? '생성 중...' : '팀 만들기'}
          </Button>
        ) : (
          <>
            {isLeader && (
              <Button
                onClick={onInvite}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                data-testid="invite-button"
              >
                <UserPlus className="h-4 w-4" />
                초대
              </Button>
            )}
            <Button
              onClick={onView}
              variant={isLeader ? 'default' : 'outline'}
              className="flex-1"
              size="sm"
            >
              상세 보기
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 멤버 아바타 컴포넌트
 */
function MemberAvatar({ member }: { member: TeamMember }) {
  const initial = member.userName?.charAt(0).toUpperCase() || '?';
  const isLeader = member.role === 'leader';
  const isPending = member.status === 'pending';

  return (
    <div
      className={cn(
        'relative',
        isPending && 'opacity-50'
      )}
      data-testid={`member-avatar-${member.id}`}
    >
      <Avatar className="h-8 w-8">
        {member.userAvatar && (
          <AvatarImage src={member.userAvatar} alt={member.userName || ''} />
        )}
        <AvatarFallback
          className={cn(
            'text-xs',
            isLeader
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {initial}
        </AvatarFallback>
      </Avatar>

      {/* 리더 표시 */}
      {isLeader && (
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-400 flex items-center justify-center">
          <Crown className="h-2.5 w-2.5 text-yellow-900" />
        </div>
      )}

      {/* 대기 중 표시 */}
      {isPending && (
        <div
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
          title={ROLE_NAMES[member.role]}
        >
          대기
        </div>
      )}
    </div>
  );
}

export default TeamChallengeCard;
