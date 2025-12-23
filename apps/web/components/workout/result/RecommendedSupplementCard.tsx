'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pill, ChevronDown, ChevronUp, Star, ExternalLink, Loader2 } from 'lucide-react';
import { getRecommendedSupplements } from '@/lib/products/repositories/supplement';
import type { SupplementProduct, SupplementBenefit } from '@/types/product';

// 운동 목표 → 영양제 효능 매핑
const GOAL_TO_BENEFITS: Record<string, SupplementBenefit[]> = {
  muscle_gain: ['muscle', 'energy'],
  weight_loss: ['digestion', 'energy'],
  endurance: ['energy', 'immunity'],
  flexibility: ['bone', 'muscle'],
  health: ['immunity', 'skin', 'digestion'],
};

interface RecommendedSupplementCardProps {
  workoutGoals?: string[];
  concerns?: string[];
}

// 가격 표시
function formatPrice(price?: number): string {
  if (!price) return '가격 미정';
  return `${price.toLocaleString('ko-KR')}원`;
}

// 영양제 아이템 컴포넌트
function SupplementItem({ supplement }: { supplement: SupplementProduct }) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50 hover:border-green-200 transition-colors"
      data-testid="supplement-item"
    >
      {/* 이미지 또는 기본 아이콘 */}
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
        {supplement.imageUrl ? (
          <Image
            src={supplement.imageUrl}
            alt={supplement.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <Pill className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground text-sm line-clamp-1">{supplement.name}</p>
            <p className="text-xs text-muted-foreground">{supplement.brand}</p>
          </div>
          {supplement.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground">{supplement.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-green-600">
            {formatPrice(supplement.priceKrw)}
          </span>
          <Link
            href={`/products/supplement/${supplement.id}`}
            className="text-xs text-green-500 hover:text-green-600 flex items-center gap-1"
          >
            상세보기
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* 효능 태그 */}
        {supplement.benefits && supplement.benefits.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {supplement.benefits.slice(0, 3).map((benefit, index) => (
              <span
                key={index}
                className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded"
              >
                {benefit}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 영양제 추천 카드
 * W-1 결과 페이지에서 운동 목표에 맞는 영양제 추천
 */
export default function RecommendedSupplementCard({
  workoutGoals,
  concerns,
}: RecommendedSupplementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [supplements, setSupplements] = useState<SupplementProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSupplements() {
      setIsLoading(true);
      try {
        // 운동 목표에서 영양제 효능 추출
        const benefits: SupplementBenefit[] = [];
        if (workoutGoals && workoutGoals.length > 0) {
          workoutGoals.forEach((goal) => {
            const mappedBenefits = GOAL_TO_BENEFITS[goal];
            if (mappedBenefits) {
              benefits.push(...mappedBenefits);
            }
          });
        }

        const uniqueBenefits = [...new Set(benefits)];

        const data = await getRecommendedSupplements(
          concerns,
          uniqueBenefits.length > 0 ? uniqueBenefits : undefined
        );
        setSupplements(data.slice(0, 5)); // 상위 5개만
      } catch (error) {
        console.error('영양제 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSupplements();
  }, [workoutGoals, concerns]);

  // 로딩 중이거나 제품이 없으면 렌더링 안함
  if (!isLoading && supplements.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="recommended-supplement-card"
      className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-green-100 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">추천 영양제</h3>
              <p className="text-sm text-green-600">
                {isLoading ? '불러오는 중...' : `운동 효과를 높여줄 ${supplements.length}개`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-green-600"
            aria-label={isExpanded ? '접기' : '펼치기'}
            disabled={isLoading}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
            </div>
          ) : (
            <>
              {supplements.map((item) => (
                <SupplementItem key={item.id} supplement={item} />
              ))}

              {/* 더보기 링크 */}
              <div className="text-center pt-2">
                <Link
                  href="/products?type=supplement"
                  className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  모든 영양제 보기
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
