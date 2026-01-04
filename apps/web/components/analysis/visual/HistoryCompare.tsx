'use client';

import { useState, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

// ============================================
// 타입 정의
// ============================================

/** 분석 기록 항목 */
export interface AnalysisHistoryItem {
  id: string;
  date: string; // ISO 8601
  imageUrl?: string;
  scores: {
    /** 전체 점수 (0-100) */
    overall: number;
    /** 수분 (0-100) */
    hydration?: number;
    /** 탄력 (0-100) */
    elasticity?: number;
    /** 균일도 (0-100) */
    uniformity?: number;
    /** 트러블 (0-100, 낮을수록 좋음) */
    trouble?: number;
    /** 모공 (0-100, 낮을수록 좋음) */
    pore?: number;
  };
  /** 추가 메타데이터 */
  metadata?: {
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
    skinType?: string;
  };
}

/** 비교 결과 */
interface ComparisonResult {
  metric: string;
  label: string;
  before: number;
  after: number;
  diff: number;
  trend: 'up' | 'down' | 'neutral';
  isPositive: boolean; // true면 증가가 좋음, false면 감소가 좋음
}

interface HistoryCompareProps {
  /** 분석 기록 목록 (날짜순 정렬 권장) */
  history: AnalysisHistoryItem[];
  /** 추가 클래스 */
  className?: string;
  /** 이미지 클릭 핸들러 */
  onImageClick?: (item: AnalysisHistoryItem) => void;
}

// ============================================
// 상수
// ============================================

const METRIC_CONFIG: Record<
  string,
  {
    label: string;
    positiveIsGood: boolean; // true면 점수 증가가 좋음
    unit: string;
  }
> = {
  overall: { label: '종합 점수', positiveIsGood: true, unit: '점' },
  hydration: { label: '수분', positiveIsGood: true, unit: '%' },
  elasticity: { label: '탄력', positiveIsGood: true, unit: '%' },
  uniformity: { label: '균일도', positiveIsGood: true, unit: '%' },
  trouble: { label: '트러블', positiveIsGood: false, unit: '점' },
  pore: { label: '모공', positiveIsGood: false, unit: '점' },
};

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 시계열 분석 비교 컴포넌트
 * - 분석 기록을 시간순으로 비교
 * - Before/After 슬라이더
 * - 트렌드 시각화
 */
export default function HistoryCompare({ history, className, onImageClick }: HistoryCompareProps) {
  // 비교할 두 기록 선택
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(history.length > 1 ? history.length - 1 : 0);

  // 정렬된 히스토리 (오래된 순)
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [history]
  );

  const beforeItem = sortedHistory[beforeIndex];
  const afterItem = sortedHistory[afterIndex];

  // 비교 결과 계산
  const comparisons = useMemo(() => {
    if (!beforeItem || !afterItem) return [];

    const results: ComparisonResult[] = [];

    Object.entries(METRIC_CONFIG).forEach(([key, config]) => {
      const beforeValue = beforeItem.scores[key as keyof typeof beforeItem.scores];
      const afterValue = afterItem.scores[key as keyof typeof afterItem.scores];

      if (beforeValue !== undefined && afterValue !== undefined) {
        const diff = afterValue - beforeValue;
        const trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'neutral';
        const isPositive = config.positiveIsGood ? diff > 0 : diff < 0;

        results.push({
          metric: key,
          label: config.label,
          before: beforeValue,
          after: afterValue,
          diff,
          trend,
          isPositive,
        });
      }
    });

    return results;
  }, [beforeItem, afterItem]);

  // 기간 차이
  const daysDiff = useMemo(() => {
    if (!beforeItem || !afterItem) return 0;
    return differenceInDays(new Date(afterItem.date), new Date(beforeItem.date));
  }, [beforeItem, afterItem]);

  // 히스토리가 없거나 1개면 비교 불가
  if (sortedHistory.length < 2) {
    return (
      <Card className={cn('overflow-hidden', className)} data-testid="history-compare">
        <CardHeader>
          <CardTitle className="text-base">피부 변화 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {sortedHistory.length === 0
                ? '분석 기록이 없습니다.'
                : '2회 이상 분석하면 변화를 비교할 수 있어요.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="history-compare">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>피부 변화 추이</span>
          <Badge variant="secondary" className="font-normal">
            {daysDiff}일간 변화
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 날짜 선택 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">이전</label>
            <Select value={String(beforeIndex)} onValueChange={(v) => setBeforeIndex(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedHistory.map((item, idx) => (
                  <SelectItem key={item.id} value={String(idx)} disabled={idx >= afterIndex}>
                    {format(new Date(item.date), 'yyyy.MM.dd', { locale: ko })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-shrink-0 pt-5">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">이후</label>
            <Select value={String(afterIndex)} onValueChange={(v) => setAfterIndex(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortedHistory.map((item, idx) => (
                  <SelectItem key={item.id} value={String(idx)} disabled={idx <= beforeIndex}>
                    {format(new Date(item.date), 'yyyy.MM.dd', { locale: ko })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 이미지 비교 (있는 경우) */}
        {beforeItem?.imageUrl && afterItem?.imageUrl && (
          <BeforeAfterSlider
            beforeImage={beforeItem.imageUrl}
            afterImage={afterItem.imageUrl}
            beforeDate={beforeItem.date}
            afterDate={afterItem.date}
            onBeforeClick={() => onImageClick?.(beforeItem)}
            onAfterClick={() => onImageClick?.(afterItem)}
          />
        )}

        {/* 수치 비교 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">지표별 변화</h4>
          <div className="space-y-2">
            {comparisons.map((comp) => (
              <ComparisonRow key={comp.metric} comparison={comp} />
            ))}
          </div>
        </div>

        {/* 종합 평가 */}
        <SummaryCard comparisons={comparisons} daysDiff={daysDiff} />
      </CardContent>
    </Card>
  );
}

// ============================================
// 서브 컴포넌트: Before/After 슬라이더
// ============================================

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeDate: string;
  afterDate: string;
  onBeforeClick?: () => void;
  onAfterClick?: () => void;
}

function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeDate,
  afterDate,
  onBeforeClick,
  onAfterClick,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative rounded-lg overflow-hidden aspect-square bg-muted">
      {/* Before 이미지 */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onBeforeClick}
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
        }}
      >
        <img src={beforeImage} alt="이전" className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs">
            {format(new Date(beforeDate), 'M.d', { locale: ko })}
          </Badge>
        </div>
      </div>

      {/* After 이미지 */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onAfterClick}
        style={{
          clipPath: `inset(0 0 0 ${sliderPosition}%)`,
        }}
      >
        <img src={afterImage} alt="이후" className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="text-xs">
            {format(new Date(afterDate), 'M.d', { locale: ko })}
          </Badge>
        </div>
      </div>

      {/* 슬라이더 핸들 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <ChevronLeft className="w-3 h-3" />
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* 슬라이더 인터랙션 영역 */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        aria-label="Before/After 슬라이더"
      />
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 비교 행
// ============================================

interface ComparisonRowProps {
  comparison: ComparisonResult;
}

function ComparisonRow({ comparison }: ComparisonRowProps) {
  const { label, before, after, diff, trend, isPositive } = comparison;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const trendColor =
    trend === 'neutral'
      ? 'text-muted-foreground'
      : isPositive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums">{before}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium tabular-nums">{after}</span>
        <div className={cn('flex items-center gap-1 min-w-[60px]', trendColor)}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-xs tabular-nums">
            {diff > 0 ? '+' : ''}
            {diff.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 종합 평가 카드
// ============================================

interface SummaryCardProps {
  comparisons: ComparisonResult[];
  daysDiff: number;
}

function SummaryCard({ comparisons, daysDiff }: SummaryCardProps) {
  // 개선된 지표 수
  const improvedCount = comparisons.filter((c) => c.isPositive && c.trend !== 'neutral').length;
  const declinedCount = comparisons.filter((c) => !c.isPositive && c.trend !== 'neutral').length;
  const totalCount = comparisons.length;

  // 전체 점수 변화
  const overallComp = comparisons.find((c) => c.metric === 'overall');
  const overallDiff = overallComp?.diff ?? 0;

  // 평가 메시지
  let message: string;
  let messageType: 'positive' | 'neutral' | 'negative';

  if (improvedCount > declinedCount) {
    message =
      overallDiff >= 5
        ? '눈에 띄는 피부 개선이 있어요! 잘 하고 있어요.'
        : `${improvedCount}개 지표가 개선되었어요. 꾸준히 관리하고 있네요.`;
    messageType = 'positive';
  } else if (declinedCount > improvedCount) {
    message = `${declinedCount}개 지표가 하락했어요. 생활 습관을 점검해보세요.`;
    messageType = 'negative';
  } else {
    message = '피부 상태가 안정적으로 유지되고 있어요.';
    messageType = 'neutral';
  }

  return (
    <div
      className={cn('p-4 rounded-lg', {
        'bg-emerald-50 dark:bg-emerald-950/30': messageType === 'positive',
        'bg-muted': messageType === 'neutral',
        'bg-red-50 dark:bg-red-950/30': messageType === 'negative',
      })}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', {
            'bg-emerald-100 dark:bg-emerald-900': messageType === 'positive',
            'bg-muted-foreground/20': messageType === 'neutral',
            'bg-red-100 dark:bg-red-900': messageType === 'negative',
          })}
        >
          {messageType === 'positive' ? (
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : messageType === 'negative' ? (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <Minus className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {daysDiff}일 동안 {improvedCount}개 개선, {declinedCount}개 하락,{' '}
            {totalCount - improvedCount - declinedCount}개 유지
          </p>
        </div>
      </div>
    </div>
  );
}

// Type exports are already done inline with interface definitions
