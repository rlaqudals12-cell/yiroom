/**
 * 식약처 성분 벌크 임포트 — 원료성분(15111774) + 규제정보(15111773) → cosmetic_ingredients
 *
 * @description
 *   ADR-112 Agent I. 식약처 공공데이터 2종으로 `cosmetic_ingredients` 테이블을 확충한다.
 *   - 원료성분정보: 표준명(국문)·영문명(INCI)·CAS·정의 → upsert (INCI 또는 국문명 키).
 *   - 규제정보: 배합금지/사용제한 성분 → 해당 성분 concerns에 규제 노트 추가.
 *
 *   정직성/보존 원칙:
 *   - "빈 필드만 채움" — 기존 행의 큐레이션 값(ewg_score 등)은 절대 덮어쓰지 않는다.
 *   - EWG 점수는 이 API가 주지 않으므로 채우지 않는다(추정 금지).
 *   - 순수 로직은 `scripts/mfds/parse.ts`에 분리(단위 테스트 대상, 네트워크 무관).
 *
 * @usage
 *   cd apps/web
 *   # 키 없이도 구조 확인(발급 안내 출력 후 정상 종료):
 *   npx tsx --tsconfig tsconfig.json scripts/import-mfds-ingredients.mts
 *   # dry-run(기본): 수집·정규화 결과 요약만, DB 무변경
 *   npx tsx --tsconfig tsconfig.json scripts/import-mfds-ingredients.mts --dry-run
 *   npx tsx --tsconfig tsconfig.json scripts/import-mfds-ingredients.mts --limit 300
 *   # 실제 적재(service role):
 *   npx tsx --tsconfig tsconfig.json scripts/import-mfds-ingredients.mts --apply
 *
 * @requires DATA_GO_KR_API_KEY (.env.local)
 *   발급(무료): https://www.data.go.kr/ → 로그인 → 아래 두 API "활용신청"
 *     · 원료성분정보  https://www.data.go.kr/data/15111774/openapi.do
 *     · 규제(사용제한) https://www.data.go.kr/data/15111773/openapi.do
 *   승인 후 발급된 "일반 인증키(Decoding)"를 .env.local에 DATA_GO_KR_API_KEY=... 로 추가.
 * @requires SUPABASE_SERVICE_ROLE_KEY (.env.local) — --apply 시에만
 *
 * @see docs/adr/ADR-112-product-fit-scan.md · docs/specs/SDD-PRODUCT-FIT-SCAN.md §4
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

import {
  extractItems,
  extractTotalCount,
  mapIngredientItem,
  mapRegulationItem,
  buildUpsertPlan,
  mergeRecords,
  type IncomingRecord,
  type IngredientRow,
} from './mfds/parse.ts';

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
const LIMIT = Number(args[args.indexOf('--limit') + 1] || 0) || (DRY_RUN ? 200 : 0); // 0 = 전량
const PAGE_SIZE = 200;
const MAX_RETRY = 3;

const API_KEY = process.env.DATA_GO_KR_API_KEY;

// ── API 엔드포인트 ────────────────────────────────────────────────────────────
// 서비스별 실제 오퍼레이션 경로는 승인 후 확정 — 환경변수로 오버라이드 가능하게 둔다.
const INGREDIENT_URL =
  process.env.MFDS_INGREDIENT_URL ??
  'https://apis.data.go.kr/1471000/CsmtcsIngdCpntInfoService/getCsmtcsIngdCpntInfo';
const REGULATION_URL =
  process.env.MFDS_REGULATION_URL ??
  'https://apis.data.go.kr/1471000/CosmeticRawMaterialUseLimitService/getCosmeticRawMaterialUseLimit';

function keyMissingNotice(): void {
  console.log('ℹ️  DATA_GO_KR_API_KEY 미설정 — 임포트를 건너뜁니다 (정상 종료).');
  console.log('   식약처 공공데이터 API 키 발급(무료):');
  console.log('     1) https://www.data.go.kr/ 로그인');
  console.log('     2) 원료성분정보  활용신청 → https://www.data.go.kr/data/15111774/openapi.do');
  console.log('     3) 규제(사용제한) 활용신청 → https://www.data.go.kr/data/15111773/openapi.do');
  console.log('     4) 발급된 "일반 인증키(Decoding)"를 .env.local 에 추가:');
  console.log('        DATA_GO_KR_API_KEY=발급받은키');
  console.log(
    '   이후 재실행: npx tsx --tsconfig tsconfig.json scripts/import-mfds-ingredients.mts'
  );
}

// ── fetch (재시도 + 지수 백오프) ──────────────────────────────────────────────
async function fetchJson(url: string): Promise<unknown> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // data.go.kr은 오류 시 XML/HTML을 반환하기도 함 — JSON 파싱 실패는 재시도 대상
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
      const delay = 500 * 2 ** attempt;
      console.error(`  ⚠ 요청 실패(시도 ${attempt + 1}/${MAX_RETRY}): ${(e as Error).message}`);
      if (attempt < MAX_RETRY - 1) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function buildUrl(base: string, pageNo: number): string {
  const sep = base.includes('?') ? '&' : '?';
  const params = new URLSearchParams({
    serviceKey: API_KEY ?? '',
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    type: 'json',
    _type: 'json',
  });
  return `${base}${sep}${params.toString()}`;
}

/** 한 엔드포인트를 페이지네이션으로 순회하며 item 배열 누적 */
async function collect(
  base: string,
  label: string,
  map: (item: Record<string, unknown>) => IncomingRecord | null
): Promise<IncomingRecord[]> {
  const out: IncomingRecord[] = [];
  let firstKeysLogged = false;

  for (let pageNo = 1; ; pageNo++) {
    const json = await fetchJson(buildUrl(base, pageNo));
    const items = extractItems(json);
    const total = extractTotalCount(json);

    if (pageNo === 1 && items.length > 0 && !firstKeysLogged) {
      // 실제 필드명 확인용 — 필요 시 parse.ts FIELD_CANDIDATES 보강 근거
      console.log(`  · ${label} 첫 item 키: ${Object.keys(items[0]).join(', ')}`);
      firstKeysLogged = true;
    }

    for (const it of items) {
      const rec = map(it);
      if (rec) out.push(rec);
      if (LIMIT && out.length >= LIMIT) break;
    }

    const done =
      items.length < PAGE_SIZE ||
      (LIMIT && out.length >= LIMIT) ||
      (total !== null && pageNo * PAGE_SIZE >= total);
    process.stdout.write(`  ${label}: ${out.length}건 수집 (page ${pageNo})\r`);
    if (done) break;

    await new Promise((r) => setTimeout(r, 150)); // rate limit 여유
  }
  console.log('');
  return out;
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (!API_KEY) {
    keyMissingNotice();
    return; // 에러 아님 — 정상 종료
  }

  console.log(
    `식약처 성분 임포트 — 모드: ${DRY_RUN ? 'DRY-RUN' : 'APPLY'}${LIMIT ? ` (limit ${LIMIT})` : ''}\n`
  );

  // 1. 수집
  console.log('▶ 원료성분정보(15111774) 수집');
  const ingredientRecs = await collect(INGREDIENT_URL, '원료성분', mapIngredientItem);
  console.log('▶ 규제(사용제한)정보(15111773) 수집');
  const regulationRecs = await collect(REGULATION_URL, '규제정보', mapRegulationItem);

  const merged = mergeRecords([...ingredientRecs, ...regulationRecs]);
  console.log(
    `\n정규화 완료: 원료 ${ingredientRecs.length} + 규제 ${regulationRecs.length} → 병합 ${merged.length}건 (고유 성분)`
  );

  // 2. 기존 행 로드 (service role)
  const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
  const supabase = createServiceRoleClient();

  const existing: IngredientRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('cosmetic_ingredients')
      .select(
        'id, name_ko, name_en, name_inci, aliases, ewg_score, ewg_data_availability, category, functions, is_caution_20, is_allergen, allergen_type, description, benefits, concerns, source'
      )
      .range(from, from + 999);
    if (error) throw new Error(`기존 성분 조회 실패: ${error.message}`);
    if (!data?.length) break;
    existing.push(...(data as IngredientRow[]));
    if (data.length < 1000) break;
  }
  console.log(`기존 성분 ${existing.length}행 로드`);

  // 3. 업서트 계획
  const plan = buildUpsertPlan(existing, merged);
  console.log(`\n계획: 신규 삽입 ${plan.inserts.length}건 · 빈 필드 갱신 ${plan.updates.length}건`);

  if (DRY_RUN) {
    console.log('\n── DRY RUN — DB 무변경. 샘플 ──');
    for (const r of plan.inserts.slice(0, 8)) {
      console.log(`  + ${r.name_ko}${r.name_inci ? ` [${r.name_inci}]` : ''}`);
    }
    for (const u of plan.updates.slice(0, 5)) {
      console.log(`  ~ ${u.id}: ${Object.keys(u.patch).join(', ')}`);
    }
    console.log('\n적용하려면 --apply 로 재실행하세요.');
    return;
  }

  // 4. 적용 (insert 배치 + update 개별)
  let inserted = 0;
  for (let i = 0; i < plan.inserts.length; i += 100) {
    const batch = plan.inserts.slice(i, i + 100);
    const { error } = await supabase.from('cosmetic_ingredients').insert(batch);
    if (error) {
      console.error(`  ❌ 삽입 실패 (${i}~${i + 100}): ${error.message}`);
      continue;
    }
    inserted += batch.length;
  }

  let updated = 0;
  for (const u of plan.updates) {
    const { error } = await supabase.from('cosmetic_ingredients').update(u.patch).eq('id', u.id);
    if (error) {
      console.error(`  ❌ 갱신 실패 (${u.id}): ${error.message}`);
      continue;
    }
    updated += 1;
  }

  console.log(`\n✅ 적재 완료: 삽입 ${inserted}건 · 갱신 ${updated}건`);
}

main().catch((e) => {
  console.error('실패:', e);
  process.exit(1);
});
