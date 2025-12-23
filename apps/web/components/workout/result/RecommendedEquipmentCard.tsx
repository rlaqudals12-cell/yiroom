'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dumbbell, ChevronDown, ChevronUp, Star, ExternalLink, Loader2 } from 'lucide-react';
import { getRecommendedEquipment } from '@/lib/products/repositories/equipment';
import type { WorkoutEquipment, TargetMuscle, SkillLevel, UseLocation } from '@/types/product';

interface RecommendedEquipmentCardProps {
  targetMuscles?: TargetMuscle[];
  skillLevel?: SkillLevel;
  useLocation?: UseLocation;
}

// 가격대 표시
function formatPrice(price?: number): string {
  if (!price) return '가격 미정';
  return `${price.toLocaleString('ko-KR')}원`;
}

// 장비 카드 컴포넌트
function EquipmentItem({ equipment }: { equipment: WorkoutEquipment }) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50 hover:border-indigo-200 transition-colors"
      data-testid="equipment-item"
    >
      {/* 이미지 또는 기본 아이콘 */}
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
        {equipment.imageUrl ? (
          <Image
            src={equipment.imageUrl}
            alt={equipment.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <Dumbbell className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground text-sm line-clamp-1">{equipment.name}</p>
            <p className="text-xs text-muted-foreground">{equipment.brand}</p>
          </div>
          {equipment.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground">{equipment.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-600">
            {formatPrice(equipment.priceKrw)}
          </span>
          <Link
            href={`/products/equipment/${equipment.id}`}
            className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
          >
            상세보기
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* 특징 태그 */}
        {equipment.targetMuscles && equipment.targetMuscles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {equipment.targetMuscles.slice(0, 3).map((muscle, index) => (
              <span
                key={index}
                className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 운동 기구 추천 카드
 * W-1 결과 페이지에서 운동 타입에 맞는 기구 추천
 */
export default function RecommendedEquipmentCard({
  targetMuscles,
  skillLevel,
  useLocation,
}: RecommendedEquipmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [equipment, setEquipment] = useState<WorkoutEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEquipment() {
      setIsLoading(true);
      try {
        const data = await getRecommendedEquipment(
          targetMuscles,
          undefined,
          skillLevel,
          useLocation
        );
        setEquipment(data.slice(0, 5)); // 상위 5개만
      } catch (error) {
        console.error('운동 기구 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEquipment();
  }, [targetMuscles, skillLevel, useLocation]);

  // 로딩 중이거나 장비가 없으면 렌더링 안함
  if (!isLoading && equipment.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="recommended-equipment-card"
      className="bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 rounded-2xl border border-indigo-100 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">추천 운동 기구</h3>
              <p className="text-sm text-indigo-600">
                {isLoading ? '불러오는 중...' : `${equipment.length}개 추천`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-indigo-600"
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
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <>
              {equipment.map((item) => (
                <EquipmentItem key={item.id} equipment={item} />
              ))}

              {/* 더보기 링크 */}
              <div className="text-center pt-2">
                <Link
                  href="/products?type=equipment"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  모든 운동 기구 보기
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
