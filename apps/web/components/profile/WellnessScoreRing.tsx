'use client';

/**
 * 웰니스 스코어 링 차트 컴포넌트
 * K-5 프로필 리디자인 - 미니멀 데이터 시각화 트렌드 적용
 */

import { useMemo } from 'react';

interface WellnessScoreRingProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

// 크기별 설정
const SIZE_CONFIG = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
  md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
  lg: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' },
} as const;

// 점수별 색상 그라데이션
function getScoreColor(score: number): { from: string; to: string; text: string } {
  if (score >= 80) {
    return {
      from: '#10B981', // emerald-500
      to: '#059669', // emerald-600
      text: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (score >= 60) {
    return {
      from: '#3B82F6', // blue-500
      to: '#2563EB', // blue-600
      text: 'text-blue-600 dark:text-blue-400',
    };
  }
  if (score >= 40) {
    return {
      from: '#F59E0B', // amber-500
      to: '#D97706', // amber-600
      text: 'text-amber-600 dark:text-amber-400',
    };
  }
  return {
    from: '#EF4444', // red-500
    to: '#DC2626', // red-600
    text: 'text-red-600 dark:text-red-400',
  };
}

// 점수 등급 라벨
function getScoreLabel(score: number): string {
  if (score >= 90) return '최상';
  if (score >= 80) return '우수';
  if (score >= 70) return '양호';
  if (score >= 60) return '보통';
  if (score >= 40) return '주의';
  return '관심 필요';
}

export function WellnessScoreRing({
  score,
  size = 'md',
  showLabel = true,
  animated = true,
}: WellnessScoreRingProps) {
  const config = SIZE_CONFIG[size];
  const colors = getScoreColor(score);
  const label = getScoreLabel(score);

  // SVG 계산
  const center = config.width / 2;
  const radius = center - config.strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // 고유 ID 생성 (SSR 호환)
  const gradientId = useMemo(
    () => `wellness-gradient-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  return (
    <div className="flex flex-col items-center gap-2" data-testid="wellness-score-ring">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          width={config.width}
          height={config.width}
          className={animated ? 'transition-all duration-1000 ease-out' : ''}
        >
          {/* 그라데이션 정의 */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
          </defs>

          {/* 배경 원 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted/20"
          />

          {/* 점수 원 */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            className={animated ? 'transition-all duration-1000 ease-out' : ''}
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${config.fontSize} ${colors.text}`}>{score}</span>
          {size !== 'sm' && <span className="text-muted-foreground text-xs">/ 100</span>}
        </div>
      </div>

      {/* 라벨 */}
      {showLabel && (
        <div className="text-center">
          <span className={`text-sm font-medium ${colors.text}`}>{label}</span>
        </div>
      )}
    </div>
  );
}

// 미니 버전 (프로필 카드용)
interface WellnessScoreMiniProps {
  score: number;
}

export function WellnessScoreMini({ score }: WellnessScoreMiniProps) {
  const colors = getScoreColor(score);

  return (
    <div className="flex items-center gap-2" data-testid="wellness-score-mini">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${
          score >= 80
            ? 'from-emerald-400 to-emerald-600'
            : score >= 60
              ? 'from-blue-400 to-blue-600'
              : score >= 40
                ? 'from-amber-400 to-amber-600'
                : 'from-red-400 to-red-600'
        }`}
      >
        <span className="text-xs font-bold text-white">{score}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium">웰니스</span>
        <span className={`text-xs ${colors.text}`}>{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}
