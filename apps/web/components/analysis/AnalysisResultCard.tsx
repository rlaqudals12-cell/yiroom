'use client';

/**
 * AI 분석 결과 카드 래퍼 컴포넌트
 * AI 투명성 고지와 Mock 데이터 알림을 통합 관리
 *
 * WCAG 2.1 AA 준수:
 * - role="article" 시맨틱 구조
 * - aria-labelledby로 제목 연결
 * - 스크린리더용 신뢰도 설명
 * - 동적 콘텐츠 라이브 리전 알림
 *
 * @see docs/specs/SDD-AI-TRANSPARENCY.md - Phase 2
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md - A11Y-A2
 * @see docs/adr/ADR-024-ai-transparency.md
 */

import { ReactNode, useId, useEffect } from 'react';
import { AIBadge, AITransparencyNotice } from '@/components/common/AIBadge';
import { MockDataNotice } from '@/components/common/MockDataNotice';
import { cn } from '@/lib/utils';
import {
  getConfidenceLevel,
  announceAnalysisComplete,
} from '@/lib/a11y/aria-utils';

interface AnalysisResultCardProps {
  /** Mock 데이터 사용 여부 (AI 분석 실패 시 true) */
  usedMock?: boolean;
  /** 분석 타입 (배지 라벨에 사용) */
  analysisType?: 'skin' | 'personal-color' | 'body' | 'hair' | 'makeup' | 'nutrition' | 'workout';
  /** 신뢰도 점수 (0-100, 선택) */
  confidence?: number;
  /** 카드 제목 */
  title?: string;
  /** 자식 컴포넌트 (결과 내용) */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 하단에 투명성 고지 표시 여부 */
  showDisclaimer?: boolean;
  /** 분석 완료 시 스크린리더 알림 (기본: true) */
  announceOnMount?: boolean;
}

// 분석 타입별 라벨 매핑
const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  skin: 'AI 피부 분석',
  'personal-color': 'AI 퍼스널컬러 분석',
  body: 'AI 체형 분석',
  hair: 'AI 헤어 분석',
  makeup: 'AI 메이크업 분석',
  nutrition: 'AI 영양 분석',
  workout: 'AI 운동 분석',
};

/**
 * AI 분석 결과 카드
 * 모든 AI 분석 결과 페이지에서 사용
 *
 * 접근성:
 * - role="article" 시맨틱 랜드마크
 * - aria-labelledby 제목 연결
 * - 신뢰도 정보 스크린리더 최적화
 * - 마운트 시 결과 알림
 */
export function AnalysisResultCard({
  usedMock = false,
  analysisType,
  confidence,
  title,
  children,
  className,
  showDisclaimer = true,
  announceOnMount = true,
}: AnalysisResultCardProps) {
  // 고유 ID 생성 (React 18+ useId)
  const uniqueId = useId();
  const titleId = `${uniqueId}-title`;
  const confidenceId = `${uniqueId}-confidence`;

  const badgeLabel = analysisType ? ANALYSIS_TYPE_LABELS[analysisType] : 'AI 분석 결과';

  // 신뢰도 레벨 정보
  const confidenceInfo = confidence !== undefined
    ? getConfidenceLevel(confidence)
    : null;

  // 마운트 시 스크린리더 알림
  useEffect(() => {
    if (announceOnMount && analysisType) {
      announceAnalysisComplete(analysisType, usedMock);
    }
  }, [announceOnMount, analysisType, usedMock]);

  // 신뢰도 기반 배지 설명
  const getBadgeDescription = () => {
    if (usedMock) {
      return '이 결과는 AI 서비스 불가로 샘플 데이터입니다';
    }
    if (confidenceInfo) {
      return confidenceInfo.description;
    }
    return '이 결과는 AI 기술을 사용하여 생성되었습니다';
  };

  // ARIA 속성 결정
  const ariaProps = title
    ? { 'aria-labelledby': titleId }
    : { 'aria-label': badgeLabel };

  return (
    <article
      role="article"
      {...ariaProps}
      className={cn(
        'bg-white dark:bg-card rounded-2xl shadow-sm overflow-hidden',
        'border border-border/50',
        className
      )}
      data-testid="analysis-result-card"
      data-used-mock={usedMock}
      data-analysis-type={analysisType}
    >
      {/* 헤더: AIBadge + 제목 */}
      <header className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AIBadge
              variant="default"
              label={badgeLabel}
              description={getBadgeDescription()}
            />
            {confidence !== undefined && !usedMock && confidenceInfo && (
              <span
                id={confidenceId}
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  confidenceInfo.level === 'high' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                  confidenceInfo.level === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
                  confidenceInfo.level === 'low' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                )}
                aria-label={confidenceInfo.description}
              >
                신뢰도 {confidence}%
              </span>
            )}
          </div>
          {title && (
            <h2
              id={titleId}
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
          )}
        </div>
      </header>

      {/* Mock 사용 시 알림 배너 */}
      {usedMock && (
        <div className="px-6 pt-4">
          <MockDataNotice />
        </div>
      )}

      {/* 결과 콘텐츠 */}
      <section className="p-6" aria-label="분석 결과 상세">
        {children}
      </section>

      {/* 하단 투명성 고지 */}
      {showDisclaimer && (
        <footer className="px-6 pb-6">
          <AITransparencyNotice compact />
        </footer>
      )}
    </article>
  );
}

export default AnalysisResultCard;
