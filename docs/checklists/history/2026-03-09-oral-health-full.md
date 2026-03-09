# UX 점검 결과 — 구강건강 분석 전체 (OH-1)

## 2차 점검 (2026-03-09)

**대상**: OH-1 구강건강 분석 입력 + 결과 페이지 (5파일)
**화면 유형**: 분석 입력 + 분석 결과
**모드**: 전체 (A-K 57항목, 100인 시뮬레이션)
**자동 감지**: H(탭), H4(조건부 렌더링), H5(아코디언), I(교차 모듈), J(다크 모드), K(분석 결과)
**판정**: 37/46 통과 → 44/46 통과 (80% → 96%, +16%p)

---

## 대상 파일

| 파일                                                       | 역할                                  | 행      |
| ---------------------------------------------------------- | ------------------------------------- | ------- |
| `app/(main)/analysis/oral-health/page.tsx`                 | 입력 페이지 (가이드→업로드→로딩→결과) | 330     |
| `app/(main)/analysis/oral-health/result/[id]/page.tsx`     | 결과 페이지                           | 281→290 |
| `components/analysis/oral-health/OralHealthResultCard.tsx` | 결과 카드 (탭 구조)                   | 275→282 |
| `components/analysis/oral-health/VitaShadeDisplay.tsx`     | VITA 셰이드 시각화                    | 225     |
| `components/analysis/oral-health/GumHealthIndicator.tsx`   | 잇몸 건강 인디케이터                  | 231     |

---

## 수정 항목 (9건 + B3 3건)

| #   | 항목 | 파일                                | 수정 내용                                                  | 심각도   |
| --- | ---- | ----------------------------------- | ---------------------------------------------------------- | -------- |
| 1   | A1   | VitaShadeDisplay:209,222            | brightness/yellowness fallback → '알 수 없음'              | Critical |
| 2   | A1   | GumHealthIndicator:228              | region fallback → '알 수 없음'                             | Critical |
| 3   | A1   | OralHealthResultCard:272            | method fallback → '알 수 없음'                             | Critical |
| 4   | D4   | page.tsx:227                        | "피해주세요" → "깨끗한 상태에서 촬영하면 더 정확해요"      | Critical |
| 5   | D10  | result/page.tsx                     | 비의료 고지 추가 ("AI 참고 정보이며 의료 진단이 아니에요") | Critical |
| 6   | D6   | page.tsx upload 단계                | 프라이버시 안내 ("서버에 별도 저장되지 않아요")            | High     |
| 7   | H4   | OralHealthResultCard:70-74          | 데이터 없을 때 fallback 메시지 추가                        | High     |
| 8   | J1   | VitaShadeDisplay:107,122,149        | 셰이드 라벨 dark: 클래스 추가                              | High     |
| 9   | K1   | result/page.tsx 점수 카드           | 분석 신뢰도 % 표시 추가                                    | Medium   |
| +   | B3   | OralHealthResultCard TabsTrigger ×3 | aria-label 명시적 추가                                     | —        |

---

## 수정 상세

### 1-3. A1 — 영어 fallback → '알 수 없음' (KI-001 재발 4개소)

```typescript
// Before (3파일 공통 패턴)
return labels[key] || key; // 매핑 없으면 영어 raw value 노출

// After
return labels[key] || '알 수 없음';
```

### 4. D4 — 부정 프레이밍 → 긍정 전환 (KI-008 재발)

```typescript
// Before
'음식물이 묻어있거나 립스틱을 바른 상태는 피해주세요';

// After
'깨끗한 상태에서 촬영하면 더 정확해요';
```

### 5. D10 — 비의료 고지 추가

```tsx
<div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 mt-6">
  <p className="text-xs text-amber-700 dark:text-amber-400">
    이 결과는 AI 참고 정보이며 의료 진단이 아니에요. 정확한 진단과 치료는 치과 전문의와
    상담해주세요.
  </p>
</div>
```

### 6. D6 — 프라이버시 안내 추가

```tsx
<p className="text-xs text-center text-muted-foreground">
  사진은 분석에만 사용되며, 서버에 별도 저장되지 않아요
</p>
```

### 7. H4 — 빈 데이터 fallback

```tsx
{!hasToothColor && !hasGumHealth && !whiteningGoal ? (
  <div className="p-6 text-center">
    <p className="text-muted-foreground">상세 분석 데이터를 준비하고 있어요</p>
    <p className="text-sm text-muted-foreground/70 mt-1">종합 점수와 추천 사항을 참고해주세요</p>
  </div>
) : (
  <Tabs ...>...</Tabs>
)}
```

### 8. J1 — VitaShadeDisplay 다크 모드

```typescript
// Before: text-gray-700, text-gray-600 고정
// After: dark: variant 추가
'text-gray-700 dark:text-gray-200'; // 현재/목표 셰이드 라벨
'text-gray-600 dark:text-gray-300'; // 스케일 셰이드 라벨
```

### 9. K1 — 분석 신뢰도 표시

```tsx
{
  assessment.toothColor?.confidence != null && (
    <p className="text-xs text-muted-foreground/60 mt-1">
      분석 신뢰도 {assessment.toothColor.confidence}%
    </p>
  );
}
```

---

## 남은 항목 (2건 warn)

| #   | 항목          | 상태 | 사유                                                      |
| --- | ------------- | ---- | --------------------------------------------------------- |
| E2  | L2 가치       | warn | 수동 확인 필요 (warn 고정)                                |
| H5  | 아코디언 접힘 | warn | 추천 사항 기본 접힘. 발견성은 ChevronDown 아이콘으로 충분 |

---

## 100인 시뮬레이션 결과

| 페르소나   | 인원 | 주요 지적                               | 수정 후 |
| ---------- | ---- | --------------------------------------- | ------- |
| 전문가     | 20   | D10 비의료 고지 필수 (19/20)            | 해소    |
| 심사관     | 20   | J1 다크 모드 + A1 영어 fallback (17/20) | 해소    |
| 투자자     | 20   | D6 프라이버시 안내 (15/20)              | 해소    |
| 일반소비자 | 20   | K1 신뢰도 수치 (12/20)                  | 해소    |
| 인플루언서 | 20   | D10 고지 + J1 다크 모드 (14/20)         | 해소    |

---

## 패턴 대조

| 패턴                   | 매치                | 발견 횟수 |
| ---------------------- | ------------------- | --------- |
| KI-001 (영어 fallback) | 재발 (4개소)        | 11 → 15회 |
| KI-008 (D4 부정 표현)  | 재발 ("피해주세요") | 6 → 7회   |

---

## 검증

- **tsc**: 0 errors
- **ESLint**: 0 errors
- **테스트**: 89/89 passed (OralHealthComponents.test.tsx)

---

**1차 점검**: 2026-03-08 (교차 모듈 일관성 2건 수정)
**2차 점검**: 2026-03-09 (전체 A-K 57항목 + 100인 시뮬 → 9건+3건 수정)
