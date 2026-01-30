# 피부 병변 분석 원리

> 이 문서는 이룸 플랫폼의 피부 트러블/병변 분석 기반 원리를 설명한다.
>
> **소스 리서치**: skin-physiology.md 확장, S-2 피부분석 v2

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 피부 병변 감지 및 분류 시스템"

- 모든 유형의 피부 병변(여드름, 색소침착, 홍반 등) 95% 이상 정확도 감지
- 병변 유형, 심도, 진행 단계 자동 분류
- 치료 진행 상황 모니터링 및 예측
- 피부과 전문의 수준의 분석 제공
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 촬영 장비 | 스마트폰 카메라 해상도/광학 한계 |
| 깊이 분석 | 표피 표면만 촬영 가능, 진피/피하 병변 불가 |
| 의료 규제 | 진단 목적 사용 불가, 참고용 한정 |
| 조명 변동 | 환경 조명에 따른 색상 왜곡 |

### 100점 기준

- 병변 감지 정확도 90% 이상
- 병변 유형 분류 정확도 85% 이상
- 위양성(False Positive) 비율 10% 이하
- 심각도 평가 일관성 90% 이상

### 현재 목표: 70%

- 주요 병변 유형 5종 감지 (여드름, 색소침착, 홍반, 건조반점, 모공확장)
- 기본 심도 분류 (표면/중간/깊음)
- 영역별 분포 분석 (6존 기반)
- 트렌드 추적 (이전 분석 대비 변화)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 피부암 스크리닝 | 의료 규제 대상 | 의료기기 인증 획득 시 |
| 진피층 병변 | 표면 촬영 한계 | 전문 기기 연동 시 |
| 실시간 진단 | 규제 및 책임 문제 | 법적 프레임워크 정립 시 |

---

## 1. 핵심 개념

### 1.1 피부 병변(Skin Lesion) 정의

피부 병변은 정상 피부 조직과 구별되는 비정상적인 피부 변화를 의미한다.

**1차 병변 (Primary Lesions)**: 질병 초기에 직접 발생
- 반점(Macule): 피부 표면과 같은 높이, 색상만 변화 (<1cm)
- 반(Patch): 반점의 확대형 (>1cm)
- 구진(Papule): 융기된 고형 병변 (<1cm)
- 결절(Nodule): 구진의 확대형, 더 깊음 (>1cm)
- 수포(Vesicle): 맑은 액체로 채워진 융기 (<1cm)

**2차 병변 (Secondary Lesions)**: 1차 병변의 변화
- 인설(Scale): 각질층 탈락
- 가피(Crust): 건조된 혈액/삼출물
- 미란(Erosion): 표피 손실
- 궤양(Ulcer): 진피까지 손실

### 1.2 이룸 분석 대상 병변

| 병변 유형 | 영문명 | 특징 | 분석 가능 여부 |
|----------|--------|------|---------------|
| **면포** | Comedone | 모공 막힘 (블랙헤드/화이트헤드) | O |
| **구진** | Papule | 붉은 돌기, 염증성 | O |
| **농포** | Pustule | 고름 포함 | O |
| **색소침착** | Hyperpigmentation | 멜라닌 과다 | O |
| **홍반** | Erythema | 붉은 반점 | O |
| **건조반점** | Dry Patch | 각질 축적 | O |
| **결절/낭종** | Nodule/Cyst | 깊은 염증 | △ (표면만) |

---

## 2. 수학적/물리학적 기반

### 2.1 색상 기반 병변 감지

#### Lab 색공간 활용

```
L* = 명도 (0-100)
a* = 녹색(-) ~ 빨강(+) 축
b* = 파랑(-) ~ 노랑(+) 축
```

**병변별 색상 시그니처**:

| 병변 | L* 특성 | a* 특성 | b* 특성 |
|------|---------|---------|---------|
| 염증성 여드름 | 감소 | 증가 (>15) | 변동 |
| 색소침착 | 감소 | 미세 증가 | 증가 |
| 홍반 | 유지/감소 | 증가 (>12) | 유지 |
| 건조반점 | 증가 | 유지 | 감소 |

#### 색차 공식 (CIE Delta E 2000)

$$\Delta E_{00} = \sqrt{\left(\frac{\Delta L'}{k_L S_L}\right)^2 + \left(\frac{\Delta C'}{k_C S_C}\right)^2 + \left(\frac{\Delta H'}{k_H S_H}\right)^2 + R_T \frac{\Delta C'}{k_C S_C} \frac{\Delta H'}{k_H S_H}}$$

- 정상 피부 대비 $\Delta E > 3$: 유의미한 차이
- $\Delta E > 6$: 명백한 병변 영역

### 2.2 형태학적 분석

#### 병변 윤곽 검출

```typescript
// Canny Edge Detection 파라미터
const LESION_EDGE_PARAMS = {
  lowThreshold: 50,
  highThreshold: 150,
  apertureSize: 3,
};
```

#### 면적 계산

$$Area = \sum_{i=1}^{n} pixels \times scale^2 \text{ (mm}^2\text{)}$$

#### 형태 기술자

**원형도 (Circularity)**:
$$C = \frac{4\pi \times Area}{Perimeter^2}$$
- C → 1.0: 원형 (균일한 병변)
- C < 0.5: 불규칙 (주의 필요)

**비대칭도 (Asymmetry Index)**:
$$AI = \frac{|Area_{left} - Area_{right}|}{Area_{total}}$$
- AI < 0.2: 대칭
- AI > 0.4: 비대칭 (피부과 상담 권장)

### 2.3 텍스처 분석

#### GLCM 기반 병변 특성

```typescript
interface LesionTextureFeatures {
  contrast: number;      // 병변 경계 선명도
  homogeneity: number;   // 병변 내부 균일도
  entropy: number;       // 텍스처 복잡도
  correlation: number;   // 패턴 규칙성
}
```

**해석 기준**:
| 지표 | 건강 피부 | 병변 영역 |
|------|----------|----------|
| Contrast | 낮음 (<50) | 높음 (>100) |
| Homogeneity | 높음 (>0.8) | 낮음 (<0.6) |
| Entropy | 낮음 (<5) | 높음 (>7) |

---

## 3. 구현 도출

### 3.1 병변 감지 파이프라인

```
이미지 입력
    ↓
전처리 (색 보정, 노이즈 제거)
    ↓
피부 영역 분할 (6존)
    ↓
이상 영역 후보 검출
    ↓
색상/형태/텍스처 특성 추출
    ↓
병변 분류 (타입, 심도)
    ↓
결과 출력 + 권장 사항
```

### 3.2 병변 타입 분류 알고리즘

```typescript
type LesionType =
  | 'comedone_open'     // 블랙헤드
  | 'comedone_closed'   // 화이트헤드
  | 'papule'            // 구진
  | 'pustule'           // 농포
  | 'hyperpigmentation' // 색소침착
  | 'erythema'          // 홍반
  | 'dry_patch';        // 건조반점

interface LesionClassifier {
  classify(features: LesionFeatures): LesionType;
  getConfidence(): number;
}

function classifyLesion(features: LesionFeatures): LesionType {
  const { colorProfile, shape, texture, size } = features;

  // 색상 기반 1차 분류
  if (colorProfile.aStar > 15 && shape.circularity > 0.7) {
    // 붉은색 + 원형 = 염증성
    if (colorProfile.lightness < 50 && hasWhiteCenter(features)) {
      return 'pustule';
    }
    return 'papule';
  }

  if (colorProfile.lightness < 40 && size.diameter < 3) {
    // 어둡고 작음 = 면포
    if (colorProfile.bStar < 10) {
      return 'comedone_open';  // 블랙헤드
    }
    return 'comedone_closed';  // 화이트헤드
  }

  if (colorProfile.aStar > 12 && colorProfile.aStar < 18) {
    return 'erythema';
  }

  if (colorProfile.lightness < 60 && colorProfile.bStar > 15) {
    return 'hyperpigmentation';
  }

  if (texture.entropy > 7 && colorProfile.lightness > 70) {
    return 'dry_patch';
  }

  return 'papule'; // 기본값
}
```

### 3.3 심도 평가

```typescript
type LesionDepth = 'surface' | 'shallow' | 'deep';

function assessDepth(lesion: DetectedLesion): LesionDepth {
  const { size, colorIntensity, borderDefinition } = lesion;

  // 깊이 점수 계산 (0-100)
  const depthScore =
    (size.diameter > 5 ? 30 : size.diameter * 6) +
    (colorIntensity > 0.7 ? 40 : colorIntensity * 57) +
    (borderDefinition < 0.5 ? 30 : (1 - borderDefinition) * 60);

  if (depthScore < 30) return 'surface';
  if (depthScore < 60) return 'shallow';
  return 'deep';
}
```

### 3.4 영역별 병변 분석

```typescript
type SkinZone =
  | 'forehead'
  | 'nose'
  | 'cheek_left'
  | 'cheek_right'
  | 'chin'
  | 'jaw';

interface ZoneLesionAnalysis {
  zone: SkinZone;
  lesions: DetectedLesion[];
  dominantType: LesionType | null;
  severityScore: number;  // 0-100
  trendVsPrevious: 'improved' | 'stable' | 'worsened' | null;
}

function analyzeZoneLesions(
  zone: SkinZone,
  lesions: DetectedLesion[],
  previousAnalysis?: ZoneLesionAnalysis
): ZoneLesionAnalysis {
  // 주요 타입 결정
  const typeCounts = countByType(lesions);
  const dominantType = getMaxKey(typeCounts);

  // 심각도 점수
  const severityScore = calculateZoneSeverity(lesions);

  // 트렌드 분석
  let trend: ZoneLesionAnalysis['trendVsPrevious'] = null;
  if (previousAnalysis) {
    const diff = severityScore - previousAnalysis.severityScore;
    if (diff < -10) trend = 'improved';
    else if (diff > 10) trend = 'worsened';
    else trend = 'stable';
  }

  return {
    zone,
    lesions,
    dominantType,
    severityScore,
    trendVsPrevious: trend,
  };
}
```

---

## 4. 검증 방법

### 4.1 감지 정확도 검증

```typescript
interface ValidationMetrics {
  precision: number;    // 검출된 것 중 실제 병변 비율
  recall: number;       // 실제 병변 중 검출된 비율
  f1Score: number;      // 조화 평균
  falsePositiveRate: number;
}

// 목표 기준
const TARGET_METRICS: ValidationMetrics = {
  precision: 0.85,
  recall: 0.80,
  f1Score: 0.82,
  falsePositiveRate: 0.10,
};
```

### 4.2 분류 일관성 검증

동일 이미지에 대한 반복 분석 시:
- 병변 개수 변동: ±10% 이내
- 타입 분류 일치율: 90% 이상
- 심도 평가 일치율: 85% 이상

### 4.3 전문가 비교 검증

피부과 전문의 평가와의 일치도:
- Kappa 계수 > 0.6 (substantial agreement)
- ICC (Intraclass Correlation) > 0.7

---

## 5. 제한 사항 및 면책

### 5.1 의료적 면책

```
중요 고지

이 분석은 AI 기반 피부 상태 추정이며, 의료 진단이 아닙니다.

다음 경우 반드시 피부과 전문의 상담을 권장합니다:
- 병변이 급격히 커지거나 변화하는 경우
- 출혈, 궤양, 딱지가 반복되는 경우
- 비대칭적이거나 경계가 불규칙한 병변
- 색상이 여러 가지로 혼재된 병변
- 직경 6mm 이상의 병변
- 가려움, 통증 등 증상 동반 시

본 서비스는 화장품/웰니스 목적의 참고 정보만 제공합니다.
```

### 5.2 ABCDE 규칙 안내

사용자에게 피부암 자가 점검 기준 안내:

| 기준 | 설명 | 주의 신호 |
|------|------|----------|
| **A**symmetry | 비대칭 | 반으로 나눴을 때 불일치 |
| **B**order | 경계 | 불규칙, 들쭉날쭉 |
| **C**olor | 색상 | 여러 색 혼재 |
| **D**iameter | 크기 | 6mm 이상 |
| **E**volving | 변화 | 크기/색/형태 변화 |

---

## 6. 참고 자료

- Fitzpatrick, T.B. et al. (2019). Dermatology in General Medicine, 9th Edition
- Esteva, A. et al. (2017). "Dermatologist-level classification of skin cancer with deep neural networks." Nature 542: 115-118
- skin-physiology.md 섹션 10 (붉은기/트러블 분석)
- 대한피부과학회 교과서

---

## 7. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서 | 설명 |
|------|------|
| [SDD-SKIN-ANALYSIS-v2](../specs/SDD-SKIN-ANALYSIS-v2.md) | 피부분석 v2 모듈 스펙 |
| [SDD-VISUAL-SKIN-REPORT](../specs/SDD-VISUAL-SKIN-REPORT.md) | 시각적 피부 리포트 |

### 관련 원리 문서

| 문서 | 설명 |
|------|------|
| [skin-physiology.md](./skin-physiology.md) | 피부 생리학 기반 |
| [image-processing.md](./image-processing.md) | 이미지 전처리 |
| [color-science.md](./color-science.md) | 색공간 분석 |

---

**Version**: 1.0 | **Created**: 2026-01-29
**소스 리서치**: skin-physiology.md 확장
**관련 모듈**: S-1, S-2, 피부 분석
