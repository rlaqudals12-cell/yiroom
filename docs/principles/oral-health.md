# 구강건강 원리

> 이 문서는 이룸 플랫폼의 구강건강 분석 및 제품 추천 기반 원리를 설명한다.
>
> **소스 리서치**: OH-1-BUNDLE, OH-1-BUNDLE-구강건강종합

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 구강건강 AI 분석 시스템"

- 100% 정밀 분석: 치아 색상, 잇몸 상태, 구강 내 문제 자동 인식
- VITA 표준 매칭: 16색 셰이드 체계 기반 정확한 치아 색상 분류
- 과학적 근거: Lab 색공간, 광학 원리 기반 색상 분석
- 맞춤 제품 추천: 미백, 잇몸 케어, 구취 관리 등 개인화 제안
- 영양 연계: 구강건강에 영향을 주는 영양소 분석 연동
- 변화 추적: 미백 전후, 잇몸 상태 변화 시계열 분석
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **조명 조건** | 카메라 조명에 따른 색상 왜곡 발생 |
| **이미지 품질** | 스마트폰 카메라 해상도/색재현 한계 |
| **의료 진단 불가** | 충치, 치주질환 등 의료 진단 대체 불가 |
| **내부 상태** | 치수(Pulp) 상태, 내부 손상 감지 불가 |
| **개인차** | 에나멜 두께, 상아질 색상 개인차 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **VITA 분류 정확도** | 16색 중 정확한 분류 90% |
| **Lab 색공간 적용** | L*a*b* 기반 정밀 색상 측정 |
| **잇몸 상태 인식** | 정상/출혈/후퇴/염증 4단계 분류 |
| **구취 원인 분석** | 5개 이상 원인 카테고리 분류 |
| **제품 매칭** | 증상별 적합 제품 추천 정확도 80% |
| **영양 연계** | 칼슘/비타민D/비타민C 등 8개 영양소 연동 |
| **변화 추적** | 미백 ΔE 변화량 측정 |

### 현재 목표

**70%** - MVP 구강건강 분석

- ✅ VITA 16색 셰이드 체계 정의
- ✅ Lab 색공간 기반 색상 분석
- ✅ 에나멜/상아질 광학 원리 이해
- ✅ 구강-영양 연계 매핑
- ⏳ 실제 AI 분석 구현 (40%, 계획 단계)
- ⏳ 잇몸 상태 인식 (30%)
- ⏳ 제품 추천 알고리즘 (50%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 의료 진단 기능 | 의료기기 인증 필요 | 미정 |
| 치과 연계 예약 | B2B 파트너십 필요 | Phase 4 |
| 3D 스캔 연동 | 하드웨어 의존성 | 미정 |
| 구취 센서 연동 | 외부 디바이스 필요 | 미정 |

---

## 1. 치아 구조와 색상 원리

### 1.1 치아 층 구조

```
┌─────────────────────────────────────┐
│         에나멜 (Enamel)             │  ← 반투명, 광학적 필터
│   96% 하이드록시아파타이트          │
│   Ca₁₀(PO₄)₆(OH)₂                  │
├─────────────────────────────────────┤
│         상아질 (Dentin)             │  ← 색상 결정자
│   무기질 70%, 유기물 20%, 수분 10%  │
├─────────────────────────────────────┤
│          치수 (Pulp)                │  ← 신경/혈관
└─────────────────────────────────────┘
```

### 1.2 에나멜 광학 특성

| 특성 | 값 | 의미 |
|------|-----|------|
| 무기질 함량 | 96% | 인체 최고 경도 |
| Mohs 경도 | 5 | 강철보다 단단 |
| Vickers 경도 | 274.8 HV | - |
| 굴절률 | 1.631 | 반투명 |
| 투과 계수 (525nm) | 0.481 mm⁻¹ | 장파장(황적색) 투과 |
| 탈수 시 투과 계수 | 0.313 mm⁻¹ | 더 불투명 |
| 최대 두께 | 2.5mm (교두) | - |

**오팔레센스(Opalescence)**: 하이드록시아파타이트 결정이 단파장(청색광)을 산란, 장파장(황적색광)을 투과

### 1.3 상아질 색상 특성

| 특성 | 값 |
|------|-----|
| L* (명도) | 69.9 |
| a* (적-녹) | 1.22 |
| b* (황-청) | 17.9 |
| 상아세관 직경 | 0.9-3.0 μm |
| 상아세관 밀도 | 18,000-76,000/mm² |

### 1.4 치아 색상 형성 메커니즘

```
입사광 → 에나멜 표면 부분 반사
       ↓
    에나멜 내부 진입
       ↓
    결정 구조에 의해 청색광 산란 (오팔레센스)
       ↓
    상아-법랑 경계(DEJ)에서 추가 반사
       ↓
    상아질에서 황색/갈색 색소 흡수
       ↓
    최종 색상 결정
```

**핵심 원리**: 치아 색상은 주로 **상아질**에 의해 결정되며, 에나멜은 청색 파장 산란을 통해 보조적 역할을 한다.

---

## 2. VITA 셰이드와 Lab 색공간

### 2.1 VITA Classical 16색 체계

| 계열 | 색상 특성 | 셰이드 |
|------|----------|--------|
| A (적갈색) | 황색-갈색 | A1, A2, A3, A3.5, A4 |
| B (적황색) | 황색 | B1, B2, B3, B4 |
| C (회색) | 회색 | C1, C2, C3, C4 |
| D (적회색) | 분홍-회색 | D2, D3, D4 |

**명도순 배열** (밝음 → 어두움):
```
B1 > A1 > B2 > D2 > A2 > C1 > C2 > D4 > A3 > D3 > B3 > A3.5 > B4 > C3 > A4 > C4
```

### 2.2 VITA 셰이드별 Lab 참조값

| 셰이드 | L* | a* | b* |
|:------:|:--:|:--:|:--:|
| B1 | 70-72 | 1-2 | 14-16 |
| A1 | 69-71 | 1.5-2.5 | 15-17 |
| A2 | 66-68 | 2-3 | 18-20 |
| A3 | 62-65 | 3-4 | 20-23 |
| A4 | 55-58 | 5-6 | 24-27 |
| C4 | 47-50 | 0-1 | 10-12 |

**치아 색상 분포**: CIE Lab 공간에서 "바나나 모양(banana-shaped)" 영역에 위치

### 2.3 색차(ΔE) 계산

**CIELAB 기본 공식**:
```
ΔE*ab = √[(ΔL*)² + (Δa*)² + (Δb*)²]
```

**CIEDE2000 공식** (더 정확):
```
ΔE00 = √[(ΔL'/kL·SL)² + (ΔC'/kC·SC)² + (ΔH'/kH·SH)² + RT·(ΔC'/kC·SC)·(ΔH'/kH·SH)]
```

**임상적 의미 역치**:

| ΔE 값 | 의미 |
|-------|------|
| < 1.0 | Perceptibility Threshold (인지 불가) |
| 1.0-2.7 | 인지 가능, 허용 범위 |
| 2.7-3.3 | Acceptability Threshold (허용 경계) |
| > 3.3 | 임상적으로 허용 불가능 |

### 2.4 셰이드 매칭 알고리즘

```typescript
interface LabColor {
  L: number;  // 0-100
  a: number;  // -128 to +127
  b: number;  // -128 to +127
}

interface ShadeMatch {
  shade: string;
  deltaE: number;
}

// VITA 셰이드 참조값 데이터베이스
const VITA_SHADE_LAB: Record<string, LabColor> = {
  'B1': { L: 71, a: 1.5, b: 15 },
  'A1': { L: 70, a: 2, b: 16 },
  'A2': { L: 67, a: 2.5, b: 19 },
  'A3': { L: 63.5, a: 3.5, b: 21.5 },
  'A4': { L: 56.5, a: 5.5, b: 25.5 },
  // ... 전체 16색
};

function calculateCIEDE2000(lab1: LabColor, lab2: LabColor): number {
  // CIEDE2000 구현 (colour-science 패키지 권장)
  // 상세 구현은 ISO/CIE 11664-6:2014 참조
}

function findBestShadeMatch(measuredLab: LabColor): ShadeMatch {
  let minDeltaE = Infinity;
  let bestShade = '';

  for (const [shade, refLab] of Object.entries(VITA_SHADE_LAB)) {
    const deltaE = calculateCIEDE2000(measuredLab, refLab);
    if (deltaE < minDeltaE) {
      minDeltaE = deltaE;
      bestShade = shade;
    }
  }

  return { shade: bestShade, deltaE: minDeltaE };
}
```

---

## 3. 퍼스널컬러-치아톤 조화

### 3.1 시즌별 추천 셰이드

| 퍼스널컬러 | 피부톤 특성 | 추천 셰이드 | 미백 한계 | 피해야 할 셰이드 |
|-----------|-----------|------------|----------|-----------------|
| **봄 웜톤** | 밝고 투명한 노란 피부 | A1, B1, B2 | 0M2 | C계열 |
| **여름 쿨톤** | 핑크빛 밝은 피부 | B1, C1, A1 | 0M1 | 진한 황색 |
| **가을 웜톤** | 구릿빛 건강한 노란 피부 | A2, B2, A3 | A1~B1 | 차가운 흰색 |
| **겨울 쿨톤** | 선명한 핑크 베이스 | B1, 0M1, C1 | 0M1 | 황금 아이보리 |

### 3.2 톤 조화 원리

**웜톤 (봄/가을)**:
- +a* (붉은기) + b* (노란기) 치아와 조화
- A계열, B계열 셰이드 권장
- 아이보리~웜 화이트

**쿨톤 (여름/겨울)**:
- 낮은 a*, 낮은 b* 치아와 조화
- C계열, 블리치드 셰이드 권장
- 블루 언더톤 화이트

### 3.3 미백 목표 설정 로직

```typescript
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface WhiteningTarget {
  targetShade: string;
  maxShade: string;  // 과도한 미백 경고선
  preferredSeries: string[];
}

function getWhiteningTarget(
  currentShade: string,
  season: Season,
  desiredLevel: 'natural' | 'moderate' | 'bright'
): WhiteningTarget {
  const warmSeasons: Season[] = ['spring', 'autumn'];
  const isWarm = warmSeasons.includes(season);

  // 시즌별 최대 미백 한계
  const maxShade = isWarm ? '0M2' : '0M1';

  // 선호 계열
  const preferredSeries = isWarm ? ['A', 'B'] : ['B', 'C'];

  // 목표 셰이드 계산 (현재 셰이드에서 단계 이동)
  const shadeSteps = { natural: 2, moderate: 4, bright: 6 };
  const targetShade = calculateTargetShade(currentShade, shadeSteps[desiredLevel]);

  return { targetShade, maxShade, preferredSeries };
}
```

### 3.4 과도한 미백 경고 조건

```typescript
function isOverWhitening(targetShade: string, season: Season): boolean {
  // B1보다 밝은 목표
  const brighterThanB1 = ['0M1', '0M2', '0M3'].includes(targetShade);

  // 웜톤인데 0M1 목표
  const warmSeasons: Season[] = ['spring', 'autumn'];
  const warmWithCoolTarget = warmSeasons.includes(season) && targetShade === '0M1';

  return brighterThanB1 || warmWithCoolTarget;
}
```

---

## 4. 미백 화학 원리

### 4.1 과산화수소 반응 메커니즘

**분해 반응**:
```
H₂O₂ → 2OH• (히드록실 라디칼)
```

**색소 분해 반응**:
```
Chromophore-C=C-C=C (유색) + OH• → Chromophore-C-C-C-C (무색)
```

- 자유 라디칼(OH•)이 유기 색소 분자의 **이중결합(conjugated double bond)**을 산화
- 거대 분자 → 작은 무색/담색 분자로 분해
- X선 회절 연구: 하이드록시아파타이트(무기질)에는 영향 없음, **유기 성분만 공격**

### 4.2 침투 특성

| 시간 | 침투 깊이 |
|------|----------|
| 수 분 | 에나멜 표면 |
| 5-10분 | 상아질 도달 |
| 15분 | 치수강 도달 가능 |

**최적 pH**: 9.5-10 (알칼리 환경에서 perhydroxyl ion 형성 촉진)

### 4.3 카바마이드 퍼옥사이드 환산

**분해 반응**:
```
CH₆N₂O₃ (CP) + H₂O → H₂O₂ (≈35%) + CH₄N₂O (Urea)
```

| 카바마이드 퍼옥사이드 | 과산화수소 환산 |
|:-------------------:|:--------------:|
| 10% CP | ~3.5% H₂O₂ |
| 15% CP | ~5.3% H₂O₂ |
| 16% CP | ~5.6% H₂O₂ |
| 22% CP | ~7.7% H₂O₂ |
| 35% CP | 10-12% H₂O₂ |

**우레아 효과**: 암모니아로 분해 → pH 상승 → 에나멜 탈회 감소

### 4.4 미백 효과 수치

| 방법 | 농도 | 효과 (VITA 셰이드) | 민감도 발생률 |
|------|------|-------------------|--------------|
| 오피스 미백 | 25-40% H₂O₂ | 4-6 단계/회 | 55-75% |
| 홈 미백 (트레이) | 10-22% CP | 4-6 단계/2-4주 | 낮음 |
| 미백 스트립 | 6-14% H₂O₂ | 3-4 단계/2주 | 낮음 |

**메타분석 결론**: 2주 이후, 오피스 vs 홈 미백 간 효과 차이 없음

### 4.5 민감도 관리 성분

| 성분 | 메커니즘 | 민감도 감소율 |
|------|---------|--------------|
| 질산칼륨 5% | 신경 탈분극 억제 | 35-50% |
| CPP-ACP | 상아세관 폐쇄, 재광화 | 유의한 감소 |
| n-HAp | 상아세관 물리적 폐쇄 | 유의한 감소 |

---

## 5. 충치/치석 메커니즘

### 5.1 Stephan Curve

```
pH
 7.0 ─────────────────────────────────────
                    \
 6.0                 \
                      \_______________
 5.5 ─────────────────────────────────── 임계 pH (에나멜)
                      /
 5.0                 /
                    /
 4.5 ──────────────/
     |   |   |   |   |   |   |
     0   5  10  20  30  40  60  (분)
         식후 시간
```

**임계 pH**:

| 조직 | 임계 pH |
|------|---------|
| 에나멜 | 5.5 |
| 상아질/백악질 | 6.0-6.7 |
| 플루오르아파타이트 | 4.5 |

**탈회 반응**:
```
Ca₁₀(PO₄)₆(OH)₂ + 8H⁺ → 10Ca²⁺ + 6HPO₄²⁻ + 2H₂O
```

### 5.2 Keyes 충치 4요소 (Newbrun 수정)

```
        숙주 (Host)
           ▲
          / \
         /   \
    시간 ◄─────► 세균
    (Time)      (Microorganisms)
         \   /
          \ /
           ▼
      기질 (Substrate)

4가지 요소가 동시에 충족될 때만 충치 발생
```

### 5.3 치태/치석 형성 타임라인

| 단계 | 시간 | 과정 |
|------|------|------|
| 획득피막 형성 | 수 분 내 | 타액 단백질 흡착 |
| 초기 집락 | 0-4시간 | *S. mitis*, *S. oralis* 부착 |
| 바이오필름 성숙 | 4-24시간 | *F. nucleatum* 가교 |
| 치석화 시작 | **24시간 내** | 무기질 침착 시작 |
| 치석 완성 | **10-12일** | 60-90% 석회화 완료 |

**치석 유형**:

| 특성 | 치은연상 치석 | 치은연하 치석 |
|------|-------------|-------------|
| 색상 | 황백색 | 암갈색-녹흑색 |
| 무기질 공급원 | 타액 | 치은열구액 |
| 호발 부위 | 하악 전치 설면, 상악 구치 협면 | 치주낭 내부 |

---

## 6. 제품 추천 원리

### 6.1 성분-효능 매핑

#### 재광화/강화 성분

| 성분 | 효능 | 작용 원리 |
|------|------|----------|
| Fluoride 1000-1500ppm | 탈회 억제, 재광화 | 플루오르아파타이트 형성 |
| n-HAp | 재광화, 민감도 감소 | 상아세관 폐쇄 |
| CPP-ACP | 재광화 | 칼슘/인 전달체 |
| CPP-ACPF | 재광화 64% | CPP-ACP + 불소 시너지 |

#### 항균/항플라크 성분

| 성분 | 플라크 감소 | 사용 기간 | 부작용 |
|------|-----------|----------|--------|
| CHX 0.12% | 15-20% | **2-4주 단기** | 착색, 미각변화 |
| CPC 0.05% | 10-15% | 장기 가능 | 경미 |
| 에센셜 오일 | 37% | 장기 가능 | 작열감 |

#### 치석 억제 성분

| 성분 | 메커니즘 | 효능 |
|------|---------|------|
| 소듐 헥사메타포스페이트 | 피막 결합, 광화 억제 | ★★★★★ |
| 주석 불화물 | 항균+항치은염+치석억제 | ★★★★★ |
| 피로인산염 | 칼슘 킬레이트화 | ★★★★☆ |

### 6.2 사용자 상태별 추천 로직

```typescript
interface UserOralProfile {
  sensitivity: 'none' | 'mild' | 'severe';
  gumHealth: 'healthy' | 'gingivitis' | 'periodontitis';
  cavityRisk: 'low' | 'medium' | 'high';
  calculus: 'none' | 'mild' | 'heavy';
  halitosis: boolean;
}

interface ProductRecommendation {
  primaryIngredients: string[];
  avoidIngredients: string[];
  productType: string;
}

function recommendOralProducts(profile: UserOralProfile): ProductRecommendation {
  const ingredients: string[] = [];
  const avoid: string[] = [];

  // 민감도 기반
  if (profile.sensitivity !== 'none') {
    ingredients.push('n-HAp', 'CPP-ACP', '질산칼륨');
    avoid.push('고농도 H₂O₂', '고RDA 치약');
  }

  // 잇몸 건강 기반
  if (profile.gumHealth === 'gingivitis') {
    ingredients.push('CPC 0.05%', 'CoQ10', '알로에');
  } else if (profile.gumHealth === 'periodontitis') {
    ingredients.push('CHX 0.12% (단기)', 'CPC');
  }

  // 충치 위험 기반
  if (profile.cavityRisk === 'high') {
    ingredients.push('Fluoride 1450ppm', 'CPP-ACPF', 'Xylitol');
  }

  // 치석 기반
  if (profile.calculus !== 'none') {
    ingredients.push('소듐 헥사메타포스페이트', '피로인산염');
  }

  // 구취 기반
  if (profile.halitosis) {
    ingredients.push('Zinc', 'CPC', '혀 클리너');
  }

  return {
    primaryIngredients: ingredients,
    avoidIngredients: avoid,
    productType: determineProductType(profile),
  };
}
```

---

## 7. AI 기반 분석 한계

### 7.1 이미지 분석 가능 영역

| 분석 항목 | 방법 | 정확도 |
|----------|------|--------|
| 치아 색상/착색 | Lab 값 추출, VITA 매칭 | 높음 (ΔE 0.53-0.93) |
| 잇몸 염증 | a* 값 분석 (붉은기) | AUC 87.11% |
| 치석 축적 패턴 | CNN 기반 탐지 | 81.11% |
| 치아 세그멘테이션 | U-Net++ | IoU 91%, Dice 0.93 |

### 7.2 분석 불가능 영역 (침습적 검사 필요)

| 항목 | 필요 검사 | 이유 |
|------|----------|------|
| 치주낭 깊이 | Probing | 물리적 측정 필요 |
| 골소실 | X-ray | 방사선 투과 필요 |
| 충치 깊이 | X-ray | 내부 구조 확인 필요 |
| 치아 동요도 | 촉진 | 물리적 테스트 필요 |

### 7.3 필수 면책 조항

```typescript
const ORAL_DISCLAIMER = {
  ko: "본 서비스는 의료 진단을 대체하지 않습니다. 정확한 진단은 치과 전문의 상담이 필요합니다.",
  en: "This service does not replace medical diagnosis. Accurate diagnosis requires consultation with a dental professional.",
};
```

### 7.4 규제 고려사항

- 의료기기 인허가 범위 확인 필요
- 개인정보보호법 준수 (구강 이미지 = 생체정보)
- "AI 결과"와 "의료 진단" 명확히 구분

---

## 8. 검증 방법

### 8.1 색상 분석 검증

```typescript
// 테스트: VITA 셰이드 매칭 정확도
describe('ShadeMatching', () => {
  it('should match B1 shade within ΔE < 2.7', () => {
    const measured = { L: 71, a: 1.5, b: 15 };
    const result = findBestShadeMatch(measured);
    expect(result.shade).toBe('B1');
    expect(result.deltaE).toBeLessThan(2.7);
  });
});
```

### 8.2 퍼스널컬러 연계 검증

```typescript
// 테스트: 웜톤에 쿨톤 셰이드 경고
describe('SeasonShadeMatch', () => {
  it('should warn warm season targeting 0M1', () => {
    const result = isOverWhitening('0M1', 'spring');
    expect(result).toBe(true);
  });
});
```

### 8.3 제품 추천 검증

```typescript
// 테스트: 민감성 사용자에게 고농도 미백 금지
describe('ProductRecommendation', () => {
  it('should avoid high H2O2 for sensitive users', () => {
    const profile: UserOralProfile = {
      sensitivity: 'severe',
      gumHealth: 'healthy',
      cavityRisk: 'low',
      calculus: 'none',
      halitosis: false,
    };
    const result = recommendOralProducts(profile);
    expect(result.avoidIngredients).toContain('고농도 H₂O₂');
  });
});
```

---

## 9. 참고 자료

### 9.1 소스 리서치

> **Status**: OH-1 리서치 번들은 Phase 3 확장 모듈에서 진행 예정
> 상세: [docs/research/README.md](../research/README.md) 참조

### 9.2 학술 참고

- Cochrane Database of Systematic Reviews (칫솔질 기법, 미백 효과)
- ISO/CIE 11664-6:2014 (CIEDE2000 색차 표준)
- VITA Zahnfabrik 공식 셰이드 가이드
- PubMed/PMC (치아 광학 특성, 미백 메커니즘)

### 9.3 관련 원리 문서

- [색채학 원리](./color-science.md) - Lab 색공간, RGB→Lab 변환
- [디자인 시스템](./design-system.md) - 퍼스널컬러 시즌 정의

---

## 10. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-046](../adr/ADR-046-oh1-oral-health-analysis.md) | OH-1 구강건강 분석 모듈 | CIE 재사용, Gemini VLM 파이프라인, 의료 면책 |

---

**Version**: 1.0 | **Created**: 2026-01-17 | **Updated**: 2026-01-19
**소스 리서치**: OH-1-BUNDLE, OH-1-BUNDLE-구강건강종합
**관련 모듈**: O-1 (구강건강 분석), 제품 추천
