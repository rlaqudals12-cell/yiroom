/**
 * 시드 데이터 정직성 가드 — 가짜 평점 재발 방지
 *
 * 배경(2026-07-11 배치 C): 시드 JSON에 실측 소스가 없는 rating/review_count가
 * 임의 기입돼(예: 4.7/25,000) prod cosmetic_products ~500행을 오염시켰고,
 * 라이브 뷰티 표면에 "★4.5 (25,000)"로 렌더되며 평점 정렬을 지배했다.
 *
 * 원칙: 실측 없는 값은 지어내지 않는다. 시드에는 평점 필드가 존재해선 안 되고,
 * 시드 스크립트는 평점 컬럼을 삽입해선 안 된다 (null 유지 → UI 미표시).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SEEDS_DIR = path.join(__dirname, '../../data/seeds');
const SCRIPTS_DIR = path.join(__dirname, '../../scripts');

/** JSON 내 모든 객체를 재귀 순회하며 금지 키 보유 여부를 검사 */
function collectForbiddenKeys(node: unknown, forbidden: string[], found: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectForbiddenKeys(item, forbidden, found);
    return;
  }
  if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (forbidden.includes(key)) found.add(key);
      collectForbiddenKeys(value, forbidden, found);
    }
  }
}

describe('시드 JSON — 지어낸 평점 필드 부재 (재발 방지)', () => {
  const cases: Array<{ file: string; forbidden: string[] }> = [
    { file: 'cosmetic-products.json', forbidden: ['rating', 'review_count'] },
    { file: 'supplement-products.json', forbidden: ['rating', 'review_count'] },
    {
      file: 'products-health-foods.json',
      forbidden: ['rating', 'review_count', 'taste_rating', 'mixability_rating'],
    },
    { file: 'products-workout-equipment.json', forbidden: ['rating', 'review_count'] },
  ];

  it.each(cases)('$file 에 금지 필드($forbidden)가 없어야 함', ({ file, forbidden }) => {
    const raw = fs.readFileSync(path.join(SEEDS_DIR, file), 'utf-8');
    const data = JSON.parse(raw);
    const found = new Set<string>();
    collectForbiddenKeys(data, forbidden, found);
    expect(
      [...found],
      `${file}에 실측 없는 평점 필드가 다시 들어갔습니다 — 지어내지 않는다 (정직 원칙)`
    ).toEqual([]);
  });
});

describe('시드 스크립트 — 평점 컬럼 삽입 부재 (재발 방지)', () => {
  const scriptFiles = ['seed-products.ts', 'seed-product-db-v2.ts'];

  it.each(scriptFiles.map((f) => ({ f })))(
    '$f 가 rating/review_count를 insert 페이로드에 넣지 않아야 함',
    ({ f }) => {
      const src = fs.readFileSync(path.join(SCRIPTS_DIR, f), 'utf-8');
      // 삽입 코드 패턴: `rating: item.rating` / `review_count: p.review_count` 등
      expect(src).not.toMatch(/^\s*rating:\s*(item|p|product)\./m);
      expect(src).not.toMatch(/^\s*review_count:\s*(item|p|product)\./m);
      expect(src).not.toMatch(/^\s*taste_rating:\s*(item|p|product)\./m);
      expect(src).not.toMatch(/^\s*mixability_rating:\s*(item|p|product)\./m);
    }
  );

  it('admin seed 라우트가 rating/review_count를 insert 페이로드에 넣지 않아야 함', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../app/api/admin/seed-products/route.ts'),
      'utf-8'
    );
    expect(src).not.toMatch(/^\s*rating:\s*product\./m);
    expect(src).not.toMatch(/^\s*review_count:\s*product\./m);
  });
});
