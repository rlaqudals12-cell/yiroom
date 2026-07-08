/**
 * 데일리 코디 솔루션 문자열 → 색 견본(스와치) 추출
 *
 * @module lib/capsule/solution-colors
 * @description
 *   코디 솔루션은 "세레니티 블루 톤 · 세미오버 셔츠 + 와이드 팬츠" 같은 텍스트라
 *   초보자는 색상명만으로 무슨 색인지 알 수 없다 (2026-07-08 사용자 피드백).
 *   " 톤" 앞의 색상명 구간을 lib/inventory/color-bridge의 색상명→hex 33종 맵으로
 *   풀어 스와치 칩 데이터를 만든다. 맵에 없는 색은 칩 생략 — 지어내지 않는다.
 *
 *   클라이언트에서 캐시된 캡슐(솔루션 텍스트만 저장됨)에도 적용되도록
 *   서버 생성 시점이 아니라 렌더 시점에 파싱한다 (DB 스키마 변경 불필요).
 */

import { colorNameToHex } from '@/lib/inventory/color-bridge';

export interface SolutionColorChip {
  name: string;
  hex: string;
}

/**
 * 솔루션 텍스트에서 " 톤" 앞의 색상명들(· 구분)을 hex 칩으로 변환
 *
 * 지원 형태:
 * - "세레니티 블루 톤 · 세미오버 셔츠 + 와이드 팬츠" → [세레니티 블루]
 * - "세레니티 블루·라이트 옐로 톤 조합 추천" → [세레니티 블루, 라이트 옐로]
 */
export function extractSolutionColors(solution: string): SolutionColorChip[] {
  const toneIdx = solution.indexOf(' 톤');
  if (toneIdx === -1) return [];

  return solution
    .slice(0, toneIdx)
    .split('·')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, hex: colorNameToHex(name) }))
    .filter((chip): chip is SolutionColorChip => chip.hex !== null);
}
