# SDD: CIE-2 얼굴 감지 및 랜드마크 추출 (Face Detection & Landmark Extraction)

> **Status**: 📋 Planned
> **Version**: 1.0
> **Created**: 2026-01-21
> **Updated**: 2026-01-21

> 퍼스널컬러/피부 분석을 위한 얼굴 감지 및 468포인트 랜드마크 추출 파이프라인

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"실시간 인간 수준 얼굴 인식 및 자세 추정"

- Real-time Multi-Face: 30fps@1080p, 최대 10명 동시 감지
- Human-level Accuracy: 468포인트 랜드마크 정확도 95% (전문가 수동 마킹 대비)
- Robust Pose Estimation: 360° 모든 각도에서 Pitch/Yaw/Roll ±2° 이내 정확도
- Adverse Conditions: 저조도, 역광, 마스크/선글라스 착용 시에도 85% 감지율
- Edge Computing: 클라이언트 디바이스 온디바이스 추론 (서버 통신 0)
```

### 물리적 한계

| 한계 | 설명 | 이룸 영향 |
|------|------|----------|
| **MediaPipe 번들 크기** | 5MB (WASM + 모델) | 초기 로딩 2-3초, CDN 필수 |
| **WebGL 의존성** | iOS Safari 16.4+ 필수 | 구형 디바이스 fallback 필요 |
| **계산 복잡도** | 468포인트 × 30fps = O(n²) | 저사양 기기 15fps 제한 |
| **가림 한계** | 얼굴 50% 이상 가려지면 감지 실패 | 마스크/선글라스 경고 |
| **조명 의존성** | 극심한 역광/저조도 시 랜드마크 부정확 | CIE-1과 연계 재촬영 유도 |

### 100점 기준

| 지표 | 100점 기준 | 현재 목표 (MVP) | 달성률 |
|------|-----------|----------------|--------|
| **랜드마크 정확도** | 전문가 수동 마킹 95% 일치 | MediaPipe 기본 성능 (~85%) | 89% |
| **각도 정확도** | ±2° (Pitch/Yaw/Roll) | ±5° (정면 얼굴 한정) | 40% |
| **처리 속도** | 30fps@1080p (모바일) | 15fps@720p | 50% |
| **다중 얼굴 지원** | 10명 동시 감지 | 5명 (베스트 1명 선택) | 50% |
| **가림 강건성** | 선글라스/마스크 85% 감지 | 경고 메시지만 (구현 X) | 0% |
| **역광 대응** | HDR 전처리 | CIE-1 연계 경고 | 20% |

**종합 달성률**: **40%** (MVP CIE-2 기본 감지)

### 현재 목표

**40%** - MVP CIE-2 얼굴 감지 및 정면성 검증

#### ✅ 이번 구현 포함 (MVP)
- MediaPipe Face Mesh 468포인트 감지 (계획)
- Euler 각도 계산 (Pitch/Yaw/Roll) (계획)
- 정면성 점수 70점 임계값 검증 (계획)
- 단일 베스트 얼굴 선택 (계획)
- 20% 마진 얼굴 영역 추출 (계획)

#### ⏳ 부분 구현 (추후 개선)
- 다중 얼굴 동시 처리: 감지는 5명, 선택은 1명 (50%)
- 성능 최적화: 15fps@720p (목표 30fps의 50%)
- 신뢰도 계산: 감지 40% + 정면성 40% + 크기 20% (기본만)

#### ❌ 의도적 제외
- 360° 자세 추정: 측면/뒷면 얼굴 (Phase 2, 재검토 시점: 멀티뷰 분석 도입 시)
- 가림 강건성: 마스크/선글라스 감지 (Phase 3, 재검토 시점: 의료 분석 모듈 추가 시)
- HDR 전처리: CIE-1 책임 (현재 경고만)
- 실시간 프리뷰 AR 가이드: WebXR 필요 (Phase 4, 재검토 시점: AR 기능 로드맵 확정 시)

### 의도적 제외 상세

| 제외 항목 | 이유 | 비용 | 재검토 시점 |
|----------|------|------|------------|
| **360° 자세 추정** | 측면/뒷면 얼굴은 퍼스널컬러/피부 분석 불가 | 알고리즘 복잡도 3배 | 멀티뷰 3D 재구성 도입 시 |
| **마스크/선글라스 감지** | Segmentation 모델 추가 필요 (번들 +3MB) | 번들 크기 160% | 의료 분석 (구강, 눈) 추가 시 |
| **HDR 전처리** | CIE-1 책임, 중복 구현 방지 | - | 불필요 (모듈 경계 명확) |
| **AR 실시간 가이드** | WebXR API, iOS ARKit 연동 복잡 | 개발 4주+ | AR 쇼핑/메이크업 기능 확정 시 |
| **에지 애니메이션** | 성능 영향 (렌더링 비용) | FPS -5 | UX 개선 단계에서 A/B 테스트 |

### 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| MediaPipe Face Mesh 초기화 | 📋 계획 | `lib/image-engine/face-detector.ts` |
| 얼굴 감지 및 바운딩 박스 | 📋 계획 | `lib/image-engine/face-detector.ts` |
| 468포인트 랜드마크 추출 | 📋 계획 | `lib/image-engine/landmark-extractor.ts` |
| 얼굴 각도 계산 (Pitch/Yaw/Roll) | 📋 계획 | `lib/image-engine/pose-estimator.ts` |
| 정면성 점수 산출 | 📋 계획 | `lib/image-engine/frontality-scorer.ts` |
| 다중 얼굴 처리 | 📋 계획 | `lib/image-engine/multi-face-handler.ts` |
| 얼굴 영역 추출 (margin 포함) | 📋 계획 | `lib/image-engine/face-cropper.ts` |
| 실시간 프리뷰 가이드 | ⏳ 향후 | `components/camera/FaceGuide.tsx` |

---

## 1. 개요

### 1.1 목적

- **얼굴 감지**: 이미지 내 얼굴 존재 여부 및 위치 확인
- **랜드마크 추출**: 468포인트 3D 랜드마크로 정밀한 얼굴 분석 기반 제공
- **정면성 검증**: Pitch/Yaw/Roll 각도 검증으로 분석 품질 보장
- **ROI 기반 제공**: 후속 모듈(CIE-3, CIE-4)에 표준화된 얼굴 영역 전달

### 1.2 범위

| 항목 | 우선순위 | 복잡도 | 구현 상태 |
|------|----------|--------|----------|
| MediaPipe Face Mesh 초기화 | 필수 | 중간 | 📋 계획 |
| 얼굴 감지 및 바운딩 박스 | 필수 | 낮음 | 📋 계획 |
| 468포인트 랜드마크 추출 | 필수 | 중간 | 📋 계획 |
| 얼굴 각도 계산 (Pitch/Yaw/Roll) | 필수 | 중간 | 📋 계획 |
| 정면성 점수 산출 | 필수 | 낮음 | 📋 계획 |
| 다중 얼굴 처리 | 높음 | 낮음 | 📋 계획 |
| 얼굴 영역 추출 (margin 포함) | 높음 | 낮음 | 📋 계획 |
| 실시간 프리뷰 가이드 | 낮음 | 높음 | ⏳ 향후 |

### 1.3 관련 문서

- [ADR-033: 얼굴 감지 라이브러리 선택](../adr/ADR-033-face-detection-library.md) - MediaPipe 선택 결정
- [원리: 이미지 처리](../principles/image-processing.md) - 얼굴 각도 계산 수학
- [SDD-CIE-1: 이미지 품질 검증](./SDD-CIE-1-IMAGE-QUALITY.md) - 선행 모듈
- [SDD-CIE-3: AWB 보정](./SDD-CIE-3-AWB-CORRECTION.md) - 후속 모듈

---

## 2. 얼굴 감지 이론

### 2.1 MediaPipe Face Mesh 개요

**MediaPipe Face Mesh**는 Google에서 개발한 실시간 얼굴 랜드마크 감지 솔루션으로, 468개의 3D 얼굴 랜드마크를 추출한다.

```
┌─────────────────────────────────────────────────────────────┐
│                  MediaPipe Face Mesh 아키텍처               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  입력 이미지                                                │
│       ↓                                                     │
│  ┌───────────────────┐                                      │
│  │ Face Detector     │  BlazeFace 기반, 얼굴 영역 검출      │
│  │ (192×192 입력)    │  출력: 바운딩 박스 + 6개 핵심점      │
│  └─────────┬─────────┘                                      │
│            ↓                                                │
│  ┌───────────────────┐                                      │
│  │ Face Mesh Model   │  얼굴 영역 크롭 후 상세 분석         │
│  │ (192×192 입력)    │  출력: 468개 3D 랜드마크 (x,y,z)     │
│  └─────────┬─────────┘                                      │
│            ↓                                                │
│  얼굴 랜드마크 (468점)                                      │
│  + 변환 행렬 (3D 포즈)                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 468 랜드마크 구조

**랜드마크 좌표계**:
- **x**: 0.0 (왼쪽) ~ 1.0 (오른쪽), 정규화된 수평 위치
- **y**: 0.0 (위) ~ 1.0 (아래), 정규화된 수직 위치
- **z**: 상대적 깊이, 코 끝 기준 음수(뒤) ~ 양수(앞)

**주요 랜드마크 인덱스**:

```typescript
const LANDMARK_INDICES = {
  // 얼굴 윤곽선 (Face Oval)
  FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
              397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
              172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],

  // 포즈 계산용 핵심점
  POSE: {
    NOSE_TIP: 1,           // 코 끝
    CHIN: 152,             // 턱 끝
    LEFT_EYE_INNER: 133,   // 왼쪽 눈 안쪽
    LEFT_EYE_OUTER: 33,    // 왼쪽 눈 바깥쪽
    RIGHT_EYE_INNER: 362,  // 오른쪽 눈 안쪽
    RIGHT_EYE_OUTER: 263,  // 오른쪽 눈 바깥쪽
    LEFT_MOUTH: 61,        // 왼쪽 입꼬리
    RIGHT_MOUTH: 291,      // 오른쪽 입꼬리
    FOREHEAD: 10,          // 이마 중앙
    NOSE_BRIDGE: 6,        // 코 브릿지
  },

  // 퍼스널 컬러 분석용 영역
  LEFT_CHEEK: [50, 101, 118, 119, 120, 100],
  RIGHT_CHEEK: [280, 330, 347, 348, 349, 329],
  FOREHEAD: [10, 67, 69, 104, 108, 151, 297, 299, 333, 337],
  UPPER_LIP: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  LOWER_LIP: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],

  // 홍채 (refineLandmarks=true 필요)
  LEFT_IRIS: [468, 469, 470, 471, 472],
  RIGHT_IRIS: [473, 474, 475, 476, 477],
};
```

### 2.3 라이브러리 비교

| 항목 | face-api.js | MediaPipe Face Mesh |
|------|-------------|---------------------|
| **랜드마크 수** | 68개 (2D) | **468개 (3D)** |
| **추론 속도** | 1-3 FPS | **30-100+ FPS** |
| **번들 크기** | ~1.26 MB | ~4-6 MB |
| **유지보수** | ❌ 2020년 중단 | ✅ Google 활발 |
| **3D 깊이** | ❌ | ✅ Z좌표 제공 |
| **포즈 추정** | 외부 계산 필요 | 내장 지원 |

---

## 3. 얼굴 각도 검증

### 3.1 오일러 각 정의

```
┌─────────────────────────────────────────────────────────────┐
│                    얼굴 좌표계 (Face Coordinate)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Pitch (X축 회전)                       │
│                           ↑ +10° 위를 봄                    │
│                           │                                 │
│          Yaw (Y축 회전)   │                                 │
│  -15° 왼쪽 ←──────────────●──────────────→ +15° 오른쪽     │
│                           │                                 │
│                           ↓ -10° 아래를 봄                  │
│                                                             │
│                    Roll (Z축 회전)                          │
│               -20° 왼쪽 기울임 ↔ +20° 오른쪽 기울임         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| 축 | 양수 방향 | 허용 범위 | 거부 조건 |
|----|----------|----------|----------|
| **Pitch** (상하) | 위를 봄 | **±10°** | \|pitch\| > 10° |
| **Yaw** (좌우) | 오른쪽을 봄 | **±15°** | \|yaw\| > 15° |
| **Roll** (기울임) | 오른쪽 기울임 | **±20°** | \|roll\| > 20° |

### 3.2 각도 허용 범위 근거

| 축 | 허용 범위 | 근거 |
|----|----------|------|
| **Pitch ±10°** | 고개를 10° 이상 들거나 숙이면 눈/코/입 비율 왜곡 |
| **Yaw ±15°** | 15° 이상 돌리면 한쪽 볼/귀 가려짐, 피부톤 측정 불균형 |
| **Roll ±20°** | 20° 이상 기울이면 대칭 분석 어려움, 좌우 비교 불가 |

### 3.3 사용자 피드백 메시지

| 상태 | 조건 | 메시지 (한국어) |
|------|------|----------------|
| PITCH_UP | pitch > +10° | "고개를 조금 내려주세요" |
| PITCH_DOWN | pitch < -10° | "고개를 조금 들어주세요" |
| YAW_LEFT | yaw < -15° | "얼굴을 오른쪽으로 돌려주세요" |
| YAW_RIGHT | yaw > +15° | "얼굴을 왼쪽으로 돌려주세요" |
| ROLL_LEFT | roll < -20° | "고개를 오른쪽으로 기울여주세요" |
| ROLL_RIGHT | roll > +20° | "고개를 왼쪽으로 기울여주세요" |
| NO_FACE | 감지 없음 | "얼굴을 화면 안에 위치시켜 주세요" |
| MULTIPLE_FACES | 2명 이상 | "한 명만 촬영해 주세요" |
| OK | 모든 조건 충족 | "좋습니다! 촬영 버튼을 눌러주세요" |

---

## 4. 알고리즘 상세

### 4.1 얼굴 각도 계산 알고리즘

```typescript
/**
 * 3D 랜드마크에서 얼굴 회전 각도 계산
 *
 * 수학적 기초:
 * - 코 끝, 눈, 턱 위치에서 방향 벡터 계산
 * - 방향 벡터에서 오일러 각(Euler Angles) 추출
 *
 * 참조: docs/principles/image-processing.md Section 4.2
 */
interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface FaceAngle {
  pitch: number;  // X축 회전 (degrees), 범위: -90 ~ +90
  yaw: number;    // Y축 회전 (degrees), 범위: -90 ~ +90
  roll: number;   // Z축 회전 (degrees), 범위: -180 ~ +180
}

function calculateFaceAngle(landmarks: Point3D[]): FaceAngle {
  // 1. 핵심 랜드마크 추출
  const noseTip = landmarks[LANDMARK_INDICES.POSE.NOSE_TIP];
  const chin = landmarks[LANDMARK_INDICES.POSE.CHIN];
  const leftEyeOuter = landmarks[LANDMARK_INDICES.POSE.LEFT_EYE_OUTER];
  const rightEyeOuter = landmarks[LANDMARK_INDICES.POSE.RIGHT_EYE_OUTER];
  const forehead = landmarks[LANDMARK_INDICES.POSE.FOREHEAD];

  // 2. 얼굴 중심 계산 (양 눈 중간점)
  const faceCenter: Point3D = {
    x: (leftEyeOuter.x + rightEyeOuter.x) / 2,
    y: (leftEyeOuter.y + rightEyeOuter.y) / 2,
    z: (leftEyeOuter.z + rightEyeOuter.z) / 2,
  };

  // 3. 정면 방향 벡터 (코끝 → 얼굴 중심)
  const forwardVector = normalize({
    x: noseTip.x - faceCenter.x,
    y: noseTip.y - faceCenter.y,
    z: noseTip.z - faceCenter.z,
  });

  // 4. 수평 방향 벡터 (왼쪽 눈 → 오른쪽 눈)
  const rightVector = normalize({
    x: rightEyeOuter.x - leftEyeOuter.x,
    y: rightEyeOuter.y - leftEyeOuter.y,
    z: rightEyeOuter.z - leftEyeOuter.z,
  });

  // 5. 수직 방향 벡터 (외적: right × forward)
  const upVector = crossProduct(rightVector, forwardVector);

  // 6. 회전 행렬에서 오일러 각 추출
  // Pitch: arctan2(-forward.y, forward.z)
  // Yaw: arctan2(forward.x, forward.z)
  // Roll: arctan2(right.y, right.x)
  const pitch = Math.atan2(-forwardVector.y, forwardVector.z) * (180 / Math.PI);
  const yaw = Math.atan2(forwardVector.x, forwardVector.z) * (180 / Math.PI);
  const roll = Math.atan2(rightVector.y, rightVector.x) * (180 / Math.PI);

  return { pitch, yaw, roll };
}

/**
 * 벡터 정규화
 */
function normalize(v: Point3D): Point3D {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}

/**
 * 벡터 외적 (Cross Product)
 */
function crossProduct(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
```

### 4.2 정면성 점수 계산

```typescript
/**
 * 얼굴 정면성 점수 계산 (0-100)
 *
 * 각 축의 편차를 정규화하여 종합 점수 산출
 * - 70점 이상: 분석 가능
 * - 50-70점: 경고 표시 후 분석 가능
 * - 50점 미만: 분석 거부
 *
 * 가중치:
 * - Yaw(좌우) 50%: 퍼스널컬러 분석에 가장 중요 (양 볼 균등 노출)
 * - Pitch(상하) 30%: 눈/코/입 비율에 영향
 * - Roll(기울임) 20%: 대칭 분석에 영향
 */
interface FrontalityResult {
  score: number;           // 0-100
  isAcceptable: boolean;   // score >= 70
  hasWarning: boolean;     // 50 <= score < 70
  breakdown: {
    pitchScore: number;
    yawScore: number;
    rollScore: number;
  };
}

const FRONTALITY_THRESHOLDS = {
  ANALYSIS_OK: 70,    // 분석 가능
  WARNING: 50,        // 경고 표시
  REJECT: 50,         // 분석 거부 (WARNING과 동일)
} as const;

function calculateFrontalityScore(angle: FaceAngle): FrontalityResult {
  // 각 축별 점수 계산 (허용 범위 내에서 100점, 범위 초과 시 감점)
  // Pitch: ±10° 허용, 10°당 -10점
  const pitchScore = Math.max(0, 100 - Math.abs(angle.pitch) * 10);

  // Yaw: ±15° 허용, 15°당 -10점 (= 6.67°당 -1점)
  const yawScore = Math.max(0, 100 - Math.abs(angle.yaw) * (100 / 15));

  // Roll: ±20° 허용, 20°당 -10점 (= 5°당 -1점)
  const rollScore = Math.max(0, 100 - Math.abs(angle.roll) * 5);

  // 가중 평균 (Yaw가 가장 중요)
  const score = pitchScore * 0.3 + yawScore * 0.5 + rollScore * 0.2;

  return {
    score: Math.round(score),
    isAcceptable: score >= FRONTALITY_THRESHOLDS.ANALYSIS_OK,
    hasWarning: score >= FRONTALITY_THRESHOLDS.WARNING && score < FRONTALITY_THRESHOLDS.ANALYSIS_OK,
    breakdown: {
      pitchScore: Math.round(pitchScore),
      yawScore: Math.round(yawScore),
      rollScore: Math.round(rollScore),
    },
  };
}
```

### 4.3 다중 얼굴 처리

```typescript
/**
 * 다중 얼굴 감지 시 최적의 얼굴 선택
 *
 * 선택 기준:
 * 1. 바운딩 박스 크기 (가장 큰 얼굴 = 메인 피사체)
 * 2. 정면성 점수 (더 정면인 얼굴 우선)
 * 3. 이미지 중앙 근접도 (중앙에 가까운 얼굴 우선)
 *
 * 최종 가중치: 크기 50% + 정면성 30% + 중앙 근접도 20%
 */
interface DetectedFace {
  boundingBox: BoundingBox;
  landmarks: Point3D[];
  angle: FaceAngle;
  frontalityScore: number;
}

interface BoundingBox {
  x: number;      // 좌상단 X (정규화: 0-1)
  y: number;      // 좌상단 Y (정규화: 0-1)
  width: number;  // 너비 (정규화: 0-1)
  height: number; // 높이 (정규화: 0-1)
}

function selectBestFace(
  faces: DetectedFace[],
  imageWidth: number,
  imageHeight: number
): DetectedFace | null {
  if (faces.length === 0) return null;
  if (faces.length === 1) return faces[0];

  // 각 얼굴의 종합 점수 계산
  const scoredFaces = faces.map((face) => {
    // 1. 크기 점수 (0-100): 바운딩 박스 면적 기준
    const area = face.boundingBox.width * face.boundingBox.height;
    const maxArea = Math.max(...faces.map(f => f.boundingBox.width * f.boundingBox.height));
    const sizeScore = (area / maxArea) * 100;

    // 2. 정면성 점수 (0-100): 이미 계산됨
    const frontalityScore = face.frontalityScore;

    // 3. 중앙 근접도 점수 (0-100)
    const centerX = face.boundingBox.x + face.boundingBox.width / 2;
    const centerY = face.boundingBox.y + face.boundingBox.height / 2;
    const distanceFromCenter = Math.sqrt(
      Math.pow(centerX - 0.5, 2) + Math.pow(centerY - 0.5, 2)
    );
    // 최대 거리는 대각선의 절반 (약 0.707)
    const centerScore = Math.max(0, 100 - (distanceFromCenter / 0.707) * 100);

    // 종합 점수 계산
    const totalScore = sizeScore * 0.5 + frontalityScore * 0.3 + centerScore * 0.2;

    return { face, totalScore };
  });

  // 가장 높은 점수의 얼굴 반환
  scoredFaces.sort((a, b) => b.totalScore - a.totalScore);
  return scoredFaces[0].face;
}
```

### 4.4 얼굴 영역 추출 (Margin 포함)

```typescript
/**
 * 얼굴 영역 추출 (20% 마진 포함)
 *
 * 마진을 추가하는 이유:
 * - 이마, 볼 외곽 영역 포함
 * - 조명 분석을 위한 주변 영역 확보
 * - 후속 처리(AWB)를 위한 컨텍스트 제공
 */
interface FaceRegion {
  x: number;          // 픽셀 좌표 (마진 포함)
  y: number;
  width: number;
  height: number;
  margin: number;     // 적용된 마진 비율
  originalBoundingBox: BoundingBox;  // 원본 바운딩 박스 (정규화)
}

const FACE_MARGIN_RATIO = 0.20;  // 20% 마진

function extractFaceRegion(
  boundingBox: BoundingBox,
  imageWidth: number,
  imageHeight: number,
  margin: number = FACE_MARGIN_RATIO
): FaceRegion {
  // 정규화된 좌표를 픽셀 좌표로 변환
  const x = boundingBox.x * imageWidth;
  const y = boundingBox.y * imageHeight;
  const w = boundingBox.width * imageWidth;
  const h = boundingBox.height * imageHeight;

  // 마진 계산 (바운딩 박스 크기의 비율)
  const marginX = w * margin;
  const marginY = h * margin;

  // 마진이 적용된 영역 계산 (이미지 경계 내로 클램핑)
  const regionX = Math.max(0, x - marginX);
  const regionY = Math.max(0, y - marginY);
  const regionWidth = Math.min(imageWidth - regionX, w + marginX * 2);
  const regionHeight = Math.min(imageHeight - regionY, h + marginY * 2);

  return {
    x: Math.round(regionX),
    y: Math.round(regionY),
    width: Math.round(regionWidth),
    height: Math.round(regionHeight),
    margin,
    originalBoundingBox: boundingBox,
  };
}
```

---

## 5. 입력/출력 스펙

### 5.1 입력 인터페이스

```typescript
// types/cie-2.ts
export interface CIE2Input {
  imageData: ImageData;              // 원본 이미지 데이터
  options?: CIE2Options;
}

export interface CIE2Options {
  refineLandmarks?: boolean;         // 홍채 랜드마크 포함 (기본: true)
  maxFaces?: number;                 // 최대 감지 얼굴 수 (기본: 1)
  minDetectionConfidence?: number;   // 최소 감지 신뢰도 (기본: 0.5)
  minTrackingConfidence?: number;    // 최소 추적 신뢰도 (기본: 0.5)
  enableAngleValidation?: boolean;   // 각도 검증 활성화 (기본: true)
  angleThresholds?: {
    pitchMax?: number;               // 기본: 10
    yawMax?: number;                 // 기본: 15
    rollMax?: number;                // 기본: 20
  };
}
```

### 5.2 출력 인터페이스

```typescript
export interface CIE2Output {
  success: boolean;

  // 얼굴 감지 결과
  faceDetected: boolean;
  faceCount: number;

  // 선택된 얼굴 정보 (faceDetected=true일 때만 유효)
  selectedFace?: {
    landmarks: FaceLandmarks;
    boundingBox: BoundingBox;
    angle: FaceAngle;
    frontalityScore: number;
  };

  // 얼굴 영역 (마진 포함)
  faceRegion?: FaceRegion;

  // 검증 결과
  validation: {
    isAngleValid: boolean;
    angleFeedback: AngleFeedback | null;
    frontalityResult: FrontalityResult;
  };

  // 메타데이터
  metadata: {
    processingTime: number;          // ms
    modelVersion: string;
    confidence: number;              // 0-1
  };

  // 에러 정보 (success=false일 때)
  error?: {
    code: CIE2ErrorCode;
    message: string;
  };
}

export interface FaceLandmarks {
  points: Point3D[];                 // 468개 (또는 478개 with iris)
  faceOval: number[];                // 얼굴 윤곽선 인덱스
  leftEye: number[];
  rightEye: number[];
  lips: number[];
  leftCheek: number[];
  rightCheek: number[];
  forehead: number[];
  leftIris?: number[];               // refineLandmarks=true일 때
  rightIris?: number[];
}

export type AngleFeedback =
  | { type: 'PITCH_UP'; message: string }
  | { type: 'PITCH_DOWN'; message: string }
  | { type: 'YAW_LEFT'; message: string }
  | { type: 'YAW_RIGHT'; message: string }
  | { type: 'ROLL_LEFT'; message: string }
  | { type: 'ROLL_RIGHT'; message: string }
  | { type: 'NO_FACE'; message: string }
  | { type: 'MULTIPLE_FACES'; message: string }
  | { type: 'OK'; message: string };
```

---

## 6. 에러 케이스

### 6.1 에러 코드 정의

```typescript
export enum CIE2ErrorCode {
  // 얼굴 감지 관련
  NO_FACE_DETECTED = 'NO_FACE_DETECTED',
  MULTIPLE_FACES = 'MULTIPLE_FACES_DETECTED',
  FACE_TOO_SMALL = 'FACE_TOO_SMALL',
  FACE_OUT_OF_BOUNDS = 'FACE_OUT_OF_BOUNDS',

  // 각도 검증 관련
  PITCH_OUT_OF_RANGE = 'PITCH_OUT_OF_RANGE',
  YAW_OUT_OF_RANGE = 'YAW_OUT_OF_RANGE',
  ROLL_OUT_OF_RANGE = 'ROLL_OUT_OF_RANGE',
  LOW_FRONTALITY_SCORE = 'LOW_FRONTALITY_SCORE',

  // 모델 관련
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  MODEL_INFERENCE_FAILED = 'MODEL_INFERENCE_FAILED',

  // 입력 관련
  INVALID_IMAGE_DATA = 'INVALID_IMAGE_DATA',
  IMAGE_TOO_SMALL = 'IMAGE_TOO_SMALL',

  // 일반
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### 6.2 에러 처리 전략

| 에러 코드 | 사용자 메시지 | 복구 전략 |
|----------|--------------|----------|
| NO_FACE_DETECTED | "얼굴을 찾을 수 없습니다. 화면 안에 얼굴을 위치시켜 주세요." | 재촬영 유도 |
| MULTIPLE_FACES | "여러 얼굴이 감지되었습니다. 한 명만 촬영해 주세요." | 가장 큰 얼굴 자동 선택 또는 재촬영 |
| FACE_TOO_SMALL | "얼굴이 너무 작습니다. 카메라에 더 가까이 와주세요." | 재촬영 유도 |
| PITCH_OUT_OF_RANGE | "카메라를 정면으로 바라봐 주세요." | 실시간 가이드 |
| YAW_OUT_OF_RANGE | "얼굴을 정면으로 향해 주세요." | 실시간 가이드 |
| ROLL_OUT_OF_RANGE | "고개를 똑바로 해주세요." | 실시간 가이드 |
| LOW_FRONTALITY_SCORE | "얼굴을 정면으로 향해 분석 품질을 높여주세요." | 경고 표시 후 계속 허용 (50-70점) |
| MODEL_LOAD_FAILED | "분석 모델을 불러오는 중입니다. 잠시 후 다시 시도해 주세요." | 재시도 (최대 3회) |

### 6.3 에러 처리 흐름

```typescript
/**
 * CIE-2 에러 처리 흐름
 */
async function processFaceDetection(input: CIE2Input): Promise<CIE2Output> {
  const startTime = performance.now();

  try {
    // 1. 입력 검증
    if (!input.imageData || input.imageData.width < 100 || input.imageData.height < 100) {
      return createErrorOutput(CIE2ErrorCode.IMAGE_TOO_SMALL, startTime);
    }

    // 2. 모델 초기화 (필요 시)
    const detector = await initializeDetector();
    if (!detector) {
      return createErrorOutput(CIE2ErrorCode.MODEL_LOAD_FAILED, startTime);
    }

    // 3. 얼굴 감지
    const detections = await detector.detect(input.imageData);

    if (detections.length === 0) {
      return createErrorOutput(CIE2ErrorCode.NO_FACE_DETECTED, startTime);
    }

    // 4. 다중 얼굴 처리
    const faces = detections.map(d => processSingleFace(d));
    const selectedFace = selectBestFace(faces, input.imageData.width, input.imageData.height);

    // 5. 얼굴 크기 검증
    const faceArea = selectedFace.boundingBox.width * selectedFace.boundingBox.height;
    if (faceArea < 0.01) {  // 이미지의 1% 미만
      return createErrorOutput(CIE2ErrorCode.FACE_TOO_SMALL, startTime);
    }

    // 6. 각도 검증
    const angleValidation = validateAngle(selectedFace.angle, input.options?.angleThresholds);
    const frontalityResult = calculateFrontalityScore(selectedFace.angle);

    // 7. 얼굴 영역 추출
    const faceRegion = extractFaceRegion(
      selectedFace.boundingBox,
      input.imageData.width,
      input.imageData.height
    );

    // 8. 결과 반환
    return {
      success: true,
      faceDetected: true,
      faceCount: detections.length,
      selectedFace: {
        landmarks: selectedFace.landmarks,
        boundingBox: selectedFace.boundingBox,
        angle: selectedFace.angle,
        frontalityScore: frontalityResult.score,
      },
      faceRegion,
      validation: {
        isAngleValid: angleValidation.isValid,
        angleFeedback: angleValidation.feedback,
        frontalityResult,
      },
      metadata: {
        processingTime: performance.now() - startTime,
        modelVersion: MEDIAPIPE_VERSION,
        confidence: selectedFace.confidence,
      },
    };

  } catch (error) {
    console.error('[CIE-2] Processing failed:', error);
    return createErrorOutput(CIE2ErrorCode.MODEL_INFERENCE_FAILED, startTime);
  }
}
```

---

## 7. P3 원자 분해

| ID | 원자 | 소요시간 | 입력 | 출력 | 의존성 | 성공 기준 |
|----|------|----------|------|------|--------|----------|
| **CIE2-1** | MediaPipe Face Mesh 초기화 | 2h | Config | Detector | - | 모델 로드 성공, 2초 이내 |
| **CIE2-2** | 얼굴 감지 및 바운딩 박스 | 2h | ImageData | Detection[] | CIE2-1 | 0/1/다수 얼굴 정확히 감지 |
| **CIE2-3** | 468포인트 랜드마크 추출 | 3h | Detection | FaceLandmarks | CIE2-2 | 모든 핵심 영역 인덱스 유효 |
| **CIE2-4** | 얼굴 각도 계산 | 2h | FaceLandmarks | FaceAngle | CIE2-3 | Pitch/Yaw/Roll ±5° 정확도 |
| **CIE2-5** | 정면성 점수 및 검증 | 1.5h | FaceAngle | FrontalityResult | CIE2-4 | 70점 이상 분석 가능 판정 |
| **CIE2-6** | 다중 얼굴 선택 로직 | 1.5h | Detection[] | SelectedFace | CIE2-3, CIE2-4 | 최적 얼굴 선택 정확도 90% |
| **CIE2-7** | 얼굴 영역 추출 (마진 포함) | 1h | BoundingBox | FaceRegion | CIE2-2 | 20% 마진, 이미지 경계 준수 |
| **CIE2-8** | 통합 프로세서 및 에러 처리 | 2h | CIE2Input | CIE2Output | All | 모든 에러 코드 처리, 100ms 이내 |

**총 예상 시간**: 15시간

### 의존성 그래프

```
CIE2-1 (초기화)
    ↓
CIE2-2 (얼굴 감지)
    ↓
CIE2-3 (랜드마크 추출)
    ↓
┌───┴───┐
↓       ↓
CIE2-4  CIE2-7 (얼굴 영역)
(각도)
↓
CIE2-5 (정면성)
↓
CIE2-6 (다중 얼굴)
↓
CIE2-8 (통합)
```

---

## 8. 파일 구조

```
lib/image-engine/
├── index.ts                    # 통합 export
├── types.ts                    # 공통 타입
├── cie-2/
│   ├── index.ts                # CIE-2 모듈 export
│   ├── types.ts                # CIE-2 전용 타입
│   ├── face-detector.ts        # MediaPipe 초기화 및 감지 (CIE2-1, CIE2-2)
│   ├── landmark-extractor.ts   # 랜드마크 추출 및 매핑 (CIE2-3)
│   ├── angle-calculator.ts     # 얼굴 각도 계산 (CIE2-4)
│   ├── frontality-validator.ts # 정면성 검증 (CIE2-5)
│   ├── face-selector.ts        # 다중 얼굴 선택 (CIE2-6)
│   ├── region-extractor.ts     # 얼굴 영역 추출 (CIE2-7)
│   ├── processor.ts            # 통합 프로세서 (CIE2-8)
│   ├── constants.ts            # 임계값 상수
│   └── feedback.ts             # 사용자 피드백 메시지
└── utils/
    ├── vector-math.ts          # 벡터 연산 (normalize, cross)
    └── clamp.ts                # 경계값 처리
```

---

## 9. 테스트 케이스

### 9.1 단위 테스트

```typescript
describe('CIE-2 Face Detection', () => {
  describe('calculateFaceAngle', () => {
    it('should return near-zero angles for frontal face', () => {
      const frontalLandmarks = loadTestLandmarks('frontal-face.json');
      const angle = calculateFaceAngle(frontalLandmarks);

      expect(Math.abs(angle.pitch)).toBeLessThan(5);
      expect(Math.abs(angle.yaw)).toBeLessThan(5);
      expect(Math.abs(angle.roll)).toBeLessThan(5);
    });

    it('should detect positive pitch when looking up', () => {
      const lookingUpLandmarks = loadTestLandmarks('looking-up.json');
      const angle = calculateFaceAngle(lookingUpLandmarks);

      expect(angle.pitch).toBeGreaterThan(10);
    });

    it('should detect negative yaw when looking left', () => {
      const lookingLeftLandmarks = loadTestLandmarks('looking-left.json');
      const angle = calculateFaceAngle(lookingLeftLandmarks);

      expect(angle.yaw).toBeLessThan(-10);
    });
  });

  describe('calculateFrontalityScore', () => {
    it('should return 100 for perfect frontal pose', () => {
      const angle = { pitch: 0, yaw: 0, roll: 0 };
      const result = calculateFrontalityScore(angle);

      expect(result.score).toBe(100);
      expect(result.isAcceptable).toBe(true);
    });

    it('should return below 70 for extreme angles', () => {
      const angle = { pitch: 20, yaw: 25, roll: 30 };
      const result = calculateFrontalityScore(angle);

      expect(result.score).toBeLessThan(70);
      expect(result.isAcceptable).toBe(false);
    });

    it('should weight yaw highest', () => {
      const pitchOnly = { pitch: 15, yaw: 0, roll: 0 };
      const yawOnly = { pitch: 0, yaw: 15, roll: 0 };

      const pitchResult = calculateFrontalityScore(pitchOnly);
      const yawResult = calculateFrontalityScore(yawOnly);

      // Yaw는 50% 가중치, Pitch는 30% 가중치
      // 동일한 각도에서 Yaw가 더 큰 영향
      expect(pitchResult.score).toBeGreaterThan(yawResult.score);
    });
  });

  describe('selectBestFace', () => {
    it('should select the largest face when frontality is similar', () => {
      const faces = [
        createMockFace({ width: 0.3, height: 0.4, frontalityScore: 85 }),
        createMockFace({ width: 0.2, height: 0.25, frontalityScore: 85 }),
      ];

      const selected = selectBestFace(faces, 1920, 1080);
      expect(selected.boundingBox.width).toBe(0.3);
    });

    it('should prefer frontal face over larger tilted face', () => {
      const faces = [
        createMockFace({ width: 0.4, height: 0.5, frontalityScore: 50 }),
        createMockFace({ width: 0.3, height: 0.35, frontalityScore: 95 }),
      ];

      const selected = selectBestFace(faces, 1920, 1080);
      expect(selected.frontalityScore).toBe(95);
    });
  });

  describe('extractFaceRegion', () => {
    it('should add 20% margin around face', () => {
      const bbox = { x: 0.3, y: 0.2, width: 0.4, height: 0.5 };
      const region = extractFaceRegion(bbox, 1000, 1000);

      // 20% 마진 = 0.4 * 0.2 = 0.08 (양쪽 = 0.16 추가)
      expect(region.width).toBeGreaterThan(400);
      expect(region.height).toBeGreaterThan(500);
    });

    it('should clamp to image boundaries', () => {
      const bbox = { x: 0.9, y: 0.9, width: 0.2, height: 0.2 };
      const region = extractFaceRegion(bbox, 1000, 1000);

      expect(region.x + region.width).toBeLessThanOrEqual(1000);
      expect(region.y + region.height).toBeLessThanOrEqual(1000);
    });
  });
});
```

### 9.2 통합 테스트

```typescript
describe('CIE-2 Integration', () => {
  let detector: FaceDetector;

  beforeAll(async () => {
    detector = await initializeFaceDetector();
  });

  it('should process frontal face image successfully', async () => {
    const imageData = await loadTestImage('frontal-face.jpg');
    const result = await processFaceDetection({ imageData });

    expect(result.success).toBe(true);
    expect(result.faceDetected).toBe(true);
    expect(result.selectedFace?.frontalityScore).toBeGreaterThanOrEqual(70);
    expect(result.validation.isAngleValid).toBe(true);
  });

  it('should reject tilted face with appropriate feedback', async () => {
    const imageData = await loadTestImage('tilted-face-30deg.jpg');
    const result = await processFaceDetection({ imageData });

    expect(result.faceDetected).toBe(true);
    expect(result.validation.isAngleValid).toBe(false);
    expect(result.validation.angleFeedback?.type).toMatch(/YAW|ROLL/);
  });

  it('should handle no face in image', async () => {
    const imageData = await loadTestImage('landscape-no-face.jpg');
    const result = await processFaceDetection({ imageData });

    expect(result.faceDetected).toBe(false);
    expect(result.error?.code).toBe(CIE2ErrorCode.NO_FACE_DETECTED);
  });

  it('should select best face from multiple faces', async () => {
    const imageData = await loadTestImage('group-photo.jpg');
    const result = await processFaceDetection({
      imageData,
      options: { maxFaces: 5 }
    });

    expect(result.faceDetected).toBe(true);
    expect(result.faceCount).toBeGreaterThan(1);
    expect(result.selectedFace).toBeDefined();
  });

  it('should complete within 100ms for standard image', async () => {
    const imageData = await loadTestImage('standard-portrait.jpg');
    const result = await processFaceDetection({ imageData });

    expect(result.metadata.processingTime).toBeLessThan(100);
  });
});
```

---

## 10. 파이프라인 통합

### 10.1 CIE-2 위치

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Image Engine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CIE-1: 이미지 품질 검증                                     │
│    └── 해상도, 조명, 선명도                                  │
│                      ↓                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ CIE-2: 얼굴 감지 및 랜드마크 ◀━━━━ [이 문서]           │ │
│  │   ├── MediaPipe Face Mesh 초기화                       │ │
│  │   ├── 468포인트 랜드마크 추출                          │ │
│  │   ├── 얼굴 각도 검증 (Pitch/Yaw/Roll)                 │ │
│  │   ├── 정면성 점수 계산                                 │ │
│  │   ├── 다중 얼굴 선택                                   │ │
│  │   └── 얼굴 영역 추출 (20% 마진)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                      ↓                                       │
│  CIE-3: 조명 보정 알고리즘                                   │
│    └── Gray World, Von Kries, Skin-Aware AWB               │
│                      ↓                                       │
│  CIE-4: ROI(관심 영역) 추출                                  │
│    └── 피부존, 드레이프 영역, 홍채                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 CIE-2 → CIE-3 데이터 전달

```typescript
// CIE-2 출력을 CIE-3 입력으로 변환
function convertToAWBInput(cie2Output: CIE2Output): CIE3Input {
  if (!cie2Output.success || !cie2Output.selectedFace) {
    throw new Error('CIE-2 output is invalid');
  }

  return {
    imageData: cropToFaceRegion(
      originalImageData,
      cie2Output.faceRegion
    ),
    skinMask: generateSkinMask(
      cie2Output.selectedFace.landmarks,
      cie2Output.faceRegion
    ),
    faceLandmarks: cie2Output.selectedFace.landmarks,
  };
}
```

---

## 11. 신뢰도 전파

### 11.1 CIE-2 신뢰도 계산

```typescript
/**
 * CIE-2 모듈 신뢰도 계산
 *
 * 구성 요소:
 * 1. 감지 신뢰도 (MediaPipe 출력): 40%
 * 2. 정면성 점수: 40%
 * 3. 얼굴 크기 적정성: 20%
 */
function calculateCIE2Confidence(output: CIE2Output): number {
  if (!output.success || !output.selectedFace) return 0;

  // 1. 감지 신뢰도 (0-1)
  const detectionConfidence = output.metadata.confidence;

  // 2. 정면성 점수 (0-100 → 0-1)
  const frontalityConfidence = output.selectedFace.frontalityScore / 100;

  // 3. 얼굴 크기 적정성 (0-1)
  const faceArea = output.selectedFace.boundingBox.width *
                   output.selectedFace.boundingBox.height;
  // 이상적 범위: 10-50% → 1.0, 5-10% 또는 50-70% → 0.7, 기타 → 0.4
  const sizeConfidence = faceArea >= 0.1 && faceArea <= 0.5 ? 1.0 :
                         faceArea >= 0.05 || faceArea <= 0.7 ? 0.7 : 0.4;

  // 가중 평균
  return detectionConfidence * 0.4 +
         frontalityConfidence * 0.4 +
         sizeConfidence * 0.2;
}
```

### 11.2 파이프라인 신뢰도

```
최종 분석 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × 분석모듈

예시:
CIE-1 (품질): 0.95
CIE-2 (얼굴): 0.88  ← 이 문서
CIE-3 (AWB): 0.85
CIE-4 (ROI): 0.92
PC-1 (퍼스널컬러): 0.90

최종 = 0.95 × 0.88 × 0.85 × 0.92 × 0.90 = 0.59 (59%)
```

---

## 12. 구현 우선순위

### Phase 1 (MVP): 기본 얼굴 감지

```
1. CIE2-1: MediaPipe Face Mesh 초기화
2. CIE2-2: 얼굴 감지 및 바운딩 박스
3. CIE2-3: 468포인트 랜드마크 추출
4. CIE2-8: 통합 프로세서 (기본)
```

### Phase 2: 각도 검증

```
5. CIE2-4: 얼굴 각도 계산
6. CIE2-5: 정면성 점수 및 검증
7. 피드백 메시지 구현
```

### Phase 3: 고급 기능

```
8. CIE2-6: 다중 얼굴 선택 로직
9. CIE2-7: 얼굴 영역 추출 (마진 포함)
10. CIE2-8: 통합 프로세서 (완성)
```

---

## 13. 리스크 및 완화

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| MediaPipe 번들 크기 (5MB) | 확정 | 중간 | CDN 분리, lazy loading |
| iOS Safari WebGL 제한 | 중간 | 높음 | iOS 16.4+ 권장, fallback 전략 |
| 저사양 기기 성능 | 중간 | 중간 | FPS 조절 (15fps), 다운샘플링 |
| 모델 초기 로드 시간 (2-3초) | 확정 | 낮음 | 로딩 UI, 사전 로드 |
| 역광/저조도 감지 실패 | 낮음 | 중간 | CIE-1과 연계, 재촬영 유도 |
| 마스크/선글라스 착용 | 중간 | 높음 | 감지 신뢰도 검사, 경고 메시지 |

---

## 14. 관련 문서

### 원리 문서

- [원리: 이미지 처리](../principles/image-processing.md) - 얼굴 각도 계산 수학, 좌표계
- [원리: 색채학](../principles/color-science.md) - 퍼스널 컬러 영역 정의

### ADR

- [ADR-033: 얼굴 감지 라이브러리 선택](../adr/ADR-033-face-detection-library.md) - MediaPipe 선택 근거
- [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md) - 전체 파이프라인 설계

### 관련 SDD

- [SDD-CIE-1: 이미지 품질 검증](./SDD-CIE-1-IMAGE-QUALITY.md) - 선행 모듈
- [SDD-CIE-3: AWB 보정](./SDD-CIE-3-AWB-CORRECTION.md) - 후속 모듈

### 규칙

- [Mobile Patterns](../../.claude/rules/mobile-patterns.md) - React Native 패턴
- [Testing Patterns](../../.claude/rules/testing-patterns.md) - 테스트 작성 규칙

---

**Author**: Claude Code
**Reviewed by**: -
