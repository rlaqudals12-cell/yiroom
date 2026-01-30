# 손목 정맥 색상 기반 퍼스널 컬러 언더톤 분석 알고리즘

## 1. 핵심 요약 (Key Summary)

**손목 정맥 색상을 통한 웜/쿨 언더톤 판별은 과학적 검증이 부족한 보조적 방법**으로, 단독 사용 시 신뢰도가 낮습니다. Lab 색공간의 **a\*(녹색-적색 축)와 b\*(청색-황색 축)** 값을 활용하여 정맥 영역과 주변 피부의 상대적 색상 차이(Δa\*, Δb\*)를 분석하는 것이 절대값 측정보다 정확합니다. 한국인 피부는 **평균 b\* ≈ 18.34로 황색 언더톤이 강해** 정맥이 녹색으로 보이는 경향이 있으며, 이를 보정하는 알고리즘이 필수입니다. 모바일 카메라의 한계로 **자연광 환경에서의 촬영과 화이트밸런스 보정**이 정확도 확보에 결정적이며, 정맥 테스트는 전체 퍼스널 컬러 분석의 **10% 이하 가중치**로 참고 데이터로만 활용할 것을 권장합니다.

---

## 2. 상세 내용 (Detailed Content)

### 2.1 이미지에서의 손목 정맥 검출 방법

#### 2.1.1 가시광선 기반 정맥 이미지 특성

스마트폰 카메라의 가시광선(400-780nm)으로 정맥을 촬영할 때, **탈산소화 헤모글로빈**이 적색광을 흡수하고 청색/녹색광이 반사되어 정맥이 보입니다. 근적외선(NIR) 방식과 달리 가시광선 방식은 피부톤에 따른 가시성 편차가 크고, **멜라닌 농도가 높을수록 정맥 인식률이 저하**됩니다. 최적의 정맥 대비는 **녹색 채널(Green channel)**에서 얻을 수 있으며, 이를 기반으로 전처리를 수행합니다.

| 촬영 방식 | 피부 투과 깊이 | 멜라닌 영향 | 하드웨어 요구 |
|-----------|---------------|------------|--------------|
| 근적외선(NIR) | 3-7mm | 최소 | 별도 NIR LED 필요 |
| 가시광선 | 표피층 | **높음** | 일반 스마트폰 |

#### 2.1.2 딥러닝 기반 정맥 세그멘테이션

**U-Net 아키텍처**가 정맥 세그멘테이션에 가장 널리 사용됩니다. Encoder-Decoder 구조와 Skip Connection을 통해 미세 혈관까지 검출 가능하며, DRIVE 데이터셋 기준 **AUC ROC 0.979, 정확도 96.7%**를 달성합니다.

권장 학습 구성:
- 입력 패치: 48×48 또는 64×64 픽셀
- 학습 데이터: 최소 1,000장의 어노테이션 이미지
- 손실 함수: Binary Cross-Entropy
- 데이터 증강: 회전, 반전, 감마 보정, Elastic Deformation

#### 2.1.3 전통적 이미지 처리 기법

모바일 환경에서 실시간 처리가 필요한 경우, 딥러닝보다 전통적 필터가 효율적입니다:

**Frangi 필터 (Vesselness Filter)**: Hessian 행렬의 고유값 분석으로 관 형태 구조를 검출합니다. 주요 파라미터는 **σ(스케일): 0.5-5 픽셀, β(blob-ness): 0.5**입니다.

**권장 전처리 파이프라인**:
1. 녹색 채널 추출 → 2. CLAHE(대비 제한 적응 히스토그램 균등화) → 3. 형태학적 열기(Opening, 3px) → 4. Top-hat 변환(8px) → 5. 가우시안 블러 → 6. 적응형 임계처리

#### 2.1.4 ROI(관심영역) 추출

**MediaPipe Hand Landmarker**를 사용하여 손목 랜드마크(인덱스 0)를 검출하고, 손목에서 전완 방향으로 직사각형 ROI를 추출합니다. TensorFlow.js 또는 OpenCV.js를 통해 브라우저에서 직접 실행 가능합니다.

#### 2.1.5 모바일 카메라 제약사항

- **최소 해상도**: 720p (1280×720), **권장**: 1080p
- **실시간 처리 목표**: 15-30 FPS
- **자동 노출/초점 문제**: 정맥 영역 과노출 방지를 위해 노출 고정 필요
- **JavaScript 라이브러리**: TensorFlow.js, OpenCV.js (@techstark/opencv-js), MediaPipe

---

### 2.2 Lab 색공간 기반 정맥 색상 판별

#### 2.2.1 Lab 색공간의 이점

CIELAB 색공간은 **인간의 색 지각과 일치**하도록 설계되어 피부/정맥 분석에 최적입니다:

- **L\* (밝기)**: 0(검정) ~ 100(흰색)
- **a\* (녹색-적색)**: 음수 = 녹색, 양수 = 적색
- **b\* (청색-황색)**: 음수 = 청색, 양수 = 황색

RGB 대비 Lab의 장점은 **조명 변화에 독립적인 색상 분석**이 가능하고, **Delta E 계산**을 통해 정량적 색차 측정이 가능하다는 것입니다.

#### 2.2.2 정맥 색상의 Lab 값 해석

| 정맥 외관 | a\* 범위 | b\* 범위 | 의미 |
|-----------|---------|---------|------|
| 녹색 계열 | **-25 ~ -5** | -5 ~ +10 | 음수 a\* 우세 |
| 청색 계열 | -10 ~ +5 | **-30 ~ -5** | 음수 b\* 우세 |
| 보라색 계열 | +5 ~ +15 | -20 ~ -5 | 양수 a\*, 음수 b\* |
| 청록색 계열 | -15 ~ -5 | -15 ~ -5 | 둘 다 음수 |

#### 2.2.3 실제 정맥 색상 vs 인지되는 정맥 색상

**중요 과학적 사실**: 정맥이 파랗거나 녹색으로 보이는 것은 **틴들 효과(Tyndall Effect)가 아닌 감산 혼색(Subtractive Color Mixing)** 때문입니다. 탈산소화 헤모글로빈이 적색광을 흡수하여 반사되는 적색이 줄어들고, 뇌가 주변 피부와의 **동시 대비(Simultaneous Contrast)**를 통해 이를 청색으로 인식합니다.

웜톤 피부(황색 언더톤)에서는 피부의 양수 b\* 값이 정맥의 청색을 중화시켜 **녹색으로 보이게** 하고, 쿨톤 피부(핑크 언더톤)에서는 이러한 필터링이 없어 **청색/보라색으로 보입니다**.

#### 2.2.4 색상 측정 방법론

**상대적 색상 측정**이 절대적 측정보다 정확합니다:
1. 정맥 영역 ROI와 인접 피부 영역 샘플링
2. 각 영역의 평균 Lab 값 계산
3. **Δa\*, Δb\*, ΔE** 계산 (정맥 - 피부)
4. Delta 값 기반으로 언더톤 분류

**Delta E 해석 기준**:
| ΔE 값 | 인지 수준 |
|-------|----------|
| 0-1 | 인지 불가 |
| 1-2 | 주의 깊게 보면 인지 |
| 2-3.5 | 한눈에 인지 |
| 3.5-5 | 명확한 차이 |
| >5 | 확연히 다른 색상 |

---

### 2.3 웜톤(녹색 정맥) vs 쿨톤(청색 정맥) 임계값

#### 2.3.1 과학적 타당성 평가

**핵심 경고**: 정맥 테스트는 **과학적 검증이 없는 민간 방법**입니다. 전문 퍼스널 컬러 분석가들의 테스트 결과, **95%가 실제 언더톤과 반대되는 정맥 색상**을 보였다는 보고가 있습니다. 따라서 이 방법은 단독 판별 기준이 아닌 **보조적 참고 데이터**로만 활용해야 합니다.

정맥 테스트 신뢰도가 낮은 이유:
- 정맥 자체는 무색이며 색상은 광학적 현상
- 멜라닌 함량에 따른 가시성 변화
- 피하지방 두께의 개인차
- 혈중 산소 농도 변화
- 조명 조건의 영향

#### 2.3.2 언더톤 판별 Lab 임계값 (상대적 측정 기준)

**정맥-피부 간 Delta 값 기반 분류 기준표**:

| 언더톤 | Δa\* (정맥-피부) | Δb\* (정맥-피부) | 판별 조건 | 신뢰도 |
|--------|-----------------|-----------------|----------|--------|
| **웜톤 (녹색 정맥)** | < -5 | > -3 | Δa\* 음수 우세, Δb\* 중립/양수 | 중간 |
| **쿨톤 (청색 정맥)** | > -3 | < -5 | Δb\* 음수 우세 | 중간 |
| **쿨톤 (보라 정맥)** | > 0 | < -5 | Δa\* 양수, Δb\* 음수 | 낮음 |
| **뉴트럴** | -3 ~ +3 | -3 ~ +3 | 양쪽 Delta 값 모두 미미 | 낮음 |

**절대값 기준 참고 임계값 (정맥 영역)**:

| 분류 | L\* | a\* | b\* | 비고 |
|------|-----|-----|-----|------|
| 녹색 정맥 | 40-70 | **< -8** | -5 ~ +10 | 녹색 축 우세 |
| 청색 정맥 | 40-70 | -5 ~ +5 | **< -8** | 청색 축 우세 |
| 보라 정맥 | 40-70 | +5 ~ +15 | -20 ~ -5 | 적색+청색 혼합 |
| 경계선/뉴트럴 | 40-70 | -5 ~ +5 | -5 ~ +5 | 명확한 우세 없음 |

#### 2.3.3 한국인/아시아인 피부 특성 고려

**한국인 피부 Lab 평균값** (연세대 연구, n=148):
| 파라미터 | 평균값 | 표준편차 |
|----------|--------|---------|
| L\* | 64.15 | ±4.86 |
| a\* | 8.96 | ±2.65 |
| b\* | **18.34** | ±2.39 |

한국인 피부의 **높은 b\* 값(황색 언더톤)**은 정맥 색상 인지에 큰 영향을 미칩니다. 황색 필터 효과로 인해 쿨톤 한국인도 정맥이 녹색으로 보일 수 있어, **표준 임계값 조정이 필요**합니다.

**피츠패트릭 피부 유형 분포 (한국인)**:
- Type III: 55.0% (가장 흔함)
- Type IV: 29.0%
- Type V: 12.3%
- Type I-II: 3.7%

#### 2.3.4 신뢰도 점수 계산

단일 정맥 테스트의 신뢰도가 낮으므로, **다중 요소 가중치 방식**을 권장합니다:

| 요소 | 가중치 | 측정 방법 |
|------|--------|----------|
| 피부 표면 Lab 측정 | 40% | 분광광도계 또는 보정된 이미징 |
| 컬러 드레이핑 반응 | 30% | 골드/실버 색상 대비 |
| 주얼리 테스트 | 15% | 금속 색상 어울림 |
| **정맥 관찰** | **10%** | 보조 데이터로만 |
| 모발/눈동자 언더톤 | 5% | 2차 확인 |

---

### 2.4 조명 및 피부색 영향 보정

#### 2.4.1 조명 조건별 정맥 외관 변화

| 조명 유형 | 색온도 | 정맥 외관 영향 |
|----------|--------|--------------|
| 백열등 | 2700-3000K | 웜톤 캐스트, 정맥이 올리브/녹색으로 |
| 형광등(쿨화이트) | 4000-5000K | 쿨톤 캐스트, 정맥이 청색으로 |
| **자연광** | 5500-6500K | **중립, 가장 정확** |
| 그늘/흐림 | 7000-8000K | 청색 캐스트, 정맥이 보라색으로 |

**권장 촬영 조건**: 창가 자연광(직사광선 제외), 100-1000 lux, 색온도 5500-6500K

#### 2.4.2 화이트밸런스 보정 알고리즘

**Gray World Assumption**: 이미지 전체의 평균 RGB가 회색이라고 가정하고 게인 보정
- 단점: 피부가 대부분인 프레임에서는 부정확

**Von Kries 색순응 변환 (CAT)**: LMS 원추세포 반응을 스케일링하여 조명 색상 보정
- **Bradford 행렬** 또는 **CAT02 행렬** 권장 (CIE 표준)

**참조점 기반 보정**: 사용자가 흰색/회색 참조물을 프레임에 포함시키면 더 정확한 보정 가능

#### 2.4.3 피부색/멜라닌 영향 보정

**ITA (Individual Typology Angle)** 공식으로 피부 색소 수준을 정량화:

```
ITA° = arctan[(L* - 50) / b*] × (180/π)
```

| ITA 범위 | 피부 분류 | 정맥 가시성 |
|---------|----------|------------|
| > 55° | Very Light | 높음 |
| 41-55° | Light | 높음 |
| 28-41° | Intermediate | 중간 |
| 10-28° | Tan | 낮음 |
| -30~10° | Brown | 매우 낮음 |
| < -30° | Dark | 거의 없음 |

**멜라닌 보정 적용**: ITA < 10° (Tan~Dark)인 경우, 정맥 검출 민감도를 **20-40% 상향** 조정

#### 2.4.4 상대적 색상 측정의 중요성

조명 보정의 한계를 극복하기 위해 **정맥-피부 간 상대적 색차(Δ값)**를 사용합니다. 이 방법은 동일 조명 조건에서 촬영된 두 영역을 비교하므로 조명 색온도의 절대적 영향을 상쇄합니다.

---

## 3. 구현 체크리스트 (Implementation Checklist)

### 이미지 획득 및 전처리
- [ ] MediaPipe Hand Landmarker 통합하여 손목 ROI 자동 추출
- [ ] 조명 품질 점수 계산 (밝기 균일도, 색캐스트, 노출 분석)
- [ ] 조명 품질 미달 시 사용자에게 실시간 피드백 제공
- [ ] Gray World 또는 Von Kries 화이트밸런스 보정 적용
- [ ] 플래시 사용 감지 및 경고 메시지 표시

### 정맥 영역 검출
- [ ] 녹색 채널 추출 및 CLAHE 대비 향상 적용
- [ ] 적응형 임계처리(Adaptive Thresholding)로 정맥 마스크 생성
- [ ] 형태학적 연산(Opening/Closing)으로 노이즈 제거
- [ ] YCbCr 색공간 기반 피부 영역 검출 구현
- [ ] 정맥 마스크와 피부 마스크 교집합 계산

### 색상 분석
- [ ] RGB → Lab 변환 함수 구현 (D65 광원 기준)
- [ ] 정맥 영역 및 주변 피부 영역 평균 Lab 값 계산
- [ ] Δa*, Δb*, ΔE 계산 로직 구현
- [ ] ITA 계산 및 피부톤 분류 기능 추가
- [ ] 멜라닌 수준에 따른 임계값 동적 조정

### 언더톤 분류
- [ ] Delta 값 기반 웜/쿨/뉴트럴 분류 로직 구현
- [ ] 신뢰도 점수 계산 알고리즘 구현
- [ ] 한국인 피부 특성 보정 파라미터 적용
- [ ] 낮은 신뢰도 시 "판별 불가" 결과 반환 처리
- [ ] 정맥 테스트 결과를 보조 데이터(10% 가중치)로 통합

### 사용자 경험
- [ ] 최적 촬영 조건 안내 UI (자연광, 거리, 자세)
- [ ] 실시간 조명/포커스/움직임 체크 오버레이
- [ ] 분석 결과에 신뢰도 수준 표시
- [ ] 정맥 테스트의 과학적 한계 고지 문구 포함

---

## 4. TypeScript 코드 예제 (Code Examples)

### 4.1 RGB → Lab 변환

```typescript
interface LabColor {
  L: number;
  a: number;
  b: number;
}

function rgbToLab(r: number, g: number, b: number): LabColor {
  // 1. RGB 정규화 (0-255 → 0-1)
  let rn = r / 255;
  let gn = g / 255;
  let bn = b / 255;

  // 2. sRGB 감마 보정 (선형화)
  const linearize = (v: number): number =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  
  rn = linearize(rn);
  gn = linearize(gn);
  bn = linearize(bn);

  // 3. XYZ 변환 (D65 광원)
  let x = rn * 0.4124564 + gn * 0.3575761 + bn * 0.1804375;
  let y = rn * 0.2126729 + gn * 0.7151522 + bn * 0.0721750;
  let z = rn * 0.0193339 + gn * 0.1191920 + bn * 0.9503041;

  // 4. D65 백색점 정규화
  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  // 5. Lab 변환
  const f = (t: number): number =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;

  const L = 116 * f(y) - 16;
  const a = 500 * (f(x) - f(y));
  const bVal = 200 * (f(y) - f(z));

  return { L, a, b: bVal };
}
```

### 4.2 ITA (Individual Typology Angle) 계산

```typescript
interface ITAResult {
  value: number;
  category: 'veryLight' | 'light' | 'intermediate' | 'tan' | 'brown' | 'dark';
  veinVisibility: 'high' | 'moderate' | 'low' | 'veryLow';
}

function calculateITA(L: number, b: number): ITAResult {
  // ITA 공식: arctan[(L* - 50) / b*] × (180/π)
  const itaRadians = Math.atan((L - 50) / b);
  const itaDegrees = itaRadians * (180 / Math.PI);

  // 카테고리 분류
  let category: ITAResult['category'];
  let veinVisibility: ITAResult['veinVisibility'];

  if (itaDegrees > 55) {
    category = 'veryLight';
    veinVisibility = 'high';
  } else if (itaDegrees > 41) {
    category = 'light';
    veinVisibility = 'high';
  } else if (itaDegrees > 28) {
    category = 'intermediate';
    veinVisibility = 'moderate';
  } else if (itaDegrees > 10) {
    category = 'tan';
    veinVisibility = 'low';
  } else if (itaDegrees > -30) {
    category = 'brown';
    veinVisibility = 'veryLow';
  } else {
    category = 'dark';
    veinVisibility = 'veryLow';
  }

  return { value: itaDegrees, category, veinVisibility };
}
```

### 4.3 정맥 언더톤 분석 메인 함수

```typescript
interface VeinAnalysisResult {
  undertone: 'warm' | 'cool' | 'neutral' | 'indeterminate';
  confidence: number;
  veinLab: LabColor;
  skinLab: LabColor;
  delta: { a: number; b: number; E: number };
  ita: ITAResult;
  warnings: string[];
}

interface AnalysisThresholds {
  warmDeltaA: number;      // 웜톤 Δa* 임계값 (음수)
  coolDeltaB: number;      // 쿨톤 Δb* 임계값 (음수)
  neutralRange: number;    // 뉴트럴 판정 범위
  minDeltaE: number;       // 최소 색차 (너무 작으면 판별 불가)
}

// 한국인 피부 특성 반영 기본 임계값
const KOREAN_THRESHOLDS: AnalysisThresholds = {
  warmDeltaA: -4,     // 한국인 황색 피부 보정 (-5 → -4)
  coolDeltaB: -6,     // 한국인 황색 피부 보정 (-5 → -6)
  neutralRange: 3,
  minDeltaE: 3,
};

function analyzeVeinUndertone(
  veinPixels: Uint8ClampedArray,
  skinPixels: Uint8ClampedArray,
  thresholds: AnalysisThresholds = KOREAN_THRESHOLDS
): VeinAnalysisResult {
  const warnings: string[] = [];

  // 1. 평균 Lab 값 계산
  const veinLab = calculateAverageLab(veinPixels);
  const skinLab = calculateAverageLab(skinPixels);

  // 2. ITA 계산 (피부톤 분류)
  const ita = calculateITA(skinLab.L, skinLab.b);
  
  // 정맥 가시성 낮으면 경고
  if (ita.veinVisibility === 'low' || ita.veinVisibility === 'veryLow') {
    warnings.push('피부톤으로 인해 정맥 가시성이 낮습니다. 결과 신뢰도가 감소합니다.');
  }

  // 3. Delta 값 계산
  const deltaA = veinLab.a - skinLab.a;
  const deltaB = veinLab.b - skinLab.b;
  const deltaE = Math.sqrt(
    Math.pow(veinLab.L - skinLab.L, 2) +
    Math.pow(deltaA, 2) +
    Math.pow(deltaB, 2)
  );

  // 4. 색차가 너무 작으면 판별 불가
  if (deltaE < thresholds.minDeltaE) {
    return {
      undertone: 'indeterminate',
      confidence: 0,
      veinLab,
      skinLab,
      delta: { a: deltaA, b: deltaB, E: deltaE },
      ita,
      warnings: [...warnings, '정맥과 피부 간 색차가 너무 작아 판별이 어렵습니다.'],
    };
  }

  // 5. 멜라닌 보정 (ITA 기반 임계값 조정)
  const adjustedThresholds = adjustThresholdsForMelanin(thresholds, ita.value);

  // 6. 언더톤 분류
  let undertone: VeinAnalysisResult['undertone'];
  let confidence: number;

  if (deltaA < adjustedThresholds.warmDeltaA && deltaB > -adjustedThresholds.neutralRange) {
    // 녹색 정맥 (웜톤): Δa* 음수 우세, Δb* 중립/양수
    undertone = 'warm';
    confidence = calculateConfidence(deltaA, deltaB, deltaE, 'warm');
  } else if (deltaB < adjustedThresholds.coolDeltaB && deltaA > adjustedThresholds.warmDeltaA) {
    // 청색/보라 정맥 (쿨톤): Δb* 음수 우세
    undertone = 'cool';
    confidence = calculateConfidence(deltaA, deltaB, deltaE, 'cool');
  } else if (
    Math.abs(deltaA) < adjustedThresholds.neutralRange &&
    Math.abs(deltaB) < adjustedThresholds.neutralRange
  ) {
    // 뉴트럴: 양쪽 모두 미미
    undertone = 'neutral';
    confidence = calculateConfidence(deltaA, deltaB, deltaE, 'neutral');
  } else {
    // 경계선 케이스
    undertone = 'indeterminate';
    confidence = 0;
    warnings.push('경계선 색상으로 명확한 판별이 어렵습니다.');
  }

  // 7. 정맥 테스트의 과학적 한계 반영 (최대 신뢰도 제한)
  const MAX_VEIN_TEST_CONFIDENCE = 0.6; // 단독 정맥 테스트 최대 60%
  confidence = Math.min(confidence, MAX_VEIN_TEST_CONFIDENCE);

  return {
    undertone,
    confidence,
    veinLab,
    skinLab,
    delta: { a: deltaA, b: deltaB, E: deltaE },
    ita,
    warnings,
  };
}

function calculateAverageLab(pixels: Uint8ClampedArray): LabColor {
  let totalL = 0, totalA = 0, totalB = 0;
  const pixelCount = pixels.length / 4;

  for (let i = 0; i < pixels.length; i += 4) {
    const lab = rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]);
    totalL += lab.L;
    totalA += lab.a;
    totalB += lab.b;
  }

  return {
    L: totalL / pixelCount,
    a: totalA / pixelCount,
    b: totalB / pixelCount,
  };
}

function adjustThresholdsForMelanin(
  base: AnalysisThresholds,
  ita: number
): AnalysisThresholds {
  // ITA가 낮을수록 (피부가 어두울수록) 정맥 검출이 어려워 임계값 완화
  if (ita < 10) {
    const factor = 1 + (10 - ita) * 0.03; // 최대 ~1.9배 완화
    return {
      ...base,
      warmDeltaA: base.warmDeltaA * factor,
      coolDeltaB: base.coolDeltaB * factor,
      neutralRange: base.neutralRange * factor,
    };
  }
  return base;
}

function calculateConfidence(
  deltaA: number,
  deltaB: number,
  deltaE: number,
  classification: 'warm' | 'cool' | 'neutral'
): number {
  // 색차가 클수록, 분류 기준에서 멀리 떨어질수록 신뢰도 증가
  const baseConfidence = Math.min(deltaE / 15, 0.5); // deltaE 기반 기본 신뢰도

  let classificationBonus = 0;
  switch (classification) {
    case 'warm':
      // Δa*가 더 음수일수록 확실한 웜톤
      classificationBonus = Math.min(Math.abs(deltaA) / 20, 0.3);
      break;
    case 'cool':
      // Δb*가 더 음수일수록 확실한 쿨톤
      classificationBonus = Math.min(Math.abs(deltaB) / 25, 0.3);
      break;
    case 'neutral':
      // 양쪽 delta가 모두 0에 가까울수록 확실한 뉴트럴
      const maxDelta = Math.max(Math.abs(deltaA), Math.abs(deltaB));
      classificationBonus = Math.max(0, 0.2 - maxDelta / 20);
      break;
  }

  return Math.min(baseConfidence + classificationBonus, 1.0);
}
```

### 4.4 조명 품질 검사

```typescript
interface LightingQuality {
  score: number;
  issues: string[];
  recommendation: string;
  canProceed: boolean;
}

function assessLightingQuality(imageData: ImageData): LightingQuality {
  const issues: string[] = [];
  let score = 100;

  // 1. 밝기 분석
  const brightness = calculateAverageBrightness(imageData);
  if (brightness < 80) {
    score -= 30;
    issues.push('이미지가 너무 어둡습니다');
  } else if (brightness > 220) {
    score -= 25;
    issues.push('이미지가 너무 밝습니다 (과노출)');
  }

  // 2. 색캐스트 검사
  const colorCast = detectColorCast(imageData);
  if (colorCast.strength > 0.15) {
    score -= 20;
    issues.push(`${colorCast.type} 색상 캐스트 감지됨`);
  }

  // 3. 밝기 균일도 검사
  const uniformity = calculateBrightnessUniformity(imageData);
  if (uniformity < 0.7) {
    score -= 15;
    issues.push('조명이 불균일합니다');
  }

  // 권장사항 생성
  let recommendation = '촬영 조건이 양호합니다.';
  if (issues.length > 0) {
    recommendation = issues.includes('어둡')
      ? '창가로 이동하거나 조명을 켜세요.'
      : issues.includes('밝')
      ? '직사광선을 피하고 그늘로 이동하세요.'
      : '자연광이 있는 곳에서 다시 촬영해주세요.';
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendation,
    canProceed: score >= 50,
  };
}

function calculateAverageBrightness(imageData: ImageData): number {
  let sum = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    // ITU-R BT.709 휘도 공식
    sum += 0.2126 * imageData.data[i] + 
           0.7152 * imageData.data[i + 1] + 
           0.0722 * imageData.data[i + 2];
  }
  return sum / (imageData.data.length / 4);
}

function detectColorCast(imageData: ImageData): { type: string; strength: number } {
  let rSum = 0, gSum = 0, bSum = 0;
  const count = imageData.data.length / 4;

  for (let i = 0; i < imageData.data.length; i += 4) {
    rSum += imageData.data[i];
    gSum += imageData.data[i + 1];
    bSum += imageData.data[i + 2];
  }

  const rAvg = rSum / count;
  const gAvg = gSum / count;
  const bAvg = bSum / count;
  const gray = (rAvg + gAvg + bAvg) / 3;

  const rDev = (rAvg - gray) / gray;
  const gDev = (gAvg - gray) / gray;
  const bDev = (bAvg - gray) / gray;

  const maxDev = Math.max(Math.abs(rDev), Math.abs(gDev), Math.abs(bDev));
  
  let type = '없음';
  if (maxDev > 0.1) {
    if (rDev === maxDev) type = '적색(웜)';
    else if (gDev === maxDev) type = '녹색';
    else if (bDev === maxDev) type = '청색(쿨)';
    else if (rDev === -maxDev) type = '청록색';
    else if (gDev === -maxDev) type = '마젠타';
    else if (bDev === -maxDev) type = '황색';
  }

  return { type, strength: maxDev };
}

function calculateBrightnessUniformity(imageData: ImageData): number {
  // 이미지를 4x4 그리드로 나누어 각 영역 밝기 비교
  const gridSize = 4;
  const cellWidth = Math.floor(imageData.width / gridSize);
  const cellHeight = Math.floor(imageData.height / gridSize);
  const cellBrightness: number[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let sum = 0;
      let count = 0;
      
      for (let y = gy * cellHeight; y < (gy + 1) * cellHeight; y++) {
        for (let x = gx * cellWidth; x < (gx + 1) * cellWidth; x++) {
          const idx = (y * imageData.width + x) * 4;
          sum += 0.2126 * imageData.data[idx] + 
                 0.7152 * imageData.data[idx + 1] + 
                 0.0722 * imageData.data[idx + 2];
          count++;
        }
      }
      cellBrightness.push(sum / count);
    }
  }

  const avg = cellBrightness.reduce((a, b) => a + b) / cellBrightness.length;
  const variance = cellBrightness.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / cellBrightness.length;
  const stdDev = Math.sqrt(variance);

  // 균일도: 표준편차가 작을수록 1에 가까움
  return Math.max(0, 1 - stdDev / avg);
}
```

### 4.5 Gray World 화이트밸런스 보정

```typescript
function applyGrayWorldWhiteBalance(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const pixelCount = data.length / 4;

  // 평균 RGB 계산
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  const rAvg = rSum / pixelCount;
  const gAvg = gSum / pixelCount;
  const bAvg = bSum / pixelCount;

  // 회색 평균 계산 및 게인 적용
  const grayAvg = (rAvg + gAvg + bAvg) / 3;
  const rGain = grayAvg / rAvg;
  const gGain = grayAvg / gAvg;
  const bGain = grayAvg / bAvg;

  // 보정 적용
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.round(data[i] * rGain));
    data[i + 1] = Math.min(255, Math.round(data[i + 1] * gGain));
    data[i + 2] = Math.min(255, Math.round(data[i + 2] * bGain));
  }

  return new ImageData(data, imageData.width, imageData.height);
}
```

---

## 5. 예외 케이스 및 엣지 케이스 처리 (Exception Handling)

### 5.1 정맥 검출 실패 케이스

| 케이스 | 원인 | 처리 방법 |
|--------|------|----------|
| 정맥 미검출 | 어두운 피부톤, 피하지방 두께 | 에러 반환, 다른 분석 방법 권장 |
| 과다 검출 | 주름, 혈관 외 구조물 | 형태학적 필터링 강화, 연속성 검사 |
| 저대비 | 조명 부족, 노출 불량 | 조명 개선 안내, 재촬영 요청 |

### 5.2 조명 관련 예외

```typescript
const LIGHTING_EXCEPTIONS = {
  flashDetected: {
    message: '플래시 사용이 감지되었습니다. 자연광에서 재촬영해주세요.',
    action: 'retake',
  },
  mixedLighting: {
    message: '혼합 조명이 감지되었습니다 (자연광+인공광). 단일 광원을 사용해주세요.',
    action: 'warn',
  },
  extremeColorCast: {
    message: '강한 색 캐스트로 정확한 분석이 어렵습니다.',
    action: 'retake',
  },
  veryLowLight: {
    message: '조명이 너무 어두워 정맥 검출이 불가능합니다.',
    action: 'retake',
  },
};
```

### 5.3 피부톤 예외

| ITA 범위 | 예상 문제 | 권장 처리 |
|---------|----------|----------|
| < -30° | 정맥 거의 보이지 않음 | 정맥 테스트 스킵, 다른 방법 사용 |
| < 10° | 낮은 대비, 검출 어려움 | 임계값 완화, 신뢰도 50% 감소 |
| > 70° | 과민감 (잡음 증가 가능) | 노이즈 필터링 강화 |

### 5.4 경계선 케이스 처리

```typescript
function handleBorderlineCase(
  deltaA: number,
  deltaB: number,
  thresholds: AnalysisThresholds
): VeinAnalysisResult['undertone'] {
  // 웜/쿨 경계선: 두 축 모두 임계값 근처
  const warmScore = Math.abs(deltaA) / Math.abs(thresholds.warmDeltaA);
  const coolScore = Math.abs(deltaB) / Math.abs(thresholds.coolDeltaB);

  if (Math.abs(warmScore - coolScore) < 0.3) {
    // 두 점수 차이가 30% 미만이면 뉴트럴
    return 'neutral';
  }

  // 미세 차이: 우세한 쪽 선택하되 신뢰도 낮춤
  return warmScore > coolScore ? 'warm' : 'cool';
}
```

### 5.5 전체 예외 처리 플로우

```typescript
async function safeAnalyzeVeinUndertone(
  imageData: ImageData
): Promise<VeinAnalysisResult | { error: string; suggestion: string }> {
  try {
    // 1. 조명 품질 검사
    const lighting = assessLightingQuality(imageData);
    if (!lighting.canProceed) {
      return {
        error: '조명 조건 부적합',
        suggestion: lighting.recommendation,
      };
    }

    // 2. 피부 영역 검출
    const skinMask = detectSkinRegion(imageData);
    const skinPixelCount = countMaskPixels(skinMask);
    if (skinPixelCount < imageData.width * imageData.height * 0.1) {
      return {
        error: '피부 영역 검출 실패',
        suggestion: '손목 안쪽이 카메라를 향하도록 자세를 조정해주세요.',
      };
    }

    // 3. 정맥 검출
    const veinMask = detectVeins(imageData, skinMask);
    const veinPixelCount = countMaskPixels(veinMask);
    if (veinPixelCount < 100) {
      return {
        error: '정맥 검출 실패',
        suggestion: '조명을 밝게 하거나, 피부가 밝은 경우 정맥이 더 잘 보이는 위치를 찾아보세요.',
      };
    }

    // 4. ITA 기반 분석 가능 여부 판단
    const skinPixels = extractPixels(imageData, skinMask);
    const skinLab = calculateAverageLab(skinPixels);
    const ita = calculateITA(skinLab.L, skinLab.b);

    if (ita.veinVisibility === 'veryLow') {
      return {
        error: '피부톤으로 인한 분석 제한',
        suggestion: '정맥 테스트는 어두운 피부톤에서 정확도가 낮습니다. 다른 분석 방법을 사용해주세요.',
      };
    }

    // 5. 정상 분석 진행
    const veinPixels = extractPixels(imageData, veinMask);
    const adjacentSkinPixels = extractAdjacentSkinPixels(imageData, veinMask, skinMask);
    
    return analyzeVeinUndertone(veinPixels, adjacentSkinPixels);

  } catch (error) {
    return {
      error: '분석 중 오류 발생',
      suggestion: '앱을 재시작하거나 다시 촬영해주세요.',
    };
  }
}
```

---

## 6. 참고 문헌 (Reference Sources)

### 학술 논문

1. **Shive, M. L., et al. (2016)**. "The Role of Subtractive Color Mixing in the Perception of Blue Nevi and Veins—Beyond the Tyndall Effect." *JAMA Dermatology*. - 정맥 색상 인지의 과학적 메커니즘 규명

2. **Ronneberger, O., Fischer, P., & Brox, T. (2015)**. "U-Net: Convolutional Networks for Biomedical Image Segmentation." *MICCAI 2015*. - 의료 영상 세그멘테이션의 표준 아키텍처

3. **Frangi, A. F., et al. (1998)**. "Multiscale vessel enhancement filtering." *MICCAI 1998*. - Frangi Vesselness 필터 원논문

4. **Del Bino, S., et al. (2013)**. "Relationship between skin color and melanin content." *Skin Research and Technology*. - ITA 분류 체계

5. **Yun, I. S., et al. (Yonsei University)**. "Skin color analysis using a spectrophotometer in Asians." *PubMed*. - 한국인 피부 Lab 측정값

6. **Xiao, K., et al.** "Characterising the variations in ethnic skin colours." *Wiley*. - 민족별 피부색 비교 연구

7. **Sharma, G., Wu, W., & Dalal, E. N. (2005)**. "The CIEDE2000 color-difference formula." *Color Research & Application*. - CIEDE2000 알고리즘

### 기술 자료 및 라이브러리

8. **MediaPipe Hands Documentation** - https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
9. **OpenCV.js Documentation** - https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html
10. **TensorFlow.js** - https://www.tensorflow.org/js
11. **orobix/retina-unet** (GitHub) - U-Net 망막 혈관 세그멘테이션 구현
12. **Bruce Lindbloom Color Math** - http://www.brucelindbloom.com/ - 색공간 변환 공식

### 산업 표준

13. **CIE 15:2004** - Colorimetry, 3rd Edition - Lab 색공간 표준
14. **ISO/TR 28380-1:2014** - Health informatics — IHE Global Standards Adoption - 의료 영상 색상 표준

---

## 부록: 알고리즘 정확도 기대치

| 요소 | 예상 정확도 | 제한 요인 |
|------|------------|----------|
| 정맥 검출 (밝은 피부) | 85-95% | 조명 조건 |
| 정맥 검출 (중간 피부) | 60-80% | 멜라닌 농도 |
| 정맥 검출 (어두운 피부) | 20-40% | 낮은 대비 |
| 언더톤 분류 (단독 정맥 테스트) | **40-60%** | 과학적 검증 부재 |
| 언더톤 분류 (다중 요소 통합) | 70-85% | 각 요소의 품질 |

**핵심 권고사항**: 정맥 테스트는 **단독 사용 시 신뢰도가 낮으므로**, 반드시 피부 표면 Lab 측정, 컬러 드레이핑 등 다른 방법과 함께 사용하고, 전체 가중치의 **10% 이하**로 제한할 것을 강력히 권장합니다.