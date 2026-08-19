import { describe, expect, it } from 'vitest';

import { extractMatchScores } from '@/components/products/ProductGrid';

describe('extractMatchScores 개인 적합도 정직성', () => {
  it('personalMatched=true인 점수만 UI용 Map에 노출한다', () => {
    const result = extractMatchScores([
      {
        product: { id: 'personal' },
        matchScore: 88,
        matchReasons: [],
        personalMatched: true,
      },
      {
        product: { id: 'popular' },
        matchScore: 99,
        matchReasons: [],
        personalMatched: false,
      },
    ]);

    expect(result.products).toHaveLength(2);
    expect(result.matchScores.get('personal')).toBe(88);
    expect(result.matchScores.has('popular')).toBe(false);
  });

  it('구버전 값처럼 personalMatched가 없으면 점수를 노출하지 않는다', () => {
    const result = extractMatchScores([
      {
        product: { id: 'legacy' },
        matchScore: 95,
        matchReasons: [],
      },
    ]);

    expect(result.matchScores.size).toBe(0);
  });
});
