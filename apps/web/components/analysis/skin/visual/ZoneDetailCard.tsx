/**
 * ZoneDetailCard 컴포넌트
 * 존 클릭 시 표시되는 상세 정보 패널
 *
 * @description Visual Report P1 (VR-3)
 * @see SDD-VISUAL-SKIN-REPORT.md
 */
'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SkinZone } from './FaceZoneMap';

/** 존 상세 데이터 */
export interface ZoneDetail {
  zone: SkinZone;
  score: number;
  previousScore?: number;
  metrics: {
    hydration: number;
    oiliness: number;
    pores: number;
    texture: number;
  };
  concerns: string[];
  recommendations: string[];
}

/** Props 타입 */
export interface ZoneDetailCardProps {
  /** 존 상세 데이터 */
  detail: ZoneDetail;
  /** 닫기 핸들러 */
  onClose?: () => void;
  /** 추천 제품 보기 핸들러 */
  onViewProducts?: (zone: SkinZone, concerns: string[]) => void;
  /** 추가 클래스 */
  className?: string;
}

/** 존 라벨 */
const ZONE_LABELS: Record<SkinZone, string> = {
  forehead: '이마',
  nose: '코',
  't-zone': 'T존',
  'left-cheek': '왼쪽 볼',
  'right-cheek': '오른쪽 볼',
  chin: '턱',
  'eye-area': '눈가',
  'lip-area': '입술 주변',
};

/** 점수에 따른 상태 텍스트 */
function getScoreStatus(score: number): { text: string; color: string } {
  if (score >= 80) return { text: '매우 좋음', color: 'text-emerald-600' };
  if (score >= 60) return { text: '양호', color: 'text-blue-600' };
  if (score >= 40) return { text: '보통', color: 'text-yellow-600' };
  return { text: '관리 필요', color: 'text-red-600' };
}

/** 메트릭 라벨 */
const METRIC_LABELS: Record<keyof ZoneDetail['metrics'], string> = {
  hydration: '수분',
  oiliness: '유분',
  pores: '모공',
  texture: '결',
};

export function ZoneDetailCard({
  detail,
  onClose,
  onViewProducts,
  className,
}: ZoneDetailCardProps) {
  const status = useMemo(() => getScoreStatus(detail.score), [detail.score]);

  // 점수 변화량
  const scoreChange =
    detail.previousScore !== undefined ? detail.score - detail.previousScore : null;

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-lg border border-gray-200 p-4',
        className
      )}
      data-testid="zone-detail-card"
      role="dialog"
      aria-labelledby="zone-detail-title"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 id="zone-detail-title" className="text-lg font-bold text-gray-900">
            {ZONE_LABELS[detail.zone]}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900">
              {detail.score}점
            </span>
            <span className={cn('text-sm font-medium', status.color)}>
              {status.text}
            </span>
          </div>
          {scoreChange !== null && (
            <p className="text-xs text-gray-500 mt-0.5">
              {scoreChange > 0 ? (
                <span className="text-emerald-600">+{scoreChange}점 상승</span>
              ) : scoreChange < 0 ? (
                <span className="text-red-600">{scoreChange}점 하락</span>
              ) : (
                '이전과 동일'
              )}
            </p>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="닫기"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 메트릭 바 */}
      <div className="space-y-2 mb-4">
        {Object.entries(detail.metrics).map(([key, value]) => (
          <MetricBar
            key={key}
            label={METRIC_LABELS[key as keyof ZoneDetail['metrics']]}
            value={value}
          />
        ))}
      </div>

      {/* 주요 고민 */}
      {detail.concerns.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">주요 고민</h4>
          <div className="flex flex-wrap gap-1.5">
            {detail.concerns.map((concern, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full"
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 추천 케어 */}
      {detail.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">추천 케어</h4>
          <ul className="space-y-1">
            {detail.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 추천 제품 보기 버튼 */}
      {onViewProducts && detail.concerns.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewProducts(detail.zone, detail.concerns)}
        >
          이 부위 맞춤 제품 보기
        </Button>
      )}
    </div>
  );
}

/** 메트릭 바 컴포넌트 */
function MetricBar({ label, value }: { label: string; value: number }) {
  const barColor = useMemo(() => {
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 60) return 'bg-blue-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-xs text-gray-600">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-6 text-xs text-gray-700 text-right">{value}</span>
    </div>
  );
}

export default ZoneDetailCard;
