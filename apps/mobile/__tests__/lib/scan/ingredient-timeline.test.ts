/**
 * 효과 타임라인 (L4) 테스트 — ADR-112 (웹 정본 포팅)
 * - 별칭(국문·INCI) 매칭, 미등록 성분 미반환, 전 항목 출처(sourceUrl) 존재
 * - 금지 표현(치료·재생·보장·사라져·없어져) 데이터·템플릿 전수 부재
 * - 결정론(동일 입력 → 동일 출력)
 */

import {
  INGREDIENT_TIMELINES,
  matchTimelines,
  formatTimelineNotice,
  TIMELINE_DISCLAIMER,
} from '../../../lib/scan/ingredient-timeline';

/** 화장품법 정합: 의약품 오인·효능 보장·기간 단정 금지 표현 */
const BANNED_WORDS = ['치료', '재생', '보장', '사라져', '없어져'];

describe('matchTimelines', () => {
  it('INCI 별칭으로 매칭한다 (ascorbic acid → 비타민C)', () => {
    const result = matchTimelines(['ascorbic acid']);
    expect(result.some((t) => t.name === '비타민C')).toBe(true);
  });

  it('국문 별칭으로 매칭한다 (레티놀)', () => {
    const result = matchTimelines(['레티놀']);
    expect(result.some((t) => t.name === '레티놀')).toBe(true);
  });

  it('대소문자·공백을 무시하고 매칭한다', () => {
    const result = matchTimelines(['  Niacinamide  ']);
    expect(result.some((t) => t.name === '나이아신아마이드')).toBe(true);
  });

  it('여러 성분에서 각각의 타임라인을 매칭한다', () => {
    const result = matchTimelines(['RETINOL', 'HYALURONIC ACID']);
    const names = result.map((t) => t.name);
    expect(names).toContain('레티놀');
    expect(names).toContain('히알루론산');
  });

  it('미등록 성분은 반환하지 않는다 (추정 금지)', () => {
    const result = matchTimelines(['WATER', '정제수', 'BUTYLENE GLYCOL']);
    expect(result).toEqual([]);
  });

  it('빈 입력은 빈 배열을 반환한다', () => {
    expect(matchTimelines([])).toEqual([]);
  });

  it('결정론: 동일 입력 → 동일 출력', () => {
    const input = ['NIACINAMIDE', 'salicylic acid', '레티놀'];
    expect(matchTimelines(input)).toEqual(matchTimelines(input));
  });
});

describe('INGREDIENT_TIMELINES 데이터 무결성', () => {
  it('전 항목에 출처(sourceUrl)가 존재한다', () => {
    for (const t of INGREDIENT_TIMELINES) {
      expect(t.sourceUrl).toBeTruthy();
      expect(t.sourceUrl).toMatch(/^https?:\/\//);
      expect(t.sourceLabel).toBeTruthy();
    }
  });

  it('전 항목에 별칭이 1개 이상 존재한다', () => {
    for (const t of INGREDIENT_TIMELINES) {
      expect(t.aliases.length).toBeGreaterThan(0);
    }
  });
});

describe('금지 표현 전수 검사 (화장품법)', () => {
  it('데이터(effect·timeline·timelineShort)에 금지 표현이 없다', () => {
    for (const t of INGREDIENT_TIMELINES) {
      const combined = `${t.effect} ${t.timeline} ${t.timelineShort}`;
      for (const word of BANNED_WORDS) {
        expect(combined).not.toContain(word);
      }
    }
  });

  it('표시 템플릿(formatTimelineNotice)에 금지 표현이 없다', () => {
    for (const t of INGREDIENT_TIMELINES) {
      const notice = formatTimelineNotice(t);
      for (const word of BANNED_WORDS) {
        expect(notice).not.toContain(word);
      }
    }
  });

  it('면책 문구(TIMELINE_DISCLAIMER)에 금지 표현이 없다', () => {
    for (const word of BANNED_WORDS) {
      expect(TIMELINE_DISCLAIMER).not.toContain(word);
    }
  });
});
