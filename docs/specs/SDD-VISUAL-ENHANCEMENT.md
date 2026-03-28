# SDD: Visual Enhancement — 분석 결과 시각적 오버레이 + 익명 공유

> **상태**: 구현 완료 (Done) — 42/42 ATOM, 71 tests passed
> **날짜**: 2026-03-28
> **ADR**: [ADR-097](../adr/ADR-097-visual-overlay-anonymous-share.md)
> **원칙**: [image-processing.md](../principles/image-processing.md), [body-mechanics.md](../principles/body-mechanics.md), [3d-face-shape.md](../principles/3d-face-shape.md)
> **궁극의 형태**: 7모듈 시각적 오버레이 + 익명 공유 + 강점 하이라이트 + 스캐닝 애니메이션 (목표: 75%)

---

## 1. 배경 및 목표

### 현재 문제

- 분석 결과가 텍스트+점수 중심 → 사용자 신뢰도 4.2/10
- 공유 시 실제 얼굴/체형 노출 부담 → 공유 의향 3.6/10
- 경쟁사(Perfect Corp, Exbody) 대비 시각적 결과 표시 열위

### 목표

| 지표                  | 현재   | 목표   | 측정 방법                 |
| --------------------- | ------ | ------ | ------------------------- |
| 분석 신뢰도 체감      | 4.2/10 | 7.5/10 | 출시 후 사용자 설문       |
| 공유 의향             | 3.6/10 | 6.2/10 | 공유 버튼 클릭률          |
| 피부 히트맵 존 정확도 | 0%     | 85%+   | 12존 렌더링 스냅샷 테스트 |
| 체형 관절점 매핑      | 0%     | 80%+   | 33관절 좌표 검증 테스트   |

### Layer 배치 (ADR-097 D9)

```
Layer 0:   Emotional Hook (한 문장 요약 + 점수) — 기존 유지
Layer 0.5: Visual Scan (히트맵/스켈레톤 오버레이) — ★ 신규
Layer 1:   Concern Overview (ConcernCard 그리드) — ADR-077 유지
Layer 2:   Deep Metrics (MetricBarGaugeList) — 기존 유지
Layer 3:   Action (성분/루틴/제품 추천) — 기존 유지
Layer 4:   Trust (근거 + AI 고지) — 기존 유지
```

---

## 2. 공통 인프라 컴포넌트

### 2.1 AnalysisOverlayBase

공통 래퍼. 이미지 + 오버레이 컨테이너를 일관되게 관리.

```typescript
interface AnalysisOverlayBaseProps {
  imageUrl: string;
  imageAlt: string;
  width?: number;
  height?: number;
  children: React.ReactNode; // SVG 또는 Canvas 오버레이
  srOnlyDescription?: string; // 접근성: 스크린 리더용 텍스트 대안
  className?: string;
}
```

**디자인 토큰** (SVG/Canvas 공통):

```typescript
const OVERLAY_TOKENS = {
  // 강점 모드 (기본값)
  strengthColor: 'rgba(16, 185, 129, 0.35)', // 에메랄드
  strengthBorder: 'rgba(16, 185, 129, 0.8)',
  strengthIcon: 'check-circle',
  // 약점 (전체 보기 모드)
  weaknessColor: 'rgba(239, 68, 68, 0.3)', // 빨강
  weaknessBorder: 'rgba(239, 68, 68, 0.7)',
  weaknessIcon: 'alert-triangle',
  // 중립
  neutralColor: 'rgba(156, 163, 175, 0.2)', // 회색
  neutralBorder: 'rgba(156, 163, 175, 0.5)',
  neutralPattern: 'dashed', // 점선 (색맹 대응)
  // 공통
  overlayOpacity: 0.35,
  badgeRadius: 20,
  lineWidth: { active: 2, inactive: 1 },
  fontFamily: 'inherit',
} as const;
```

**파일**: `components/analysis/overlay/AnalysisOverlayBase.tsx`

### 2.2 StrengthHighlightToggle

강점/전체 보기 토글 (ADR-097 D4).

```typescript
interface StrengthHighlightToggleProps {
  mode: 'strength' | 'full';
  onModeChange: (mode: 'strength' | 'full') => void;
}
```

- 기본값: `strength`
- 공유 시: `strength` 고정 (토글 비활성)
- 라벨: "강점 중심" / "전체 보기"

**파일**: `components/analysis/overlay/StrengthHighlightToggle.tsx`

### 2.3 ScanningAnimation

분석 과정 시각화 (ADR-097 D5).

```typescript
interface ScanningAnimationProps {
  type: 'face' | 'body' | 'tooth';
  isAnalyzing: boolean;
  progress?: number; // 0-100
  onComplete?: () => void;
}
```

- duration: AI 응답 시간에 연동
- easing: `ease-out`
- 반복: 1회 (루프 금지)
- 구현: CSS `@keyframes` + SVG 마스크

**파일**: `components/analysis/overlay/ScanningAnimation.tsx`

---

## 3. 모듈별 오버레이 스펙

### 3.1 피부 히트맵 오버레이 (S-1)

**기법**: 12존 반투명 SVG 타원 + face-api.js 랜드마크 보정
**렌더링**: SVG

```typescript
interface FaceHeatmapOverlayProps {
  imageUrl: string;
  landmarks: faceapi.Point[] | null; // 68-point, null이면 V1 정적 좌표 사용
  zoneScores: Record<DetailedZoneId, ZoneMetricsV2>;
  highlightMetric?: keyof ZoneMetricsV2; // 'pores', 'hydration' 등 특정 지표 하이라이트
  mode: 'strength' | 'full';
  onZoneClick?: (zoneId: DetailedZoneId, metrics: ZoneMetricsV2) => void;
}

// 12존 ID (zone-heatmap-data.ts에서 가져옴)
type DetailedZoneId =
  | 'forehead_center'
  | 'forehead_left'
  | 'forehead_right'
  | 'eye_left'
  | 'eye_right'
  | 'nose_bridge'
  | 'nose_tip'
  | 'cheek_left'
  | 'cheek_right'
  | 'chin_center'
  | 'chin_left'
  | 'chin_right';
```

**기존 코드 재활용**:

- V2 `getAnchorPoint()` → 랜드마크 기반 위치 계산
- V1 `OverlayZone` SVG 경로 → 존 영역 채우기 패턴
- `zone-heatmap-data.ts` → 12존 타원 좌표
- `SCORE_COLOR_RANGES` → 점수→색상 매핑

**성공 기준**:

- [ ] 12존 모두 올바른 색상으로 렌더링 (스냅샷 테스트)
- [ ] 랜드마크 감지 실패 시 V1 정적 좌표로 폴백
- [ ] 존 클릭 시 해당 메트릭 상세 표시
- [ ] 강점/전체 모드 전환 시 색상 즉시 변경
- [ ] data-testid="face-heatmap-overlay" 존재

**파일**: `components/analysis/overlay/FaceHeatmapOverlay.tsx`

---

### 3.2 체형 스켈레톤 오버레이 (C-1)

**기법**: 33관절 스켈레톤 라인 + 비율 수치 라벨
**렌더링**: Canvas

```typescript
// 기존 타입 재사용 (P4 단순화)
// Landmark33 from lib/analysis/body-v2/types.ts
// BodyType3 from lib/body/mapper.ts
// ColorRecommendation from lib/analysis/makeup/types.ts
// PostureType from lib/shared/integration-types.ts

interface PoseSkeletonOverlayProps {
  imageUrl: string;
  landmarks: Landmark33[] | null; // 기존 body-v2/types.ts 재사용, null이면 비표시
  measurements: {
    shoulderWidth: number; // 어깨 너비 비율
    waistWidth: number; // 허리 너비 비율
    hipWidth: number; // 골반 너비 비율
    shoulderTilt?: number; // 어깨 기울기 (도)
    pelvisTilt?: number; // 골반 기울기 (도)
  };
  bodyType: BodyType3; // 기존 lib/body/mapper.ts 재사용
  mode: 'strength' | 'full';
}
```

**스켈레톤 연결 정의**:

```typescript
// 핵심 연결선 (visibility > 0.5인 관절만 렌더링)
const SKELETON_CONNECTIONS = [
  // 상체
  [11, 12], // 어깨선 (핵심 - 기울기 측정)
  [11, 13],
  [13, 15], // 왼팔
  [12, 14],
  [14, 16], // 오른팔
  // 몸통
  [11, 23],
  [12, 24], // 어깨→힙
  [23, 24], // 골반선 (핵심 - 정렬 측정)
  // 하체
  [23, 25],
  [25, 27], // 왼다리
  [24, 26],
  [26, 28], // 오른다리
];

// 비율 수치 라벨 위치
const RATIO_LABELS = [
  { connection: [11, 12], label: '어깨', position: 'above' },
  { connection: [23, 24], label: '골반', position: 'below' },
];
```

**접근성 (ADR-097 D7)**:

```typescript
// Canvas 옆 sr-only 텍스트 대안
<div className="sr-only" role="img" aria-label={srDescription}>
  {`체형 분석 결과: ${bodyType}형. 어깨 비율 ${measurements.shoulderWidth},
   골반 비율 ${measurements.hipWidth},
   어깨 기울기 ${measurements.shoulderTilt}도`}
</div>
```

**성공 기준**:

- [ ] 정면 사진에서 어깨/골반 연결선 정확 렌더링
- [ ] 비율 수치 라벨이 연결선 위/아래에 표시
- [ ] landmarks null 시 오버레이 비표시 (에러 아님)
- [ ] sr-only 텍스트 대안 존재
- [ ] data-testid="pose-skeleton-overlay" 존재

**파일**: `components/analysis/overlay/PoseSkeletonOverlay.tsx`

---

### 3.3 자세 정렬선 오버레이

**기법**: 기준 수직/수평선 + 실제 정렬선 편차 시각화
**렌더링**: Canvas (체형과 공유)

```typescript
interface PostureAlignmentOverlayProps {
  imageUrl: string;
  landmarks: Landmark33[] | null; // 기존 body-v2/types.ts 재사용
  view: 'front' | 'side';
  measurements: {
    // 정면
    shoulderSymmetry?: number; // 0-100 (50 = 이상적)
    pelvisSymmetry?: number;
    kneeAlignment?: number;
    // 측면
    headForwardAngle?: number;
    thoracicKyphosis?: number;
    lumbarLordosis?: number;
    pelvicTilt?: number;
  };
  postureType: PostureType;
  mode: 'strength' | 'full';
}
```

**시각화 패턴**:

- 정면: 수직 기준선(중앙) + 어깨/골반 수평선 (기울기 색상 코딩)
- 측면: 귀-어깨-골반-발목 이상적 수직선 + 실제 정렬선 비교
- 편차: 정상 범위 = 초록, 주의 = 노랑, 개선 권장 = 빨강

**성공 기준**:

- [ ] 정면/측면 각각 기준선 + 실제 정렬선 렌더링
- [ ] 편차 크기에 따라 색상 변화
- [ ] sr-only 텍스트 대안 존재

**파일**: `components/analysis/overlay/PostureAlignmentOverlay.tsx`

---

### 3.4 헤어 얼굴형 윤곽 오버레이 (H-1)

**기법**: face-api.js 턱라인(0-16) + 이마(17-26) → SVG 윤곽선
**렌더링**: SVG

```typescript
interface FaceOutlineOverlayProps {
  imageUrl: string;
  landmarks: faceapi.Point[] | null;
  faceShape: FaceShapeType; // 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond' | 'rectangle'
  faceShapeLabel: string;
  recommendedStyles?: HairStyleRecommendation[];
  mode: 'strength' | 'full';
}

interface HairStyleRecommendation {
  styleName: string;
  description: string;
  matchScore: number; // 0-100
}
```

**윤곽선 생성**:

```typescript
// 턱라인: landmarks[0-16] → 부드러운 곡선 SVG path
// 이마: landmarks[17-26] → 눈썹 위 보간 곡선
// 전체: 턱라인 + 이마 연결 → 닫힌 경로
function generateFaceOutlinePath(landmarks: faceapi.Point[]): string {
  const jawline = landmarks.slice(0, 17); // 턱
  const eyebrows = landmarks.slice(17, 27); // 눈썹 (이마 근사)
  // Catmull-Rom 스플라인으로 부드러운 곡선 생성
  return catmullRomToSVGPath([...jawline, ...eyebrows.reverse()]);
}
```

**성공 기준**:

- [ ] 얼굴 윤곽선이 사진 위에 부드러운 곡선으로 렌더링
- [ ] 얼굴형 분류 라벨이 윤곽선 옆에 표시
- [ ] 추천 스타일 카드가 오버레이 아래에 그리드로 표시

**파일**: `components/analysis/overlay/FaceOutlineOverlay.tsx`

---

### 3.5 메이크업 페이스 존 컬러 가이드 (M-1)

**기법**: face-api.js 눈/입술/볼 영역 → 추천색 반투명 오버레이
**렌더링**: SVG (피부 히트맵 패턴 재활용)

```typescript
interface MakeupFaceMapOverlayProps {
  imageUrl: string;
  landmarks: faceapi.Point[] | null;
  colorRecommendations: ColorRecommendation[];
  // ColorRecommendation: { category, colors: [{name, hex, description}] }
  activeCategory?: 'foundation' | 'lip' | 'eyeshadow' | 'blush' | 'contour';
  mode: 'strength' | 'full';
  onCategoryClick?: (category: string) => void;
}
```

**영역 매핑**:

```typescript
const MAKEUP_ZONES = {
  eyeshadow: { landmarks: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47] },
  lip: { landmarks: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59] },
  blush: { landmarks: [1, 2, 3, 4, 13, 14, 15] }, // 볼 영역
  contour: { landmarks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] }, // 턱라인
};
```

**성공 기준**:

- [ ] 카테고리 탭 시 해당 영역에 추천색 오버레이
- [ ] 색상 스와치가 영역 옆에 표시
- [ ] 피부 히트맵과 시각적 일관성 유지

**파일**: `components/analysis/overlay/MakeupFaceMapOverlay.tsx`

---

### 3.6 구강 치아 도식 (OH-1)

**기법**: 제네릭 치아 SVG 도식 + 셰이드/잇몸 컬러매핑
**렌더링**: SVG (정적 도식, 랜드마크 감지 없음)

```typescript
interface ToothDiagramOverlayProps {
  toothColor?: ToothColorResult; // VITA 셰이드
  gumHealth?: GumHealthResult; // 잇몸 상태
  whiteningGoal?: WhiteningGoalResult;
  mode: 'strength' | 'full';
  activeTab?: 'tooth-color' | 'gum-health' | 'whitening';
}
```

**SVG 구조**:

```svg
<!-- 상단 치아 아치 (전치부 6개 + 구치부 4개) -->
<!-- 하단 치아 아치 -->
<!-- 잇몸 영역 (상/하) -->
<!-- 각 치아/잇몸 영역에 fill 색상 적용 -->
```

- 치아 색상: VITA 셰이드 hex 값으로 채움
- 잇몸 색상: 건강=분홍, 경미 염증=연분홍, 심한 염증=빨강
- 미백 목표: 현재 셰이드 → 목표 셰이드 그라데이션 바

**성공 기준**:

- [ ] 치아 도식이 현재 VITA 셰이드 색상으로 렌더링
- [ ] 잇몸 영역이 건강 상태에 따라 색상 변화
- [ ] 미백 목표 바가 현재→목표 셰이드 비교 표시

**파일**: `components/analysis/overlay/ToothDiagramOverlay.tsx`

---

## 4. 익명 공유 모드

### 4.1 공통 인터페이스

```typescript
interface AnonymousShareProps {
  analysisType: AnalysisType;
  data: AnalysisShareData; // 기존 useAnalysisShare 데이터
  mode: 'photo' | 'illustration'; // "내 사진 포함" / "일러스트로 공유"
  onModeChange: (mode: 'photo' | 'illustration') => void;
}
```

### 4.2 제네릭 일러스트 템플릿

```typescript
// 얼굴 템플릿 (피부/메이크업/헤어)
interface AnonymousFaceTemplateProps {
  faceShape: 'oval' | 'round' | 'angular'; // 3종 (성별 무관, ADR-084)
  skinTone: 'light' | 'medium' | 'dark'; // 명도 기반 3단계
  overlayContent: React.ReactNode; // 히트맵 또는 컬러 가이드
}

// 체형 템플릿 (체형/자세)
interface AnonymousBodyTemplateProps {
  bodyType: 'S' | 'W' | 'N'; // 3종 실루엣 (성별 무관 기하학적 도형)
  overlayContent: React.ReactNode; // 스켈레톤 또는 정렬선
}
```

**성별 중립 원칙 (ADR-084)**:

- 얼굴 일러스트: 성별 특징 없는 기하학적 얼굴형 (눈/코/입 최소화)
- 체형 실루엣: 어깨:힙 비율만 변형, 성별 특징 없음
- 피부톤: 인종/성별 무관, 명도(L\*) 기반 3단계

**파일 구조**:

```
components/analysis/overlay/anonymous/
├── AnonymousFaceTemplate.tsx
├── AnonymousBodyTemplate.tsx
├── AnonymousToothTemplate.tsx  // 구강은 원래 도식이므로 래퍼
└── ShareModeToggle.tsx         // "내 사진 포함" / "일러스트로 공유" 토글
```

### 4.3 공유 플로우 변경

```
기존:
  결과 페이지 → 공유 버튼 → 테마 선택 → 캡처 → 공유

변경:
  결과 페이지 → 공유 버튼 → 모드 선택 (사진/일러스트) → 테마 선택 → 캡처 → 공유
                               ↑ 기본값: 일러스트
```

**프라이버시 보장**:

- 일러스트 모드 선택 시 원본 이미지 base64가 공유 카드 DOM에 **포함되지 않음**
- 공유 이미지 생성은 html-to-image로 캡처하므로, 일러스트 SVG만 렌더링

---

## 5. P3 원자 분해

### Phase 1: 공통 인프라

| ATOM | 내용                                                      | 입력               | 출력                     | 시간 | 의존성 |
| ---- | --------------------------------------------------------- | ------------------ | ------------------------ | ---- | ------ |
| P1-0 | face-api.js 모델 로딩 싱글턴 유틸 (3모듈 공유 캐시)       | -                  | loadFaceModels() 싱글턴  | 1h   | 없음   |
| P1-1 | AnalysisOverlayBase 컴포넌트 (Canvas ResizeObserver 포함) | imageUrl, children | 이미지+오버레이 컨테이너 | 1.5h | 없음   |
| P1-2 | OVERLAY_TOKENS 디자인 토큰 정의                           | -                  | 상수 객체                | 0.5h | 없음   |
| P1-3 | StrengthHighlightToggle 컴포넌트                          | mode, onModeChange | 토글 UI                  | 1h   | P1-2   |
| P1-4 | ScanningAnimation 컴포넌트                                | type, isAnalyzing  | CSS 스캔 라인            | 1.5h | P1-1   |
| P1-5 | overlay/index.ts barrel export                            | -                  | 공개 API                 | 0.5h | P1-1~4 |

### Phase 2 그룹 A: face-api.js 기반 (피부+메이크업+헤어)

| ATOM | 내용                                                       | 입력                  | 출력                            | 시간 | 의존성   |
| ---- | ---------------------------------------------------------- | --------------------- | ------------------------------- | ---- | -------- |
| A-1  | 12존 SVG 경로→좌표 변환 함수                               | landmarks, imageSize  | 12개 타원 좌표                  | 1h   | P1-1     |
| A-2  | 점수→색상+패턴 매핑 함수                                   | score, mode           | { fill, stroke, pattern, icon } | 1h   | P1-2     |
| A-3  | FaceHeatmapOverlay 렌더링                                  | landmarks, zoneScores | SVG 오버레이                    | 2h   | A-1, A-2 |
| A-4  | 존 클릭 상호작용 + 상세 팝오버                             | onZoneClick           | 팝오버 UI                       | 1h   | A-3      |
| A-5  | 피부 결과 페이지에 Layer 0.5 통합                          | -                     | 결과 페이지 업데이트            | 1.5h | A-3      |
| A-6  | MakeupFaceMapOverlay (피부 패턴 재활용)                    | landmarks, colorRec   | SVG 오버레이                    | 1.5h | A-1, A-2 |
| A-7  | 메이크업 결과 페이지 통합                                  | -                     | 결과 페이지 업데이트            | 1h   | A-6      |
| A-8  | 얼굴 윤곽선 SVG path 생성 함수 (Catmull-Rom 스플라인 포함) | landmarks[0-26]       | SVG path string (닫힌 경로)     | 2h   | P1-1     |
| A-9  | FaceOutlineOverlay 렌더링                                  | landmarks, faceShape  | SVG 윤곽+라벨                   | 1.5h | A-8      |
| A-10 | 헤어 결과 페이지 통합                                      | -                     | 결과 페이지 업데이트            | 1h   | A-9      |

### Phase 2 그룹 B: MediaPipe Pose 기반 (체형+자세)

| ATOM | 내용                                                     | 입력                    | 출력                 | 시간 | 의존성   |
| ---- | -------------------------------------------------------- | ----------------------- | -------------------- | ---- | -------- |
| B-1  | Canvas 스켈레톤 드로잉 함수 (ResizeObserver 반응형 포함) | Landmark33[], canvas    | 관절 연결 렌더링     | 2.5h | P1-1     |
| B-2  | 비율 수치 라벨 렌더링                                    | measurements            | Canvas 텍스트 라벨   | 1h   | B-1      |
| B-3  | PoseSkeletonOverlay 통합 컴포넌트                        | landmarks, measurements | Canvas 오버레이      | 1.5h | B-1, B-2 |
| B-4  | sr-only 접근성 텍스트                                    | measurements            | 스크린 리더 대안     | 0.5h | B-3      |
| B-5  | 체형 결과 페이지 통합                                    | -                       | 결과 페이지 업데이트 | 1.5h | B-3      |
| B-6  | PostureAlignmentOverlay (기준선+편차)                    | landmarks, view         | Canvas 정렬선        | 2h   | B-1      |
| B-7  | 자세 결과 페이지 통합                                    | -                       | 결과 페이지 업데이트 | 1h   | B-6      |

### Phase 2 그룹 C: 정적 SVG (구강)

| ATOM | 내용                       | 입력                  | 출력                 | 시간 | 의존성 |
| ---- | -------------------------- | --------------------- | -------------------- | ---- | ------ |
| C-1  | 치아 아치 SVG 도식 제작    | -                     | SVG 컴포넌트         | 2h   | P1-1   |
| C-2  | VITA 셰이드→fill 색상 매핑 | toothColor            | 채움 색상            | 1h   | C-1    |
| C-3  | 잇몸 건강→색상 매핑        | gumHealth             | 채움 색상            | 0.5h | C-1    |
| C-4  | ToothDiagramOverlay 통합   | toothColor, gumHealth | SVG 도식             | 1.5h | C-1~3  |
| C-5  | 구강 결과 페이지 통합      | -                     | 결과 페이지 업데이트 | 1h   | C-4    |

### Phase 3: 익명 공유 모드

| ATOM | 내용                                                        | 입력                | 출력          | 시간 | 의존성        |
| ---- | ----------------------------------------------------------- | ------------------- | ------------- | ---- | ------------- |
| S-0  | AnalysisType 유니온 타입 정의 + createPostureShareData 함수 | -                   | 타입+함수     | 1h   | 없음          |
| S-1  | AnonymousFaceTemplate SVG (3종 얼굴형)                      | faceShape, skinTone | SVG 일러스트  | 2h   | 없음          |
| S-2  | AnonymousBodyTemplate SVG (3종 체형)                        | bodyType            | SVG 실루엣    | 2h   | 없음          |
| S-3  | ShareModeToggle 컴포넌트                                    | mode, onModeChange  | 토글 UI       | 1h   | 없음          |
| S-4  | 기존 AnalysisShareCard에 모드 통합                          | mode                | 조건부 렌더링 | 2h   | S-1, S-2, S-3 |
| S-5  | useAnalysisShare 훅 모드 파라미터 추가                      | mode                | 공유 데이터   | 1h   | S-4           |
| S-6  | 각 결과 페이지 공유 바에 토글 추가 (7개)                    | -                   | UI 업데이트   | 2h   | S-5           |

### Phase 4: 통합 + 테스트

| ATOM | 내용                                            | 입력           | 출력                        | 시간 | 의존성         |
| ---- | ----------------------------------------------- | -------------- | --------------------------- | ---- | -------------- |
| T-1  | 피부 히트맵 스냅샷 테스트                       | mock 데이터    | 테스트 통과                 | 1h   | A-5            |
| T-2  | 체형 스켈레톤 좌표 검증 테스트                  | mock landmarks | 테스트 통과                 | 1h   | B-5            |
| T-3  | 익명 공유 프라이버시 테스트                     | -              | 원본 이미지 DOM 미포함 검증 | 1h   | S-6            |
| T-4  | typecheck + lint 전체 통과                      | -              | 0 에러                      | 1h   | 전체           |
| T-5  | 접근성 검증 (sr-only, aria-label)               | -              | WCAG 4.1.2 충족             | 1h   | 전체           |
| T-6  | 메이크업/헤어/구강 오버레이 스냅샷 테스트 (3건) | mock 데이터    | 테스트 통과                 | 1.5h | A-7, A-10, C-5 |
| T-7  | 익명 일러스트 SVG 렌더링 테스트 (3종)           | mock 데이터    | 테스트 통과                 | 1h   | S-6            |

---

## 6. 의존성 그래프

```
Phase 1 (직렬, 기반)
  P1-0 (face-api 싱글턴)
  P1-1 ─→ P1-3, P1-4
  P1-2 ─→ P1-3
  P1-0~5 → P1-5

Phase 2 + Phase 3 전반부 (★ 동시 병렬 시작 ★)
  그룹 A: P1-5 → A-1 → A-3 → A-4 → A-5
                  A-2 ↗        A-6 → A-7
                             A-8 → A-9 → A-10

  그룹 B: P1-5 → B-1 → B-2 → B-3 → B-4 → B-5
                              B-6 → B-7

  그룹 C: P1-5 → C-1 → C-2, C-3 → C-4 → C-5

  그룹 S(독립): S-0, S-1, S-2, S-3 (Phase 1 완료 후 즉시 시작, Phase 2와 병렬)

Phase 3 후반부 (Phase 2 + S-0~3 완료 후)
  S-4 → S-5 → S-6

Phase 4 (전체 완료 후)
  T-1~7: 전체 완료 후 병렬 테스트
```

---

## 7. 파일 배치

```
components/analysis/overlay/
├── index.ts                       # barrel export (공개 API)
├── AnalysisOverlayBase.tsx        # P1-1
├── StrengthHighlightToggle.tsx    # P1-3
├── ScanningAnimation.tsx          # P1-4
├── FaceHeatmapOverlay.tsx         # A-3
├── MakeupFaceMapOverlay.tsx       # A-6
├── FaceOutlineOverlay.tsx         # A-9
├── PoseSkeletonOverlay.tsx        # B-3
├── PostureAlignmentOverlay.tsx    # B-6
├── ToothDiagramOverlay.tsx        # C-4
├── internal/
│   ├── overlay-tokens.ts          # P1-2 (디자인 토큰)
│   ├── zone-color-mapper.ts       # A-2 (점수→색상)
│   ├── face-outline-path.ts       # A-8 (윤곽 생성)
│   ├── skeleton-renderer.ts       # B-1 (Canvas 드로잉)
│   └── tooth-svg-data.ts          # C-1 (치아 SVG 경로)
└── anonymous/
    ├── AnonymousFaceTemplate.tsx   # S-1
    ├── AnonymousBodyTemplate.tsx   # S-2
    ├── ShareModeToggle.tsx         # S-3
    └── AnonymousToothTemplate.tsx  # 구강 래퍼
```

---

## 8. 시지푸스 실행 계획

- **트랙**: Full (71-100점)
- **병렬화**: Phase 2 그룹 A/B/C를 sisyphus 에이전트로 동시 실행
- **품질 게이트**: 각 Phase 완료 시 `typecheck + lint`
- **최종 게이트**: Phase 4 T-4 (전체 typecheck + lint + test 통과)

---

## 9. 관련 문서

| 문서                                                        | 관계                                   |
| ----------------------------------------------------------- | -------------------------------------- |
| [ADR-097](../adr/ADR-097-visual-overlay-anonymous-share.md) | 의사결정 근거                          |
| [ADR-077](../adr/ADR-077-concern-card-pattern.md)           | Layer 1 ConcernCard (Layer 0.5와 보완) |
| [ADR-080](../adr/ADR-080-identity-first-result-framing.md)  | 강점 하이라이트 원칙                   |
| [ADR-084](../adr/ADR-084-gender-neutralization-strategy.md) | 익명 일러스트 성별 중립화              |
| [SDD-CONCERN-CARD](./SDD-CONCERN-CARD.md)                   | ConcernCard 컴포넌트 (병렬 사용)       |
| [SDD-SKIN-ANALYSIS-v2](./SDD-SKIN-ANALYSIS-v2.md)           | 피부 12존 데이터 구조                  |
| [SDD-BODY-ANALYSIS-v2](./SDD-BODY-ANALYSIS-v2.md)           | 체형 MediaPipe 인프라                  |

---

**Version**: 1.0 | **Author**: Claude Code
**총 ATOM**: 42개 | **예상 총 시간**: ~50h | **병렬화 시 압축**: ~30h (Phase 2 A/B/C + Phase 3 S-1/2/3 동시 시작)
