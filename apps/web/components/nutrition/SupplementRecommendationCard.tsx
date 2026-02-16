/**
 * N-1 영양제 추천 카드 컴포넌트
 *
 * 목표 + 피부 고민 기반 영양제 추천
 * - 대중적 브랜드 우선 (종근당, 뉴트리원, 센트룸 등)
 * - 구하기 쉬운 쇼핑몰 링크 (쿠팡, 올리브영, iHerb)
 * - 가성비 좋은 제품 위주
 */

'use client';

import { useMemo, useState } from 'react';
import { Pill, ChevronDown, ChevronUp, ExternalLink, Star, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NutritionGoal } from '@/types/nutrition';
import {
  getSupplementRecommendations,
  getTopSupplements,
  type SupplementRecommendation,
  type SkinConcern,
} from '@/lib/nutrition';

// 대중적 브랜드 추천 (구하기 쉬운 브랜드)
const POPULAR_BRANDS: Record<string, { name: string; badge: string }[]> = {
  vitamin: [
    { name: '센트룸', badge: '베스트셀러' },
    { name: '얼라이브', badge: '인기' },
    { name: '종근당건강', badge: '국민 브랜드' },
  ],
  mineral: [
    { name: '솔가', badge: '프리미엄' },
    { name: '나우푸드', badge: '가성비' },
    { name: 'GNC', badge: '인기' },
  ],
  protein: [
    { name: '마이프로틴', badge: '가성비 최고' },
    { name: '옵티멈뉴트리션', badge: '프리미엄' },
    { name: '신타6', badge: '인기' },
  ],
  omega: [
    { name: '종근당건강', badge: '국민 브랜드' },
    { name: '뉴트리원', badge: '가성비' },
    { name: '닥터스베스트', badge: '인기' },
  ],
  probiotic: [
    { name: '락토핏', badge: '국민 유산균' },
    { name: '종근당', badge: '신뢰' },
    { name: '뉴트리원', badge: '가성비' },
  ],
  herbal: [
    { name: '종근당건강', badge: '국민 브랜드' },
    { name: '뉴트리원', badge: '가성비' },
    { name: '일양약품', badge: '신뢰' },
  ],
  other: [
    { name: '종근당건강', badge: '국민 브랜드' },
    { name: '뉴트리원', badge: '가성비' },
    { name: '나우푸드', badge: '인기' },
  ],
};

// 쇼핑몰 링크 생성 (대중적인 쇼핑몰)
function generateShoppingLinks(supplementName: string) {
  const encodedKeyword = encodeURIComponent(supplementName);

  return {
    coupang: `https://www.coupang.com/np/search?component=&q=${encodedKeyword}`,
    oliveyoung: `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodedKeyword}`,
    iherb: `https://kr.iherb.com/search?kw=${encodedKeyword}`,
  };
}

// 카테고리별 색상
const CATEGORY_COLORS: Record<string, string> = {
  vitamin: 'bg-orange-50 text-orange-600 border-orange-200',
  mineral: 'bg-slate-50 text-slate-600 border-slate-200',
  protein: 'bg-blue-50 text-blue-600 border-blue-200',
  omega: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  probiotic: 'bg-green-50 text-green-600 border-green-200',
  herbal: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  other: 'bg-purple-50 text-purple-600 border-purple-200',
};

// 카테고리 한글명
const CATEGORY_LABELS: Record<string, string> = {
  vitamin: '비타민',
  mineral: '미네랄',
  protein: '단백질',
  omega: '오메가',
  probiotic: '유산균',
  herbal: '허브',
  other: '기타',
};

export interface SupplementRecommendationCardProps {
  /** 영양 목표 */
  goal: NutritionGoal;
  /** 피부 고민 (S-1 연동) */
  skinConcerns?: SkinConcern[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 펼침 상태 초기값 */
  defaultExpanded?: boolean;
}

/**
 * 영양제 아이템 컴포넌트
 */
function SupplementItem({
  supplement,
  isExpanded,
}: {
  supplement: SupplementRecommendation;
  isExpanded: boolean;
}) {
  const links = generateShoppingLinks(supplement.name);
  const brands = POPULAR_BRANDS[supplement.category] || POPULAR_BRANDS.other;
  const categoryColor = CATEGORY_COLORS[supplement.category] || CATEGORY_COLORS.other;

  const priorityColors = {
    high: 'border-l-red-400',
    medium: 'border-l-amber-400',
    low: 'border-l-green-400',
  };

  return (
    <div
      className={cn(
        'bg-card rounded-xl p-3 border-l-4 transition-all',
        priorityColors[supplement.priority]
      )}
      data-testid={`supplement-item-${supplement.name}`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-foreground">{supplement.name}</h4>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border', categoryColor)}>
              {CATEGORY_LABELS[supplement.category]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{supplement.reason}</p>
        </div>
      </div>

      {/* 복용 시기 */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
        <span>⏰</span>
        <span>{supplement.timing}</span>
      </div>

      {/* 주의사항 */}
      {supplement.caution && (
        <div className="flex items-start gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-2">
          <span>⚠️</span>
          <span>{supplement.caution}</span>
        </div>
      )}

      {isExpanded && (
        <>
          {/* 추천 브랜드 */}
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              추천 브랜드 (구하기 쉬움)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((brand) => (
                <span
                  key={brand.name}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-full"
                >
                  <Star className="w-3 h-3 text-amber-500" />
                  {brand.name}
                  <span className="text-muted-foreground">({brand.badge})</span>
                </span>
              ))}
            </div>
          </div>

          {/* 쇼핑 링크 */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={links.coupang}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--affiliate-coupang)' }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-coupang-hover)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-coupang)')
              }
              data-testid="coupang-link"
            >
              쿠팡
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={links.oliveyoung}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--affiliate-oliveyoung)' }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-oliveyoung-hover)')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-oliveyoung)')
              }
              data-testid="oliveyoung-link"
            >
              올리브영
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={links.iherb}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--affiliate-iherb)' }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--affiliate-iherb-hover)')
              }
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--affiliate-iherb)')}
              data-testid="iherb-link"
            >
              iHerb
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton() {
  return (
    <div
      className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-violet-100"
      data-testid="supplement-card-loading"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-violet-200 animate-pulse" />
        <div className="w-32 h-5 bg-violet-200 animate-pulse rounded" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-20 bg-violet-100 animate-pulse rounded-xl" />
        <div className="w-full h-20 bg-violet-100 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}

/**
 * SupplementRecommendationCard 메인 컴포넌트
 */
export default function SupplementRecommendationCard({
  goal,
  skinConcerns = [],
  isLoading = false,
  defaultExpanded = false,
}: SupplementRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // 영양제 추천 계산
  const result = useMemo(
    () => getSupplementRecommendations(goal, skinConcerns),
    [goal, skinConcerns]
  );

  // 상위 3개만 표시 (접힌 상태), 전체 표시 (펼친 상태)
  const displayedSupplements = isExpanded ? result.allSupplements : getTopSupplements(result, 3);

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 추천 없음
  if (result.allSupplements.length === 0) {
    return (
      <div
        className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-violet-100"
        data-testid="supplement-card-empty"
      >
        <div className="flex items-center gap-2 mb-3">
          <Pill className="w-5 h-5 text-violet-500" />
          <h3 className="text-sm font-semibold text-foreground">영양제 추천</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          현재 목표에 맞는 영양제 추천이 없어요.
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-violet-100"
      data-testid="supplement-recommendation-card"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-violet-500" />
          <h3 className="text-sm font-semibold text-foreground">영양제 추천</h3>
        </div>
        {result.allSupplements.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? '접기' : '더보기'}
          >
            {isExpanded ? (
              <>
                접기 <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                더보기 ({result.allSupplements.length - 3}개) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* 요약 메시지 */}
      <p className="text-xs text-muted-foreground mb-3">{result.summary}</p>

      {/* 영양제 목록 */}
      <div className="space-y-2">
        {displayedSupplements.map((supplement) => (
          <SupplementItem key={supplement.name} supplement={supplement} isExpanded={isExpanded} />
        ))}
      </div>

      {/* 안내 메시지 */}
      <div className="mt-3 text-center text-xs text-muted-foreground">
        💡 개인 건강 상태에 따라 복용 전 전문가 상담을 권장해요
      </div>
    </div>
  );
}
