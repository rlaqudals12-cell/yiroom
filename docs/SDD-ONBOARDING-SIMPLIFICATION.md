# SDD: 온보딩 플로우 간소화

> 버전: 1.0
> 작성일: 2026-01-02
> 상태: 구현 완료 (TODO-ISSUES.md 확인)

---

## 1. 개요

### 1.1 목적

운동/영양 온보딩을 7단계에서 3단계로 간소화하여 사용자 이탈률 감소 및 완료율 향상.

### 1.2 핵심 가치

- **빠른 시작**: 온보딩 시간 3-5분 → 1분
- **핵심 데이터 유지**: AI 분석에 필요한 필수 데이터는 유지
- **선택 항목 분리**: 건너뛰기 옵션으로 선택 부담 감소

### 1.3 성공 지표

| 지표             | 현재    | 목표             |
| ---------------- | ------- | ---------------- |
| 온보딩 완료 시간 | 3-5분   | 1분              |
| 단계 수          | 7단계   | 3단계 (57% 감소) |
| 완료율           | 측정 중 | 25% 향상 목표    |

---

## 2. 현재 상태 분석

### 2.1 운동 온보딩 (기존 7단계)

| 단계   | 데이터                     | 필수 | 비고    |
| ------ | -------------------------- | ---- | ------- |
| Step 1 | C-1 체형 + PC-1 퍼스널컬러 | O    | DB 조회 |
| Step 2 | 운동 목표 (2개)            | O    |         |
| Step 3 | 신체 고민 (3개)            | O    |         |
| Step 4 | 운동 빈도                  | O    |         |
| Step 5 | 장소 + 장비                | O    |         |
| Step 6 | 목표 체중/날짜             | X    | 선택    |
| Step 7 | 부상/통증                  | X    | 선택    |

### 2.2 영양 온보딩 (기존 7단계)

| 단계   | 데이터        | 필수 | 비고          |
| ------ | ------------- | ---- | ------------- |
| Step 1 | 식사 목표     | O    |               |
| Step 2 | 신체 정보 5개 | O    | BMR/TDEE 계산 |
| Step 3 | 식사 스타일   | O    |               |
| Step 4 | 요리 실력     | O    |               |
| Step 5 | 식비 예산     | O    |               |
| Step 6 | 알레르기/기피 | X    | 선택          |
| Step 7 | 식사 횟수     | O    |               |

---

## 3. 목표 구조 (3단계)

### 3.1 운동 온보딩

```
[Step 1: 내 정보 + 목표]
├─ C-1 체형 데이터 (읽기전용)
├─ PC-1 퍼스널 컬러 (읽기전용)
├─ 운동 목표 선택 (현 Step 2)
└─ 신체 고민 선택 (현 Step 3, 축소: 상위 4개만)

[Step 2: 운동 환경]
├─ 운동 빈도 (현 Step 4)
├─ 운동 장소 (현 Step 5)
└─ 사용 가능 장비 (현 Step 5)

[Step 3: 건강 정보] (선택사항)
├─ 부상/통증 (현 Step 7)
├─ 목표 체중 (현 Step 6)
└─ 목표 날짜 (현 Step 6)
└─ "건너뛰기" 버튼 추가
```

### 3.2 영양 온보딩

```
[Step 1: 목표 + 기본 정보]
├─ 식사 목표 (현 Step 1)
└─ 신체 정보 5개 (현 Step 2) - BMR/TDEE 필수

[Step 2: 라이프스타일]
├─ 식사 스타일 (현 Step 3)
├─ 요리 실력 (현 Step 4)
└─ 식비 예산 (현 Step 5)

[Step 3: 개인화] (일부 선택)
├─ 알레르기/기피 음식 (현 Step 6, 선택)
└─ 하루 식사 횟수 (현 Step 7, 필수)
└─ 칼로리 계산 결과 미리보기
```

---

## 4. 구현 전략

### 4.1 접근 방식: 단계 통합

- 기존 7개 step 폴더 → 3개로 리매핑
- 기존 로직 최대한 재사용
- Store 구조는 유지 (하위 호환성)
- ProgressIndicator의 totalSteps만 7→3 변경

### 4.2 파일 변경 계획

#### 운동 온보딩

```
수정 파일:
├─ step1/page.tsx → 체형 + 목표 + 고민 통합
├─ step2/page.tsx → 빈도 + 장소 + 장비 통합
├─ step3/page.tsx → 부상 + 목표값 통합

삭제 파일:
├─ step4/ (내용을 step2로 이동)
├─ step5/ (내용을 step2로 이동)
├─ step6/ (내용을 step3로 이동)
├─ step7/ (내용을 step3로 이동)
```

#### 영양 온보딩

```
수정 파일:
├─ step1/page.tsx → 목표 + 신체정보 통합
├─ step2/page.tsx → 스타일 + 실력 + 예산 통합
├─ step3/page.tsx → 알레르기 + 식사횟수 통합

삭제 파일:
├─ step4/ (내용을 step2로 이동)
├─ step5/ (내용을 step2로 이동)
├─ step6/ (내용을 step3로 이동)
├─ step7/ (내용을 step3로 이동)
```

---

## 5. UI 개선

### 5.1 진행률 표시

- 3/3 표시 + 예상 소요 시간 ("약 30초 남음")
- ProgressIndicator 컴포넌트에 `estimatedTime` prop 추가

### 5.2 섹션 구분

- 통합된 페이지 내 섹션 헤더로 구분
- 접이식 섹션 (선택 항목에 활용)

### 5.3 건너뛰기 옵션

- Step 3 (건강 정보)에 "건너뛰고 시작하기" 버튼
- 기본값 적용 후 즉시 결과 페이지로

---

## 6. Store 변경

Store 구조는 유지하되, 메서드 추가:

```typescript
// workoutInputStore.ts 추가
canSkipStep3: () => boolean;  // Step 3 건너뛰기 가능 여부
applyDefaults: () => void;     // 기본값 적용 (건너뛰기 시)
```

---

## 7. 구현 파일

### 운동

- `apps/web/app/(main)/workout/onboarding/step1/page.tsx`
- `apps/web/app/(main)/workout/onboarding/step2/page.tsx`
- `apps/web/app/(main)/workout/onboarding/step3/page.tsx`
- `apps/web/lib/stores/workoutInputStore.ts`

### 영양

- `apps/web/app/(main)/nutrition/onboarding/step1/page.tsx`
- `apps/web/app/(main)/nutrition/onboarding/step2/page.tsx`
- `apps/web/app/(main)/nutrition/onboarding/step3/page.tsx`
- `apps/web/lib/stores/nutritionInputStore.ts`

### 공통

- `apps/web/components/workout/common/ProgressIndicator.tsx`

---

## 8. 위험 요소 & 완화

| 위험               | 영향        | 완화                 |
| ------------------ | ----------- | -------------------- |
| 긴 스크롤          | UX 저하     | 섹션 접이식/아코디언 |
| 데이터 누락        | 분석 정확도 | 기본값 + 나중에 수정 |
| 테스트 실패        | CI 차단     | 테스트 동시 수정     |
| 기존 사용자 데이터 | 호환성      | Store 구조 유지      |

---

## 9. 테스트 체크리스트

- [x] 운동 온보딩 3단계 완료 → result 페이지 정상 이동
- [x] 영양 온보딩 3단계 완료 → result 페이지 정상 이동
- [x] Step 3 건너뛰기 → 기본값 적용 후 result 이동
- [x] Store 데이터 호환성 유지
- [x] TypeScript/Lint 통과

---

## 10. 구현 상태

- **완료일**: 2026-01-02
- **확인**: TODO-ISSUES.md "온보딩 간소화 (7단계 → 3단계) - 운동/영양 온보딩 모두 완료"

---

## 11. 참고

- 계획 문서: `C:/Users/Administrator/.claude/plans/sleepy-mapping-biscuit.md`
- 리서치: [UXUI-TECH-RESEARCH-2026.md](./UXUI-TECH-RESEARCH-2026.md)
- 사례: D2C 피트니스 앱 5단계→2단계 간소화로 완료율 25% 향상
