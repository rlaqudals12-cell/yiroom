/**
 * 도메인 엔진 등록
 *
 * Phase 3: Skin, Fashion, Nutrition (3개)
 * Phase 5: Workout, Hair, Makeup, PersonalColor, Oral, Body (6개)
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import { registerDomain } from '../registry';
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
