/**
 * 코디 솔루션 색 스와치 추출 테스트
 * @see lib/capsule/solution-colors.ts
 */

import { describe, it, expect } from 'vitest';
import { extractSolutionColors } from '@/lib/capsule/solution-colors';

describe('extractSolutionColors', () => {
  it('단일 색상명 + 코디 형태에서 색 칩을 추출한다', () => {
    const chips = extractSolutionColors('세레니티 블루 톤 · 세미오버 셔츠 + 와이드 팬츠');

    expect(chips).toHaveLength(1);
    expect(chips[0].name).toBe('세레니티 블루');
    // color-bridge의 "블루" 부분 일치 → hex 반환
    expect(chips[0].hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('색상명 2개 조합 형태에서 두 칩을 추출한다', () => {
    const chips = extractSolutionColors('네이비·코랄 톤 조합 추천');

    expect(chips).toHaveLength(2);
    expect(chips.map((c) => c.name)).toEqual(['네이비', '코랄']);
  });

  it('맵에 없는 색상명은 칩을 생략한다 (지어내지 않음)', () => {
    const chips = extractSolutionColors('무지개빛 오로라 톤 · 셔츠 + 팬츠');
    expect(chips).toEqual([]);
  });

  it('맵에 있는 색과 없는 색이 섞이면 있는 것만 반환한다', () => {
    const chips = extractSolutionColors('네이비·오로라펄 톤 조합 추천');

    expect(chips).toHaveLength(1);
    expect(chips[0].name).toBe('네이비');
  });

  it('" 톤" 패턴이 없는 솔루션은 빈 배열을 반환한다', () => {
    expect(extractSolutionColors('세미오버 셔츠 + 와이드 팬츠')).toEqual([]);
    expect(extractSolutionColors('')).toEqual([]);
  });
});
