'use client';

/**
 * 배지 그리드 컴포넌트
 * - 카테고리별 배지 표시
 * - 획득 진행률 표시
 */

import { cn } from '@/lib/utils';
import type { Badge, UserBadge, BadgeGroup } from '@/types/gamification';
import { BadgeCard } from './BadgeCard';
import { CATEGORY_ICONS } from '@/lib/gamification/constants';

interface BadgeGridProps {
  groups: BadgeGroup[];
  userBadges: UserBadge[];
  onBadgeClick?: (badge: Badge) => void;
}

export function BadgeGrid({ groups, userBadges, onBadgeClick }: BadgeGridProps) {
  // 획득한 배지 ID Set
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  // 획득일 Map
  const earnedAtMap = new Map(
    userBadges.map((ub) => [ub.badgeId, ub.earnedAt]),
  );

  return (
    <div data-testid="badge-grid" className="space-y-8">
      {groups.map((group) => (
        <div key={group.category} className="space-y-4">
          {/* 카테고리 헤더 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{CATEGORY_ICONS[group.category]}</span>
              <h3 className="font-semibold text-gray-900">{group.categoryName}</h3>
            </div>
            <span className="text-sm text-gray-500">
              {group.earnedCount}/{group.totalCount}
            </span>
          </div>

          {/* 진행률 바 */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                group.earnedCount === group.totalCount
                  ? 'bg-green-500'
                  : 'bg-blue-500',
              )}
              style={{
                width: `${group.totalCount > 0 ? (group.earnedCount / group.totalCount) * 100 : 0}%`,
              }}
            />
          </div>

          {/* 배지 그리드 */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {group.badges.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id);
              const earnedAt = earnedAtMap.get(badge.id);

              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isEarned={isEarned}
                  earnedAt={earnedAt}
                  size="sm"
                  showDetails={true}
                  onClick={onBadgeClick ? () => onBadgeClick(badge) : undefined}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 간단한 배지 리스트 (최근 획득 등)
 */
interface BadgeListProps {
  badges: UserBadge[];
  maxDisplay?: number;
  showEmpty?: boolean;
  emptyMessage?: string;
}

export function BadgeList({
  badges,
  maxDisplay = 5,
  showEmpty = true,
  emptyMessage = '아직 획득한 배지가 없어요',
}: BadgeListProps) {
  const displayBadges = badges.slice(0, maxDisplay);

  if (badges.length === 0 && showEmpty) {
    return (
      <p data-testid="badge-list-empty" className="text-sm text-gray-500 text-center py-4">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div data-testid="badge-list" className="flex flex-wrap gap-2">
      {displayBadges.map((ub) =>
        ub.badge ? (
          <BadgeCard
            key={ub.id}
            badge={ub.badge}
            isEarned={true}
            earnedAt={ub.earnedAt}
            size="sm"
            showDetails={false}
          />
        ) : null,
      )}
      {badges.length > maxDisplay && (
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm">
          +{badges.length - maxDisplay}
        </div>
      )}
    </div>
  );
}
