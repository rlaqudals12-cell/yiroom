# 체형 역학 원리

> 이 문서는 이룸 플랫폼의 체형 분석(C-1, C-2) 기반 원리를 설명한다.
>
> **소스 리서치**: C-2-R1

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 체형 및 자세 분석 시스템"

- 2D 이미지만으로 3D 체형 측정 정확도 95% 달성
- 모든 체형 타입(5종)을 99% 정확도로 분류
- 자세 문제(거북목, 측만증 등) 조기 감지 및 맞춤 교정 제안
- 한국인 체형 표준(Size Korea) 기반 정규화된 백분위 제공
- 체형→운동→스타일링 통합 추천 시스템
```

### 물리적 한계

| 항목             | 한계                                             |
| ---------------- | ------------------------------------------------ |
| 2D 촬영          | 깊이 정보 손실로 전후 측정 부정확 (MAE 6-7cm)    |
| 의복 영향        | 두꺼운 옷은 체형 측정 방해                       |
| MediaPipe 정확도 | 가려진 랜드마크(특히 허리)는 추정에 의존         |
| 일시적 자세      | 촬영 순간의 자세만 반영, 습관적 자세와 차이      |
| 의료적 한계      | 웰니스 참고용, 척추측만/탈출증 등 의료 진단 불가 |

### 100점 기준

- 33개 랜드마크 중 핵심 12개 visibility > 0.7
- WHR/WHtR/SHR 계산 오차 ±5% 이내
- CVA 각도 측정 오차 ±3° 이내
- 체형 분류 정확도 90% 이상 (5-fold CV)
- 자세 점수 0-100 척도 일관성 (ICC > 0.85)
- Size Korea 기준 백분위 정규화 완성
- 처리 시간 30FPS 이상 (모바일 포함)

### 현재 목표: 80%

- MediaPipe Pose 33개 랜드마크 통합
- 과일형 체형 분류 (남/여 5종)
- WHR, WHtR, SHR 비율 계산
- CVA 기반 거북목 점수화
- 자세 종합 점수 (0-100) 및 A-F 등급
- Size Korea 8차 조사 기준 정규화
- 체형별 운동/스타일링 기본 추천

### 의도적 제외

| 제외 항목                 | 이유                            | 재검토 시점              |
| ------------------------- | ------------------------------- | ------------------------ |
| Depth 카메라 통합         | 하드웨어 의존성 높음            | LiDAR 보급 확대 시       |
| 실시간 Cobb Angle         | X-ray 없이 정확도 한계          | 3D 포즈 기술 성숙 시     |
| Kibbe 체형 시스템         | 주관적 요소 많음, 자동화 어려움 | 사용자 요청 시           |
| Somatotype (Heath-Carter) | 피부 두께 캘리퍼 필요           | 비접촉 측정 기술 발전 시 |
| 척추측만증 진단           | 의료 영역, 규제 이슈            | 의료기기 인증 시         |
| PNF 스트레칭 자동화       | 파트너/도구 필요                | AR/VR 통합 시            |

---

## 1. MediaPipe Pose 랜드마크

### 1.1 33개 랜드마크 인덱스

| 인덱스 | 영문명         | 한글명        | 체형 분석 용도       |
| ------ | -------------- | ------------- | -------------------- |
| 0      | nose           | 코            | 기준점, 머리 위치    |
| 7-8    | ear            | 귀            | CVA(거북목) 측정     |
| **11** | left_shoulder  | 왼쪽 어깨     | ⭐ 어깨 너비, 대칭성 |
| **12** | right_shoulder | 오른쪽 어깨   | ⭐ 어깨 너비, 대칭성 |
| 13-14  | elbow          | 팔꿈치        | 팔 관절 각도         |
| 15-16  | wrist          | 손목          | 팔 길이              |
| **23** | left_hip       | 왼쪽 엉덩이   | ⭐ 골반, WHR         |
| **24** | right_hip      | 오른쪽 엉덩이 | ⭐ 골반, WHR         |
| **25** | left_knee      | 왼쪽 무릎     | ⭐ 다리 길이         |
| **26** | right_knee     | 오른쪽 무릎   | ⭐ 다리 길이         |
| **27** | left_ankle     | 왼쪽 발목     | ⭐ 전체 높이         |
| **28** | right_ankle    | 오른쪽 발목   | ⭐ 전체 높이         |
| 29-32  | heel/foot      | 발            | 자세 안정성          |

### 1.2 체형 측정별 랜드마크 조합

| 측정 항목        | 인덱스                | 계산 방법           |
| ---------------- | --------------------- | ------------------- |
| 어깨 너비        | 11, 12                | 유클리드 거리       |
| 엉덩이 너비      | 23, 24                | 유클리드 거리       |
| 허리 너비 (추정) | 11,12,23,24           | 엉덩이 × 0.8        |
| 상체 길이        | (11+12)/2 → (23+24)/2 | 중점 간 거리        |
| 하체 길이        | 23→25→27              | 누적 거리           |
| 전체 높이        | 0 → 27/28             | 코-발목 + 머리 보정 |

**주의**: MediaPipe에 허리 랜드마크가 없으므로 어깨-엉덩이 중간점(약 60%)을 허리로 추정

### 1.3 랜드마크 신뢰도

```typescript
interface Landmark {
  x: number; // 0.0 ~ 1.0 정규화
  y: number;
  z: number; // 깊이
  visibility?: number; // 가시성 (0.0 ~ 1.0)
  presence?: number; // 존재 확신도
}

// 신뢰도 임계값: 0.5 이상
function isReliable(landmark: Landmark): boolean {
  return (landmark.visibility ?? 0) > 0.5 && (landmark.presence ?? 0) > 0.5;
}
```

---

## 2. 체형 비율 공식

### 2.1 WHR (Waist-to-Hip Ratio)

**공식**:

```
WHR = 허리 둘레 / 엉덩이 둘레
```

**건강 기준 (WHO)**:

| 성별 | 정상   | 위험   |
| ---- | ------ | ------ |
| 남성 | < 0.90 | ≥ 0.90 |
| 여성 | < 0.85 | ≥ 0.85 |

**의미**: 복부 비만, 내장 지방 지표. BMI보다 75세+ 사망률 예측에 효과적.

### 2.2 WHtR (Waist-to-Height Ratio)

**공식**:

```
WHtR = 허리 둘레 / 신장
```

**분류 (NICE 2022)**:

| WHtR       | 상태        | 조치          |
| ---------- | ----------- | ------------- |
| < 0.4      | 저체중 가능 | 영양 상담     |
| 0.4 ~ 0.49 | **정상**    | 유지          |
| 0.5 ~ 0.59 | 주의        | 생활습관 개선 |
| ≥ 0.6      | 위험        | 의료 상담     |

**핵심**: "허리 둘레를 신장의 절반 미만으로 유지"

**장점**: 성별/연령/민족 관계없이 동일 기준 적용 가능

### 2.3 SHR (Shoulder-to-Hip Ratio)

**공식**:

```
SHR = 어깨 너비 / 엉덩이 너비
```

**체형 분류**:

| SHR       | 체형        |
| --------- | ----------- |
| > 1.1     | 역삼각형    |
| 0.9 ~ 1.1 | 균형        |
| < 0.9     | 배형/삼각형 |

**황금비 (Adonis Index)**: 어깨/허리 = **1.618** (1.55~1.65 범위)

---

## 3. 관절 각도 측정

### 3.1 3D 각도 계산

**벡터 내적 공식** (B가 꼭지점):

$$\theta = \arccos\left(\frac{\vec{BA} \cdot \vec{BC}}{|\vec{BA}| \times |\vec{BC}|}\right)$$

```typescript
function calculateAngle3D(a: Point3D, b: Point3D, c: Point3D): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cos) * (180 / Math.PI);
}
```

### 3.2 주요 관절 정상 ROM

| 관절   | 동작      | 정상 범위 |
| ------ | --------- | --------- |
| 무릎   | 굴곡/신전 | 0° ~ 140° |
| 어깨   | 굴곡      | 0° ~ 180° |
| 어깨   | 외전      | 0° ~ 150° |
| 고관절 | 굴곡      | 0° ~ 125° |
| 발목   | 배측굴곡  | 0° ~ 20°  |

### 3.3 무릎 각도 예시

```typescript
function calculateKneeAngle(landmarks: Landmark[]): number {
  const hip = landmarks[23]; // LEFT_HIP
  const knee = landmarks[25]; // LEFT_KNEE
  const ankle = landmarks[27]; // LEFT_ANKLE

  return calculateAngle3D(hip, knee, ankle);
}
```

---

## 4. 자세 평가 메트릭

### 4.1 척추 곡률 정상 범위

| 부위          | 곡률        | 정상                 | 비정상        |
| ------------- | ----------- | -------------------- | ------------- |
| 경추 (C2-C7)  | 전만        | 20°~40°              | <10° (일자목) |
| 흉추 (T2-T12) | 후만        | 20°~40°              | >40° (굽은등) |
| 요추          | 전만        | 40°~60°              | 범위 이탈     |
| 골반          | 전방 기울기 | 남 4°~10°, 여 7°~15° | >15°          |

### 4.2 주요 자세 문제

| 문제         | 측정 방법           | 정상    | 경미    | 심각 |
| ------------ | ------------------- | ------- | ------- | ---- |
| **거북목**   | CVA (귀-C7-수평선)¹ | >50°    | 40°~50° | <40° |
| **측만증**   | Cobb Angle          | <10°    | 10°~25° | >40° |
| **전방경사** | ASIS-PSIS 각도      | 4°~15°  | 15°~20° | >20° |
| **굽은등**   | T2-T12 Cobb         | 20°~40° | 40°~55° | >55° |

### 4.3 자세 점수 알고리즘

```typescript
interface PostureMetrics {
  cva: number; // 두개척추각
  thoracicKyphosis: number; // 흉추 후만각
  pelvicTilt: number; // 골반 기울기
  spineSymmetry: number; // 척추 대칭성 (0-1)
}

const WEIGHTS = {
  cva: 0.3,
  thoracicKyphosis: 0.25,
  pelvicTilt: 0.25,
  spineSymmetry: 0.2,
};

function calculatePostureScore(metrics: PostureMetrics): {
  score: number;
  grade: string;
  issues: string[];
} {
  const issues: string[] = [];

  // CVA 점수 (정상: 48-65, 최적: 55)
  let cvaScore = 100;
  if (metrics.cva < 48) {
    cvaScore = Math.max(0, 70 - (48 - metrics.cva) * 5);
    issues.push('거북목 의심');
  } else if (metrics.cva > 65) {
    cvaScore = Math.max(0, 70 - (metrics.cva - 65) * 5);
  } else {
    cvaScore = 100 - Math.abs(metrics.cva - 55) * 2;
  }

  // 흉추 후만 점수 (정상: 20-40, 최적: 30)
  let kyphosisScore = 100;
  if (metrics.thoracicKyphosis > 40) {
    kyphosisScore = Math.max(0, 70 - (metrics.thoracicKyphosis - 40) * 3);
    issues.push('굽은등 의심');
  } else if (metrics.thoracicKyphosis < 20) {
    kyphosisScore = Math.max(0, 70 - (20 - metrics.thoracicKyphosis) * 3);
  } else {
    kyphosisScore = 100 - Math.abs(metrics.thoracicKyphosis - 30) * 2;
  }

  // 골반 점수 (정상: 4-15, 최적: 10)
  let pelvicScore = 100;
  if (metrics.pelvicTilt > 15) {
    pelvicScore = Math.max(0, 70 - (metrics.pelvicTilt - 15) * 5);
    issues.push('전방경사 의심');
  } else {
    pelvicScore = 100 - Math.abs(metrics.pelvicTilt - 10) * 3;
  }

  // 대칭성 점수
  const symmetryScore = metrics.spineSymmetry * 100;
  if (metrics.spineSymmetry < 0.9) {
    issues.push('척추 비대칭 의심');
  }

  // 종합 점수
  const score = Math.round(
    cvaScore * WEIGHTS.cva +
      kyphosisScore * WEIGHTS.thoracicKyphosis +
      pelvicScore * WEIGHTS.pelvicTilt +
      symmetryScore * WEIGHTS.spineSymmetry
  );

  // 등급
  let grade: string;
  if (score >= 90) grade = 'A (우수)';
  else if (score >= 80) grade = 'B (양호)';
  else if (score >= 70) grade = 'C (보통)';
  else if (score >= 60) grade = 'D (주의)';
  else grade = 'F (위험)';

  return { score, grade, issues };
}
```

---

## 5. 체형 분류 시스템

### 5.1 분류 시스템 비교

| 시스템     | 분류 기준     | 유형 수  | 앱 적합성        |
| ---------- | ------------- | -------- | ---------------- |
| **과일형** | 측정값 비율   | 5~7개    | ⭐ **높음**      |
| Kibbe      | Yin/Yang 균형 | 13개     | 낮음 (주관적)    |
| Somatotype | Heath-Carter  | 3개+혼합 | 중간 (장비 필요) |

**추천**: 과일형 - 4개 측정값으로 자동 분류 가능, 학술 검증 완료

### 5.2 과일형 분류 (여성)

| 체형         | 조건                                                       |
| ------------ | ---------------------------------------------------------- |
| **모래시계** | (bust-hips) ≤ 1" AND (bust-waist ≥ 9" OR hips-waist ≥ 10") |
| **배형**     | (hips-bust) ≥ 3.6" AND (hips-waist) < 9"                   |
| **역삼각형** | (bust-hips) ≥ 3.6" AND (bust-waist) < 9"                   |
| **사과형**   | waist ≥ bust OR waist ≥ hips                               |
| **직사각형** | 모든 측정치 ±5%, waist > bust×0.75                         |

### 5.3 과일형 분류 (남성)

| 체형         | 조건                           |
| ------------ | ------------------------------ |
| **역삼각형** | SHR > 1.2 AND 어깨/허리 > 1.15 |
| **사다리꼴** | SHR > 1.05 AND 어깨/허리 > 1.2 |
| **직사각형** | 어깨 ≈ 엉덩이 ≈ 허리           |
| **삼각형**   | 엉덩이 > 어깨                  |
| **타원형**   | 허리 ≥ 어깨 AND 허리 ≥ 엉덩이  |

### 5.4 분류 구현

```typescript
type BodyShape = 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'invertedTriangle';

interface BodyShapeResult {
  type: BodyShape;
  confidence: number;
  koreanName: string;
}

function classifyFemaleBody(bust: number, waist: number, hips: number): BodyShapeResult {
  const bustHipDiff = bust - hips;
  const hipsBustDiff = hips - bust;
  const bustWaistDiff = bust - waist;
  const hipsWaistDiff = hips - waist;

  // 모래시계형
  if (Math.abs(bustHipDiff) <= 1 && (bustWaistDiff >= 9 || hipsWaistDiff >= 10)) {
    return { type: 'hourglass', confidence: 0.9, koreanName: '모래시계형' };
  }

  // 배형
  if (hipsBustDiff >= 3.6 && hipsWaistDiff < 9) {
    return { type: 'pear', confidence: 0.85, koreanName: '배형' };
  }

  // 역삼각형
  if (bustHipDiff >= 3.6 && bustWaistDiff < 9) {
    return { type: 'invertedTriangle', confidence: 0.85, koreanName: '역삼각형' };
  }

  // 사과형
  if (waist >= bust || waist >= hips) {
    return { type: 'apple', confidence: 0.8, koreanName: '사과형' };
  }

  // 직사각형
  return { type: 'rectangle', confidence: 0.7, koreanName: '직사각형' };
}
```

---

## 6. 한국인 체형 표준

### 6.1 Size Korea 8차 조사 (2020-2023)

**남성**:

| 측정항목        | 20대      | 30대    | 40대    | 50대    |
| --------------- | --------- | ------- | ------- | ------- |
| 키 (cm)         | **174.4** | 174.9   | 172.5   | 170.5   |
| 어깨너비 (mm)   | 400-402   | 400-405 | 395-400 | 390-395 |
| 가슴둘레 (cm)   | 93.0      | 96.5    | 96.0    | 94.5    |
| 허리둘레 (cm)   | 78.4      | 84.5    | 87.0    | 88.0    |
| 엉덩이둘레 (cm) | 94.3      | 97.0    | 97.5    | 96.0    |
| WHR             | **0.83**  | 0.87    | 0.89    | 0.92    |

**여성**:

| 측정항목        | 20대      | 30대    | 40대    | 50대    |
| --------------- | --------- | ------- | ------- | ------- |
| 키 (cm)         | **161.1** | 162.0   | 160.4   | 157.5   |
| 어깨너비 (mm)   | 355-360   | 360-365 | 360-365 | 355-360 |
| 가슴둘레 (cm)   | 82.0      | 84.5    | 87.0    | 88.5    |
| 허리둘레 (cm)   | 68.0      | 72.0    | 76.0    | 79.0    |
| 엉덩이둘레 (cm) | 91.0      | 93.5    | 94.5    | 95.0    |
| WHR             | **0.75**  | 0.77    | 0.80    | 0.83    |

### 6.2 한국인 vs 서양인 특성

| 항목                | 한국인               | 서양인         |
| ------------------- | -------------------- | -------------- |
| 신장 대비 다리 비율 | **짧음** (0.45-0.46) | 긺             |
| 신장 대비 몸통 비율 | **긺**               | 짧음           |
| WHR (여성)          | **더 작음** (직선적) | 더 큼 (곡선적) |
| 평균 BMI            | 23-24                | 26-30          |
| 체형 변이           | 균일                 | 다양           |

**핵심**: 서양 기준 적용 시 오분류 발생 → **한국인 기준 정규화 필수**

### 6.3 정규화 함수

```typescript
const KOREAN_STANDARDS = {
  male: {
    '20s': { height: 174.4, shoulder: 401, waist: 78.4, hip: 94.3 },
    '30s': { height: 174.9, shoulder: 402, waist: 84.5, hip: 97.0 },
    '40s': { height: 172.5, shoulder: 397, waist: 87.0, hip: 97.5 },
    '50s': { height: 170.5, shoulder: 392, waist: 88.0, hip: 96.0 },
  },
  female: {
    '20s': { height: 161.1, shoulder: 357, waist: 68.0, hip: 91.0 },
    '30s': { height: 162.0, shoulder: 362, waist: 72.0, hip: 93.5 },
    '40s': { height: 160.4, shoulder: 362, waist: 76.0, hip: 94.5 },
    '50s': { height: 157.5, shoulder: 357, waist: 79.0, hip: 95.0 },
  },
};

const STD_DEV = {
  male: { height: 5.8, shoulder: 21, waist: 8.5, hip: 5.2 },
  female: { height: 5.2, shoulder: 18, waist: 7.0, hip: 5.0 },
};

function normalizeToKorean(
  value: number,
  measurement: 'height' | 'shoulder' | 'waist' | 'hip',
  gender: 'male' | 'female',
  ageGroup: '20s' | '30s' | '40s' | '50s'
): { zScore: number; percentile: number } {
  const mean = KOREAN_STANDARDS[gender][ageGroup][measurement];
  const stdDev = STD_DEV[gender][measurement];

  const zScore = (value - mean) / stdDev;

  // 정규분포 CDF 근사
  const percentile =
    ((1 + Math.sign(zScore) * Math.sqrt(1 - Math.exp((-2 * zScore * zScore) / Math.PI))) / 2) * 100;

  return { zScore, percentile: Math.round(percentile) };
}
```

---

## 7. 체형별 추천

### 7.1 운동 추천

| 체형         | 권장 운동                      | 목표           |
| ------------ | ------------------------------ | -------------- |
| **사과형**   | HIIT, 코어, 하체 근력          | 복부 지방 감소 |
| **배형**     | 상체 근력 (푸시업, 숄더프레스) | 상체 볼륨 증가 |
| **모래시계** | HIIT, 인도어 사이클링          | 균형 유지      |
| **직사각형** | 웨이트 (스쿼트+덤벨)           | 곡선 강조      |
| **역삼각형** | 하체 집중 (런지, 레그프레스)   | 하체 볼륨 증가 |

### 7.2 스타일링 추천

| 체형         | 권장 스타일                   | 피해야 할 스타일       |
| ------------ | ----------------------------- | ---------------------- |
| **사과형**   | V넥, 하이웨이스트, A라인      | 타이트 상의, 벨트 강조 |
| **배형**     | 러플 상의, 다크 하의          | 타이트 스키니진        |
| **모래시계** | 바디콘, 랩 드레스, 벨트       | 박시 실루엣            |
| **직사각형** | 펠플럼, 벨트 드레스, 레이어링 | 직선 실루엣            |
| **역삼각형** | V넥, 와이드팬츠, 밝은 하의    | 어깨 강조 패드         |

---

## 8. 측정 정확도

### 8.1 2D 이미지 기반 측정 오차

| 조건        | 신장 MAE | 허리 MAE |
| ----------- | -------- | -------- |
| 최적 환경   | 0.9 cm   | 16.5 mm  |
| 비제어 환경 | 6-7 cm   | 35-40 mm |

### 8.2 정확도 향상 방법

1. **참조 객체 캘리브레이션**: 알려진 길이의 물체 포함
2. **카메라 왜곡 보정**: 방사/접선 왜곡 계수 적용
3. **정면+측면 촬영**: 2장으로 입체 추정
4. **GPU 가속**: 30+ FPS로 안정적 측정

---

## 9. 구현 체크리스트

### 9.1 랜드마크 추출

- [ ] MediaPipe Pose 33개 인덱스 매핑
- [ ] visibility/presence > 0.5 필터링
- [ ] 정면/측면 분리 처리
- [ ] GPU 가속 활성화 (30+ FPS)

### 9.2 체형 비율

- [ ] WHR, WHtR, SHR 계산
- [ ] 허리 추정 (엉덩이 × 0.8)
- [ ] 신장 기반 정규화
- [ ] 한국인 백분위 계산

### 9.3 자세 평가

- [ ] 3D 각도 계산 (벡터 내적)
- [ ] CVA, Cobb, 골반 기울기 측정
- [ ] 0-100 점수 및 A-F 등급
- [ ] 실시간 피드백 메시지

### 9.4 체형 분류

- [ ] 과일형 알고리즘 (남/여 분리)
- [ ] 체형별 운동 추천 DB
- [ ] 체형별 스타일링 추천 DB

### 9.5 데이터 검증

- [ ] Size Korea 기준 정상 범위
- [ ] 연령대/성별 표준 데이터
- [ ] 측정 오차 허용 범위 설정

---

## 10. 제한 사항 및 의료 면책

### 10.1 의료적 면책

```
⚠️ 중요 의료 면책

이 문서의 체형/자세 분석은 웰니스 및 피트니스 참고 목적이며,
의료 진단이나 물리치료를 대체하지 않습니다.

다음 사항은 반드시 전문가 상담이 필요합니다:
- 만성 통증 또는 급성 부상
- 척추측만증, 추간판탈출 등 척추 질환
- CVA < 40° 또는 Cobb 각도 > 40° (심각한 자세 이상)
- 관절 가동 범위 제한
- 수술 이력 또는 재활 중인 상태

자세 점수 및 교정 운동 제안은 참고용이며,
물리치료사 또는 정형외과 전문의와 상담 후 실행하세요.
```

### 10.2 측정 한계

| 한계              | 설명                    | 영향                  |
| ----------------- | ----------------------- | --------------------- |
| **2D 촬영**       | 3D 정보 손실            | 깊이 관련 측정 부정확 |
| **의복 영향**     | 두꺼운 옷은 측정 방해   | 가벼운 복장 권장      |
| **랜드마크 감지** | MediaPipe 오류 가능     | 신뢰도 점수 확인 필요 |
| **일시적 자세**   | 촬영 순간의 자세만 반영 | 복수 측정 권장        |

### 10.3 Janda 증후군 자가 진단 주의

> ⚠️ **범위 제한**: Upper Cross, Lower Cross 증후군 분류는
> 전문 물리치료사의 평가를 통해 확정되어야 합니다.
> 이 앱의 자동 분류는 교육/참고 목적이며,
> 치료 계획의 근거로 사용해서는 안 됩니다.

### 10.4 사용자 고지 문구

```typescript
const POSTURE_ANALYSIS_DISCLAIMER = `
이 분석은 AI 기반 자세 추정이며, 의료 진단이 아닙니다.

심각한 자세 이상이 감지되었거나 통증이 있는 경우
물리치료사 또는 정형외과 전문의와 상담하세요.

교정 운동은 전문가 지도 하에 실행하는 것을 권장합니다.
`;
```

---

## 11. 관련 문서

| 문서                                               | 설명                          |
| -------------------------------------------------- | ----------------------------- |
| [image-processing.md](./image-processing.md)       | 이미지 전처리                 |
| [ADR-005](../adr/ADR-005-monorepo-structure.md)    | 모노레포 구조                 |
| [SDD-BODY-ANALYSIS](../specs/SDD-BODY-ANALYSIS.md) | 체형분석 스펙 (C-1, C-2 통합) |

---

## 11. 스트레칭 원리

> **상세 리서치**: [W-2-FOUNDATION](../research/claude-ai-research/W-2-FOUNDATION.md), [W-2-SPORT-v2-KR](../research/claude-ai-research/W-2-SPORT-v2-KR.md), [W-2-POSTURE-SAFETY](../research/claude-ai-research/W-2-POSTURE-SAFETY.md)

### 11.1 근육-건 단위 점탄성

**점탄성(Viscoelasticity)**은 스트레칭의 핵심 과학 원리다. 근육과 건은 시간 의존적 응력-변형 특성을 보인다.

| 특성              | 설명                                | 스트레칭 적용                |
| ----------------- | ----------------------------------- | ---------------------------- |
| **크리프(Creep)** | 일정 힘에서 시간에 따른 길이 증가   | 정적 스트레칭 30초 유지 근거 |
| **응력 이완**     | 일정 길이에서 시간에 따른 장력 감소 | 반복할수록 이완 용이         |
| **히스테리시스**  | 로딩-언로딩 에너지 손실             | 워밍업 후 유연성 증가        |

**정적 스트레칭 최적 시간**: 30초 × 3-5세트 (ACSM, 2018)

### 11.2 PNF 스트레칭 원리

**고유수용성 신경근 촉진법(PNF)**은 가장 효과적인 유연성 향상 기법이다.

| 기법                    | 순서                            | 메커니즘                        |
| ----------------------- | ------------------------------- | ------------------------------- |
| **Contract-Relax (CR)** | 수축 6초 → 이완 → 스트레칭 30초 | 골지건기관 억제                 |
| **Hold-Relax**          | 등척성 수축 → 이완 → 스트레칭   | 자기억제(Autogenic Inhibition)  |
| **CRAC**                | CR + 작용근 수축                | 상호억제(Reciprocal Inhibition) |

### 11.3 스트레칭 유형별 특성

| 유형              | 적용 시점   | 효과                    | 주의                        |
| ----------------- | ----------- | ----------------------- | --------------------------- |
| **동적 스트레칭** | 운동 전     | 근육 온도↑, 신경 활성화 | 10-15회/동작                |
| **정적 스트레칭** | 운동 후     | ROM 증가, 회복 촉진     | 운동 전 장시간 금지 (근력↓) |
| **PNF**           | 유연성 훈련 | 최대 효과               | 파트너 또는 도구 필요       |
| **볼리스틱**      | 특수 상황   | 빠른 ROM 도달           | 부상 위험↑, 비권장          |

### 11.4 자세별 핵심 스트레칭

| 자세 문제        | 단축근                 | 신장근               | 핵심 스트레칭                     |
| ---------------- | ---------------------- | -------------------- | --------------------------------- |
| **거북목**       | 흉쇄유돌근, 상부승모근 | 심부경추굴곡근       | 턱당기기, 흉추신전                |
| **라운드숄더**   | 대흉근, 소흉근         | 중하부승모근, 능형근 | 문틀 스트레칭, 코너 스트레칭      |
| **골반전방경사** | 장요근, 대퇴직근       | 둔근, 복근           | 런지 스트레칭, 토마스 테스트 자세 |
| **골반후방경사** | 햄스트링, 둔근         | 장요근, 척추기립근   | 햄스트링 스트레칭, 고양이-소      |

> **상세 프로토콜**: W-2-POSTURE-PROTOCOL 리서치 참조 (추가 예정)

### 11.5 Janda 교차증후군

**Upper Crossed Syndrome (상부 교차증후군)**:

```
단축근: 상부승모근 + 견갑거근 + 대흉근/소흉근
신장근: 심부경추굴곡근 + 중하부승모근 + 전거근
```

**Lower Crossed Syndrome (하부 교차증후군)**:

```
단축근: 장요근 + 척추기립근
신장근: 복근 + 둔근
```

### 11.6 스트레칭 안전 원칙

> ⚠️ **필독 주의사항**
>
> 스트레칭은 안전한 운동이지만, 특정 조건에서는 심각한 부상을 유발할 수 있습니다.
> 아래 금기사항에 해당하면 **전문가 상담 없이 스트레칭을 시작하지 마세요**.

**절대 금기 (Absolute Contraindications)**:

| 조건                     | 위험성         | 조치               |
| ------------------------ | -------------- | ------------------ |
| **급성 골절/탈구**       | 추가 손상      | 정형외과 상담 필수 |
| **급성 근육 파열**       | 회복 지연      | 72시간 이후 재평가 |
| **급성 관절염/활액막염** | 염증 악화      | 소염 치료 후 시작  |
| **전이성 암/골종양**     | 병적 골절 위험 | 의사 승인 필요     |
| **급성 추간판 탈출**     | 신경 압박 악화 | 신경외과 상담      |
| **혈관 손상/혈전**       | 색전 위험      | 혈관외과 상담      |

**상대 금기 (Relative Contraindications)** - 주의 하에 진행:

| 조건             | 주의사항                           |
| ---------------- | ---------------------------------- |
| 골다공증         | 과도한 굴곡/회전 제한, 점진적 부하 |
| 류마티스 관절염  | 급성기 회피, 안정기에만 진행       |
| 고혈압 (미조절)  | 숨참기 금지, 저강도 유지           |
| 임신             | 과신전 금지, 릴렉신 고려           |
| 인공관절 수술 후 | 수술 부위 가동범위 제한 준수       |

**Red Flags (즉시 중단 및 응급 상담)**:

```
🚨 다음 증상 발생 시 즉시 중단:

1. 방사통 (팔/다리로 퍼지는 통증)
   → 신경 압박 가능성

2. 저림/무감각/따끔거림
   → 신경 손상 가능성

3. 갑작스러운 근력 저하
   → 신경근 손상 가능성

4. 배변/배뇨 장애
   → 마미증후군 응급상황 (6시간 내 수술 필요)

5. 어지러움/실신
   → 혈관/심장 문제 가능성

6. 운동 중 "뚝" 소리와 함께 급성 통증
   → 근육/인대 파열 가능성
```

**안전 수칙**:

- 통증 유발 범위의 **80% 이하**에서 유지
- "약간 당기는 느낌"은 정상, "아픔"은 과도함
- 점진적 증가 (주당 5-10% ROM 개선 목표)
- 숨 참지 않기 (호흡 유지)

> **상세 안전정보**: [W-2-POSTURE-SAFETY](../research/claude-ai-research/W-2-POSTURE-SAFETY.md) 참조

### 11.7 스트레칭 구현 체크리스트

- [ ] 자세 분석 결과와 스트레칭 매칭 로직
- [ ] 부위별 스트레칭 동영상/이미지 DB
- [ ] 사용자별 맞춤 루틴 생성
- [ ] 진행도 추적 (ROM 변화)
- [ ] 금기사항 필터링

---

## 12. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)

| 문서                                                     | 설명                                |
| -------------------------------------------------------- | ----------------------------------- |
| [SDD-BODY-ANALYSIS-v2](../specs/SDD-BODY-ANALYSIS-v2.md) | 체형분석 v2 모듈 스펙, P3 원자 분해 |
| [SDD-BODY-ANALYSIS](../specs/SDD-BODY-ANALYSIS.md)       | 체형분석 스펙 (C-1, C-2 통합)       |
| [ADR-005](../adr/ADR-005-monorepo-structure.md)          | 모노레포 구조                       |

### 관련 원리 문서

| 문서                                                 | 설명                           |
| ---------------------------------------------------- | ------------------------------ |
| [exercise-physiology.md](./exercise-physiology.md)   | 운동생리학, 자세 교정 프로토콜 |
| [image-processing.md](./image-processing.md)         | 이미지 전처리                  |
| [cross-domain-synergy.md](./cross-domain-synergy.md) | C×W 시너지                     |

### 리서치 문서

| 문서                                                                       | 설명                       |
| -------------------------------------------------------------------------- | -------------------------- |
| [W-2-FOUNDATION](../research/claude-ai-research/W-2-FOUNDATION.md)         | 스트레칭 공통 원리         |
| [W-2-SPORT-v2-KR](../research/claude-ai-research/W-2-SPORT-v2-KR.md)       | 스포츠 스트레칭 (한국특화) |
| [W-2-POSTURE-SAFETY](../research/claude-ai-research/W-2-POSTURE-SAFETY.md) | 자세교정 안전정보          |

---

## 각주

¹ **CVA(Craniovertebral Angle) 정상 범위**: Yip CHT, Chiu TTW, Poon ATK (2008). _The relationship between head posture and severity and disability of patients with neck pain_. Manual Therapy 13(2):148-154. 연구에 따르면 CVA 50° 미만은 전방두부자세(Forward Head Posture)로 분류되며, 40° 미만은 심각한 거북목으로 간주됨. 일부 연구(Fernández-de-las-Peñas 2006)에서는 44-50°를 경계값으로 사용.

---

## 13. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR                                                 | 제목                      | 관련 내용                        |
| --------------------------------------------------- | ------------------------- | -------------------------------- |
| [ADR-001](../adr/ADR-001-core-image-engine.md)      | Core Image Engine         | 체형 이미지 분석 파이프라인      |
| [ADR-003](../adr/ADR-003-ai-model-selection.md)     | AI 모델 선택              | MediaPipe Pose, Gemini 체형 분석 |
| [ADR-010](../adr/ADR-010-ai-pipeline.md)            | AI 파이프라인             | C-1 분석 흐름                    |
| [ADR-031](../adr/ADR-031-workout-module.md)         | 운동 모듈 아키텍처        | 체형 기반 운동 추천              |
| [ADR-011](../adr/ADR-011-cross-module-data-flow.md) | 크로스 모듈 데이터 플로우 | C-1 ↔ W-1 연동                   |

---

## 정확도 업그레이드 로드맵 (ADR-108, 2026-06 리서치)

> 체형 SHAPE 정확도(코디용) 강화. 자세/교정(거북목·골반·O다리·ROM)은 off-thesis(PT/피트니스)로 핵심 제외 (ADR-098). 사용자·기술 성장 후 별도·면책 트랙(B).

- **ASTM D5585** (패션 사이징 표준): 어깨-힙비 + 허리-힙비 기반 체형 분류. MediaPipe Pose 33랜드마크(`body-v2/pose-detector`) + segmentation → 정면+핏의류 기준 **80-88%**.
- **멀티앵글 사다리**: 정면 + 측면 2장 + 배경 기준선 → 가슴·허리·힙 둘레 **±5mm** 추정. 셀카(얼굴4축) → +정면 전신(체형) → +측면(비율 정밀).
- 출처: ASTM D5585; [arxiv 2409.17671](https://arxiv.org/html/2409.17671v3); [MDPI ResNet landmarks](https://www.mdpi.com/2073-8994/12/12/1997).
- 상세 → [ADR-108](../adr/ADR-108-axis-accuracy-upgrade-roadmap.md)

---

**Version**: 1.3 | **Created**: 2026-01-16 | **Updated**: 2026-06-17
**소스 리서치**: C-2-R1, W-2-FOUNDATION, W-2-SPORT-v2-KR, W-2-POSTURE-SAFETY
**관련 모듈**: C-1, C-2, W-1, COMBO-BODY-EXERCISE
