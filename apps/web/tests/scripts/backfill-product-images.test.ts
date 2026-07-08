/**
 * 제품 이미지 백필 — 순수 로직 단위 테스트 (네트워크/DB 없음)
 *
 * 대상: scripts/backfill-images/match.ts
 *  - 정규화 (HTML 제거, 토큰화, 유사도)
 *  - 결손/이미지 URL 가드
 *  - 브랜드 일치 가드
 *  - chooseImage 매칭 판정 — 브랜드 불일치 스킵, 이미 값 있는 행 제외, 고신뢰 우회
 *  - 검색어 / 페이로드 생성
 */
import { describe, it, expect } from 'vitest';

import {
  stripHtml,
  normalize,
  matchKey,
  tokenize,
  similarity,
  needsBackfill,
  isUsableImageUrl,
  hasBrandMatch,
  buildSearchQuery,
  buildImagePatch,
  chooseImage,
  summarizeDecisions,
  MIN_SIMILARITY,
  HIGH_CONFIDENCE_SIMILARITY,
  SUPPORTED_TABLES,
  type ProductRow,
  type NaverShopItem,
  type BackfillDecision,
} from '@/scripts/backfill-images/match';

// ── 픽스처 ────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'p-1',
    name: '쥬시 래스팅 틴트 06 피그인러브',
    brand: '롬앤',
    image_url: null,
    ...overrides,
  };
}

function makeItem(overrides: Partial<NaverShopItem> = {}): NaverShopItem {
  return {
    title: '롬앤 쥬시 래스팅 틴트 06 피그인러브',
    image: 'https://shopping-phinf.naver.net/main_1/abc.jpg',
    link: 'https://smartstore.naver.com/x',
    brand: '롬앤',
    maker: '롬앤',
    productType: '1',
    ...overrides,
  };
}

// ── 정규화 ────────────────────────────────────────────────────────────────────

describe('normalize / tokenize', () => {
  it('stripHtml: 네이버 <b> 태그 제거', () => {
    expect(stripHtml('롬앤 <b>쥬시</b> 틴트')).toBe('롬앤 쥬시 틴트');
  });

  it('normalize: HTML 제거 + 소문자 + 기호 공백화 + 공백 축약', () => {
    expect(normalize('ROMND  쥬시-래스팅 [틴트]!!')).toBe('romnd 쥬시 래스팅 틴트');
  });

  it('normalize: 문자열 아니면 빈 문자열', () => {
    expect(normalize(null)).toBe('');
    expect(normalize(undefined)).toBe('');
    expect(normalize(42)).toBe('');
  });

  it('matchKey: 정규화 후 공백 제거 (포함 비교 키)', () => {
    expect(matchKey('롬앤 ROMND')).toBe('롬앤romnd');
    expect(matchKey('  Sodium  Hyaluronate ')).toBe('sodiumhyaluronate');
  });

  it('tokenize: 길이 2+ 또는 숫자 포함 토큰만 (호수 코드 보존)', () => {
    expect(tokenize('쥬시 래스팅 틴트 06 a')).toEqual(['쥬시', '래스팅', '틴트', '06']);
  });
});

describe('similarity', () => {
  it('제품명 토큰이 제목에 모두 담기면 1.0', () => {
    expect(similarity('쥬시 래스팅 틴트', '롬앤 쥬시 래스팅 틴트 06')).toBe(1);
  });

  it('절반만 겹치면 0.5', () => {
    // 토큰: [쥬시, 래스팅] 중 [쥬시]만 → 0.5
    expect(similarity('쥬시 래스팅', '에뛰드 쥬시 밤')).toBe(0.5);
  });

  it('전혀 다르면 0', () => {
    expect(similarity('쥬시 래스팅 틴트', '설화수 자음생 크림')).toBe(0);
  });

  it('빈 제품명은 0 (0 나눗셈 방지)', () => {
    expect(similarity('', '무엇이든')).toBe(0);
  });
});

// ── 가드 ──────────────────────────────────────────────────────────────────────

describe('needsBackfill', () => {
  it('null / undefined / 빈문자열 / placeholder → true', () => {
    expect(needsBackfill({ image_url: null })).toBe(true);
    expect(needsBackfill({ image_url: '' })).toBe(true);
    expect(needsBackfill({ image_url: '   ' })).toBe(true);
    expect(needsBackfill({ image_url: 'https://placehold.co/400x400' })).toBe(true);
  });

  it('실제 이미지 URL이 있으면 false (덮어쓰기 방지)', () => {
    expect(needsBackfill({ image_url: 'https://shopping-phinf.naver.net/x.jpg' })).toBe(false);
  });
});

describe('isUsableImageUrl', () => {
  it('http(s) 이미지 URL만 통과, placeholder·비URL 거부', () => {
    expect(isUsableImageUrl('https://cdn.example.com/x.jpg')).toBe(true);
    expect(isUsableImageUrl('http://cdn.example.com/x.jpg')).toBe(true);
    expect(isUsableImageUrl('https://placehold.co/400x400')).toBe(false);
    expect(isUsableImageUrl('data:image/png;base64,xxx')).toBe(false);
    expect(isUsableImageUrl('')).toBe(false);
    expect(isUsableImageUrl(null)).toBe(false);
  });
});

describe('hasBrandMatch', () => {
  it('후보 제목/브랜드/제조사 중 하나에 브랜드 키가 있으면 통과', () => {
    expect(hasBrandMatch('롬앤', makeItem({ title: '롬앤 쥬시 틴트', brand: '', maker: '' }))).toBe(
      true
    );
    expect(hasBrandMatch('롬앤', makeItem({ title: '쥬시 틴트', brand: '롬앤', maker: '' }))).toBe(
      true
    );
  });

  it('어디에도 브랜드가 없으면 불일치', () => {
    expect(
      hasBrandMatch(
        '롬앤',
        makeItem({ title: '에뛰드 쥬시 틴트', brand: '에뛰드', maker: '에뛰드' })
      )
    ).toBe(false);
  });

  it('브랜드가 없거나 너무 짧으면 차단하지 않음 (유사도로만 판정)', () => {
    expect(hasBrandMatch(null, makeItem())).toBe(true);
    expect(hasBrandMatch('', makeItem())).toBe(true);
    expect(hasBrandMatch('A', makeItem({ title: '무관' }))).toBe(true);
  });
});

// ── 검색어 / 페이로드 ─────────────────────────────────────────────────────────

describe('buildSearchQuery / buildImagePatch', () => {
  it('검색어 = "브랜드 제품명"', () => {
    expect(buildSearchQuery({ brand: '롬앤', name: '쥬시 틴트 06' })).toBe('롬앤 쥬시 틴트 06');
  });

  it('브랜드 없으면 제품명만', () => {
    expect(buildSearchQuery({ brand: null, name: '쥬시 틴트' })).toBe('쥬시 틴트');
  });

  it('buildImagePatch는 image_url만 담는다 (다른 컬럼 미생성)', () => {
    const patch = buildImagePatch('https://x.jpg');
    expect(patch).toEqual({ image_url: 'https://x.jpg' });
    expect(Object.keys(patch)).toEqual(['image_url']);
  });
});

// ── chooseImage 매칭 판정 ─────────────────────────────────────────────────────

describe('chooseImage', () => {
  it('브랜드 일치 + 높은 유사도 → matched, 이미지 URL 채택', () => {
    const decision = chooseImage(makeRow(), [makeItem()]);
    expect(decision.status).toBe('matched');
    if (decision.status === 'matched') {
      expect(decision.imageUrl).toBe('https://shopping-phinf.naver.net/main_1/abc.jpg');
      expect(decision.score).toBeGreaterThanOrEqual(MIN_SIMILARITY);
      expect(decision.matchedTitle).not.toContain('<b>');
    }
  });

  it('이미 이미지가 있으면 skip (절대 덮어쓰지 않음)', () => {
    const row = makeRow({ image_url: 'https://existing.example.com/x.jpg' });
    const decision = chooseImage(row, [makeItem()]);
    expect(decision.status).toBe('skip');
  });

  it('브랜드 불일치는 매칭하지 않는다 (틀린 이미지 방지)', () => {
    // 이름은 부분 유사(0.5~0.8)하나 다른 브랜드 → 고신뢰 우회 안 되고 브랜드 불일치로 스킵
    const row = makeRow({ brand: '롬앤', name: '쥬시 래스팅 틴트 06' });
    const item = makeItem({
      title: '에뛰드 쥬시 래스팅 틴트',
      brand: '에뛰드',
      maker: '에뛰드',
    });
    const decision = chooseImage(row, [item]);
    // 유사도 0.75 (< 고신뢰 0.8), 브랜드 불일치 → 채택 안 함
    expect(similarity(row.name, item.title)).toBeLessThan(HIGH_CONFIDENCE_SIMILARITY);
    expect(decision.status).toBe('unmatched');
    if (decision.status === 'unmatched') expect(decision.reason).toBe('브랜드 불일치');
  });

  it('유사도가 낮으면 미매칭 (사유: 유사도 낮음)', () => {
    const row = makeRow({ brand: '롬앤', name: '쥬시 래스팅 틴트 글로우' });
    // 브랜드는 맞지만 이름이 거의 다름 → 유사도 낮음
    const item = makeItem({ title: '롬앤 베러 댄 아이즈 팔레트', brand: '롬앤', maker: '롬앤' });
    const decision = chooseImage(row, [item]);
    expect(decision.status).toBe('unmatched');
    if (decision.status === 'unmatched') {
      expect(decision.reason).toBe('유사도 낮음');
      expect(decision.bestScore).toBeLessThan(MIN_SIMILARITY);
    }
  });

  it('고신뢰 유사도면 브랜드 표기가 달라도 매칭 (영문↔한글)', () => {
    // 브랜드 키는 불일치하지만 이름이 완전 일치 → HIGH_CONFIDENCE 경로로 채택
    const row = makeRow({ brand: 'ROMND', name: '쥬시 래스팅 틴트 06 피그인러브' });
    const item = makeItem({
      title: '쥬시 래스팅 틴트 06 피그인러브',
      brand: '수입',
      maker: '수입',
    });
    expect(similarity(row.name, item.title)).toBeGreaterThanOrEqual(HIGH_CONFIDENCE_SIMILARITY);
    const decision = chooseImage(row, [item]);
    expect(decision.status).toBe('matched');
  });

  it('placeholder·비이미지 후보는 건너뛰고 유효 이미지를 채택', () => {
    const row = makeRow();
    const bad = makeItem({ image: 'https://placehold.co/400' });
    const good = makeItem({ image: 'https://cdn.naver.net/real.jpg' });
    const decision = chooseImage(row, [bad, good]);
    expect(decision.status).toBe('matched');
    if (decision.status === 'matched')
      expect(decision.imageUrl).toBe('https://cdn.naver.net/real.jpg');
  });

  it('중고/단종(productType 4~9) 후보는 제외', () => {
    const row = makeRow();
    const used = makeItem({ productType: '4', image: 'https://cdn.naver.net/used.jpg' });
    const decision = chooseImage(row, [used]);
    // 유효 후보가 없으므로 미매칭
    expect(decision.status).toBe('unmatched');
  });

  it('검색 결과가 비면 미매칭 (사유: 검색 결과·이미지 없음)', () => {
    const decision = chooseImage(makeRow(), []);
    expect(decision.status).toBe('unmatched');
    if (decision.status === 'unmatched') {
      expect(decision.reason).toBe('검색 결과·이미지 없음');
      expect(decision.bestTitle).toBeNull();
    }
  });

  it('첫 후보가 부적합해도 뒤의 적합 후보를 채택', () => {
    const row = makeRow({ brand: '롬앤', name: '쥬시 래스팅 틴트 06' });
    const wrongBrand = makeItem({ title: '에뛰드 쥬시 틴트', brand: '에뛰드', maker: '에뛰드' });
    const right = makeItem();
    const decision = chooseImage(row, [wrongBrand, right]);
    expect(decision.status).toBe('matched');
  });
});

// ── 요약 ──────────────────────────────────────────────────────────────────────

describe('summarizeDecisions', () => {
  it('상태별 집계', () => {
    const decisions: BackfillDecision[] = [
      { status: 'matched', imageUrl: 'x', score: 1, matchedTitle: 't' },
      { status: 'matched', imageUrl: 'y', score: 0.9, matchedTitle: 't2' },
      { status: 'unmatched', reason: '브랜드 불일치', bestScore: 0.3, bestTitle: 'z' },
      { status: 'skip', reason: '이미 이미지 있음' },
    ];
    expect(summarizeDecisions(decisions)).toEqual({ matched: 2, unmatched: 1, skipped: 1 });
  });
});

// ── 상수 ──────────────────────────────────────────────────────────────────────

describe('SUPPORTED_TABLES', () => {
  it('두 제품 테이블을 지원한다', () => {
    expect(SUPPORTED_TABLES).toContain('cosmetic_products');
    expect(SUPPORTED_TABLES).toContain('supplement_products');
  });
});
