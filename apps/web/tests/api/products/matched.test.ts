/**
 * GET /api/products/matched — 후보 풀·색조 화이트리스트·정직 표기 회귀 가드
 * (2026-08 제품 매칭 감사 A1·A2·A5·A6)
 *
 * 감사 실측:
 * - review_count가 전건 0/NULL이라 후보 풀이 **전 사용자 동일한 id순 90행**으로 고정 →
 *   시즌 태깅 제품(makeup 2,444 중 329건)이 풀에 한 건도 못 들어와 겨울 쿨톤 매칭이 0건이었다.
 * - 퍼스널컬러 결과에 프라이머·마스카라·세팅스프레이 같은 무채 제품이 섞였다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

interface CapturedQuery {
  categories?: string[];
  subcategories?: string[];
  overlaps?: { column: string; values: string[] };
  limit?: number;
}

/** 이 테스트가 흉내내는 최소 prod 스냅샷 (id순 = 삽입순) */
interface FakeRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price_range: string | null;
  personal_color_seasons: string[] | null;
  concerns: string[] | null;
  skin_types: string[] | null;
  is_active: boolean;
}

function makeRow(id: string, overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id,
    name: `제품 ${id}`,
    brand: '브랜드',
    category: 'makeup',
    subcategory: 'lip',
    price_range: 'budget',
    personal_color_seasons: [],
    concerns: null,
    skin_types: null,
    is_active: true,
    ...overrides,
  };
}

// id순 앞쪽을 미태깅 제품으로 꽉 채우고(폴백 풀 90행을 전부 잡아먹도록), 겨울 태깅 제품은
// 뒤쪽에 둔다 → 1차 프로필 패스가 없으면 겨울 제품은 절대 풀에 들어오지 못한다(감사 재현).
const COLOR_SUBS = ['lip', 'blush', 'foundation', 'eyeshadow', 'concealer', 'highlighter'];
const ACHROMATIC_SUBS = ['primer', 'mascara', 'setting-spray', 'powder', 'brow'];

const UNTAGGED_COLOR: FakeRow[] = Array.from({ length: 120 }, (_, i) =>
  makeRow(`u${String(i).padStart(3, '0')}`, { subcategory: COLOR_SUBS[i % COLOR_SUBS.length] })
);
const UNTAGGED_ACHROMATIC: FakeRow[] = Array.from({ length: 30 }, (_, i) =>
  makeRow(`v${String(i).padStart(3, '0')}`, {
    subcategory: ACHROMATIC_SUBS[i % ACHROMATIC_SUBS.length],
  })
);
const WINTER_TAIL: FakeRow[] = [
  makeRow('z900', { subcategory: 'lip', personal_color_seasons: ['Winter'] }),
  makeRow('z901', { subcategory: 'eyeshadow', personal_color_seasons: ['Winter', 'Summer'] }),
  makeRow('z902', { subcategory: 'setting-spray', personal_color_seasons: ['Winter'] }),
];
const ALL_ROWS: FakeRow[] = [...UNTAGGED_COLOR, ...UNTAGGED_ACHROMATIC, ...WINTER_TAIL];

const captured: CapturedQuery[] = [];

/** supabase 쿼리 빌더의 최소 흉내 — 체이닝 후 await하면 필터가 적용된 행을 돌려준다 */
function createQueryStub(): PromiseLike<{ data: FakeRow[] | null; error: null }> & {
  select: () => ReturnType<typeof createQueryStub>;
  eq: () => ReturnType<typeof createQueryStub>;
  order: () => ReturnType<typeof createQueryStub>;
  limit: (n: number) => ReturnType<typeof createQueryStub>;
  in: (column: string, values: string[]) => ReturnType<typeof createQueryStub>;
  overlaps: (column: string, values: string[]) => ReturnType<typeof createQueryStub>;
} {
  const state: CapturedQuery = {};
  captured.push(state);

  const resolve = (): { data: FakeRow[]; error: null } => {
    let rows = ALL_ROWS.filter((r) => r.is_active);
    if (state.categories) rows = rows.filter((r) => state.categories!.includes(r.category));
    if (state.subcategories) {
      rows = rows.filter(
        (r) => r.subcategory !== null && state.subcategories!.includes(r.subcategory)
      );
    }
    if (state.overlaps) {
      const { column, values } = state.overlaps;
      rows = rows.filter((r) => {
        const tags = (r as unknown as Record<string, string[] | null>)[column] ?? [];
        return tags.some((t) => values.includes(t));
      });
    }
    // review_count 전건 0/null → 사실상 id 오름차순 (prod 실측 상태 재현)
    rows = [...rows].sort((a, b) => a.id.localeCompare(b.id));
    return { data: rows.slice(0, state.limit ?? rows.length), error: null };
  };

  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: (n: number) => {
      state.limit = n;
      return builder;
    },
    in: (column: string, values: string[]) => {
      if (column === 'category') state.categories = values;
      if (column === 'subcategory') state.subcategories = values;
      return builder;
    },
    overlaps: (column: string, values: string[]) => {
      state.overlaps = { column, values };
      return builder;
    },
    then: (onFulfilled: (v: { data: FakeRow[]; error: null }) => unknown) =>
      Promise.resolve(resolve()).then(onFulfilled),
  };
  return builder as unknown as ReturnType<typeof createQueryStub>;
}

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({ from: () => createQueryStub() }),
}));

const { GET } = await import('@/app/api/products/matched/route');

interface MatchedItem {
  product: { id: string; subcategory?: string };
  matchScore: number;
  matchReasons: string[];
  personalMatched: boolean;
}

async function call(query: string): Promise<{ products: MatchedItem[] }> {
  const res = await GET(new NextRequest(`http://localhost/api/products/matched?${query}`));
  return res.json();
}

async function callRaw(query: string): Promise<Response> {
  return GET(new NextRequest(`http://localhost/api/products/matched?${query}`));
}

describe('GET /api/products/matched', () => {
  beforeEach(() => {
    captured.length = 0;
  });

  describe('A1 — 프로필 조건부 후보 풀', () => {
    it('겨울 쿨톤 요청 시 겨울 태깅 제품이 후보에 들어온다 (기존 0건)', async () => {
      const { products } = await call(
        'analysisType=personal-color&personalColorSeason=winter&limit=4'
      );
      const winterMatched = products.filter((p) => p.matchReasons.includes('겨울 쿨톤'));
      expect(winterMatched.length).toBeGreaterThanOrEqual(1);
    });

    it('폴백 풀(id순 90행)만으로는 겨울 제품이 들어오지 못한다 — 1차 패스가 유일한 경로', async () => {
      // 시즌 파라미터를 빼면 1차 패스가 없어 감사가 관측한 "겨울 매칭 0건" 상태가 재현된다
      const { products } = await call('analysisType=personal-color&limit=12');
      expect(products.every((p) => !p.matchReasons.includes('겨울 쿨톤'))).toBe(true);
    });

    it('시즌 오버랩 1차 패스를 실제로 건다', async () => {
      await call('analysisType=personal-color&personalColorSeason=winter');
      const overlapQueries = captured.filter(
        (q) => q.overlaps?.column === 'personal_color_seasons'
      );
      expect(overlapQueries).toHaveLength(1);
      expect(overlapQueries[0].overlaps?.values).toEqual(['Winter']);
    });

    it('시즌 정보가 없으면 1차 패스를 걸지 않는다 (불필요한 왕복 회피)', async () => {
      await call('analysisType=personal-color');
      expect(captured.some((q) => q.overlaps)).toBe(false);
    });

    it('피부 분석은 결과 지표를 DB 고민 어휘로 바꿔 오버랩한다 (A6 연동)', async () => {
      await call('analysisType=skin&skinConcerns=pores,wrinkles');
      const overlap = captured.find((q) => q.overlaps?.column === 'concerns')?.overlaps;
      expect(overlap).toBeDefined();
      // pores→pore, wrinkles→aging 으로 브리지된 뒤 DB 동의어까지 확장
      expect(overlap?.values).toEqual(expect.arrayContaining(['pore', 'aging']));
    });

    it('헤어는 재고가 폴백 풀에 전량 들어오므로 1차 패스를 걸지 않는다', async () => {
      await call('analysisType=hair&hairType=straight&scalpType=oily');
      expect(captured.some((q) => q.overlaps)).toBe(false);
    });
  });

  describe('A2 — 퍼스널컬러 색조 무채 제외', () => {
    it('프라이머·마스카라·세팅스프레이가 결과에 나오지 않는다', async () => {
      const { products } = await call(
        'analysisType=personal-color&personalColorSeason=winter&limit=12'
      );
      for (const p of products) {
        expect(['primer', 'mascara', 'setting-spray']).not.toContain(p.product.subcategory);
      }
    });

    it('subcategory 화이트리스트를 쿼리에 적용한다', async () => {
      await call('analysisType=personal-color&personalColorSeason=winter');
      const withWhitelist = captured.filter((q) => q.subcategories);
      expect(withWhitelist.length).toBeGreaterThan(0);
      for (const q of withWhitelist) {
        expect(q.subcategories).toContain('lip');
        expect(q.subcategories).not.toContain('primer');
      }
    });

    it('메이크업 분석(analysisType=makeup)에는 화이트리스트를 적용하지 않는다', async () => {
      await call('analysisType=makeup&personalColorSeason=winter');
      expect(captured.some((q) => q.subcategories)).toBe(false);
    });
  });

  describe('A5 — 개인 축 근거 유무 전달', () => {
    it('개인 축이 맞은 제품은 personalMatched=true', async () => {
      const { products } = await call(
        'analysisType=personal-color&personalColorSeason=winter&limit=12'
      );
      const winter = products.find((p) => p.matchReasons.includes('겨울 쿨톤'));
      expect(winter?.personalMatched).toBe(true);
    });

    it('가격·브랜드 보너스만 붙은 제품은 personalMatched=false', async () => {
      const { products } = await call(
        'analysisType=personal-color&personalColorSeason=winter&limit=12'
      );
      const untagged = products.find((p) => !p.matchReasons.includes('겨울 쿨톤'));
      // 미태깅 제품은 "모름"이라 매칭되지 않는다 → 적합도 문구를 만들면 거짓
      expect(untagged?.personalMatched).toBe(false);
    });
  });

  // 2026-08 외부 리뷰: 입력 미검증 — limit=-1이 slice(0,-1)로 새어 후보 풀 전체가 나갔고,
  // 숫자가 아닌 limit은 NaN이 되어 풀 조회 자체가 깨졌다.
  describe('쿼리 검증', () => {
    it('limit=-1은 400 — 대량 반환으로 새지 않는다', async () => {
      const res = await callRaw('analysisType=personal-color&limit=-1');

      expect(res.status).toBe(400);
      const body = (await res.json()) as { success: boolean; error: { code: string } };
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('limit=0·limit=99·limit=abc는 400', async () => {
      for (const limit of ['0', '99', 'abc']) {
        const res = await callRaw(`analysisType=skin&limit=${limit}`);
        expect(res.status).toBe(400);
      }
    });

    it('경계값 limit=1·limit=12는 통과하고 개수 상한을 지킨다', async () => {
      const one = await call('analysisType=personal-color&personalColorSeason=winter&limit=1');
      expect(one.products).toHaveLength(1);

      const twelve = await call('analysisType=personal-color&personalColorSeason=winter&limit=12');
      expect(twelve.products.length).toBeLessThanOrEqual(12);
    });

    it('limit이 없으면 기본 4건', async () => {
      // 이 스텁 DB는 makeup 재고만 갖고 있어 색조 축으로 확인한다
      const { products } = await call('analysisType=personal-color&personalColorSeason=winter');
      expect(products).toHaveLength(4);
    });

    it('알 수 없는 analysisType은 400', async () => {
      const res = await callRaw('analysisType=drop-table&limit=4');
      expect(res.status).toBe(400);
    });

    it('체형 결과(analysisType=body)는 기존대로 카테고리 필터 없이 통과한다', async () => {
      const res = await callRaw('analysisType=body&limit=4');
      expect(res.status).toBe(200);
      expect(captured.some((q) => q.categories)).toBe(false);
    });
  });
});
