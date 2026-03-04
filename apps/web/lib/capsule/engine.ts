/**
 * CapsuleEngine<T> 인터페이스
 * 각 도메인(Skin, Fashion, Nutrition 등)이 구현하는 캡슐 엔진
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md — C1~C5 원칙
 *
 * C1: Curation — 프로필 기반 아이템 큐레이션
 * C2: Compatibility — 아이템 간 호환성 평가
 * C3: Personalization — 개인화 적용
 * C4: Rotation — 시간 기반 로테이션
 * C5: Minimalism — 최소 필수 아이템 유지
 */

import type { BeautyProfile, Capsule, CompatibilityScore, CurateOptions } from './types';

/**
 * 캡슐 엔진 — 도메인별 구현 인터페이스
 * @template T 도메인 아이템 타입 (SkinProduct, WardrobeItem 등)
 */
export interface CapsuleEngine<T> {
  /** 도메인 식별자 */
  readonly domainId: string;

  /** 도메인 한국어 이름 */
  readonly domainName: string;

  // ==========================================================================
  // C1: Curation — 프로필 기반 큐레이션
  // ==========================================================================

  /**
   * 프로필 기반 아이템 큐레이션
   * @param profile 사용자 BeautyProfile
   * @param options 큐레이션 옵션
   * @returns 큐레이션된 아이템 목록
   */
  curate(profile: BeautyProfile, options?: CurateOptions): Promise<T[]>;

  /**
   * 개인화 레벨에 따른 최적 아이템 수 반환
   * @param profile 사용자 BeautyProfile
   * @returns 최적 N값
   */
  getOptimalN(profile: BeautyProfile): number;

  // ==========================================================================
  // C2: Compatibility — 호환성 평가
  // ==========================================================================

  /**
   * 아이템 목록의 전체 호환성 점수 산출
   * @param items 평가 대상 아이템들
   * @returns 호환성 점수 (L1/L2/L3 분리)
   */
  checkCompatibility(items: T[]): CompatibilityScore;

  /**
   * 두 아이템 간 호환성 점수 (0-100)
   * @param a 아이템 A
   * @param b 아이템 B
   * @returns 쌍별 점수
   */
  getPairwiseScore(a: T, b: T): number;

  // ==========================================================================
  // C3: Personalization — 개인화
  // ==========================================================================

  /**
   * 아이템에 개인화 적용 (정렬, 필터, 가중치)
   * @param items 대상 아이템들
   * @param profile 사용자 프로필
   * @returns 개인화된 아이템 목록
   */
  personalize(items: T[], profile: BeautyProfile): T[];

  // ==========================================================================
  // C4: Rotation — 로테이션
  // ==========================================================================

  /**
   * 캡슐의 로테이션 필요 여부 판정
   * @param capsule 현재 캡슐
   * @returns true면 로테이션 필요
   */
  shouldRotate(capsule: Capsule<T>): boolean;

  /**
   * 캡슐 로테이션 실행 (20-40% 교체)
   * @param capsule 현재 캡슐
   * @param profile 사용자 프로필
   * @returns 교체된 아이템 목록
   */
  rotate(capsule: Capsule<T>, profile: BeautyProfile): Promise<T[]>;

  // ==========================================================================
  // C5: Minimalism — 최소화
  // ==========================================================================

  /**
   * 중복/불필요 아이템 제거
   * @param items 대상 아이템들
   * @returns 최소화된 아이템 목록
   */
  minimize(items: T[]): T[];
}
