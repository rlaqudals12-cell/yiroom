# SDD: 3D 체형 아바타 시각화 (Body Avatar 3D)

> **ADR**: [ADR-110](../adr/ADR-110-3d-body-avatar-visualization.md) (accepted 2026-07-08)
> **원리**: [avatar-3d.md](../principles/avatar-3d.md)
> **리서치**: `docs/research/claude-ai-research/2026-07-06-3d-body-avatar-roadmap.md`

---

## 1. 개요

체형 축(`body_analyses`)의 저장 데이터를 **결정론적 순수 함수**로 3D 아바타 파라미터에 매핑하고, 절차적 파라메트릭 메시(타원 단면 로프팅 + 캡슐 사지)를 Three.js로 렌더한다. AI 호출 없음, 에셋 파일 없음(SMPL 에셋 라이선스 회피), cm 수치 미표시.

### 표면 (v1)

| 표면                         | 처리                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| 체형 결과 페이지 (Layer 0.5) | 기존 `AnonymousBodyTemplate`(2D SVG) 자리에 3D 아바타. WebGL 실패/로딩 중 = 기존 2D 폴백 |
| 프로필 체형 축 카드          | **의도적 제외** — 격자 셀이 소형이라 3D 부적합. 카드 → 결과 페이지 진입이 곧 아바타 진입 |
| 재분석 오버레이 비교         | 직전 분석에 ratio가 있을 때만 고스트 중첩 토글 노출                                      |

## 2. 입출력 스펙

### 2.1 파라미터 도출 — `deriveAvatarParams`

```typescript
// lib/avatar/types.ts
export interface AvatarMorphs {
  /** 어깨 폭 (0-1) */
  shoulder: number;
  /** 허리 폭 (0-1) — 클수록 굵음 */
  waist: number;
  /** 힙 폭 (0-1) */
  hip: number;
  /** 골격감/프레임 (0-1) — 사지·관절 굵기 */
  frame: number;
}

export type AvatarTier = 'preset' | 'ratio' | 'full';

export interface AvatarParams {
  bodyType: 'S' | 'W' | 'N';
  morphs: AvatarMorphs;
  /** preset=타입만 / ratio=비율 보정 / full=body_ratios 전체 */
  tier: AvatarTier;
}

/** body_analyses 행에서 아바타에 필요한 부분집합 (컬럼 실재 prod 검증 완료 2026-07-08) */
export interface BodyRowForAvatar {
  body_type: string | null;
  ratio: number | string | null; // DECIMAL — supabase-js가 string 반환 가능
  shoulder: number | null; // 구 V1 행: 0-100 점수
  waist: number | null;
  hip: number | null;
  body_ratios?: Record<string, number> | null; // 신규 JSONB (Tier full)
}

// lib/avatar/params.ts
export function deriveAvatarParams(row: BodyRowForAvatar): AvatarParams;
```

**도출 규칙 (우선순위 순, 원리 §2.1)**:

1. `body_type` 정규화: 'S'|'W'|'N' 외 값(레거시 풀네임 등) → 매핑 실패 시 'S'. 프리셋 모프 적용:
   - S: `{ shoulder: 0.62, waist: 0.48, hip: 0.52, frame: 0.55 }`
   - W: `{ shoulder: 0.42, waist: 0.38, hip: 0.64, frame: 0.42 }`
   - N: `{ shoulder: 0.58, waist: 0.52, hip: 0.50, frame: 0.68 }`
2. `body_ratios.shoulderToWaistRatio`/`waistToHipRatio` 존재 → tier 'full', 어깨·허리·힙 모프 재계산
3. 아니면 `ratio` 존재 → tier 'ratio', 어깨 모프만 재계산: `wShoulder = clamp01((r − 0.95) / (1.45 − 0.95))`
4. 아니면 구 V1 점수(shoulder/waist/hip 0-100 모두 존재) → 점수비를 비율 프록시로: `r ≈ shoulder/waist` (시각화 근사, 신뢰 주장 아님)
5. 전부 없으면 tier 'preset'

**결정론**: 동일 row → 동일 params (Math.random/Date 금지).

### 2.2 절차적 지오메트리 — `buildAvatarGeometry`

```typescript
// lib/avatar/geometry.ts (three 미의존 — 순수 수학, 테스트 가능)
export interface AvatarGeometryData {
  /** xyz 연속 배열 */
  positions: Float32Array;
  indices: Uint32Array;
}

export function buildAvatarGeometry(params: AvatarParams): AvatarGeometryData;
```

- 몸통: 높이별 타원 단면(어깨→가슴→허리→힙 제어점, 모프가 반지름 스케일) 스무스 보간 로프팅
- 머리(구)·목(원기둥)·팔다리(캡슐, frame 모프가 굵기) — 전부 하나의 positions/indices로 병합
- 정점 수 ≤ 5,000 (모바일 안전권), 노멀은 클라이언트에서 `computeVertexNormals()`
- 단위: 신장 ≈ 1.75 (무차원 — cm 아님), 원점 = 발바닥 중앙

### 2.3 저장 확장 (Tier full 데이터 축적)

- **마이그레이션**: `body_analyses`에 `body_ratios JSONB` 추가 (+ prod gap-apply, `measurement_source` 20260619도 동반 gap-apply)
- **통합 입력 확장**: `measuredBody`에 `ratios?: Record<string, number>` 추가 — 클라이언트 `measureBodyClient`가 이미 계산하는 `BodyRatios` 전체를 전송
- **통합 저장**: `runBodyAxis`가 `body_ratios`에 저장 (없으면 null — 하위호환)
- **유령 #13 수리**: 단독 `/api/analyze/body-v2` 라우트의 `body_assessments` insert → `body_analyses`로 정렬 (prod에 테이블 부재로 저장 전멸 상태였음)

### 2.4 렌더 컴포넌트

```
components/avatar/
├── BodyAvatar3D.tsx        # 'use client' Three.js 렌더 (직접 import 금지 — dynamic 전용)
└── BodyAvatarSection.tsx   # dynamic import + WebGL 감지 + 2D 폴백(AnonymousBodyTemplate) + 비교 토글
```

- `next/dynamic` + `ssr: false`, 로딩 중 = 2D 폴백 (레이아웃 시프트 방지: 동일 컨테이너 크기)
- 드래그 회전(포인터) + 미조작 시 저속 자동 회전. OrbitControls 미사용(three/examples 의존 회피)
- 오버레이 비교: `previous?: AvatarParams` 전달 시 반투명 고스트 메시 중첩 + 토글
- 스타일: 중립 단색(theme 토큰), 얼굴 디테일 없음

## 3. 원자 분해 (P3)

| 원자 | 내용                                                        | 산출물                                         | 의존 |
| ---- | ----------------------------------------------------------- | ---------------------------------------------- | ---- |
| AV-1 | 파라미터 도출 + 타입                                        | `lib/avatar/{types,params,index}.ts` + 테스트  | —    |
| AV-2 | 절차적 지오메트리                                           | `lib/avatar/geometry.ts` + 테스트              | AV-1 |
| AV-3 | 마이그레이션 + prod gap-apply                               | `supabase/migrations/20260708_body_ratios.sql` | —    |
| AV-4 | 저장 확장(통합 ratios 전송·저장) + body-v2 라우트 정렬(#13) | types/page/axis-adapter/route 수정             | AV-3 |
| AV-5 | Three.js 렌더 + 폴백 섹션                                   | `components/avatar/*`                          | AV-2 |
| AV-6 | 결과 페이지 배선 (+직전 분석 비교)                          | body result page 수정                          | AV-5 |

## 4. 검증 기준 (원리 §4)

- [x] 결정론: 동일 입력 반복 → positions 배열 동일 (geometry.test.ts)
- [x] 단조성: ratio ↑ → shoulder 모프 ↑, 힙 모프 ↑ → 단면 ↑ (params/geometry 테스트)
- [x] S/W/N 프리셋 3종 파라미터·실루엣 구분 (테스트) + 정면/측면 투영 스모크 육안 확인 (2026-07-08)
- [x] 구 V1 행(점수만)·최신 통합 행(ratio만)·빈 행 전부 tier 강등으로 안전 (params.test.ts, prod 7행 형태 커버)
- [x] 초기 번들 영향 0 — three는 BodyAvatarSection의 dynamic chunk에만 존재 (ssr:false)
- [x] WebGL 미지원 → 2D 실루엣 폴백 (BodyAvatarSection.test.tsx — row 없음/onRenderFailed 분기)
- [x] typecheck 0 에러 + lint 0 에러 + 신규 테스트 20건 그린(+영향 테스트 body-v2 22·integrated 82·useUserMatching 13), 전체 스위트 실패 수 = 클린 트리 기준선과 동일(445건 기존 문제, 변경 무관 확인)

## 5. 의도적 제외 (v1)

| 항목                       | 이유                               | 재검토         |
| -------------------------- | ---------------------------------- | -------------- |
| 프로필 격자 카드 내 3D     | 소형 셀·성능. 결과 페이지가 진입점 | 사용 데이터 후 |
| 모바일(RN) 3D              | expo-gl 검증 필요                  | 웹 v1 검증 후  |
| cm 수치 표시               | 원칙 (스케일 모호성·ZOZOSUIT)      | 안 함          |
| 통합 결과 페이지 내 아바타 | 결과 페이지 1곳 집중 (P4)          | v1 반응 후     |

---

**Version**: 1.0 | **Created**: 2026-07-08 | **Status**: 구현 완료 (웹 v1 — 모바일 패리티는 의도적 제외)
