# SDD: S-1 피부 분석 UX 개선

> **Status**: Approved (검토 완료)
> **Created**: 2026-01-09
> **Updated**: 2026-01-09
> **Module**: S-1 피부 분석
> **Parent Spec**: SDD-VISUAL-SKIN-REPORT.md
> **Complexity**: 54점 (standard 전략)

## 1. 개요

### 1.1 목적

피부 분석(S-1)의 UX를 퍼스널 컬러(PC-1)와 동일한 수준으로 개선하여 사용자 경험 일관성 확보. 사진 재사용 옵션 추가로 편의성 향상.

### 1.2 배경

- 퍼스널 컬러 분석 대비 피부 분석 기능이 부족
- 사용자 피드백: "다시 분석하기" 버튼 찾기 어려움
- 퍼스널 컬러 촬영 사진을 피부 분석에 재사용하고 싶다는 요청

### 1.3 범위

| Phase   | 기능                                                     | 우선순위 | 비고         |
| ------- | -------------------------------------------------------- | -------- | ------------ |
| Phase 1 | 고정 하단 버튼, FaceZoneMap 통합, 활력도, 기존 결과 배너 | 높음     | 4.5일 예상   |
| Phase 2 | 사진 재사용, 사진 오버레이, Before/After 비교            | 중간     | DB 확장 필요 |
| Phase 3 | 12개 세부 존, 피부 일기                                  | 낮음     | 장기         |

> **Note**: FaceZoneMap, ZoneDetailCard, SkinVitalityScore 컴포넌트는 **이미 구현 완료** 상태입니다.
> Phase 1에서는 결과 페이지 통합 및 UI 개선에 집중합니다.

### 1.4 참조 스펙

- [SDD-VISUAL-SKIN-REPORT.md](./SDD-VISUAL-SKIN-REPORT.md) - 시각적 리포트 기본 설계
- PC-1 분석 페이지 패턴 - UX 일관성 기준

## 2. Phase 1 상세 설계

### 2.1 고정 하단 "다시 분석하기" 버튼

#### 2.1.1 적용 대상

| 페이지           | 현재 상태        | 개선                |
| ---------------- | ---------------- | ------------------- |
| 피부 분석 결과   | 스크롤 하단 버튼 | 고정 하단 버튼 추가 |
| 퍼스널 컬러 결과 | 스크롤 하단 버튼 | 고정 하단 버튼 추가 |
| 체형 분석 결과   | 스크롤 하단 버튼 | 고정 하단 버튼 추가 |
| 헤어 분석 결과   | 스크롤 하단 버튼 | 고정 하단 버튼 추가 |

#### 2.1.2 UI 설계

```
┌─────────────────────────────────────────────────┐
│                  결과 페이지 본문                │
│                     ...                         │
│                     ...                         │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │ ← 고정 영역
│  │  [다시 분석하기]        [공유하기]       │   │    bottom-20
│  └─────────────────────────────────────────┘   │    (하단 네비 위)
├─────────────────────────────────────────────────┤
│                  하단 네비게이션                 │ ← bottom-0
└─────────────────────────────────────────────────┘
```

#### 2.1.3 컴포넌트 Props

```typescript
// components/analysis/common/FixedBottomActions.tsx
interface FixedBottomActionsProps {
  onRetry: () => void;
  onShare?: () => void;
  retryLabel?: string; // 기본값: "다시 분석하기"
  shareLabel?: string; // 기본값: "공유하기"
  showShare?: boolean; // 기본값: true
  className?: string;
}
```

#### 2.1.4 스타일

```tsx
<div className="fixed bottom-20 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border/50 z-10">
  <div className="max-w-md mx-auto flex gap-3">
    <Button onClick={onRetry} className="flex-1">
      {retryLabel}
    </Button>
    {showShare && (
      <Button onClick={onShare} variant="outline" className="flex-1">
        {shareLabel}
      </Button>
    )}
  </div>
</div>
```

### 2.2 사진 재사용 기능 (Phase 2로 이동)

> **⚠️ Phase 2로 이동**: DB 스키마 확장(image_quality_score 등) 및 PC-1 연동 로직 필요.
> Phase 1에서는 구현하지 않습니다.

#### 2.2.1 정책 결정

**문제점**: 기존 정책상 분석 후 이미지 즉시 삭제 → 재사용 불가

**해결**: 동의 기반 재사용 (Option A)

```
퍼스널 컬러 분석 시:
  └─ 이미지 저장 동의 → image_consents 테이블에 기록
                      → Supabase Storage에 이미지 저장
                      └─ retention_until: 동의일 + 1년

피부 분석 진입 시:
  └─ 최근 퍼스널 컬러 동의 확인
     ├─ 동의 O + 7일 이내 → "사진 재사용" 옵션 표시
     └─ 동의 X 또는 7일 초과 → 새로 촬영만 표시
```

#### 2.2.2 재사용 조건

```typescript
interface PhotoReuseEligibility {
  eligible: boolean;
  reason?: 'no_consent' | 'expired' | 'no_image' | 'low_quality';
  sourceAnalysis?: {
    id: string;
    type: 'personal-color';
    analyzedAt: Date;
    imageUrl: string;
    thumbnailUrl?: string;
  };
}

const REUSE_CONDITIONS = {
  maxAgeDays: 7, // 7일 이내 촬영
  minQualityScore: 70, // 품질 70점 이상
  requiredAngle: 'front', // 정면 사진만
};
```

#### 2.2.3 DB 조회

```sql
-- 피부 분석 진입 시 재사용 가능한 퍼스널 컬러 이미지 조회
SELECT
  pca.id,
  pca.created_at,
  ic.consent_given,
  ic.retention_until,
  -- Storage URL은 별도 조회 필요
  pca.image_quality_score
FROM personal_color_assessments pca
LEFT JOIN image_consents ic
  ON ic.clerk_user_id = pca.clerk_user_id
  AND ic.analysis_type = 'personal-color'
WHERE pca.clerk_user_id = auth.jwt() ->> 'sub'
  AND pca.created_at > NOW() - INTERVAL '7 days'
  AND ic.consent_given = true
  AND ic.retention_until > NOW()
ORDER BY pca.created_at DESC
LIMIT 1;
```

#### 2.2.4 UI 설계

```
┌─────────────────────────────────────────────────┐
│  📸 피부 분석용 사진을 준비해주세요               │
├─────────────────────────────────────────────────┤
│                                                 │
│  💡 최근 퍼스널 컬러 분석 사진이 있어요!          │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │  [얼굴 썸네일]   │  │  📷            │      │
│  │                 │  │  새로 촬영하기   │      │
│  │  이 사진        │  │                 │      │
│  │  사용하기       │  │  더 정확한 분석  │      │
│  │                 │  │  을 위해 새로    │      │
│  │  1월 5일 촬영   │  │  촬영해요       │      │
│  │  (추천)         │  │                 │      │
│  └─────────────────┘  └─────────────────┘      │
│                                                 │
│  ⚠️ 피부 상태가 바뀌었다면 새로 촬영을 추천해요   │
└─────────────────────────────────────────────────┘
```

#### 2.2.5 컴포넌트 Props

```typescript
// components/analysis/skin/PhotoReuseSelector.tsx
interface PhotoReuseSelectorProps {
  eligibility: PhotoReuseEligibility;
  onSelectReuse: () => void;
  onSelectNewCapture: () => void;
  onSelectGallery?: () => void; // 갤러리 선택 옵션
}
```

### 2.3 기존 분석 결과 배너

#### 2.3.1 PC-1 패턴 적용

```typescript
// 피부 분석 페이지 진입 시 기존 결과 확인
interface ExistingSkinAnalysis {
  id: string;
  skinType: string;
  overallScore: number;
  created_at: string;
}
```

#### 2.3.2 UI 설계 (PC-1 패턴 동일)

```
┌─────────────────────────────────────────────────┐
│  📊 이전 피부 분석 결과가 있어요                 │
│                                                 │
│  피부 타입: 복합성                              │
│  종합 점수: 72점                                │
│  분석일: 2026년 1월 5일                         │
│                                                 │
│  [결과 보기]           [새로 분석하기]          │
└─────────────────────────────────────────────────┘
```

### 2.4 FaceZoneMap 컴포넌트

> ✅ **이미 구현 완료**: `components/analysis/visual-report/FaceZoneMap.tsx`
> 상세 설계는 [SDD-VISUAL-SKIN-REPORT.md §4.4](./SDD-VISUAL-SKIN-REPORT.md) 참조

#### 2.4.1 간소화된 SVG (터치 영역 확대)

```typescript
// components/analysis/visual-report/FaceZoneMap.tsx
interface FaceZoneMapProps {
  zones: Record<ZoneId, ZoneStatus>;
  size?: 'sm' | 'md' | 'lg';
  onZoneClick?: (zoneId: ZoneId) => void;
  highlightWorst?: boolean;
  className?: string;
}

type ZoneId = 'forehead' | 'tZone' | 'eyes' | 'cheeks' | 'uZone' | 'chin';

interface ZoneStatus {
  score: number;
  status: 'good' | 'normal' | 'warning';
  label: string;
  concerns?: string[];
}
```

#### 2.4.2 터치 영역 최소 44px 보장

```tsx
// SVG viewBox 기준 터치 영역
const ZONE_TOUCH_AREAS = {
  forehead: { x: 30, y: 30, width: 140, height: 60 }, // 최소 44px 보장
  tZone: { x: 70, y: 90, width: 60, height: 120 },
  eyes: { x: 30, y: 100, width: 140, height: 40 },
  cheeks: { x: 20, y: 130, width: 160, height: 60 },
  uZone: { x: 30, y: 180, width: 140, height: 60 },
  chin: { x: 70, y: 230, width: 60, height: 40 },
};
```

### 2.5 ZoneDetailCard 컴포넌트

> ✅ **이미 구현 완료**: `components/analysis/visual-report/ZoneDetailCard.tsx`
> 상세 설계는 [SDD-VISUAL-SKIN-REPORT.md §4.7](./SDD-VISUAL-SKIN-REPORT.md) 참조

#### 2.5.1 Props

```typescript
// components/analysis/visual-report/ZoneDetailCard.tsx
interface ZoneDetailCardProps {
  zoneId: ZoneId;
  zoneName: string;
  score: number;
  status: 'good' | 'normal' | 'warning';
  concerns: string[];
  recommendations: string[];
  onClose: () => void;
}
```

#### 2.5.2 Progressive Disclosure 패턴

```
1. FaceZoneMap 표시 (전체 요약)
2. 사용자가 존 클릭
3. ZoneDetailCard 슬라이드업 표시
4. 상세 정보 + 추천 제품/관리법
5. 닫기 버튼 또는 외부 클릭으로 닫기
```

### 2.6 피부 활력도 (SkinVitalityScore)

> ✅ **이미 구현 완료**: `components/analysis/visual-report/SkinVitalityScore.tsx`
> 상세 설계는 [SDD-VISUAL-SKIN-REPORT.md §4.5](./SDD-VISUAL-SKIN-REPORT.md) 참조

#### 2.6.1 Gemini 프롬프트 확장

```typescript
// lib/gemini.ts 피부 분석 프롬프트에 추가
const SKIN_VITALITY_PROMPT = `
📊 추가 분석 항목:

[피부 활력도 skinVitalityScore]
- 탄력, 수분, 윤기, 균일함을 종합 평가
- 0-100 점수 (높을수록 활력 있음)
- 점수 기준:
  - 80-100: 매우 건강하고 활력 있음
  - 60-79: 양호하지만 개선 여지 있음
  - 40-59: 관리 필요
  - 0-39: 집중 케어 권장

[활력도 요인 vitalityFactors]
- positive: 강점 요소 배열 (예: ["탄력 우수", "수분 충분"])
- negative: 개선 필요 요소 배열 (예: ["유분 과다", "모공 확대"])

다음 필드를 JSON 응답에 추가:
{
  "skinVitalityScore": [0-100],
  "vitalityFactors": {
    "positive": ["강점1", "강점2"],
    "negative": ["개선점1", "개선점2"]
  }
}
`;
```

#### 2.6.2 DB 스키마 확장

```sql
-- skin_analyses 테이블에 활력도 컬럼 추가 (이미 스펙에 있음)
ALTER TABLE skin_analyses
ADD COLUMN IF NOT EXISTS skin_vitality_score INTEGER
  CHECK (skin_vitality_score BETWEEN 0 AND 100);

-- vitalityFactors는 기존 analysis_result JSONB에 포함
```

## 3. Phase 2 설계 (요약)

### 3.1 PhotoOverlayMap

동의 받은 사진 위에 존 오버레이 표시.

```typescript
interface PhotoOverlayMapProps {
  imageUrl: string;
  zones: Record<ZoneId, ZoneStatus>;
  onZoneClick?: (zoneId: ZoneId) => void;
}
```

### 3.2 BeforeAfterSlider

이전/현재 분석 사진 비교.

```typescript
interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeDate: Date;
  afterDate: Date;
}
```

### 3.3 TrendChart

월별 점수 변화 그래프.

```typescript
interface TrendChartProps {
  data: Array<{ date: Date; score: number }>;
  metric: 'overall' | 'hydration' | 'oiliness' | 'pores';
}
```

## 4. Phase 3 설계 (요약)

### 4.1 12개 세부 존

- forehead_center, forehead_left, forehead_right
- eye_left, eye_right
- cheek_left, cheek_right
- nose_bridge, nose_tip
- chin_center, chin_left, chin_right

### 4.2 피부 일기

일일 컨디션, 수면, 식단 기록과 피부 상태 연관 분석.

## 5. 파일 구조

```
components/analysis/
├── common/
│   └── FixedBottomActions.tsx     # NEW: 고정 하단 버튼
├── skin/
│   └── PhotoReuseSelector.tsx     # NEW: 사진 재사용 선택
├── visual-report/
│   ├── FaceZoneMap.tsx            # NEW: 얼굴 존 맵
│   ├── ZoneDetailCard.tsx         # NEW: 존 상세 카드
│   ├── SkinVitalityScore.tsx      # NEW: 피부 활력도
│   └── index.ts                   # UPDATE: export 추가
└── consent/
    └── (기존 컴포넌트 유지)

app/(main)/analysis/
├── skin/
│   ├── page.tsx                   # UPDATE: 사진 재사용 UI 추가
│   └── result/[id]/
│       └── page.tsx               # UPDATE: 고정 버튼 + 존 맵
├── personal-color/
│   └── result/[id]/
│       └── page.tsx               # UPDATE: 고정 버튼 추가
├── body/
│   └── result/[id]/
│       └── page.tsx               # UPDATE: 고정 버튼 추가
└── hair/
    └── result/[id]/
        └── page.tsx               # UPDATE: 고정 버튼 추가

lib/
├── analysis/
│   └── photo-reuse.ts             # NEW: 사진 재사용 로직
├── gemini.ts                      # UPDATE: 활력도 프롬프트 추가
└── mock/
    └── skin-analysis.ts           # UPDATE: Hybrid 데이터 확장
```

## 6. 구현 순서 (Phase 1) - 수정됨

> 사진 재사용 기능(#8~#10)은 Phase 2로 이동됨

| 순서     | 작업                             | 의존성           | 난이도 | 예상 시간 |
| -------- | -------------------------------- | ---------------- | ------ | --------- |
| 1        | FixedBottomActions 컴포넌트 생성 | 없음             | 하     | 0.5일     |
| 2        | 4개 결과 페이지에 고정 버튼 적용 | #1               | 하     | 0.5일     |
| 3        | 피부 분석 결과에 존 맵 통합 확인 | 없음 (이미 구현) | 하     | 0.5일     |
| 4        | 기존 분석 결과 배너 추가         | 없음             | 중     | 0.5일     |
| 5        | Gemini 프롬프트 확장 (활력도)    | 없음             | 중     | 0.5일     |
| 6        | Mock 데이터 확장 (Hybrid 패턴)   | 없음             | 하     | 0.5일     |
| 7        | 테스트 작성 및 검증              | 전체             | 중     | 1일       |
| 8        | 전체 플로우 테스트               | 전체             | 중     | 0.5일     |
| **총계** |                                  |                  |        | **4.5일** |

## 7. 복잡도 분석

### 7.1 점수 산정 (검토 후 수정)

| 항목            | 점수     | 근거                              |
| --------------- | -------- | --------------------------------- |
| 파일 수         | 14점     | 6개 신규 (3개 컴포넌트 이미 구현) |
| DB 변경         | 10점     | skin_vitality_score 컬럼 추가     |
| 외부 API        | 15점     | Gemini 프롬프트 변경              |
| 컴포넌트 복잡도 | 5점      | 기존 SVG 컴포넌트 활용            |
| 테스트          | 10점     | 기존 테스트 확장                  |
| **총점**        | **54점** | **중하 난이도**                   |

### 7.2 전략 결정

| 복잡도   | 전략     | 적용                                      |
| -------- | -------- | ----------------------------------------- |
| 0-30점   | direct   | -                                         |
| 31-100점 | standard | ✅ 직접 구현 가능 (기존 구현 활용도 높음) |

> **시지푸스 불필요 근거**: 핵심 컴포넌트(FaceZoneMap, ZoneDetailCard, SkinVitalityScore)가 이미 구현되어 있어 통합 작업만 필요.

## 8. 테스트 계획

### 8.1 단위 테스트

```typescript
describe('FixedBottomActions', () => {
  it('renders retry and share buttons', () => {});
  it('calls onRetry when clicked', () => {});
  it('hides share button when showShare=false', () => {});
});

describe('FaceZoneMap', () => {
  it('renders all 6 zones', () => {});
  it('applies correct color for each status', () => {});
  it('calls onZoneClick with correct zoneId', () => {});
  it('highlights worst zone when enabled', () => {});
});

describe('PhotoReuseSelector', () => {
  it('shows reuse option when eligible', () => {});
  it('hides reuse option when not eligible', () => {});
  it('displays thumbnail and date correctly', () => {});
});
```

### 8.2 통합 테스트

- [ ] 피부 분석 전체 플로우 (촬영 → 동의 → 분석 → 결과)
- [ ] 존 클릭 → 상세 카드 표시 플로우
- [ ] 다시 분석하기 버튼 → forceNew 리디렉트
- [ ] 기존 분석 결과 배너 → 결과 보기 / 새로 분석하기

> **Phase 2에서 추가**: 사진 재사용 플로우 테스트

## 9. 리스크 및 완화

| 리스크                  | 확률 | 영향 | 완화                   |
| ----------------------- | ---- | ---- | ---------------------- |
| SVG 터치 영역 너무 작음 | 중   | 중   | 최소 44px 보장, 테스트 |
| 사진 재사용 동의 혼란   | 중   | 중   | 명확한 UI 문구         |
| Gemini 응답 불일치      | 낮   | 중   | Mock fallback          |
| 성능 (SVG 렌더링)       | 낮   | 낮   | 간소화된 경로          |

## 10. 접근성 (a11y)

- SVG에 `role="img"` 및 `aria-label` 추가
- 존 클릭 시 키보드 접근 가능 (`tabIndex`, `onKeyDown`)
- 색상만으로 정보 전달하지 않음 (라벨 병행)
- ZoneDetailCard 포커스 트랩

---

**Version**: 1.0
**Author**: Claude Code
**Reviewed by**: (검토 대기)
