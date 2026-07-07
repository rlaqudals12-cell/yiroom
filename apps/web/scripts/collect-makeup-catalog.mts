/**
 * 색조 카탈로그 수집기 — 네이버 쇼핑 → Gemini 태깅 → cosmetic_products 적재
 *
 * @description
 *   Phase 3 실물 연결: 색조 SKU를 수천 규모로 확충한다.
 *   실제 판매 제품(이름·가격·이미지·구매링크)을 네이버 쇼핑 오픈API에서 수집하고,
 *   Gemini(FAST_MODEL)로 서브카테고리·퍼스널컬러 시즌을 태깅해 적재한다.
 *
 *   정직성 원칙:
 *   - rating/review_count는 null (네이버 검색 API가 제공하지 않음 — 지어내지 않는다)
 *   - personal_color_seasons는 색상명에서 확실히 추론될 때만 (불확실 = 빈 배열)
 *   - 세트/리필/도구 등 단일 색조 제품이 아닌 것은 AI가 valid=false로 걸러냄
 *
 * @usage
 *   cd apps/web
 *   npx tsx --tsconfig tsconfig.json scripts/collect-makeup-catalog.mts --dry-run
 *   npx tsx --tsconfig tsconfig.json scripts/collect-makeup-catalog.mts --per-query 200
 *   npx tsx --tsconfig tsconfig.json scripts/collect-makeup-catalog.mts --subcats lip,cushion
 *
 * @requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET (.env.local)
 *   발급: https://developers.naver.com/apps → 애플리케이션 등록 → 검색 API
 * @requires GOOGLE_GENERATIVE_AI_API_KEY (태깅)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── env 로드 ─────────────────────────────────────────────────────────────────
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}

// ── CLI 인자 ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PER_QUERY = Number(args[args.indexOf('--per-query') + 1] || 0) || (DRY_RUN ? 20 : 200);
const SUBCAT_FILTER = args.includes('--subcats')
  ? new Set(args[args.indexOf('--subcats') + 1].split(','))
  : null;

const clientId = process.env.NAVER_CLIENT_ID;
const clientSecret = process.env.NAVER_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error('❌ NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정');
  console.error('   발급(5분): https://developers.naver.com/apps → 애플리케이션 등록');
  console.error('   → 사용 API: "검색" 선택 → .env.local에 두 키 추가 후 재실행');
  process.exit(1);
}

// ── 수집 대상: 서브카테고리별 검색어 ─────────────────────────────────────────
// makeup subcategory 값은 기존 시드/스키마 관례(20260213 affiliate CHECK 목록)를 따름
const QUERIES: Array<{ subcategory: string; query: string }> = [
  { subcategory: 'lip', query: '립틴트' },
  { subcategory: 'lip', query: '립스틱' },
  { subcategory: 'lip-gloss', query: '립글로스' },
  { subcategory: 'cushion', query: '쿠션 파운데이션' },
  { subcategory: 'foundation', query: '리퀴드 파운데이션' },
  { subcategory: 'concealer', query: '컨실러' },
  { subcategory: 'powder', query: '페이스 파우더' },
  { subcategory: 'blush', query: '블러셔' },
  { subcategory: 'highlighter', query: '하이라이터' },
  { subcategory: 'contour', query: '쉐딩' },
  { subcategory: 'eyeshadow', query: '아이섀도우 팔레트' },
  { subcategory: 'eyeliner', query: '아이라이너' },
  { subcategory: 'mascara', query: '마스카라' },
  { subcategory: 'brow', query: '아이브로우' },
  { subcategory: 'primer', query: '메이크업 프라이머' },
  { subcategory: 'setting-spray', query: '메이크업 픽서' },
];

// 명백한 비단일제품 — AI 태깅 전에 싸게 걸러냄 (최종 판정은 AI valid)
const EXCLUDE_KEYWORDS = ['세트', '리필', '공병', '케이스', '브러시', '퍼프', '테스터', '샘플'];

// ── 네이버 쇼핑 검색 ─────────────────────────────────────────────────────────
interface NaverItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  brand: string;
  maker: string;
  productId: string;
  productType: string;
  category3: string;
}

async function searchNaver(query: string, limit: number): Promise<NaverItem[]> {
  const items: NaverItem[] = [];
  for (let start = 1; start <= limit; start += 100) {
    const display = Math.min(100, limit - start + 1);
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=sim`;
    const res = await fetch(url, {
      headers: { 'X-Naver-Client-Id': clientId!, 'X-Naver-Client-Secret': clientSecret! },
    });
    if (!res.ok) {
      console.error(`  ⚠ 네이버 API ${res.status} (${query}, start=${start}) — 이 쿼리 중단`);
      break;
    }
    const data = (await res.json()) as { items: NaverItem[] };
    items.push(...data.items);
    if (data.items.length < display) break; // 결과 소진
    await new Promise((r) => setTimeout(r, 150)); // rate limit 여유
  }
  return items;
}

interface Candidate {
  name: string;
  brand: string;
  subcategory: string;
  priceKrw: number;
  imageUrl: string;
  purchaseUrl: string;
  naverProductId: string;
}

function normalizeItem(item: NaverItem, subcategory: string): Candidate | null {
  const name = item.title.replace(/<[^>]{0,100}>/g, '').trim();
  const brand = (item.brand || item.maker || '').trim();
  const price = parseInt(item.lprice, 10);

  // productType 1~3 = 일반 상품 (4~6 중고, 7~9 단종/예정)
  if (!['1', '2', '3'].includes(item.productType)) return null;
  if (!brand || !name || !price || price < 1000) return null;
  if (EXCLUDE_KEYWORDS.some((k) => name.includes(k))) return null;

  return {
    name,
    brand,
    subcategory,
    priceKrw: price,
    imageUrl: item.image,
    purchaseUrl: item.link,
    naverProductId: item.productId,
  };
}

/** 중복 판정 키 — 브랜드+이름 정규화 (공백/대소문자 무시) */
function dedupeKey(brand: string, name: string): string {
  return `${brand}|${name}`.toLowerCase().replace(/\s+/g, '');
}

// ── Gemini 태깅 ──────────────────────────────────────────────────────────────
interface Tagged {
  i: number;
  valid: boolean;
  subcategory: string;
  seasons: string[];
}

const VALID_SEASONS = new Set(['Spring', 'Summer', 'Autumn', 'Winter']);
const VALID_SUBCATS = new Set(QUERIES.map((q) => q.subcategory).concat(['eye', 'lip-liner']));

async function tagBatch(
  batch: Candidate[],
  generateContent: (p: {
    model?: string;
    contents: string;
    config?: Record<string, unknown>;
  }) => Promise<{ text: string }>,
  fastModel: string
): Promise<Tagged[]> {
  const list = batch
    .map((c, i) => `${i}. [${c.subcategory}] ${c.brand} ${c.name} (₩${c.priceKrw})`)
    .join('\n');

  const prompt = `당신은 K-뷰티 색조 제품 데이터 태거입니다. 아래 제품 목록을 태깅하세요.

제품 목록:
${list}

각 제품에 대해:
1. valid: 단일 색조 화장품이면 true. 세트/키트/도구/스킨케어/향수/기타 비색조는 false.
2. subcategory: 실제 제품 유형. 후보: lip, lip-gloss, lip-liner, cushion, foundation, concealer, powder, blush, highlighter, contour, eyeshadow, eye, eyeliner, mascara, brow, primer, setting-spray. 대괄호 안 값이 맞으면 유지, 틀리면 교정.
3. seasons: 제품명의 색상/호수명에서 퍼스널컬러 시즌이 명확히 추론될 때만 배열로.
   - 웜톤 밝은 코랄/피치 → ["Spring"], 쿨톤 뮤트 로즈/모브 → ["Summer"]
   - 웜톤 딥 브릭/MLBB 브라운 → ["Autumn"], 쿨톤 선명 푸시아/버건디 → ["Winter"]
   - 색상명이 없거나(마스카라 블랙 등) 애매하면 반드시 빈 배열 []. 추측 금지.

JSON 배열만 응답 (마크다운 금지):
[{"i":0,"valid":true,"subcategory":"lip","seasons":["Autumn"]}, ...]`;

  const res = await generateContent({
    model: fastModel,
    contents: prompt,
    config: { temperature: 0.1, thinkingConfig: { thinkingLevel: 'low' } },
  });

  const text = res.text
    .trim()
    .replace(/^```json?\s*/i, '')
    .replace(/```\s*$/, '');
  const parsed = JSON.parse(text) as Tagged[];
  if (!Array.isArray(parsed)) throw new Error('배열 아님');
  return parsed;
}

/** 시즌 → 언더톤 파생 (20260213 마이그레이션과 동일 로직, 미상이면 빈 배열) */
function deriveUndertones(seasons: string[]): string[] {
  const warm = seasons.includes('Spring') || seasons.includes('Autumn');
  const cool = seasons.includes('Summer') || seasons.includes('Winter');
  if (warm && !cool) return ['warm'];
  if (cool && !warm) return ['cool'];
  return [];
}

function derivePriceRange(price: number): string {
  if (price <= 20000) return 'budget';
  if (price <= 50000) return 'mid';
  return 'premium';
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
  const { generateContent, FAST_MODEL } = await import('@/lib/gemini/client');
  const supabase = createServiceRoleClient();

  // 기존 제품 dedupe 키 로드
  const existing = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from('cosmetic_products')
      .select('name, brand')
      .range(from, from + 999);
    if (!data?.length) break;
    for (const row of data) existing.add(dedupeKey(row.brand, row.name));
    if (data.length < 1000) break;
  }
  console.log(`기존 제품 ${existing.size}개 (dedupe 기준)\n`);

  // 1. 수집
  const queries = SUBCAT_FILTER ? QUERIES.filter((q) => SUBCAT_FILTER.has(q.subcategory)) : QUERIES;
  const seen = new Set<string>(); // 배치 내 중복 (productId + 이름키)
  const candidates: Candidate[] = [];

  for (const { subcategory, query } of queries) {
    const items = await searchNaver(query, PER_QUERY);
    let kept = 0;
    for (const item of items) {
      const c = normalizeItem(item, subcategory);
      if (!c) continue;
      const key = dedupeKey(c.brand, c.name);
      if (seen.has(key) || seen.has(c.naverProductId) || existing.has(key)) continue;
      seen.add(key);
      seen.add(c.naverProductId);
      candidates.push(c);
      kept++;
    }
    console.log(`▶ ${query} (${subcategory}): ${items.length}건 → 신규 후보 ${kept}건`);
  }
  console.log(`\n신규 후보 합계: ${candidates.length}건 → Gemini 태깅 시작`);

  // 2. 태깅 (배치 20)
  const rows: Record<string, unknown>[] = [];
  let invalid = 0;
  let taggedSeasons = 0;
  for (let i = 0; i < candidates.length; i += 20) {
    const batch = candidates.slice(i, i + 20);
    try {
      const tags = await tagBatch(batch, generateContent, FAST_MODEL);
      for (const t of tags) {
        const c = batch[t.i];
        if (!c) continue;
        if (!t.valid || !VALID_SUBCATS.has(t.subcategory)) {
          invalid++;
          continue;
        }
        const seasons = (t.seasons ?? []).filter((s) => VALID_SEASONS.has(s));
        if (seasons.length > 0) taggedSeasons++;
        rows.push({
          name: c.name,
          brand: c.brand,
          category: 'makeup',
          subcategory: t.subcategory,
          price_range: derivePriceRange(c.priceKrw),
          price_krw: c.priceKrw,
          personal_color_seasons: seasons,
          undertones: deriveUndertones(seasons),
          image_url: c.imageUrl,
          purchase_url: c.purchaseUrl,
          // rating/review_count는 네이버 검색 API 미제공 — null (지어내지 않음)
          is_active: true,
        });
      }
      process.stdout.write(`  태깅 ${Math.min(i + 20, candidates.length)}/${candidates.length}\r`);
    } catch (e) {
      console.error(`\n  ⚠ 태깅 배치 실패 (${i}~${i + 20}) — 건너뜀:`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(
    `\n태깅 완료: 유효 ${rows.length}건 (제외 ${invalid}건, 시즌 태깅 ${taggedSeasons}건)`
  );

  // 3. 적재
  if (DRY_RUN) {
    console.log('\n── DRY RUN — 적재 생략, 샘플 10건 ──');
    for (const r of rows.slice(0, 10)) {
      console.log(
        `[${r.subcategory}] ${r.brand} ${r.name} ₩${(r.price_krw as number).toLocaleString()} ${JSON.stringify(r.personal_color_seasons)}`
      );
    }
    return;
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase.from('cosmetic_products').insert(batch);
    if (error) {
      console.error(`  ❌ 적재 실패 (${i}~${i + 100}):`, error.message);
      continue;
    }
    inserted += batch.length;
  }
  console.log(`\n✅ 적재 완료: ${inserted}건 (색조 카탈로그 확충)`);
}

main().catch((e) => {
  console.error('실패:', e);
  process.exit(1);
});
