import { describe, it, expect } from 'vitest';

import {
  RANK_BADGES,
  getRankBadge,
  rankByMatchScore,
  buildRankReasonLine,
  buildRankComparisonLine,
} from '@/lib/products/product-ranking';

describe('product-ranking', () => {
  describe('getRankBadge', () => {
    it('상위 3개 index에 금·은·동 배지를 반환한다', () => {
      expect(getRankBadge(0)).toEqual(RANK_BADGES[0]);
      expect(getRankBadge(0)?.emoji).toBe('🥇');
      expect(getRankBadge(1)?.emoji).toBe('🥈');
      expect(getRankBadge(2)?.emoji).toBe('🥉');
    });

    it('3위(index 2) 초과면 null', () => {
      expect(getRankBadge(3)).toBeNull();
      expect(getRankBadge(10)).toBeNull();
    });
  });

  describe('rankByMatchScore', () => {
    it('matchScore 내림차순으로 정렬한다', () => {
      const sorted = rankByMatchScore([
        { matchScore: 70, id: 'a' },
        { matchScore: 92, id: 'b' },
        { matchScore: 81, id: 'c' },
      ]);
      expect(sorted.map((s) => s.id)).toEqual(['b', 'c', 'a']);
    });

    it('동률이면 원래 순서를 유지한다(안정 정렬, 조작 금지)', () => {
      const sorted = rankByMatchScore([
        { matchScore: 80, id: 'first' },
        { matchScore: 80, id: 'second' },
        { matchScore: 80, id: 'third' },
      ]);
      expect(sorted.map((s) => s.id)).toEqual(['first', 'second', 'third']);
    });

    it('원본 배열을 변형하지 않는다', () => {
      const original = [
        { matchScore: 10, id: 'a' },
        { matchScore: 90, id: 'b' },
      ];
      rankByMatchScore(original);
      expect(original.map((s) => s.id)).toEqual(['a', 'b']);
    });
  });

  describe('buildRankReasonLine', () => {
    it('이유가 여러 개면 "모두 맞아요"로 조립한다', () => {
      expect(buildRankReasonLine(92, ['여름 쿨톤', '건성'])).toBe(
        '나와의 적합도 92점 — 여름 쿨톤·건성에 모두 맞아요'
      );
    });

    it('이유가 하나면 "맞아요"로 조립한다', () => {
      expect(buildRankReasonLine(88, ['건성'])).toBe('나와의 적합도 88점 — 건성에 맞아요');
    });

    it('이유가 없으면 점수만 표기한다(지어내지 않음)', () => {
      expect(buildRankReasonLine(80, [])).toBe('나와의 적합도 80점');
      expect(buildRankReasonLine(80)).toBe('나와의 적합도 80점');
    });

    it('점수는 반올림하며 빈/공백 이유는 무시한다', () => {
      expect(buildRankReasonLine(84.6, ['  ', '지성'])).toBe('나와의 적합도 85점 — 지성에 맞아요');
    });
  });

  describe('buildRankComparisonLine', () => {
    it('양쪽 모두 고유 이유가 있으면 대비 문장을 반환한다', () => {
      expect(buildRankComparisonLine(['여름 쿨톤', '건성'], ['건성', '저자극'])).toBe(
        'BEST 1은 여름 쿨톤, BEST 2는 저자극이 강점이에요'
      );
    });

    it('받침 없는 단어는 조사 "가"를 사용한다', () => {
      // "보습"→받침 있음→이 / "커버"→받침 없음→가
      expect(buildRankComparisonLine(['보습'], ['커버'])).toBe(
        'BEST 1은 보습, BEST 2는 커버가 강점이에요'
      );
    });

    it('이유가 동일하면(차이 없음) null을 반환한다', () => {
      expect(buildRankComparisonLine(['건성'], ['건성'])).toBeNull();
    });

    it('한쪽만 고유 이유가 있으면 null을 반환한다(억지 비교 금지)', () => {
      expect(buildRankComparisonLine(['여름 쿨톤', '건성'], ['건성'])).toBeNull();
    });

    it('빈 배열/undefined면 null을 반환한다', () => {
      expect(buildRankComparisonLine([], [])).toBeNull();
      expect(buildRankComparisonLine(undefined, undefined)).toBeNull();
    });
  });
});
