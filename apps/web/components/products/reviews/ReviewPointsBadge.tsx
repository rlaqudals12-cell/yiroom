'use client';

import { useState } from 'react';
import { Coins, Gift, Star, Camera, Sparkles, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 리뷰 포인트 정책
 */
export interface ReviewPointPolicy {
  /** 기본 리뷰 작성 포인트 */
  basePoints: number;
  /** 텍스트 리뷰 추가 포인트 (50자 이상) */
  textBonus: number;
  /** 사진 첨부 추가 포인트 */
  photoBonus: number;
  /** 첫 리뷰 보너스 */
  firstReviewBonus: number;
  /** 상세 리뷰 보너스 (200자 이상) */
  detailedBonus: number;
}

// 기본 포인트 정책
const DEFAULT_POINT_POLICY: ReviewPointPolicy = {
  basePoints: 50,
  textBonus: 30,
  photoBonus: 100,
  firstReviewBonus: 200,
  detailedBonus: 50,
};

interface ReviewPointsBadgeProps {
  /** 포인트 정책 (커스텀 가능) */
  policy?: ReviewPointPolicy;
  /** 첫 리뷰 여부 */
  isFirstReview?: boolean;
  /** 클릭 시 리뷰 작성으로 이동 */
  onWriteClick?: () => void;
  /** 추가 클래스 */
  className?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 리뷰 작성 포인트 배지 (언니의파우치 스타일)
 * - 리뷰 작성 시 적립 가능한 포인트 안내
 * - 포인트 정책 상세 정보
 */
export function ReviewPointsBadge({
  policy = DEFAULT_POINT_POLICY,
  isFirstReview = false,
  onWriteClick,
  className,
  compact = false,
}: ReviewPointsBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  // 최대 획득 가능 포인트 계산
  const maxPoints =
    policy.basePoints +
    policy.textBonus +
    policy.photoBonus +
    policy.detailedBonus +
    (isFirstReview ? policy.firstReviewBonus : 0);

  if (compact) {
    return (
      <button
        onClick={onWriteClick}
        title={`리뷰 작성하고 포인트 받기! 기본 ${policy.basePoints}P, 텍스트 +${policy.textBonus}P, 사진 +${policy.photoBonus}P`}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 rounded-full text-sm font-semibold hover:from-amber-500 hover:to-yellow-600 transition-all shadow-sm',
          className
        )}
      >
        <Coins className="w-4 h-4" aria-hidden="true" />
        <span>최대 {maxPoints}P</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30 overflow-hidden',
        className
      )}
      data-testid="review-points-badge"
    >
      {/* 메인 배너 */}
      <button
        onClick={onWriteClick}
        className="w-full px-4 py-3 flex items-center justify-between group hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
            <Gift className="w-5 h-5 text-amber-950" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
              리뷰 쓰고 포인트 받기
              <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              최대{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400">{maxPoints}P</span>{' '}
              적립
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 첫 리뷰 보너스 배너 */}
      {isFirstReview && (
        <div className="px-4 py-2 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-t border-amber-200/50 dark:border-amber-800/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
            <Star className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
          </div>
          <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
            첫 리뷰 보너스 +{policy.firstReviewBonus}P
          </span>
        </div>
      )}

      {/* 상세 정보 토글 */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-4 py-2 flex items-center justify-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline border-t border-amber-200/50 dark:border-amber-800/30"
      >
        <Info className="w-3.5 h-3.5" aria-hidden="true" />
        포인트 정책 상세
      </button>

      {/* 상세 정보 패널 */}
      {showDetails && (
        <div className="px-4 py-3 bg-amber-100/50 dark:bg-amber-900/20 border-t border-amber-200/50 dark:border-amber-800/30 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-700 dark:text-amber-300">기본 적립</span>
            <span className="font-medium text-amber-800 dark:text-amber-200">
              {policy.basePoints}P
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              텍스트 리뷰 (50자 이상)
            </span>
            <span className="font-medium text-amber-800 dark:text-amber-200">
              +{policy.textBonus}P
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              사진 첨부
            </span>
            <span className="font-medium text-amber-800 dark:text-amber-200">
              +{policy.photoBonus}P
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-700 dark:text-amber-300">상세 리뷰 (200자 이상)</span>
            <span className="font-medium text-amber-800 dark:text-amber-200">
              +{policy.detailedBonus}P
            </span>
          </div>
          {isFirstReview && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" aria-hidden="true" />첫 리뷰 보너스
              </span>
              <span className="font-medium text-rose-600 dark:text-rose-400">
                +{policy.firstReviewBonus}P
              </span>
            </div>
          )}
          <p className="text-xs text-amber-600 dark:text-amber-400 pt-2">
            * 포인트는 리뷰 승인 후 24시간 내 적립됩니다
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 리뷰 작성 시 예상 포인트 계산
 */
export function calculateReviewPoints(
  content: string,
  hasPhoto: boolean,
  isFirstReview: boolean,
  policy: ReviewPointPolicy = DEFAULT_POINT_POLICY
): { total: number; breakdown: { label: string; points: number }[] } {
  const breakdown: { label: string; points: number }[] = [];
  let total = 0;

  // 기본 포인트
  breakdown.push({ label: '기본 적립', points: policy.basePoints });
  total += policy.basePoints;

  // 텍스트 리뷰 보너스
  if (content.length >= 50) {
    breakdown.push({ label: '텍스트 리뷰', points: policy.textBonus });
    total += policy.textBonus;
  }

  // 상세 리뷰 보너스
  if (content.length >= 200) {
    breakdown.push({ label: '상세 리뷰', points: policy.detailedBonus });
    total += policy.detailedBonus;
  }

  // 사진 첨부 보너스
  if (hasPhoto) {
    breakdown.push({ label: '사진 첨부', points: policy.photoBonus });
    total += policy.photoBonus;
  }

  // 첫 리뷰 보너스
  if (isFirstReview) {
    breakdown.push({ label: '첫 리뷰 보너스', points: policy.firstReviewBonus });
    total += policy.firstReviewBonus;
  }

  return { total, breakdown };
}

export default ReviewPointsBadge;
