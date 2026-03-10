/**
 * ConcernCard 공통 타입
 *
 * 모든 분석 모듈(Skin, Body, Hair, Makeup, Oral)에서 재사용 가능한
 * 시각적 개요 카드 타입 정의
 *
 * @see docs/specs/SDD-CONCERN-CARD.md
 * @see docs/principles/ux-design.md#v4-concern-card
 */

import type { ReactNode } from 'react';

/** 심각도 3단계 — V3 Triple Encoding */
export type ConcernSeverity = 'good' | 'normal' | 'warning';

/** ConcernCard에 표시할 개별 항목 데이터 */
export interface ConcernCardItem {
  /** 메트릭 고유 ID (e.g., 'hydration', 'pore') */
  id: string;
  /** Lucide 아이콘 또는 Phase B 일러스트 */
  icon: ReactNode;
  /** Phase B: Gemini 생성 일러스트 URL */
  illustration?: string;
  /** 사용자 표시 라벨 (e.g., '수분도', '모공') */
  label: string;
  /** 0-100 점수 */
  score: number;
  /** 심각도 등급 */
  severity: ConcernSeverity;
  /** 심각도 한국어 라벨 */
  severityLabel: string;
  /** 점수 기반 동적 한 줄 팁 */
  tip: string;
}

/** ConcernCard 컴포넌트 Props */
export interface ConcernCardProps extends ConcernCardItem {
  /** 카드 탭 시 상세 보기 콜백 */
  onExpand?: () => void;
  className?: string;
}

/** ConcernGrid 컴포넌트 Props */
export interface ConcernGridProps {
  items: ConcernCardItem[];
  /** 카드 탭 시 콜백 (id 전달) */
  onCardExpand?: (id: string) => void;
  className?: string;
}

/**
 * 심각도 결정 함수 타입
 * 모듈별로 기준이 다를 수 있으므로 함수로 추상화
 */
export type GetSeverity = (score: number) => {
  severity: ConcernSeverity;
  severityLabel: string;
};

/**
 * 메트릭별 팁 생성 함수 타입
 * 점수 범위에 따라 다른 팁을 반환
 */
export type GetTipForScore = (metricId: string, score: number) => string;
