/**
 * N-1 영양소 바 차트 컴포넌트 (Task 3.4)
 *
 * 탄수화물, 단백질, 지방 등 영양소별 섭취량을 바 차트로 시각화
 * - 목표 대비 섭취 비율 표시
 * - 색상으로 상태 표시 (정상/주의/초과)
 * - 재사용 가능한 독립 컴포넌트
 * - 80-100% 주의 구간 선택적 표시 (showWarningThreshold)
 */

'use client';

import { useMemo } from 'react';

// 색상 타입
export type NutrientColor =
  | 'amber'
  | 'blue'
  | 'rose'
  | 'green'
  | 'purple'
  | 'cyan';

// 영양소 데이터 타입
export interface NutrientData {
  /** 영양소 이름 */
  name: string;
  /** 현재 섭취량 */
  current: number;
  /** 목표 섭취량 */
  target: number;
  /** 단위 (g, mg 등) */
  unit: string;
  /** 바 색상 */
  color: NutrientColor;
}

export interface NutrientBarChartProps {
  /** 영양소 데이터 배열 */
  data: NutrientData[];
  /** 제목 (선택) */
  title?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 테스트 ID */
  testId?: string;
  /** 80-100% 주의 구간 표시 여부 (기본값: false) */
  showWarningThreshold?: boolean;
}

// 색상 맵
const COLOR_MAP: Record<NutrientColor, { bg: string; fill: string }> = {
  amber: { bg: 'bg-amber-100', fill: 'bg-amber-500' },
  blue: { bg: 'bg-blue-100', fill: 'bg-blue-500' },
  rose: { bg: 'bg-rose-100', fill: 'bg-rose-500' },
  green: { bg: 'bg-green-100', fill: 'bg-green-500' },
  purple: { bg: 'bg-purple-100', fill: 'bg-purple-500' },
  cyan: { bg: 'bg-cyan-100', fill: 'bg-cyan-500' },
};

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton({ testId }: { testId: string }) {
  return (
    <div
      data-testid={`${testId}-loading`}
      className="space-y-4"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="w-16 h-4 bg-gray-200 animate-pulse rounded" />
            <div className="w-20 h-4 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="w-full h-3 bg-gray-200 animate-pulse rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * NutrientBarChart 컴포넌트
 *
 * 여러 영양소의 섭취량을 바 차트로 시각화합니다.
 */
export default function NutrientBarChart({
  data,
  title,
  isLoading = false,
  testId = 'nutrient-bar-chart',
  showWarningThreshold = false,
}: NutrientBarChartProps) {
  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton testId={testId} />;
  }

  // 빈 데이터
  if (data.length === 0) {
    return (
      <div
        data-testid={testId}
        className="text-center text-gray-500 py-4"
      >
        영양소 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div data-testid={testId} className="space-y-4">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      )}
      <div className="space-y-3">
        {data.map((nutrient, index) => (
          <NutrientBar
            key={`${nutrient.name}-${index}`}
            {...nutrient}
            showWarningThreshold={showWarningThreshold}
          />
        ))}
      </div>
    </div>
  );
}

// NutrientBar props 타입
interface NutrientBarProps extends NutrientData {
  /** 80-100% 주의 구간 표시 여부 */
  showWarningThreshold?: boolean;
}

/**
 * NutrientBar 컴포넌트
 *
 * 단일 영양소의 진행률 바를 표시합니다.
 * - 80% 미만: 정상 색상
 * - 80-100%: 주의 색상 (showWarningThreshold가 true일 때)
 * - 100% 이상: 초과 색상 (빨간색)
 */
export function NutrientBar({
  name,
  current,
  target,
  unit,
  color,
  showWarningThreshold = false,
}: NutrientBarProps) {
  // 퍼센트 계산
  const percentage = useMemo(() => {
    if (!target || target === 0) return 0;
    return Math.round((current / target) * 100);
  }, [current, target]);

  // 시각적 퍼센트 (100%로 제한)
  const visualPercentage = Math.min(100, Math.max(0, percentage));

  // 상태 판단
  const isExceeded = percentage >= 100;
  const isWarning = showWarningThreshold && percentage >= 80 && percentage < 100;

  // 색상 결정
  const colors = COLOR_MAP[color];
  const fillColor = useMemo(() => {
    if (isExceeded) return 'bg-red-500';
    if (isWarning) return 'bg-amber-500';
    return colors.fill;
  }, [isExceeded, isWarning, colors.fill]);

  // 텍스트 색상 결정
  const textColor = useMemo(() => {
    if (isExceeded) return 'text-red-500';
    if (isWarning) return 'text-amber-500';
    return 'text-gray-500';
  }, [isExceeded, isWarning]);

  // 값 포맷팅
  const formatValue = (value: number) => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(1);
  };

  return (
    <div className="space-y-1">
      {/* 레이블 행 */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-900">
            {formatValue(current)}
            <span className="text-gray-500">
              {' '}
              / {formatValue(target)}
              {unit}
            </span>
          </span>
          <span className={`text-xs font-medium ${textColor}`}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name} 섭취 진행률 ${percentage}%`}
        className={`w-full h-2 rounded-full overflow-hidden ${colors.bg}`}
      >
        <div
          data-progress-fill
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillColor}`}
          style={{ width: `${visualPercentage}%` }}
        />
      </div>
    </div>
  );
}
