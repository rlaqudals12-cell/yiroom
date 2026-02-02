'use client';

/**
 * K-2 패션 확장: 사이즈 추천 카드 컴포넌트
 *
 * @description 체형/키 기반 사이즈 추천 결과 표시
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 3.5
 */

import { useState } from 'react';
import { Ruler, ChevronDown, ChevronUp, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SizeProfile, SizeRecommendation, SizeCategory } from '@/lib/fashion/size-recommendation';

interface SizeRecommendationCardProps {
  profile: SizeProfile;
  className?: string;
}

// 카테고리별 아이콘과 라벨
const CATEGORY_CONFIG: Record<
  SizeCategory,
  { label: string; icon: string; color: string }
> = {
  top: { label: '상의', icon: '👕', color: 'text-blue-600 bg-blue-50' },
  bottom: { label: '하의', icon: '👖', color: 'text-indigo-600 bg-indigo-50' },
  outer: { label: '아우터', icon: '🧥', color: 'text-purple-600 bg-purple-50' },
  shoes: { label: '신발', icon: '👟', color: 'text-orange-600 bg-orange-50' },
  dress: { label: '원피스', icon: '👗', color: 'text-pink-600 bg-pink-50' },
};

// 핏 타입 라벨
const FIT_LABELS = {
  slim: '슬림핏',
  regular: '레귤러핏',
  relaxed: '오버핏',
};

// 키 핏 라벨
const HEIGHT_FIT_LABELS = {
  short: '숏',
  regular: '레귤러',
  long: '롱',
  petite: '프티',
};

/**
 * 신뢰도에 따른 색상
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-green-600 bg-green-50';
  if (confidence >= 75) return 'text-yellow-600 bg-yellow-50';
  return 'text-orange-600 bg-orange-50';
}

/**
 * 개별 사이즈 추천 아이템
 */
function SizeRecommendationItem({
  recommendation,
  isExpanded,
  onToggle,
}: {
  recommendation: SizeRecommendation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = CATEGORY_CONFIG[recommendation.category];

  return (
    <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      {/* 헤더 - 클릭 가능 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="text-left">
            <p className="font-medium text-foreground">{config.label}</p>
            <p className="text-sm text-muted-foreground">
              {FIT_LABELS[recommendation.fitType]} · {HEIGHT_FIT_LABELS[recommendation.heightFit]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 추천 사이즈 */}
          <div
            className={cn(
              'px-4 py-2 rounded-lg font-bold text-lg',
              config.color
            )}
          >
            {recommendation.recommendedSize}
          </div>

          {/* 신뢰도 */}
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              getConfidenceColor(recommendation.confidence)
            )}
          >
            {recommendation.confidence}%
          </div>

          {/* 토글 아이콘 */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* 확장 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t">
          {/* 대안 사이즈 */}
          {recommendation.alternativeSizes.length > 0 && (
            <div className="pt-3">
              <p className="text-sm text-muted-foreground mb-2">대안 사이즈</p>
              <div className="flex gap-2">
                {recommendation.alternativeSizes.map((size) => (
                  <span
                    key={size}
                    className="px-3 py-1 rounded-lg bg-muted text-sm font-medium"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 팁 */}
          {recommendation.tips.length > 0 && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-2">스타일링 팁</p>
              <ul className="space-y-1">
                {recommendation.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 사이즈 추천 카드 메인 컴포넌트
 */
export function SizeRecommendationCard({
  profile,
  className,
}: SizeRecommendationCardProps) {
  const [expandedCategory, setExpandedCategory] = useState<SizeCategory | null>(
    'top'
  );

  const toggleCategory = (category: SizeCategory) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  // 추천 목록 구성 (null이 아닌 것만)
  const recommendations = [
    profile.recommendations.top,
    profile.recommendations.bottom,
    profile.recommendations.outer,
    profile.recommendations.shoes,
    profile.recommendations.dress,
  ].filter((r): r is SizeRecommendation => r !== null);

  return (
    <div
      className={cn('space-y-4', className)}
      data-testid="size-recommendation-card"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
          <Ruler className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-foreground">맞춤 사이즈 추천</h3>
          <p className="text-sm text-muted-foreground">
            {profile.gender === 'male' ? '남성' : '여성'} · {profile.measurements.height}cm · {profile.measurements.weight}kg
          </p>
        </div>
      </div>

      {/* 측정치 요약 */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
        {profile.measurements.chest && (
          <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs">
            가슴 {profile.measurements.chest}cm
          </span>
        )}
        {profile.measurements.waist && (
          <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs">
            허리 {profile.measurements.waist}cm
          </span>
        )}
        {profile.measurements.hip && (
          <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs">
            엉덩이 {profile.measurements.hip}cm
          </span>
        )}
        {profile.measurements.footLength && (
          <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded text-xs">
            발길이 {profile.measurements.footLength}mm
          </span>
        )}
        {profile.bodyType && (
          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
            {profile.bodyType}타입 체형
          </span>
        )}
      </div>

      {/* 사이즈 추천 목록 */}
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <SizeRecommendationItem
            key={rec.category}
            recommendation={rec}
            isExpanded={expandedCategory === rec.category}
            onToggle={() => toggleCategory(rec.category)}
          />
        ))}
      </div>

      {/* 일반 팁 */}
      {profile.generalTips.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-violet-600" />
            <p className="font-medium text-sm text-violet-800 dark:text-violet-300">
              스타일링 조언
            </p>
          </div>
          <ul className="space-y-1">
            {profile.generalTips.map((tip, index) => (
              <li
                key={index}
                className="text-sm text-violet-700 dark:text-violet-200"
              >
                • {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 주의사항 */}
      <p className="text-xs text-muted-foreground text-center">
        ※ 브랜드별로 사이즈가 다를 수 있어요. 구매 전 실측 사이즈를 확인하세요.
      </p>
    </div>
  );
}

export default SizeRecommendationCard;
