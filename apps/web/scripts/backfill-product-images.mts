/**
 * 제품 이미지 백필 — 네이버 쇼핑 검색으로 결손 image_url 채우기
 *
 * @description
 *   `cosmetic_products`(및 `--table supplement_products`)에서 이미지가 없는 행을
 *   찾아, 브랜드+제품명으로 네이버 쇼핑을 검색하고 "확실히 같은 제품"의 이미지
 *   URL만 채운다. 구 시드(~123건+)와 색조 카탈로그 일부가 이미지 결손 상태.
 *
 *   보존/정직성 원칙:
 *   - 이미 이미지가 있는 행은 절대 덮지 않는다(needsBackfill 이중 가드).
 *   - image_url 컬럼만 갱신 — 다른 컬럼 무변경.
 *   - 매칭 가드(scripts/backfill-images/match.ts): 브랜드 불일치·저유사도는 스킵.
 *     "틀린 이미지"는 "이미지 없음"보다 나쁘다.
 *   - 순수 로직은 match.ts에 분리(네트워크 무관 단위 테스트 대상).
 *
 * @usage
 *   cd apps/web
 *   # 키 없이도 구조 확인(발급 안내 후 정상 종료):
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-product-images.mts
 *   # dry-run(기본): 대상 수·매칭 성공/실패 요약 + 샘플, DB 무변경
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-product-images.mts --dry-run
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-product-images.mts --limit 50
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-product-images.mts --table supplement_products
 *   # 실제 적용(service role):
 *   npx tsx --tsconfig tsconfig.json scripts/backfill-product-images.mts --apply
 *
 * @requires NAVER_CLIENT_ID / NAVER_CLIENT_SECRET (.env.local)
 *   발급(5분): https://developers.naver.com/apps → 애플리케이션 등록 → 검색 API
 * @requires SUPABASE_SERVICE_ROLE_KEY (.env.local)
 *
 * @see docs/plans/2026-07-07-roadmap-to-companion.md Phase 3
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

import {
  chooseImage,
  needsBackfill,
  buildSearchQuery,
  buildFallbackSearchQuery,
  stripVariantCode,
  buildImagePatch,
  summarizeDecisions,
  SUPPORTED_TABLES,
  type ProductRow,
  type NaverShopItem,
  type SupportedTable,
  type BackfillDecision,
} from './backfill-images/match.ts';

// ── env 로드 (.env.local) ─────────────────────────────────────────────────────
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}

// ── CLI 인자 ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const DRY_RUN = !APPLY; // 기본 dry-run, --apply일 때만 DB 변경
const LIMIT = Number(args[args.indexOf('--limit') + 1] || 0) || 0; // 0 = 전량
const TABLE = ((): SupportedTable => {
  const raw = args.includes('--table') ? args[args.indexOf('--table') + 1] : 'cosmetic_products';
  if (!SUPPORTED_TABLES.includes(raw as SupportedTable)) {
    console.error(`❌ 지원하지 않는 테이블: ${raw} (지원: ${SUPPORTED_TABLES.join(', ')})`);
    process.exit(1);
  }
  return raw as SupportedTable;
})();

const DISPLAY = 10; // 제품당 검색 결과 상위 N개만 조회
const MAX_RETRY = 3;
const RATE_LIMIT_MS = 150; // 색조 카탈로그 수집기와 동일 간격

const clientId = process.env.NAVER_CLIENT_ID;
const clientSecret = process.env.NAVER_CLIENT_SECRET;

function keyMissingNotice(): void {
  console.log('ℹ️  NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 미설정 — 백필을 건너뜁니다 (정상 종료).');
  console.log('   네이버 검색 API 키 발급(무료, 5분):');
  console.log('     1) https://developers.naver.com/apps → 애플리케이션 등록');
  console.log('     2) 사용 API: "검색" 선택');
  console.log('     3) .env.local 에 추가:');
  console.log('        NAVER_CLIENT_ID=발급받은ID');
  console.log('        NAVER_CLIENT_SECRET=발급받은Secret');
  console.log(
    '   이후 재실행: npx tsx --tsconfig tsconfig.json scripts/backfill-product-images.mts'
  );
}

// ── 네이버 쇼핑 검색 (재시도 + 지수 백오프) ───────────────────────────────────
async function searchNaver(query: string): Promise<NaverShopItem[]> {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${DISPLAY}&start=1&sort=sim`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'X-Naver-Client-Id': clientId!, 'X-Naver-Client-Secret': clientSecret! },
      });
      if (res.status === 429) {
        // 레이트리밋 — 더 길게 쉬고 재시도
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        throw new Error('HTTP 429 (rate limit)');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items?: NaverShopItem[] };
      return data.items ?? [];
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRY - 1) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      }
    }
  }
  console.error(`  ⚠ 검색 실패(${query}): ${(lastErr as Error)?.message ?? 'unknown'}`);
  return [];
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (!clientId || !clientSecret) {
    keyMissingNotice();
    return; // 에러 아님 — 정상 종료
  }

  console.log(
    `제품 이미지 백필 — 테이블: ${TABLE} · 모드: ${DRY_RUN ? 'DRY-RUN' : 'APPLY'}${LIMIT ? ` (limit ${LIMIT})` : ''}\n`
  );

  const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
  const supabase = createServiceRoleClient();

  // 1. 전체 행 로드 후 결손 필터 (id/name/brand/image_url 소량 컬럼 — 수천 행이라도 가벼움)
  const rows: ProductRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, brand, image_url')
      .range(from, from + 999);
    if (error) throw new Error(`${TABLE} 조회 실패: ${error.message}`);
    if (!data?.length) break;
    rows.push(...(data as ProductRow[]));
    if (data.length < 1000) break;
  }

  const targets = rows.filter((r) => needsBackfill(r)).slice(0, LIMIT || undefined);
  console.log(
    `전체 ${rows.length}행 · 이미지 결손 ${rows.filter(needsBackfill).length}행 → 대상 ${targets.length}행\n`
  );

  if (targets.length === 0) {
    console.log('백필할 대상이 없습니다. 종료.');
    return;
  }

  // 2. 검색 + 매칭 판정 (1차: 원명, 2차: 색상코드 제거 베이스명)
  const decisions: Array<{ row: ProductRow; decision: BackfillDecision }> = [];
  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    const primaryQuery = buildSearchQuery(row);
    let decision = chooseImage(row, await searchNaver(primaryQuery));

    // 1차 미매칭 + 색상코드/호수가 있어 베이스 검색어가 달라지면 → 2차(베이스명) 시도.
    // 유사도·판정은 베이스명 기준, 브랜드 가드는 동일 → "다른 색이어도 같은 라인"만 통과.
    if (decision.status === 'unmatched') {
      const fallbackQuery = buildFallbackSearchQuery(row);
      if (fallbackQuery && fallbackQuery !== primaryQuery) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
        const fbDecision = chooseImage(row, await searchNaver(fallbackQuery), {
          matchName: stripVariantCode(row.name),
          via: 'fallback',
        });
        if (fbDecision.status === 'matched') decision = fbDecision;
      }
    }

    decisions.push({ row, decision });
    process.stdout.write(`  진행 ${i + 1}/${targets.length}\r`);
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }
  console.log('');

  const summary = summarizeDecisions(decisions.map((d) => d.decision));
  // 2차 시도(베이스명 재검색)로 채운 건수 분리 리포트
  const matchedViaFallback = decisions.filter(
    (d) => d.decision.status === 'matched' && d.decision.via === 'fallback'
  ).length;
  console.log(
    `\n판정: 매칭 ${summary.matched}건 (2차 시도 매칭 ${matchedViaFallback}건) · 미매칭 ${summary.unmatched}건 · 스킵 ${summary.skipped}건`
  );

  const matched = decisions.filter((d) => d.decision.status === 'matched');
  const unmatched = decisions.filter((d) => d.decision.status === 'unmatched');

  // 3. 리포트
  console.log('\n── 매칭 성공 샘플 (최대 10) ──');
  for (const { row, decision } of matched.slice(0, 10)) {
    if (decision.status !== 'matched') continue;
    console.log(
      `  ✓ ${row.brand ?? ''} ${row.name}\n     → ${decision.matchedTitle} (유사도 ${decision.score.toFixed(2)})`
    );
  }
  if (unmatched.length > 0) {
    console.log('\n── 미매칭 샘플 (최대 10) ──');
    for (const { row, decision } of unmatched.slice(0, 10)) {
      if (decision.status !== 'unmatched') continue;
      console.log(
        `  ✗ ${row.brand ?? ''} ${row.name} — ${decision.reason} (best ${decision.bestScore.toFixed(2)})`
      );
    }
  }

  // 4. 적용
  if (DRY_RUN) {
    console.log('\n── DRY RUN — DB 무변경. 적용하려면 --apply 로 재실행 ──');
    return;
  }

  let updated = 0;
  for (const { row, decision } of matched) {
    if (decision.status !== 'matched') continue;
    const { error } = await supabase
      .from(TABLE)
      .update(buildImagePatch(decision.imageUrl))
      .eq('id', row.id);
    if (error) {
      console.error(`  ❌ 갱신 실패 (${row.id}): ${error.message}`);
      continue;
    }
    updated += 1;
  }
  console.log(`\n✅ 백필 완료: ${updated}건 image_url 갱신 (${TABLE})`);
}

main().catch((e) => {
  console.error('실패:', e);
  process.exit(1);
});
