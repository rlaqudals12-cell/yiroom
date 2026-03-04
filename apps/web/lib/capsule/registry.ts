/**
 * DomainRegistry — 캡슐 도메인 엔진 등록/조회
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 *
 * 각 도메인(skin, fashion, nutrition 등)은 CapsuleEngine<T>를 구현하고
 * 이 레지스트리에 등록한다. Daily Capsule 생성 시 등록된 모든 엔진을 순회.
 */

import type { CapsuleEngine } from './engine';

// 등록된 도메인 엔진 저장소
const engines = new Map<string, CapsuleEngine<unknown>>();

/**
 * 도메인 엔진 등록
 * @param engine CapsuleEngine 구현체
 * @throws 이미 등록된 domainId일 경우
 */
export function registerDomain<T>(engine: CapsuleEngine<T>): void {
  if (engines.has(engine.domainId)) {
    throw new Error(`[Capsule Registry] 도메인 '${engine.domainId}'는 이미 등록되었습니다.`);
  }
  engines.set(engine.domainId, engine as CapsuleEngine<unknown>);
}

/**
 * 등록된 도메인 엔진 조회
 * @param domainId 도메인 식별자
 * @returns CapsuleEngine 또는 undefined
 */
export function getDomain<T>(domainId: string): CapsuleEngine<T> | undefined {
  return engines.get(domainId) as CapsuleEngine<T> | undefined;
}

/**
 * 등록된 모든 도메인 엔진 반환
 * @returns 등록된 엔진 배열
 */
export function getAllDomains(): CapsuleEngine<unknown>[] {
  return Array.from(engines.values());
}

/**
 * 도메인 등록 여부 확인
 * @param domainId 도메인 식별자
 */
export function hasDomain(domainId: string): boolean {
  return engines.has(domainId);
}

/**
 * 등록된 도메인 수 반환
 */
export function getDomainCount(): number {
  return engines.size;
}

/**
 * 모든 등록 해제 (테스트 전용)
 * @internal
 */
export function _clearRegistry(): void {
  engines.clear();
}
