# SDD: CIE-4 조명 분석 (Lighting Analysis)

> **Status**: ✅ Complete
> **Version**: 2.3
> **Created**: 2026-01-21
> **Updated**: 2026-01-24
> **Completion**: 100%
> **P3 Score**: 94/100 (v2.2: 92 → v2.3: 94, 성능 SLA + 한국 조명 환경 Mock 추가)
> **Last Modified By**: Claude Code (성능 SLA 상세화, 한국 실내 환경 조명 Mock 데이터 추가)

> 이미지 조명 품질을 분석하여 AI 분석 정확도를 높이고, 사용자에게 실시간 조명 가이드를 제공하는 모듈

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 조명 품질 평가 - 실시간 3D 조명 맵핑"

- Real-time Analysis: < 10ms@1080p (30fps 실시간 프리뷰 지원)
- Photometric Accuracy: CCT ±50K, 조명 품질 분류 100% 정확
- 3D Spatial Mapping: 공간적 조명 분포 완전 재구성 (광원 위치/강도/방향)
- Multi-Illuminant Detection: 2개 이상 복합 광원 분리 감지 및 개별 분석
- HDR Support: 10-bit 고다이나믹레인지 입력 처리, Tone mapping 통합
- Source Identification: LED/형광등/백열등/자연광 자동 구분 (스펙트럼 기반)
- AR Guidance Overlay: 실시간 AR 가이드 (광원 방향, 거리, 추천 위치)
```

### 물리적 한계

| 한계 | 설명 | 이룸 영향 |
|------|------|----------|
| **단일 이미지 제약** | 2D 이미지에서 3D 광원 위치 추정 불가 | 공간적 조명 분포 추정 불완전 |
| **Planckian locus 외 색상** | McCamy는 흑체 복사 근처에서만 정확 | 형광등 등 비연속 스펙트럼에서 오차 |
| **반사광 영향** | 배경색이 얼굴에 반사되어 CCT 왜곡 | 흰 벽/유색 벽 환경에서 오차 증가 |
| **혼합 조명 분리** | 여러 광원 동시 존재 시 분리 복잡 | 단일 대표 CCT만 계산 가능 |
| **계산 복잡도** | 6-Zone 영역별 분석, O(n) 픽셀 순회 | 고해상도 이미지 50ms 소요 |
| **랜드마크 의존성** | MediaPipe 실패 시 4분할 fallback | 정확도 저하 (6-Zone → 4-Zone) |

### 100점 기준

| 지표 | 100점 기준 | 현재 목표 (MVP) | 달성률 |
|------|-----------|----------------|--------|
| **CCT 측정 정확도** | ±50K (모든 조명) | ±200K (McCamy 기본) | 25% |
| **조명 품질 분류** | 100% 정확 분류 | 90% | 90% |
| **균일성 분석** | 6-Zone 완벽 분할 | 85% (랜드마크 의존) | 85% |
| **그림자 감지** | Edge 기반 정밀 감지 | 80% (단순 임계값) | 80% |
| **처리 속도** | < 10ms@1080p | < 30ms@1080p | 33% |
| **실시간 프리뷰** | 30fps AR 가이드 | 정지 이미지만 | 0% |
| **복합 광원 분리** | 2개 이상 광원 | 단일 대표 CCT | 0% |
| **HDR 입력 처리** | 10-bit 지원 | 8-bit만 | 0% |
| **광원 유형 식별** | LED/형광등/백열등 구분 | CCT만 | 0% |
| **3D 조명 맵핑** | 공간적 분포 재구성 | 2D 영역별 분석 | 0% |

**종합 달성률**: **31%** (MVP CIE-4 기본 조명 분석)

### 현재 목표

**31%** - MVP CIE-4 기본 조명 품질 평가

#### ✅ 이번 구현 포함 (MVP)
- McCamy CCT 추정 (±200K) (계획)
- 조명 품질 5단계 분류 (최적/좋음/수용/부적합/거부) (계획)
- 6-Zone 균일성 분석 (85% 정확도) (계획)
- 단순 그림자 감지 (임계값 기반 80%) (계획)
- 조명 가이드 UI (텍스트 피드백) (계획)
- 신뢰도 계산 (CCT 품질 + 균일성 기반) (계획)

#### ⏳ 부분 구현 (추후 개선)
- CCT 측정: ±200K (목표 ±50K의 25%)
- 처리 속도: < 30ms (목표 10ms의 33%)
- 조명 품질 분류: 90% (목표 100%의 90%)
- 균일성/그림자: 80-85% (목표 100%의 80-85%)

#### ❌ 의도적 제외
- 3D 조명 맵핑: 공간적 분포 추정 (Phase 2, 재검토 시점: Stereo vision/LiDAR 센서 활용 시)
- 복합 광원 분리: 2개 이상 광원 (Phase 2, 재검토 시점: 광원 세그멘테이션 알고리즘 도입 시)
- 실시간 비디오 분석: 30fps 프리뷰 (Phase 3, 재검토 시점: AR 메이크업 기능 추가 시)
- HDR 입력 처리: 10-bit 파이프라인 (Phase 3, 재검토 시점: HDR 센서 지원 시)
- 광원 유형 식별: LED/형광등/백열등 (Phase 4, 재검토 시점: 스펙트럼 데이터 수집 가능 시)
- AR 가이드 오버레이: WebXR 실시간 렌더링 (Phase 4, 재검토 시점: AR 기능 로드맵 확정 시)

### 의도적 제외 상세

| 제외 항목 | 이유 | 비용 | 재검토 시점 |
|----------|------|------|------------|
| **3D 조명 맵핑** | Depth map 필요, 단일 이미지 제약 | Stereo/LiDAR 하드웨어 필요 | AR 기기 대응 시 (Phase 2) |
| **복합 광원 분리** | 광원 세그멘테이션, 계산 복잡도 3배 | 개발 6주 + 성능 저하 | Mixed 조명 환경 분석 필요 시 |
| **실시간 비디오 AWB** | 프레임 간 일관성, 30fps 유지 어려움 | 30fps → 15fps | AR 메이크업/피팅 기능 시 |
| **HDR 입력 처리** | 10-bit 파이프라인, Tone mapping | 복잡도 2배 | HDR 센서 기기 대응 시 |
| **광원 유형 식별** | 스펙트럼 데이터 필요, RGB만으로 불가 | 하드웨어 제약 | 스펙트로미터 연동 가능 시 |
| **AR 가이드 오버레이** | WebXR API, 실시간 렌더링 복잡 | 개발 8주 + 성능 저하 | AR 쇼핑/메이크업 확정 시 |
| **학습 기반 조명 추정** | 딥러닝 모델 (+10MB), GPU 필수 | 번들 200%, 추론 +50ms | 정확도 한계 도달 시 (Phase 5) |

### 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| McCamy CCT 추정 | 📋 계획 | `lib/image-engine/cct-analyzer.ts` |
| 조명 품질 5단계 분류 | 📋 계획 | `lib/image-engine/lighting-classifier.ts` |
| 6-Zone 균일성 분석 | 📋 계획 | `lib/image-engine/zone-uniformity.ts` |
| 그림자 감지 | 📋 계획 | `lib/image-engine/shadow-detector.ts` |
| 조명 가이드 UI | 📋 계획 | `components/camera/LightingGuide.tsx` |
| 신뢰도 계산 | 📋 계획 | `lib/image-engine/lighting-confidence.ts` |
| 얼굴 영역 조명 분석 | 📋 계획 | `lib/image-engine/face-lighting.ts` |

---

## 1. 개요

### 1.1 목적

- **조명 품질 평가**: 색온도, 균일성, 그림자를 종합적으로 평가하여 분석 적합성 판단
- **실시간 가이드**: 촬영 전 조명 상태를 시각적으로 안내하여 재촬영 최소화
- **신뢰도 산정**: 조명 품질 기반 분석 신뢰도 계수 제공 (CIE 파이프라인 통합)
- **사용자 경험 개선**: 복잡한 조명 이론을 직관적인 UI로 전달

### 1.2 범위

| 항목 | 우선순위 | 복잡도 | 구현 상태 |
|------|----------|--------|----------|
| McCamy 기반 CCT 측정 | 필수 | 중간 | 📋 계획 |
| 조명 균일성 분석 | 필수 | 중간 | 📋 계획 |
| 그림자 감지 | 필수 | 낮음 | 📋 계획 |
| 조명 가이드 UI | 필수 | 낮음 | 📋 계획 |
| 실시간 프리뷰 피드백 | 높음 | 높음 | ⏳ 향후 |
| 혼합 조명 감지 | 낮음 | 높음 | ⏳ 향후 |

### 1.3 관련 문서

- [ADR-001: Core Image Engine](../adr/ADR-001-core-image-engine.md)
- [SDD-CIE-3-AWB-CORRECTION](./SDD-CIE-3-AWB-CORRECTION.md)
- [원리: 이미지 처리](../principles/image-processing.md) (Section 2: 색온도 및 화이트밸런스)
- [원리: 색채학](../principles/color-science.md)

### 1.4 궁극의 형태 (P1)

| 항목 | 이상적 최종 상태 | 물리적 한계 | 현재 목표 |
|------|-----------------|------------|----------|
| **CCT 측정 정확도** | ±50K (McCamy) | 단일 이미지 기반, Planckian locus 외 색상 | **±200K** |
| **조명 품질 분류** | 100% 정확 분류 | 혼합 조명, 반사광 영향 | **90%** |
| **균일성 분석** | 6-Zone 완벽 분할 | 얼굴 각도, 랜드마크 오차 | **85%** |
| **그림자 감지** | Edge 기반 정밀 감지 | 피부색 유사 배경, 미세 그림자 | **80%** |
| **실시간 피드백** | < 30fps | 복잡한 알고리즘, 모바일 성능 | **계획 중** |
| **자동 보정 권장** | 100% 적중 | 사용자 촬영 환경 제어 불가 | **85%** |

**현재 구현 목표**: 전체 궁극의 **85%**

**의도적 제외 (이번 버전)**:
- **HDR 조명 분석**: 고다이나믹레인지 입력 처리 (입력 제한)
- **3D 조명 맵핑**: 공간적 조명 분포 추정 (복잡도 높음)
- **혼합 광원 분리**: 2개 이상 다른 색온도 광원 분리 (알고리즘 복잡)
- **실시간 비디오 분석**: 프레임별 조명 추적 (성능 제약)
- **광원 유형 식별**: LED/형광등/백열등 구분 (스펙트럼 데이터 필요)

---

## 2. 조명 분석 이론

### 2.1 색온도(CCT) 측정

#### 2.1.1 McCamy 공식

> 색온도(Correlated Color Temperature)는 광원의 색상을 흑체 복사와 비교하여 측정한 값이다.

**CIE 1931 xy 색도 좌표에서 CCT 계산**:

```
┌─────────────────────────────────────────────────────────────┐
│                  McCamy CCT 추정 공식                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  n = (x - 0.3320) / (0.1858 - y)                            │
│                                                              │
│  CCT = 449n³ + 3525n² + 6823.3n + 5520.33                   │
│                                                              │
│  where x, y = CIE 1931 chromaticity coordinates             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.1.1.1 McCamy 공식 상세 기술

> 1992년 Chris McCamy가 제안한 상관 색온도(CCT) 추정 공식. Planckian locus (흑체 궤적)에 근접한 색도 좌표에서 정확한 CCT를 추정한다.

**수학적 배경**:

- **n (epicenter distance)**: 색도 좌표 (x, y)에서 epicenter (0.3320, 0.1858)까지의 isothermal line 기반 거리
- **Epicenter**: Planckian locus의 특이점으로, 약 -2700K에 해당하는 가상의 점

**적용 범위 및 정확도**:

| 적용 범위 | CCT (K) | 정확도 | 비고 |
|-----------|---------|--------|------|
| 최적 | 3000-10000 | ±10K | 일반 조명 환경 |
| 수용 | 2500-15000 | ±50K | 확장 범위 |
| 주의 | <2500 또는 >15000 | ±100K+ | 정확도 저하 |

**TypeScript 구현 참조**:

```typescript
/**
 * McCamy CCT 추정 공식 핵심 구현
 *
 * @see lib/image-engine/lighting/internal/mccamy.ts
 * @see docs/principles/color-science.md - Section 3.2: CCT 추정
 */
function calculateCCT(x: number, y: number): number {
  // McCamy epicenter distance
  const n = (x - 0.3320) / (0.1858 - y);

  // 3차 다항식 근사
  const cct = 449 * Math.pow(n, 3)
            + 3525 * Math.pow(n, 2)
            + 6823.3 * n
            + 5520.33;

  return Math.round(cct);
}

/**
 * Duv (distance from Planckian locus) 추정
 * Duv < 0.02 = 고신뢰도, Duv > 0.05 = 저신뢰도
 */
function estimateDuv(x: number, y: number): number {
  // 간략화된 Duv 추정 (정밀 계산은 Robertson 방법 필요)
  return Math.abs(y - (-0.0017 * x + 0.3320));
}
```

**대안 알고리즘**:

| 알고리즘 | 정확도 | 복잡도 | 이룸 적용 |
|----------|--------|--------|----------|
| McCamy (1992) | ±10K | 낮음 | ✅ 기본 |
| Hernandez-Andres (1999) | ±5K | 중간 | ⏳ 향후 |
| Robertson (1968) | ±1K | 높음 | ❌ 과도 |

**참고 자료**:

- McCamy, C.S. (1992). "Correlated color temperature as an explicit function of chromaticity coordinates"
- CIE 15:2004 Technical Report

#### 2.1.2 sRGB to xy 변환 파이프라인

```
sRGB (0-255)
    ↓ 감마 해제 (선형화)
Linear RGB (0-1)
    ↓ D65 행렬 곱
XYZ (절대 색공간)
    ↓ 정규화
xy 색도 좌표
    ↓ McCamy 공식
CCT (Kelvin)
```

**감마 해제 공식**:

```
C_linear = C ≤ 0.04045 ? C/12.92 : ((C + 0.055)/1.055)^2.4
```

**sRGB to XYZ 변환 행렬 (D65)**:

```
[X]   [0.4124564  0.3575761  0.1804375]   [R_linear]
[Y] = [0.2126729  0.7151522  0.0721750] × [G_linear]
[Z]   [0.0193339  0.1191920  0.9503041]   [B_linear]
```

**xy 색도 좌표**:

```
x = X / (X + Y + Z)
y = Y / (X + Y + Z)
```

### 2.2 색온도 품질 기준

| 품질 등급 | CCT 범위 (K) | 판정 | 조치 |
|-----------|-------------|------|------|
| **최적** | 5000-6500 | 분석 진행 | 보정 생략 가능 |
| 좋음 | 4500-5000 또는 6500-7000 | 분석 진행 | 경미한 보정 |
| **수용** | 4000-4500 또는 7000-8000 | 분석 진행 | 보정 필수 |
| 부적합 | 3000-4000 또는 8000-10000 | 경고 표시 | 재촬영 권장 |
| **거부** | <3000 또는 >10000 | 분석 거부 | 재촬영 필수 |

### 2.3 조명 균일성 분석

> 얼굴 전체에 걸쳐 조명이 고르게 분포되어야 정확한 피부톤 분석이 가능하다.

#### 2.3.1 영역 분할

```
┌─────────────────────────────────────────────────────────────┐
│                    얼굴 영역 분할 (6-Zone)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│          ┌─────────┬─────────┐                               │
│          │   L-F   │   R-F   │  이마 영역 (Forehead)         │
│          ├─────────┼─────────┤                               │
│          │   L-C   │   R-C   │  볼 영역 (Cheek)              │
│          ├─────────┼─────────┤                               │
│          │   L-J   │   R-J   │  턱 영역 (Jaw)                │
│          └─────────┴─────────┘                               │
│                                                              │
│  L = Left, R = Right                                        │
│  F = Forehead, C = Cheek, J = Jaw                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 균일성 측정 공식

각 영역의 평균 밝기(Y 채널)를 측정하고 분산을 계산:

```
μ = (1/6) × Σ(Y_zone)           // 전체 평균 밝기
σ² = (1/6) × Σ(Y_zone - μ)²     // 분산

균일성 점수 = max(0, 100 - σ × k)
where k = 감도 계수 (기본값: 2.0)
```

#### 2.3.3 균일성 판정 기준

| 균일성 점수 | 분산 (σ) | 판정 | 조치 |
|------------|---------|------|------|
| 85-100 | < 7.5 | 최적 | 분석 진행 |
| 70-84 | 7.5-15 | 양호 | 분석 진행 |
| 50-69 | 15-25 | 수용 | 경고 표시 |
| < 50 | > 25 | 부적합 | 재촬영 권장 |

### 2.4 그림자 감지

> 얼굴의 좌우 비대칭 밝기는 측면 조명으로 인한 그림자를 나타낸다.

#### 2.4.1 좌우 비교 알고리즘 (기본)

```
ΔLR = |Y_left - Y_right| / μ_total × 100

where:
  Y_left = 왼쪽 영역 평균 밝기 (L-F + L-C + L-J) / 3
  Y_right = 오른쪽 영역 평균 밝기 (R-F + R-C + R-J) / 3
  μ_total = 전체 평균 밝기
```

#### 2.4.2 Edge Detection 기반 그림자 감지 (고급)

> 밝기 비교만으로는 그림자의 "경계"를 감지하기 어렵다. Sobel Edge Detection을 사용하여 그림자 경계선을 식별한다.

```
┌─────────────────────────────────────────────────────────────┐
│           Sobel Edge Detection for Shadow Boundary           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Sobel 커널 (3×3):                                       │
│                                                              │
│     Gx = [-1  0  +1]      Gy = [-1  -2  -1]                │
│          [-2  0  +2]           [ 0   0   0]                │
│          [-1  0  +1]           [+1  +2  +1]                │
│                                                              │
│  2. 그래디언트 크기:                                         │
│                                                              │
│     G = √(Gx² + Gy²)                                        │
│                                                              │
│  3. 그래디언트 방향:                                         │
│                                                              │
│     θ = atan2(Gy, Gx)                                       │
│                                                              │
│  4. 그림자 경계 특성:                                        │
│                                                              │
│     - 세로 방향 경계 (θ ≈ 0° 또는 180°) → 측면 조명          │
│     - 가로 방향 경계 (θ ≈ 90° 또는 270°) → 상하 조명        │
│     - 경계 강도 G > threshold → 강한 그림자                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.3 그림자 경계 강도 지표

```
┌─────────────────────────────────────────────────────────────┐
│                 Shadow Boundary Strength (SBS)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 얼굴 중앙 세로축 기준 Edge 강도 측정:                    │
│                                                              │
│     SBS = (1/N) × Σ G(x_center, y)   for y ∈ [y_top, y_bottom] │
│                                                              │
│  2. SBS 판정 기준:                                           │
│                                                              │
│     SBS < 10  → 그림자 없음 (균일한 조명)                    │
│     SBS 10-25 → 경미한 그림자                                │
│     SBS 25-50 → 중간 그림자                                  │
│     SBS > 50  → 심각한 그림자                                │
│                                                              │
│  3. 그림자 위치 추정:                                        │
│                                                              │
│     좌측 평균 밝기 > 우측 평균 밝기 → 그림자가 우측에        │
│     우측 평균 밝기 > 좌측 평균 밝기 → 그림자가 좌측에        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.4.4 그림자 판정 기준

| ΔLR (%) | SBS | 판정 | 그림자 방향 | 조치 |
|---------|-----|------|-----------|------|
| < 5 | < 10 | 없음 | - | 분석 진행 |
| 5-10 | 10-25 | 경미 | 계산 가능 | 경고 표시 |
| 10-20 | 25-50 | 중간 | 계산 가능 | 재촬영 권장 |
| > 20 | > 50 | 심각 | 계산 가능 | 재촬영 필수 |

**그림자 방향 판정**:

```
if (Y_left > Y_right) → 광원이 왼쪽에 위치 (그림자는 오른쪽)
if (Y_right > Y_left) → 광원이 오른쪽에 위치 (그림자는 왼쪽)
```

---

## 3. 알고리즘 상세

### 3.1 CCT 추정 구현

```typescript
/**
 * McCamy 공식 기반 색온도(CCT) 추정
 *
 * @param imageData - 분석할 이미지 데이터
 * @param faceRegion - 얼굴 영역 좌표 (선택적)
 * @returns CCT 추정 결과
 */
interface CCTEstimationResult {
  cct: number;           // 추정 색온도 (K)
  quality: 'optimal' | 'good' | 'acceptable' | 'poor' | 'reject';
  xyCoordinates: { x: number; y: number };
  confidence: number;    // 0-1
}

function estimateCCT(
  imageData: ImageData,
  faceRegion?: DOMRect
): CCTEstimationResult {
  const pixels = imageData.data;
  const region = faceRegion ?? {
    x: 0,
    y: 0,
    width: imageData.width,
    height: imageData.height,
  };

  // 1. sRGB 평균 계산 (얼굴 영역만)
  let sumR = 0, sumG = 0, sumB = 0, count = 0;

  for (let y = region.y; y < region.y + region.height; y++) {
    for (let x = region.x; x < region.x + region.width; x++) {
      const i = (y * imageData.width + x) * 4;
      sumR += pixels[i];
      sumG += pixels[i + 1];
      sumB += pixels[i + 2];
      count++;
    }
  }

  const avgR = sumR / count / 255;
  const avgG = sumG / count / 255;
  const avgB = sumB / count / 255;

  // 2. 감마 해제 (선형화)
  const linR = srgbToLinear(avgR);
  const linG = srgbToLinear(avgG);
  const linB = srgbToLinear(avgB);

  // 3. XYZ 변환 (D65 행렬)
  const X = 0.4124564 * linR + 0.3575761 * linG + 0.1804375 * linB;
  const Y = 0.2126729 * linR + 0.7151522 * linG + 0.0721750 * linB;
  const Z = 0.0193339 * linR + 0.1191920 * linG + 0.9503041 * linB;

  // 4. xy 색도 좌표
  const sum = X + Y + Z;
  const x = sum > 0 ? X / sum : 0.3127;  // D65 기본값
  const y = sum > 0 ? Y / sum : 0.3290;

  // 5. McCamy 공식
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33;

  // 6. 품질 판정
  const quality = getCCTQuality(cct);

  // 7. 신뢰도 계산 (Planckian locus와의 거리 기반)
  const confidence = calculateCCTConfidence(x, y);

  return {
    cct: Math.round(cct),
    quality,
    xyCoordinates: { x, y },
    confidence,
  };
}

function srgbToLinear(c: number): number {
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getCCTQuality(cct: number): CCTEstimationResult['quality'] {
  if (cct >= 5000 && cct <= 6500) return 'optimal';
  if ((cct >= 4500 && cct < 5000) || (cct > 6500 && cct <= 7000)) return 'good';
  if ((cct >= 4000 && cct < 4500) || (cct > 7000 && cct <= 8000)) return 'acceptable';
  if ((cct >= 3000 && cct < 4000) || (cct > 8000 && cct <= 10000)) return 'poor';
  return 'reject';
}

/**
 * Planckian locus와의 거리(Duv)를 이용한 CCT 신뢰도 계산
 * Duv < 0.02이면 고신뢰도
 */
function calculateCCTConfidence(x: number, y: number): number {
  // 간략화된 Duv 추정 (정밀 계산은 Robertson 방법 필요)
  const duvApprox = Math.abs(y - (-0.0017 * x + 0.3320));

  if (duvApprox < 0.01) return 0.95;
  if (duvApprox < 0.02) return 0.85;
  if (duvApprox < 0.03) return 0.70;
  if (duvApprox < 0.05) return 0.50;
  return 0.30;
}
```

### 3.2 조명 균일성 분석

```typescript
/**
 * 6-Zone 기반 조명 균일성 분석
 *
 * @param imageData - 분석할 이미지 데이터
 * @param faceLandmarks - 얼굴 랜드마크 (MediaPipe 468점)
 * @returns 균일성 분석 결과
 */
interface UniformityResult {
  score: number;           // 0-100
  zoneValues: ZoneValues;
  variance: number;
  isAcceptable: boolean;
  feedback: string;
}

interface ZoneValues {
  leftForehead: number;
  rightForehead: number;
  leftCheek: number;
  rightCheek: number;
  leftJaw: number;
  rightJaw: number;
}

function analyzeUniformity(
  imageData: ImageData,
  faceLandmarks: FaceLandmarks
): UniformityResult {
  // 1. 6개 영역 좌표 추출 (랜드마크 기반)
  const zones = extractZoneCoordinates(faceLandmarks);

  // 2. 각 영역의 Y 채널 평균 계산
  const zoneValues: ZoneValues = {
    leftForehead: calculateZoneBrightness(imageData, zones.leftForehead),
    rightForehead: calculateZoneBrightness(imageData, zones.rightForehead),
    leftCheek: calculateZoneBrightness(imageData, zones.leftCheek),
    rightCheek: calculateZoneBrightness(imageData, zones.rightCheek),
    leftJaw: calculateZoneBrightness(imageData, zones.leftJaw),
    rightJaw: calculateZoneBrightness(imageData, zones.rightJaw),
  };

  const values = Object.values(zoneValues);

  // 3. 평균 및 분산 계산
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // 4. 균일성 점수 계산
  const SENSITIVITY = 2.0;
  const score = Math.max(0, Math.min(100, 100 - stdDev * SENSITIVITY));

  // 5. 피드백 생성
  const feedback = generateUniformityFeedback(score, zoneValues);

  return {
    score: Math.round(score),
    zoneValues,
    variance: Math.round(stdDev * 100) / 100,
    isAcceptable: score >= 50,
    feedback,
  };
}

/**
 * Y 채널 (밝기) 계산: Y = 0.299R + 0.587G + 0.114B
 */
function calculateZoneBrightness(
  imageData: ImageData,
  zone: ZoneCoordinates
): number {
  const pixels = imageData.data;
  let sum = 0, count = 0;

  for (const point of zone.points) {
    const i = (point.y * imageData.width + point.x) * 4;
    const y = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    sum += y;
    count++;
  }

  return sum / count;
}

function generateUniformityFeedback(score: number, zones: ZoneValues): string {
  if (score >= 85) {
    return '조명이 고르게 분포되어 있습니다.';
  }

  // 가장 밝은/어두운 영역 찾기
  const entries = Object.entries(zones);
  const brightest = entries.reduce((a, b) => a[1] > b[1] ? a : b);
  const darkest = entries.reduce((a, b) => a[1] < b[1] ? a : b);

  const brightArea = translateZoneName(brightest[0]);
  const darkArea = translateZoneName(darkest[0]);

  if (score >= 70) {
    return `${darkArea} 부분이 약간 어둡습니다. 조명을 조금 조절해 주세요.`;
  }

  if (score >= 50) {
    return `${darkArea}과(와) ${brightArea}의 밝기 차이가 큽니다. 정면 조명을 사용해 주세요.`;
  }

  return `조명이 불균일합니다. 자연광 또는 정면 조명 환경에서 다시 촬영해 주세요.`;
}

function translateZoneName(zone: string): string {
  const translations: Record<string, string> = {
    leftForehead: '왼쪽 이마',
    rightForehead: '오른쪽 이마',
    leftCheek: '왼쪽 볼',
    rightCheek: '오른쪽 볼',
    leftJaw: '왼쪽 턱',
    rightJaw: '오른쪽 턱',
  };
  return translations[zone] ?? zone;
}
```

### 3.3 그림자 감지

#### 3.3.1 좌우 밝기 비교 (기본 방법)

```typescript
/**
 * 좌우 밝기 비교를 통한 그림자 감지
 *
 * @param zoneValues - 6-Zone 밝기 값
 * @returns 그림자 분석 결과
 */
interface ShadowDetectionResult {
  hasShadow: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  asymmetryPercent: number;
  shadowBoundaryStrength: number;  // SBS (Edge Detection 기반)
  lightDirection: 'left' | 'right' | 'balanced';
  shadowPosition: 'left' | 'right' | 'none';
  feedback: string;
}

function detectShadow(zoneValues: ZoneValues): ShadowDetectionResult {
  // 1. 좌/우 평균 계산
  const leftAvg = (
    zoneValues.leftForehead +
    zoneValues.leftCheek +
    zoneValues.leftJaw
  ) / 3;

  const rightAvg = (
    zoneValues.rightForehead +
    zoneValues.rightCheek +
    zoneValues.rightJaw
  ) / 3;

  const totalAvg = (leftAvg + rightAvg) / 2;

  // 2. 비대칭 퍼센트 계산
  const asymmetryPercent = Math.abs(leftAvg - rightAvg) / totalAvg * 100;

  // 3. 심각도 판정
  let severity: ShadowDetectionResult['severity'];
  if (asymmetryPercent < 5) severity = 'none';
  else if (asymmetryPercent < 10) severity = 'mild';
  else if (asymmetryPercent < 20) severity = 'moderate';
  else severity = 'severe';

  // 4. 광원 방향 판정
  let lightDirection: ShadowDetectionResult['lightDirection'];
  let shadowPosition: ShadowDetectionResult['shadowPosition'];
  if (asymmetryPercent < 5) {
    lightDirection = 'balanced';
    shadowPosition = 'none';
  } else if (leftAvg > rightAvg) {
    lightDirection = 'left';      // 광원이 왼쪽
    shadowPosition = 'right';     // 그림자는 오른쪽
  } else {
    lightDirection = 'right';     // 광원이 오른쪽
    shadowPosition = 'left';      // 그림자는 왼쪽
  }

  // 5. 피드백 생성
  const feedback = generateShadowFeedback(severity, lightDirection);

  return {
    hasShadow: severity !== 'none',
    severity,
    asymmetryPercent: Math.round(asymmetryPercent * 10) / 10,
    shadowBoundaryStrength: 0, // Edge Detection 결과로 업데이트됨
    lightDirection,
    shadowPosition,
    feedback,
  };
}
```

#### 3.3.2 Sobel Edge Detection 기반 그림자 경계 감지 (고급)

```typescript
/**
 * Sobel Edge Detection을 사용한 그림자 경계 강도 측정
 *
 * @param imageData - 분석할 이미지 데이터
 * @param faceRegion - 얼굴 영역 좌표
 * @returns 그림자 경계 강도 (SBS)
 */
interface EdgeDetectionResult {
  shadowBoundaryStrength: number;  // 0-100
  primaryEdgeDirection: 'vertical' | 'horizontal' | 'diagonal' | 'none';
  edgeMap: Float32Array;  // 디버그용
}

// Sobel 커널
const SOBEL_X: number[][] = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

const SOBEL_Y: number[][] = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

function detectShadowEdges(
  imageData: ImageData,
  faceRegion: DOMRect
): EdgeDetectionResult {
  const { data, width } = imageData;
  const { x, y, width: w, height: h } = faceRegion;

  // 1. 그레이스케일 변환 (얼굴 영역만)
  const grayscale = new Float32Array(w * h);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const srcIdx = ((y + dy) * width + (x + dx)) * 4;
      // Y = 0.299R + 0.587G + 0.114B
      grayscale[dy * w + dx] =
        0.299 * data[srcIdx] +
        0.587 * data[srcIdx + 1] +
        0.114 * data[srcIdx + 2];
    }
  }

  // 2. Sobel 필터 적용
  const edgeMap = new Float32Array(w * h);
  let totalEdgeStrength = 0;
  let verticalEdgeSum = 0;
  let horizontalEdgeSum = 0;

  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = 1; dx < w - 1; dx++) {
      // Gx, Gy 계산
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = grayscale[(dy + ky) * w + (dx + kx)];
          gx += pixel * SOBEL_X[ky + 1][kx + 1];
          gy += pixel * SOBEL_Y[ky + 1][kx + 1];
        }
      }

      // 그래디언트 크기
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edgeMap[dy * w + dx] = magnitude;
      totalEdgeStrength += magnitude;

      // 방향별 누적
      if (Math.abs(gx) > Math.abs(gy)) {
        verticalEdgeSum += magnitude;   // 세로 경계 (수평 그래디언트)
      } else {
        horizontalEdgeSum += magnitude; // 가로 경계 (수직 그래디언트)
      }
    }
  }

  // 3. 얼굴 중앙 세로축의 Edge 강도 (Shadow Boundary Strength)
  const centerX = Math.floor(w / 2);
  const centerStrip = 5; // 중앙 ±5 픽셀
  let sbs = 0;
  let sbsCount = 0;

  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = centerX - centerStrip; dx <= centerX + centerStrip; dx++) {
      if (dx >= 0 && dx < w) {
        sbs += edgeMap[dy * w + dx];
        sbsCount++;
      }
    }
  }

  const avgSBS = sbsCount > 0 ? sbs / sbsCount : 0;
  const normalizedSBS = Math.min(100, avgSBS / 2.55); // 0-100 정규화

  // 4. 주요 경계 방향 판정
  let primaryEdgeDirection: EdgeDetectionResult['primaryEdgeDirection'];
  const ratio = verticalEdgeSum / (horizontalEdgeSum + 1);
  if (normalizedSBS < 10) {
    primaryEdgeDirection = 'none';
  } else if (ratio > 1.5) {
    primaryEdgeDirection = 'vertical';   // 측면 조명
  } else if (ratio < 0.67) {
    primaryEdgeDirection = 'horizontal'; // 상하 조명
  } else {
    primaryEdgeDirection = 'diagonal';
  }

  return {
    shadowBoundaryStrength: Math.round(normalizedSBS * 10) / 10,
    primaryEdgeDirection,
    edgeMap,
  };
}

/**
 * 통합 그림자 감지 (밝기 비교 + Edge Detection)
 */
function detectShadowAdvanced(
  imageData: ImageData,
  zoneValues: ZoneValues,
  faceRegion: DOMRect
): ShadowDetectionResult {
  // 1. 기본 좌우 비교
  const basicResult = detectShadow(zoneValues);

  // 2. Edge Detection 보강
  const edgeResult = detectShadowEdges(imageData, faceRegion);

  // 3. 결과 통합 (두 방법 중 더 심각한 판정 사용)
  let combinedSeverity = basicResult.severity;
  if (edgeResult.shadowBoundaryStrength > 50 && combinedSeverity !== 'severe') {
    combinedSeverity = 'severe';
  } else if (edgeResult.shadowBoundaryStrength > 25 && combinedSeverity === 'none') {
    combinedSeverity = 'mild';
  }

  return {
    ...basicResult,
    severity: combinedSeverity,
    shadowBoundaryStrength: edgeResult.shadowBoundaryStrength,
    feedback: generateShadowFeedback(combinedSeverity, basicResult.lightDirection),
  };
}
```

function generateShadowFeedback(
  severity: ShadowDetectionResult['severity'],
  direction: ShadowDetectionResult['lightDirection']
): string {
  if (severity === 'none') {
    return '조명이 균형있게 분포되어 있습니다.';
  }

  const directionText = direction === 'left'
    ? '오른쪽으로 살짝 이동하거나'
    : '왼쪽으로 살짝 이동하거나';

  if (severity === 'mild') {
    return `얼굴에 약간의 그림자가 있습니다. ${directionText} 정면을 향해 주세요.`;
  }

  if (severity === 'moderate') {
    return `얼굴에 그림자가 생겼습니다. ${directionText} 조명을 조절해 주세요.`;
  }

  return `얼굴에 강한 그림자가 있습니다. 정면 조명 환경에서 다시 촬영해 주세요.`;
}
```

### 3.4 통합 조명 분석 함수

```typescript
/**
 * CIE-4 통합 조명 분석
 */
interface LightingAnalysisInput {
  imageData: ImageData;
  faceLandmarks?: FaceLandmarks;
  faceRegion?: DOMRect;
}

interface LightingAnalysisOutput {
  // CCT 분석
  cct: CCTEstimationResult;

  // 균일성 분석
  uniformity: UniformityResult;

  // 그림자 분석
  shadow: ShadowDetectionResult;

  // 종합
  overallScore: number;         // 0-100
  isAcceptable: boolean;
  confidence: number;           // 0-1, 신뢰도 계수
  primaryIssue: string | null;  // 가장 중요한 문제
  feedback: string;             // 사용자 안내 메시지
  processingTime: number;       // ms
}

async function analyzeLighting(
  input: LightingAnalysisInput
): Promise<LightingAnalysisOutput> {
  const startTime = performance.now();

  // 1. CCT 분석
  const cct = estimateCCT(input.imageData, input.faceRegion);

  // 2. 균일성 분석 (랜드마크 필요)
  let uniformity: UniformityResult;
  let shadow: ShadowDetectionResult;

  if (input.faceLandmarks) {
    uniformity = analyzeUniformity(input.imageData, input.faceLandmarks);
    shadow = detectShadow(uniformity.zoneValues);
  } else {
    // 랜드마크 없이 간략 분석 (전체 이미지 4분할)
    const simpleResult = analyzeUniformitySimple(input.imageData);
    uniformity = simpleResult.uniformity;
    shadow = simpleResult.shadow;
  }

  // 3. 종합 점수 계산
  const cctScore = getCCTScore(cct.quality);
  const overallScore = Math.round(
    cctScore * 0.4 +
    uniformity.score * 0.35 +
    (100 - shadow.asymmetryPercent * 2) * 0.25
  );

  // 4. 신뢰도 계수 계산 (CIE 파이프라인 전파용)
  const confidence = calculateOverallConfidence(cct, uniformity, shadow);

  // 5. 주요 문제 식별
  const primaryIssue = identifyPrimaryIssue(cct, uniformity, shadow);

  // 6. 종합 피드백
  const feedback = generateOverallFeedback(cct, uniformity, shadow, primaryIssue);

  const processingTime = performance.now() - startTime;

  return {
    cct,
    uniformity,
    shadow,
    overallScore,
    isAcceptable: overallScore >= 50 && cct.quality !== 'reject',
    confidence,
    primaryIssue,
    feedback,
    processingTime: Math.round(processingTime),
  };
}

function getCCTScore(quality: CCTEstimationResult['quality']): number {
  const scores: Record<CCTEstimationResult['quality'], number> = {
    optimal: 100,
    good: 85,
    acceptable: 70,
    poor: 40,
    reject: 0,
  };
  return scores[quality];
}

function calculateOverallConfidence(
  cct: CCTEstimationResult,
  uniformity: UniformityResult,
  shadow: ShadowDetectionResult
): number {
  // 각 요소 가중 평균
  const cctConf = cct.confidence;
  const uniformConf = uniformity.score / 100;
  const shadowConf = shadow.severity === 'none' ? 1 :
                     shadow.severity === 'mild' ? 0.85 :
                     shadow.severity === 'moderate' ? 0.65 : 0.4;

  return Math.round((cctConf * 0.4 + uniformConf * 0.35 + shadowConf * 0.25) * 100) / 100;
}

function identifyPrimaryIssue(
  cct: CCTEstimationResult,
  uniformity: UniformityResult,
  shadow: ShadowDetectionResult
): string | null {
  // 우선순위: CCT reject > 심각한 그림자 > 불균일 > CCT poor > 경미한 문제

  if (cct.quality === 'reject') {
    return cct.cct < 3000 ? 'cct_too_warm' : 'cct_too_cool';
  }

  if (shadow.severity === 'severe') {
    return 'shadow_severe';
  }

  if (!uniformity.isAcceptable) {
    return 'uniformity_poor';
  }

  if (cct.quality === 'poor') {
    return cct.cct < 4000 ? 'cct_warm' : 'cct_cool';
  }

  if (shadow.severity === 'moderate') {
    return 'shadow_moderate';
  }

  return null;
}

function generateOverallFeedback(
  cct: CCTEstimationResult,
  uniformity: UniformityResult,
  shadow: ShadowDetectionResult,
  primaryIssue: string | null
): string {
  if (!primaryIssue) {
    return '조명 상태가 양호합니다. 분석을 진행할 수 있습니다.';
  }

  const feedbackMap: Record<string, string> = {
    cct_too_warm: '조명이 너무 따뜻합니다 (붉은빛). 자연광 환경으로 이동해 주세요.',
    cct_too_cool: '조명이 너무 차갑습니다 (푸른빛). 자연광 환경으로 이동해 주세요.',
    cct_warm: '조명이 다소 따뜻합니다. 가능하면 자연광 환경에서 촬영해 주세요.',
    cct_cool: '조명이 다소 차갑습니다. 가능하면 자연광 환경에서 촬영해 주세요.',
    shadow_severe: '얼굴에 강한 그림자가 있습니다. 정면 조명 환경에서 다시 촬영해 주세요.',
    shadow_moderate: shadow.feedback,
    uniformity_poor: uniformity.feedback,
  };

  return feedbackMap[primaryIssue] ?? '조명을 조절한 후 다시 시도해 주세요.';
}
```

---

## 4. 입력/출력 스펙

> **파일 위치**: `lib/image-engine/lighting/types.ts`

### 4.1 입력 타입

```typescript
// lib/image-engine/lighting/types.ts

/**
 * CIE-4 조명 분석 입력 타입
 *
 * @description CIE-3 AWB 보정 완료된 이미지를 입력으로 받음
 * @see CIE-3 출력 → CIE-4 입력 연결
 */
export interface CIE4Input {
  /** 분석할 이미지 데이터 (CIE-3 AWB 보정 완료) */
  imageData: ImageData;

  /** 메타데이터 */
  metadata: {
    /** 이미지 소스 */
    source: 'camera' | 'upload' | 'gallery';

    /** 촬영/업로드 타임스탬프 */
    timestamp: string;

    /** 이전 CIE 단계 정보 (선택) */
    previousStage?: {
      cie1?: { passed: boolean; sharpnessScore: number };
      cie2?: { faceDetected: boolean; landmarkCount: number };
      cie3?: { awbApplied: boolean; correctionStrength: number };
    };
  };

  /** 얼굴 랜드마크 (CIE-2 출력, 선택) */
  faceLandmarks?: FaceLandmarks;

  /** 얼굴 영역 바운딩 박스 (선택) */
  faceRegion?: DOMRect;

  /** 설정 옵션 (선택) */
  config?: CIE4Config;
}

/**
 * CIE-4 설정 옵션
 */
export interface CIE4Config {
  /** CCT 최적 범위 하한 (기본: 5000K) */
  optimalCCTMin?: number;

  /** CCT 최적 범위 상한 (기본: 6500K) */
  optimalCCTMax?: number;

  /** CCT 거부 범위 (기본: <3000K 또는 >10000K) */
  rejectCCTRange?: { min: number; max: number };

  /** 균일성 감도 계수 (기본: 2.0, 높을수록 엄격) */
  uniformitySensitivity?: number;

  /** 그림자 경고 임계값 % (기본: 10) */
  shadowThreshold?: number;

  /** Edge Detection 활성화 (기본: true) */
  enableEdgeDetection?: boolean;

  /** 상세 로깅 활성화 */
  verbose?: boolean;

  /** Fallback 허용 (에러 시 기본값 반환, 기본: true) */
  allowFallback?: boolean;
}

/**
 * MediaPipe 얼굴 랜드마크 타입
 */
export interface FaceLandmarks {
  /** MediaPipe 468점 랜드마크 */
  points: Array<{
    x: number;  // 0-1 정규화
    y: number;  // 0-1 정규화
    z?: number; // 깊이 (선택)
  }>;

  /** 이미지 크기 */
  imageSize: { width: number; height: number };

  /** 얼굴 신뢰도 (0-1) */
  confidence?: number;
}
```

### 4.2 출력 타입

```typescript
/**
 * CIE-4 조명 분석 출력 타입
 *
 * @description 분석 모듈 (PC-1, S-1, C-1)에 전달되는 조명 품질 정보
 */
export interface CIE4Output {
  /** CCT (색온도) 분석 결과 */
  cct: CCTEstimationResult;

  /** 균일성 분석 결과 */
  uniformity: UniformityResult;

  /** 그림자 분석 결과 */
  shadow: ShadowDetectionResult;

  /** 종합 점수 (0-100) */
  overallScore: number;

  /** 조명 품질 등급 */
  lightingQuality: 'excellent' | 'good' | 'acceptable' | 'poor' | 'reject';

  /** 분석 진행 가능 여부 */
  isAcceptable: boolean;

  /** 신뢰도 계수 (CIE 파이프라인 전파용, 0-1) */
  confidence: number;

  /** 가장 중요한 문제 식별자 */
  primaryIssue: LightingIssue | null;

  /** 사용자 피드백 메시지 (한국어) */
  feedback: string;

  /** 개선 권장사항 목록 */
  recommendations: string[];

  /** 처리 시간 (ms) */
  processingTime: number;

  /** Fallback 사용 여부 */
  usedFallback: boolean;
}

/**
 * CCT 추정 결과
 */
export interface CCTEstimationResult {
  /** 추정 색온도 (Kelvin) */
  cct: number;

  /** CCT 품질 등급 */
  quality: 'optimal' | 'good' | 'acceptable' | 'poor' | 'reject';

  /** CIE xy 색도 좌표 */
  xyCoordinates: { x: number; y: number };

  /** Duv 기반 신뢰도 (0-1) */
  confidence: number;

  /** 조명 유형 추정 (선택) */
  lightSource?: 'daylight' | 'incandescent' | 'fluorescent' | 'led' | 'mixed' | 'unknown';
}

/**
 * 균일성 분석 결과
 */
export interface UniformityResult {
  /** 균일성 점수 (0-100) */
  score: number;

  /** 6-Zone 밝기 값 */
  zoneValues: ZoneValues;

  /** 밝기 분산 (표준편차) */
  variance: number;

  /** 수용 가능 여부 */
  isAcceptable: boolean;

  /** 피드백 메시지 */
  feedback: string;

  /** 핫스팟 영역 (평균보다 30% 이상 밝은/어두운 영역) */
  hotspots?: HotspotRegion[];
}

/**
 * 6-Zone 밝기 값
 */
export interface ZoneValues {
  leftForehead: number;
  rightForehead: number;
  leftCheek: number;
  rightCheek: number;
  leftJaw: number;
  rightJaw: number;
}

/**
 * 핫스팟 영역 정보
 */
export interface HotspotRegion {
  zone: keyof ZoneValues;
  type: 'bright' | 'dark';
  deviation: number;  // 평균 대비 편차 %
}

/**
 * 그림자 감지 결과
 */
export interface ShadowDetectionResult {
  /** 그림자 존재 여부 */
  hasShadow: boolean;

  /** 그림자 심각도 */
  severity: 'none' | 'mild' | 'moderate' | 'severe';

  /** 좌우 비대칭 퍼센트 */
  asymmetryPercent: number;

  /** 그림자 경계 강도 (Edge Detection 기반, 0-100) */
  shadowBoundaryStrength: number;

  /** 광원 방향 */
  lightDirection: 'left' | 'right' | 'top' | 'bottom' | 'balanced';

  /** 그림자 위치 */
  shadowPosition: 'left' | 'right' | 'top' | 'bottom' | 'none';

  /** 그림자 영역 좌표 (선택) */
  shadowAreas?: ShadowRegion[];

  /** 피드백 메시지 */
  feedback: string;
}

/**
 * 그림자 영역 정보
 */
export interface ShadowRegion {
  /** 영역 바운딩 박스 */
  bounds: { x: number; y: number; width: number; height: number };

  /** 평균 밝기 (0-255) */
  avgBrightness: number;

  /** 인접 영역 대비 밝기 차이 % */
  contrastPercent: number;
}

/**
 * 조명 문제 유형
 */
export type LightingIssue =
  | 'cct_too_warm'      // CCT < 3000K
  | 'cct_too_cool'      // CCT > 10000K
  | 'cct_warm'          // CCT 3000-4000K
  | 'cct_cool'          // CCT 8000-10000K
  | 'shadow_severe'     // 심각한 그림자
  | 'shadow_moderate'   // 중간 그림자
  | 'uniformity_poor';  // 불균일 조명
```

### 4.3 CIE 파이프라인 위치

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Image Engine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CIE-1: 이미지 품질 검증                                     │
│    └── 해상도, 선명도, 얼굴 감지                             │
│                      ↓                                       │
│  CIE-2: 얼굴 랜드마크 추출                                   │
│    └── 468점 랜드마크, 포즈 추정                             │
│                      ↓                                       │
│  CIE-3: 화이트밸런스 보정                                    │
│    └── Gray World, Von Kries, D65 기준 보정                  │
│                      ↓                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ CIE-4: 조명 분석 ◀━━━━━━━━━━━━━━ [이 문서]             │ │
│  │   ├── CCT 추정 (McCamy)                                 │ │
│  │   ├── 균일성 분석 (6-Zone)                              │ │
│  │   ├── 그림자 감지 (좌우 비교)                           │ │
│  │   └── 조명 가이드 UI 데이터 생성                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                      ↓                                       │
│  분석 모듈 (PC-1, S-1, C-1)                                 │
│    └── confidence 계수 적용                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 API 응답 형식

표준 응답 유틸리티 사용: `lib/api/error-response.ts`

#### 성공 응답

```typescript
import { createSuccessResponse } from '@/lib/api/error-response';

return createSuccessResponse({
  cct: lightingResult.cct,
  uniformity: lightingResult.uniformity,
  shadowAnalysis: lightingResult.shadowAnalysis,
  isAcceptable: lightingResult.isAcceptable,
  confidence: lightingResult.confidence,
});
```

#### 에러 응답

```typescript
import {
  validationError,
  analysisFailedError,
  rateLimitError,
  dailyLimitError
} from '@/lib/api/error-response';

// 입력 검증 실패
return validationError('이미지 형식이 올바르지 않습니다.');

// 분석 실패
return analysisFailedError('조명 분석에 실패했습니다.');

// Rate Limit
return rateLimitError(60);  // 60초 후 재시도

// 일일 한도 초과
return dailyLimitError(86400);  // 24시간 후 재시도
```

#### 응답 타입

```typescript
type ApiResponse<T> =
  | { success: true; data: T }
  | { error: string; code: ApiErrorCode; retryAfter?: number };
```

---

## 5. 조명 가이드 UI 요구사항

### 5.1 실시간 피드백 컴포넌트

```tsx
// components/analysis/LightingGuide.tsx

interface LightingGuideProps {
  result: CIE4Output | null;
  isAnalyzing: boolean;
}

export function LightingGuide({ result, isAnalyzing }: LightingGuideProps) {
  if (isAnalyzing) {
    return <LoadingIndicator text="조명 분석 중..." />;
  }

  if (!result) {
    return null;
  }

  return (
    <div data-testid="lighting-guide" className="lighting-guide">
      {/* 종합 상태 표시 */}
      <StatusBadge
        status={result.isAcceptable ? 'success' : 'warning'}
        label={result.isAcceptable ? '조명 양호' : '조명 조절 필요'}
      />

      {/* 피드백 메시지 */}
      <p className="feedback-message">{result.feedback}</p>

      {/* 상세 지표 (접기/펼치기) */}
      <Collapsible title="상세 정보">
        <MetricRow label="색온도" value={`${result.cct.cct}K`} />
        <MetricRow label="균일성" value={`${result.uniformity.score}점`} />
        <MetricRow label="그림자" value={getShadowLabel(result.shadow.severity)} />
      </Collapsible>

      {/* 조명 방향 가이드 (그림자 있을 때만) */}
      {result.shadow.hasShadow && (
        <LightDirectionGuide direction={result.shadow.lightDirection} />
      )}
    </div>
  );
}
```

### 5.2 조명 방향 가이드 UI

```
┌─────────────────────────────────────────────────────────────┐
│                    조명 방향 가이드                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  광원이 왼쪽에 있는 경우:                                    │
│                                                              │
│      ☀️                                                      │
│       \                                                      │
│        \    ┌─────┐                                         │
│         \   │     │                                         │
│          →  │ 👤  │  →→→ "오른쪽으로 이동하세요"           │
│             │     │                                         │
│             └─────┘                                         │
│                                                              │
│  광원이 오른쪽에 있는 경우:                                   │
│                                                              │
│                          ☀️                                  │
│                         /                                    │
│       ┌─────┐         /                                     │
│       │     │        /                                      │
│ ←←← "왼쪽으로 이동하세요" │ 👤  │  ←                       │
│       │     │                                              │
│       └─────┘                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 색온도 시각화

```tsx
// components/analysis/CCTIndicator.tsx

interface CCTIndicatorProps {
  cct: number;
  quality: CCTEstimationResult['quality'];
}

export function CCTIndicator({ cct, quality }: CCTIndicatorProps) {
  // 색온도 스펙트럼 바 위에 현재 위치 표시
  const position = cctToPosition(cct);  // 0-100%

  return (
    <div className="cct-indicator">
      <div className="spectrum-bar">
        {/* 따뜻한 색 → 차가운 색 그라디언트 */}
        <div className="gradient" />

        {/* 현재 위치 마커 */}
        <div
          className="marker"
          style={{ left: `${position}%` }}
        />

        {/* 최적 범위 표시 */}
        <div className="optimal-range" />
      </div>

      <div className="labels">
        <span>2000K</span>
        <span className="optimal">5000-6500K 최적</span>
        <span>10000K</span>
      </div>

      <div className="current-value">
        현재: {cct}K ({translateQuality(quality)})
      </div>
    </div>
  );
}
```

---

## 6. 에러 케이스 및 대응

### 6.1 에러 유형별 처리

| 에러 코드 | 원인 | 사용자 메시지 | 처리 |
|----------|------|-------------|------|
| `INVALID_IMAGE_DATA` | 이미지 데이터 손상 | 이미지를 다시 촬영해 주세요 | 재촬영 유도 |
| `NO_FACE_DETECTED` | 얼굴 감지 실패 | 얼굴이 화면에 보이게 해주세요 | CIE-2 폴백 |
| `CCT_OUT_OF_RANGE` | CCT < 1000 또는 > 15000 | 조명 환경을 확인해 주세요 | 기본값 사용 |
| `INSUFFICIENT_PIXELS` | 얼굴 영역 너무 작음 | 카메라에 더 가까이 와주세요 | 재촬영 유도 |
| `CALCULATION_ERROR` | 수학 연산 오류 | 분석 중 오류 발생 | 기본값 + 로깅 |

### 6.2 폴백 전략

```typescript
async function analyzeLightingSafe(
  input: CIE4Input
): Promise<CIE4Output> {
  try {
    return await analyzeLighting(input);
  } catch (error) {
    console.error('[CIE-4] Analysis failed:', error);

    // 기본값 반환 (분석은 진행 가능하도록)
    return {
      cct: {
        cct: 5500,
        quality: 'acceptable',
        xyCoordinates: { x: 0.3127, y: 0.3290 },  // D65
        confidence: 0.5,
      },
      uniformity: {
        score: 70,
        zoneValues: createDefaultZoneValues(),
        variance: 10,
        isAcceptable: true,
        feedback: '조명 분석을 완료할 수 없었습니다.',
      },
      shadow: {
        hasShadow: false,
        severity: 'none',
        asymmetryPercent: 0,
        lightDirection: 'balanced',
        feedback: '',
      },
      overallScore: 65,
      isAcceptable: true,
      confidence: 0.5,
      primaryIssue: null,
      feedback: '조명 분석이 제한적입니다. 결과를 참고용으로 확인해 주세요.',
      processingTime: 0,
    };
  }
}
```

### 6.3 신뢰도 전파

CIE-4 신뢰도는 최종 분석 신뢰도에 영향:

```
최종 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × 분석모듈

예시 (조명 문제가 있는 경우):
CIE-1 (품질): 0.95
CIE-2 (랜드마크): 0.90
CIE-3 (AWB): 0.85
CIE-4 (조명): 0.65  ← 그림자로 인해 낮음
PC-1 (퍼스널컬러): 0.88

최종 = 0.95 × 0.90 × 0.85 × 0.65 × 0.88 = 0.42 (42%)
```

---

## 7. P3 원자 분해

| ID | 원자 | 소요시간 | 입력 | 출력 | 의존성 |
|----|------|----------|------|------|--------|
| **CIE4-1** | sRGB to xy 변환 유틸리티 | 2h | RGB 값 | CIE xy 좌표 | - |
| **CIE4-2** | McCamy CCT 추정 | 2h | xy 좌표 | CCT (K), 품질 | CIE4-1 |
| **CIE4-3** | 6-Zone 영역 추출 | 2h | FaceLandmarks | Zone 좌표들 | CIE-2 |
| **CIE4-4** | Y 채널 밝기 계산 | 1h | ImageData, Zone | 밝기 값 | CIE4-3 |
| **CIE4-5** | 균일성 분석 | 2h | Zone 밝기들 | 균일성 점수 | CIE4-4 |
| **CIE4-6** | 그림자 감지 | 2h | Zone 밝기들 | 그림자 결과 | CIE4-4 |
| **CIE4-7** | 통합 분석 함수 | 3h | CIE4Input | CIE4Output | All |

**총 예상 시간**: 14시간

### 7.1 의존성 그래프

```
CIE4-1 (sRGB to xy)
    ↓
CIE4-2 (McCamy CCT)
                        ┐
CIE4-3 (6-Zone 추출)    │
    ↓                   │
CIE4-4 (Y 밝기 계산)    ├─→ CIE4-7 (통합)
    ↓                   │
CIE4-5 (균일성)         │
    ↓                   │
CIE4-6 (그림자)         ┘
```

### 7.2 각 원자 상세 (성공 기준 포함)

#### CIE4-1: sRGB to xy 변환 유틸리티

- **입력**: `{ r: number, g: number, b: number }` (0-255 범위)
- **출력**: `{ x: number, y: number }` (CIE 1931 색도 좌표)
- **파일**: `lib/image-engine/lighting/internal/color-space.ts`
- **소요시간**: 2시간
- **성공 기준**:
  - D65 백색 (255,255,255) → x = 0.3127 ±0.001, y = 0.3290 ±0.001
  - 순수 빨강 (255,0,0) → x = 0.64 ±0.02, y = 0.33 ±0.02
  - 순수 초록 (0,255,0) → x = 0.30 ±0.02, y = 0.60 ±0.02
  - 순수 파랑 (0,0,255) → x = 0.15 ±0.02, y = 0.06 ±0.02
  - 감마 해제 정확도: sRGB → Linear 변환 오차 < 0.1%
  - 단위 테스트 커버리지 100%

```typescript
// 테스트 케이스 예시
describe('CIE4-1: sRGB to xy', () => {
  it('D65 white point', () => {
    const { x, y } = srgbToXY(255, 255, 255);
    expect(x).toBeCloseTo(0.3127, 3);
    expect(y).toBeCloseTo(0.3290, 3);
  });
});
```

---

#### CIE4-2: McCamy CCT 추정

- **입력**: `{ x: number, y: number }` (CIE 1931 색도 좌표)
- **출력**: `{ cct: number, quality: CCTQuality, confidence: number }`
- **파일**: `lib/image-engine/lighting/color-temperature.ts`, `internal/mccamy.ts`
- **소요시간**: 2시간
- **성공 기준**:
  - D65 입력 (x=0.3127, y=0.3290) → CCT = 6500K ±100K
  - 백열등 (x=0.45, y=0.41) → CCT = 2700-3000K
  - 형광등 (x=0.31, y=0.32) → CCT = 6000-7000K
  - 품질 분류 정확도:
    - 5000-6500K → `optimal`
    - 4500-5000K 또는 6500-7000K → `good`
    - <3000K 또는 >10000K → `reject`
  - Duv 기반 confidence 계산: Duv < 0.02 → confidence > 0.85

```typescript
// 검증 케이스
const testCases = [
  { input: { x: 0.3127, y: 0.3290 }, expectedCCT: 6500, quality: 'optimal' },
  { input: { x: 0.4328, y: 0.4033 }, expectedCCT: 2900, quality: 'poor' },
  { input: { x: 0.3020, y: 0.3180 }, expectedCCT: 7200, quality: 'acceptable' },
];
```

---

#### CIE4-3: 6-Zone 영역 추출

- **입력**: `FaceLandmarks` (MediaPipe 468점)
- **출력**: `{ leftForehead: Zone, rightForehead: Zone, leftCheek: Zone, rightCheek: Zone, leftJaw: Zone, rightJaw: Zone }`
- **파일**: `lib/image-engine/lighting/internal/region-sampler.ts`
- **소요시간**: 2시간
- **성공 기준**:
  - 각 Zone이 최소 100 픽셀 포함
  - 좌우 대칭 영역 크기 오차 < 10%
  - 랜드마크 인덱스 매핑 정확성:
    - 이마: #10, #108, #337 기준
    - 볼: #234, #454 기준
    - 턱: #152, #377, #378 기준
  - 랜드마크 없을 때 4분할 fallback 동작

```typescript
// Zone 추출 검증
expect(zones.leftForehead.points.length).toBeGreaterThan(100);
expect(Math.abs(zones.leftCheek.area - zones.rightCheek.area)).toBeLessThan(zones.leftCheek.area * 0.1);
```

---

#### CIE4-4: Y 채널 밝기 계산

- **입력**: `ImageData`, `Zone` (좌표 배열)
- **출력**: `number` (0-255 범위 평균 밝기)
- **파일**: `lib/image-engine/lighting/internal/brightness.ts`
- **소요시간**: 1시간
- **성공 기준**:
  - 흰색 이미지 (255,255,255) → Y ≈ 255 (오차 ±1)
  - 검정색 이미지 (0,0,0) → Y ≈ 0 (오차 ±1)
  - 회색 이미지 (128,128,128) → Y ≈ 128 (오차 ±2)
  - 처리 시간 < 5ms per zone (640x480 이미지 기준)
  - Y 계산 공식: `Y = 0.299R + 0.587G + 0.114B` (ITU-R BT.601)

```typescript
// 성능 테스트
const start = performance.now();
const brightness = calculateZoneBrightness(imageData, zone);
expect(performance.now() - start).toBeLessThan(5);
```

---

#### CIE4-5: 균일성 분석

- **입력**: `ZoneValues` (6개 밝기 값)
- **출력**: `{ uniformityScore: number, hotspots: Region[], variance: number, isAcceptable: boolean, feedback: string }`
- **파일**: `lib/image-engine/lighting/uniformity.ts`
- **소요시간**: 2시간
- **성공 기준**:
  - 테스트 이미지 10장에서 ±5% 오차 내 일관된 결과
  - 균일 조명 이미지 (모든 zone ±5 이내) → score 90+ 점
  - 불균일 이미지 (최대 차이 > 50) → score 60- 점
  - 균일성 판정 정확도:
    - score ≥ 85 → "최적"
    - 70-84 → "양호"
    - 50-69 → "수용"
    - < 50 → "부적합"
  - hotspots 식별: 평균보다 30% 이상 밝은/어두운 영역

```typescript
// 검증 케이스
const uniformZones = { leftForehead: 150, rightForehead: 152, ... };
expect(analyzeUniformity(uniformZones).score).toBeGreaterThan(90);

const unevenZones = { leftForehead: 200, rightForehead: 100, ... };
expect(analyzeUniformity(unevenZones).score).toBeLessThan(50);
```

---

#### CIE4-6: 그림자 감지

- **입력**: `ZoneValues`, `ImageData?` (Edge Detection용), `DOMRect?` (얼굴 영역)
- **출력**: `{ hasShadow: boolean, severity: ShadowSeverity, asymmetryPercent: number, shadowBoundaryStrength: number, lightDirection: LightDirection, shadowPosition: ShadowPosition, feedback: string }`
- **파일**: `lib/image-engine/lighting/shadow-detect.ts`
- **소요시간**: 2시간
- **성공 기준**:
  - 좌측만 밝음 (좌측 평균 > 우측 평균 10%+) → lightDirection = 'left', shadowPosition = 'right'
  - 좌우 동일 (차이 < 5%) → hasShadow = false, severity = 'none'
  - 20% 이상 차이 → severity = 'severe'
  - 10-20% 차이 → severity = 'moderate'
  - 5-10% 차이 → severity = 'mild'
  - Edge Detection (선택적): SBS > 50 → severe, SBS 25-50 → moderate
  - 그림자 방향 추정 정확도: 테스트 이미지 10장 중 9장 이상 정확

```typescript
// 검증 케이스
const balancedZones = { leftForehead: 150, rightForehead: 150, ... };
expect(detectShadow(balancedZones).hasShadow).toBe(false);

const asymmetricZones = { leftForehead: 200, rightForehead: 140, ... };
expect(detectShadow(asymmetricZones).severity).toBe('severe');
expect(detectShadow(asymmetricZones).lightDirection).toBe('left');
```

---

#### CIE4-7: 통합 분석 함수

- **입력**: `CIE4Input` (ImageData, faceLandmarks?, faceRegion?, config?)
- **출력**: `CIE4Output` (cct, uniformity, shadow, overallScore, isAcceptable, confidence, primaryIssue, feedback, processingTime)
- **파일**: `lib/image-engine/lighting/analyze.ts`
- **소요시간**: 3시간
- **성공 기준**:
  - 전체 처리 시간 < 50ms (640x480 이미지, 랜드마크 포함)
  - 전체 처리 시간 < 30ms (640x480 이미지, 랜드마크 미포함)
  - 에러 발생 시 안전한 기본값 반환 (confidence = 0.5)
  - CIE 파이프라인과 통합 테스트 통과 (CIE-1 → CIE-2 → CIE-3 → CIE-4)
  - 신뢰도 전파 정확도: 조명 문제 시 confidence < 0.7
  - 종합 점수 계산: CCT(40%) + 균일성(35%) + 그림자(25%)
  - primaryIssue 우선순위: CCT reject > severe shadow > poor uniformity > CCT poor

```typescript
// 통합 테스트
it('should complete within 50ms with landmarks', async () => {
  const start = performance.now();
  const result = await analyzeLighting({
    imageData: testImage,
    faceLandmarks: mockLandmarks,
  });
  expect(performance.now() - start).toBeLessThan(50);
  expect(result.isAcceptable).toBeDefined();
  expect(result.confidence).toBeGreaterThan(0);
});

it('should return safe defaults on error', async () => {
  const result = await analyzeLightingSafe({ imageData: corruptedImage });
  expect(result.confidence).toBe(0.5);
  expect(result.isAcceptable).toBe(true);
});
```

---

## 8. 파일 구조

### 8.1 구현 파일 경로 (Definitive)

```
lib/image-engine/lighting/
├── index.ts                 # 공개 API (Barrel Export)
├── types.ts                 # 타입 정의 (CIE4Input, CIE4Output)
├── analyze.ts               # CIE4-7: 조명 분석 메인
├── uniformity.ts            # CIE4-5: 균일성 측정
├── shadow-detect.ts         # CIE4-6: 그림자 감지
├── color-temperature.ts     # CIE4-2: 색온도 측정 (CCT)
├── internal/
│   ├── histogram.ts         # 히스토그램 분석
│   ├── mccamy.ts            # McCamy 공식 구현 (CIE4-2 핵심)
│   ├── region-sampler.ts    # 영역 샘플링 (CIE4-3)
│   ├── color-space.ts       # sRGB→XYZ→xy 변환 (CIE4-1)
│   └── brightness.ts        # Y 채널 계산 (CIE4-4)
└── __tests__/
    ├── analyze.test.ts      # 통합 테스트
    ├── uniformity.test.ts   # 균일성 테스트
    ├── shadow-detect.test.ts
    ├── color-temperature.test.ts
    └── fixtures/
        ├── uniform-light.json
        ├── shadow-left.json
        └── warm-light.json
```

### 8.2 파일별 책임

| 파일 | 원자 | 공개 API | 책임 |
|------|------|----------|------|
| `index.ts` | - | `analyzeLighting()` | Barrel Export, 외부 진입점 |
| `types.ts` | - | 타입 export | CIE4Input, CIE4Output, Config |
| `analyze.ts` | CIE4-7 | `analyzeLighting()` | 통합 분석, 파이프라인 조율 |
| `uniformity.ts` | CIE4-5 | `analyzeUniformity()` | 6-Zone 균일성 측정 |
| `shadow-detect.ts` | CIE4-6 | `detectShadow()` | 그림자 감지, 방향 추정 |
| `color-temperature.ts` | CIE4-2 | `estimateCCT()` | McCamy CCT 추정 |
| `internal/mccamy.ts` | CIE4-2 내부 | - | McCamy 공식 핵심 |
| `internal/color-space.ts` | CIE4-1 | - | sRGB→XYZ→xy 변환 |
| `internal/region-sampler.ts` | CIE4-3 | - | 랜드마크 기반 영역 추출 |
| `internal/brightness.ts` | CIE4-4 | - | Y 채널 밝기 계산 |

### 8.3 레거시 파일 구조 (참고용)

> 아래는 이전 문서에 기록된 구조. 위 8.1이 최신 정의임.

```
lib/image-engine/
├── index.ts                    # 통합 export
├── types.ts                    # 공통 타입
├── cie-4/
│   ├── index.ts                # CIE-4 모듈 export
│   ├── types.ts                # CIE-4 전용 타입
│   ├── lighting-analyzer.ts    # 메인 분석 함수 (CIE4-7)
│   ├── cct-estimator.ts        # CCT 추정 (CIE4-1, CIE4-2)
│   ├── zone-extractor.ts       # Zone 추출 (CIE4-3)
│   ├── brightness-calculator.ts # 밝기 계산 (CIE4-4)
│   ├── uniformity-analyzer.ts  # 균일성 분석 (CIE4-5)
│   ├── shadow-detector.ts      # 그림자 감지 (CIE4-6)
│   └── feedback-generator.ts   # 피드백 생성
└── utils/
    ├── color-space.ts          # sRGB/XYZ/xy 변환
    └── math.ts                 # 수학 유틸리티
```

### 8.4 UI 컴포넌트 구조

```
components/analysis/
├── LightingGuide.tsx           # 조명 가이드 UI (메인)
├── CCTIndicator.tsx            # 색온도 스펙트럼 표시
├── LightDirectionGuide.tsx     # 조명 방향 안내 (그림자 시)
├── UniformityHeatmap.tsx       # 균일성 히트맵 (선택적)
└── __tests__/
    └── LightingGuide.test.tsx
```

---

## 9. 상세 테스트 케이스 및 에러 핸들링

> P3 원칙 준수: ≤2시간 독립 테스트 가능한 원자 단위

### 9.0 Happy Path 테스트 (Expected Values)

#### 9.0.1 조명 균일성 점수 검증

| TC-ID | 테스트명 | 입력 Zone 밝기 (L/R) | Expected Uniformity Score | 허용 오차 | 검증 공식 |
|-------|----------|---------------------|--------------------------|----------|----------|
| **CIE4-HP01** | 완벽한 균일성 | 모든 Zone: 150/150 | 100 | ±0 | `1 - max_deviation` |
| **CIE4-HP02** | 우수한 균일성 | 이마: 155/150, 뺨: 148/152 | ≥90 | ±2 | 좌우 편차 <5% |
| **CIE4-HP03** | 양호한 균일성 | 이마: 160/145, 뺨: 155/140 | 75-89 | ±3 | 좌우 편차 5-15% |
| **CIE4-HP04** | 불량한 균일성 | 이마: 180/130, 뺨: 170/120 | 50-74 | ±5 | 좌우 편차 15-25% |
| **CIE4-HP05** | 매우 불량 | 이마: 200/100, 뺨: 190/90 | <50 | ±5 | 좌우 편차 >25% |

#### 9.0.2 그림자 비율 검증

| TC-ID | 테스트명 | 입력 조건 | Expected Shadow Ratio | Expected 방향 | 검증 기준 |
|-------|----------|----------|----------------------|--------------|----------|
| **CIE4-HP06** | 그림자 없음 | 좌우 대칭 조명 | 0.00-0.05 | 'none' | `\|L-R\|/max(L,R) < 0.05` |
| **CIE4-HP07** | 경미한 그림자 | 좌측 5% 밝음 | 0.05-0.10 | 'left' | 경미한 비대칭 |
| **CIE4-HP08** | 중간 그림자 | 좌측 15% 밝음 | 0.10-0.20 | 'left' | 명확한 비대칭 |
| **CIE4-HP09** | 심각한 그림자 | 좌측 30% 밝음 | >0.20 | 'left' | 강한 측면광 |
| **CIE4-HP10** | 역광 감지 | 배경 > 얼굴 밝기 | backlight: true | 'behind' | 배경/얼굴 비율 >1.5 |

#### 9.0.3 색온도 품질 분류 검증

| TC-ID | 테스트명 | 입력 CCT | Expected Quality | Expected 분석 가능 여부 |
|-------|----------|----------|-----------------|---------------------|
| **CIE4-HP11** | 최적 주광 | 5500K | 'optimal' | 분석 권장 |
| **CIE4-HP12** | 좋은 조명 | 4700K | 'good' | 분석 가능 |
| **CIE4-HP13** | 낮은 품질 | 3500K | 'poor' | 주의 필요 |
| **CIE4-HP14** | 거부 수준 | 2000K | 'reject' | 재촬영 권장 |
| **CIE4-HP15** | D65 표준광 | 6500K | 'optimal' | 분석 권장 |
| **CIE4-HP16** | 차가운 조명 | 8000K | 'good' | 분석 가능 |

#### 9.0.4 혼합 조명 감지 검증

| TC-ID | 테스트명 | 입력 조건 | Expected 감지 | 신뢰도 영향 |
|-------|----------|----------|--------------|------------|
| **CIE4-HP17** | 단일 광원 | CCT 분산 <300K | `mixedLighting: false` | 영향 없음 |
| **CIE4-HP18** | 2개 광원 | CCT 분산 300-800K | `mixedLighting: true, sources: 2` | -0.10 |
| **CIE4-HP19** | 3개+ 광원 | CCT 분산 >800K | `mixedLighting: true, sources: 3+` | -0.20 |
| **CIE4-HP20** | 자연광+인공광 | 서로 다른 CCT 영역 | `mixedLighting: true, types: ['natural', 'artificial']` | -0.15 |

### 9.1 Edge Case 테스트

#### 9.1.1 혼합 조명 관련 Edge Cases

| TC-ID | 테스트명 | 입력 조건 | Expected 동작 | 우선순위 |
|-------|----------|----------|--------------|----------|
| **CIE4-E01** | 2개 광원 (주광+형광등) | `CCT zones: [5500K, 4000K]` | 혼합 조명 경고, 평균 CCT 사용 | P0 |
| **CIE4-E02** | 3개 광원 (복잡한 조명) | `CCT zones: [6500K, 4000K, 2700K]` | 심각한 혼합 경고, 신뢰도 -0.25 | P0 |
| **CIE4-E03** | 자연광+백열등 혼합 | 창가 + 실내등 | 자연광 우선, 인공광 영역 표시 | P1 |
| **CIE4-E04** | 색상 젤 조명 | 비표준 스펙트럼 | 분석 불가, 재촬영 권장 | P1 |
| **CIE4-E05** | 네온/LED 조명 | 좁은 스펙트럼 피크 | 제한적 분석, 경고 표시 | P2 |

#### 9.1.2 역광 관련 Edge Cases

| TC-ID | 테스트명 | 입력 조건 | Expected 동작 | 우선순위 |
|-------|----------|----------|--------------|----------|
| **CIE4-E06** | 강한 역광 | 배경/얼굴 밝기 비율 >2.0 | 역광 심각 경고, 분석 거부 | P0 |
| **CIE4-E07** | 약한 역광 | 배경/얼굴 밝기 비율 1.5-2.0 | 역광 경고, 신뢰도 -0.15 | P0 |
| **CIE4-E08** | 창가 역광 | 한쪽 배경만 밝음 | 부분 역광, 조명 이동 권장 | P1 |
| **CIE4-E09** | 실루엣 수준 | 배경/얼굴 비율 >3.0 | 분석 불가, 즉시 재촬영 | P0 |

#### 9.1.3 낮은 품질 조명 관련 Edge Cases

| TC-ID | 테스트명 | 입력 조건 | Expected 동작 | 사용자 선택 |
|-------|----------|----------|--------------|------------|
| **CIE4-E10** | 매우 어두운 환경 | `avgBrightness < 50` | 조명 증가 권장, 분석 가능 여부 문의 | "어두운 조명에서 계속하시겠습니까?" |
| **CIE4-E11** | 과도한 밝기 | `avgBrightness > 240` | 과노출 경고, 조명 감소 권장 | "밝은 조명에서 계속하시겠습니까?" |
| **CIE4-E12** | 극단적 색온도 (<2500K) | 촛불/매우 따뜻한 조명 | 색 왜곡 경고, CIE-3 보정 한계 알림 | "분석 정확도가 낮을 수 있습니다" |
| **CIE4-E13** | 극단적 색온도 (>10000K) | 그늘/매우 차가운 조명 | 색 왜곡 경고, CIE-3 보정 한계 알림 | "분석 정확도가 낮을 수 있습니다" |
| **CIE4-E14** | 불균일 + 그림자 | 복합 문제 | 가장 심각한 문제 우선 표시 | 단계별 해결 안내 |

#### 9.1.4 랜드마크 의존성 Edge Cases

| TC-ID | 테스트명 | 입력 조건 | Expected 동작 | 우선순위 |
|-------|----------|----------|--------------|----------|
| **CIE4-E15** | 얼굴 랜드마크 없음 | `faceLandmarks: null` | 전체 이미지 기반 분석 폴백 | P0 |
| **CIE4-E16** | 부분 랜드마크 | 일부 Zone만 추출 가능 | 가용 Zone으로 분석, 신뢰도 감소 | P1 |
| **CIE4-E17** | 잘못된 랜드마크 | 비정상적 좌표 | 랜드마크 유효성 검증 후 폴백 | P1 |

### 9.2 에러 핸들링 시나리오

#### 9.2.1 낮은 품질 조명 분석 허용 결정 플로우

```typescript
// 사용자 결정이 필요한 상황
interface LightingQualityDecision {
  // 품질 임계값 미달 시
  belowThreshold: {
    trigger: 'overallQuality < 60';
    showAnalysis: {
      uniformityScore: number;
      shadowRatio: number;
      cctQuality: string;
      mixedLighting: boolean;
    };
    options: [
      {
        id: 'proceed_anyway',
        label: '이 조명으로 계속하기',
        warning: '분석 정확도가 낮을 수 있습니다',
        confidenceMultiplier: 0.7
      },
      {
        id: 'retake_photo',
        label: '더 좋은 조명에서 다시 촬영',
        showGuidance: true
      },
      {
        id: 'see_comparison',
        label: '좋은 조명과 비교해보기',
        showExamples: true
      }
    ];
    default: 'retake_photo';
    timeout: null; // 사용자 선택 필수
  };

  // 특정 문제별 결정
  specificIssues: {
    shadow: {
      trigger: 'shadowRatio > 0.15';
      message: '한쪽 얼굴에 그림자가 있습니다';
      suggestion: '창문이나 조명 맞은편으로 약간 이동해보세요';
      canProceed: true;
      confidencePenalty: 0.10;
    };
    backlight: {
      trigger: 'isBacklit && ratio > 1.5';
      message: '역광이 감지되었습니다';
      suggestion: '광원을 등지지 말고 마주보세요';
      canProceed: 'ratio < 2.0';
      confidencePenalty: 0.20;
    };
    mixedLighting: {
      trigger: 'mixedLighting && sources >= 2';
      message: '여러 광원이 섞여 있습니다';
      suggestion: '하나의 광원만 사용하거나 자연광을 권장합니다';
      canProceed: true;
      confidencePenalty: 0.15;
    };
    lowCCT: {
      trigger: 'cct < 3000';
      message: '조명 색이 너무 따뜻합니다 (노란빛)';
      suggestion: '백색 또는 자연광 조명으로 변경해보세요';
      canProceed: true;
      confidencePenalty: 0.15;
    };
  };
}
```

#### 9.2.2 Graceful Fallback 전략

```typescript
// CIE-4 Fallback 체계
interface CIE4FallbackConfig {
  // Level 1: Zone 기반 → 전체 이미지 기반
  zoneAnalysisFailure: {
    condition: 'faceLandmarks unavailable || zoneExtractionError';
    action: 'fallback_to_global_analysis';
    method: 'analyze entire image brightness/color';
    confidenceAdjustment: -0.15;
    limitations: ['shadow direction may be inaccurate', 'uniformity is image-wide'];
  };

  // Level 2: CCT 추정 실패 → 기본값 사용
  cctEstimationFailure: {
    condition: 'cctEstimationError || extremeValues';
    action: 'assume_neutral_lighting';
    assumedCCT: 5500;
    confidenceAdjustment: -0.20;
    flagAsEstimated: true;
  };

  // Level 3: 전체 분석 실패 → 기본 품질 가정
  totalFailure: {
    condition: 'criticalError';
    action: 'return_default_quality';
    output: {
      overallQuality: 'unknown',
      isAnalyzable: true, // 분석 모듈에서 자체 판단하도록
      confidence: 0,
      fallbackUsed: true,
      errorDetails: string
    };
    recommendation: '조명 품질을 확인할 수 없습니다. 결과를 주의해서 해석해주세요.';
  };
}
```

#### 9.2.3 Partial Failure 처리

| 실패 구성 요소 | 처리 방식 | 사용자 영향 |
|---------------|----------|------------|
| CCT 추정만 실패 | 균일성/그림자 분석 계속, CCT=5500K 가정 | "색온도를 측정할 수 없어 기본값을 사용합니다" |
| 균일성 분석만 실패 | CCT/그림자 분석 계속, 균일성='unknown' | "조명 균일성을 측정할 수 없습니다" |
| 그림자 분석만 실패 | CCT/균일성 분석 계속, 그림자='unknown' | "그림자 방향을 감지할 수 없습니다" |
| Zone 추출 실패 | 전체 이미지 기반 분석 | "얼굴 영역을 특정할 수 없어 전체 이미지로 분석합니다" |

### 9.3 테스트 데이터 Fixtures

```typescript
// tests/fixtures/cie4-lighting.ts

// 균일성 테스트 Zone 데이터
export const uniformityTestData = {
  // 완벽한 균일성
  perfect: {
    leftForehead: 150, rightForehead: 150,
    leftCheek: 148, rightCheek: 148,
    leftJaw: 145, rightJaw: 145,
    expectedScore: 100,
    expectedQuality: 'excellent'
  },

  // 약간의 비대칭 (좌측 밝음)
  slightLeftBias: {
    leftForehead: 160, rightForehead: 150,
    leftCheek: 155, rightCheek: 145,
    leftJaw: 150, rightJaw: 140,
    expectedScore: 85,
    expectedShadowDirection: 'right'
  },

  // 심한 비대칭
  severeAsymmetry: {
    leftForehead: 200, rightForehead: 120,
    leftCheek: 190, rightCheek: 110,
    leftJaw: 180, rightJaw: 100,
    expectedScore: 45,
    expectedShadowSeverity: 'severe'
  }
};

// 혼합 조명 테스트 데이터
export const mixedLightingTestData = {
  // 단일 광원 (자연광)
  singleNatural: {
    zones: [
      { cct: 5600, area: 'forehead' },
      { cct: 5500, area: 'cheek_left' },
      { cct: 5550, area: 'cheek_right' }
    ],
    expectedMixed: false,
    expectedSources: 1
  },

  // 2개 광원 (자연광 + 형광등)
  dualSource: {
    zones: [
      { cct: 5500, area: 'forehead' },  // 자연광
      { cct: 4000, area: 'cheek_left' }, // 형광등
      { cct: 4800, area: 'cheek_right' }
    ],
    expectedMixed: true,
    expectedSources: 2,
    expectedTypes: ['natural', 'fluorescent']
  },

  // 3개+ 광원 (복잡한 환경)
  complexMixed: {
    zones: [
      { cct: 6500, area: 'forehead' },  // LED
      { cct: 4000, area: 'cheek_left' }, // 형광등
      { cct: 2700, area: 'cheek_right' } // 백열등
    ],
    expectedMixed: true,
    expectedSources: 3,
    expectedConfidencePenalty: 0.25
  }
};

// 역광 테스트 이미지
export const backlightTestImages = {
  // 강한 역광
  severe: {
    path: 'fixtures/lighting/backlight-severe.jpg',
    faceAvgBrightness: 80,
    backgroundAvgBrightness: 220,
    expectedRatio: 2.75,
    expectedDecision: 'reject'
  },

  // 약한 역광
  mild: {
    path: 'fixtures/lighting/backlight-mild.jpg',
    faceAvgBrightness: 120,
    backgroundAvgBrightness: 180,
    expectedRatio: 1.5,
    expectedDecision: 'warning'
  },

  // 정상 (역광 없음)
  normal: {
    path: 'fixtures/lighting/normal-lighting.jpg',
    faceAvgBrightness: 150,
    backgroundAvgBrightness: 140,
    expectedRatio: 0.93,
    expectedDecision: 'pass'
  }
};

// CCT 품질 경계값 테스트
export const cctBoundaryTests = [
  { cct: 2499, expectedQuality: 'reject', message: '극단적 저온' },
  { cct: 2500, expectedQuality: 'reject', message: '저온 경계' },
  { cct: 2999, expectedQuality: 'reject', message: '저온 상한' },
  { cct: 3000, expectedQuality: 'poor', message: 'poor 하한' },
  { cct: 3999, expectedQuality: 'poor', message: 'poor 상한' },
  { cct: 4000, expectedQuality: 'good', message: 'good 하한' },
  { cct: 4999, expectedQuality: 'good', message: 'good 상한 (하단)' },
  { cct: 5000, expectedQuality: 'optimal', message: 'optimal 하한' },
  { cct: 6500, expectedQuality: 'optimal', message: 'D65 표준' },
  { cct: 7500, expectedQuality: 'optimal', message: 'optimal 상한' },
  { cct: 7501, expectedQuality: 'good', message: 'good 상한 (상단)' },
  { cct: 9000, expectedQuality: 'good', message: 'good 상한' },
  { cct: 10000, expectedQuality: 'poor', message: 'poor 하한 (상단)' },
  { cct: 10001, expectedQuality: 'reject', message: '극단적 고온' }
];
```

---

## 10. 기존 테스트 케이스

### 10.1 단위 테스트

```typescript
describe('CIE-4 Lighting Analysis', () => {
  describe('CCT Estimation', () => {
    it('should estimate D65 white as ~6500K', () => {
      const whiteImage = createTestImage({ r: 255, g: 255, b: 255 });
      const result = estimateCCT(whiteImage);

      expect(result.cct).toBeGreaterThan(6000);
      expect(result.cct).toBeLessThan(7000);
      expect(result.quality).toBe('optimal');
    });

    it('should detect warm light (<3000K) as reject', () => {
      const warmImage = createTestImage({ r: 255, g: 180, b: 100 });
      const result = estimateCCT(warmImage);

      expect(result.cct).toBeLessThan(3500);
      expect(result.quality).toBe('poor');
    });

    it('should classify CCT quality correctly', () => {
      expect(getCCTQuality(5500)).toBe('optimal');
      expect(getCCTQuality(4700)).toBe('good');
      expect(getCCTQuality(3500)).toBe('poor');
      expect(getCCTQuality(2000)).toBe('reject');
    });
  });

  describe('Uniformity Analysis', () => {
    it('should return high score for uniform lighting', () => {
      const uniformZones = {
        leftForehead: 150, rightForehead: 152,
        leftCheek: 148, rightCheek: 150,
        leftJaw: 149, rightJaw: 151,
      };
      const result = analyzeUniformityFromZones(uniformZones);

      expect(result.score).toBeGreaterThan(90);
      expect(result.isAcceptable).toBe(true);
    });

    it('should return low score for uneven lighting', () => {
      const unevenZones = {
        leftForehead: 200, rightForehead: 100,
        leftCheek: 180, rightCheek: 90,
        leftJaw: 170, rightJaw: 85,
      };
      const result = analyzeUniformityFromZones(unevenZones);

      expect(result.score).toBeLessThan(50);
      expect(result.isAcceptable).toBe(false);
    });
  });

  describe('Shadow Detection', () => {
    it('should detect no shadow when left/right are balanced', () => {
      const balancedZones = {
        leftForehead: 150, rightForehead: 150,
        leftCheek: 140, rightCheek: 140,
        leftJaw: 130, rightJaw: 130,
      };
      const result = detectShadow(balancedZones);

      expect(result.hasShadow).toBe(false);
      expect(result.severity).toBe('none');
    });

    it('should detect severe shadow with >20% asymmetry', () => {
      const asymmetricZones = {
        leftForehead: 200, rightForehead: 140,
        leftCheek: 190, rightCheek: 130,
        leftJaw: 180, rightJaw: 120,
      };
      const result = detectShadow(asymmetricZones);

      expect(result.hasShadow).toBe(true);
      expect(result.severity).toBe('severe');
      expect(result.lightDirection).toBe('left');
    });
  });
});
```

### 9.2 통합 테스트

```typescript
describe('CIE-4 Integration', () => {
  it('should integrate with CIE pipeline', async () => {
    const testImage = loadTestImage('portrait-natural-light.jpg');

    // CIE-1: 품질 검증
    const cie1Result = await validateImageQuality(testImage);
    expect(cie1Result.isAcceptable).toBe(true);

    // CIE-2: 랜드마크 추출
    const cie2Result = await extractLandmarks(cie1Result.imageData);
    expect(cie2Result.landmarks).toBeDefined();

    // CIE-3: 화이트밸런스 보정
    const cie3Result = await correctWhiteBalance(
      cie2Result.imageData,
      cie2Result.skinMask
    );

    // CIE-4: 조명 분석
    const cie4Result = await analyzeLighting({
      imageData: cie3Result.correctedImageData,
      faceLandmarks: cie2Result.landmarks,
    });

    expect(cie4Result.processingTime).toBeLessThan(100);
    expect(cie4Result.confidence).toBeGreaterThan(0);
    expect(cie4Result.feedback).toBeTruthy();
  });

  it('should propagate confidence to final analysis', async () => {
    const testImage = loadTestImage('portrait-shadow.jpg');
    const cie4Result = await analyzeLighting({ imageData: testImage });

    // 그림자가 있는 이미지는 confidence가 낮아야 함
    expect(cie4Result.shadow.hasShadow).toBe(true);
    expect(cie4Result.confidence).toBeLessThan(0.8);
  });
});
```

---

## 10. 구현 우선순위

### Phase 1 (MVP): 기본 조명 분석

```
1. CIE4-1: sRGB to xy 변환 유틸리티
2. CIE4-2: McCamy CCT 추정
3. CIE4-4: Y 채널 밝기 계산 (단순화된 4분할)
4. CIE4-5: 균일성 분석
5. CIE4-6: 그림자 감지
6. CIE4-7: 통합 분석 함수 (기본 버전)
```

### Phase 2: 랜드마크 통합

```
7. CIE4-3: 6-Zone 영역 추출 (MediaPipe 랜드마크 연동)
8. CIE4-7: 통합 분석 함수 (랜드마크 버전)
```

### Phase 3: UI 및 고급 기능

```
9. LightingGuide 컴포넌트
10. CCTIndicator 컴포넌트
11. LightDirectionGuide 컴포넌트
12. 실시간 프리뷰 피드백 (향후)
```

---

## 11. 리스크 및 완화

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| McCamy 공식 정확도 한계 | 중간 | 중간 | Robertson 방법 도입 검토, Duv로 신뢰도 조절 |
| 혼합 조명 감지 어려움 | 높음 | 중간 | 영역별 CCT 분산으로 혼합 조명 추정 |
| 랜드마크 없이 정확도 저하 | 높음 | 낮음 | 단순화된 4분할 분석으로 폴백 |
| 성능 (실시간 처리) | 낮음 | 중간 | Web Worker 분리, 다운샘플링 적용 |
| 브라우저 호환성 | 낮음 | 낮음 | Canvas API 표준 사용, 폴리필 검토 |

---

## 11A. 성능 SLA (Performance SLA)

> **신규 섹션**: 성능 목표 및 최적화 전략 상세화

### 11A.1 전체 파이프라인 SLA

> **지표 정의**
> - **목표 (p95)**: 95%의 요청이 이 시간 내에 완료되어야 함
> - **경고**: 이 시간 초과 시 알림 발생
> - **심각**: 이 시간 초과 시 분석 단순화 또는 에러

| 지표 | 목표 (p95) | 경고 | 심각 | 측정 방법 |
|------|-----------|------|------|----------|
| 조명 분석 전체 시간 | < 150ms | > 200ms | > 300ms | 입력→조명 품질 판정 |
| 6존 영역 추출 | < 100ms | > 150ms | > 200ms | 랜드마크 기반 분할 |
| 존별 CCT 추정 | < 50ms | > 80ms | > 120ms | 각 존 McCamy 계산 |
| 균일성 분석 | < 50ms | > 80ms | > 120ms | 6존 분산 계산 |
| 그림자 감지 | < 100ms | > 150ms | > 200ms | 경계 기반 분석 |
| 하이라이트 감지 | < 30ms | > 50ms | > 80ms | 밝기 임계값 분석 |
| 품질 판정 | < 20ms | > 30ms | > 50ms | 종합 점수 계산 |

### 11A.2 원자(ATOM)별 Micro SLA

| ATOM ID | 작업 | 목표 시간 | 병목 가능성 | 비고 |
|---------|------|----------|-------------|------|
| CIE4-1 | 6존 ROI 정의 | < 30ms | 낮음 | 랜드마크 기반 좌표 계산 |
| CIE4-2 | 존별 평균 RGB 계산 | < 50ms | 중간 | 6존 병렬 처리 가능 |
| CIE4-3 | RGB → xy 변환 | < 20ms | 낮음 | 매트릭스 연산 |
| CIE4-4 | McCamy CCT 추정 | < 50ms | 중간 | 6존 순회 |
| CIE4-5 | CCT 균일성 계산 | < 30ms | 낮음 | 표준편차 계산 |
| CIE4-6 | 그림자 경계 감지 | < 100ms | **높음** | 에지 검출 + 영역 분석 |
| CIE4-7 | 하이라이트 감지 | < 30ms | 낮음 | 밝기 임계값 |
| CIE4-8 | Duv 거리 계산 | < 20ms | 낮음 | 흑체 궤적 거리 |
| CIE4-9 | 혼합 조명 판정 | < 20ms | 낮음 | CCT 분산 기반 |
| CIE4-10 | 품질 점수 산출 | < 20ms | 낮음 | 가중 평균 |
| CIE4-11 | 가이드 메시지 생성 | < 10ms | 낮음 | 조건 분기 |
| CIE4-12 | 파이프라인 통합 | < 150ms | - | 전체 합계 |

### 11A.3 캐싱 전략

| 캐시 대상 | TTL | 무효화 조건 | 기대 효과 |
|----------|-----|------------|----------|
| 6존 ROI 좌표 | 동일 요청 내 | 새 이미지 입력 | -30ms |
| 흑체 궤적 룩업 테이블 | 상수 | 없음 (고정값) | -10ms |
| McCamy 계수 | 상수 | 없음 (고정값) | 초기화 비용 0 |
| 그림자 감지 임계값 | 24시간 | 알고리즘 변경 | -5ms |
| 조명 품질 기준 테이블 | 24시간 | 기준 업데이트 | -5ms |

### 11A.4 병렬화 전략

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CIE-4 병렬 처리 파이프라인                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [이미지 입력 + 랜드마크]                                            │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                           │
│  │   6존 ROI 정의 - 30ms               │                           │
│  │   • 이마, 좌볼, 우볼, 코, 턱, 턱선   │                           │
│  └─────────────────────────────────────┘                           │
│       │                                                             │
│       ▼                                                             │
│  ┌───────────┬───────────┬───────────┐                              │
│  │   존 1-2  │   존 3-4  │   존 5-6  │  ◄── 병렬 처리               │
│  │   ~35ms   │   ~35ms   │   ~35ms   │                              │
│  └───────────┴───────────┴───────────┘                              │
│       │                                                             │
│       ▼                                                             │
│  ┌───────────────────┬───────────────────┐                          │
│  │   균일성 분석     │   그림자/하이라이트 │  ◄── 병렬 실행          │
│  │      ~30ms        │       ~100ms       │                          │
│  └───────────────────┴───────────────────┘                          │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────────────────────────┐                           │
│  │   후처리 (직렬) - 30ms              │                           │
│  │   • 혼합 조명 판정                   │                           │
│  │   • 품질 점수 산출                   │                           │
│  │   • 가이드 메시지 생성               │                           │
│  └─────────────────────────────────────┘                           │
│       │                                                             │
│       ▼                                                             │
│  [조명 품질 결과 반환]                                               │
│                                                                     │
│  총 예상 시간: 30 + 35 + max(30, 100) + 30 ≈ 195ms → 병렬로 ~130ms   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| 병렬 그룹 | 포함 작업 | 예상 시간 | 기대 효과 |
|----------|----------|----------|----------|
| **존별 분석** | 6존 RGB/CCT 계산 | 105ms → 35ms | 3배 속도 향상 |
| **품질 분석** | 균일성 + 그림자/하이라이트 | 130ms → 100ms | 병렬 처리 |

### 11A.5 해상도별 성능 예상

| 해상도 | 6존 추출 | CCT 계산 | 그림자 감지 | 총 시간 |
|--------|----------|----------|------------|---------|
| 320×240 | ~30ms | ~20ms | ~40ms | ~100ms |
| 640×480 | ~50ms | ~40ms | ~80ms | ~180ms |
| 1280×720 | ~100ms | ~80ms | ~150ms | ~350ms |
| 1920×1080 | ~200ms | ~150ms | ~280ms | ~650ms |

> **권장**: 1280×720 이상 이미지는 640×480으로 다운샘플링 후 분석

### 11A.6 타임아웃 및 Fallback 정책

```typescript
// apps/web/lib/image-engine/cie-4/config.ts

export const CIE4_TIMEOUT_CONFIG = {
  // 전체 조명 분석 타임아웃
  totalTimeout: 300,            // 300ms (심각 임계값)

  // 개별 단계 타임아웃
  zoneExtraction: 100,          // 6존 추출
  cctEstimation: 80,            // CCT 추정
  uniformityAnalysis: 80,       // 균일성 분석
  shadowDetection: 150,         // 그림자 감지
  qualityAssessment: 50,        // 품질 판정

  // Fallback 전략
  fallbackBehavior: {
    onTimeout: 'simplify',      // 타임아웃 시 단순화된 분석
    onError: 'passthrough',     // 에러 시 "측정 불가" 반환
    logLevel: 'warn',
  },

  // 단순화된 분석 (랜드마크 없이)
  simplifiedAnalysis: {
    zones: 4,                   // 6존 → 4분할
    skipShadowDetection: true,  // 그림자 감지 생략
    skipMixedLightDetection: true,
  },

  // 다운샘플링 설정
  downsampling: {
    maxWidth: 640,
    maxHeight: 480,
    enableForHighRes: true,
  },
};

// 조명 품질 등급별 다운스트림 처리
export const LIGHTING_QUALITY_ACTIONS = {
  optimal: {
    proceedWithAnalysis: true,
    applyCorrection: false,     // 보정 불필요
    showGuide: false,
  },
  acceptable: {
    proceedWithAnalysis: true,
    applyCorrection: true,      // CIE-3 AWB 적용
    showGuide: false,
  },
  suboptimal: {
    proceedWithAnalysis: true,
    applyCorrection: true,
    showGuide: true,            // 재촬영 가이드 표시
    guideLevel: 'suggestion',
  },
  poor: {
    proceedWithAnalysis: false, // 분석 중단 권장
    applyCorrection: true,
    showGuide: true,
    guideLevel: 'warning',
    message: '조명이 적합하지 않습니다. 밝은 곳으로 이동 후 다시 촬영해주세요.',
  },
};
```

---

## 12. 관련 문서

| 문서 | 설명 |
|------|------|
| [ADR-001](../adr/ADR-001-core-image-engine.md) | Core Image Engine 아키텍처 |
| [SDD-CIE-3](./SDD-CIE-3-AWB-CORRECTION.md) | 화이트밸런스 보정 스펙 |
| [image-processing.md](../principles/image-processing.md) | 이미지 처리 원리 |
| [color-science.md](../principles/color-science.md) | 색채학 원리 |
| [ADR-026](../adr/ADR-026-color-space-hsl-decision.md) | HSL 색공간 결정 |
| [ADR-033](../adr/ADR-033-face-detection-library.md) | 얼굴 감지 라이브러리 선택 |

---

## 13. Mock 데이터 예시

### 13.1 CCT 추정 Mock

```typescript
// tests/mocks/cie-4-mock-data.ts

/**
 * 자연광 (최적) 환경 Mock
 */
export const NATURAL_LIGHT_CCT_MOCK: CCTMockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 190,
      avgG: 188,
      avgB: 185,
    }),
    faceRegion: { x: 160, y: 80, width: 320, height: 320 },
  },
  expected: {
    cct: 5800,
    quality: 'optimal',
    xyCoordinates: { x: 0.3240, y: 0.3380 },
    confidence: 0.92,
  },
};

/**
 * 백열등 (따뜻한) 환경 Mock
 */
export const INCANDESCENT_CCT_MOCK: CCTMockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 220,
      avgG: 175,
      avgB: 130,
    }),
    faceRegion: { x: 160, y: 80, width: 320, height: 320 },
  },
  expected: {
    cct: 2900,
    quality: 'poor',
    xyCoordinates: { x: 0.4328, y: 0.4033 },
    confidence: 0.78,
  },
};

/**
 * 형광등 (차가운) 환경 Mock
 */
export const FLUORESCENT_CCT_MOCK: CCTMockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 175,
      avgG: 190,
      avgB: 210,
    }),
    faceRegion: { x: 160, y: 80, width: 320, height: 320 },
  },
  expected: {
    cct: 7200,
    quality: 'acceptable',
    xyCoordinates: { x: 0.3020, y: 0.3180 },
    confidence: 0.82,
  },
};

/**
 * 극단적 따뜻한 조명 (촛불) Mock - 거부
 */
export const CANDLE_CCT_MOCK: CCTMockData = {
  input: {
    imageData: createMockImageData({
      width: 640,
      height: 480,
      avgR: 255,
      avgG: 150,
      avgB: 50,
    }),
    faceRegion: { x: 160, y: 80, width: 320, height: 320 },
  },
  expected: {
    cct: 1900,
    quality: 'reject',
    xyCoordinates: { x: 0.5120, y: 0.4180 },
    confidence: 0.45,
  },
};
```

### 13.2 균일성 분석 Mock

```typescript
/**
 * 균일한 조명 환경 Mock
 */
export const UNIFORM_LIGHTING_MOCK: UniformityMockData = {
  input: {
    zoneValues: {
      leftForehead: 150,
      rightForehead: 152,
      leftCheek: 148,
      rightCheek: 150,
      leftJaw: 149,
      rightJaw: 151,
    },
  },
  expected: {
    score: 97,
    variance: 1.41,
    isAcceptable: true,
    feedback: '조명이 고르게 분포되어 있습니다.',
  },
};

/**
 * 불균일한 조명 (이마만 밝음) Mock
 */
export const FOREHEAD_BRIGHT_MOCK: UniformityMockData = {
  input: {
    zoneValues: {
      leftForehead: 200,
      rightForehead: 195,
      leftCheek: 130,
      rightCheek: 125,
      leftJaw: 100,
      rightJaw: 105,
    },
  },
  expected: {
    score: 42,
    variance: 41.2,
    isAcceptable: false,
    feedback: '왼쪽 턱과(와) 왼쪽 이마의 밝기 차이가 큽니다. 정면 조명을 사용해 주세요.',
  },
};

/**
 * 부분적으로 불균일 Mock
 */
export const PARTIAL_UNEVEN_MOCK: UniformityMockData = {
  input: {
    zoneValues: {
      leftForehead: 160,
      rightForehead: 155,
      leftCheek: 140,
      rightCheek: 142,
      leftJaw: 130,
      rightJaw: 135,
    },
  },
  expected: {
    score: 78,
    variance: 11.5,
    isAcceptable: true,
    feedback: '왼쪽 턱 부분이 약간 어둡습니다. 조명을 조금 조절해 주세요.',
  },
};
```

### 13.3 그림자 감지 Mock

```typescript
/**
 * 그림자 없음 (균형 잡힌 조명) Mock
 */
export const NO_SHADOW_MOCK: ShadowMockData = {
  input: {
    zoneValues: {
      leftForehead: 150,
      rightForehead: 150,
      leftCheek: 140,
      rightCheek: 140,
      leftJaw: 130,
      rightJaw: 130,
    },
  },
  expected: {
    hasShadow: false,
    severity: 'none',
    asymmetryPercent: 0,
    shadowBoundaryStrength: 5,
    lightDirection: 'balanced',
    shadowPosition: 'none',
    feedback: '조명이 균형있게 분포되어 있습니다.',
  },
};

/**
 * 경미한 그림자 (왼쪽 조명) Mock
 */
export const MILD_SHADOW_LEFT_MOCK: ShadowMockData = {
  input: {
    zoneValues: {
      leftForehead: 170,
      rightForehead: 155,
      leftCheek: 165,
      rightCheek: 150,
      leftJaw: 160,
      rightJaw: 145,
    },
  },
  expected: {
    hasShadow: true,
    severity: 'mild',
    asymmetryPercent: 8.5,
    shadowBoundaryStrength: 18,
    lightDirection: 'left',
    shadowPosition: 'right',
    feedback: '얼굴에 약간의 그림자가 있습니다. 오른쪽으로 살짝 이동하거나 정면을 향해 주세요.',
  },
};

/**
 * 심각한 그림자 (오른쪽 조명) Mock
 */
export const SEVERE_SHADOW_RIGHT_MOCK: ShadowMockData = {
  input: {
    zoneValues: {
      leftForehead: 100,
      rightForehead: 180,
      leftCheek: 90,
      rightCheek: 175,
      leftJaw: 85,
      rightJaw: 170,
    },
  },
  expected: {
    hasShadow: true,
    severity: 'severe',
    asymmetryPercent: 42.5,
    shadowBoundaryStrength: 65,
    lightDirection: 'right',
    shadowPosition: 'left',
    feedback: '얼굴에 강한 그림자가 있습니다. 정면 조명 환경에서 다시 촬영해 주세요.',
  },
};
```

### 13.4 통합 조명 분석 Mock

```typescript
/**
 * 최적 환경 Mock
 */
export const OPTIMAL_LIGHTING_MOCK: LightingAnalysisMockData = {
  input: {
    imageData: createMockImageData({ avgR: 190, avgG: 188, avgB: 185 }),
    faceLandmarks: generateMockLandmarks(640, 480),
    faceRegion: { x: 160, y: 80, width: 320, height: 320 },
  },
  expected: {
    cct: {
      cct: 5800,
      quality: 'optimal',
      confidence: 0.92,
    },
    uniformity: {
      score: 95,
      isAcceptable: true,
    },
    shadow: {
      hasShadow: false,
      severity: 'none',
    },
    overallScore: 94,
    isAcceptable: true,
    confidence: 0.91,
    primaryIssue: null,
    feedback: '조명 상태가 양호합니다. 분석을 진행할 수 있습니다.',
    processingTime: 35, // ms
  },
};

/**
 * 문제 있는 환경 (따뜻한 조명 + 그림자) Mock
 */
export const PROBLEMATIC_LIGHTING_MOCK: LightingAnalysisMockData = {
  input: {
    imageData: createMockImageData({ avgR: 220, avgG: 175, avgB: 130 }),
    faceLandmarks: generateMockLandmarks(640, 480),
    faceRegion: { x: 160, y: 80, width: 320, height: 320 },
  },
  expected: {
    cct: {
      cct: 2900,
      quality: 'poor',
      confidence: 0.65,
    },
    uniformity: {
      score: 72,
      isAcceptable: true,
    },
    shadow: {
      hasShadow: true,
      severity: 'moderate',
    },
    overallScore: 52,
    isAcceptable: true, // 분석은 가능하나 경고
    confidence: 0.58,
    primaryIssue: 'cct_warm',
    feedback: '조명이 다소 따뜻합니다. 가능하면 자연광 환경에서 촬영해 주세요.',
    processingTime: 42,
  },
};

/**
 * 거부 환경 (극단적 조명) Mock
 */
export const REJECT_LIGHTING_MOCK: LightingAnalysisMockData = {
  input: {
    imageData: createMockImageData({ avgR: 255, avgG: 150, avgB: 50 }),
    faceLandmarks: generateMockLandmarks(640, 480),
    faceRegion: { x: 160, y: 80, width: 320, height: 320 },
  },
  expected: {
    cct: {
      cct: 1900,
      quality: 'reject',
      confidence: 0.35,
    },
    uniformity: {
      score: 45,
      isAcceptable: false,
    },
    shadow: {
      hasShadow: true,
      severity: 'severe',
    },
    overallScore: 25,
    isAcceptable: false, // 분석 거부
    confidence: 0.28,
    primaryIssue: 'cct_too_warm',
    feedback: '조명이 너무 따뜻합니다 (붉은빛). 자연광 환경으로 이동해 주세요.',
    processingTime: 38,
  },
};
```

### 13.5 Mock 타입 정의

```typescript
// lib/cie/cie4/mock/types.ts

import {
  CCTEstimationResult,
  UniformityResult,
  ShadowDetectionResult,
  LightingAnalysisOutput,
  ZoneValues,
} from '../types';

/**
 * CCT Mock 데이터 타입
 * 색온도 범위: 2700K~6500K (권장), 1000K~25000K (전체)
 */
export interface CCTMockData {
  input: {
    imageData: ImageData;
    faceRegion?: DOMRect;
  };
  expected: CCTEstimationResult;
}

/**
 * 균일성 분석 Mock 데이터 타입
 */
export interface UniformityMockData {
  input: {
    zoneValues: ZoneValues;
  };
  expected: Omit<UniformityResult, 'zoneValues'>;
}

/**
 * 그림자 감지 Mock 데이터 타입
 */
export interface ShadowMockData {
  input: {
    zoneValues: ZoneValues;
    imageData?: ImageData;
    faceRegion?: DOMRect;
  };
  expected: ShadowDetectionResult;
}

/**
 * 통합 조명 분석 Mock 데이터 타입
 */
export interface LightingAnalysisMockData {
  input: {
    imageData: ImageData;
    faceLandmarks?: FaceLandmarks;
    faceRegion?: DOMRect;
    config?: Partial<LightingAnalysisConfig>;
  };
  expected: LightingAnalysisOutput;
}

/**
 * 조명 분석 설정 타입
 */
export interface LightingAnalysisConfig {
  sensitivityCoefficient: number;  // 균일성 감도 계수 (기본: 2.0)
  shadowThreshold: number;         // 그림자 감지 임계값 (기본: 5%)
  enableEdgeDetection: boolean;    // Edge Detection 활성화 (기본: true)
  cctRange: { min: number; max: number }; // CCT 허용 범위 (2700~6500K 권장)
}

/**
 * Fallback Mock 생성기 타입
 */
export interface FallbackMockGenerator {
  generateDefaultCCT(): CCTEstimationResult;
  generateDefaultUniformity(): UniformityResult;
  generateDefaultShadow(): ShadowDetectionResult;
  generateFallbackOutput(reason: string): LightingAnalysisOutput;
}
```

### 13.6 Fallback Mock

```typescript
// lib/cie/cie4/mock/fallback.ts

/**
 * AI 타임아웃 시 사용되는 Fallback Mock
 */
export const CIE4_FALLBACK_MOCK: LightingAnalysisOutput = {
  cct: {
    cct: 5500,              // 자연광 근사값
    quality: 'acceptable',
    xyCoordinates: { x: 0.3240, y: 0.3380 },
    confidence: 0.5,        // 낮은 신뢰도
  },
  uniformity: {
    score: 70,
    zoneValues: {
      leftForehead: 140,
      rightForehead: 140,
      leftCheek: 140,
      rightCheek: 140,
      leftJaw: 140,
      rightJaw: 140,
    },
    variance: 0,
    isAcceptable: true,
    feedback: '조명 분석이 제한적입니다. 결과 참고용으로만 사용하세요.',
  },
  shadow: {
    hasShadow: false,
    severity: 'none',
    asymmetryPercent: 0,
    shadowBoundaryStrength: 0,
    lightDirection: 'balanced',
    shadowPosition: 'none',
    feedback: '',
  },
  overallScore: 65,
  isAcceptable: true,
  confidence: 0.5,
  primaryIssue: null,
  feedback: '조명 분석이 제한적으로 수행되었습니다. 분석은 진행되나 결과 신뢰도가 낮을 수 있습니다.',
  processingTime: 0,
  usedFallback: true,
  fallbackReason: 'Analysis timeout or error',
};

/**
 * Fallback Mock 생성 함수
 */
export function generateCIE4FallbackMock(
  reason: 'timeout' | 'error' | 'no_face' = 'timeout'
): LightingAnalysisOutput {
  const base = { ...CIE4_FALLBACK_MOCK };

  const messages: Record<string, string> = {
    timeout: '조명 분석 시간이 초과되었습니다. 기본값이 적용됩니다.',
    error: '조명 분석 중 오류가 발생했습니다. 기본값이 적용됩니다.',
    no_face: '얼굴을 감지하지 못했습니다. 전체 이미지 기준으로 분석됩니다.',
  };

  base.fallbackReason = messages[reason];
  return base;
}
```

### 13.7 테스트 케이스 테이블

| ID | 시나리오 | 입력 Mock | 기대 출력 | 검증 포인트 |
|----|----------|----------|----------|------------|
| CIE4-T-01 | 자연광 최적 | `NATURAL_LIGHT_CCT_MOCK` | CCT 5800K, quality=optimal | CCT 5000-6500K 범위 |
| CIE4-T-02 | 백열등 따뜻함 | `INCANDESCENT_CCT_MOCK` | CCT 2900K, quality=poor | quality='poor' 판정 |
| CIE4-T-03 | 형광등 차가움 | `FLUORESCENT_CCT_MOCK` | CCT 7200K, quality=acceptable | 보정 필요 경고 |
| CIE4-T-04 | 촛불 거부 | `CANDLE_CCT_MOCK` | CCT 1900K, quality=reject | isAcceptable=false |
| CIE4-T-05 | 균일 조명 | `UNIFORM_LIGHTING_MOCK` | score=97, variance<2 | 분산 최소 |
| CIE4-T-06 | 이마만 밝음 | `FOREHEAD_BRIGHT_MOCK` | score<50, isAcceptable=false | 불균일 감지 |
| CIE4-T-07 | 부분 불균일 | `PARTIAL_UNEVEN_MOCK` | score=78, isAcceptable=true | 경고 표시 |
| CIE4-T-08 | 그림자 없음 | `NO_SHADOW_MOCK` | hasShadow=false, SBS<10 | 균형 조명 |
| CIE4-T-09 | 경미한 그림자 | `MILD_SHADOW_LEFT_MOCK` | severity=mild, SBS 10-25 | 방향 감지 정확 |
| CIE4-T-10 | 심각한 그림자 | `SEVERE_SHADOW_RIGHT_MOCK` | severity=severe, SBS>50 | 재촬영 필수 |
| CIE4-T-11 | 통합 최적 | `OPTIMAL_LIGHTING_MOCK` | overallScore>90, isAcceptable=true | 전체 통과 |
| CIE4-T-12 | 통합 문제 | `PROBLEMATIC_LIGHTING_MOCK` | overallScore<60, 경고 표시 | 다중 이슈 감지 |
| CIE4-T-13 | 통합 거부 | `REJECT_LIGHTING_MOCK` | isAcceptable=false | 분석 거부 |
| CIE4-T-14 | Fallback | 타임아웃 시뮬레이션 | `CIE4_FALLBACK_MOCK` | usedFallback=true |
| CIE4-T-15 | 랜드마크 없음 | faceLandmarks=undefined | 4분할 폴백 사용 | 에러 없이 분석 |

### 13.7 한국 실내 환경 조명 특성 Mock

> 한국 가정/사무실의 일반적인 조명 환경 분석 결과 Mock 데이터

```typescript
// tests/mocks/cie-4-korean-environments.ts

/**
 * 한국 실내 환경별 조명 특성
 *
 * 특징:
 * - 천장 조명 위주 (다운라이트 보다 전체 조명)
 * - 형광등/LED 주로 사용 (백열등 드묾)
 * - 거실/방 분리 조명 (거실=밝음, 방=어두움)
 */

// 한국 가정 조명 환경 분석 결과
export const KOREAN_HOME_LIGHTING_ANALYSIS = {
  // 거실 천장 형광등 (주광색)
  livingRoom_fluorescent: {
    scenario: 'korean_living_daylight_fl',
    description: '거실 천장 형광등 (6500K)',
    cctAnalysis: {
      avgCct: 6500,
      zoneVariance: 150,        // 비교적 균일
      quality: 'acceptable' as const,
    },
    uniformityAnalysis: {
      score: 85,
      isAcceptable: true,
      brightnessRatio: 0.92,    // 이마/턱 비율 (천장 조명)
    },
    shadowAnalysis: {
      hasShadow: false,
      severity: null,
      direction: null,
      sbs: 8,
    },
    overall: {
      score: 78,
      quality: 'acceptable',
      recommendation: 'CIE-3 AWB 보정 적용 후 분석 진행',
    },
    koreanNote: '가장 흔한 한국 가정 조명. 푸른빛으로 피부 창백해 보임',
  },

  // 방 LED 조명 (주백색)
  bedroom_led: {
    scenario: 'korean_bedroom_led',
    description: '방 LED 조명 (4000K)',
    cctAnalysis: {
      avgCct: 4000,
      zoneVariance: 200,
      quality: 'acceptable' as const,
    },
    uniformityAnalysis: {
      score: 80,
      isAcceptable: true,
      brightnessRatio: 0.88,
    },
    shadowAnalysis: {
      hasShadow: true,
      severity: 'mild' as const,
      direction: 'top',         // 천장 조명 특성
      sbs: 18,
    },
    overall: {
      score: 72,
      quality: 'acceptable',
      recommendation: '그림자 보정 권장',
    },
  },

  // 화장대 조명 (최적)
  vanity_mirror: {
    scenario: 'korean_vanity_optimal',
    description: '화장대 좌우 조명 (5000K)',
    cctAnalysis: {
      avgCct: 5000,
      zoneVariance: 80,         // 매우 균일
      quality: 'optimal' as const,
    },
    uniformityAnalysis: {
      score: 95,
      isAcceptable: true,
      brightnessRatio: 0.98,    // 좌우 균형
    },
    shadowAnalysis: {
      hasShadow: false,
      severity: null,
      direction: null,
      sbs: 5,
    },
    overall: {
      score: 93,
      quality: 'optimal',
      recommendation: '최적 조명 환경. 보정 불필요',
    },
    koreanNote: '셀카/분석에 가장 이상적인 조명',
  },

  // 원룸 천장 단일 조명
  studio_single: {
    scenario: 'korean_studio_single',
    description: '원룸 천장 단일 LED (5500K)',
    cctAnalysis: {
      avgCct: 5500,
      zoneVariance: 180,
      quality: 'acceptable' as const,
    },
    uniformityAnalysis: {
      score: 70,
      isAcceptable: true,
      brightnessRatio: 0.75,    // 이마 밝음, 턱 어두움
    },
    shadowAnalysis: {
      hasShadow: true,
      severity: 'mild' as const,
      direction: 'top',
      sbs: 22,
    },
    overall: {
      score: 65,
      quality: 'suboptimal',
      recommendation: '얼굴을 약간 들어 조명 쪽으로 향하세요',
    },
  },
};

// 한국 사무실/공공장소 조명 환경
export const KOREAN_OFFICE_LIGHTING_ANALYSIS = {
  // 사무실 천장 형광등
  office_ceiling: {
    scenario: 'korean_office_ceiling',
    description: '사무실 천장 형광등 배열 (6500K)',
    cctAnalysis: {
      avgCct: 6500,
      zoneVariance: 100,        // 균일한 배열
      quality: 'acceptable' as const,
    },
    uniformityAnalysis: {
      score: 88,
      isAcceptable: true,
      brightnessRatio: 0.95,
    },
    shadowAnalysis: {
      hasShadow: false,
      severity: null,
      direction: null,
      sbs: 6,
    },
    overall: {
      score: 75,
      quality: 'acceptable',
      recommendation: 'AWB 보정으로 푸른빛 제거 필요',
    },
    koreanNote: '화상 회의 시 피부가 창백해 보이는 주 원인',
  },

  // 카페 (간접 조명 + 자연광)
  cafe_mixed: {
    scenario: 'korean_cafe_mixed',
    description: '카페 간접조명 + 창문 자연광',
    cctAnalysis: {
      avgCct: 4200,             // 혼합 평균
      zoneVariance: 800,        // 높은 분산 (혼합 조명)
      quality: 'suboptimal' as const,
      isMixed: true,
    },
    uniformityAnalysis: {
      score: 55,
      isAcceptable: false,
      brightnessRatio: 0.65,    // 창가 쪽 밝음
    },
    shadowAnalysis: {
      hasShadow: true,
      severity: 'moderate' as const,
      direction: 'side',        // 창문 방향
      sbs: 35,
    },
    overall: {
      score: 48,
      quality: 'poor',
      recommendation: '혼합 조명으로 정확한 분석 어려움. 창문 반대쪽으로 이동하세요',
    },
    koreanNote: '인스타 셀카용으로 인기지만 분석에는 부적합',
  },

  // 지하철/지하상가 (형광등 강함)
  subway_underground: {
    scenario: 'korean_subway_fl',
    description: '지하철/지하상가 형광등',
    cctAnalysis: {
      avgCct: 7000,             // 매우 차가움
      zoneVariance: 300,
      quality: 'poor' as const,
    },
    uniformityAnalysis: {
      score: 60,
      isAcceptable: false,
      brightnessRatio: 0.70,
    },
    shadowAnalysis: {
      hasShadow: true,
      severity: 'moderate' as const,
      direction: 'top',
      sbs: 28,
    },
    overall: {
      score: 40,
      quality: 'poor',
      recommendation: '조명이 적합하지 않습니다. 자연광 환경에서 촬영해주세요',
    },
    koreanNote: '푸른빛 형광등으로 피부색 왜곡 심함',
  },
};

// 시간대별 창문 조명 영향 (한국 아파트 기준)
export const KOREAN_WINDOW_LIGHT_TIMES = {
  // 아침 - 동향 베란다
  morning_east: {
    time: '07:00-10:00',
    scenario: 'morning_east_window',
    description: '아침 동향 베란다 (창문 옆)',
    cctAnalysis: {
      avgCct: 5800,             // 아침 햇빛
      zoneVariance: 400,        // 창가 쪽 밝음
      quality: 'acceptable' as const,
    },
    uniformityAnalysis: {
      score: 65,
      brightnessRatio: 0.60,    // 한쪽 밝음
    },
    shadowAnalysis: {
      hasShadow: true,
      severity: 'mild' as const,
      direction: 'side',
      sbs: 25,
    },
    overall: {
      score: 62,
      quality: 'suboptimal',
      recommendation: '창문 정면으로 서서 촬영하세요',
    },
  },

  // 정오 - 남향 베란다
  noon_south: {
    time: '11:00-14:00',
    scenario: 'noon_south_window',
    description: '정오 남향 베란다 (직사광선 아님)',
    cctAnalysis: {
      avgCct: 5500,
      zoneVariance: 200,
      quality: 'optimal' as const,
    },
    uniformityAnalysis: {
      score: 90,
      brightnessRatio: 0.95,
    },
    shadowAnalysis: {
      hasShadow: false,
      severity: null,
      direction: null,
      sbs: 8,
    },
    overall: {
      score: 88,
      quality: 'optimal',
      recommendation: '이상적인 조명 환경입니다',
    },
    koreanNote: '셀카/피부 분석에 가장 좋은 시간대',
  },

  // 저녁 - 서향 창문 (노을)
  evening_west: {
    time: '17:00-19:00',
    scenario: 'evening_west_sunset',
    description: '저녁 서향 창문 (노을빛)',
    cctAnalysis: {
      avgCct: 3500,             // 노을빛
      zoneVariance: 600,        // 불균일
      quality: 'poor' as const,
    },
    uniformityAnalysis: {
      score: 50,
      brightnessRatio: 0.55,
    },
    shadowAnalysis: {
      hasShadow: true,
      severity: 'moderate' as const,
      direction: 'side',
      sbs: 40,
    },
    overall: {
      score: 45,
      quality: 'poor',
      recommendation: '노을빛으로 피부색 왜곡. 실내 조명을 켜거나 다른 시간대 촬영',
    },
  },
};
```

### 13.8 한국 조명 Mock 활용 함수

```typescript
// tests/mocks/cie-4-korean-environments.ts (계속)

import {
  KOREAN_HOME_LIGHTING_ANALYSIS,
  KOREAN_OFFICE_LIGHTING_ANALYSIS,
  KOREAN_WINDOW_LIGHT_TIMES,
} from './cie-4-korean-environments';

/**
 * 한국 환경별 조명 분석 Mock 생성
 */
export function generateKoreanLightingAnalysisMock(
  category: 'home' | 'office' | 'window',
  scenario: string
): LightingAnalysisResult {
  let data;

  switch (category) {
    case 'home':
      data = KOREAN_HOME_LIGHTING_ANALYSIS[scenario as keyof typeof KOREAN_HOME_LIGHTING_ANALYSIS];
      break;
    case 'office':
      data = KOREAN_OFFICE_LIGHTING_ANALYSIS[scenario as keyof typeof KOREAN_OFFICE_LIGHTING_ANALYSIS];
      break;
    case 'window':
      data = KOREAN_WINDOW_LIGHT_TIMES[scenario as keyof typeof KOREAN_WINDOW_LIGHT_TIMES];
      break;
    default:
      throw new Error(`Unknown category: ${category}`);
  }

  if (!data) {
    throw new Error(`Unknown scenario: ${scenario}`);
  }

  return {
    cct: data.cctAnalysis,
    uniformity: data.uniformityAnalysis,
    shadow: data.shadowAnalysis,
    overall: data.overall,
    metadata: {
      scenario: data.scenario,
      description: data.description,
      koreanNote: data.koreanNote,
    },
    analyzedAt: new Date().toISOString(),
  } as LightingAnalysisResult;
}

/**
 * 사용 예시:
 *
 * // 거실 형광등 테스트
 * const mock = generateKoreanLightingAnalysisMock('home', 'livingRoom_fluorescent');
 *
 * // 카페 혼합 조명 테스트
 * const mock = generateKoreanLightingAnalysisMock('office', 'cafe_mixed');
 *
 * // 정오 남향 창문 테스트
 * const mock = generateKoreanLightingAnalysisMock('window', 'noon_south');
 */
```

---

## 14. P3 원자별 상세 성공 기준

### 14.1 CIE4-1: sRGB to xy 변환 유틸리티

| 항목 | 성공 기준 |
|------|----------|
| **입력** | RGB 값 (0-255) |
| **출력** | CIE 1931 xy 좌표 |
| **D65 백색** | (255, 255, 255) → x≈0.3127, y≈0.3290 (오차 < 0.005) |
| **순수 빨강** | (255, 0, 0) → x≈0.64, y≈0.33 (오차 < 0.02) |
| **순수 녹색** | (0, 255, 0) → x≈0.30, y≈0.60 (오차 < 0.02) |
| **순수 파랑** | (0, 0, 255) → x≈0.15, y≈0.06 (오차 < 0.02) |
| **감마 해제** | sRGB 감마 2.4 정확히 적용 |
| **성능** | 단일 변환 < 1μs |

```typescript
describe('CIE4-1 Success Criteria', () => {
  it('D65 white conversion x,y accuracy < 0.005', () => {
    const xy = srgbToXy([255, 255, 255]);
    expect(Math.abs(xy.x - 0.3127)).toBeLessThan(0.005);
    expect(Math.abs(xy.y - 0.3290)).toBeLessThan(0.005);
  });

  it('pure red conversion accuracy < 0.02', () => {
    const xy = srgbToXy([255, 0, 0]);
    expect(Math.abs(xy.x - 0.64)).toBeLessThan(0.02);
    expect(Math.abs(xy.y - 0.33)).toBeLessThan(0.02);
  });
});
```

### 14.2 CIE4-2: McCamy CCT 추정

| 항목 | 성공 기준 |
|------|----------|
| **입력** | xy 좌표 |
| **출력** | CCT (K), 품질 등급, 신뢰도 |
| **D65 입력** | x=0.3127, y=0.3290 → CCT ≈ 6500K (±200K) |
| **Illuminant A** | x=0.4476, y=0.4074 → CCT ≈ 2856K (±200K) |
| **품질 분류** | 5000-6500K=optimal, 4500-5000/6500-7000=good, ... |
| **범위 제한** | 1000K < CCT < 25000K |
| **Duv 신뢰도** | Planckian locus 거리 < 0.02 → 고신뢰도 (> 0.85) |
| **성능** | 단일 이미지 (640×480) < 10ms |

### 14.3 CIE4-3: 6-Zone 영역 추출

| 항목 | 성공 기준 |
|------|----------|
| **입력** | FaceLandmarks (468점) |
| **출력** | 6개 Zone 좌표 (각 Zone별 픽셀 목록) |
| **최소 픽셀** | 각 Zone 최소 100 픽셀 포함 |
| **좌우 대칭** | 좌측 Zone 크기 / 우측 Zone 크기 = 0.9~1.1 |
| **커버리지** | 6개 Zone이 얼굴 피부 영역 70% 이상 커버 |
| **랜드마크 매핑** | 이마: 67-109, 볼: 93-132, 턱: 148-176 (MediaPipe 인덱스) |
| **폴백** | 랜드마크 없으면 바운딩박스 기반 4분할 |

### 14.4 CIE4-4: Y 채널 밝기 계산

| 항목 | 성공 기준 |
|------|----------|
| **입력** | ImageData, Zone 좌표 |
| **출력** | 밝기 값 (0-255) |
| **공식** | Y = 0.299R + 0.587G + 0.114B (ITU-R BT.601) |
| **흰색** | (255, 255, 255) → Y ≈ 255 |
| **검정** | (0, 0, 0) → Y ≈ 0 |
| **중간 회색** | (128, 128, 128) → Y ≈ 128 |
| **성능** | Zone당 < 5ms |

### 14.5 CIE4-5: 균일성 분석

| 항목 | 성공 기준 |
|------|----------|
| **입력** | ZoneValues (6개 밝기 값) |
| **출력** | 균일성 점수 (0-100), 분산, 수용 여부 |
| **균일 이미지** | 모든 Zone 동일 → score = 100 |
| **50% 편차** | 한 Zone이 50% 어두움 → score < 70 |
| **수용 임계값** | score ≥ 50 → isAcceptable = true |
| **감도 계수** | k = 2.0 (기본값, 설정 가능) |
| **피드백** | 가장 어두운/밝은 영역 한국어 안내 |

### 14.6 CIE4-6: 그림자 감지

| 항목 | 성공 기준 |
|------|----------|
| **입력** | ZoneValues, ImageData (Edge용), faceRegion |
| **출력** | 그림자 여부, 심각도, 방향, SBS |
| **좌우 균형** | ΔLR < 5% → hasShadow = false |
| **방향 판정** | leftAvg > rightAvg → lightDirection = 'left' |
| **Edge Detection** | Sobel 3×3 커널 정확히 적용 |
| **SBS 범위** | 0-100 정규화 |
| **심각도 매핑** | SBS < 10=none, 10-25=mild, 25-50=moderate, >50=severe |

### 14.7 CIE4-7: 통합 분석 함수

| 항목 | 성공 기준 |
|------|----------|
| **입력** | CIE4Input (imageData, faceLandmarks?, faceRegion?, config?) |
| **출력** | CIE4Output (모든 분석 결과 통합) |
| **처리 시간** | 전체 파이프라인 < 50ms (640×480) |
| **에러 핸들링** | 예외 시 기본값 반환, confidence = 0.5 |
| **종합 점수** | CCT(40%) + 균일성(35%) + 그림자(25%) 가중 평균 |
| **수용 판정** | overallScore ≥ 50 AND cct.quality ≠ 'reject' |
| **신뢰도 전파** | CIE 파이프라인 곱셈에 사용될 0-1 계수 |
| **피드백** | primaryIssue 기반 한국어 안내 메시지 |

```typescript
describe('CIE4-7 Success Criteria', () => {
  it('should complete within 50ms', async () => {
    const start = performance.now();
    await analyzeLighting({ imageData: testImage });
    expect(performance.now() - start).toBeLessThan(50);
  });

  it('should return safe defaults on error', async () => {
    const result = await analyzeLightingSafe({ imageData: null as any });
    expect(result.confidence).toBe(0.5);
    expect(result.isAcceptable).toBe(true);
    expect(result.feedback).toContain('제한적');
  });

  it('should reject CCT quality=reject', async () => {
    const candleImage = createMockImageData({ avgR: 255, avgG: 150, avgB: 50 });
    const result = await analyzeLighting({ imageData: candleImage });
    expect(result.cct.quality).toBe('reject');
    expect(result.isAcceptable).toBe(false);
  });
});
```

---

## 15. 상세 테스트 케이스

### 15.1 Edge Detection 테스트

```typescript
describe('Sobel Edge Detection', () => {
  it('should detect vertical edges for side lighting', () => {
    // 왼쪽 밝고 오른쪽 어두운 이미지
    const sideLight = createGradientImage({
      direction: 'horizontal',
      startBrightness: 200,
      endBrightness: 80,
    });

    const result = detectShadowEdges(sideLight, { x: 0, y: 0, width: 100, height: 100 });

    expect(result.primaryEdgeDirection).toBe('vertical');
    expect(result.shadowBoundaryStrength).toBeGreaterThan(30);
  });

  it('should detect horizontal edges for top/bottom lighting', () => {
    // 위가 밝고 아래가 어두운 이미지
    const topLight = createGradientImage({
      direction: 'vertical',
      startBrightness: 200,
      endBrightness: 80,
    });

    const result = detectShadowEdges(topLight, { x: 0, y: 0, width: 100, height: 100 });

    expect(result.primaryEdgeDirection).toBe('horizontal');
  });

  it('should return low SBS for uniform image', () => {
    const uniform = createSolidColorImage([150, 150, 150], 100, 100);
    const result = detectShadowEdges(uniform, { x: 0, y: 0, width: 100, height: 100 });

    expect(result.shadowBoundaryStrength).toBeLessThan(10);
    expect(result.primaryEdgeDirection).toBe('none');
  });
});
```

### 15.2 신뢰도 전파 테스트

```typescript
describe('Confidence Propagation', () => {
  it('should reduce final confidence with poor lighting', async () => {
    const poorLightingImage = loadTestImage('face-warm-shadow.jpg');

    const cie4Result = await analyzeLighting({ imageData: poorLightingImage });

    // 조명 문제로 신뢰도 낮음
    expect(cie4Result.confidence).toBeLessThan(0.7);

    // PC-1 분석 시 신뢰도 전파
    const pc1Result = await analyzePersonalColor({
      imageData: poorLightingImage,
      lightingConfidence: cie4Result.confidence,
    });

    // 최종 신뢰도가 조명 신뢰도 이하
    expect(pc1Result.finalConfidence).toBeLessThanOrEqual(cie4Result.confidence);
  });

  it('should maintain confidence with optimal lighting', async () => {
    const goodLightingImage = loadTestImage('face-natural-light.jpg');

    const cie4Result = await analyzeLighting({ imageData: goodLightingImage });

    expect(cie4Result.confidence).toBeGreaterThan(0.85);
    expect(cie4Result.cct.quality).toBe('optimal');
  });
});
```

### 15.3 에러 핸들링 테스트

```typescript
describe('Error Handling', () => {
  it('should handle missing face landmarks gracefully', async () => {
    const result = await analyzeLighting({
      imageData: testImage,
      faceLandmarks: undefined, // 랜드마크 없음
    });

    // 4분할 폴백 사용
    expect(result.uniformity).toBeDefined();
    expect(result.feedback).toBeTruthy();
  });

  it('should handle extreme pixel values', async () => {
    const extremeImage = createMockImageData({
      avgR: 255,
      avgG: 0,
      avgB: 255,
    });

    const result = await analyzeLighting({ imageData: extremeImage });

    // 에러 없이 결과 반환
    expect(result.cct.cct).toBeDefined();
    expect(isFinite(result.cct.cct)).toBe(true);
  });

  it('should handle zero-brightness image', async () => {
    const blackImage = createSolidColorImage([0, 0, 0], 100, 100);

    const result = await analyzeLightingSafe({ imageData: blackImage });

    // 기본값 반환
    expect(result.confidence).toBe(0.5);
    expect(result.feedback).toContain('제한적');
  });
});
```

### 15.4 UI 컴포넌트 테스트

```typescript
describe('LightingGuide Component', () => {
  it('should show success status for acceptable lighting', () => {
    const result = OPTIMAL_LIGHTING_MOCK.expected;
    render(<LightingGuide result={result} isAnalyzing={false} />);

    expect(screen.getByText('조명 양호')).toBeInTheDocument();
    expect(screen.getByTestId('lighting-guide')).toHaveClass('status-success');
  });

  it('should show warning for shadow detected', () => {
    const result = MILD_SHADOW_LEFT_MOCK.expected;
    render(<LightingGuide result={result} isAnalyzing={false} />);

    expect(screen.getByText(/오른쪽으로 살짝 이동/)).toBeInTheDocument();
  });

  it('should show loading state while analyzing', () => {
    render(<LightingGuide result={null} isAnalyzing={true} />);

    expect(screen.getByText('조명 분석 중...')).toBeInTheDocument();
  });
});
```

---

## 16. 구현 일정 (Implementation Schedule)

### 16.1 일정 개요

| 항목 | 내용 |
|------|------|
| **예상 분기** | 2026 Q2 |
| **우선순위** | P0 (CIE 파이프라인 핵심) |
| **예상 기간** | 2-3주 |

### 16.2 선행 조건 (Prerequisites)

| 선행 모듈 | 상태 | 의존성 설명 |
|----------|------|------------|
| **CIE-1** (이미지 품질) | Complete | 입력 이미지 검증 |
| **CIE-2** (얼굴 감지) | Complete | 얼굴 영역 마스크, 6존 분할 |
| **CIE-3** (AWB 보정) | Complete | CCT 추정 알고리즘 공유 |

### 16.3 마일스톤

| Phase | 기간 | 주요 작업 | 산출물 |
|-------|------|----------|--------|
| **Phase 1** | 0.5주 | McCamy CCT 측정 | `lib/image/cct-estimator.ts` |
| **Phase 2** | 1주 | 6존 균일성 분석 | `lib/image/uniformity-analyzer.ts` |
| **Phase 3** | 0.5주 | 그림자 감지 | `lib/image/shadow-detector.ts` |
| **Phase 4** | 0.5주 | 조명 가이드 UI | `components/common/LightingGuide.tsx` |
| **Buffer** | 0.5주 | 테스트, 피드백 문구 최적화 | - |

### 16.4 후행 모듈 (Downstream)

| 모듈 | 사용 필드 | 영향 |
|------|----------|------|
| **모든 분석 모듈** | `lightingScore` | 분석 신뢰도 계수로 활용 |
| **촬영 화면** | `feedback` | 실시간 조명 가이드 표시 |
| **결과 페이지** | `confidence` | 분석 정확도 표시 |

### 16.5 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|------|
| 실시간 피드백 성능 | 중간 | 분석 주기 조절 (500ms) |
| 혼합 조명 감지 | 낮음 | 향후 버전으로 연기 |
| 사용자 촬영 환경 제어 불가 | 중간 | 안내 메시지 개선, 재촬영 권장 |

---

**Version**: 2.4 | **Updated**: 2026-01-24 | 구현 일정 섹션 추가 (16절) - 2026 Q2, P0 우선순위

**Author**: Claude Code
**Reviewed by**: -
