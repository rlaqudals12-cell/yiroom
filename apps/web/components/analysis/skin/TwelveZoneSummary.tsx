/**
 * 12존 피부 분석 요약 컴포넌트
 *
 * @description S-2 12-Zone 분석 결과를 요약하여 표시
 * - 상위 3개 문제 존 하이라이트
 * - 존별 제품 추천 (최대 3존)
 * - 히트맵 색상 코딩
 *
 * @see docs/specs/SDD-SKIN-v2.md
 * @see lib/analysis/skin-v2/zone-heatmap-data.ts
 */
'use client';

import { useMemo } from 'react';
import { MapPin, ShoppingBag, AlertCircle, ChevronRight } from 'lucide-react';
import type { DetailedZoneId } from '@/types/skin-zones';
import { DETAILED_ZONE_LABELS } from '@/types/skin-zones';
import type { ZoneMetricsV2 } from '@/lib/analysis/skin-v2/types';
import {
  scoreToColor,
  getScoreStatus,
  type HeatmapStatus,
} from '@/lib/analysis/skin-v2/zone-heatmap-data';
import { generateZoneProductRecommendations } from '@/lib/analysis/skin-v2/zone-product-targeting';

// =============================================================================
// 타입
// =============================================================================

export interface TwelveZoneSummaryProps {
  /** 존별 종합 점수 (0-100) */
  zoneScores: Record<DetailedZoneId, number>;
  /** 존별 상세 메트릭 */
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>;
  /** 히트맵 상세 보기 클릭 핸들러 */
  onViewHeatmap?: () => void;
}

// =============================================================================
// 내부 헬퍼
// =============================================================================

// 상태별 배경색 (투명도 포함)
const STATUS_BG: Record<HeatmapStatus, string> = {
  critical: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  poor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
  fair: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  good: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  excellent: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
};

// 상태별 텍스트색
const STATUS_TEXT: Record<HeatmapStatus, string> = {
  critical: 'text-red-700 dark:text-red-300',
  poor: 'text-orange-700 dark:text-orange-300',
  fair: 'text-amber-700 dark:text-amber-300',
  good: 'text-emerald-700 dark:text-emerald-300',
  excellent: 'text-green-700 dark:text-green-300',
};

// 상태 한국어 라벨
const STATUS_LABEL: Record<HeatmapStatus, string> = {
  critical: '심각',
  poor: '주의',
  fair: '보통',
  good: '양호',
  excellent: '우수',
};

// =============================================================================
// 컴포넌트
// =============================================================================

/**
 * 12존 피부 분석 요약
 * 최악 존 3개를 하이라이트하고 존별 맞춤 제품을 추천
 */
export function TwelveZoneSummary({
  zoneScores,
  zoneMetrics,
  onViewHeatmap,
}: TwelveZoneSummaryProps): React.JSX.Element {
  // 점수 기준 정렬 (낮은 점수 = 문제 존)
  const sortedZones = useMemo(() => {
    return (Object.entries(zoneScores) as [DetailedZoneId, number][])
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3);
  }, [zoneScores]);

  // 존별 제품 추천
  const recommendations = useMemo(
    () => generateZoneProductRecommendations(zoneScores, zoneMetrics),
    [zoneScores, zoneMetrics]
  );

  // 상위 3개 추천만 표시
  const topRecommendations = recommendations.slice(0, 3);

  return (
    <section
      className="bg-card rounded-xl border p-6"
      data-testid="twelve-zone-summary"
      role="region"
      aria-label="12존 피부 분석 요약"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-foreground">존별 피부 상태</h2>
        </div>
        {onViewHeatmap && (
          <button
            onClick={onViewHeatmap}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            aria-label="히트맵 상세 보기"
          >
            히트맵 보기
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 최악 존 3개 하이라이트 */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {sortedZones.map(([zoneId, score], index) => {
          const status = getScoreStatus(score);
          const color = scoreToColor(score);

          return (
            <div
              key={zoneId}
              className={`rounded-lg border p-3 text-center ${STATUS_BG[status]}`}
              data-testid={`zone-highlight-${index}`}
            >
              {/* 색상 인디케이터 */}
              <div
                className="w-3 h-3 rounded-full mx-auto mb-2"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <p className="text-xs font-medium text-foreground truncate">
                {DETAILED_ZONE_LABELS[zoneId]}
              </p>
              <p className={`text-lg font-bold ${STATUS_TEXT[status]}`}>{score}</p>
              <p className={`text-[10px] ${STATUS_TEXT[status]}`}>{STATUS_LABEL[status]}</p>
            </div>
          );
        })}
      </div>

      {/* 존별 맞춤 추천 */}
      {topRecommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-foreground">존별 맞춤 추천</h3>
          </div>

          {topRecommendations.map((rec) => (
            <div
              key={rec.zoneId}
              className="rounded-lg border border-purple-100 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/20 p-3"
              data-testid={`zone-recommendation-${rec.zoneId}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{rec.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    {
                      high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                      medium:
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                      low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                    }[rec.priority]
                  }`}
                >
                  {{ high: '집중 관리', medium: '관리 필요', low: '유지' }[rec.priority]}
                </span>
              </div>

              {/* 관심사 태그 */}
              <div className="flex flex-wrap gap-1 mb-2">
                {rec.concerns.map((concern) => (
                  <span
                    key={concern}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {concern}
                  </span>
                ))}
              </div>

              {/* 추천 제품 */}
              <div className="space-y-1">
                {rec.products.slice(0, 2).map((product) => (
                  <div key={product.category} className="flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground/80">
                      <span className="font-medium">{product.category}</span>
                      {product.applicationTip && (
                        <span className="text-muted-foreground"> — {product.applicationTip}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
