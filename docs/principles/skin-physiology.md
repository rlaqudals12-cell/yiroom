# 피부 생리학 원리

> 이 문서는 이룸 플랫폼의 피부 분석(S-1, S-2) 기반 원리를 설명한다.
>
> **소스 리서치**: S-2-R1

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 피부 상태 분석 시스템"

- 6존(이마, 코, 양볼, 턱, 턱선) 독립 분석으로 99% 정확한 피부 타입 분류
- 실시간 피부 변화 모니터링 및 트렌드 예측
- 모공, 붉은기, 트러블, 주름, 탄력 5대 지표 정밀 측정
- 의료 기기 수준(Sebumeter®, Corneometer®)과 ±10% 이내 오차
```

### 물리적 한계

| 항목      | 한계                                           |
| --------- | ---------------------------------------------- |
| 측정 장비 | 스마트폰 카메라로 피지량/수분량 직접 측정 불가 |
| 환경 변동 | 시간대/계절/습도에 따른 피부 상태 변동         |
| 개인 변동 | 호르몬, 스트레스, 식이로 인한 일일 변동        |
| 깊이 한계 | 표피 표면만 촬영 가능, 진피 상태 추정 한계     |

### 100점 기준

- T존/U존 복합성 판정 정확도 90% 이상
- 모공 가시성 점수 재현율 85% 이상 (동일 조건)
- 붉은기(a\* 기반) 수준 분류 정확도 90% 이상
- 트러블 개수 감지 정확도 80% 이상
- 한국인 피부 기준값 적용

### 현재 목표: 80%

- T존/U존 기반 5가지 피부 타입 분류
- 모공 점수화 시스템 (0-1000)
- 붉은기/트러블 정량 분석
- GLCM/LBP 텍스처 분석
- 한국인 연구 데이터 기반 임계값

### 의도적 제외

| 제외 항목        | 이유              | 재검토 시점       |
| ---------------- | ----------------- | ----------------- |
| 실시간 피부 추적 | 지속적 촬영 부담  | 웨어러블 연동 시  |
| 진피층 분석      | 표면 촬영 한계    | 전문 기기 연동 시 |
| 피부암 스크리닝  | 의료 규제 대상    | 의료 인증 획득 시 |
| 알레르기 테스트  | 이미지만으로 불가 | N/A               |

---

## 1. 피부 구조 개요

### 1.1 피부 층 구조

```
┌─────────────────────────────────────┐
│           표피 (Epidermis)          │  ← 분석 대상
│  ├── 각질층 (Stratum Corneum)       │  ← 수분/장벽
│  ├── 과립층 (Stratum Granulosum)    │
│  ├── 유극층 (Stratum Spinosum)      │
│  └── 기저층 (Stratum Basale)        │  ← 멜라닌
├─────────────────────────────────────┤
│           진피 (Dermis)             │
│  ├── 유두층 (Papillary)             │
│  └── 망상층 (Reticular)             │  ← 콜라겐/탄력
├─────────────────────────────────────┤
│         피하조직 (Hypodermis)        │
└─────────────────────────────────────┘
```

### 1.2 피지선 분포

| 부위 | 피지선 밀도 (glands/cm²) | 특징          |
| ---- | ------------------------ | ------------- |
| 이마 | 400-900                  | 최다 밀집     |
| 코   | 높음 (변동)              | 블랙헤드 호발 |
| 볼   | 낮음                     | 건조 경향     |
| 턱   | 중간                     | 호르몬 영향   |

---

## 2. T존/U존 생리학

### 2.1 영역 정의

```
┌──────────────────────┐
│      이마 (T존)       │
│  ┌────────────────┐  │
│  │                │  │
│  │ 볼(U존) 코 볼   │  │
│  │      (T존)     │  │
│  │                │  │
│  └────────────────┘  │
│       턱 (T존)        │
└──────────────────────┘
```

### 2.2 T존 vs U존 특성

| 특성         | T존 (이마, 코, 턱) | U존 (양 볼)    |
| ------------ | ------------------ | -------------- |
| 피지선 밀도  | 400-900 glands/cm² | 낮음           |
| 모낭피지단위 | 200-300/cm²        | 적음           |
| 피지 분비    | 높음, 불안정       | 낮음, 안정     |
| 모공 크기    | 크고 가시적        | 작고 덜 가시적 |
| 특징         | 번들거림, 여드름   | 건조 경향      |

### 2.3 피지 분비량 기준 (Sebumeter®, μg/cm²)

| 부위     | 건성 | 정상   | 지성 |
| -------- | ---- | ------ | ---- |
| **이마** | <70  | 70-150 | >150 |
| **볼**   | <30  | 30-70  | >70  |
| **턱**   | <40  | 40-100 | >100 |

**피지 분비 속도**:

- 건성: <0.5-1 μg/cm²/min
- 정상: 1-2 μg/cm²/min
- 지성: >2-4 μg/cm²/min

### 2.4 복합성 피부 판정

```typescript
type SkinType = 'dry' | 'normal' | 'oily' | 'combination';

function determineSkinType(tZoneSebum: number, uZoneSebum: number): SkinType {
  const tZoneType = classifyZone(tZoneSebum, 'T');
  const uZoneType = classifyZone(uZoneSebum, 'U');

  // T존과 U존 유형이 다르면 복합성
  if (tZoneType !== uZoneType) {
    return 'combination';
  }

  return tZoneType;
}

function classifyZone(sebum: number, zone: 'T' | 'U'): 'dry' | 'normal' | 'oily' {
  const thresholds = zone === 'T' ? { low: 70, high: 150 } : { low: 30, high: 70 };

  if (sebum < thresholds.low) return 'dry';
  if (sebum > thresholds.high) return 'oily';
  return 'normal';
}
```

---

## 3. 모공 분석

> ⚠️ **비진단적 분석**
>
> 본 섹션의 모공 측정값은 **화장품 선택 참고용**이며, 의료 진단 기준이 아닙니다.
> 모공 확대, 블랙헤드, 피부 병변이 지속될 경우 피부과 전문의 상담을 권장합니다.
> AI 기반 모공 점수(0-1000)는 상대적 비교 지표이며 절대적 건강 지표가 아닙니다.

### 3.1 모공 크기 분류

| 분류        | 직경 (μm) | 면적 (mm²) |
| ----------- | --------- | ---------- |
| 작은 모공   | <40       | <0.05      |
| 보통 모공   | 40-70     | 0.05-0.10  |
| 큰 모공     | >70       | 0.10-0.20  |
| 확대된 모공 | -         | >0.20      |

### 3.2 민족별 모공 특성 (L'Oreal 연구, n=2,585)

| 민족       | 모공 면적 (mm²) | 밀도 (N/cm²) | 피부 점유율 |
| ---------- | --------------- | ------------ | ----------- |
| **중국인** | **0.03-0.06**   | 10-25        | 1.2-1.5%    |
| 일본인     | 0.14-0.19       | 67-72        | 9.6-13.4%   |
| 코카시안   | 0.16-0.22       | 60-65        | 10.6-13.3%  |
| 인도인     | 0.17-0.29       | 72-83        | 13.7-20.4%  |

**핵심**: 동아시아인(한국인/중국인)이 **가장 작은 모공 면적**

### 3.3 모공 측정 메트릭

**면적 (Area)**:

```
Area = Σ pixels within contour
```

(pixels² → mm² 변환 필요)

**등가 직경 (Equivalent Diameter)**:

```
D_eq = √(4 × Area / π)
```

**원형도 (Circularity)**:

```
C = 4π × Area / Perimeter²
```

- 1.0 = 완벽한 원
- <0.6 = 불규칙 형태 (노화/손상 지표)

**신장도 (Elongation)**:

```
E = Major_Axis / Minor_Axis
```

- 노화 시 증가 경향

**모공 밀도 (Density)**:

```
Density = Number_of_pores / ROI_Area (pores/cm²)
```

**가시성 지수 (Pore Visibility Index)**:

```
PVI = (Σ Individual_Pore_Area × Contrast_Factor) / Total_ROI_Area × 100
```

### 3.4 모공 점수화 시스템

**임상 시각 평가 척도 (0-6점)**:
| 점수 | 설명 |
|------|------|
| 0 | 거의 보이지 않음 |
| 1-2 | 약간 보임 |
| 3-4 | 보통/복합성 |
| 5-6 | 명확히 보이는 큰 모공 |

**AI 점수 (0-1000점)**:

- 볼 평균: 286점
- 코 평균: 194점
- 분류 정확도: **95.7%**

---

## 4. 표면 거칠기 (Roughness)

### 4.1 ISO 4287 파라미터

**Ra (산술 평균 거칠기)**:

$$Ra = \frac{1}{n} \sum_{i=1}^{n} |Z_i|$$

- 정상 피부: **13-60 μm**
- 해석: 낮을수록 매끄러움

**Rq (RMS 거칠기)**:

$$Rq = \sqrt{\frac{1}{n} \sum_{i=1}^{n} Z_i^2}$$

- 가우시안 분포에서: **Rq ≈ 1.11 × Ra**

**Rz (최대 높이)**:

$$Rz = \frac{1}{5} \sum_{i=1}^{5} (Rp_i + Rv_i)$$

- 5개 최대 피크 + 5개 최대 밸리 평균
- 정상: **85-100 μm**

### 4.2 정상 Roughness 범위

| 파라미터 | 정상 범위 | 건조/노화 |
| -------- | --------- | --------- |
| Ra       | 13-35 μm  | >40 μm    |
| Rq       | 14-39 μm  | >45 μm    |
| Rz       | 85-100 μm | >120 μm   |

### 4.3 Roughness 계산 구현

```typescript
interface RoughnessResult {
  Ra: number; // μm
  Rq: number; // μm
  Rz: number; // μm
  Rsk: number; // 비대칭도
  Rku: number; // 첨도
}

function calculateRoughness(profile: number[]): RoughnessResult {
  const n = profile.length;
  const mean = profile.reduce((a, b) => a + b, 0) / n;

  // 평균선 기준 편차
  const deviations = profile.map((z) => z - mean);

  // Ra: 절대편차 평균
  const Ra = deviations.reduce((sum, z) => sum + Math.abs(z), 0) / n;

  // Rq: RMS
  const Rq = Math.sqrt(deviations.reduce((sum, z) => sum + z * z, 0) / n);

  // Rz: 5개 피크 + 5개 밸리
  const sorted = [...deviations].sort((a, b) => b - a);
  const peaks = sorted.slice(0, 5);
  const valleys = sorted.slice(-5).map((v) => Math.abs(v));
  const Rz = (peaks.reduce((a, b) => a + b, 0) + valleys.reduce((a, b) => a + b, 0)) / 5;

  // Rsk: 비대칭도
  const Rsk = deviations.reduce((sum, z) => sum + Math.pow(z, 3), 0) / (n * Math.pow(Rq, 3));

  // Rku: 첨도
  const Rku = deviations.reduce((sum, z) => sum + Math.pow(z, 4), 0) / (n * Math.pow(Rq, 4));

  return { Ra, Rq, Rz, Rsk, Rku };
}
```

---

## 5. 텍스처 분석

> ⚠️ **측정 한계**
>
> GLCM/LBP 기반 텍스처 지표는 **이미지 처리 알고리즘 결과**이며,
> 피부과 임상 장비(Visioscan, DermaLab 등)와 직접 비교할 수 없습니다.
> 동일한 피부도 조명, 카메라, 촬영 각도에 따라 다른 결과가 나올 수 있습니다.

### 5.1 GLCM (Gray Level Co-occurrence Matrix)

**Contrast (텍스처 변동)**:
$$Contrast = \sum_i \sum_j (i-j)^2 \times P(i,j)$$

**Energy (균일성)**:
$$Energy = \sum_i \sum_j P(i,j)^2$$

**Homogeneity (동질성)**:
$$Homogeneity = \sum_i \sum_j \frac{P(i,j)}{1 + |i-j|}$$

**Entropy**:
$$Entropy = -\sum_i \sum_j P(i,j) \times \log_2[P(i,j)]$$

**해석**:
| 지표 | 높을 때 | 피부 상태 |
|------|--------|----------|
| Contrast | 거친 피부 | 건조/손상 |
| Energy | 규칙적 패턴 | 건강 |
| Homogeneity | 매끄러운 피부 | 건강 |
| Entropy | 불규칙 텍스처 | 손상/노화 |

### 5.2 LBP (Local Binary Pattern)

**공식**:
$$LBP(x_c, y_c) = \sum_{p=0}^{P-1} s(g_p - g_c) \times 2^p$$

$$s(x) = \begin{cases} 1, & x \geq 0 \\ 0, & x < 0 \end{cases}$$

**설정**:

- P (이웃 수): 8
- R (반경): 1-3

**특징**: 조명 변화에 강건, 텍스처 품질 평가에 활용

### 5.3 GLCM 계산 구현

```typescript
interface GLCMFeatures {
  contrast: number;
  energy: number;
  homogeneity: number;
  entropy: number;
  correlation: number;
}

function calculateGLCMFeatures(glcm: number[][]): GLCMFeatures {
  const size = glcm.length;
  const total = glcm.flat().reduce((a, b) => a + b, 0);

  // 정규화
  const P = glcm.map((row) => row.map((val) => val / total));

  let contrast = 0,
    energy = 0,
    homogeneity = 0,
    entropy = 0;
  let muI = 0,
    muJ = 0,
    sigmaI = 0,
    sigmaJ = 0,
    correlation = 0;

  // 평균 계산
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      muI += i * P[i][j];
      muJ += j * P[i][j];
    }
  }

  // 표준편차 계산
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      sigmaI += Math.pow(i - muI, 2) * P[i][j];
      sigmaJ += Math.pow(j - muJ, 2) * P[i][j];
    }
  }
  sigmaI = Math.sqrt(sigmaI);
  sigmaJ = Math.sqrt(sigmaJ);

  // 특성 계산
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const p = P[i][j];

      contrast += Math.pow(i - j, 2) * p;
      energy += p * p;
      homogeneity += p / (1 + Math.abs(i - j));

      if (p > 0) {
        entropy -= p * Math.log2(p);
      }

      if (sigmaI > 0 && sigmaJ > 0) {
        correlation += ((i - muI) * (j - muJ) * p) / (sigmaI * sigmaJ);
      }
    }
  }

  return { contrast, energy, homogeneity, entropy, correlation };
}
```

---

## 6. 수분도와 Roughness 상관관계

### 6.1 연구 결과

| 연구          | 파라미터            | 상관계수       | 의미           |
| ------------- | ------------------- | -------------- | -------------- |
| Koseki et al. | TEWL vs 텍스처      | **R² = 0.524** | 중간 상관      |
| 광음향 측정   | 수분 vs 음향        | r = -0.87      | 강한 역상관    |
| Hadi et al.   | SC수분 vs Roughness | 무상관         | 직접 관계 약함 |

**핵심**: TEWL(경피수분손실)이 Roughness보다 **더 강력한 수분 예측 인자**

### 6.2 메커니즘

```
수분 손실
    ↓
각질층 효소 반응 저하
    ↓
각질세포 박리 장애
    ↓
각질 축적
    ↓
거칠고 각질화된 표면
```

### 6.3 보습 효과 정량화

**2주 보습제 사용 연구 (Ruini et al., n=20)**:

| 파라미터    | 기준선   | 처리 후  | 변화       |
| ----------- | -------- | -------- | ---------- |
| Ra (처리군) | 15.46 μm | 13.06 μm | **-15.5%** |
| Rz (처리군) | 98.64 μm | 85.38 μm | **-13.4%** |
| Ra (대조군) | 14.51 μm | 13.90 μm | -4.2%      |

**8주 5% 요소 제품**: Rz -12.2 μm, SC 수분 +11.6 AU

### 6.4 수분 상태 추정

```typescript
type HydrationLevel = 'low' | 'normal' | 'high';

function estimateHydration(Ra: number): HydrationLevel {
  if (Ra > 40) return 'low'; // 건조
  if (Ra < 25) return 'high'; // 촉촉
  return 'normal';
}
```

---

## 7. 한국인 피부 기준

### 7.1 한국화장품산업연구원 기준 (n=434)

| 파라미터            | 측정값       | 판정      |
| ------------------- | ------------ | --------- |
| TEWL                | >18.0 g/m²/h | 민감성    |
| pH                  | >5.45        | 민감성    |
| 수분 (Corneometer)  | <47.17 A.U.  | 탈수      |
| 피지 (Sebumeter)    | >70 μg/cm²   | 지성      |
| 탄력 (Cutometer R2) | <0.68 E/mm   | 이완/노화 |

### 7.2 한국인 vs 중국인 비교 (n=361)

| 파라미터 | 한국인           | 중국인  |
| -------- | ---------------- | ------- |
| 수분     | 높음             | 낮음    |
| TEWL     | 낮음 (장벽 우수) | 높음    |
| 피지     | 낮음             | 높음    |
| 주름     | 덜 심각          | 더 심각 |
| 밝기     | 밝음             | 덜 밝음 |

---

## 8. 모공 감지 알고리즘

### 8.1 전처리 파이프라인

```
그레이스케일 변환
    ↓
CLAHE 적용 (clipLimit=2.0, tileGridSize=8×8)
    ↓
가우시안 블러 (5×5 커널)
    ↓
모공 감지
```

### 8.2 SimpleBlobDetector 설정

| 파라미터        | 권장값  | 설명        |
| --------------- | ------- | ----------- |
| minArea         | 50 px²  | 최소 면적   |
| maxArea         | 700 px² | 최대 면적   |
| minCircularity  | 0.6     | 원형도 하한 |
| blobColor       | 0       | 어두운 영역 |
| minConvexity    | 0.5     | 볼록성      |
| minInertiaRatio | 0.01    | 관성비      |

### 8.3 딥러닝 모델 성능

| 모델                  | 모공 IoU   | 파라미터 |
| --------------------- | ---------- | -------- |
| Vanilla U-Net         | 0.3601     | 17.3M    |
| U-Net++               | 0.3669     | -        |
| **U-Net + Attention** | **0.4032** | 5.2M     |

### 8.4 모공 점수 계산

```typescript
interface PoreAnalysisResult {
  pores: Pore[];
  density: number; // pores/cm²
  avgArea: number; // mm²
  avgCircularity: number;
  visibilityScore: number; // 0-1000
}

function calculatePoreMetrics(pores: Pore[], roiAreaCm2: number): PoreAnalysisResult {
  if (pores.length === 0) {
    return {
      pores: [],
      density: 0,
      avgArea: 0,
      avgCircularity: 0,
      visibilityScore: 0,
    };
  }

  const density = pores.length / roiAreaCm2;
  const avgArea = pores.reduce((sum, p) => sum + p.area, 0) / pores.length;
  const avgCircularity = pores.reduce((sum, p) => sum + p.circularity, 0) / pores.length;

  // 가시성 점수: 밀도 40% + 면적 40% + 형태 20%
  const densityScore = Math.min(density * 4, 400);
  const areaScore = Math.min(avgArea * 2000, 400);
  const shapeScore = Math.min((1 - avgCircularity) * 200, 200);

  const visibilityScore = Math.round(densityScore + areaScore + shapeScore);

  return {
    pores,
    density,
    avgArea,
    avgCircularity,
    visibilityScore: Math.min(visibilityScore, 1000),
  };
}
```

---

## 9. 종합 피부 점수

### 9.1 점수 체계

```typescript
interface SkinTextureScore {
  poreScore: number; // 0-100 (높을수록 좋음)
  roughnessScore: number; // 0-100 (높을수록 좋음)
  overallScore: number; // 0-100
  hydrationEstimate: 'low' | 'normal' | 'high';
  skinType: 'dry' | 'normal' | 'oily' | 'combination';
}
```

### 9.2 점수 계산

```typescript
function calculateOverallTextureScore(
  poreResult: PoreAnalysisResult,
  roughnessResult: RoughnessResult,
  zone: 'T' | 'U',
  sebumLevel: number
): SkinTextureScore {
  // 모공 점수 (낮은 가시성 = 높은 점수)
  const poreScore = 100 - Math.min(poreResult.visibilityScore / 10, 100);

  // Roughness 점수 (Ra 13-60 μm → 0-100)
  const raMin = 13,
    raMax = 60;
  const normalizedRa = Math.max(0, Math.min(1, (roughnessResult.Ra - raMin) / (raMax - raMin)));
  const roughnessScore = Math.round((1 - normalizedRa) * 100);

  // 수분 추정
  const hydrationEstimate = estimateHydration(roughnessResult.Ra);

  // 피부 타입
  const skinType = classifyZone(sebumLevel, zone);

  // 종합 점수: 모공 40% + roughness 60%
  const overallScore = Math.round(poreScore * 0.4 + roughnessScore * 0.6);

  return {
    poreScore,
    roughnessScore,
    overallScore,
    hydrationEstimate,
    skinType,
  };
}
```

### 9.3 점수 해석

| 종합 점수 | 상태      | 권장 사항      |
| --------- | --------- | -------------- |
| 80-100    | 매우 건강 | 현재 관리 유지 |
| 60-79     | 양호      | 기본 케어      |
| 40-59     | 보통      | 집중 케어 권장 |
| 20-39     | 주의      | 전문 상담 권장 |
| 0-19      | 심각      | 피부과 상담    |

---

## 10. 붉은기(Redness) 및 트러블 분석

### 10.1 붉은기 측정 원리

> **핵심**: 붉은기는 Lab 색공간의 **a\* 값**(Red-Green 축)으로 정량화한다.

#### 10.1.1 붉은기의 생리학적 원인

| 원인               | 메커니즘                    | 특징              |
| ------------------ | --------------------------- | ----------------- |
| **혈관 확장**      | 모세혈관 확장으로 혈류 증가 | 일시적/만성적     |
| **염증 반응**      | 히스타민, 사이토카인 분비   | 여드름, 습진 동반 |
| **피부 장벽 손상** | TEWL 증가, 자극 물질 침투   | 민감성 피부       |
| **광노화**         | 콜라겐 손상, 혈관 구조 변화 | 점진적 진행       |
| **홍조/주사**      | 만성 혈관 확장              | 볼/코 주변        |

#### 10.1.2 Lab a\* 값 기반 붉은기 분류

**측정 방법**: 피부 영역의 평균 Lab a\* 값

| a\* 범위  | 붉은기 수준 | 설명                 | 권장 조치        |
| --------- | ----------- | -------------------- | ---------------- |
| **< 8**   | 없음/낮음   | 정상 피부            | 유지 관리        |
| **8-12**  | 경미        | 약간 붉음, 민감 징후 | 진정 케어        |
| **12-18** | 중간        | 눈에 띄는 붉음       | 집중 진정 케어   |
| **18-25** | 높음        | 명백한 홍조/염증     | 피부과 상담 권장 |
| **> 25**  | 심각        | 강한 염증/홍조       | 피부과 상담 필수 |

**시각화**:

```
┌─────────────────────────────────────────────────────────────┐
│                    붉은기 a* 스케일                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   a* 값:  0    4    8    12   16   20   24   28   32        │
│           │    │    │    │    │    │    │    │    │         │
│           ├────┼────┼────┼────┼────┼────┼────┼────┤         │
│           │정상│    │경미│    │중간│    │높음│심각│         │
│           │    │    │    │    │    │    │    │    │         │
│   색상:   🟢   │    🟡   │    🟠   │    🔴   │    ⚫        │
│                                                              │
│   한국인 평균: a* ≈ 9-10 (약간 붉은기)                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 10.1.3 붉은기 점수화 알고리즘

```typescript
interface RednessResult {
  aStarValue: number; // Lab a* 측정값
  rednessLevel: 'none' | 'mild' | 'moderate' | 'high' | 'severe';
  rednessScore: number; // 0-100 (높을수록 붉음)
  localRedness: {
    cheeks: number; // 볼 a* 값
    nose: number; // 코 a* 값
    forehead: number; // 이마 a* 값
    chin: number; // 턱 a* 값
  };
  possibleCauses: string[];
  recommendations: string[];
}

function analyzeRedness(labValues: LabColor[]): RednessResult {
  // 영역별 a* 평균 계산
  const avgAStar = labValues.reduce((sum, lab) => sum + lab.a, 0) / labValues.length;

  // 붉은기 수준 결정
  let rednessLevel: RednessResult['rednessLevel'];
  if (avgAStar < 8) rednessLevel = 'none';
  else if (avgAStar < 12) rednessLevel = 'mild';
  else if (avgAStar < 18) rednessLevel = 'moderate';
  else if (avgAStar < 25) rednessLevel = 'high';
  else rednessLevel = 'severe';

  // 점수화 (0-100, 정규화)
  const rednessScore = Math.min(100, Math.max(0, (avgAStar - 5) * 4));

  // 원인 추정
  const possibleCauses = inferRednessCauses(avgAStar, labValues);

  // 권장 사항
  const recommendations = generateRednessRecommendations(rednessLevel);

  return {
    aStarValue: avgAStar,
    rednessLevel,
    rednessScore,
    localRedness: calculateLocalRedness(labValues),
    possibleCauses,
    recommendations,
  };
}

function inferRednessCauses(avgAStar: number, labValues: LabColor[]): string[] {
  const causes: string[] = [];

  // 전체적으로 높으면 민감성/염증
  if (avgAStar > 15) {
    causes.push('민감성 피부 또는 염증 가능성');
  }

  // 볼 부위만 높으면 홍조
  const cheekAStar =
    labValues.filter((v) => v.zone === 'cheek').reduce((sum, v) => sum + v.a, 0) /
    labValues.filter((v) => v.zone === 'cheek').length;

  if (cheekAStar > avgAStar * 1.2) {
    causes.push('볼 홍조 (Rosacea 가능성)');
  }

  // 코 부위 높으면 주사 의심
  const noseAStar =
    labValues.filter((v) => v.zone === 'nose').reduce((sum, v) => sum + v.a, 0) /
    labValues.filter((v) => v.zone === 'nose').length;

  if (noseAStar > 20) {
    causes.push('코 주변 혈관 확장 (주사 가능성)');
  }

  return causes;
}

function generateRednessRecommendations(level: string): string[] {
  const recommendations: Record<string, string[]> = {
    none: ['현재 상태 유지', '자외선 차단 지속'],
    mild: ['진정 성분 (센텔라, 병풀추출물) 사용', '자극적인 성분 피하기'],
    moderate: ['저자극 스킨케어 루틴', '진정 마스크 주 2-3회', '피부과 상담 고려'],
    high: ['즉각적인 진정 케어 필요', '새 제품 사용 중단', '피부과 상담 권장'],
    severe: ['피부과 전문의 상담 필수', '의약품 처방 필요 가능성'],
  };

  return recommendations[level] || [];
}
```

#### 10.1.4 영역별 붉은기 분석

| 영역           | 정상 a\* | 주의 a\* | 원인 가능성           |
| -------------- | -------- | -------- | --------------------- |
| **볼 (U존)**   | 8-12     | > 15     | 홍조, 민감성, 자외선  |
| **코**         | 9-13     | > 18     | 주사, 피지 염증       |
| **이마 (T존)** | 7-11     | > 14     | 여드름 염증, 자극     |
| **턱**         | 8-12     | > 16     | 호르몬성 여드름, 자극 |

### 10.2 트러블(여드름/뾰루지) 분석

> **핵심**: 트러블은 **영역 감지 + 심도 분류 + 면적 계산**으로 정량화한다.

#### 10.2.1 트러블 유형 분류

| 유형           | 영문명    | 특징                   | 심각도    |
| -------------- | --------- | ---------------------- | --------- |
| **화이트헤드** | Whitehead | 폐쇄형 면포, 흰색 돌기 | 경미      |
| **블랙헤드**   | Blackhead | 개방형 면포, 검은 점   | 경미      |
| **구진**       | Papule    | 붉은 돌기, 염증성      | 중간      |
| **농포**       | Pustule   | 고름 있는 돌기         | 중간-높음 |
| **결절**       | Nodule    | 큰 딱딱한 덩어리       | 높음      |
| **낭종**       | Cyst      | 깊은 고름 주머니       | 심각      |

#### 10.2.2 트러블 심도 점수화

```typescript
interface TroubleSpot {
  id: string;
  type: 'whitehead' | 'blackhead' | 'papule' | 'pustule' | 'nodule' | 'cyst';
  location: { x: number; y: number; zone: SkinZone };
  area: number; // mm²
  intensity: number; // 0-1 (색상 강도)
  depth: 'surface' | 'shallow' | 'deep';
}

interface TroubleAnalysisResult {
  spots: TroubleSpot[];
  totalCount: number;
  troubleScore: number; // 0-100 (높을수록 심각)
  severityLevel: 'clear' | 'mild' | 'moderate' | 'severe' | 'very_severe';
  typeBreakdown: Record<TroubleSpot['type'], number>;
  zoneBreakdown: Record<SkinZone, number>;
  recommendations: string[];
}

// 심도별 가중치
const TROUBLE_SEVERITY_WEIGHTS: Record<TroubleSpot['type'], number> = {
  whitehead: 1, // 가장 경미
  blackhead: 1,
  papule: 3, // 염증성
  pustule: 5, // 고름
  nodule: 8, // 깊은 염증
  cyst: 10, // 가장 심각
};

// 위치별 가중치 (눈에 잘 띄는 위치)
const ZONE_VISIBILITY_WEIGHTS: Record<SkinZone, number> = {
  forehead: 1.0,
  nose: 1.2, // 코는 눈에 잘 띔
  cheek_left: 1.1,
  cheek_right: 1.1,
  chin: 1.0,
  jaw: 0.8, // 턱선은 덜 보임
};

function analyzeTrouble(spots: TroubleSpot[]): TroubleAnalysisResult {
  if (spots.length === 0) {
    return {
      spots: [],
      totalCount: 0,
      troubleScore: 0,
      severityLevel: 'clear',
      typeBreakdown: {} as Record<TroubleSpot['type'], number>,
      zoneBreakdown: {} as Record<SkinZone, number>,
      recommendations: ['피부 상태가 양호합니다. 현재 관리를 유지하세요.'],
    };
  }

  // 유형별 집계
  const typeBreakdown = spots.reduce(
    (acc, spot) => {
      acc[spot.type] = (acc[spot.type] || 0) + 1;
      return acc;
    },
    {} as Record<TroubleSpot['type'], number>
  );

  // 영역별 집계
  const zoneBreakdown = spots.reduce(
    (acc, spot) => {
      acc[spot.location.zone] = (acc[spot.location.zone] || 0) + 1;
      return acc;
    },
    {} as Record<SkinZone, number>
  );

  // 트러블 점수 계산
  // 공식: (심도 × 가중치 × 0.4) + (면적 × 0.3) + (위치 가중 × 0.3)
  const troubleScore = calculateTroubleScore(spots);

  // 심각도 수준
  const severityLevel = determineSeverityLevel(troubleScore, spots.length);

  // 권장 사항
  const recommendations = generateTroubleRecommendations(
    severityLevel,
    typeBreakdown,
    zoneBreakdown
  );

  return {
    spots,
    totalCount: spots.length,
    troubleScore,
    severityLevel,
    typeBreakdown,
    zoneBreakdown,
    recommendations,
  };
}

function calculateTroubleScore(spots: TroubleSpot[]): number {
  let totalScore = 0;

  for (const spot of spots) {
    // 1. 심도 점수 (40%)
    const severityScore = TROUBLE_SEVERITY_WEIGHTS[spot.type] * 4;

    // 2. 면적 점수 (30%)
    const areaScore = Math.min(spot.area * 10, 30); // max 30점

    // 3. 위치 가중 점수 (30%)
    const visibilityScore = ZONE_VISIBILITY_WEIGHTS[spot.location.zone] * 25;

    totalScore += severityScore + areaScore + visibilityScore;
  }

  // 개수 보정 (많을수록 점수 증가, 로그 스케일)
  const countMultiplier = 1 + Math.log10(spots.length + 1) * 0.5;

  return Math.min(100, Math.round((totalScore * countMultiplier) / spots.length));
}

function determineSeverityLevel(
  score: number,
  count: number
): TroubleAnalysisResult['severityLevel'] {
  // 점수 + 개수 기반 복합 판정
  if (score < 10 && count < 3) return 'clear';
  if (score < 25 && count < 5) return 'mild';
  if (score < 50 && count < 10) return 'moderate';
  if (score < 75) return 'severe';
  return 'very_severe';
}
```

#### 10.2.3 트러블 심각도 기준

| 심각도          | 점수 범위 | 개수 기준 | 상태 설명        |
| --------------- | --------- | --------- | ---------------- |
| **Clear**       | 0-10      | < 3개     | 깨끗한 피부      |
| **Mild**        | 10-25     | 3-5개     | 가벼운 트러블    |
| **Moderate**    | 25-50     | 5-10개    | 중등도 트러블    |
| **Severe**      | 50-75     | 10-20개   | 심한 트러블      |
| **Very Severe** | 75-100    | > 20개    | 매우 심한 트러블 |

#### 10.2.4 영역별 트러블 패턴 분석

```typescript
interface TroublePattern {
  pattern: 'hormonal' | 'bacterial' | 'comedonal' | 'inflammatory' | 'mixed';
  dominantZones: SkinZone[];
  possibleCauses: string[];
  lifestyleFactors: string[];
}

function identifyTroublePattern(
  zoneBreakdown: Record<SkinZone, number>,
  typeBreakdown: Record<TroubleSpot['type'], number>
): TroublePattern {
  const totalCount = Object.values(zoneBreakdown).reduce((a, b) => a + b, 0);

  // 턱/턱선 우세 = 호르몬성
  const jawCount = (zoneBreakdown.chin || 0) + (zoneBreakdown.jaw || 0);
  if (jawCount / totalCount > 0.4) {
    return {
      pattern: 'hormonal',
      dominantZones: ['chin', 'jaw'],
      possibleCauses: ['호르몬 변화', '생리 주기', '스트레스'],
      lifestyleFactors: ['수면 패턴', '유제품 섭취', '스트레스 관리'],
    };
  }

  // T존 우세 + 블랙헤드/화이트헤드 = 면포성
  const tZoneCount = (zoneBreakdown.forehead || 0) + (zoneBreakdown.nose || 0);
  const comedonalCount = (typeBreakdown.blackhead || 0) + (typeBreakdown.whitehead || 0);
  if (tZoneCount / totalCount > 0.5 && comedonalCount > totalCount * 0.6) {
    return {
      pattern: 'comedonal',
      dominantZones: ['forehead', 'nose'],
      possibleCauses: ['피지 과다', '모공 막힘', '각질 축적'],
      lifestyleFactors: ['클렌징 습관', '유분 케어', '각질 관리'],
    };
  }

  // 볼 우세 + 농포/구진 = 세균성
  const cheekCount = (zoneBreakdown.cheek_left || 0) + (zoneBreakdown.cheek_right || 0);
  const inflammatoryCount = (typeBreakdown.papule || 0) + (typeBreakdown.pustule || 0);
  if (cheekCount / totalCount > 0.4 && inflammatoryCount > totalCount * 0.5) {
    return {
      pattern: 'bacterial',
      dominantZones: ['cheek_left', 'cheek_right'],
      possibleCauses: ['세균 감염', '손으로 만지기', '휴대폰/베개 오염'],
      lifestyleFactors: ['손 위생', '베개/이불 세탁', '휴대폰 청결'],
    };
  }

  // 결절/낭종 많음 = 염증성
  const severeCount = (typeBreakdown.nodule || 0) + (typeBreakdown.cyst || 0);
  if (severeCount > 2) {
    return {
      pattern: 'inflammatory',
      dominantZones: Object.keys(zoneBreakdown) as SkinZone[],
      possibleCauses: ['만성 염증', '피부 장벽 손상', '면역 반응'],
      lifestyleFactors: ['피부과 상담 필수', '의약품 치료 고려'],
    };
  }

  // 기본: 혼합형
  return {
    pattern: 'mixed',
    dominantZones: Object.keys(zoneBreakdown) as SkinZone[],
    possibleCauses: ['복합적 요인'],
    lifestyleFactors: ['종합적인 피부 관리 필요'],
  };
}
```

### 10.3 붉은기 + 트러블 종합 점수

```typescript
interface SkinConditionScore {
  rednessScore: number; // 0-100
  troubleScore: number; // 0-100
  overallHealthScore: number; // 0-100 (높을수록 건강)
  priority: 'redness' | 'trouble' | 'both' | 'none';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

function calculateSkinConditionScore(
  redness: RednessResult,
  trouble: TroubleAnalysisResult
): SkinConditionScore {
  // 건강 점수 = 100 - (붉은기 가중 + 트러블 가중)
  // 붉은기 40%, 트러블 60% 가중
  const overallHealthScore = Math.max(
    0,
    100 - (redness.rednessScore * 0.4 + trouble.troubleScore * 0.6)
  );

  // 우선순위 결정
  let priority: SkinConditionScore['priority'];
  if (redness.rednessScore > 50 && trouble.troubleScore > 50) {
    priority = 'both';
  } else if (redness.rednessScore > trouble.troubleScore + 20) {
    priority = 'redness';
  } else if (trouble.troubleScore > redness.rednessScore + 20) {
    priority = 'trouble';
  } else {
    priority = 'none';
  }

  // 긴급도 수준
  let urgencyLevel: SkinConditionScore['urgencyLevel'];
  const maxScore = Math.max(redness.rednessScore, trouble.troubleScore);
  if (maxScore < 25) urgencyLevel = 'low';
  else if (maxScore < 50) urgencyLevel = 'medium';
  else if (maxScore < 75) urgencyLevel = 'high';
  else urgencyLevel = 'critical';

  return {
    rednessScore: redness.rednessScore,
    troubleScore: trouble.troubleScore,
    overallHealthScore,
    priority,
    urgencyLevel,
  };
}
```

### 10.4 제품 추천 연동

| 피부 상태                | 우선 성분                           | 피해야 할 성분       |
| ------------------------ | ----------------------------------- | -------------------- |
| **붉은기 높음**          | 센텔라, 병풀, 알로에, 판테놀        | 알코올, 향료, 레티놀 |
| **트러블 (면포성)**      | 살리실산, AHA/BHA, 나이아신아마이드 | 코메도제닉 오일      |
| **트러블 (염증성)**      | 티트리, 진크, 벤조일퍼옥사이드      | 자극성 성분          |
| **복합 (붉은기+트러블)** | 저자극 진정 + 약산성 케어           | 모든 자극 성분       |

---

## 11. 구현 체크리스트

### 11.1 이미지 획득

- [ ] 조명: 균일한 확산광, 정면 조명
- [ ] 해상도: 최소 768×576 픽셀
- [ ] 색공간: BGR → 그레이스케일 변환
- [ ] ROI: T존/U존 영역 별도 마스킹

### 11.2 전처리

- [ ] CLAHE 적용 (clipLimit=2.0)
- [ ] 가우시안 블러 (5×5 커널)
- [ ] Top-hat 변환 (조명 불균일 보정)

### 11.3 모공 감지

- [ ] minArea/maxArea 피부 유형별 조정
- [ ] Circularity ≥ 0.6 필터링
- [ ] IoU ≥ 0.35 검증

### 11.4 Roughness 계산

- [ ] Ra/Rq/Rz 단위 통일 (μm)
- [ ] GLCM distance/angle 파라미터 명시
- [ ] LBP radius/points 설정

### 11.5 점수화

- [ ] 연령/성별 보정 적용
- [ ] 0-100 스케일 정규화
- [ ] 한국인 기준값 적용

---

## 12. 제한 사항 및 면책

### 12.1 의료적 면책

```
⚠️ 중요 고지

이 문서의 피부 분석 방법론은 화장품/웰니스 목적의 참고 정보이며,
의료 진단을 대체하지 않습니다.

다음 사항에 대해서는 반드시 피부과 전문의와 상담하세요:
- 지속적인 피부 문제 (여드름, 습진, 건선 등)
- 비정상적인 피부 변화 (색소 변화, 종기, 궤양)
- 알레르기 반응 또는 민감성 문제
- 의약품/시술 관련 결정

TEWL, pH, 민감도 점수는 측정 참고값이며 임상 진단 기준이 아닙니다.
```

### 12.2 측정 한계

| 한계            | 설명                           | 영향                       |
| --------------- | ------------------------------ | -------------------------- |
| **장비 특이성** | Sebumeter® 기준값 사용         | 다른 장비와 수치 차이 가능 |
| **일주기 변동** | 피지 분비는 시간대에 따라 변동 | 아침/저녁 결과 차이        |
| **환경 요인**   | 습도, 온도가 측정에 영향       | 계절별 보정 필요           |
| **개인 변동**   | 호르몬, 스트레스, 식이 영향    | 복수 측정 권장             |

### 12.3 사용자 고지 문구

```typescript
const SKIN_ANALYSIS_DISCLAIMER = `
이 분석은 AI 기반 피부 상태 추정이며, 의료 진단이 아닙니다.
피부 질환이 의심되거나 지속적인 문제가 있는 경우
피부과 전문의와 상담하세요.

측정값은 참고용이며, 화장품 선택의 최종 결정은
개인의 판단과 전문가 상담에 따릅니다.
`;
```

---

## 13. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서                                                         | 설명                                |
| ------------------------------------------------------------ | ----------------------------------- |
| [SDD-SKIN-ANALYSIS-v2](../specs/SDD-SKIN-ANALYSIS-v2.md)     | 피부분석 v2 모듈 스펙, P3 원자 분해 |
| [SDD-S1-UX-IMPROVEMENT](../specs/SDD-S1-UX-IMPROVEMENT.md)   | 피부분석 UX 스펙                    |
| [SDD-VISUAL-SKIN-REPORT](../specs/SDD-VISUAL-SKIN-REPORT.md) | 시각적 피부 리포트 스펙             |
| [ADR-003](../adr/ADR-003-ai-model-selection.md)              | AI 모델 선택 근거                   |

### 관련 원리 문서

| 문서                                         | 설명               |
| -------------------------------------------- | ------------------ |
| [image-processing.md](./image-processing.md) | 이미지 품질/전처리 |
| [color-science.md](./color-science.md)       | 피부톤 분석        |

---

## 14. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR                                                 | 제목                      | 관련 내용                           |
| --------------------------------------------------- | ------------------------- | ----------------------------------- |
| [ADR-001](../adr/ADR-001-core-image-engine.md)      | Core Image Engine         | 피부 이미지 전처리, 분석 파이프라인 |
| [ADR-003](../adr/ADR-003-ai-model-selection.md)     | AI 모델 선택              | Gemini Vision 피부 분석             |
| [ADR-010](../adr/ADR-010-ai-pipeline.md)            | AI 파이프라인             | S-1 분석 흐름                       |
| [ADR-011](../adr/ADR-011-cross-module-data-flow.md) | 크로스 모듈 데이터 플로우 | S-1 ↔ N-1, W-1 연동                 |

---

## 정확도 업그레이드 로드맵 (ADR-108, 2026-06 리서치)

- **셀카 기반 TEWL/수분 추정**: 하드웨어 없이 셀카에서 경피수분손실(TEWL)·수분도 추정 ([arxiv 2509.06282](https://arxiv.org/html/2509.06282)) → `skin-v2` 12-zone hydration 보강.
- **percentile 코호트 비교**: VISIA식 "동연령·동타입 대비 상위 X%"로 점수 맥락화 (AI 스캐너 95% test-retest 신뢰성 서사).
- ⚠️ UV/cross-polarized 다중조명은 하드웨어(VISIA 부스) 영역 → 셀카로는 불가, 해당 지표는 신뢰도 한계 정직 표기.
- 출처: [AI vs VISIA](https://www.banyanandbamboo.com/blog/ai-vs-visia-which-skin-analysis-is-right-for-you/); [arxiv 2509.06282](https://arxiv.org/html/2509.06282).
- 상세 → [ADR-108](../adr/ADR-108-axis-accuracy-upgrade-roadmap.md)

---

**Version**: 1.3 | **Created**: 2026-01-16 | **Updated**: 2026-06-17
**소스 리서치**: S-2-R1
**관련 모듈**: S-1, S-2, COMBO-SKIN-NUTRITION
**변경 이력**: v1.2 - Section 10 붉은기/트러블 분석 추가 (+430줄)
