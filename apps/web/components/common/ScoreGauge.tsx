'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

// 도메인 variant 타입
export type ScoreGaugeVariant = 'beauty' | 'style' | 'default';

// 크기 타입
export type ScoreGaugeSize = 'sm' | 'md' | 'lg';

export interface ScoreGaugeProps {
  /** 현재 점수 */
  score: number;
  /** 최대 점수 */
  maxScore: number;
  /** 라벨 (점수 아래 표시) */
  label: string;
  /** 부제목 (라벨 아래 표시) */
  subtitle?: string;
  /** 도메인 variant */
  variant?: ScoreGaugeVariant;
  /** 크기 */
  size?: ScoreGaugeSize;
  /** 점수 접미사 (예: '점', '세') */
  suffix?: string;
  /** 비교 점수 표시 (예: 피부나이 vs 실제나이) */
  comparison?: {
    value: number;
    label: string;
  };
  /** 추가 className */
  className?: string;
}

// variant별 색상
const variantColors: Record<ScoreGaugeVariant, {
  primary: string;
  track: string;
  text: string;
  gradient: { start: string; end: string };
}> = {
  beauty: {
    primary: '#ec4899', // pink-500
    track: '#fce7f3', // pink-100
    text: 'text-pink-600 dark:text-pink-400',
    gradient: { start: '#f472b6', end: '#ec4899' },
  },
  style: {
    primary: '#6366f1', // indigo-500
    track: '#e0e7ff', // indigo-100
    text: 'text-indigo-600 dark:text-indigo-400',
    gradient: { start: '#818cf8', end: '#6366f1' },
  },
  default: {
    primary: 'hsl(var(--primary))',
    track: 'hsl(var(--muted))',
    text: 'text-primary',
    gradient: { start: 'hsl(var(--primary))', end: 'hsl(var(--primary))' },
  },
};

// 크기별 설정
const sizeConfig: Record<ScoreGaugeSize, {
  width: number;
  strokeWidth: number;
  fontSize: string;
  labelSize: string;
  subtitleSize: string;
}> = {
  sm: {
    width: 100,
    strokeWidth: 8,
    fontSize: 'text-2xl',
    labelSize: 'text-xs',
    subtitleSize: 'text-xs',
  },
  md: {
    width: 140,
    strokeWidth: 10,
    fontSize: 'text-3xl',
    labelSize: 'text-sm',
    subtitleSize: 'text-xs',
  },
  lg: {
    width: 180,
    strokeWidth: 12,
    fontSize: 'text-4xl',
    labelSize: 'text-base',
    subtitleSize: 'text-sm',
  },
};

/**
 * 점수 게이지 공통 컴포넌트
 * - 반원형 프로그레스
 * - Beauty/Style 도메인별 색상
 * - 비교 값 표시 (예: 피부나이 vs 실제나이)
 */
export function ScoreGauge({
  score,
  maxScore,
  label,
  subtitle,
  variant = 'default',
  size = 'md',
  suffix = '',
  comparison,
  className,
}: ScoreGaugeProps) {
  const colors = variantColors[variant];
  const config = sizeConfig[size];

  // 점수 비율 (0-1)
  const percentage = Math.min(Math.max(score / maxScore, 0), 1);

  // SVG 계산
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * Math.PI; // 반원
  const strokeDashoffset = circumference * (1 - percentage);

  // 그라디언트 ID (useId로 안정적인 고유 ID 생성)
  const id = useId();
  const gradientId = `score-gauge-gradient-${variant}-${id.replace(/:/g, '')}`;

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      data-testid="score-gauge"
      role="img"
      aria-label={`${label}: ${score}${suffix} (최대 ${maxScore})`}
    >
      {/* 게이지 */}
      <div className="relative" style={{ width: config.width, height: config.width / 2 + 20 }}>
        <svg
          width={config.width}
          height={config.width / 2 + 10}
          viewBox={`0 0 ${config.width} ${config.width / 2 + 10}`}
        >
          {/* 그라디언트 정의 */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.gradient.start} />
              <stop offset="100%" stopColor={colors.gradient.end} />
            </linearGradient>
          </defs>

          {/* 배경 트랙 (반원) */}
          <path
            d={`
              M ${config.strokeWidth / 2}, ${config.width / 2}
              A ${radius}, ${radius} 0 0 1 ${config.width - config.strokeWidth / 2}, ${config.width / 2}
            `}
            fill="none"
            stroke={colors.track}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className="dark:opacity-30"
          />

          {/* 진행률 (반원) */}
          <path
            d={`
              M ${config.strokeWidth / 2}, ${config.width / 2}
              A ${radius}, ${radius} 0 0 1 ${config.width - config.strokeWidth / 2}, ${config.width / 2}
            `}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* 점수 텍스트 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: 0 }}
        >
          <div className={cn('font-bold', config.fontSize, colors.text)}>
            {score}
            <span className="text-lg font-normal">{suffix}</span>
          </div>
        </div>
      </div>

      {/* 라벨 */}
      <div className="text-center mt-2">
        <p className={cn('font-medium text-foreground', config.labelSize)}>{label}</p>
        {subtitle && (
          <p className={cn('text-muted-foreground', config.subtitleSize)}>{subtitle}</p>
        )}
      </div>

      {/* 비교 표시 */}
      {comparison && (
        <div className="mt-2 px-3 py-1.5 bg-muted/50 rounded-full">
          <span className="text-xs text-muted-foreground">
            {comparison.label}: <span className="font-medium text-foreground">{comparison.value}{suffix}</span>
          </span>
          {score !== comparison.value && (
            <span className={cn(
              'ml-1 text-xs font-medium',
              score < comparison.value ? 'text-green-600' : 'text-amber-600'
            )}>
              ({score < comparison.value ? '-' : '+'}{Math.abs(score - comparison.value)})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ScoreGauge;
