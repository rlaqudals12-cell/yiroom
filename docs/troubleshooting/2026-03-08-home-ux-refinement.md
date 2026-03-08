# 홈 화면 UX 정제 — 반복 점검 기반 개선

> **날짜**: 2026-03-08
> **영향 파일**: HomeAnalysisSummary, HomeDailyCapsuleWidget, HomeActivityBar, InternalizationWidget, ActiveInsightCard
> **심각도**: 중간
> **상태**: 해결됨

---

## 1. 개요

`/ux-check` 명령어를 활용한 반복 점검 사이클로 홈 대시보드 UX를 67% → 97%로 개선.
4개 커밋에 걸쳐 7개 실패 항목을 순차적으로 수정.

---

## 2. 발견된 이슈 및 해결

### 2.1 터치 영역 44px 미달 (B2)

**증상**: HomeDailyCapsuleWidget 체크 버튼, HomeAnalysisSummary CTA 버튼이 44px 미만

**원인**: `p-2` 또는 작은 아이콘 버튼에 최소 크기 미지정

**해결**: `min-h-[44px] min-w-[44px]` 적용

**커밋**: `dd45a733`

### 2.2 에러 상태 UI 부재 (C2, KI-006)

**증상**: HomeActivityBar에서 데이터 로드 실패 시 빈 화면 표시, console.error만 출력

**원인**: try-catch에서 에러 상태를 UI에 반영하지 않음

**해결**: `hasError` 상태 변수 + 에러 UI 분기 추가, console.error 제거

**커밋**: `84174b7b`

**교훈**: 데이터 fetch 패턴에서 `[data, isLoading, hasError]` 3종 상태를 항상 포함

### 2.3 성장 감정 메시지 조건부 표시 (D7)

**증상**: InternalizationWidget의 "자립적 판단" 메시지가 independent > 0일 때만 표시, 초기 사용자에게 빈 영역

**원인**: 성장 인정 메시지를 최상위 단계에만 조건부 렌더링

**해결**: 3단계 분기 메시지로 변경 (independent > 0 / rate >= 50 / 기본)

**커밋**: `226e3b5f`

### 2.4 분석 가치 서사 부재 (E2)

**증상**: 미완료 분석 CTA가 "분석해보기"만 표시, 왜 해야 하는지 동기 부여 없음

**원인**: ANALYSIS_META에 가치 설명 필드 없음

**해결**: `valueHint` 프로퍼티 추가 (예: "나에게 어울리는 색을 알면 선택이 쉬워져요")

**커밋**: `226e3b5f`

### 2.5 캡슐 빈 상태 없음 (G2)

**증상**: HomeDailyCapsuleWidget이 데이터 없을 때 `return null`로 사라짐

**원인**: 빈 상태 UI 미구현

**해결**: 안내 메시지 + Sparkles 아이콘 빈 상태 UI 추가

**커밋**: `226e3b5f`

### 2.6 이야기형 전달 없음 (E7)

**증상**: 완료된 분석 카드가 "봄 웜톤", "66점" 등 결과값만 표시, 맥락 없음

**원인**: 결과 요약이 숫자/라벨 중심, 사용자에게 의미 전달 부재

**해결**: `narrative` 프로퍼티 추가 (예: "나에게 어울리는 색상 톤이에요") + 서브텍스트로 표시

**커밋**: `1af9ef9d`

---

## 3. 영향 파일

| 파일                         | 변경 내용                  |
| ---------------------------- | -------------------------- |
| `HomeAnalysisSummary.tsx`    | valueHint + narrative 추가 |
| `HomeDailyCapsuleWidget.tsx` | 빈 상태 UI                 |
| `HomeActivityBar.tsx`        | hasError 상태 + 에러 UI    |
| `InternalizationWidget.tsx`  | 3단계 성장 메시지          |
| `ActiveInsightCard.tsx`      | 터치 영역 수정 (이전 커밋) |

---

## 4. 교훈

1. **반복 점검 사이클의 효과**: `/ux-check` 1회 → 수정 → 재점검으로 67% → 97% 달성
2. **KI-006 패턴 일반화**: 데이터 fetch에는 항상 `[data, loading, error]` 3종 상태 필수
3. **이야기형 전달(E7)**: 숫자/라벨만으로는 사용자에게 의미를 전달할 수 없음. 맥락 서브텍스트 필수
4. **빈 상태/에러 상태 누락**: 컴포넌트 작성 시 Happy Path만 구현하면 C1~C3 실패. 초기 설계에 3종 상태 포함
5. **valueHint vs narrative 구분**: CTA에는 동기부여(valueHint), 완료 카드에는 맥락 설명(narrative)

---

**Version**: 1.0 | **Created**: 2026-03-08
