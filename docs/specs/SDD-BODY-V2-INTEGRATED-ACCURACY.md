# SDD: 체형(A) 통합 정확도 — body-v2 측정 비율 → 통합 분석 연결

> ADR-108(축별 정확도 업그레이드) 체형(A) 구현 스펙
> P7: 리서치(ADR-108) → 원리(body-mechanics.md) → ADR(ADR-108) → **스펙(본 문서)** → 구현
> Status: **implemented (MVP, 2026-06-19)** | Created: 2026-06-18

---

## ⚙️ 구현 노트 (2026-06-19) — A1~A3 + S/W/N 저장 통일 완료

2단계로 구현: ① 측정 우선(5형 MVP) → ② 라벨 레이어 + S/W/N 저장 통일(ADR-108).

**ground-truth 감사 정정:**

- body-v2 `classifyBodyType`는 `BodyShape7`이 아니라 **`BodyShapeType`(5형: rectangle/inverted-triangle/triangle/oval/hourglass)** 반환. (스펙 A1 가정 정정)
- `normalizeToBodyShape7`가 `'triangle'`을 몰랐음(`pear`만) → **`triangle:'pear'` 매핑 추가**로 5형 전체 정규화 가능.
- `bodyType`(=5형 값)을 5개 소비자가 **분기 아닌 표시/보간**으로 소비(`cross-insights`·`action-plan`·`curation`·`persona`·결과 page) → 분기 없음 확인. + **`closet/recommend`는 body_type을 `as BodyType3`로 캐스팅해 추천에 기능적 사용** → 5형 저장이 깨고 있었음(기존 버그).

**구현 (커밋 b233e6bc + e7165fee + 후속):**

- **A1** `measureBodyClient`(클라 MediaPipe) + **A2** `measuredBody` optional 스키마 + **A3** 측정 우선 분기(`confidence≥0.5`면 Gemini 대신 측정). 통합 page 제출 직전 1회 호출.
- **라벨 레이어**: `getBodyShapeLabel`(lib/body) — S/W/N + 5형 + 7형 + 레거시 한글화. 결과(AxesSummaryCard·AxisDetailAccordion)·문장보간(cross-insights/action-plan/curation)·persona·홈·프로필 전부 적용 → 영문 enum 노출 해소.
- **S/W/N 저장 통일(A3 완성)**: `bodyShapeToType3`(lib/body)로 runBodyAxis가 저장/반환 직전 5형 → S/W/N 변환. `body_analyses.body_type` = S/W/N → **`closet/recommend` 추천 정상화** + cross-module 일관. 표시는 라벨 헬퍼가 한글화하므로 무회귀.
- **DRY**: 홈(useAnalysisStatus)·프로필 인라인 라벨맵 → `getBodyShapeLabel` 위임.
- 검증: tsc 0, ESLint 0(인지복잡도 warning 2), vitest 331 pass.

**미구현(차기):**

- **A4**(`measurement_source` 컬럼 — prod 마이그 핸드오프 회피) · **A5**(측정/추정 배지 UI).
- **표준 `/analysis/body` 플로우의 body_type taxonomy** 점검(통합 외 — closet가 모든 body_analyses 행을 읽으므로 표준도 S/W/N 저장이어야 완전 일관). 별도 확인 필요.
- 멀티앵글(측면 둘레 ±5mm)·percentile 코호트.

---

## 1. 배경 / 문제

통합 분석(`/analysis/integrated`)의 체형 축은 현재 **Gemini 추정**(`analyzeBodyWithGemini`)만 사용한다.

- Gemini는 사진에서 `BodyShapeType`(5형) + `estimatedRatios`를 _눈대중 추정_ → 측정 정확도 낮음.
- 한편 **body-v2**(`lib/analysis/body-v2`)는 MediaPipe Pose 33랜드마크로 **실제 픽셀 측정** 비율(`calculateBodyRatios`) + `BodyShape7` 분류를 제공하지만 **표준 `/analysis/body`에서만** 쓰이고 통합엔 미연결.
- body-v2 pose 검출은 **클라이언트(브라우저 MediaPipe CDN)**, 통합 분석은 **서버(API)** → 단순 import 불가.

→ **목표**: 클라이언트에서 전신 사진의 측정 비율/shape를 산출해 통합 API로 전달, 서버가 _측정값을 Gemini 추정보다 우선_ 사용 + 기존 매퍼로 S/W/N(스타일링) 도출.

## 2. P1 궁극의 형태 / 현재 목표

- **궁극(100%)**: 멀티앵글(정면+측면) → ASTM D5585 둘레 ±5mm + percentile 코호트.
- **현재 목표(이번 스펙, ~Level 3 / 궁극의 ~55%)**: **단일 정면 전신 사진**의 클라이언트 측정 비율/BodyShape7 → 통합 연결. 측정 실패 시 Gemini fallback.
- **의도적 제외(차기)**: 측면 사진(둘레 ±5mm), percentile 코호트, segmentation 격자.

## 3. Taxonomy (확정, ADR-108)

```
측정(proportion)                      스타일링(주)
BodyShape7 ──mapper(shape7→type3)──▶ BodyType3(S/W/N)
(과일형, 측정)                        (골격, 헤어·메이크업·코디)
```

- 저장: `body_analyses.body_type` = **S/W/N**(스타일링 일관) + `ratio`(측정 비율) + 측정 메타.
- 매퍼: `lib/body/mapper.ts`의 `shape7ToType3`(또는 동등) 재사용 — 신규 매핑 작성 금지(P4).

## 4. 원자 분해 (P3)

| 원자                              | 입력                 | 출력                                                             | 성공 기준                                            | 의존성                                                    |
| --------------------------------- | -------------------- | ---------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| **A1** 클라이언트 측정 어댑터     | 전신 이미지(dataURL) | `{ ratios: BodyRatios, shape7: BodyShape7, confidence } \| null` | 정면 전신 사진서 비율 산출, 실패 시 null(throw 금지) | body-v2 `detectPose/calculateBodyRatios/classifyBodyType` |
| **A2** 통합 입력 스키마 확장      | —                    | zod `measuredBody?` 필드                                         | 기존 입력 호환(optional)                             | `integrated/types.ts`                                     |
| **A3** body 어댑터 측정 우선 분기 | `input.measuredBody` | bodyShape(S/W/N)·ratio·source                                    | 측정 있으면 매퍼로 S/W/N, 없으면 기존 Gemini 경로    | A2, mapper                                                |
| **A4** 측정 메타 저장             | 측정 결과            | `body_analyses.ratio` + `measurement_source`                     | 측정/추정 구분 저장                                  | A3                                                        |
| **A5** UI 신뢰도 표기             | source               | "측정 기반"/"AI 추정" 배지                                       | 사용자가 출처 구분                                   | A3                                                        |

> A4의 `measurement_source` 컬럼은 신규 → 마이그레이션 필요(`ALTER TABLE body_analyses ADD COLUMN IF NOT EXISTS measurement_source TEXT`). 없으면 `ratio` 정밀도만으로 구분(컬럼 생략 가능, A4 선택).

## 5. 인터페이스

### A1 클라이언트 측정 어댑터 (신규 `lib/analysis/body-v2/measure-client.ts` 또는 컴포넌트 훅)

```typescript
export interface MeasuredBody {
  ratios: BodyRatios; // 어깨/허리/힙 폭 (calculateBodyRatios 결과)
  shape7: BodyShape7; // 측정 기반 7형
  confidence: number; // 0~1 (랜드마크 visibility 기반)
}

/** 전신 이미지에서 측정 비율 산출. 실패(랜드마크 부족 등) 시 null. */
export async function measureBodyClient(imageDataUrl: string): Promise<MeasuredBody | null>;
```

### A2 통합 입력 (`lib/analysis/integrated/types.ts`)

```typescript
// 기존 bodyImageBase64 아래 추가 (optional, 클라이언트가 채움)
measuredBody: z
  .object({
    shoulderWidth: z.number(),
    waistWidth: z.number(),
    hipWidth: z.number(),
    shape7: z.string(),
    confidence: z.number().min(0).max(1),
  })
  .optional(),
```

### A3 body 어댑터 분기 (`axis-adapters.ts`, 기존 Gemini 분기 _앞_)

```typescript
// 측정값 우선: 클라이언트 MediaPipe 비율이 있으면 매퍼로 S/W/N 도출
if (input.measuredBody && input.measuredBody.confidence >= 0.5) {
  const m = input.measuredBody;
  const shape7 = normalizeToBodyShape7(m.shape7);        // string → BodyShape7 | null
  if (shape7) {
    bodyShape = mapBodyShape7ToBodyType3(shape7);        // S/W/N (lib/body)
    shoulderToWaistRatio = m.shoulderWidth / m.waistWidth;
    measurementSource = 'measured';
    usedFallback = false;
  }
}
if (measurementSource !== 'measured' && !isMockMode() && hasBodyImage && input.bodyImageBase64) {
  // 기존 Gemini 경로 (측정 실패/저신뢰 fallback) — Gemini 5형도 매퍼로 S/W/N 통일
  ...
  measurementSource = 'estimated';
}
```

## 6. Mock / 테스트

- A1: jsdom에 MediaPipe CDN 없음 → `measureBodyClient`는 테스트에서 `detectPose` mock으로 고정 랜드마크 주입 → 비율/shape7 결정성 검증.
- A3: `measuredBody`(confidence 0.8) 주입 시 `body_type`이 매퍼 기대값(S/W/N) + `source='measured'`인지. confidence 0.3이면 Gemini 경로로 떨어지는지.
- 회귀: `measuredBody` 미전달 시 기존 동작 100% 동일(Gemini/mock).

## 7. 비고

- 멀티앵글(측면)·percentile은 본 스펙 범위 외 → 차기 SDD.
- `measureBodyClient`는 통합 플로우의 전신 업로드 단계(클라이언트 컴포넌트)에서 제출 직전 1회 호출, 결과를 API 페이로드에 첨부.
- 매퍼/타입은 `lib/body` 공개 API(barrel) 통해서만 import (P8). 단 `mapBodyShape7ToBodyType3`·`normalizeToBodyShape7`이 `lib/body/index.ts` barrel에 미export면 **구현 시 barrel에 추가** 필요(현재 classify/ratios만 export 확인됨).

---

**관련**: [ADR-108](../adr/ADR-108-axis-accuracy-upgrade-roadmap.md) · [body-mechanics.md](../principles/body-mechanics.md) · [SDD-BODY-ANALYSIS-v2.md](./SDD-BODY-ANALYSIS-v2.md)
