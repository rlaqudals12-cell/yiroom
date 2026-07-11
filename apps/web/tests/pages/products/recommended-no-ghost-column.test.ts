/**
 * /products/recommended — 유령 컬럼 재발 방지 가드 (2026-07-11 배치 G2)
 *
 * 배경: 맞춤 추천 페이지가 skin_analyses에서 존재하지 않는 `top_concerns` 컬럼을
 *   select 했다. prod에 그 컬럼이 없어 쿼리가 통째로 에러 → skinAnalysis.data가
 *   null이 되고, 피부 분석을 마친 사용자에게도 "분석하면 추천해드려요" 잠금 카드가
 *   떴다(= "내 피부에 맞는 스킨케어" 추천이 구조적으로 항상 0).
 *
 * 원칙: 존재하지 않는 컬럼을 select하지 않는다. skin_analyses에는 concerns/top_concerns
 *   컬럼이 없다(유령 컬럼) — skin_type만 조회한다.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PAGE_SRC = fs.readFileSync(
  path.join(__dirname, '../../../app/(main)/products/recommended/page.tsx'),
  'utf-8'
);

describe('/products/recommended — 유령 컬럼 미조회 (재발 방지)', () => {
  it('skin_analyses에서 존재하지 않는 top_concerns/concerns 컬럼을 select하지 않아야 함', () => {
    // 유령 컬럼 참조가 다시 들어오면 쿼리가 에러나며 스킨케어 추천이 0으로 붕괴한다.
    expect(PAGE_SRC).not.toMatch(/top_concerns/);
    expect(PAGE_SRC).not.toMatch(/select\(\s*['"`][^'"`]*\bconcerns\b/);
  });

  it('skin_analyses는 실재 컬럼(skin_type)만 조회해야 함', () => {
    expect(PAGE_SRC).toMatch(/\.from\(['"]skin_analyses['"]\)/);
    expect(PAGE_SRC).toMatch(/\.select\(['"]skin_type['"]\)/);
  });
});
