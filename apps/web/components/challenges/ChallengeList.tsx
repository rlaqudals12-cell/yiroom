'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChallengeCard } from './ChallengeCard';
import type { Challenge, UserChallenge, ChallengeDomain, ChallengeDifficulty } from '@/types/challenges';
import { DOMAIN_NAMES, DIFFICULTY_NAMES } from '@/types/challenges';

interface ChallengeListProps {
  challenges: Challenge[];
  userChallenges?: UserChallenge[];
  onJoin?: (challengeId: string) => Promise<void>;
  onView?: (challengeId: string) => void;
  showFilters?: boolean;
  className?: string;
}

/**
 * 챌린지 목록 컴포넌트
 */
export function ChallengeList({
  challenges,
  userChallenges = [],
  onJoin,
  onView,
  showFilters = true,
  className,
}: ChallengeListProps) {
  const [domainFilter, setDomainFilter] = useState<ChallengeDomain | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<ChallengeDifficulty | 'all'>('all');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // 사용자 챌린지 맵 생성 (challengeId → UserChallenge)
  const userChallengeMap = new Map<string, UserChallenge>();
  userChallenges.forEach((uc) => {
    userChallengeMap.set(uc.challengeId, uc);
  });

  // 필터링 및 정렬된 챌린지
  const filteredChallenges = challenges
    .filter((challenge) => {
      if (domainFilter !== 'all' && challenge.domain !== domainFilter) return false;
      if (difficultyFilter !== 'all' && challenge.difficulty !== difficultyFilter) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // 참여 처리
  const handleJoin = async (challengeId: string) => {
    if (!onJoin) return;
    setJoiningId(challengeId);
    try {
      await onJoin(challengeId);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="challenge-list">
      {/* 필터 */}
      {showFilters && (
        <div className="flex flex-wrap gap-2" data-testid="challenge-filters">
          {/* 도메인 필터 */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <FilterButton
              active={domainFilter === 'all'}
              onClick={() => setDomainFilter('all')}
            >
              전체
            </FilterButton>
            {(Object.keys(DOMAIN_NAMES) as ChallengeDomain[]).map((domain) => (
              <FilterButton
                key={domain}
                active={domainFilter === domain}
                onClick={() => setDomainFilter(domain)}
              >
                {DOMAIN_NAMES[domain]}
              </FilterButton>
            ))}
          </div>

          {/* 난이도 필터 */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <FilterButton
              active={difficultyFilter === 'all'}
              onClick={() => setDifficultyFilter('all')}
            >
              전체
            </FilterButton>
            {(Object.keys(DIFFICULTY_NAMES) as ChallengeDifficulty[]).map((difficulty) => (
              <FilterButton
                key={difficulty}
                active={difficultyFilter === difficulty}
                onClick={() => setDifficultyFilter(difficulty)}
              >
                {DIFFICULTY_NAMES[difficulty]}
              </FilterButton>
            ))}
          </div>
        </div>
      )}

      {/* 챌린지 목록 */}
      {filteredChallenges.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          해당하는 챌린지가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              userChallenge={userChallengeMap.get(challenge.id)}
              onJoin={() => handleJoin(challenge.id)}
              onView={() => onView?.(challenge.id)}
              loading={joiningId === challenge.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 필터 버튼
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1 text-sm rounded-md transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

export default ChallengeList;
