/**
 * 도메인 엔진 등록
 *
 * Phase 3: Skin, Fashion, Nutrition (3개)
 * Phase 5: Workout, Hair, Makeup, PersonalColor, Oral, Body (6개)
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import { registerDomain, getDomainCount } from '../registry';
import { skinEngine } from './skin';
import { fashionEngine } from './fashion';
import { nutritionEngine } from './nutrition';
import { workoutEngine } from './workout';
import { hairEngine } from './hair';
import { makeupEngine } from './makeup';
import { personalColorEngine } from './personal-color';
import { oralEngine } from './oral';
import { bodyEngine } from './body';

/**
 * Phase 3 도메인 엔진 등록 (하위 호환)
 * 앱 초기화 시 1회 호출
 */
export function registerPhase3Domains(): void {
  registerDomain(skinEngine);
  registerDomain(fashionEngine);
  registerDomain(nutritionEngine);
}

/**
 * 시각 정체성 도메인 엔진 등록 (ADR-098 5축 + 옷장 연결)
 *
 * PC/S/C/H/M + Fashion 6개만 등록. W(운동)/N(영양)은 UI 숨김,
 * OH(구강)는 제거된 모듈이라 데일리 캡슐에서도 제외 —
 * 숨긴 모듈의 아이템(운동 30분 등)이 "오늘의 루틴"에 섞이는 정합성 문제 방지.
 */
/**
 * 레지스트리 사용 전 도메인 등록 보장 (멱등)
 *
 * 부트스트랩 등록이 없어서 registry가 비면 캡슐 전 표면이 "존재하지 않는
 * 도메인"으로 죽음 (2026-07-07: 데일리만 고쳤더니 [domain] 상세가 같은 원인으로
 * 재발). 레지스트리를 소비하는 모든 API 라우트 진입점에서 이 함수를 호출한다.
 */
export function ensureCapsuleDomains(): void {
  if (getDomainCount() === 0) {
    registerIdentityDomains();
  }
}

export function registerIdentityDomains(): void {
  // 등록 순서 = 캡슐 아이템 순서 = 홈 위젯 상위 5개 노출 순서.
  // 아침 루틴 흐름(스킨케어→메이크업→헤어→코디)을 앞에, 정보성(PC/체형)을 뒤에.
  registerDomain(skinEngine);
  registerDomain(makeupEngine);
  registerDomain(hairEngine);
  registerDomain(fashionEngine);
  registerDomain(personalColorEngine);
  registerDomain(bodyEngine);
}

/**
 * 전체 도메인 엔진 등록 (9개)
 * Phase 5 이후 앱 초기화 시 이 함수 사용
 */
export function registerAllDomains(): void {
  // Phase 3
  registerDomain(skinEngine);
  registerDomain(fashionEngine);
  registerDomain(nutritionEngine);
  // Phase 5
  registerDomain(workoutEngine);
  registerDomain(hairEngine);
  registerDomain(makeupEngine);
  registerDomain(personalColorEngine);
  registerDomain(oralEngine);
  registerDomain(bodyEngine);
}

// 개별 엔진 re-export
export { skinEngine } from './skin';
export { fashionEngine } from './fashion';
export { nutritionEngine } from './nutrition';
export { workoutEngine } from './workout';
export { hairEngine } from './hair';
export { makeupEngine } from './makeup';
export { personalColorEngine } from './personal-color';
export { oralEngine } from './oral';
export { bodyEngine } from './body';
