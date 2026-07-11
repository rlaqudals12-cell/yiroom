/**
 * 화장품 상세 One Canon — 재발 방지 가드 (2026-07-11 배치 IA-1)
 *
 * 배경: 같은 화장품이 두 상세 페이지로 갈라졌다.
 *   - /beauty/[productId]   : 적합도·성분·제품함·루틴·찜 (뷰티팀 컨설턴트 뷰, 정본)
 *   - /products/cosmetic/[id]: 구매·리뷰·QA·쿠폰·SEO (범용 상세)
 *   → 홈 캡슐 위젯은 /beauty, 캡슐 상세는 /products/cosmetic, 찜은 /products… 로
 *     제각각 링크되어 "저장할 때 본 화면"과 "다시 들어온 화면"이 달랐다.
 *
 * 원칙(One Canon): 화장품 상세 정본 = /beauty/[id].
 *   모든 제품 카드·목록·위젯의 화장품 상세 링크는 productDetailPath()를 거쳐 /beauty로 간다.
 *   비화장품(영양제/운동기구/건강식품)만 /products/[type]/[id]를 유지한다.
 *
 * 이 가드가 깨지면 = 링크 분열이 재발한 것.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { productDetailPath } from '@/lib/products';

const WEB_ROOT = path.join(__dirname, '../..');
const read = (rel: string): string => fs.readFileSync(path.join(WEB_ROOT, rel), 'utf-8');

describe('화장품 상세 One Canon — productDetailPath 정본 함수', () => {
  it('화장품은 /beauty/[id]로 통일한다', () => {
    expect(productDetailPath('cosmetic', 'abc-1')).toBe('/beauty/abc-1');
  });

  it('비화장품은 /products/[type]/[id]를 유지한다', () => {
    expect(productDetailPath('supplement', 's-1')).toBe('/products/supplement/s-1');
    expect(productDetailPath('workout_equipment', 'e-1')).toBe('/products/equipment/e-1');
    expect(productDetailPath('health_food', 'h-1')).toBe('/products/healthfood/h-1');
  });
});

describe('화장품 상세 링크 진입점 — /products/cosmetic 분열 재발 방지', () => {
  // 화장품 detail 링크를 만들 수 있는 공통 링크 생성기 — 반드시 productDetailPath 경유
  const LINK_GENERATORS = [
    'components/products/ProductCard.tsx',
    'components/products/ProductCompare.tsx',
    'components/products/RecentlyViewed.tsx',
    'app/(main)/wishlist/WishlistPageClient.tsx',
  ];

  it.each(LINK_GENERATORS)('%s — 화장품 상세 링크는 productDetailPath()로 만든다', (rel) => {
    const src = read(rel);
    // 정본 함수 사용
    expect(src).toMatch(/productDetailPath\(/);
    // 화장품을 /products/cosmetic으로 직접 보내는 하드코딩이 없어야 함
    expect(src).not.toMatch(/\/products\/cosmetic\//);
  });

  it('홈 데일리 캡슐 위젯은 화장품을 /beauty로 링크한다', () => {
    const src = read('app/(main)/home/_components/HomeDailyCapsuleWidget.tsx');
    expect(src).toMatch(/\/beauty\/\$\{/);
    expect(src).not.toMatch(/\/products\/cosmetic\//);
  });

  it('캡슐 데일리 상세의 솔루션 제품은 화장품 정본(/beauty)으로 링크한다', () => {
    const src = read('app/(main)/capsule/daily/page.tsx');
    // 예전 /products/cosmetic 하드코딩이 다시 들어오면 분열 재발
    expect(src).not.toMatch(/\/products\/cosmetic\//);
    expect(src).toMatch(/href=\{`\/beauty\/\$\{item\.solutionProduct\.id\}`\}/);
  });
});

describe('/beauty 상세 — 기능 손실 방지 (구매·리뷰 접근성)', () => {
  const BEAUTY_SRC = read('app/(main)/beauty/[productId]/page.tsx');

  it('구매 버튼이 어필리에이트 게이트웨이(openAffiliateLink)를 경유해 배선돼 있다', () => {
    // 화장품 정본(/beauty)에 구매 경로가 없으면 범용 상세로 옮겨간 셈 → 기능 손실
    expect(BEAUTY_SRC).toMatch(/openAffiliateLink\(/);
    expect(BEAUTY_SRC).toMatch(/affiliateUrl|purchaseUrl/);
  });

  it('리뷰·Q&A 접근 링크(#reviews)가 있다', () => {
    // 리뷰/QA는 범용 상세에 있으므로 딥링크로 접근성 보장
    expect(BEAUTY_SRC).toMatch(/\/products\/cosmetic\/\$\{productId\}#reviews/);
  });
});
