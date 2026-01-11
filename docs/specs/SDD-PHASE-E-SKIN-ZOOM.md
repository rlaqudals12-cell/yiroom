# SDD: Phase E - 피부 분석 확대 기능

> AI 문제 영역 마커 + 확대 뷰어 + 솔루션 패널

## 1. 개요

### 1.1 목적

피부 분석 결과에서 문제 영역을 시각적으로 하이라이트하고,
사용자가 해당 부위를 확대하여 상세 솔루션을 확인할 수 있게 함.

### 1.2 핵심 기능

1. **AI 마커 표시**: 문제 영역에 컬러 마커 오버레이
2. **탭하여 확대**: 마커 클릭 시 해당 부위 확대
3. **솔루션 패널**: 문제 설명 + 추천 성분 + 제품 링크
4. **핀치 줌**: 자유로운 이미지 탐색

### 1.3 우선순위

- **MVP 이후** 구현 (핵심 기능 완성 후)
- 복잡도: 높음

---

## 2. 기술 요구사항

### 2.1 Gemini 분석 응답 확장

```typescript
// 현재 응답 (lib/gemini.ts)
interface SkinAnalysisResult {
  overallScore: number;
  metrics: SkinMetric[];
  // ...
}

// 확장된 응답
interface SkinAnalysisResultV2 extends SkinAnalysisResult {
  problemAreas?: ProblemArea[];
}

interface ProblemArea {
  id: string;
  type: 'pores' | 'pigmentation' | 'dryness' | 'wrinkles' | 'acne' | 'oiliness';
  severity: 'mild' | 'moderate' | 'severe';
  location: {
    x: number; // 0-100 (이미지 기준 %)
    y: number; // 0-100
    radius: number; // 영역 크기
  };
  description: string;
  recommendations: string[];
}
```

### 2.2 프롬프트 수정

```
📍 문제 영역 좌표 반환:
각 문제 영역에 대해 이미지 내 위치를 백분율로 표시하세요.
- x: 좌측에서의 위치 (0-100)
- y: 상단에서의 위치 (0-100)
- radius: 영역 크기 (5-20)

예시:
{
  "problemAreas": [
    {
      "type": "pores",
      "severity": "moderate",
      "location": { "x": 45, "y": 35, "radius": 10 },
      "description": "T존 모공이 넓어져 있습니다",
      "recommendations": ["BHA 토너", "클레이 마스크"]
    }
  ]
}
```

---

## 3. 컴포넌트 구조

### 3.1 SkinImageViewer

```tsx
// components/analysis/SkinImageViewer.tsx

interface SkinImageViewerProps {
  imageUrl: string;
  problemAreas: ProblemArea[];
  onAreaClick: (area: ProblemArea) => void;
}

// 기능:
// - 이미지 렌더링
// - 마커 오버레이 (SVG/Canvas)
// - 핀치 줌 지원
// - 마커 클릭 이벤트
```

### 3.2 ProblemMarker

```tsx
// components/analysis/ProblemMarker.tsx

interface ProblemMarkerProps {
  area: ProblemArea;
  onClick: () => void;
}

// 마커 색상 매핑
const MARKER_COLORS: Record<ProblemArea['type'], string> = {
  pores: '#EF4444', // 빨강
  pigmentation: '#F59E0B', // 주황
  dryness: '#3B82F6', // 파랑
  wrinkles: '#8B5CF6', // 보라
  acne: '#EC4899', // 핑크
  oiliness: '#10B981', // 초록
};
```

### 3.3 SolutionPanel

```tsx
// components/analysis/SolutionPanel.tsx

interface SolutionPanelProps {
  area: ProblemArea | null;
  onClose: () => void;
  onProductClick: (productId: string) => void;
}

// 슬라이드업 패널:
// - 문제 유형 아이콘 + 제목
// - 심각도 표시
// - 상세 설명
// - 추천 성분 태그
// - 추천 제품 카드 (2-3개)
```

### 3.4 ZoomableImage

```tsx
// components/ui/ZoomableImage.tsx

interface ZoomableImageProps {
  src: string;
  alt: string;
  initialZoom?: number;
  maxZoom?: number;
  focusPoint?: { x: number; y: number };
}

// 기능:
// - 핀치 줌 (모바일)
// - 마우스 휠 줌 (데스크톱)
// - 더블탭 줌
// - 포커스 포인트로 자동 이동
```

---

## 4. 데이터 흐름

```
1. 피부 분석 요청
   ↓
2. Gemini 분석 + 좌표 반환
   ↓
3. DB 저장 (problem_areas JSONB)
   ↓
4. 결과 페이지 렌더링
   ↓
5. SkinImageViewer + ProblemMarker 표시
   ↓
6. 마커 클릭 → SolutionPanel 표시
```

---

## 5. DB 스키마 확장

```sql
-- skin_analyses 테이블에 컬럼 추가
ALTER TABLE skin_analyses ADD COLUMN IF NOT EXISTS
  problem_areas JSONB DEFAULT '[]';

-- 인덱스 (선택적)
CREATE INDEX IF NOT EXISTS idx_skin_analyses_problem_areas
  ON skin_analyses USING GIN (problem_areas);
```

---

## 6. 구현 단계

### Phase E-1: Gemini 응답 확장

- [ ] 프롬프트에 좌표 요청 추가
- [ ] 응답 파싱 로직 수정
- [ ] DB 스키마 확장

### Phase E-2: 뷰어 컴포넌트

- [ ] ZoomableImage 컴포넌트
- [ ] ProblemMarker 컴포넌트
- [ ] SkinImageViewer 통합

### Phase E-3: 솔루션 패널

- [ ] SolutionPanel 컴포넌트
- [ ] 제품 추천 연동
- [ ] 결과 페이지 통합

### Phase E-4: 테스트 및 최적화

- [ ] 단위 테스트
- [ ] 터치 제스처 테스트
- [ ] 성능 최적화

---

## 7. 리스크 및 고려사항

### 7.1 Gemini 좌표 정확도

- 좌표가 부정확할 수 있음
- 해결: 마커 크기를 넉넉하게 (radius 10-20)
- 해결: "대략적 위치" 문구 표시

### 7.2 이미지 크기/비율

- 다양한 이미지 비율 대응 필요
- 해결: 좌표를 백분율로 저장

### 7.3 모바일 터치

- 작은 마커 클릭 어려움
- 해결: 마커 최소 크기 44px (터치 타겟)

---

## 8. Mock 데이터 (개발용)

```typescript
// lib/mock/skin-problem-areas.ts

export const MOCK_PROBLEM_AREAS: ProblemArea[] = [
  {
    id: 'area-1',
    type: 'pores',
    severity: 'moderate',
    location: { x: 45, y: 35, radius: 12 },
    description: 'T존 코 주변 모공이 넓어져 있어요',
    recommendations: ['BHA 토너', '클레이 마스크', '모공 세럼'],
  },
  {
    id: 'area-2',
    type: 'pigmentation',
    severity: 'mild',
    location: { x: 30, y: 45, radius: 8 },
    description: '볼 부위에 가벼운 색소침착이 있어요',
    recommendations: ['비타민C 세럼', '나이아신아마이드'],
  },
];
```

---

**Version**: 1.0 | **Created**: 2026-01-11 | **Priority**: MVP 이후
