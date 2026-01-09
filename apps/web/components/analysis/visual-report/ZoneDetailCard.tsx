'use client';

import { X, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MetricStatus } from '@/lib/mock/skin-analysis';

// ZoneDetailCard Props
export interface ZoneDetailCardProps {
  zoneId: string;
  zoneName: string;
  score: number;
  status: MetricStatus;
  concerns: string[]; // ["모공 확대", "유분 과다"]
  recommendations: string[]; // ["클레이 마스크", "BHA 토너"]
  onClose?: () => void;
  className?: string;
}

// 상태별 스타일
const STATUS_STYLES: Record<
  MetricStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  good: {
    label: '좋음',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    icon: '✓',
  },
  normal: {
    label: '보통',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    icon: '○',
  },
  warning: {
    label: '주의 필요',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
    icon: '!',
  },
};

/**
 * 존 상세 카드 컴포넌트
 * FaceZoneMap에서 존 클릭 시 Progressive Disclosure로 표시
 *
 * @example
 * ```tsx
 * <ZoneDetailCard
 *   zoneId="tZone"
 *   zoneName="T존"
 *   score={62}
 *   status="normal"
 *   concerns={['모공이 눈에 띄어요', '유분이 많은 편이에요']}
 *   recommendations={['주 2회 클레이 마스크', 'BHA 성분 토너 사용']}
 *   onClose={() => setSelectedZone(null)}
 * />
 * ```
 */
export function ZoneDetailCard({
  zoneId,
  zoneName,
  score,
  status,
  concerns,
  recommendations,
  onClose,
  className,
}: ZoneDetailCardProps) {
  const statusStyle = STATUS_STYLES[status];
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <Card
      className={cn('border shadow-lg animate-in slide-in-from-bottom-2 duration-200', className)}
      data-testid="zone-detail-card"
      data-zone-id={zoneId}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">{zoneName} 상태</CardTitle>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 점수 및 상태 */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{clampedScore}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              statusStyle.bg,
              statusStyle.color
            )}
          >
            {statusStyle.icon} {statusStyle.label}
          </span>
        </div>

        {/* 발견된 문제 */}
        {concerns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              발견된 문제
            </div>
            <ul className="space-y-1 pl-6">
              {concerns.map((concern, index) => (
                <li key={index} className="text-sm text-muted-foreground list-disc">
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 추천 관리 */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="w-4 h-4 text-emerald-500" />
              추천 관리
            </div>
            <ul className="space-y-1 pl-6">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground list-disc">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 문제 없을 때 */}
        {concerns.length === 0 && recommendations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            현재 상태가 양호해요! 지금처럼 유지해주세요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default ZoneDetailCard;
