# SPEC-BEFORE-AFTER.md

> 체형/피부 변화 Before/After 비교 기능

## 개요

| 항목 | 내용 |
|------|------|
| 모듈 | C-1 (체형), S-1 (피부) |
| 우선순위 | 높음 (Phase I-1) |
| 예상 기간 | 2-3일 |
| 의존성 | 기존 분석 데이터 |

## 목표

사용자의 체형/피부 변화를 시각적으로 비교하여 동기부여 강화.
운동, 스킨케어 지속율 30% 향상 목표.

## 기능 요구사항

### 핵심 기능 (Must Have)

1. **타임라인 뷰**
   - 분석 이력 타임라인 표시
   - 날짜별 스코어 변화 그래프
   - 특정 시점 선택 UI

2. **Before/After 슬라이더**
   - 두 시점 사진 비교
   - 드래그 슬라이더로 전환
   - 확대/축소 기능

3. **점수 비교**
   - 스코어 변화 (증감 표시)
   - 개별 항목별 비교
   - 개선/악화 하이라이트

### 부가 기능 (Nice to Have)

4. **공유 기능**
   - 변화 이미지 생성
   - SNS 공유 (선택적 얼굴 블러)

5. **목표 설정**
   - 목표 스코어 설정
   - 달성 예상 날짜 계산

## 기술 설계

### 파일 구조

```
apps/web/
├── app/(main)/
│   ├── analysis/
│   │   ├── body/
│   │   │   └── history/
│   │   │       └── page.tsx      # 체형 변화 이력
│   │   ├── skin/
│   │   │   └── history/
│   │   │       └── page.tsx      # 피부 변화 이력
│   │   └── compare/
│   │       └── page.tsx          # 통합 비교 페이지
├── components/common/
│   ├── BeforeAfterSlider.tsx     # 슬라이더 컴포넌트
│   ├── ChangeTracker.tsx         # 변화 추적 카드
│   └── TimelineChart.tsx         # 타임라인 차트
└── lib/
    └── analysis/
        └── historyService.ts     # 이력 조회 서비스
```

### 데이터베이스

기존 테이블 활용:
- `body_analyses` - 체형 분석 이력
- `skin_analyses` - 피부 분석 이력

추가 필드 (필요시):
```sql
-- 분석 테이블에 이미지 URL 추가 (이미 있다면 스킵)
ALTER TABLE body_analyses ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE skin_analyses ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 변화 비교 캐시 (성능 최적화)
CREATE TABLE analysis_change_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  analysis_type VARCHAR(20) NOT NULL, -- 'body' | 'skin'
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  score_change DECIMAL(5,2),
  details JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analysis_change_cache_user
  ON analysis_change_cache(clerk_user_id, analysis_type);

-- RLS
ALTER TABLE analysis_change_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analysis_change_cache_policy" ON analysis_change_cache
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');
```

### API 설계

#### GET /api/analysis/history

**Request:**
```
GET /api/analysis/history?type=body&limit=10
```

**Response:**
```json
{
  "analyses": [
    {
      "id": "uuid",
      "date": "2025-01-15",
      "overallScore": 78,
      "imageUrl": "https://...",
      "details": {
        "bodyType": "S",
        "muscle": 72,
        "posture": 80
      }
    },
    {
      "id": "uuid",
      "date": "2025-01-01",
      "overallScore": 72,
      "imageUrl": "https://...",
      "details": {
        "bodyType": "S",
        "muscle": 68,
        "posture": 75
      }
    }
  ],
  "trend": "improving"
}
```

#### GET /api/analysis/compare

**Request:**
```
GET /api/analysis/compare?type=body&from=uuid1&to=uuid2
```

**Response:**
```json
{
  "before": {
    "id": "uuid1",
    "date": "2025-01-01",
    "overallScore": 72,
    "imageUrl": "https://..."
  },
  "after": {
    "id": "uuid2",
    "date": "2025-01-15",
    "overallScore": 78,
    "imageUrl": "https://..."
  },
  "changes": {
    "overall": +6,
    "muscle": +4,
    "posture": +5,
    "period": "14일"
  },
  "insights": [
    "근력이 4점 향상되었어요!",
    "자세 점수가 개선되고 있어요"
  ]
}
```

### 컴포넌트 설계

#### BeforeAfterSlider.tsx

```tsx
interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number; // 0-100
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  initialPosition = 50,
}: BeforeAfterSliderProps) {
  // 드래그 가능한 슬라이더
  // 터치/마우스 이벤트 처리
  // 이미지 클리핑으로 비교
}
```

#### ChangeTracker.tsx

```tsx
interface ChangeTrackerProps {
  title: string;
  beforeValue: number;
  afterValue: number;
  unit?: string;
  positiveIsGood?: boolean;
}

export function ChangeTracker({
  title,
  beforeValue,
  afterValue,
  unit = '점',
  positiveIsGood = true,
}: ChangeTrackerProps) {
  const change = afterValue - beforeValue;
  const isPositive = change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  return (
    <div className="flex items-center justify-between">
      <span>{title}</span>
      <div className={isGood ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '+' : ''}{change}{unit}
      </div>
    </div>
  );
}
```

## UI/UX 설계

### 화면 구성

1. **이력 페이지** (`/analysis/body/history`)
   - 상단: 기간 필터 (1주/1개월/3개월/전체)
   - 중앙: 점수 변화 라인 차트
   - 하단: 분석 카드 리스트 (날짜, 점수, 썸네일)

2. **비교 페이지** (`/analysis/compare`)
   - 상단: Before/After 선택 드롭다운
   - 중앙: 이미지 슬라이더
   - 하단: 점수 비교 카드들

3. **공유 이미지 생성**
   - 템플릿: Before | After 분할
   - 점수 변화 배지
   - 이룸 워터마크
   - 얼굴 블러 옵션

### 인터랙션

```
슬라이더 동작:
┌────────────────────────────┐
│         │←→│               │
│ Before  │  │  After        │
│ 이미지  │드│  이미지       │
│         │래│               │
│         │그│               │
└────────────────────────────┘
```

### 애니메이션

- 슬라이더: 부드러운 드래그
- 점수 변화: 카운트업 애니메이션
- 차트: 데이터 로드 시 그리기 애니메이션

## 테스트 계획

### 테스트 케이스

1. **BeforeAfterSlider**
   - 초기 위치 렌더링
   - 드래그로 위치 변경
   - 터치 이벤트 지원
   - 이미지 로드 실패 처리

2. **ChangeTracker**
   - 양수 변화 표시 (녹색)
   - 음수 변화 표시 (빨강)
   - 변화 없음 표시
   - positiveIsGood 반전

3. **API**
   - 이력 조회 (페이지네이션)
   - 두 분석 비교
   - 권한 없는 분석 접근 거부

## 성공 지표

| 지표 | 목표 |
|------|------|
| 비교 기능 사용률 | 주간 활성 사용자 40% |
| 재분석 전환율 | 비교 후 30% 재분석 |
| 공유율 | 월간 1,000회 |
| 운동/스킨케어 지속율 | 30% 향상 |

## 일정

| 날짜 | 작업 |
|------|------|
| Day 1 | BeforeAfterSlider, ChangeTracker 구현 |
| Day 2 | 이력 API, 비교 API 구현 |
| Day 3 | 페이지 통합, 테스트 |

---

**문서 버전**: 1.0
**작성일**: 2025-12-28
**작성자**: Claude Code
