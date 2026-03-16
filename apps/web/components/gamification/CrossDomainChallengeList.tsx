'use client';

/**
 * 크로스도메인 챌린지 목록 컴포넌트
 *
 * @description 여러 크로스도메인 챌린지를 리스트로 표시
 * @see lib/gamification/cross-domain-challenges.ts
 */

import { cn } from '@/lib/utils';
import { CrossDomainChallengeCard } from './CrossDomainChallengeCard';
import type {
  CrossDomainProgressView,
  CrossDomainChallengeDefinition,
} from '@/lib/gamification/cross-domain-challenges';

interface CrossDomainChallengeListProps {
  /** 챌린지 진행 뷰 목록 */
  views: CrossDomainProgressView[];
  /** 챌린지 정의 맵 (ID → 정의) */
  definitions?: Map<string, CrossDomainChallengeDefinition>;
  /** "도전하기" 핸들러 */
  onJoin?: (challengeId: string) => void;
  /** 참여 중인 챌린지 ID 목록 */
  joinedIds?: string[];
  /** 클래스명 */
  className?: string;
}

export function CrossDomainChallengeList({
  views,
  definitions,
  onJoin,
  joinedIds = [],
  className,
}: CrossDomainChallengeListProps) {
  if (views.length === 0) {
    return (
      <div
        className="text-center py-8 text-muted-foreground"
        data-testid="cross-domain-challenge-list-empty"
      >
        <p>참여 가능한 크로스도메인 챌린지가 없어요.</p>
        <p className="text-sm mt-1">레벨을 올리면 새로운 챌린지가 열려요!</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="cross-domain-challenge-list">
      {views.map((view) => (
        <CrossDomainChallengeCard
          key={view.challengeId}
          view={view}
          definition={definitions?.get(view.challengeId)}
          onJoin={onJoin}
          isJoined={joinedIds.includes(view.challengeId)}
        />
      ))}
    </div>
  );
}

export default CrossDomainChallengeList;
