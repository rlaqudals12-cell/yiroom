/**
 * SkinVitalityScore 컴포넌트
 * 종합 바이탈리티 점수 원형 게이지 + 등급 배지
 *
 * @description Visual Report P1 (VR-2)
 * @see SDD-VISUAL-SKIN-REPORT.md
 */
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/** 등급 타입 */
export type VitalityGrade = 'S' | 'A' | 'B' | 'C' | 'D';

/** Props 타입 */
export interface SkinVitalityScoreProps {
  /** 종합 점수 (0-100) */
  score: number;
  /** 이전 점수 (변화량 표시용) */
  previousScore?: number;
  /** 점수 구성 요소 */
  breakdown?: {
    hydration: number;
    elasticity: number;
    clarity: number;
    tone: number;
  };
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
}

/** 점수 → 등급 변환 */
function getGrade(score: number): VitalityGrade {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

/** 등급별 색상 */
const GRADE_COLORS: Record<VitalityGrade, { bg: string; text: string; ring: string }> = {
  S: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'stroke-purple-500' },
  A: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'stroke-emerald-500' },
  B: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'stroke-blue-500' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-700', ring: 'stroke-yellow-500' },
  D: { bg: 'bg-red-100', text: 'text-red-700', ring: 'stroke-red-500' },
};

/** 등급별 레이블 */
const GRADE_LABELS: Record<VitalityGrade, string> = {
  S: '최상',
  A: '우수',
  B: '양호',
  C: '보통',
  D: '관리 필요',
};

/** 크기별 설정 */
const SIZE_CONFIG = {
  sm: { wrapper: 'w-24 h-24', text: 'text-xl', subtext: 'text-xs', badge: 'text-xs px-1.5' },
  md: { wrapper: 'w-36 h-36', text: 'text-3xl', subtext: 'text-sm', badge: 'text-sm px-2' },
  lg: { wrapper: 'w-48 h-48', text: 'text-4xl', subtext: 'text-base', badge: 'text-base px-3' },
};

export function SkinVitalityScore({
  score,
  previousScore,
  breakdown,
  size = 'md',
  className,
}: SkinVitalityScoreProps) {
  const grade = useMemo(() => getGrade(score), [score]);
  const colors = GRADE_COLORS[grade];
  const sizeConfig = SIZE_CONFIG[size];

  // 점수 변화량
  const scoreChange = previousScore !== undefined ? score - previousScore : null;

  // SVG 원형 게이지 계산
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      data-testid="skin-vitality-score"
    >
      {/* 원형 게이지 */}
      <div className={cn('relative', sizeConfig.wrapper)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* 배경 원 */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="fill-none stroke-gray-200"
            strokeWidth="8"
          />
          {/* 진행 원 */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={cn('fill-none transition-all duration-1000', colors.ring)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* 중앙 점수 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', sizeConfig.text, colors.text)}>
            {score}
          </span>
          <span className={cn('text-gray-500', sizeConfig.subtext)}>점</span>
        </div>
      </div>

      {/* 등급 배지 */}
      <div
        className={cn(
          'mt-3 py-1 rounded-full font-medium',
          sizeConfig.badge,
          colors.bg,
          colors.text
        )}
      >
        {grade}등급 - {GRADE_LABELS[grade]}
      </div>

      {/* 점수 변화량 */}
      {scoreChange !== null && (
        <div className={cn('mt-2', sizeConfig.subtext)}>
          {scoreChange > 0 ? (
            <span className="text-emerald-600">
              +{scoreChange}점 상승
            </span>
          ) : scoreChange < 0 ? (
            <span className="text-red-600">
              {scoreChange}점 하락
            </span>
          ) : (
            <span className="text-gray-500">변화 없음</span>
          )}
        </div>
      )}

      {/* 점수 구성 요소 */}
      {breakdown && size !== 'sm' && (
        <div className="mt-4 w-full max-w-xs space-y-2">
          <BreakdownBar label="수분" value={breakdown.hydration} />
          <BreakdownBar label="탄력" value={breakdown.elasticity} />
          <BreakdownBar label="투명도" value={breakdown.clarity} />
          <BreakdownBar label="톤균일" value={breakdown.tone} />
        </div>
      )}
    </div>
  );
}

/** 점수 구성 요소 바 */
function BreakdownBar({ label, value }: { label: string; value: number }) {
  const barColor = useMemo(() => {
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-sm text-gray-600">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-sm text-gray-700 text-right">{value}</span>
    </div>
  );
}

export default SkinVitalityScore;
