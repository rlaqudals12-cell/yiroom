'use client';

/**
 * P1-4: ScanningAnimation — 분석 과정 시각화
 *
 * @description AI 분석 중 스캐닝 라인 애니메이션.
 * CSS @keyframes(globals.css) + inline style로 구현.
 * 1회 실행 (루프 금지), AI 응답 시간에 연동.
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md 섹션 2.3
 * @see docs/adr/ADR-097-visual-overlay-anonymous-share.md D5
 */

import { useEffect, useState, useId } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// 타입
// =============================================================================

export type ScanType = 'face' | 'body' | 'tooth';

export interface ScanningAnimationProps {
  /** 스캔 유형 (얼굴/신체/치아) */
  type: ScanType;
  /** 분석 중 여부 */
  isAnalyzing: boolean;
  /** 진행률 (0-100, 선택) */
  progress?: number;
  /** 애니메이션 완료 콜백 */
  onComplete?: () => void;
  /** 추가 className */
  className?: string;
}

// =============================================================================
// 상수
// =============================================================================

/** 스캔 타입별 설정 */
const SCAN_CONFIG: Record<ScanType, { label: string; color: string; duration: number }> = {
  face: { label: '얼굴 분석 중', color: '#10B981', duration: 2000 },
  body: { label: '체형 분석 중', color: '#6366F1', duration: 2500 },
  tooth: { label: '구강 분석 중', color: '#EC4899', duration: 1800 },
};

// =============================================================================
// 컴포넌트
// =============================================================================

/** 분석 과정 스캐닝 애니메이션 */
export function ScanningAnimation({
  type,
  isAnalyzing,
  progress,
  onComplete,
  className,
}: ScanningAnimationProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const animId = useId();
  const config = SCAN_CONFIG[type];

  // 애니메이션 완료 처리
  useEffect(() => {
    if (!isAnalyzing) {
      setAnimationComplete(false);
      return;
    }

    const timer = setTimeout(() => {
      setAnimationComplete(true);
      onComplete?.();
    }, config.duration);

    return () => clearTimeout(timer);
  }, [isAnalyzing, config.duration, onComplete]);

  if (!isAnalyzing || animationComplete) return null;

  // 진행률이 제공되면 그 값 사용, 아니면 CSS 애니메이션
  const progressValue = progress ?? undefined;

  // 유니크 keyframes 이름 (CSS-in-JS 충돌 방지)
  const keyframeName = `scan-line-${animId.replace(/:/g, '')}`;

  return (
    <div
      data-testid="scanning-animation"
      className={cn('absolute inset-0 overflow-hidden rounded-lg', className)}
      role="progressbar"
      aria-valuenow={progressValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={config.label}
    >
      {/* 인라인 @keyframes 정의 (styled-jsx 대신) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes ${keyframeName} {
          0% { top: 0%; opacity: 0.8; }
          90% { top: 95%; opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
      `,
        }}
      />

      {/* 반투명 오버레이 */}
      <div className="absolute inset-0 bg-black/20" />

      {/* 스캔 라인 */}
      <div
        className="absolute left-0 right-0 h-0.5 opacity-80"
        style={{
          backgroundColor: config.color,
          boxShadow: `0 0 12px 4px ${config.color}`,
          animation: `${keyframeName} ${config.duration}ms ease-out forwards`,
        }}
      />

      {/* 진행률 텍스트 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <span className="text-xs font-medium text-white/90 bg-black/40 px-2 py-0.5 rounded-full">
          {config.label}
          {progressValue !== undefined && ` ${Math.round(progressValue)}%`}
        </span>
      </div>
    </div>
  );
}
