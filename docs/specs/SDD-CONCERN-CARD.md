# SDD: ConcernCard 시각화 패턴

> **상태**: 구현 중 (In Progress)
> **날짜**: 2026-03-07
> **ADR**: [ADR-077](../adr/ADR-077-concern-card-pattern.md)
> **원칙**: [UX Design Principles V1-V5](../principles/ux-design.md#8-시각화-원칙-visualization-principles)
> **궁극의 형태**: 피부 고민별 Gemini 일러스트 + 점수 + 동적 팁 + 드릴다운 (목표: 80%)

---

## 1. 배경 및 목표

### 현재 문제

- Layer 1 (Concern Overview) 완전 부재 — Layer 0(점수)에서 바로 Layer 2(MetricBarGaugeList)
- MetricBarGaugeList 7-8개 세로 나열 → 스크롤 30초, 전체 파악 어려움
- basic 탭 정보 블록 17-22개 → Miller's Law 위반

### 목표

| 지표                  | 현재  | 목표 |
| --------------------- | ----- | ---- |
| Layer 1 달성          | 0%    | 80%  |
| 전체 리포트           | 70%   | 85%  |
| 화면 정보 청크        | 17-22 | 6    |
| 전체 메트릭 파악 시간 | 30초+ | 3초  |

---

## 2. 컴포넌트 스펙

### ConcernCard Props

```typescript
interface ConcernCardProps {
  id: string;
  icon: React.ReactNode;
  illustration?: string; // Phase B: Gemini 이미지
  label: string;
  score: number; // 0-100
  severity: 'good' | 'normal' | 'warning';
  severityLabel: string;
  tip: string;
  onExpand?: () => void;
  className?: string;
}
```

### ConcernGrid Props

```typescript
interface ConcernGridProps {
  items: ConcernCardItem[];
  onCardExpand?: (id: string) => void;
  className?: string;
}

interface ConcernCardItem {
  id: string;
  icon: React.ReactNode;
  illustration?: string;
  label: string;
  score: number;
  severity: 'good' | 'normal' | 'warning';
  severityLabel: string;
  tip: string;
}
```

### 심각도 기준

| 점수  | severity | severityLabel | 색상    | 아이콘      |
| ----- | -------- | ------------- | ------- | ----------- |
| 70+   | good     | 좋음          | emerald | CheckCircle |
| 40-69 | normal   | 보통          | amber   | Minus       |
| <40   | warning  | 관리 필요     | rose    | AlertCircle |

---

## 3. 피부 메트릭 매핑

| 메트릭   | id           | 아이콘      | 그라디언트 | 팁 (warning)                  |
| -------- | ------------ | ----------- | ---------- | ----------------------------- |
| 수분도   | hydration    | Droplets    | blue       | 히알루론산 세럼으로 수분 충전 |
| 유분도   | oilBalance   | Flame       | amber      | 유분 조절 토너 사용 추천      |
| 모공     | ppiore       | CircleDot   | slate      | 주 2회 클레이 마스크 추천     |
| 주름     | wrinkles     | Activity    | purple     | 레티놀 크림으로 주름 관리     |
| 탄력     | elasticity   | Sparkles    | pink       | 콜라겐 부스터 세럼 추천       |
| 색소침착 | pigmentation | Eye         | orange     | 비타민C 세럼으로 꾸준히 관리  |
| 트러블   | trouble      | AlertCircle | red        | 살리실산(BHA) 스팟 케어 추천  |
| 민감도   | sensitivity  | Shield      | emerald    | 판테놀 진정 크림 사용 추천    |

---

## 4. 삽입 위치 (AnalysisResult.tsx)

```
변경 전:
  CircularProgress → Best/Focus → PhotoOverlay → MetricBarGaugeList → AI Insight → ...

변경 후:
  CircularProgress → Best/Focus → [ConcernCardGrid] → PhotoOverlay → [MetricBarGaugeList in Collapsible] → AI Insight → ...
```

---

## 5. 파일 계획

### 신규 파일 (4개)

| 파일                                          | 설명                   |
| --------------------------------------------- | ---------------------- |
| `types/analysis-concern.ts`                   | ConcernCard 공통 타입  |
| `components/analysis/common/ConcernCard.tsx`  | 공통 카드 컴포넌트     |
| `components/analysis/common/ConcernGrid.tsx`  | 2열 반응형 그리드      |
| `components/analysis/skin/SkinConcernData.ts` | 8개 메트릭 매핑 데이터 |

### 수정 파일 (2개)

| 파일                                                      | 변경                                              |
| --------------------------------------------------------- | ------------------------------------------------- |
| `app/(main)/analysis/skin/_components/AnalysisResult.tsx` | ConcernGrid 삽입 + MetricBarGaugeList Collapsible |
| `app/(main)/analysis/skin/result/[id]/page.tsx`           | evidence 탭에 ConcernGrid 통합                    |

---

## 6. 테스트 계획

### 단위 테스트 (8+)

| 테스트                             | 파일                    |
| ---------------------------------- | ----------------------- |
| ConcernCard 렌더링                 | ConcernCard.test.tsx    |
| severity별 색상/아이콘             | ConcernCard.test.tsx    |
| ConcernGrid 정렬 (Strengths-First) | ConcernGrid.test.tsx    |
| ConcernGrid 빈 배열 처리           | ConcernGrid.test.tsx    |
| getSeverity 경계값 (39/40/69/70)   | SkinConcernData.test.ts |
| getTipForScore 동적 팁 생성        | SkinConcernData.test.ts |
| mapSkinMetrics 8개 전체 매핑       | SkinConcernData.test.ts |
| onExpand 콜백 호출                 | ConcernCard.test.tsx    |

### data-testid

- concern-card-{id}
- concern-grid
- concern-severity-badge
- metric-collapsible-trigger

---

## 7. 의도적 제외 (이번)

| 항목                             | 이유                            |
| -------------------------------- | ------------------------------- |
| Gemini 일러스트 (Phase B)        | 아이콘 먼저, 이미지는 후속      |
| 크로스-모듈 확장 (Body/Hair/...) | 피부만 먼저, 다른 모듈은 후속   |
| 이전 대비 변화 표시              | DB 데이터 있으나 UI 복잡도 증가 |
| S-2 정량 분석 고도화             | 별도 Phase                      |

---

## 8. 성공 기준

| 기준            | 측정 방법                        |
| --------------- | -------------------------------- |
| typecheck 통과  | npm run typecheck 0 errors       |
| lint 통과       | npm run lint 0 errors            |
| 테스트 통과     | 신규 8+ 테스트 pass              |
| 정보 청크 6개   | basic 탭 청크 수 카운트          |
| Strengths-First | 카드 점수 내림차순 확인          |
| Triple Encoding | 각 severity에 색상+아이콘+텍스트 |

---

**Version**: 1.0 | **Created**: 2026-03-07
