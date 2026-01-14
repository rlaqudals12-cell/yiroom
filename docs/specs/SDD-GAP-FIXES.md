# SDD: 스펙-구현 갭 해소

> **Status**: In Progress
> **Created**: 2026-01-13
> **Author**: Claude Code
> **Priority**: High

---

## 1. 개요

### 1.1 목적

스펙 문서에 정의되었으나 UI에 구현/연결되지 않은 기능들을 통합하여 사용자 경험 완성도를 높인다.

### 1.2 범위

| #   | 기능                           | 현재 상태                    | 목표                     |
| --- | ------------------------------ | ---------------------------- | ------------------------ |
| 1   | DrapingSimulationTab PC-1 연결 | 컴포넌트 있음, 페이지 미연결 | PC-1 결과에 탭 추가      |
| 2   | ingredientWarnings UI          | 데이터 생성됨, UI 미표시     | 피부 분석 결과에 표시    |
| 3   | PhotoOverlayMap, TrendChart    | 컴포넌트 있음, 미사용        | 피부 분석에 통합         |
| 4   | 드레이핑 피부/체형 연동        | 미구현                       | S-1, C-1에 드레이핑 추가 |

---

## 2. Gap 1: DrapingSimulationTab PC-1 연결

### 2.1 현재 상태

- `components/analysis/visual/DrapingSimulationTab.tsx` 존재
- `components/analysis/visual/index.ts`에서 export됨
- **PC-1 결과 페이지에서 import/사용 안 됨**

### 2.2 변경 사항

**파일**: `app/(main)/analysis/personal-color/result/[id]/page.tsx`

```typescript
// 추가할 import
import { DrapingSimulationTab } from '@/components/analysis/visual';

// Tabs에 추가
<TabsTrigger value="draping">드레이핑</TabsTrigger>

<TabsContent value="draping">
  <DrapingSimulationTab
    seasonType={result.seasonType}
    imageUrl={imageUrl}
    skinAnalysisId={skinAnalysisId} // 연동 시
  />
</TabsContent>
```

### 2.3 테스트 기준

- [ ] PC-1 결과 페이지에 "드레이핑" 탭 표시
- [ ] 시즌 타입에 맞는 드레이핑 컬러 표시
- [ ] 얼굴 이미지에 드레이핑 시뮬레이션 적용

---

## 3. Gap 2: ingredientWarnings UI 표시

### 3.1 현재 상태

- API (`app/api/analyze/skin/route.ts:346-359`)에서 피부타입별 경고 성분 생성
- DB에 `ingredient_warnings` 컬럼으로 저장됨
- 결과 페이지 (`transformDbToResult`)에서 데이터 변환됨
- **AnalysisResult 컴포넌트에 UI 코드 있으나 조건부 렌더링 문제 가능성**

### 3.2 확인/수정 사항

**파일**: `app/(main)/analysis/skin/_components/AnalysisResult.tsx`

확인할 코드 (252-260행):

```typescript
{ingredientWarnings && ingredientWarnings.length > 0 && (
  <section className="bg-card rounded-xl border p-6">
    <h2 className="text-lg font-semibold text-foreground">주의 성분</h2>
    {ingredientWarnings.map((warning, index) => (...))}
  </section>
)}
```

### 3.3 테스트 기준

- [ ] 피부 타입에 따른 경고 성분 표시 (건성/지성/복합성/민감성)
- [ ] 경고 레벨별 색상 구분 (high: 빨강, medium: 주황, low: 노랑)
- [ ] 대체 성분 추천 표시

---

## 4. Gap 3: PhotoOverlayMap, TrendChart 통합

### 4.1 현재 상태

- `PhotoOverlayMap`: 컴포넌트 있음, 페이지에서 미사용
- `TrendChart`: import됨, 렌더링 안 됨
- 스펙: SDD-S1-UX-IMPROVEMENT.md Phase 2

### 4.2 변경 사항

**파일**: `app/(main)/analysis/skin/result/[id]/page.tsx`

```typescript
// 이미 import됨: PhotoOverlayMap, TrendChart

// 비주얼 탭에 추가
{imageUrl && (
  <PhotoOverlayMap
    imageUrl={imageUrl}
    zones={zoneData}
    onZoneClick={handleZoneClick}
    showLabels={true}
    opacity={0.6}
  />
)}

// 트렌드 섹션 추가
{trendData.length >= 2 && (
  <TrendChart
    data={trendData}
    metric="overall"
    height={200}
    showGoal={true}
    goalScore={80}
  />
)}
```

### 4.3 테스트 기준

- [ ] 얼굴 사진 위에 존 오버레이 표시
- [ ] 2회 이상 분석 시 점수 변화 그래프 표시
- [ ] 존 클릭 시 상세 정보 표시

---

## 5. Gap 4: 드레이핑 피부/체형 연동

### 5.1 현재 상태

- 드레이핑 기능이 PC-1에만 존재
- S-1, C-1에서 PC 결과 연동하여 드레이핑 제공 필요

### 5.2 설계

**조건**: 사용자에게 PC-1 분석 결과가 있을 때만 드레이핑 탭 표시

```typescript
// S-1 / C-1 결과 페이지에서
const [personalColorResult, setPersonalColorResult] = useState<PCResult | null>(null);

// PC-1 결과 조회
useEffect(() => {
  const fetchPCResult = async () => {
    const { data } = await supabase
      .from('personal_color_assessments')
      .select('season, image_url')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) setPersonalColorResult(data);
  };
  fetchPCResult();
}, []);

// 조건부 탭 렌더링
{personalColorResult && (
  <TabsTrigger value="draping">드레이핑</TabsTrigger>
)}
```

### 5.3 변경 파일

- `app/(main)/analysis/skin/result/[id]/page.tsx`
- `app/(main)/analysis/body/result/[id]/page.tsx`

### 5.4 테스트 기준

- [ ] PC-1 결과 없으면 드레이핑 탭 숨김
- [ ] PC-1 결과 있으면 해당 시즌으로 드레이핑 표시
- [ ] "퍼스널 컬러 분석 먼저 하기" CTA (결과 없을 때)

---

## 6. 구현 순서

### Phase A (즉시, 복잡도 낮음)

1. Gap 2: ingredientWarnings 데이터 흐름 확인 및 UI 활성화
2. Gap 1: DrapingSimulationTab PC-1 연결

### Phase B (단기, 복잡도 중간)

3. Gap 3: PhotoOverlayMap, TrendChart 피부 분석 통합
4. Gap 4: 드레이핑 피부/체형 연동

---

## 7. 복잡도 분석

| Gap | 파일 수 | 변경 유형 | 의존성 | 리스크  | 총점 |
| --- | ------- | --------- | ------ | ------- | ---- |
| 1   | 1개     | 기존 수정 | 독립적 | 없음    | 25점 |
| 2   | 2개     | 기존 수정 | 1단계  | 없음    | 30점 |
| 3   | 1개     | 기존 수정 | 1단계  | 없음    | 30점 |
| 4   | 2개     | 새 기능   | 2단계  | DB 조회 | 45점 |

---

**Version**: 1.0 | **Updated**: 2026-01-13
