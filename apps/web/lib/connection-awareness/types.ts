/**
 * ConnectionAwareness 타입 정의
 *
 * @module lib/connection-awareness/types
 * @description "A라서 B" 연결의 내재화 추적을 위한 타입 시스템
 * @see docs/principles/connection-awareness-spec.md
 */

/**
 * 연결 상태 (내재화 곡선)
 *
 * exposed → recognized → internalized → independent
 */
export type ConnectionStatus = 'exposed' | 'recognized' | 'internalized' | 'independent';

/**
 * 분석 모듈 식별자
 */
export type ConnectionModule =
  | 'personal-color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'oral-health'
  | 'workout'
  | 'nutrition'
  | 'fashion';

/**
 * ConnectionAwareness 핵심 인터페이스
 */
export interface ConnectionAwareness {
  id: string;
  clerkUserId: string;
  connectionId: string;
  sourceModule: ConnectionModule;
  targetDomain: string;
  connectionRule: string;
  exposureCount: number;
  confirmedCount: number;
  status: ConnectionStatus;
  lastExposedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 노출 요청
 */
export interface ExposeRequest {
  connectionId: string;
  sourceModule: ConnectionModule;
  targetDomain: string;
  connectionRule: string;
}

/**
 * 노출 응답
 */
export interface ExposeResponse {
  status: ConnectionStatus;
  exposureCount: number;
  statusChanged: boolean;
}

/**
 * 확인 응답
 */
export interface ConfirmResponse {
  status: ConnectionStatus;
  confirmedCount: number;
  statusChanged: boolean;
}

/**
 * 연결 통계
 */
export interface ConnectionStats {
  totalConnections: number;
  internalizationRate: number;
  independentCount: number;
  byStatus: Record<ConnectionStatus, number>;
}

/**
 * 설명 깊이 — status에 따라 UI가 설명 수준을 조절
 */
export type ExplanationDepth = 'full' | 'brief' | 'minimal' | 'none';
