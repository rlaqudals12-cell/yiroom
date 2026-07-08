# SDD: 제품 스캔 "나와의 적합도" (ADR-112)

> **관련**: [ADR-112](../adr/ADR-112-product-fit-scan.md) | [원리](../principles/ingredient-safety-timeline.md)
> **기존 자산 위 확장** — 신규 파이프라인 아님. `lib/scan/*` 재사용.

## 1. 타임라인 레이어 (신규)

### `lib/scan/ingredient-timeline.ts`

```typescript
export interface IngredientTimeline {
  /** 대표 INCI/국문명 */
  name: string;
  /** OCR/DB 매칭용 별칭 (국문·영문·INCI 변형) */
  aliases: string[];
  /** 기대 효과 (화장품법 안전 표현: "~에 도움") */
  effect: string;
  /** 임상 문헌상 발현 시기 — 서술형 ("결 개선 2-4주, 주름 8-12주") */
  timeline: string;
  /** 짧은 표시용 ("8-12주") */
  timelineShort: string;
  /** 문헌 출처 (필수 — 없으면 항목 등록 불가) */
  sourceUrl: string;
  sourceLabel: string; // 예: "PubMed 27050703 (12주 임상)"
}

/** 성분 리스트에서 타임라인 보유 성분만 매칭 (별칭 포함, 대소문자 무시) */
export function matchTimelines(ingredients: string[]): IngredientTimeline[];
```

- 초기 데이터: 원리 문서 §3 표의 7종(비타민C·레티놀·나이아신아마이드·BHA·AHA·세라마이드·히알루론산) + 문헌 확보 시 확장.
- **커버 안 되는 성분은 반환하지 않음** (추정 금지).

### 표시 문구 규약 (테스트로 고정)

- 템플릿: `임상 연구에서는 보통 {timelineShort} 후 {effect} 개선이 보고돼요`
- 금지 문자열: `치료`, `재생`, `보장`, `사라져`, `없어져` — 데이터·템플릿 전수 테스트.
- 하단 고정 안내: "개인차가 있어요 · 의학적 조언이 아니에요" + "N주 후 피부 분석으로 변화를 확인해보세요" (변화 추적 연결).

## 2. 판정 응답 확장 (기존 `/api/scan/analyze`)

`analyzeCompatibility()` 결과에 레이어 필드 추가 (하위호환 — 기존 필드 유지):

```typescript
interface ScanVerdict {
  fitScore: number; // 기존 overallScore 유지 (이름 변경 없음, UI 라벨만 "나와의 적합도")
  goodPoints: string[]; // 기존
  warnings: string[]; // 기존
  regulatory: Array<{
    // L1 신규 — 사실 인용만
    ingredient: string;
    kind: 'allergen25' | 'restricted' | 'caution20';
    label: string; // "식약처 지정 알레르기 유발 착향제"
  }>;
  timelines: IngredientTimeline[]; // L4 신규
}
```

## 3. 성분 DB 조인 활성화 (dead-wiring 해소)

- OCR/바코드 성분 리스트 → `cosmetic_ingredients` 정규화 매칭(소문자·공백 제거, 별칭) → `ewg_grade`·`is_caution_20`·알레르겐 플래그 공급.
- 매칭 실패 성분은 배지 미표시(추정 금지). prod 실측: cosmetic_ingredients 97행 실재(2026-07-09 확인).

## 4. 식약처 벌크 임포트 (별도 스크립트, 키 대기 가능)

### `scripts/import-mfds-ingredients.mts`

- 입력: `DATA_GO_KR_API_KEY` env (.env.local). 없으면 안내 후 종료.
- 동작: 원료성분정보(15111774) 페이지네이션 수집 → 표준명·영문명·CAS 정규화 → `cosmetic_ingredients` upsert(표준명 키). 규제정보(15111773)로 배합금지/제한 플래그 갱신.
- 모드: `--dry-run`(기본, 요약만) / `--limit N` / `--apply`.
- RLS: service role 사용, 로컬 실행 전용.

## 5. UI 표면 (One Canon 준수)

- **정본 = 스캔 결과** (`/scan` 결과 화면): 적합도 히어로 → "그래서" (구매/대체 행동) → 규제 정보 → 타임라인 → 궁합 경고. TopActionsCard·ProgressiveDisclosure 재사용.
- 제품 상세(`/beauty/[productId]`)·성분 상세: 동일 판정 컴포넌트 재사용(중복 구현 금지).

## 6. Mock/폴백

- 비로그인/프로필 없음: 적합도 대신 "분석하면 내 피부 기준으로 판정해드려요" CTA (L1·L3·L4는 프로필 무관이므로 표시).
- OCR confidence low: 재촬영 유도(기존 UI 활용).

## 7. 테스트

- `matchTimelines`: 별칭 매칭, 미등록 성분 미반환, 전 항목 sourceUrl 존재.
- 금지 표현: 타임라인 데이터·표시 템플릿에 금지 문자열 부재.
- 판정 결정론: 동일 입력 → 동일 출력.
- 임포트 스크립트: dry-run 파싱 단위 테스트(API mock).
