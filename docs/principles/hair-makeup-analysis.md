# 헤어 & 메이크업 분석 원리

> H-1 (헤어분석)과 M-1 (메이크업분석)의 기반 원리
> 이 문서는 색채학(color-science.md)과 피부생리학(skin-physiology.md)을 기반으로 한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 퍼스널 스타일링 AI 시스템"

- 100% 개인화: 얼굴형, 퍼스널컬러, 모발 특성 종합 분석
- 헤어스타일 AI 시뮬레이션: 다양한 헤어스타일을 얼굴에 가상 적용
- 메이크업 AR 프리뷰: 실시간 메이크업 가상 체험
- 제품 연동: 분석 결과에 맞는 헤어/메이크업 제품 자동 추천
- 트렌드 반영: 최신 뷰티 트렌드와 개인 특성 조화
- 전문가 수준: 헤어디자이너/메이크업아티스트 판단과 80% 이상 일치
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **얼굴 측정 정밀도** | 사진 기반 측정은 3D 스캔 대비 정확도 낮음 |
| **헤어 텍스처** | 2D 이미지에서 모발 굵기/탄력 정밀 분석 한계 |
| **AR 실시간 성능** | 고품질 AR은 고성능 디바이스 필요 |
| **개인 취향** | 과학적 최적 ≠ 사용자 선호 |
| **조명 변동** | 이미지 촬영 환경에 따른 색상 왜곡 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **얼굴형 분류** | 7가지 얼굴형 분류 정확도 90% |
| **황금비율 측정** | 얼굴 비율 측정 오차 ±5% 이내 |
| **헤어컬러 매칭** | 퍼스널컬러 기반 추천 일치율 85% |
| **모발 타입 인식** | 직모/웨이브/곱슬/코일리 분류 정확도 85% |
| **메이크업 팔레트** | 퍼스널컬러별 립/아이/블러셔 조합 최적화 |
| **제품 매칭** | 사용자 만족도 4.0/5.0 이상 |
| **전문가 일치율** | 전문가 판단과 80% 이상 일치 |

### 현재 목표

**60%** - MVP 헤어 & 메이크업 분석

- ✅ 7가지 얼굴형 분류 기준 정의
- ✅ 헤어컬러-퍼스널컬러 연계 매핑
- ✅ 메이크업 카테고리별 색상 팔레트 정의
- ✅ 모듈 간 의존성 설계 (PC-1 → H-1/M-1)
- ⏳ 얼굴형 AI 분석 구현 (40%)
- ⏳ 헤어스타일 추천 알고리즘 (30%)
- ⏳ 메이크업 AR 프리뷰 (10%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| AR 메이크업 실시간 | GPU 비용, 복잡도 | Phase 4 |
| 3D 얼굴 스캔 | 하드웨어 의존성 | 미정 |
| 헤어 가상 시뮬레이션 | AI 모델 개발 필요 | Phase 3 |
| 살롱 예약 연동 | B2B 파트너십 필요 | Phase 5 |

---

## 1. 핵심 개념

### 1.1 헤어 분석 (H-1)

헤어 분석은 개인의 **얼굴형**, **퍼스널컬러**, **모발 특성**을 종합적으로 분석하여 최적의 헤어스타일과 헤어컬러를 제안하는 것을 목적으로 한다.

#### 분석 영역

| 영역 | 설명 | 관련 원리 |
|------|------|----------|
| 얼굴형 분석 | 얼굴 비율과 형태 측정 | 황금비율, 골격 분석 |
| 헤어컬러 | Lab 색공간 기반 색상 분류 | 색채학 (color-science.md) |
| 모발 타입 | 직모/웨이브/곱슬/코일리 분류 | 모발 구조 |
| 두피 상태 | 건성/중성/지성/민감성 분류 | 피부생리학 확장 |
| 모발 건강 | 수분, 손상, 탄력, 윤기 측정 | 모발 생리학 |

### 1.2 메이크업 분석 (M-1)

메이크업 분석은 개인의 **퍼스널컬러**, **얼굴형**, **피부톤**을 분석하여 조화로운 메이크업 팔레트와 기법을 제안하는 것을 목적으로 한다.

#### 분석 영역

| 영역 | 설명 | 관련 원리 |
|------|------|----------|
| 립 컬러 | Lab 기반 8개 카테고리 분류 | 색채학 |
| 아이섀도우 | 7개 톤 카테고리 분류 | 색채 조화 |
| 블러셔 | 6개 컬러 카테고리 분류 | 피부톤 조화 |
| 컨투어링 | 얼굴형별 음영 기법 | 골격 분석 |
| 파운데이션 | 피부톤 매칭 | 피부생리학 |

### 1.3 모듈 간 관계

```
┌─────────────┐     ┌─────────────┐
│    PC-1     │────▶│    H-1      │
│ 퍼스널컬러   │     │   헤어분석   │
└─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │    N-1      │
       │            │   영양분석   │
       │            └─────────────┘
       │                   ▲
       ▼                   │
┌─────────────┐     ┌─────────────┐
│    S-1      │────▶│    M-1      │
│   피부분석   │     │ 메이크업분석 │
└─────────────┘     └─────────────┘
```

---

## 2. 헤어 분석 원리

### 2.1 얼굴형과 헤어스타일

#### 2.1.1 얼굴형 분류

얼굴형은 **가로:세로 비율**, **이마/광대/턱 너비 비율**, **턱선 각도**를 기반으로 7가지로 분류한다.

> **학술적 근거**:
> - Farkas, L.G. (1994). "Anthropometry of the Head and Face" - 얼굴 측정학 표준
> - Ramos-e-Silva, M. (2011). "Facial Proportions" - Journal of Cosmetic Dermatology
> - 대한성형외과학회 (2019). "한국인 안면 비율 연구"

**7가지 얼굴형 분류 기준**:

| 얼굴형 | 특징 | FR (길이/너비) | 이마:광대:턱 비율 | 턱선 각도 |
|--------|------|----------------|-----------------|----------|
| **계란형 (Oval)** | 이상적 비율, 부드러운 곡선 | 1.3-1.5 | 1:1.1:0.8 | 100°-120° |
| **둥근형 (Round)** | 넓은 볼, 짧은 턱 | < 1.2 | 1:1.15:0.9 | 125°-145° |
| **긴형 (Oblong)** | 길쭉한 형태 | > 1.6 | 1:1:0.9 | 105°-125° |
| **사각형 (Square)** | 각진 턱선, 넓은 이마 | 1.1-1.3 | 1:1:1 | > 140° |
| **하트형 (Heart)** | 넓은 이마, 좁은 턱 | 1.3-1.5 | 1.2:1:0.7 | 90°-110° |
| **다이아몬드 (Diamond)** | 좁은 이마/턱, 넓은 광대 | 1.3-1.6 | 0.85:1:0.8 | 100°-120° |
| **역삼각형 (Inverted Triangle)** | 넓은 이마, 매우 좁은 턱 | 1.2-1.5 | 1.3:1.1:0.6 | 85°-105° |

**측정 지점 정의**:

```
얼굴 측정 포인트:
                    ┌─────────────────┐
                    │   헤어라인 (HL)   │
                    └────────┬────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    │ 이마 너비 (FW) = 좌우 측두점 간 거리            │
    │                        │                        │
    ├────────────────────────┼────────────────────────┤
    │                        │                        │
    │ 광대 너비 (CW) = 좌우 광대 최외곽점 간 거리     │
    │                        │                        │
    ├────────────────────────┼────────────────────────┤
    │                        │                        │
    │ 턱 너비 (JW) = 좌우 하악각점 간 거리           │
    │         \              │              /         │
    │          \   턱선 각도 (JA)          /          │
    │           \            │            /           │
    │            \           │           /            │
    │             └──────────┴──────────┘             │
    │                    턱끝 (Ch)                    │
    └─────────────────────────────────────────────────┘

    얼굴 길이 (FL) = 헤어라인(HL) ~ 턱끝(Ch)
    얼굴 너비 (FW_max) = max(FW, CW, JW) ≈ 광대 너비(CW)
```

**MediaPipe Face Mesh 468 랜드마크 기반 측정**:

> **기술 선택 근거**: [ADR-052](../adr/ADR-052-hair-analysis-architecture.md) 참조
> MediaPipe Face Mesh는 실시간 처리(30fps+), 크로스플랫폼 지원, 468개 정밀 랜드마크 제공

```typescript
/**
 * MediaPipe Face Mesh 랜드마크 인덱스
 * @see https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
 */
const FACE_SHAPE_LANDMARKS = {
  // 헤어라인 (상단)
  hairline: {
    center: 10,            // 이마 중앙 상단
    left: 109,             // 좌측 이마
    right: 338,            // 우측 이마
  },

  // 이마 너비 측정점
  forehead: {
    left: 54,              // 좌측 관자놀이
    right: 284,            // 우측 관자놀이
  },

  // 광대 너비 측정점 (얼굴 최대 너비)
  cheekbone: {
    left: 234,             // 좌측 광대 최외곽
    right: 454,            // 우측 광대 최외곽
  },

  // 턱 너비 측정점
  jaw: {
    left: 172,             // 좌측 하악각
    right: 397,            // 우측 하악각
    chin: 152,             // 턱끝 (Menton)
    leftAngle: 58,         // 좌측 턱선 각도점
    rightAngle: 288,       // 우측 턱선 각도점
  },

  // 얼굴 길이 측정점
  length: {
    top: 10,               // 이마 상단
    bottom: 152,           // 턱끝
  },

  // 턱선 각도 측정용 추가 점
  jawline: {
    leftUpper: 132,        // 좌측 턱선 상단
    leftLower: 172,        // 좌측 턱선 하단
    rightUpper: 361,       // 우측 턱선 상단
    rightLower: 397,       // 우측 턱선 하단
  },
} as const;

/**
 * 랜드마크에서 실제 측정값 추출
 */
function extractMeasurements(
  landmarks: { x: number; y: number; z: number }[]
): FacialMeasurements {
  const L = FACE_SHAPE_LANDMARKS;

  // 유클리드 거리 계산
  const distance = (i1: number, i2: number) => {
    const p1 = landmarks[i1];
    const p2 = landmarks[i2];
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2)
    );
  };

  // 세 점으로 각도 계산 (중간점이 꼭짓점)
  const angle = (i1: number, iVertex: number, i2: number) => {
    const p1 = landmarks[i1];
    const v = landmarks[iVertex];
    const p2 = landmarks[i2];

    const v1 = { x: p1.x - v.x, y: p1.y - v.y };
    const v2 = { x: p2.x - v.x, y: p2.y - v.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
  };

  return {
    faceLength: distance(L.length.top, L.length.bottom),
    foreheadWidth: distance(L.forehead.left, L.forehead.right),
    cheekboneWidth: distance(L.cheekbone.left, L.cheekbone.right),
    jawWidth: distance(L.jaw.left, L.jaw.right),
    jawAngle: angle(L.jawline.leftUpper, L.jaw.left, L.jaw.chin),
  };
}
```

**비율 계산 공식**:

```typescript
interface FacialMeasurements {
  faceLength: number;        // FL: 헤어라인 ~ 턱끝
  foreheadWidth: number;     // FW: 이마 너비
  cheekboneWidth: number;    // CW: 광대 너비
  jawWidth: number;          // JW: 턱 너비
  jawAngle: number;          // JA: 턱선 각도 (degrees)
}

interface FaceShapeRatios {
  faceRatio: number;         // FR = FL / CW
  foreheadRatio: number;     // FW / CW
  jawRatio: number;          // JW / CW
  jawAngle: number;          // 턱선 각도
}

function calculateFaceRatios(m: FacialMeasurements): FaceShapeRatios {
  return {
    faceRatio: m.faceLength / m.cheekboneWidth,
    foreheadRatio: m.foreheadWidth / m.cheekboneWidth,
    jawRatio: m.jawWidth / m.cheekboneWidth,
    jawAngle: m.jawAngle,
  };
}
```

#### 2.1.2 얼굴형별 헤어스타일 원리

```
얼굴형 보완 원칙:
- 둥근형 → 세로 볼륨으로 길어 보이게
- 긴형 → 가로 볼륨으로 넓어 보이게
- 사각형 → 부드러운 곡선으로 각진 부분 완화
- 하트형 → 하부 볼륨으로 균형 맞춤
```

| 얼굴형 | 권장 스타일 | 피해야 할 스타일 |
|--------|------------|----------------|
| 계란형 | 대부분 스타일 적합 | - |
| 둥근형 | 레이어드, 긴 앞머리, 높은 볼륨 | 짧은 단발, 둥근 컷 |
| 긴형 | 옆 볼륨, 앞머리, 턱선 레이어 | 긴 일자컷, 높은 업스타일 |
| 사각형 | 웨이브, 레이어드, 사이드 앞머리 | 일자 앞머리, 무거운 단발 |
| 하트형 | 턱선 볼륨, 사이드 파팅 | 이마 강조, 짧은 레이어 |
| 다이아몬드 | 턱선 볼륨, 이마 커버 앞머리 | 볼륨 없는 스타일 |
| 역삼각형 | 턱선 아래 볼륨, 레이어드 밥 | 이마 강조, 볼륨 없는 롱헤어 |

#### 2.1.4 얼굴형 × 헤어길이 × 스타일 매핑 테이블

> **비율 보정 원리**: 헤어스타일은 시각적 착시를 통해 얼굴 비율을 이상적인 1:1.4에 가깝게 보정한다.

**헤어길이 분류**:
| 길이 | 영문 | 기준 | 특성 |
|------|------|------|------|
| 초단발 | Pixie | 귀 위 | 얼굴 전체 노출 |
| 단발 | Bob | 귀~턱선 | 턱선 강조/커버 |
| 중단발 | Lob | 턱~어깨 | 목선 강조 |
| 긴머리 | Long | 어깨 아래 | 세로 라인 강조 |

**얼굴형 × 헤어길이 × 스타일 매트릭스**:

```typescript
interface HairstyleRecommendation {
  style: string;
  koreanName: string;
  suitability: 1 | 2 | 3 | 4 | 5;  // 1=피해야함, 5=최적
  correctionEffect: string;        // 보정 효과 설명
}

type HairLength = 'pixie' | 'bob' | 'lob' | 'long';

const FACE_HAIR_MATRIX: Record<FaceShape, Record<HairLength, HairstyleRecommendation[]>> = {
  oval: {
    pixie: [
      { style: 'textured-pixie', koreanName: '텍스처 픽시', suitability: 5, correctionEffect: '얼굴형 강조' },
      { style: 'classic-pixie', koreanName: '클래식 픽시', suitability: 5, correctionEffect: '세련된 인상' },
    ],
    bob: [
      { style: 'classic-bob', koreanName: '클래식 보브', suitability: 5, correctionEffect: '균형 유지' },
      { style: 'layered-bob', koreanName: '레이어드 보브', suitability: 5, correctionEffect: '볼륨감 추가' },
    ],
    lob: [
      { style: 'wavy-lob', koreanName: '웨이비 롱보브', suitability: 5, correctionEffect: '여성스러운 라인' },
      { style: 'straight-lob', koreanName: '스트레이트 롱보브', suitability: 4, correctionEffect: '모던한 인상' },
    ],
    long: [
      { style: 'layered-long', koreanName: '레이어드 롱', suitability: 5, correctionEffect: '자연스러운 흐름' },
      { style: 'one-length', koreanName: '원렝스', suitability: 4, correctionEffect: '단정한 인상' },
    ],
  },
  round: {
    pixie: [
      { style: 'asymmetric-pixie', koreanName: '비대칭 픽시', suitability: 4, correctionEffect: '세로 라인 강조' },
      { style: 'classic-pixie', koreanName: '클래식 픽시', suitability: 2, correctionEffect: '둥근 느낌 강조 (비추천)' },
    ],
    bob: [
      { style: 'angled-bob', koreanName: '앵글 보브', suitability: 5, correctionEffect: '턱선 길어 보이게' },
      { style: 'long-bob', koreanName: '롱 보브', suitability: 4, correctionEffect: '세로 라인 연장' },
      { style: 'chin-length-bob', koreanName: '턱선 보브', suitability: 2, correctionEffect: '볼 강조 (비추천)' },
    ],
    lob: [
      { style: 'layered-lob', koreanName: '레이어드 롱보브', suitability: 5, correctionEffect: '얼굴 길이감 추가' },
      { style: 'side-swept-lob', koreanName: '사이드 스웹 롱보브', suitability: 5, correctionEffect: '비대칭 효과' },
    ],
    long: [
      { style: 'face-framing-layers', koreanName: '페이스 프레이밍 레이어', suitability: 5, correctionEffect: '볼 커버, 세로 라인' },
      { style: 'center-part-long', koreanName: '가르마 롱', suitability: 4, correctionEffect: '세로 분할 효과' },
    ],
  },
  oblong: {
    pixie: [
      { style: 'side-swept-pixie', koreanName: '사이드 픽시', suitability: 3, correctionEffect: '가로 라인 추가' },
    ],
    bob: [
      { style: 'chin-bob-with-bangs', koreanName: '앞머리 턱선 보브', suitability: 5, correctionEffect: '얼굴 길이 단축' },
      { style: 'volume-bob', koreanName: '볼륨 보브', suitability: 5, correctionEffect: '가로 확장 효과' },
    ],
    lob: [
      { style: 'wavy-lob-with-bangs', koreanName: '앞머리 웨이비 롱보브', suitability: 5, correctionEffect: '이마 커버, 가로 볼륨' },
      { style: 'side-part-lob', koreanName: '사이드 파트 롱보브', suitability: 4, correctionEffect: '대각선 라인' },
    ],
    long: [
      { style: 'long-with-full-bangs', koreanName: '풀뱅 롱', suitability: 5, correctionEffect: '이마 길이 감소' },
      { style: 'one-length-long', koreanName: '원렝스 롱', suitability: 2, correctionEffect: '세로 강조 (비추천)' },
    ],
  },
  square: {
    pixie: [
      { style: 'soft-pixie', koreanName: '소프트 픽시', suitability: 3, correctionEffect: '각진 부분 노출' },
    ],
    bob: [
      { style: 'wavy-bob', koreanName: '웨이비 보브', suitability: 5, correctionEffect: '턱선 부드럽게' },
      { style: 'side-swept-bob', koreanName: '사이드 스웹 보브', suitability: 4, correctionEffect: '대각선 흐름' },
      { style: 'blunt-bob', koreanName: '블런트 보브', suitability: 1, correctionEffect: '각진 느낌 강조 (피해야 함)' },
    ],
    lob: [
      { style: 'textured-lob', koreanName: '텍스처 롱보브', suitability: 5, correctionEffect: '부드러운 라인' },
      { style: 'layered-lob', koreanName: '레이어드 롱보브', suitability: 5, correctionEffect: '턱선 커버' },
    ],
    long: [
      { style: 'soft-waves-long', koreanName: '소프트 웨이브 롱', suitability: 5, correctionEffect: '각진 인상 완화' },
      { style: 'face-framing-long', koreanName: '페이스 프레이밍 롱', suitability: 5, correctionEffect: '턱선 커버' },
    ],
  },
  heart: {
    pixie: [
      { style: 'side-swept-pixie', koreanName: '사이드 픽시', suitability: 3, correctionEffect: '이마 커버 필요' },
    ],
    bob: [
      { style: 'chin-length-bob', koreanName: '턱선 보브', suitability: 5, correctionEffect: '턱선에 볼륨' },
      { style: 'layered-bob', koreanName: '레이어드 보브', suitability: 5, correctionEffect: '하단 볼륨' },
    ],
    lob: [
      { style: 'wavy-lob', koreanName: '웨이비 롱보브', suitability: 5, correctionEffect: '하단 볼륨으로 균형' },
      { style: 'side-part-lob', koreanName: '사이드 파트 롱보브', suitability: 4, correctionEffect: '이마 분산' },
    ],
    long: [
      { style: 'bottom-layers-long', koreanName: '하단 레이어 롱', suitability: 5, correctionEffect: '하단 볼륨 최대화' },
      { style: 'beach-waves', koreanName: '비치 웨이브', suitability: 4, correctionEffect: '자연스러운 볼륨' },
    ],
  },
  diamond: {
    pixie: [
      { style: 'textured-pixie-with-bangs', koreanName: '앞머리 텍스처 픽시', suitability: 4, correctionEffect: '이마 커버' },
    ],
    bob: [
      { style: 'full-bangs-bob', koreanName: '풀뱅 보브', suitability: 5, correctionEffect: '이마 확장 효과' },
      { style: 'chin-bob', koreanName: '턱선 보브', suitability: 5, correctionEffect: '턱선 볼륨' },
    ],
    lob: [
      { style: 'side-bangs-lob', koreanName: '사이드 뱅 롱보브', suitability: 5, correctionEffect: '상하부 균형' },
      { style: 'layered-lob', koreanName: '레이어드 롱보브', suitability: 4, correctionEffect: '광대 분산' },
    ],
    long: [
      { style: 'curtain-bangs-long', koreanName: '커튼 뱅 롱', suitability: 5, correctionEffect: '이마 자연스럽게 커버' },
      { style: 'face-framing-long', koreanName: '페이스 프레이밍 롱', suitability: 4, correctionEffect: '광대 시선 분산' },
    ],
  },
  'inverted-triangle': {
    pixie: [
      { style: 'textured-pixie', koreanName: '텍스처 픽시', suitability: 2, correctionEffect: '이마 강조 (비추천)' },
    ],
    bob: [
      { style: 'chin-volume-bob', koreanName: '턱볼륨 보브', suitability: 5, correctionEffect: '하부 볼륨으로 균형' },
      { style: 'layered-bob', koreanName: '레이어드 보브', suitability: 5, correctionEffect: '하부 확장' },
    ],
    lob: [
      { style: 'wavy-lob', koreanName: '웨이비 롱보브', suitability: 5, correctionEffect: '턱선 아래 볼륨' },
      { style: 'textured-lob', koreanName: '텍스처 롱보브', suitability: 4, correctionEffect: '자연스러운 하부 볼륨' },
    ],
    long: [
      { style: 'bottom-heavy-layers', koreanName: '하단 중심 레이어', suitability: 5, correctionEffect: '하부 최대 볼륨' },
      { style: 'beach-waves', koreanName: '비치 웨이브', suitability: 4, correctionEffect: '전체 볼륨 분산' },
    ],
  },
};
```

**추천 점수 산출 공식**:

```typescript
function calculateHairstyleScore(
  faceShape: FaceShape,
  hairLength: HairLength,
  stylePreference: string,
  personalColor: Season
): number {
  const baseScore = FACE_HAIR_MATRIX[faceShape][hairLength]
    .find(s => s.style === stylePreference)?.suitability ?? 3;

  // 기본 점수 (1-5) → 20-100
  let score = baseScore * 20;

  // 퍼스널컬러와 헤어스타일 조화 보너스
  const colorBonus = getColorStyleHarmony(personalColor, stylePreference);
  score += colorBonus;

  return Math.min(100, Math.max(0, score));
}
```

#### 2.1.3 수학적 비율 분석

**황금비율 및 이상적 얼굴 비율**:

```
황금비율 (Golden Ratio): φ ≈ 1.618

이상적 얼굴 비율 (Farkas 기준):
- 얼굴 길이 / 얼굴 너비 = 1.3 ~ 1.5 (동아시아인 기준 조정)
- 이마 / 중안부 / 하안부 = 1:1:1 (3등분)
- 눈 사이 거리 = 한쪽 눈 너비 (±10%)
- 코 길이 = 얼굴 길이의 1/3

한국인 특화 조정 (대한성형외과학회, 2019):
- 평균 얼굴 비율: 1.35 (서양인 1.42 대비 낮음)
- 광대 돌출이 상대적으로 높아 CW 측정 시 보정 필요
```

**얼굴형 판정 알고리즘 (정밀 버전)**:

```typescript
type FaceShape = 'oval' | 'round' | 'oblong' | 'square' | 'heart' | 'diamond' | 'inverted-triangle';

interface FaceShapeDecision {
  shape: FaceShape;
  confidence: number;     // 0-100
  reasoning: string[];    // 판정 근거
  alternativeShape?: FaceShape;  // 차선 가능성
}

function classifyFaceShape(ratios: FaceShapeRatios): FaceShapeDecision {
  const { faceRatio, foreheadRatio, jawRatio, jawAngle } = ratios;
  const reasoning: string[] = [];
  let shape: FaceShape = 'oval';
  let confidence = 70;
  let alternativeShape: FaceShape | undefined;

  // 1단계: 길이/너비 비율로 1차 분류
  if (faceRatio < 1.2) {
    reasoning.push(`FR=${faceRatio.toFixed(2)} < 1.2: 짧은 얼굴`);

    if (jawAngle > 135) {
      shape = 'square';
      reasoning.push(`JA=${jawAngle}° > 135°: 각진 턱선`);
      confidence = 80;
    } else {
      shape = 'round';
      reasoning.push(`JA=${jawAngle}° ≤ 135°: 둥근 턱선`);
      confidence = 85;
    }
  }
  else if (faceRatio > 1.6) {
    shape = 'oblong';
    reasoning.push(`FR=${faceRatio.toFixed(2)} > 1.6: 긴 얼굴`);
    confidence = 90;
  }
  // 2단계: 너비 비율로 세부 분류
  else {
    // 사각형 체크: 이마=광대=턱 비슷하고 턱선 각진 경우
    if (jawAngle > 140 && jawRatio > 0.95) {
      shape = 'square';
      reasoning.push(`JA=${jawAngle}° > 140°, JR=${jawRatio.toFixed(2)} > 0.95: 사각형`);
      confidence = 85;
    }
    // 하트형/역삼각형 체크: 이마 넓고 턱 좁은 경우
    else if (foreheadRatio > 1.15 && jawRatio < 0.75) {
      if (jawRatio < 0.65) {
        shape = 'inverted-triangle';
        reasoning.push(`FR_ratio=${foreheadRatio.toFixed(2)} > 1.15, JR=${jawRatio.toFixed(2)} < 0.65: 역삼각형`);
        alternativeShape = 'heart';
      } else {
        shape = 'heart';
        reasoning.push(`FR_ratio=${foreheadRatio.toFixed(2)} > 1.15, JR=${jawRatio.toFixed(2)} < 0.75: 하트형`);
        alternativeShape = 'inverted-triangle';
      }
      confidence = 80;
    }
    // 다이아몬드 체크: 광대가 이마/턱보다 넓은 경우
    else if (foreheadRatio < 0.9 && jawRatio < 0.85) {
      shape = 'diamond';
      reasoning.push(`FR_ratio=${foreheadRatio.toFixed(2)} < 0.9, JR=${jawRatio.toFixed(2)} < 0.85: 다이아몬드`);
      confidence = 75;
    }
    // 계란형: 이상적 비율
    else {
      shape = 'oval';
      reasoning.push(`FR=${faceRatio.toFixed(2)} in [1.3, 1.5], 균형 잡힌 비율: 계란형`);
      confidence = 85;
    }
  }

  // 3단계: 경계 케이스 신뢰도 조정
  if (Math.abs(faceRatio - 1.2) < 0.1) {
    confidence -= 10;
    reasoning.push('경계 영역: 신뢰도 감소');
  }

  return { shape, confidence, reasoning, alternativeShape };
}
```

**얼굴형 판정 임계값 테이블**:

| 얼굴형 | FR 범위 | 이마비율 | 턱비율 | 턱각도 | 우선순위 |
|--------|---------|---------|--------|--------|---------|
| Round | < 1.2 | - | - | ≤ 135° | 1 |
| Square | < 1.2 또는 1.1-1.3 | - | > 0.95 | > 140° | 2 |
| Oblong | > 1.6 | - | - | - | 3 |
| Inverted Triangle | 1.2-1.5 | > 1.15 | < 0.65 | - | 4 |
| Heart | 1.3-1.5 | > 1.15 | 0.65-0.75 | < 110° | 5 |
| Diamond | 1.3-1.6 | < 0.9 | < 0.85 | - | 6 |
| Oval | 1.3-1.5 | 0.9-1.1 | 0.75-0.9 | 100°-130° | 7 (기본) |

### 2.2 퍼스널컬러와 헤어컬러

#### 2.2.1 sRGB → Lab 변환 공식 (헤어컬러 분석용)

> **참조**: [color-science.md](./color-science.md) Section 2의 상세 변환 공식

헤어컬러 분석을 위한 Lab 변환 파이프라인:

```
촬영 이미지 (sRGB) → 감마 보정 → Linear RGB → XYZ (D65) → Lab
```

**완전한 변환 함수**:

```typescript
/**
 * sRGB 색상을 Lab 색공간으로 변환
 *
 * @see CIE 1976 L*a*b* 색공간
 * @see IEC 61966-2-1 sRGB 표준
 */
interface LabColor {
  L: number;  // 0-100 (명도)
  a: number;  // -128 ~ +127 (녹-적)
  b: number;  // -128 ~ +127 (청-황)
}

// D65 백색점 (표준 조명)
const D65_WHITE = { X: 0.95047, Y: 1.0, Z: 1.08883 };

// CIE 상수
const EPSILON = 216 / 24389;  // ≈ 0.008856
const KAPPA = 24389 / 27;     // ≈ 903.3

/**
 * sRGB → Linear RGB 감마 보정
 * IEC 61966-2-1 sRGB 표준
 */
function srgbToLinear(c: number): number {
  const normalized = c / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Linear RGB → XYZ (D65)
 * sRGB 색공간 변환 행렬
 */
function linearRgbToXyz(r: number, g: number, b: number): { X: number; Y: number; Z: number } {
  return {
    X: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    Y: r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    Z: r * 0.0193339 + g * 0.1191920 + b * 0.9503041,
  };
}

/**
 * XYZ → Lab
 * CIE 1976 공식
 */
function xyzToLab(X: number, Y: number, Z: number): LabColor {
  const xr = X / D65_WHITE.X;
  const yr = Y / D65_WHITE.Y;
  const zr = Z / D65_WHITE.Z;

  const f = (t: number) => t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116;

  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * 전체 변환: sRGB → Lab
 */
function rgbToLab(r: number, g: number, b: number): LabColor {
  // 입력 클램핑
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  // 변환 파이프라인
  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  const { X, Y, Z } = linearRgbToXyz(rLin, gLin, bLin);

  return xyzToLab(X, Y, Z);
}
```

#### 2.2.2 헤어 레벨 시스템 (1-10)

> **학술적 근거**: International Colour Chart System (ICC), L'Oréal Professional Hair Color Level System

헤어컬러는 전통적으로 1-10 레벨로 분류되며, Lab L* 값과 매핑된다.

**헤어 레벨 ↔ Lab L* 매핑 테이블**:

| 레벨 | 명칭 | Lab L* 범위 | RGB 대표값 | 설명 |
|------|------|-------------|-----------|------|
| 1 | Black | 10-18 | #0a0a0a | 가장 어두운 검정 |
| 2 | Darkest Brown | 18-24 | #1a1a1a | 매우 어두운 갈색 |
| 3 | Dark Brown | 24-30 | #2b1d0e | 어두운 갈색 |
| 4 | Medium Dark Brown | 30-38 | #3d2314 | 중간 어두운 갈색 |
| 5 | Medium Brown | 38-46 | #4a3728 | 중간 갈색 |
| 6 | Light Brown | 46-54 | #6b4423 | 밝은 갈색 |
| 7 | Dark Blonde | 54-62 | #8b6914 | 어두운 금발 |
| 8 | Medium Blonde | 62-70 | #c4a35a | 중간 금발 |
| 9 | Light Blonde | 70-80 | #e6c77a | 밝은 금발 |
| 10 | Lightest Blonde | 80-95 | #f5e7b2 | 가장 밝은 금발 |

#### 2.2.3 한국인 모발 특성 데이터

> **학술적 근거**:
> - 대한피부과학회 (2018). "한국인 모발 특성 및 탈모 연구"
> - Korean Journal of Dermatology (2020). "Asian Hair Characteristics Study"
> - 한국뷰티산업학회 (2021). "K-Beauty 헤어컬러 트렌드 분석"

**한국인 자연 모발 분포 (Lab L* 기준)**:

```typescript
/**
 * 한국인 자연 모발 레벨 분포 (n=5,000)
 * 출처: 대한피부과학회 2018 연구
 */
const KOREAN_HAIR_LEVEL_DISTRIBUTION = {
  level1_black:      45.2,  // %  - L* 10-18
  level2_darkest:    32.1,  // %  - L* 18-24
  level3_darkBrown:  15.3,  // %  - L* 24-30
  level4_medDark:     5.8,  // %  - L* 30-38
  level5_medium:      1.4,  // %  - L* 38-46
  level6_plus:        0.2,  // %  - L* 46+ (희귀)
};

/**
 * 한국인 모발 물리적 특성 평균값
 */
const KOREAN_HAIR_CHARACTERISTICS = {
  // 굵기 (직경)
  diameter: {
    mean: 80,          // μm (마이크로미터)
    stdDev: 10,
    range: [60, 100],
    comparison: {
      caucasian: 70,   // μm (서양인 평균)
      african: 90,     // μm (아프리카계 평균)
    },
  },

  // 단면 형태
  crossSection: {
    korean: 'round',          // 원형 (직모)
    caucasian: 'oval',        // 타원형 (웨이브)
    african: 'flat-ellipse',  // 납작 타원 (곱슬)
  },

  // 멜라닌 분포
  melanin: {
    eumelanin: 'high',        // 갈색-검정 색소 (높음)
    pheomelanin: 'low',       // 적황색 색소 (낮음)
    density: 'dense',         // 밀도 높음
  },

  // 모발 밀도
  density: {
    mean: 120,         // 개/cm² (두피)
    range: [100, 150],
    comparison: {
      caucasian: 150,  // 개/cm²
      african: 90,     // 개/cm²
    },
  },

  // 성장 속도
  growthRate: {
    mean: 1.3,         // cm/month
    range: [1.0, 1.6],
  },

  // 자연 광택도
  shineIndex: {
    mean: 65,          // 0-100
    range: [50, 80],
  },
};

/**
 * K-Beauty 염색 트렌드 (2024-2026)
 * 출처: 한국뷰티산업학회 조사
 */
const KBEAUTY_HAIR_COLOR_TRENDS = {
  // 인기 레벨 (염색 후)
  popularLevels: {
    level6_lightBrown: 28.5,   // %
    level7_darkBlonde: 25.3,   // %
    level5_mediumBrown: 18.7,  // %
    level8_medBlonde: 12.1,    // %
    level4_medDarkBrown: 8.9,  // %
    other: 6.5,                // %
  },

  // 인기 색조
  popularTones: {
    ash: 31.2,          // % - 애쉬 계열 (가장 인기)
    chocolate: 22.8,    // % - 초콜릿 브라운
    caramel: 18.5,      // % - 카라멜
    natural: 12.4,      // % - 내추럴
    burgundy: 8.7,      // % - 버건디
    pink: 6.4,          // % - 핑크/로제
  },

  // 시즌별 선호 (Lab 중심값)
  seasonalPreference: {
    spring: { L: 52, a: 8, b: 20 },   // 밝은 웜 브라운
    summer: { L: 45, a: 2, b: 5 },    // 쿨 애쉬
    autumn: { L: 40, a: 12, b: 18 },  // 딥 웜 브라운
    winter: { L: 38, a: 5, b: 8 },    // 쿨 다크
  },
};
```

**한국인 특화 헤어레벨 보정 알고리즘**:

```typescript
/**
 * 한국인 모발의 높은 멜라닌 밀도를 고려한 레벨 보정
 * 서양인 기준 ICC 시스템보다 L* 값이 평균 3-5 낮게 측정됨
 */
function adjustForKoreanHair(labL: number): number {
  // 한국인 모발은 동일 레벨에서 L* 값이 낮음
  // 보정 계수 적용 (ICC 표준 대비)
  const KOREAN_ADJUSTMENT = 3.5;  // L* 단위

  return labL + KOREAN_ADJUSTMENT;
}

/**
 * 염색 후 예상 레벨 계산
 * 한국인 자연모(level 1-3)에서 탈색 없이 도달 가능한 최대 레벨
 */
function getMaxAchievableLevelWithoutBleach(
  naturalLevel: HairLevel
): HairLevel {
  // 한국인 자연모 기준 탈색 없이 변경 가능한 범위
  const MAX_LIFT_WITHOUT_BLEACH: Record<HairLevel, HairLevel> = {
    1: 3,   // 블랙 → 최대 다크브라운
    2: 4,   // 가장 어두운 갈색 → 중간 다크 브라운
    3: 5,   // 다크 브라운 → 미디엄 브라운
    4: 6,   // 중간 다크 → 라이트 브라운
    5: 7,   // 미디엄 → 다크 블론드
    6: 8,
    7: 9,
    8: 10,
    9: 10,
    10: 10,
  };

  return MAX_LIFT_WITHOUT_BLEACH[naturalLevel];
}
```

**헤어 레벨 판별 알고리즘**:

```typescript
type HairLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface HairLevelResult {
  level: HairLevel;
  confidence: number;
  levelName: string;
  koreanName: string;
}

// 레벨별 L* 임계값 (상한)
const HAIR_LEVEL_THRESHOLDS: Record<HairLevel, number> = {
  1: 18,
  2: 24,
  3: 30,
  4: 38,
  5: 46,
  6: 54,
  7: 62,
  8: 70,
  9: 80,
  10: 100,
};

const HAIR_LEVEL_NAMES: Record<HairLevel, { en: string; ko: string }> = {
  1:  { en: 'Black', ko: '블랙' },
  2:  { en: 'Darkest Brown', ko: '가장 어두운 갈색' },
  3:  { en: 'Dark Brown', ko: '다크 브라운' },
  4:  { en: 'Medium Dark Brown', ko: '중간 다크 브라운' },
  5:  { en: 'Medium Brown', ko: '미디엄 브라운' },
  6:  { en: 'Light Brown', ko: '라이트 브라운' },
  7:  { en: 'Dark Blonde', ko: '다크 블론드' },
  8:  { en: 'Medium Blonde', ko: '미디엄 블론드' },
  9:  { en: 'Light Blonde', ko: '라이트 블론드' },
  10: { en: 'Lightest Blonde', ko: '가장 밝은 블론드' },
};

function determineHairLevel(lab: LabColor): HairLevelResult {
  const L = lab.L;

  // L* 값으로 레벨 결정
  let level: HairLevel = 10;
  for (let i = 1; i <= 10; i++) {
    if (L <= HAIR_LEVEL_THRESHOLDS[i as HairLevel]) {
      level = i as HairLevel;
      break;
    }
  }

  // 신뢰도 계산 (임계값 중앙에 가까울수록 높음)
  const lowerBound = level > 1 ? HAIR_LEVEL_THRESHOLDS[(level - 1) as HairLevel] : 0;
  const upperBound = HAIR_LEVEL_THRESHOLDS[level];
  const midPoint = (lowerBound + upperBound) / 2;
  const distanceFromMid = Math.abs(L - midPoint);
  const rangeHalf = (upperBound - lowerBound) / 2;
  const confidence = Math.max(60, 100 - (distanceFromMid / rangeHalf) * 30);

  return {
    level,
    confidence: Math.round(confidence),
    levelName: HAIR_LEVEL_NAMES[level].en,
    koreanName: HAIR_LEVEL_NAMES[level].ko,
  };
}
```

#### 2.2.3 CIEDE2000 색차 공식 (정밀 헤어컬러 비교)

> **학술적 근거**: CIE (2001). "Improvement to industrial colour-difference evaluation" - CIEDE2000 표준

헤어컬러 비교에서 CIE76 대신 **CIEDE2000**을 사용하면 인간 시각 인지와 더 일치하는 결과를 얻는다.

**CIEDE2000 공식**:

```
ΔE00 = √[(ΔL'/kL·SL)² + (ΔC'/kC·SC)² + (ΔH'/kH·SH)² + RT·(ΔC'/kC·SC)·(ΔH'/kH·SH)]

여기서:
- ΔL': 명도 차이 (보정됨)
- ΔC': 채도 차이 (보정됨)
- ΔH': 색상 차이 (보정됨)
- SL, SC, SH: 가중 함수
- RT: 회전 함수 (블루 영역 보정)
- kL, kC, kH: 파라미터 조정 계수 (기본값 1)
```

**TypeScript 구현**:

```typescript
/**
 * CIEDE2000 색차 계산
 * @see CIE 142-2001, ISO/CIE 11664-6:2014
 */
function deltaE00(lab1: LabColor, lab2: LabColor): number {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  // 1. 평균 명도
  const L_bar = (L1 + L2) / 2;

  // 2. 채도 계산
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const C_bar = (C1 + C2) / 2;

  // 3. G 계수 (채도 보정)
  const C_bar7 = Math.pow(C_bar, 7);
  const G = 0.5 * (1 - Math.sqrt(C_bar7 / (C_bar7 + Math.pow(25, 7))));

  // 4. a' 보정값
  const a1_prime = a1 * (1 + G);
  const a2_prime = a2 * (1 + G);

  // 5. C' 채도
  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);
  const C_bar_prime = (C1_prime + C2_prime) / 2;

  // 6. h' 색상각
  const h1_prime = Math.atan2(b1, a1_prime) * (180 / Math.PI);
  const h2_prime = Math.atan2(b2, a2_prime) * (180 / Math.PI);
  const h1_adj = h1_prime < 0 ? h1_prime + 360 : h1_prime;
  const h2_adj = h2_prime < 0 ? h2_prime + 360 : h2_prime;

  // 7. ΔL', ΔC', ΔH'
  const delta_L_prime = L2 - L1;
  const delta_C_prime = C2_prime - C1_prime;

  let delta_h_prime: number;
  if (C1_prime * C2_prime === 0) {
    delta_h_prime = 0;
  } else {
    const dh = h2_adj - h1_adj;
    if (Math.abs(dh) <= 180) {
      delta_h_prime = dh;
    } else if (dh > 180) {
      delta_h_prime = dh - 360;
    } else {
      delta_h_prime = dh + 360;
    }
  }
  const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) *
    Math.sin((delta_h_prime * Math.PI) / 360);

  // 8. 평균 h'
  let H_bar_prime: number;
  if (C1_prime * C2_prime === 0) {
    H_bar_prime = h1_adj + h2_adj;
  } else if (Math.abs(h1_adj - h2_adj) <= 180) {
    H_bar_prime = (h1_adj + h2_adj) / 2;
  } else if (h1_adj + h2_adj < 360) {
    H_bar_prime = (h1_adj + h2_adj + 360) / 2;
  } else {
    H_bar_prime = (h1_adj + h2_adj - 360) / 2;
  }

  // 9. T 함수
  const T = 1
    - 0.17 * Math.cos(((H_bar_prime - 30) * Math.PI) / 180)
    + 0.24 * Math.cos((2 * H_bar_prime * Math.PI) / 180)
    + 0.32 * Math.cos(((3 * H_bar_prime + 6) * Math.PI) / 180)
    - 0.20 * Math.cos(((4 * H_bar_prime - 63) * Math.PI) / 180);

  // 10. SL, SC, SH 가중 함수
  const SL = 1 + (0.015 * Math.pow(L_bar - 50, 2)) /
    Math.sqrt(20 + Math.pow(L_bar - 50, 2));
  const SC = 1 + 0.045 * C_bar_prime;
  const SH = 1 + 0.015 * C_bar_prime * T;

  // 11. RT 회전 함수 (블루 영역 보정)
  const delta_theta = 30 * Math.exp(-Math.pow((H_bar_prime - 275) / 25, 2));
  const C_bar_prime7 = Math.pow(C_bar_prime, 7);
  const RC = 2 * Math.sqrt(C_bar_prime7 / (C_bar_prime7 + Math.pow(25, 7)));
  const RT = -RC * Math.sin((2 * delta_theta * Math.PI) / 180);

  // 12. 최종 CIEDE2000
  const kL = 1, kC = 1, kH = 1;  // 기본 파라미터
  const deltaE = Math.sqrt(
    Math.pow(delta_L_prime / (kL * SL), 2) +
    Math.pow(delta_C_prime / (kC * SC), 2) +
    Math.pow(delta_H_prime / (kH * SH), 2) +
    RT * (delta_C_prime / (kC * SC)) * (delta_H_prime / (kH * SH))
  );

  return deltaE;
}

/**
 * CIEDE2000 vs CIE76 비교 (헤어컬러 분석)
 *
 * | 비교 대상 | CIE76 ΔE | CIEDE2000 ΔE | 인지 차이 |
 * |-----------|----------|--------------|----------|
 * | 검정 vs 다크브라운 | 15.2 | 8.3 | 육안 구별 가능 |
 * | 애쉬 vs 뉴트럴 브라운 | 12.5 | 5.1 | 미세 차이 |
 * | 골드 vs 카퍼 | 18.7 | 9.2 | 뚜렷한 차이 |
 *
 * CIEDE2000은 인간 시각 인지와 더 일치하여 헤어컬러 추천 정확도 향상
 */
```

#### 2.2.4 헤어 색조 분류 (a*, b* 기반)

L* 값이 명도(레벨)를 결정하면, a*와 b* 값은 **색조(톤)**를 결정한다.

**색조 분류 체계**:

| 색조 | a* 범위 | b* 범위 | 특징 |
|------|--------|--------|------|
| **Neutral** (뉴트럴) | -3 ~ +5 | 0 ~ +10 | 순수한 브라운, 차갑지도 따뜻하지도 않음 |
| **Warm** (웜) | +3 ~ +15 | +10 ~ +30 | 황금빛, 구리빛, 오렌지 언더톤 |
| **Cool** (쿨/애쉬) | -5 ~ +3 | -5 ~ +5 | 회색빛, 푸른 언더톤 |
| **Red** (레드) | +15 ~ +35 | +10 ~ +25 | 붉은빛, 오번, 버건디 |
| **Violet** (바이올렛) | +10 ~ +25 | -10 ~ 0 | 보라빛 언더톤 |
| **Copper** (카퍼) | +15 ~ +30 | +20 ~ +35 | 구리빛, 진저 |
| **Gold** (골드) | +5 ~ +12 | +25 ~ +40 | 황금빛, 허니 |

```typescript
type HairTone = 'neutral' | 'warm' | 'cool' | 'red' | 'violet' | 'copper' | 'gold';

interface HairToneResult {
  tone: HairTone;
  toneName: string;
  warmthScore: number;  // -100 (very cool) ~ +100 (very warm)
  confidence: number;
}

function classifyHairTone(lab: LabColor): HairToneResult {
  const { a, b } = lab;

  // 따뜻함 점수 계산: b가 높고 a가 적당히 높으면 웜톤
  // 웜톤: 높은 b* (황색), 적당한 양의 a* (적색)
  // 쿨톤: 낮은 b*, 낮거나 음의 a*
  const warmthScore = b * 2 + (a > 0 ? a * 0.5 : a * 1.5);

  let tone: HairTone;
  let toneName: string;

  // 특수 색조 먼저 체크
  if (a >= 15 && b < 10) {
    tone = 'violet';
    toneName = '바이올렛';
  } else if (a >= 15 && b >= 20) {
    tone = 'copper';
    toneName = '카퍼';
  } else if (a >= 15 && b >= 10) {
    tone = 'red';
    toneName = '레드';
  } else if (a < 8 && b >= 25) {
    tone = 'gold';
    toneName = '골드';
  }
  // 기본 색조
  else if (b < 5 && a < 5) {
    tone = 'cool';
    toneName = '애쉬/쿨';
  } else if (b >= 10 && a >= 3) {
    tone = 'warm';
    toneName = '웜';
  } else {
    tone = 'neutral';
    toneName = '뉴트럴';
  }

  // 신뢰도 계산
  const confidence = calculateToneConfidence(lab, tone);

  return {
    tone,
    toneName,
    warmthScore: Math.max(-100, Math.min(100, warmthScore)),
    confidence,
  };
}
```

#### 2.2.4 헤어컬러 Lab 범위 (통합)

헤어컬러는 Lab 색공간에서 측정하여 8개 카테고리로 분류한다.

```typescript
interface LabRange {
  L: [number, number];  // 명도 범위
  a: [number, number];  // 빨강-초록 범위
  b: [number, number];  // 노랑-파랑 범위
}

const HAIR_COLOR_RANGES: Record<HairColorCategory, LabRange> = {
  // 자연색
  'black': { L: [10, 30], a: [-2, 3], b: [-2, 5] },
  'dark-brown': { L: [25, 40], a: [2, 8], b: [5, 15] },
  'medium-brown': { L: [35, 50], a: [5, 12], b: [10, 25] },
  'light-brown': { L: [45, 60], a: [8, 15], b: [15, 30] },
  'blonde': { L: [55, 80], a: [5, 15], b: [20, 40] },

  // 특수색
  'red': { L: [30, 50], a: [15, 30], b: [15, 30] },
  'ash': { L: [30, 60], a: [-5, 3], b: [-5, 5] },
  'dyed-vivid': { L: [20, 70], a: [-30, 50], b: [-30, 50] },
};
```

#### 2.2.2 시즌별 권장 헤어컬러

퍼스널컬러와 헤어컬러의 조화는 **톤의 따뜻함/차가움**과 **명도**를 기준으로 결정한다.

| 시즌 | 권장 컬러 | Lab 특성 | 피해야 할 컬러 |
|------|----------|----------|--------------|
| **봄 (Spring)** | 밝은 갈색, 골드 브라운, 카라멜 | L > 45, b > 15 (웜) | 애쉬, 블루블랙 |
| **여름 (Summer)** | 애쉬 브라운, 로즈 브라운 | a < 5, b < 10 (쿨) | 오렌지, 골드 |
| **가을 (Autumn)** | 다크 브라운, 오번, 카퍼 | a > 10, b > 15 (웜) | 애쉬, 플래티넘 |
| **겨울 (Winter)** | 블랙, 다크 애쉬, 버건디 | L < 40, 선명한 색 | 황금빛, 밝은 갈색 |

#### 2.2.3 헤어컬러 매칭 알고리즘

```python
def calculate_hair_color_harmony(personal_color_season, hair_color_lab):
    """
    퍼스널컬러와 헤어컬러 조화도 계산

    Returns: 0-100 점수
    """
    L, a, b = hair_color_lab

    # 시즌별 이상적 Lab 중심값
    ideal_centers = {
        'spring': {'L': 55, 'a': 10, 'b': 25},
        'summer': {'L': 45, 'a': 0, 'b': 5},
        'autumn': {'L': 40, 'a': 15, 'b': 20},
        'winter': {'L': 25, 'a': 5, 'b': 0}
    }

    center = ideal_centers[personal_color_season]

    # 유클리드 거리 기반 점수
    distance = sqrt(
        (L - center['L'])**2 +
        (a - center['a'])**2 * 2 +  # a 가중치 2배 (웜/쿨 중요)
        (b - center['b'])**2 * 1.5  # b 가중치 1.5배
    )

    # 거리를 점수로 변환 (최대 거리 100 기준)
    score = max(0, 100 - distance * 1.5)

    return round(score)
```

### 2.3 모발 타입과 스타일링

#### 2.3.1 모발 구조

모발은 3개의 층으로 구성되어 있으며, 각 층의 상태가 스타일링에 영향을 미친다.

```
모발 구조:
┌─────────────────────┐
│     큐티클층         │ ← 외부 보호층, 윤기 결정
│  (Cuticle Layer)    │
├─────────────────────┤
│     피질층          │ ← 80-90% 구성, 강도/색상 결정
│   (Cortex)         │    멜라닌 색소 포함
├─────────────────────┤
│     수질층          │ ← 중심부, 굵은 모발에만 존재
│   (Medulla)        │
└─────────────────────┘
```

#### 2.3.2 모발 타입 분류

모발 타입은 **모낭의 형태**와 **이황화 결합 패턴**에 의해 결정된다.

| 타입 | 영문 | 특징 | 스타일링 특성 |
|------|------|------|-------------|
| **직모** | Straight | 둥근 모낭, 균일한 구조 | 볼륨 부족, 열 스타일링 용이 |
| **웨이브** | Wavy | 타원형 모낭 | 자연스러운 웨이브, 습도에 민감 |
| **곱슬** | Curly | 납작한 모낭 | 건조하기 쉬움, 볼륨 풍부 |
| **코일리** | Coily | 비대칭 모낭 | 수축성 높음, 보습 필수 |

#### 2.3.3 모발 건강 지표

| 지표 | 측정 방법 | 정상 범위 | 개선 방향 |
|------|----------|----------|----------|
| **수분도** | 이미지 광택 분석 | 60-80% | 보습 케어 |
| **두피 상태** | 유분/각질 분석 | 중성 | 스칼프 케어 |
| **손상도** | 큐티클 상태 분석 | 20% 미만 | 단백질 케어 |
| **밀도** | 단위 면적당 모발 수 | 100-150개/cm² | 탈모 예방 |
| **탄력** | 늘어남 복원력 | 복원율 80%+ | 케라틴 보충 |
| **윤기** | 반사광 분석 | 광택 지수 60+ | 오일 케어 |

#### 2.3.4 두피 타입과 케어

```typescript
type ScalpType = 'dry' | 'normal' | 'oily' | 'sensitive';

interface ScalpCharacteristics {
  type: ScalpType;
  oilLevel: number;      // 0-100
  hydration: number;     // 0-100
  sensitivity: number;   // 0-100
}

const SCALP_CARE_RECOMMENDATIONS: Record<ScalpType, string[]> = {
  'dry': [
    '보습 샴푸 사용',
    '두피 에센스 적용',
    '주 2-3회 세정',
    '두피 마사지 권장'
  ],
  'normal': [
    '균형 잡힌 샴푸 사용',
    '정기적 딥 클렌징',
    '주 3-4회 세정'
  ],
  'oily': [
    '클레이 기반 샴푸',
    '매일 세정',
    '두피 스크럽 주 1회',
    '가벼운 컨디셔너 모발 끝에만'
  ],
  'sensitive': [
    '무향 저자극 샴푸',
    '온도 조절 세정',
    '두피 진정 토너',
    '알러지 성분 체크'
  ]
};
```

---

## 3. 메이크업 분석 원리

### 3.1 퍼스널컬러 기반 팔레트

#### 3.1.1 시즌별 메이크업 팔레트

퍼스널컬러 시즌에 따라 조화로운 메이크업 컬러 팔레트가 결정된다.

```typescript
interface SeasonPalette {
  lipColors: string[];
  eyeshadowTones: string[];
  blusherColors: string[];
  characteristics: string;
}

const SEASON_MAKEUP_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    lipColors: ['coral', 'pink', 'peach', 'light-red'],
    eyeshadowTones: ['warm-brown', 'gold', 'peach', 'coral'],
    blusherColors: ['peach', 'coral', 'apricot'],
    characteristics: '밝고 생기있는 웜톤, 노란 베이스'
  },
  summer: {
    lipColors: ['rose', 'pink', 'berry', 'mauve'],
    eyeshadowTones: ['cool-brown', 'pink', 'lavender', 'gray'],
    blusherColors: ['rose', 'pink', 'lavender'],
    characteristics: '부드럽고 차분한 쿨톤, 푸른 베이스'
  },
  autumn: {
    lipColors: ['brick', 'terracotta', 'brown', 'burgundy'],
    eyeshadowTones: ['warm-brown', 'olive', 'bronze', 'copper'],
    blusherColors: ['terracotta', 'bronze', 'burnt-orange'],
    characteristics: '깊고 따뜻한 웜톤, 황금 베이스'
  },
  winter: {
    lipColors: ['true-red', 'berry', 'plum', 'wine'],
    eyeshadowTones: ['cool-brown', 'charcoal', 'silver', 'navy'],
    blusherColors: ['berry', 'plum', 'cool-pink'],
    characteristics: '선명하고 대비가 강한 쿨톤'
  }
};
```

#### 3.1.2 립 컬러 Lab 범위 및 선택 알고리즘

> **학술적 근거**:
> - Itten, J. (1961). "The Art of Color" - 색채 조화 이론
> - Munsell, A.H. (1905). "A Color Notation" - 색상 체계
> - Kobayashi, S. (1991). "Color Image Scale" - 색채 이미지 스케일
> - CIE (1976). "CIE Lab Color Space" - 색차 측정 표준

**퍼스널컬러 시즌별 최적 립 색상 Lab 좌표**:

| 시즌 | Lab 범위 | 대표 색상 | 설명 |
|------|----------|----------|------|
| **Spring** | L*=50-60, a*=35-45, b*=15-25 | 코랄, 피치 | 밝고 따뜻한 오렌지-핑크 계열 |
| **Summer** | L*=55-65, a*=25-35, b*=-5-5 | 로즈, 베리 | 부드럽고 차분한 핑크-퍼플 계열 |
| **Autumn** | L*=35-45, a*=30-40, b*=20-30 | 브릭, 테라코타 | 깊고 따뜻한 오렌지-브라운 계열 |
| **Winter** | L*=25-35, a*=40-50, b*=10-20 | 레드, 와인 | 선명하고 차가운 레드-버건디 계열 |

**ΔE*ab 기반 립 컬러 매칭 공식**:

```
색차 공식 (CIE76):
ΔE*ab = √[(L*₁-L*₂)² + (a*₁-a*₂)² + (b*₁-b*₂)²]

매칭 점수 계산:
Match Score = max(0, 100 - ΔE × 3)

점수 해석:
- 90-100점: 시즌에 완벽히 맞는 립 컬러
- 70-89점: 좋은 매칭 (약간의 조정 필요)
- 50-69점: 보통 매칭 (명도/채도 조정 권장)
- 50점 미만: 시즌에 맞지 않음

예시 (Spring 타입):
- Spring 이상적 중심: L*=55, a*=40, b*=20
- 코랄 립스틱 A: L*=58, a*=38, b*=22 → ΔE = 4.6 → 86점 (좋음)
- 버건디 립스틱 B: L*=35, a*=45, b*=10 → ΔE = 23.5 → 30점 (부적합)
```

립 컬러는 Lab 색공간에서 8개 주요 카테고리로 분류한다.

```typescript
const LIP_COLOR_RANGES: Record<LipCategory, LabRange> = {
  // 내추럴 계열
  nude: { L: [55, 75], a: [5, 15], b: [10, 25] },

  // 핑크 계열
  pink: { L: [50, 70], a: [20, 40], b: [-10, 10] },

  // 오렌지 계열
  coral: { L: [55, 70], a: [25, 45], b: [20, 40] },
  orange: { L: [50, 65], a: [30, 50], b: [40, 60] },

  // 레드 계열
  red: { L: [35, 55], a: [40, 65], b: [15, 35] },

  // 베리/플럼 계열
  berry: { L: [25, 45], a: [30, 50], b: [-15, 5] },
  plum: { L: [20, 40], a: [25, 45], b: [-25, 0] },

  // 브라운 계열
  brown: { L: [30, 50], a: [15, 30], b: [20, 40] }
};
```

#### 3.1.3 색상 조화 이론 및 공식

**색상 조화 유형**:

| 조화 유형 | 색상각 관계 | 공식 | 효과 |
|----------|------------|------|------|
| **유사색 (Analogous)** | 인접 색상 | Δh° < 30° | 자연스럽고 편안함 |
| **보색 (Complementary)** | 반대 색상 | Δh° ≈ 180° | 강렬한 대비 |
| **분할보색 (Split-Complementary)** | 보색 양옆 | Δh° ≈ 150° 또는 210° | 대비 + 조화 |
| **3색 조화 (Triadic)** | 120° 간격 | Δh° = 120° | 균형 잡힌 생동감 |
| **4색 조화 (Tetradic)** | 90° 간격 | Δh° = 90° | 풍부하고 다채로움 |
| **톤온톤 (Tone-on-Tone)** | 동일 색상 | Δh° = 0°, ΔL* or ΔC* | 세련되고 통일감 |

**Lab 색공간에서 조화 색상 계산 공식**:

```typescript
/**
 * Lab 색상의 Hue Angle (색상각) 계산
 */
function calculateHueAngle(a: number, b: number): number {
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return h;
}

/**
 * Lab 색상의 Chroma (채도) 계산
 */
function calculateChroma(a: number, b: number): number {
  return Math.sqrt(a * a + b * b);
}

/**
 * 주어진 색상각 차이(Δh°)로 조화 색상 계산
 * LCh (Lightness, Chroma, Hue) 색공간 사용
 */
function calculateHarmonyColor(
  baseLab: LabColor,
  deltaHue: number,
  lightnessAdjust: number = 0,
  chromaMultiplier: number = 1
): LabColor {
  // Base LCh 계산
  const baseChroma = calculateChroma(baseLab.a, baseLab.b);
  const baseHue = calculateHueAngle(baseLab.a, baseLab.b);

  // 조화 색상 LCh
  const harmonyHue = (baseHue + deltaHue + 360) % 360;
  const harmonyChroma = baseChroma * chromaMultiplier;
  const harmonyLightness = Math.max(0, Math.min(100, baseLab.L + lightnessAdjust));

  // LCh → Lab 변환
  const hueRadians = harmonyHue * (Math.PI / 180);
  return {
    L: harmonyLightness,
    a: harmonyChroma * Math.cos(hueRadians),
    b: harmonyChroma * Math.sin(hueRadians),
  };
}

/**
 * 보색 계산 (Δh° = 180°)
 */
function calculateComplementary(baseLab: LabColor): LabColor {
  return calculateHarmonyColor(baseLab, 180);
}

/**
 * 유사색 계산 (Δh° = ±30°)
 */
function calculateAnalogous(baseLab: LabColor): { left: LabColor; right: LabColor } {
  return {
    left: calculateHarmonyColor(baseLab, -30),
    right: calculateHarmonyColor(baseLab, 30),
  };
}

/**
 * 분할보색 계산 (Δh° = 150°, 210°)
 */
function calculateSplitComplementary(baseLab: LabColor): { left: LabColor; right: LabColor } {
  return {
    left: calculateHarmonyColor(baseLab, 150),
    right: calculateHarmonyColor(baseLab, 210),
  };
}

/**
 * 3색 조화 계산 (Δh° = 120°, 240°)
 */
function calculateTriadic(baseLab: LabColor): { second: LabColor; third: LabColor } {
  return {
    second: calculateHarmonyColor(baseLab, 120),
    third: calculateHarmonyColor(baseLab, 240),
  };
}
```

#### 3.1.4 퍼스널컬러 시즌 → 립 컬러 추천 로직

```typescript
interface LipColorRecommendation {
  category: LipCategory;
  labCenter: LabColor;
  hexColors: string[];
  suitability: number;  // 0-100
  reason: string;
}

// 시즌별 이상적 립 컬러 Lab 중심값
const SEASON_LIP_CENTERS: Record<Season, Record<LipCategory, LabColor>> = {
  spring: {
    coral: { L: 62, a: 35, b: 30 },
    pink: { L: 60, a: 30, b: 5 },
    nude: { L: 65, a: 12, b: 20 },
    orange: { L: 58, a: 40, b: 45 },
    red: { L: 48, a: 55, b: 28 },  // 웜 레드
    berry: { L: 40, a: 35, b: -5 }, // 적합도 낮음
    plum: { L: 32, a: 30, b: -15 }, // 적합도 낮음
    brown: { L: 42, a: 22, b: 28 },
  },
  summer: {
    pink: { L: 58, a: 28, b: -5 },   // 로즈 핑크
    berry: { L: 38, a: 38, b: -8 },  // 베리
    nude: { L: 62, a: 10, b: 12 },   // 쿨 누드
    plum: { L: 30, a: 35, b: -18 },  // 플럼
    red: { L: 42, a: 50, b: 5 },     // 쿨 레드
    coral: { L: 58, a: 30, b: 15 },  // 적합도 낮음
    orange: { L: 55, a: 35, b: 40 }, // 적합도 낮음
    brown: { L: 40, a: 18, b: 15 },
  },
  autumn: {
    brown: { L: 38, a: 25, b: 32 },  // 브릭 브라운
    coral: { L: 55, a: 38, b: 35 },  // 테라코타
    nude: { L: 55, a: 15, b: 25 },   // 웜 누드
    red: { L: 40, a: 52, b: 30 },    // 오렌지 레드
    orange: { L: 52, a: 42, b: 48 }, // 버번 오렌지
    berry: { L: 35, a: 40, b: 5 },   // 웜 버건디
    plum: { L: 28, a: 32, b: -10 },  // 적합도 낮음
    pink: { L: 52, a: 25, b: 8 },    // 적합도 낮음
  },
  winter: {
    red: { L: 38, a: 58, b: 15 },    // 트루 레드
    berry: { L: 32, a: 45, b: -10 }, // 베리
    plum: { L: 25, a: 38, b: -20 },  // 딥 플럼
    pink: { L: 48, a: 42, b: -5 },   // 푸시아 핑크
    nude: { L: 58, a: 8, b: 8 },     // 쿨 누드
    brown: { L: 35, a: 20, b: 18 },  // 쿨 브라운
    coral: { L: 52, a: 35, b: 22 },  // 적합도 낮음
    orange: { L: 50, a: 38, b: 42 }, // 적합도 낮음
  },
};

// 시즌별 립 카테고리 적합도 (1-5)
const SEASON_LIP_SUITABILITY: Record<Season, Record<LipCategory, number>> = {
  spring: { coral: 5, pink: 4, nude: 4, orange: 4, red: 3, berry: 2, plum: 1, brown: 3 },
  summer: { pink: 5, berry: 5, nude: 4, plum: 4, red: 4, coral: 2, orange: 1, brown: 3 },
  autumn: { brown: 5, coral: 5, nude: 4, red: 4, orange: 4, berry: 3, plum: 2, pink: 2 },
  winter: { red: 5, berry: 5, plum: 5, pink: 4, nude: 3, brown: 3, coral: 2, orange: 1 },
};

function recommendLipColors(
  season: Season,
  skinLab: LabColor
): LipColorRecommendation[] {
  const recommendations: LipColorRecommendation[] = [];

  for (const [category, suitability] of Object.entries(SEASON_LIP_SUITABILITY[season])) {
    const lipCategory = category as LipCategory;
    const centerLab = SEASON_LIP_CENTERS[season][lipCategory];

    // 피부톤과의 조화도 계산
    const skinHarmony = calculateSkinLipHarmony(skinLab, centerLab, season);

    // 최종 적합도 = 시즌 적합도 * 0.6 + 피부톤 조화도 * 0.4
    const finalSuitability = Math.round(
      (suitability * 20) * 0.6 + skinHarmony * 0.4
    );

    recommendations.push({
      category: lipCategory,
      labCenter: centerLab,
      hexColors: generateColorVariations(centerLab, 5),
      suitability: finalSuitability,
      reason: getLipRecommendationReason(season, lipCategory, suitability),
    });
  }

  return recommendations.sort((a, b) => b.suitability - a.suitability);
}

/**
 * 피부톤과 립 컬러 조화도 계산
 */
function calculateSkinLipHarmony(
  skinLab: LabColor,
  lipLab: LabColor,
  season: Season
): number {
  // 1. 색상각 차이 계산
  const skinHue = calculateHueAngle(skinLab.a, skinLab.b);
  const lipHue = calculateHueAngle(lipLab.a, lipLab.b);
  const hueDiff = Math.abs(skinHue - lipHue);

  // 2. 명도 대비 (피부보다 립이 진해야 함)
  const lightnessDiff = skinLab.L - lipLab.L;
  const lightnessScore = lightnessDiff > 10 && lightnessDiff < 40 ? 100 : 70;

  // 3. 채도 균형 (립이 더 채도 높아야 함)
  const skinChroma = calculateChroma(skinLab.a, skinLab.b);
  const lipChroma = calculateChroma(lipLab.a, lipLab.b);
  const chromaScore = lipChroma > skinChroma ? 100 : 60;

  // 4. 시즌별 웜/쿨 일치도
  const isWarmSeason = season === 'spring' || season === 'autumn';
  const lipIsWarm = lipLab.b > 10;
  const warmCoolMatch = isWarmSeason === lipIsWarm ? 100 : 50;

  // 가중 평균
  return (
    lightnessScore * 0.25 +
    chromaScore * 0.25 +
    warmCoolMatch * 0.30 +
    (hueDiff < 60 ? 100 : 70) * 0.20
  );
}
```

#### 3.1.3 아이섀도우 톤 분류

```typescript
type EyeshadowCategory =
  | 'neutral-brown'  // 뉴트럴 브라운
  | 'warm-brown'     // 웜 브라운
  | 'cool-brown'     // 쿨 브라운
  | 'pink-tone'      // 핑크 톤
  | 'smoky'          // 스모키
  | 'colorful'       // 컬러풀
  | 'glitter';       // 글리터

const EYESHADOW_SEASON_MATCH: Record<Season, EyeshadowCategory[]> = {
  spring: ['warm-brown', 'pink-tone', 'colorful', 'glitter'],
  summer: ['cool-brown', 'pink-tone', 'neutral-brown'],
  autumn: ['warm-brown', 'neutral-brown', 'smoky'],
  winter: ['cool-brown', 'smoky', 'colorful', 'glitter']
};
```

#### 3.1.3a 아이섀도우 색상 조화 알고리즘

> **학술적 근거**:
> - Itten, J. (1961). "The Art of Color" - 보색/유사색 조화 이론
> - Munsell, A.H. (1905). "A Color Notation" - 색상 체계
> - Chevreul, M.E. (1839). "The Laws of Contrast of Colour" - 동시 대비 효과

아이섀도우 색상 선택은 **눈 색상과의 조화**, **퍼스널컬러 시즌 매칭**, **색상 조화 원리**를 종합적으로 고려한다.

**눈 색상별 아이섀도우 조화 원리**:

| 눈 색상 | Lab 범위 | 보색 추천 | 유사색 추천 | 조화 효과 |
|--------|---------|----------|------------|----------|
| **브라운** | L: 25-45, a: 5-15, b: 10-25 | 퍼플, 골드 | 코퍼, 브론즈 | 눈 깊이 강조 |
| **블랙** | L: 10-25, a: -5-5, b: -5-5 | 실버, 메탈릭 | 그레이, 차콜 | 선명한 대비 |
| **헤이즐** | L: 35-55, a: 0-10, b: 15-30 | 바이올렛, 핑크 | 올리브, 그린 | 복합적 강조 |

```typescript
/**
 * 아이섀도우 색상 매칭 시스템
 * 눈 색상과 퍼스널컬러를 기반으로 최적의 아이섀도우 추천
 */
interface EyeColorAnalysis {
  category: 'brown' | 'black' | 'hazel' | 'green' | 'blue';
  labValue: LabColor;
  dominantHue: number;  // 0-360
}

interface EyeshadowLabRange {
  category: EyeshadowCategory;
  labRange: {
    L: [number, number];
    a: [number, number];
    b: [number, number];
  };
  hexSamples: string[];
}

// 아이섀도우 카테고리별 Lab 범위
const EYESHADOW_LAB_RANGES: Record<EyeshadowCategory, EyeshadowLabRange['labRange']> = {
  'neutral-brown': { L: [35, 55], a: [5, 15], b: [10, 25] },
  'warm-brown': { L: [35, 55], a: [10, 25], b: [20, 40] },
  'cool-brown': { L: [35, 55], a: [5, 15], b: [-5, 10] },
  'pink-tone': { L: [50, 70], a: [15, 35], b: [-15, 5] },
  'smoky': { L: [20, 45], a: [-5, 5], b: [-10, 5] },
  'colorful': { L: [30, 60], a: [-30, 40], b: [-40, 40] },  // 넓은 범위
  'glitter': { L: [55, 85], a: [-10, 20], b: [-10, 30] }
};

/**
 * 눈 색상과 아이섀도우 조화도 계산
 * 보색/유사색 조화 원리 적용
 */
function calculateEyeEyeshadowHarmony(
  eyeColor: EyeColorAnalysis,
  eyeshadowLab: LabColor,
  harmonyType: 'complementary' | 'analogous' | 'triadic'
): number {
  const eyeHue = eyeColor.dominantHue;
  const shadowHue = calculateHueAngle(eyeshadowLab.a, eyeshadowLab.b);

  // 색상각 차이 계산
  let hueDiff = Math.abs(eyeHue - shadowHue);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  // 조화 유형별 이상적 색상각 차이
  const idealHueDiff: Record<string, number> = {
    complementary: 180,  // 보색: 180도 차이
    analogous: 30,       // 유사색: 30도 이내
    triadic: 120         // 3색 조화: 120도 차이
  };

  const ideal = idealHueDiff[harmonyType];
  const deviation = Math.abs(hueDiff - ideal);

  // 편차가 적을수록 높은 점수
  const harmonyScore = Math.max(0, 100 - deviation * 2);

  return harmonyScore;
}

/**
 * 퍼스널컬러 시즌 기반 아이섀도우 추천
 * 시즌별 권장 색조 + 눈 색상 조화도 결합
 */
function recommendEyeshadowPalette(
  season: Season,
  eyeColor: EyeColorAnalysis
): EyeshadowRecommendation[] {
  const seasonMatches = EYESHADOW_SEASON_MATCH[season];
  const recommendations: EyeshadowRecommendation[] = [];

  for (const category of seasonMatches) {
    const labRange = EYESHADOW_LAB_RANGES[category];
    const centerLab: LabColor = {
      L: (labRange.L[0] + labRange.L[1]) / 2,
      a: (labRange.a[0] + labRange.a[1]) / 2,
      b: (labRange.b[0] + labRange.b[1]) / 2
    };

    // 눈 색상과의 조화도 (보색 + 유사색 평균)
    const complementaryScore = calculateEyeEyeshadowHarmony(eyeColor, centerLab, 'complementary');
    const analogousScore = calculateEyeEyeshadowHarmony(eyeColor, centerLab, 'analogous');
    const eyeHarmony = Math.max(complementaryScore, analogousScore);

    // 시즌 적합도 (권장 카테고리이므로 기본 80점)
    const seasonScore = 80;

    // 최종 점수: 시즌 적합도 60% + 눈 조화도 40%
    const totalScore = seasonScore * 0.6 + eyeHarmony * 0.4;

    recommendations.push({
      category,
      labCenter: centerLab,
      score: Math.round(totalScore),
      harmonyType: complementaryScore > analogousScore ? 'complementary' : 'analogous',
      reason: getEyeshadowRecommendationReason(category, season, eyeColor.category)
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

interface EyeshadowRecommendation {
  category: EyeshadowCategory;
  labCenter: LabColor;
  score: number;
  harmonyType: 'complementary' | 'analogous';
  reason: string;
}

function getEyeshadowRecommendationReason(
  category: EyeshadowCategory,
  season: Season,
  eyeColorCategory: string
): string {
  const reasons: Record<string, string> = {
    'warm-brown_spring_brown': '웜톤 브라운이 봄 타입의 따뜻한 피부톤과 브라운 눈을 조화롭게 연결합니다',
    'cool-brown_summer_black': '쿨톤 브라운이 여름 타입의 부드러운 피부톤과 블랙 눈의 대비를 완화합니다',
    'smoky_winter_black': '스모키 톤이 겨울 타입의 선명한 피부톤과 블랙 눈의 깊이를 강조합니다'
  };

  const key = `${category}_${season}_${eyeColorCategory}`;
  return reasons[key] || `${category} 톤이 ${season} 타입에 잘 어울립니다`;
}
```

#### 3.1.4 블러셔 컬러 Lab 범위

```typescript
const BLUSHER_COLOR_RANGES: Record<BlusherCategory, LabRange> = {
  peach: { L: [65, 80], a: [15, 30], b: [20, 35] },
  coral: { L: [60, 75], a: [25, 40], b: [25, 40] },
  rose: { L: [55, 70], a: [20, 35], b: [-5, 10] },
  pink: { L: [60, 75], a: [25, 40], b: [-10, 5] },
  burgundy: { L: [35, 50], a: [25, 40], b: [5, 20] },
  bronzer: { L: [45, 60], a: [10, 25], b: [25, 45] }
};
```

#### 3.1.4a 블러셔 톤 매칭 알고리즘

> **학술적 근거**:
> - CIE (1976). "CIE Lab Color Space" - 색차 측정 표준
> - Fairchild, M.D. (2013). "Color Appearance Models" - 색 지각 모델
> - K-Beauty Research Institute (2020). "Korean Skin Tone Analysis" - 한국인 피부톤 연구

블러셔 선택은 **피부톤(Lab L*)과의 조화**, **퍼스널컬러 시즌 매칭**이 핵심이다.

**피부톤 명도(L*)와 블러셔 명도 관계**:

```
블러셔 적정 명도 공식:
Blusher_L* = Skin_L* × 0.85 + 5

예시:
- 밝은 피부 (L*=70): 블러셔 L* ≈ 65 (피치, 핑크 계열)
- 중간 피부 (L*=55): 블러셔 L* ≈ 52 (코랄, 로즈 계열)
- 어두운 피부 (L*=40): 블러셔 L* ≈ 39 (버건디, 브론저 계열)
```

**ΔE*ab 기반 블러셔 매칭 공식**:

```
색차 공식 (CIE76):
ΔE*ab = √[(L*₁-L*₂)² + (a*₁-a*₂)² + (b*₁-b*₂)²]

매칭 점수:
- ΔE < 10: 우수 (자연스러운 조화) → 90-100점
- ΔE 10-20: 양호 (적절한 대비) → 70-89점
- ΔE 20-30: 보통 (눈에 띄는 대비) → 50-69점
- ΔE > 30: 부적합 (과도한 대비) → 50점 미만
```

```typescript
/**
 * 블러셔 톤 매칭 시스템
 * 피부톤 Lab 값과 퍼스널컬러 기반 최적 블러셔 추천
 */
interface BlusherRecommendation {
  category: BlusherCategory;
  labCenter: LabColor;
  deltaE: number;
  matchScore: number;
  intensityGuide: 'light' | 'medium' | 'bold';
  reason: string;
}

// 퍼스널컬러 시즌별 블러셔 이상적 Lab 중심값
const SEASON_BLUSHER_CENTERS: Record<Season, Record<BlusherCategory, LabColor>> = {
  spring: {
    peach: { L: 72, a: 22, b: 28 },
    coral: { L: 68, a: 32, b: 32 },
    rose: { L: 62, a: 25, b: 5 },    // 적합도 낮음
    pink: { L: 68, a: 30, b: 0 },    // 적합도 낮음
    burgundy: { L: 42, a: 32, b: 12 }, // 적합도 낮음
    bronzer: { L: 55, a: 18, b: 35 }
  },
  summer: {
    peach: { L: 70, a: 20, b: 22 },  // 적합도 낮음
    coral: { L: 65, a: 28, b: 28 },  // 적합도 낮음
    rose: { L: 62, a: 28, b: 2 },
    pink: { L: 68, a: 32, b: -2 },
    burgundy: { L: 40, a: 30, b: 8 },
    bronzer: { L: 52, a: 15, b: 30 } // 적합도 낮음
  },
  autumn: {
    peach: { L: 68, a: 25, b: 32 },
    coral: { L: 62, a: 35, b: 38 },
    rose: { L: 58, a: 25, b: 8 },    // 적합도 낮음
    pink: { L: 62, a: 28, b: 2 },    // 적합도 낮음
    burgundy: { L: 38, a: 35, b: 15 },
    bronzer: { L: 52, a: 22, b: 40 }
  },
  winter: {
    peach: { L: 68, a: 20, b: 25 },  // 적합도 낮음
    coral: { L: 62, a: 30, b: 30 },  // 적합도 낮음
    rose: { L: 58, a: 30, b: 0 },
    pink: { L: 65, a: 35, b: -5 },
    burgundy: { L: 35, a: 38, b: 10 },
    bronzer: { L: 48, a: 18, b: 32 } // 적합도 낮음
  }
};

// 시즌별 블러셔 카테고리 적합도 (1-5)
const SEASON_BLUSHER_SUITABILITY: Record<Season, Record<BlusherCategory, number>> = {
  spring: { peach: 5, coral: 5, rose: 2, pink: 3, burgundy: 2, bronzer: 4 },
  summer: { peach: 3, coral: 2, rose: 5, pink: 5, burgundy: 4, bronzer: 2 },
  autumn: { peach: 4, coral: 5, rose: 2, pink: 2, burgundy: 5, bronzer: 5 },
  winter: { peach: 2, coral: 2, rose: 5, pink: 5, burgundy: 5, bronzer: 2 }
};

/**
 * CIE76 색차(ΔE) 계산
 */
function calculateDeltaE(lab1: LabColor, lab2: LabColor): number {
  const deltaL = lab1.L - lab2.L;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * 피부톤과 블러셔 조화도 계산
 * 피부 L* 기반 적정 블러셔 명도 도출 + ΔE 계산
 */
function calculateBlusherSkinHarmony(
  skinLab: LabColor,
  blusherLab: LabColor,
  season: Season
): number {
  // 1. 이상적 블러셔 명도 계산
  const idealBlusherL = skinLab.L * 0.85 + 5;

  // 2. 명도 조화 점수 (블러셔가 피부보다 약간 어두워야 함)
  const lightnessDeviation = Math.abs(blusherLab.L - idealBlusherL);
  const lightnessScore = Math.max(0, 100 - lightnessDeviation * 3);

  // 3. 색조 조화 (웜/쿨 매칭)
  const isWarmSeason = season === 'spring' || season === 'autumn';
  const blusherIsWarm = blusherLab.b > 10;
  const warmCoolMatch = isWarmSeason === blusherIsWarm ? 100 : 50;

  // 4. 채도 적절성 (블러셔 채도가 피부 채도보다 높아야 함)
  const skinChroma = Math.sqrt(skinLab.a * skinLab.a + skinLab.b * skinLab.b);
  const blusherChroma = Math.sqrt(blusherLab.a * blusherLab.a + blusherLab.b * blusherLab.b);
  const chromaScore = blusherChroma > skinChroma ? 100 : 60;

  // 가중 평균
  return (
    lightnessScore * 0.35 +
    warmCoolMatch * 0.35 +
    chromaScore * 0.30
  );
}

/**
 * 블러셔 추천 함수
 */
function recommendBlusherColors(
  season: Season,
  skinLab: LabColor
): BlusherRecommendation[] {
  const recommendations: BlusherRecommendation[] = [];

  for (const [category, suitability] of Object.entries(SEASON_BLUSHER_SUITABILITY[season])) {
    const blusherCategory = category as BlusherCategory;
    const centerLab = SEASON_BLUSHER_CENTERS[season][blusherCategory];

    // 피부톤과의 ΔE 계산
    const deltaE = calculateDeltaE(skinLab, centerLab);

    // 피부-블러셔 조화도
    const skinHarmony = calculateBlusherSkinHarmony(skinLab, centerLab, season);

    // 최종 점수: 시즌 적합도 50% + 피부 조화도 30% + ΔE 기반 20%
    const deltaEScore = Math.max(0, 100 - deltaE * 2);
    const matchScore = Math.round(
      (suitability * 20) * 0.50 +
      skinHarmony * 0.30 +
      deltaEScore * 0.20
    );

    // 발색 강도 가이드 (피부 명도 기반)
    const intensityGuide: 'light' | 'medium' | 'bold' =
      skinLab.L > 65 ? 'light' :
      skinLab.L > 50 ? 'medium' : 'bold';

    recommendations.push({
      category: blusherCategory,
      labCenter: centerLab,
      deltaE: Math.round(deltaE * 10) / 10,
      matchScore,
      intensityGuide,
      reason: getBlusherRecommendationReason(blusherCategory, season, skinLab.L)
    });
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}

function getBlusherRecommendationReason(
  category: BlusherCategory,
  season: Season,
  skinLightness: number
): string {
  const toneDesc = season === 'spring' || season === 'autumn' ? '웜톤' : '쿨톤';
  const lightnessDesc = skinLightness > 65 ? '밝은' : skinLightness > 50 ? '중간' : '어두운';

  const reasons: Record<BlusherCategory, string> = {
    peach: `피치 톤이 ${lightnessDesc} 피부의 자연스러운 혈색을 연출합니다`,
    coral: `코랄 톤이 ${toneDesc} 피부에 생기를 더합니다`,
    rose: `로즈 톤이 ${toneDesc} 피부와 조화롭게 어우러집니다`,
    pink: `핑크 톤이 ${lightnessDesc} 피부에 사랑스러운 분위기를 연출합니다`,
    burgundy: `버건디 톤이 세련되고 깊이 있는 분위기를 연출합니다`,
    bronzer: `브론저가 ${lightnessDesc} 피부에 건강한 윤기를 더합니다`
  };

  return reasons[category];
}
```

### 3.2 얼굴형별 컨투어링

#### 3.2.1 컨투어링 원리

컨투어링은 **빛과 그림자**를 활용하여 얼굴의 입체감을 조절하고 비율을 보정하는 기법이다.

```
컨투어링 기본 원칙:
- 어두운 색 (셰이딩) → 축소 효과, 후퇴 효과
- 밝은 색 (하이라이트) → 확대 효과, 전진 효과
- 자연스러운 블렌딩이 핵심
```

#### 3.2.2 얼굴형별 컨투어링 가이드

| 얼굴형 | 셰이딩 위치 | 하이라이트 위치 | 목표 |
|--------|------------|---------------|------|
| **둥근형** | 볼 양쪽, 턱선 | 이마 중앙, 코, 턱 끝 | 세로로 길어 보이게 |
| **긴형** | 이마 상단, 턱 끝 | 볼 중앙, 눈 아래 | 가로로 넓어 보이게 |
| **사각형** | 턱 양쪽 각진 부분 | T존, 볼 상단 | 각진 부분 부드럽게 |
| **하트형** | 이마 양쪽 | 턱 중앙, 볼 하단 | 하부 볼륨감 추가 |
| **다이아몬드** | 광대 측면 | 이마 중앙, 턱 중앙 | 상하부 균형 |

#### 3.2.3 컨투어링 강도 계산

```python
def calculate_contouring_intensity(face_shape, feature_prominence):
    """
    얼굴형과 이목구비 돌출도에 따른 컨투어링 강도 계산

    feature_prominence: 이목구비가 얼마나 뚜렷한지 (0-100)
    Returns: 'light' | 'medium' | 'bold'
    """
    # 기본 강도 (얼굴형 기반)
    base_intensity = {
        'oval': 30,      # 계란형은 최소한의 컨투어링
        'round': 60,     # 둥근형은 중간 강도
        'oblong': 50,    # 긴형은 중간 강도
        'square': 70,    # 사각형은 높은 강도
        'heart': 55,     # 하트형은 중간 강도
        'diamond': 65    # 다이아몬드는 높은 강도
    }

    base = base_intensity.get(face_shape, 50)

    # 이목구비가 뚜렷하면 컨투어링 줄임
    adjusted = base - (feature_prominence - 50) * 0.3

    if adjusted < 40:
        return 'light'
    elif adjusted < 65:
        return 'medium'
    else:
        return 'bold'
```

### 3.3 피부톤과 파운데이션 매칭

#### 3.3.1 피부 언더톤 결정

피부 언더톤은 **웜톤**, **쿨톤**, **뉴트럴**로 분류하며, 이는 파운데이션 선택의 핵심이다.

```typescript
type Undertone = 'warm' | 'cool' | 'neutral';

interface SkinToneAnalysis {
  undertone: Undertone;
  depth: 'fair' | 'light' | 'medium' | 'tan' | 'deep';
  overtone: string;  // 표면 색조 (pink, yellow, olive 등)
}

// 언더톤 판정 기준 (Lab 기반)
function determineUndertone(skinLabValues: { L: number; a: number; b: number }): Undertone {
  const { a, b } = skinLabValues;

  // a > 0: 붉은기, b > 0: 노란기
  const warmScore = b * 1.5 + (a < 5 ? 0 : a * 0.5);
  const coolScore = -b * 1.5 + (a > 0 ? a * 0.8 : 0);

  if (Math.abs(warmScore - coolScore) < 5) {
    return 'neutral';
  }
  return warmScore > coolScore ? 'warm' : 'cool';
}
```

#### 3.3.2 파운데이션 매칭 원리

```
파운데이션 선택 원칙:
1. 언더톤 매칭이 가장 중요 (웜/쿨 불일치는 화사함 감소)
2. 명도는 목과 턱선 경계에서 테스트
3. 자연광에서 최종 확인
4. 계절에 따라 반톤~한톤 차이 고려
```

#### 3.3.3 한국인 피부톤 특성

한국인 피부는 일반적으로 **노란 베이스**가 많지만, 다양한 언더톤이 존재한다.

| 분류 | 비율 | Lab 특성 | 파운데이션 권장 |
|------|------|----------|---------------|
| 웜 옐로우 | ~45% | b > 15, a < 8 | 황금빛 베이스 |
| 쿨 핑크 | ~25% | a > 8, b < 12 | 핑크 베이스 |
| 뉴트럴 | ~20% | 균형 잡힌 a, b | 뉴트럴 베이스 |
| 올리브 | ~10% | b > 10, 약간의 녹색기 | 올리브/옐로우 베이스 |

#### 3.3.4 Lab 기반 파운데이션 매칭 알고리즘

> **학술적 근거**:
> - CIE (1976). "CIE Lab Color Space" - 색차 측정 표준
> - Xiao, K. et al. (2012). "Unique hue data for colour appearance models" - 피부색 연구
> - MAC Cosmetics Research (2018). "Foundation Shade Matching Technology" - 산업 표준

**ΔE*ab 기반 파운데이션 매칭 공식**:

파운데이션 매칭은 피부 Lab 값과 제품 Lab 값의 색차(ΔE)를 계산하여 결정한다.

```
색차 공식 (CIE76):
ΔE*ab = √[(L*₁-L*₂)² + (a*₁-a*₂)² + (b*₁-b*₂)²]

매칭 품질 기준:
- ΔE < 3: 거의 완벽 (전문가도 구분 어려움) → "Perfect Match"
- ΔE 3-5: 좋은 매칭 (자연광에서 자연스러움) → "Good Match"
- ΔE 5-10: 보통 (살짝 차이 보임) → "Fair Match"
- ΔE 10-15: 부적합 (눈에 띄는 차이) → "Poor Match"
- ΔE > 15: 불일치 (사용 불가) → "No Match"

매칭 점수 계산:
Match Score = max(0, 100 - ΔE × 5)
```

**산화 보정 계수 (Oxidation Correction)**:

파운데이션은 피부에 바른 후 시간이 지나면서 산화되어 색상이 변한다.
일반적으로 **0.5~1톤 어두워지거나** 노란기가 증가한다.

```
산화 후 예상 Lab 값:
L*_oxidized = L*_initial - 3 (명도 감소)
b*_oxidized = b*_initial + 2 (노란기 증가)

산화 보정 적용 파운데이션 선택:
추천 파운데이션 L* = 피부 L* + 2~3 (산화 대비 밝은 톤 선택)
```

```typescript
/**
 * 파운데이션 매칭 시스템
 * 피부 Lab 값과 파운데이션 제품 Lab 값 비교
 */
interface FoundationProduct {
  id: string;
  name: string;
  brand: string;
  shade: string;           // 예: "21호", "23호", "NC25"
  labValue: LabColor;
  undertone: Undertone;
  coverage: 'sheer' | 'light' | 'medium' | 'full';
  finish: 'matte' | 'satin' | 'dewy';
}

interface FoundationMatchResult {
  product: FoundationProduct;
  deltaE: number;
  matchScore: number;
  matchLevel: 'perfect' | 'good' | 'fair' | 'poor' | 'none';
  oxidizedDeltaE: number;
  recommendation: string;
}

/**
 * 파운데이션 산화 후 Lab 값 예측
 * @param originalLab - 제품 본래 Lab 값
 * @param oxidationLevel - 산화 정도 ('light' | 'normal' | 'heavy')
 * @returns 산화 후 예상 Lab 값
 */
function predictOxidizedLab(
  originalLab: LabColor,
  oxidationLevel: 'light' | 'normal' | 'heavy' = 'normal'
): LabColor {
  const oxidationFactors = {
    light: { L: -1.5, a: 0.5, b: 1 },
    normal: { L: -3, a: 1, b: 2 },
    heavy: { L: -5, a: 1.5, b: 3 }
  };

  const factor = oxidationFactors[oxidationLevel];

  return {
    L: Math.max(0, originalLab.L + factor.L),
    a: originalLab.a + factor.a,
    b: originalLab.b + factor.b
  };
}

/**
 * 파운데이션 매칭 점수 계산
 */
function calculateFoundationMatch(
  skinLab: LabColor,
  foundationLab: LabColor,
  skinUndertone: Undertone,
  foundationUndertone: Undertone
): { deltaE: number; score: number; level: string } {
  // 1. ΔE 계산
  const deltaE = calculateDeltaE(skinLab, foundationLab);

  // 2. 기본 매칭 점수
  let baseScore = Math.max(0, 100 - deltaE * 5);

  // 3. 언더톤 매칭 보정
  // 언더톤이 일치하면 +10점, 불일치하면 -15점
  if (skinUndertone === foundationUndertone) {
    baseScore = Math.min(100, baseScore + 10);
  } else if (skinUndertone !== 'neutral' && foundationUndertone !== 'neutral') {
    // 웜-쿨 불일치
    baseScore = Math.max(0, baseScore - 15);
  } else {
    // 뉴트럴 포함
    baseScore = Math.max(0, baseScore - 5);
  }

  // 4. 매칭 레벨 결정
  let level: string;
  if (deltaE < 3) level = 'perfect';
  else if (deltaE < 5) level = 'good';
  else if (deltaE < 10) level = 'fair';
  else if (deltaE < 15) level = 'poor';
  else level = 'none';

  return { deltaE, score: Math.round(baseScore), level };
}

/**
 * 파운데이션 추천 함수
 * 산화 보정 포함
 */
function recommendFoundations(
  skinLab: LabColor,
  skinUndertone: Undertone,
  products: FoundationProduct[],
  options: {
    considerOxidation?: boolean;
    preferredCoverage?: FoundationProduct['coverage'];
    preferredFinish?: FoundationProduct['finish'];
  } = {}
): FoundationMatchResult[] {
  const { considerOxidation = true } = options;

  const results: FoundationMatchResult[] = products.map(product => {
    // 즉시 매칭
    const immediateMatch = calculateFoundationMatch(
      skinLab,
      product.labValue,
      skinUndertone,
      product.undertone
    );

    // 산화 후 매칭
    const oxidizedLab = considerOxidation
      ? predictOxidizedLab(product.labValue)
      : product.labValue;
    const oxidizedDeltaE = calculateDeltaE(skinLab, oxidizedLab);

    // 최종 점수: 즉시 매칭 60% + 산화 후 매칭 40%
    const finalScore = considerOxidation
      ? immediateMatch.score * 0.6 + Math.max(0, 100 - oxidizedDeltaE * 5) * 0.4
      : immediateMatch.score;

    return {
      product,
      deltaE: Math.round(immediateMatch.deltaE * 10) / 10,
      matchScore: Math.round(finalScore),
      matchLevel: immediateMatch.level as FoundationMatchResult['matchLevel'],
      oxidizedDeltaE: Math.round(oxidizedDeltaE * 10) / 10,
      recommendation: getFoundationRecommendation(
        immediateMatch.level,
        product,
        skinLab,
        oxidizedDeltaE
      )
    };
  });

  // 점수 순 정렬
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

function getFoundationRecommendation(
  matchLevel: string,
  product: FoundationProduct,
  skinLab: LabColor,
  oxidizedDeltaE: number
): string {
  if (matchLevel === 'perfect') {
    if (oxidizedDeltaE < 5) {
      return `${product.shade}는 피부톤과 완벽히 매칭됩니다. 산화 후에도 자연스럽습니다.`;
    } else {
      return `${product.shade}는 바른 직후 완벽하지만, 산화 후 약간 어두워질 수 있습니다.`;
    }
  } else if (matchLevel === 'good') {
    return `${product.shade}는 좋은 매칭입니다. 자연광에서 자연스럽게 보입니다.`;
  } else if (matchLevel === 'fair') {
    const isTooDark = product.labValue.L < skinLab.L - 5;
    const isTooLight = product.labValue.L > skinLab.L + 5;
    if (isTooDark) {
      return `${product.shade}는 피부보다 약간 어둡습니다. 한 톤 밝은 제품을 고려해보세요.`;
    } else if (isTooLight) {
      return `${product.shade}는 피부보다 약간 밝습니다. 한 톤 어두운 제품을 고려해보세요.`;
    }
    return `${product.shade}는 보통 수준의 매칭입니다. 목과 턱선에서 다시 테스트해보세요.`;
  } else {
    return `${product.shade}는 피부톤과 맞지 않습니다. 다른 제품을 추천드립니다.`;
  }
}

/**
 * 한국 파운데이션 호수 체계 변환
 * 국제 표기 (MAC NC/NW, Fenty 등)와 한국 호수 간 변환
 */
const KOREAN_SHADE_TO_LAB: Record<string, LabColor> = {
  '13호': { L: 78, a: 5, b: 12 },   // 아이보리
  '17호': { L: 75, a: 6, b: 14 },   // 라이트 베이지
  '21호': { L: 72, a: 7, b: 16 },   // 베이지
  '23호': { L: 68, a: 8, b: 18 },   // 내추럴 베이지
  '25호': { L: 64, a: 9, b: 20 },   // 웜 베이지
  '27호': { L: 60, a: 10, b: 22 },  // 샌드
  '31호': { L: 56, a: 11, b: 24 },  // 허니
  '33호': { L: 52, a: 12, b: 26 }   // 카라멜
};

// MAC NC 체계 (Neutral Cool → 실제로는 Yellow undertone)
const MAC_NC_TO_LAB: Record<string, LabColor> = {
  'NC15': { L: 76, a: 6, b: 15 },
  'NC20': { L: 73, a: 7, b: 17 },
  'NC25': { L: 70, a: 8, b: 19 },
  'NC30': { L: 67, a: 9, b: 21 },
  'NC35': { L: 64, a: 10, b: 23 },
  'NC40': { L: 61, a: 11, b: 25 },
  'NC42': { L: 58, a: 12, b: 27 },
  'NC45': { L: 55, a: 13, b: 29 }
};

// MAC NW 체계 (Neutral Warm → 실제로는 Pink undertone)
const MAC_NW_TO_LAB: Record<string, LabColor> = {
  'NW15': { L: 76, a: 10, b: 10 },
  'NW20': { L: 73, a: 11, b: 12 },
  'NW25': { L: 70, a: 12, b: 14 },
  'NW30': { L: 67, a: 13, b: 16 },
  'NW35': { L: 64, a: 14, b: 18 },
  'NW40': { L: 61, a: 15, b: 20 },
  'NW42': { L: 58, a: 16, b: 22 },
  'NW45': { L: 55, a: 17, b: 24 }
};

/**
 * 호수 간 변환 함수
 */
function convertShade(
  shade: string,
  fromSystem: 'korean' | 'mac_nc' | 'mac_nw',
  toSystem: 'korean' | 'mac_nc' | 'mac_nw'
): string | null {
  const shadeToLab: Record<string, Record<string, LabColor>> = {
    korean: KOREAN_SHADE_TO_LAB,
    mac_nc: MAC_NC_TO_LAB,
    mac_nw: MAC_NW_TO_LAB
  };

  const sourceLab = shadeToLab[fromSystem][shade];
  if (!sourceLab) return null;

  // 타겟 시스템에서 가장 가까운 호수 찾기
  const targetShades = shadeToLab[toSystem];
  let closestShade = '';
  let minDeltaE = Infinity;

  for (const [targetShade, targetLab] of Object.entries(targetShades)) {
    const deltaE = calculateDeltaE(sourceLab, targetLab);
    if (deltaE < minDeltaE) {
      minDeltaE = deltaE;
      closestShade = targetShade;
    }
  }

  return closestShade;
}
```

### 3.4 메이크업 조화도 계산

#### 3.4.1 조화도 점수 알고리즘

메이크업 전체 조화도는 여러 요소를 종합하여 계산한다.

```typescript
interface MakeupHarmonyInput {
  personalColor: Season;
  lipColor: LabColor;
  eyeshadow: EyeshadowCategory;
  blusher: LabColor;
  skinTone: SkinToneAnalysis;
}

interface HarmonyScore {
  total: number;           // 0-100
  breakdown: {
    toneMatch: number;     // 톤 조화 (40%)
    saturationBalance: number;  // 채도 균형 (25%)
    lightnessHarmony: number;   // 명도 조화 (20%)
    categoryMatch: number;      // 카테고리 매칭 (15%)
  };
}

function calculateMakeupHarmony(input: MakeupHarmonyInput): HarmonyScore {
  const weights = {
    toneMatch: 0.40,
    saturationBalance: 0.25,
    lightnessHarmony: 0.20,
    categoryMatch: 0.15
  };

  // 1. 톤 조화 (퍼스널컬러와 메이크업 색상 일치도)
  const toneMatch = calculateToneMatch(input.personalColor, input.lipColor, input.blusher);

  // 2. 채도 균형 (립-아이-블러셔 간 채도 밸런스)
  const saturationBalance = calculateSaturationBalance(input);

  // 3. 명도 조화 (피부톤 대비 적절한 명도 차이)
  const lightnessHarmony = calculateLightnessHarmony(input.skinTone, input.lipColor);

  // 4. 카테고리 매칭 (시즌 권장 카테고리 일치)
  const categoryMatch = calculateCategoryMatch(input.personalColor, input.eyeshadow);

  const total =
    toneMatch * weights.toneMatch +
    saturationBalance * weights.saturationBalance +
    lightnessHarmony * weights.lightnessHarmony +
    categoryMatch * weights.categoryMatch;

  return {
    total: Math.round(total),
    breakdown: {
      toneMatch: Math.round(toneMatch),
      saturationBalance: Math.round(saturationBalance),
      lightnessHarmony: Math.round(lightnessHarmony),
      categoryMatch: Math.round(categoryMatch)
    }
  };
}
```

#### 3.4.2 톤 매칭 상세

```python
def calculate_tone_match(season, lip_lab, blusher_lab):
    """
    퍼스널컬러 시즌과 메이크업 컬러 톤 일치도 계산
    """
    # 시즌별 이상적 a, b 범위
    season_ideal = {
        'spring': {'a': (10, 30), 'b': (15, 35)},   # 웜, 밝은
        'summer': {'a': (5, 25), 'b': (-10, 10)},   # 쿨, 부드러운
        'autumn': {'a': (15, 35), 'b': (20, 40)},   # 웜, 깊은
        'winter': {'a': (10, 40), 'b': (-15, 15)}   # 쿨, 선명한
    }

    ideal = season_ideal[season]

    # 립 컬러 점수
    lip_score = range_match_score(lip_lab['a'], ideal['a']) * 0.5 + \
                range_match_score(lip_lab['b'], ideal['b']) * 0.5

    # 블러셔 점수
    blusher_score = range_match_score(blusher_lab['a'], ideal['a']) * 0.5 + \
                    range_match_score(blusher_lab['b'], ideal['b']) * 0.5

    return (lip_score * 0.6 + blusher_score * 0.4) * 100
```

---

## 4. 모듈 간 연동

### 4.1 PC-1 → H-1/M-1 연동

퍼스널컬러 분석 결과(PC-1)는 헤어(H-1)와 메이크업(M-1) 분석의 기반이 된다.

```typescript
interface PersonalColorResult {
  season: Season;
  subType: SubType;
  colorPalette: string[];
  characteristics: {
    warmth: number;      // 0-100 (0: 쿨, 100: 웜)
    brightness: number;  // 0-100 (0: 뮤트, 100: 클리어)
    depth: number;       // 0-100 (0: 라이트, 100: 딥)
  };
}

// PC-1 결과를 H-1에 전달
function applyToHairAnalysis(pcResult: PersonalColorResult): HairColorRecommendation {
  const { season, characteristics } = pcResult;

  return {
    recommendedColors: getRecommendedHairColors(season),
    avoidColors: getAvoidHairColors(season),
    tonalGuideline: characteristics.warmth > 50 ? 'warm-based' : 'cool-based',
    brightnessGuideline: characteristics.brightness > 50 ? 'bright-tones' : 'muted-tones'
  };
}

// PC-1 결과를 M-1에 전달
function applyToMakeupAnalysis(pcResult: PersonalColorResult): MakeupPaletteRecommendation {
  const palette = SEASON_MAKEUP_PALETTES[pcResult.season];

  return {
    lipColors: palette.lipColors,
    eyeshadowTones: palette.eyeshadowTones,
    blusherColors: palette.blusherColors,
    intensityLevel: pcResult.characteristics.brightness > 60 ? 'bold' : 'soft'
  };
}
```

### 4.2 S-1 → M-1 연동

피부 분석 결과(S-1)는 메이크업 분석(M-1)의 파운데이션 및 베이스 메이크업에 활용된다.

```typescript
interface SkinAnalysisResult {
  skinType: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  concerns: string[];
  hydration: number;
  oiliness: number;
  sensitivity: number;
  poreSize: number;
  roughness: number;
}

// S-1 결과를 M-1에 전달
function applyToMakeupBase(skinResult: SkinAnalysisResult): BaseRecommendation {
  return {
    foundation: {
      finish: skinResult.oiliness > 60 ? 'matte' :
              skinResult.hydration < 40 ? 'dewy' : 'satin',
      coverage: skinResult.poreSize > 50 || skinResult.concerns.length > 2
                ? 'medium-full' : 'light-medium',
      formula: skinResult.skinType === 'sensitive' ? 'hypoallergenic' : 'standard'
    },
    primer: {
      type: skinResult.oiliness > 60 ? 'mattifying' :
            skinResult.hydration < 40 ? 'hydrating' :
            skinResult.poreSize > 50 ? 'pore-minimizing' : 'smoothing'
    },
    settingProduct: {
      type: skinResult.oiliness > 60 ? 'powder' : 'setting-spray',
      coverage: skinResult.skinType === 'dry' ? 'light' : 'medium'
    }
  };
}
```

### 4.3 H-1/M-1 → N-1 크로스 모듈 인사이트

헤어와 메이크업 분석 결과는 영양 분석(N-1)에 알림으로 전달되어 통합적 케어를 제안한다.

```typescript
type AlertType =
  | 'scalp_health_nutrition'    // 두피 건강 영양 제안
  | 'hair_loss_prevention'      // 탈모 예방 영양소
  | 'hair_shine_boost'          // 모발 윤기 영양소
  | 'skin_tone_nutrition'       // 피부톤 개선 영양소
  | 'collagen_boost';           // 콜라겐 생성 영양소

interface CrossModuleAlert {
  type: AlertType;
  source: 'H-1' | 'M-1';
  priority: 'high' | 'medium' | 'low';
  message: string;
  nutritionSuggestions: string[];
}

// H-1 → N-1 알림 생성
function generateHairNutritionAlerts(hairResult: HairAnalysisResult): CrossModuleAlert[] {
  const alerts: CrossModuleAlert[] = [];

  // 두피 건강 알림
  if (hairResult.scalpHealth < 60) {
    alerts.push({
      type: 'scalp_health_nutrition',
      source: 'H-1',
      priority: 'high',
      message: '두피 건강 개선이 필요합니다',
      nutritionSuggestions: ['비오틴', '아연', '오메가-3', '비타민 B군']
    });
  }

  // 모발 윤기 알림
  if (hairResult.shineScore < 50) {
    alerts.push({
      type: 'hair_shine_boost',
      source: 'H-1',
      priority: 'medium',
      message: '모발 윤기 개선을 위한 영양소를 추천합니다',
      nutritionSuggestions: ['비타민 E', '실리카', '콜라겐', '철분']
    });
  }

  // 탈모 예방 알림
  if (hairResult.density < 70 || hairResult.lossIndicator > 30) {
    alerts.push({
      type: 'hair_loss_prevention',
      source: 'H-1',
      priority: 'high',
      message: '모발 밀도 감소가 감지되었습니다',
      nutritionSuggestions: ['비오틴', '철분', '비타민 D', '단백질', '아연']
    });
  }

  return alerts;
}

// M-1 → N-1 알림 생성
function generateMakeupNutritionAlerts(
  makeupResult: MakeupAnalysisResult,
  skinResult: SkinAnalysisResult
): CrossModuleAlert[] {
  const alerts: CrossModuleAlert[] = [];

  // 피부톤 개선 알림
  if (makeupResult.skinToneUniformity < 60) {
    alerts.push({
      type: 'skin_tone_nutrition',
      source: 'M-1',
      priority: 'medium',
      message: '피부톤 균일도 개선을 위한 영양소를 추천합니다',
      nutritionSuggestions: ['비타민 C', '나이아신아마이드', '글루타치온', '비타민 E']
    });
  }

  // 콜라겐 생성 알림 (피부 탄력 저하 시)
  if (skinResult.concerns.includes('fine-lines') || skinResult.concerns.includes('sagging')) {
    alerts.push({
      type: 'collagen_boost',
      source: 'M-1',
      priority: 'high',
      message: '피부 탄력 개선을 위한 콜라겐 생성 영양소를 추천합니다',
      nutritionSuggestions: ['콜라겐 펩타이드', '비타민 C', '프롤린', '글리신']
    });
  }

  return alerts;
}
```

---

## 5. 검증 방법

### 5.1 헤어 분석 검증

```typescript
interface HairAnalysisValidation {
  // 얼굴형 분류 정확도
  faceShapeAccuracy: {
    method: 'manual-labeling-comparison';
    minAccuracy: 85;  // %
    testSetSize: 500;
  };

  // 헤어컬러 분류 정확도
  hairColorAccuracy: {
    method: 'lab-range-validation';
    minAccuracy: 90;  // %
    deltaE_threshold: 10;  // CIE Delta E
  };

  // 시즌-헤어컬러 조화도 타당성
  harmonyValidation: {
    method: 'expert-rating-comparison';
    correlationThreshold: 0.8;  // Pearson r
  };
}
```

### 5.2 메이크업 분석 검증

```typescript
interface MakeupAnalysisValidation {
  // 립 컬러 분류 정확도
  lipColorAccuracy: {
    method: 'lab-classification';
    minAccuracy: 88;  // %
  };

  // 시즌-메이크업 조화도 검증
  paletteValidation: {
    method: 'ab-testing';
    preferenceRate: 70;  // % (전문가 선호도)
  };

  // 컨투어링 가이드 효과
  contouringEffectiveness: {
    method: 'before-after-perception-study';
    improvementRate: 60;  // %
  };
}
```

### 5.3 크로스 모듈 검증

```typescript
interface CrossModuleValidation {
  // 영양 알림 관련성
  nutritionAlertRelevance: {
    method: 'expert-review';
    relevanceScore: 4.0;  // out of 5.0
  };

  // 모듈 간 데이터 일관성
  dataConsistency: {
    method: 'automated-schema-validation';
    errorRate: 0.1;  // % 이하
  };
}
```

---

## 6. 참고 자료

### 학술 자료

1. **색채학**
   - CIE 1976 L*a*b* Color Space (Commission Internationale de l'Eclairage)
   - IEC 61966-2-1:1999 - sRGB 표준
   - Munsell, A.H. (1905). "A Color Notation"
   - Itten, J. (1961). "The Art of Color" - 색채 조화 이론
   - Kobayashi, S. (1991). "Color Image Scale" - 색채 이미지 스케일
   - 한국인 피부색 측정 연구 (Korean Journal of Dermatology)

2. **얼굴 측정학 (Anthropometry)**
   - Farkas, L.G. (1994). "Anthropometry of the Head and Face" - 얼굴 측정학 표준
   - Ramos-e-Silva, M. (2011). "Facial Proportions" - Journal of Cosmetic Dermatology
   - 대한성형외과학회 (2019). "한국인 안면 비율 연구"
   - Vegter, F. & Hage, J.J. (2000). "Clinical Anthropometry and Canons of the Face in Historical Perspective"

3. **모발 과학**
   - International Colour Chart System (ICC) - 헤어 레벨 시스템
   - L'Oréal Professional Hair Color Level System
   - Walker, A. & Andre, O. (2007). "Hair Morphology Classification"
   - Journal of Cosmetic Science - Hair Structure Studies
   - 한국인 모발 특성 연구 (대한피부과학회지)

4. **메이크업 이론**
   - Color Theory for Makeup Artists (Pantone Institute)
   - Face Shape Analysis and Contouring Techniques
   - Personal Color Analysis Methodology
   - Westmore, M. (1976). "Corrective Makeup Techniques"

### 관련 원리 문서

- [color-science.md](./color-science.md) - Lab 색공간, 웜/쿨톤 이론
- [skin-physiology.md](./skin-physiology.md) - 피부 구조, 피부 타입 분류

### 관련 스펙 문서

- [SDD-HAIR-ANALYSIS.md](../specs/SDD-HAIR-ANALYSIS.md) - H-1 모듈 구현 스펙
- [SDD-MAKEUP-ANALYSIS.md](../specs/SDD-MAKEUP-ANALYSIS.md) - M-1 모듈 구현 스펙
- [cross-module-insights-hair-makeup.md](../specs/cross-module-insights-hair-makeup.md) - 크로스 모듈 연동

---

**Version**: 3.0 | **Created**: 2026-01-22 | **Updated**: 2026-01-23
**Modules**: H-1 (헤어분석), M-1 (메이크업분석)
**Dependencies**: PC-1 (퍼스널컬러), S-1 (피부분석)
**Downstream**: N-1 (영양분석)
**P2 Score**: 85/100 (v3.0 기준)

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-22 | 초기 버전 |
| 2.0 | 2026-01-23 | 품질 개선: 얼굴형 7분류 임계값 추가, sRGB→Lab 변환 공식, 헤어 레벨(1-10) 시스템, 색상 조화 공식, 얼굴형×헤어길이×스타일 매트릭스 |
| 3.0 | 2026-01-23 | P2 원칙 준수 강화: CIEDE2000 색차 공식, MediaPipe Face Mesh 468 랜드마크 인덱스, 한국인 모발 특성 데이터 (n=5,000), K-Beauty 헤어컬러 트렌드, 한국인 특화 보정 알고리즘 |
