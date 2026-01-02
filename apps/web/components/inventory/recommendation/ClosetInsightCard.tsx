'use client';

/**
 * 옷장 인사이트 카드
 *
 * 퍼스널컬러/체형 기반 옷장 분석 요약
 */

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shirt,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Coins,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getRecommendationSummary } from '@/lib/inventory/client';
import type { InventoryItem, ClothingMetadata } from '@/types/inventory';
import type { PersonalColorSeason } from '@/lib/color-recommendations';

// 착용 통계 계산
interface WearStats {
  totalWearCount: number;
  avgCostPerWear: number | null;
  mostWornItem: InventoryItem | null;
  leastWornItem: InventoryItem | null;
  itemsWithPrice: number;
}

interface ClosetInsightCardProps {
  items: InventoryItem[];
  personalColor?: PersonalColorSeason | null;
  bodyType?: 'S' | 'W' | 'N' | null;
  className?: string;
}

export function ClosetInsightCard({
  items,
  personalColor,
  bodyType,
  className = '',
}: ClosetInsightCardProps) {
  const router = useRouter();

  const closetItems = useMemo(() => items.filter((item) => item.category === 'closet'), [items]);

  // 옷장 분석
  const summary = useMemo(() => {
    if (closetItems.length === 0) return null;

    return getRecommendationSummary(closetItems, {
      personalColor,
      bodyType,
    });
  }, [closetItems, personalColor, bodyType]);

  // 착용 통계 계산
  const wearStats = useMemo((): WearStats | null => {
    if (closetItems.length === 0) return null;

    const totalWearCount = closetItems.reduce((sum, item) => sum + item.useCount, 0);

    // 가격이 있는 아이템만 필터링
    const itemsWithPriceData = closetItems.filter((item) => {
      const meta = item.metadata as Partial<ClothingMetadata>;
      return meta?.price && meta.price > 0;
    });

    // 평균 Cost-per-wear 계산
    let avgCostPerWear: number | null = null;
    if (itemsWithPriceData.length > 0) {
      const totalCost = itemsWithPriceData.reduce((sum, item) => {
        const meta = item.metadata as Partial<ClothingMetadata>;
        return sum + (meta?.price || 0);
      }, 0);
      const totalWears = itemsWithPriceData.reduce((sum, item) => sum + item.useCount, 0);
      if (totalWears > 0) {
        avgCostPerWear = Math.round(totalCost / totalWears);
      }
    }

    // 가장 많이/적게 입은 아이템
    const sortedByWear = [...closetItems].sort((a, b) => b.useCount - a.useCount);
    const mostWornItem = sortedByWear[0]?.useCount > 0 ? sortedByWear[0] : null;
    const leastWornItem = sortedByWear.length > 1 ? sortedByWear[sortedByWear.length - 1] : null;

    return {
      totalWearCount,
      avgCostPerWear,
      mostWornItem,
      leastWornItem,
      itemsWithPrice: itemsWithPriceData.length,
    };
  }, [closetItems]);

  const closetCount = closetItems.length;

  if (!summary || closetCount === 0) {
    return (
      <div
        data-testid="closet-insight-card-empty"
        className={`bg-muted/50 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shirt className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">내 옷장 분석</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">옷장에 아이템을 추가하면 분석해드려요</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/closet/add')}>
          옷 추가하기
        </Button>
      </div>
    );
  }

  // 매칭 비율
  const matchRate = Math.round((summary.wellMatched / closetCount) * 100);

  // 상태 색상
  const getStatusColor = (rate: number) => {
    if (rate >= 70) return 'text-green-500';
    if (rate >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  // 상태 아이콘
  const StatusIcon = matchRate >= 70 ? CheckCircle2 : AlertCircle;

  return (
    <div data-testid="closet-insight-card" className={`bg-card rounded-xl border p-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">내 옷장 분석</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/closet')}>
          보기
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* 매칭 점수 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">퍼스널 매칭률</span>
          <span className={`font-semibold ${getStatusColor(matchRate)}`}>{matchRate}%</span>
        </div>
        <Progress value={matchRate} className="h-2" />
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{closetCount}</div>
          <div className="text-xs text-muted-foreground">전체 아이템</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{summary.wellMatched}</div>
          <div className="text-xs text-muted-foreground">잘 어울리는</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{summary.needsImprovement}</div>
          <div className="text-xs text-muted-foreground">개선 필요</div>
        </div>
      </div>

      {/* 착용 통계 */}
      {wearStats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {wearStats.totalWearCount > 0 && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div>
                <div className="text-sm font-semibold">{wearStats.totalWearCount}회</div>
                <div className="text-xs text-muted-foreground">총 착용</div>
              </div>
            </div>
          )}
          {wearStats.avgCostPerWear && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <Coins className="w-4 h-4 text-primary" />
              <div>
                <div className="text-sm font-semibold">
                  {wearStats.avgCostPerWear.toLocaleString()}원
                </div>
                <div className="text-xs text-muted-foreground">평균 1회 비용</div>
              </div>
            </div>
          )}
          {wearStats.mostWornItem && (
            <div className="col-span-2 flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">최애템</div>
                <div className="text-sm font-medium truncate">
                  {wearStats.mostWornItem.name} ({wearStats.mostWornItem.useCount}회)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 제안 */}
      {summary.suggestions.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <StatusIcon className={`w-4 h-4 mt-0.5 ${getStatusColor(matchRate)}`} />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">
                {matchRate >= 70 ? '잘하고 있어요!' : '개선 포인트'}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {summary.suggestions.slice(0, 2).map((suggestion, idx) => (
                  <li key={idx}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 분석 기준 표시 */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <TrendingUp className="w-3 h-3" />
        <span>
          {personalColor && `${personalColor} 컬러`}
          {personalColor && bodyType && ' + '}
          {bodyType &&
            `${bodyType === 'S' ? '스트레이트' : bodyType === 'W' ? '웨이브' : '내추럴'} 체형`}
          {!personalColor && !bodyType && '기본 분석'}
          {' 기준'}
        </span>
      </div>
    </div>
  );
}
