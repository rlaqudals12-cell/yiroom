# ADR-066: SSOT 통합 전략 (Single Source of Truth Consolidation)

> **상태**: 승인됨 (v2 — 수치 교정, Phase 재정의)
> **작성일**: 2026-02-06
> **수정일**: 2026-02-07
> **결정자**: 개발팀
> **관련 원칙**: P2 (원리 우선), P4 (단순화), P8 (모듈 경계)

---

## 컨텍스트

프로젝트 전체 타입 정의 및 색상 변환 함수 조사 결과, 동일한 타입/함수가 다수 독립적으로 정의되어 있음을 발견. 유지보수 비용 증가, 인지 부담, 잠재적 불일치 버그 발생.

### 발견된 SSOT 위반 (v2 검증 수치)

| 심각도       | 문제                                              | 실제 수 |
| ------------ | ------------------------------------------------- | ------- |
| **CRITICAL** | Season 타입 독립 정의 (lowercase/PascalCase 혼재) | 12곳+   |
| **CRITICAL** | LabColor 인터페이스 중복 정의                     | 5곳     |
| **CRITICAL** | RGBColor 인터페이스 중복 정의                     | 4곳     |
| **HIGH**     | rgbToLab 독립 구현 (상수 불일치 포함)             | 7곳     |
| **HIGH**     | CIEDE2000 독립 구현                               | 4곳     |
| **HIGH**     | Hair 모듈 P8 위반 (내부 파일 직접 import)         | 2곳     |
| **MEDIUM**   | BodyType 3개 시스템 (도메인이 다름 — 통합 불필요) | 3곳     |

> **참고**: 초기 조사(v1)에서 `'fall'` vs `'autumn'` 버그를 보고했으나, v2 검증 시 코드베이스에서 `'fall'` 값 미발견. 이미 수정되었거나 미존재로 판단하여 Phase 0 삭제.

### rgbToLab 7개 구현 상세

| #   | 파일                                            | 상수               | 비고         |
| --- | ----------------------------------------------- | ------------------ | ------------ |
| 1   | `lib/analysis/personal-color/color-space.ts`    | `216/24389` (정밀) | V1           |
| 2   | `lib/analysis/personal-color-v2/lab-utils.ts`   | `216/24389` (정밀) | V2           |
| 3   | `lib/analysis/personal-color-v2/color-space.ts` | `(6/29)^3` (동치)  | V2 내부 중복 |
| 4   | `lib/color-classification/color-utils.ts`       | `(6/29)^3` (동치)  |              |
| 5   | `lib/analysis/skin/zone-analysis.ts`            | `0.008856` (근사)  | private      |
| 6   | `lib/analysis/skin/six-zone-analysis.ts`        | `0.008856` (근사)  | private      |
| 7   | `lib/oral-health/internal/lab-converter.ts`     | `(6/29)^3` (동치)  |              |

> **주의**: personal-color-v2 내에서 `lab-utils.ts`와 `color-space.ts`가 동일 모듈 내 중복 구현. 모듈 간 SSOT뿐 아니라 모듈 내부 중복도 처리 대상.

---

## 결정

### 할 것

1. **`lib/shared/integration-types.ts`를 웹 앱의 SSOT로 확정** — RGBColor, XYZColor 추가
2. **새 `lib/color/` 모듈 생성** — 7개 독립 색상 변환 구현을 1개로 통합
3. **4단계 Phase로 점진적 마이그레이션** — 각 Phase 독립 커밋/롤백 가능
4. **V1 정밀 CIE 상수 기반** — `216/24389`, `24389/27` (CIE 15:2004 표준)

### 하지 않을 것 (상세 근거 포함)

| 항목                                               | 이유                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/shared` PascalCase 통일                  | 모바일 10개 파일 깨짐, 웹에서 import 0개, ROI 없음                                   |
| V1/V2 KOREAN_ADJUSTMENTS 병합                      | 의도적으로 다른 알고리즘 파라미터 (V1: 6개, V2: 4개), 구조적 차이                    |
| API Route Factory 패턴                             | OCP 원칙 (작동하는 코드 리팩토링 금지), P4 위반 (과도한 추상화)                      |
| BodyType 3개 시스템 통합                           | 서로 다른 도메인 (의학적 8종 vs 패션 5종 vs 어필리에이트 3종), 강제 통합=도메인 파괴 |
| packages/shared를 웹에서 사용                      | PascalCase/lowercase 충돌, 이중 SSOT 위험, 변경 영향 전파                            |
| Mock 데이터 구조 통합                              | P8 캡슐화 부합, 독립 배포 유지, ROI 없음                                             |
| PascalCase Season 통일 (workout/product/nutrition) | 해당 모듈에서 PascalCase로 일관 사용 중, 변경 시 연쇄 영향 큼. 별도 ADR 필요         |

---

## 실행 계획

```
Phase 1: feat — RGBColor, XYZColor, LabColor 타입 SSOT 확정 (additive only)
Phase 2: feat — lib/color/ 통합 모듈 생성 (index.ts, conversions.ts, ciede2000.ts, types.ts)
Phase 3: refactor — 4개 서브페이즈로 import 마이그레이션 (~35-45파일)
  3a: personal-color/ (V1) — 타입 + 함수 import 변경
  3b: personal-color-v2/ (V2) — 타입 + 함수 import 변경, 내부 중복 제거
  3c: skin/ + color-classification/ — 타입 + 함수 import 변경
  3d: oral-health/ + a11y/ — 타입 + 함수 import 변경
Phase 4: fix — Hair 모듈 P8 위반 수정 (내부 파일 직접 import → barrel export)
```

### 의존성 그래프

```
Phase 1 → Phase 2 → Phase 3a (독립)
                   → Phase 3b (독립)
                   → Phase 3c (독립)
                   → Phase 3d (독립)
Phase 4 ──── (독립, Phase 1 이후 언제든 가능)
```

### Phase 3 서브페이즈 상세

| 서브   | 대상 모듈                                               | 예상 파일 수 | 주요 작업                                                      |
| ------ | ------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| **3a** | `lib/analysis/personal-color/`                          | 5-7          | LabColor/rgbToLab/CIEDE2000 → `lib/color/`                     |
| **3b** | `lib/analysis/personal-color-v2/`                       | 8-10         | 위 동일 + 모듈 내 `lab-utils.ts` vs `color-space.ts` 중복 해소 |
| **3c** | `lib/analysis/skin/`, `lib/color-classification/`       | 6-8          | rgbToLab(근사상수→정밀) + LabColor/RGBColor → SSOT             |
| **3d** | `lib/oral-health/`, `lib/a11y/`, `types/oral-health.ts` | 5-7          | LabColor/RGBColor/rgbToLab/CIEDE2000 → `lib/color/`            |

> 각 서브페이즈는 독립 커밋/롤백 가능. 테스트 파일 수정 포함.

---

## 대안 및 비교

| 후보                                     | 채택     | 이유                         |
| ---------------------------------------- | -------- | ---------------------------- |
| `lib/shared/integration-types.ts` (기존) | **채택** | 이미 올바른 값 보유, 웹 전용 |
| `packages/shared/src/types/`             | 제외     | PascalCase, 웹에서 미사용    |
| 새 `packages/types/` 생성                | 제외     | 과도한 추상화, P4 위반       |

---

## 영향

- **총 수정 파일**: ~35-45개 (테스트 파일 포함)
- **신규 파일**: 4개 (`lib/color/index.ts`, `conversions.ts`, `ciede2000.ts`, `types.ts`)
- **삭제 코드**: ~600줄+ (7개 rgbToLab + 4개 CIEDE2000 + 5개 타입 중복)
- **위험도**: Phase/서브페이즈별 독립 롤백 가능

---

## 성과 지표

| 지표              | Before   | After         |
| ----------------- | -------- | ------------- |
| LabColor 정의 수  | 5곳      | 1곳           |
| RGBColor 정의 수  | 4곳      | 1곳           |
| rgbToLab 구현 수  | 7곳      | 1곳           |
| CIEDE2000 구현 수 | 4곳      | 1곳           |
| P8 위반           | 2건      | 0건           |
| CIE 상수 불일치   | 3종 혼재 | 정밀 분수 1종 |

---

## 참조

- [ADR-026: Color Space HSL Decision](./ADR-026-color-space-hsl-decision.md)
- [docs/principles/color-science.md](../principles/color-science.md)
