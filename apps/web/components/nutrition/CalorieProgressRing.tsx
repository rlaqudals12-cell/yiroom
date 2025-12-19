/**
 * N-1 칼로리 프로그레스 링 컴포넌트 (Task 3.3)
 *
 * 원형 진행률 차트로 칼로리 섭취량을 시각화
 * - 목표 대비 섭취 비율 표시
 * - 색상 자동 변경 (정상/주의/초과)
 * - 중앙 텍스트 영역 지원 (children)
 * - 재사용 가능한 독립 컴포넌트
 */

'use client';

import { useMemo, type ReactNode } from 'react';

export interface CalorieProgressRingProps {
  /** 현재 섭취 칼로리 */
  current: number;
  /** 목표 칼로리 */
  target: number;
  /** 링 크기 (px) */
  size?: number;
  /** 링 두께 (px) */
  strokeWidth?: number;
  /** 중앙 콘텐츠 (children) */
  children?: ReactNode;
  /** 접근성 레이블 */
  ariaLabel?: string;
  /** 색상 커스터마이징 */
  colors?: {
    normal?: string;
    warning?: string;
    exceeded?: string;
    background?: string;
  };
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 테스트 ID */
  testId?: string;
}

// 기본 색상
const DEFAULT_COLORS = {
  normal: '#22C55E', // green-500
  warning: '#F59E0B', // amber-500
  exceeded: '#EF4444', // red-500
  background: '#E5E7EB', // gray-200
};

/**
 * CalorieProgressRing 컴포넌트
 *
 * 원형 프로그레스 링으로 칼로리 진행률을 표시합니다.
 * - 80% 미만: 녹색 (정상)
 * - 80% ~ 100%: 노란색 (주의)
 * - 100% 초과: 빨간색 (초과)
 */
export default function CalorieProgressRing({
  current,
  target,
  size = 160,
  strokeWidth = 12,
  children,
  ariaLabel,
  colors = {},
  isLoading = false,
  testId = 'calorie-progress-ring',
}: CalorieProgressRingProps) {
  // 색상 병합 (useMemo로 메모이제이션)
  const mergedColors = useMemo(
    () => ({ ...DEFAULT_COLORS, ...colors }),
    [colors]
  );

  // 퍼센트 계산
  const percentage = useMemo(() => {
    if (!target || target === 0) return 0;
    return Math.round((current / target) * 100);
  }, [current, target]);

  // SVG 원 계산
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // 100%를 초과하지 않도록 제한 (시각적으로)
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset =
    circumference - (clampedPercentage / 100) * circumference;

  // 색상 결정
  const progressColor = useMemo(() => {
    if (percentage >= 100) return mergedColors.exceeded;
    if (percentage >= 80) return mergedColors.warning;
    return mergedColors.normal;
  }, [percentage, mergedColors]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        data-testid={`${testId}-loading`}
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full bg-muted animate-pulse"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* SVG 원형 프로그레스 */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || `칼로리 섭취 진행률 ${percentage}%`}
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={mergedColors.background}
          strokeWidth={strokeWidth}
        />
        {/* 진행률 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* 중앙 콘텐츠 영역 */}
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * 기본 중앙 콘텐츠 컴포넌트
 *
 * CalorieProgressRing과 함께 사용하는 기본 텍스트 표시
 */
export function CalorieProgressRingContent({
  current,
  target,
  unit = 'kcal',
}: {
  current: number;
  target: number;
  unit?: string;
}) {
  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

  return (
    <>
      <span
        className="text-3xl font-bold text-foreground"
        data-testid="progress-current"
      >
        {current.toLocaleString()}
      </span>
      <span className="text-sm text-muted-foreground">
        / {target.toLocaleString()} {unit}
      </span>
      <span
        className={`text-sm font-medium mt-1 ${
          percentage >= 100 ? 'text-red-500' : 'text-muted-foreground'
        }`}
        data-testid="progress-percentage"
      >
        ({percentage}%)
      </span>
    </>
  );
}
