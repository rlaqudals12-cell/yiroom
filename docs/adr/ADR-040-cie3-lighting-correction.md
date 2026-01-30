# ADR-040: CIE-3 조명 보정 알고리즘

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"어떤 조명 환경에서 촬영해도, 사용자의 실제 피부 톤을 D65 표준광 기준으로 완벽하게 복원하는 상태"

- **완벽한 색상 복원**: 모든 조명 조건에서 D65 (6500K) 기준 보정
- **피부 보존**: 피부 톤 왜곡 없이 배경/환경만 보정
- **실시간 처리**: 촬영 즉시 보정 완료 (< 100ms)
- **신뢰도 기반**: 보정 불확실 시 자동 경고 및 폴백

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 극단적 조명 | CCT < 2000K 또는 > 12000K 정확도 저하 |
| 혼합 조명 | 창가 + 형광등 환경 단일 CCT로 표현 불가 |
| 피부 영역 부족 | 얼굴 클로즈업 시 비피부 영역 < 10% |
| 플래시 조명 | 국소 과노출 영역 처리 한계 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 처리 시간 | < 100ms | 미구현 | 목표 150ms |
| 보정 신뢰도 | > 0.95 | 미구현 | D65 기준 |
| PC-1 정확도 향상 | > 95% | 80% | 조명 보정 후 |
| 피부톤 왜곡률 | < 2% (ΔE) | 미구현 | CIE Lab 기준 |

### 현재 목표: 85%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 딥러닝 AWB | 모델 크기, 추론 시간 (SCALE) | 엣지 ML 성숙 시 |
| Retinex 알고리즘 | 500ms+ 처리 시간 (PERFORMANCE) | - |
| Cloud Vision API | 외부 의존성 + 비용 (FINANCIAL_HOLD) | 비용 협상 후 |
| EXIF 기반 CCT | 범용성 부족 (COMPATIBILITY) | - |

---

## 맥락 (Context)

이룸의 AI 피부/퍼스널컬러 분석은 입력 이미지의 조명 조건에 민감합니다. 사용자들이 다양한 환경(형광등, 백열등, 자연광)에서 촬영하기 때문에 색상 왜곡이 발생합니다.

### 현재 문제

1. **조명 편차로 인한 분석 오류**:
   | 조명 조건 | 색온도 (K) | 영향 |
   |----------|-----------|------|
   | 백열등 | 2700K | 노란/주황 톤 과장 → 웜톤 오분류 |
   | 형광등 | 4000-5000K | 녹색 틴트 → 피부 톤 왜곡 |
   | 자연광 (아침) | 3000-4000K | 따뜻한 톤 |
   | 자연광 (정오) | 5500-6500K | 이상적 조건 |
   | 자연광 (흐림) | 6500-8000K | 차가운 톤 → 쿨톤 오분류 |
   | LED | 2700-6500K | 다양 |

2. **기존 접근법의 한계**:
   - Gemini VLM만으로 분석 시 조명 정보 미제공
   - 사용자에게 "자연광에서 촬영"을 권장하나 준수율 낮음
   - 후처리 보정 없이 원본 이미지 분석

3. **보정 필요성**:
   - PC-1 (퍼스널컬러): 정확한 피부 톤 측정 필수
   - S-1 (피부분석): 색상 기반 상태 평가
   - 제품 매칭: 피부색-제품색 정확한 비교

### 요구사항

| 요구사항 | 우선순위 | 근거 |
|---------|---------|------|
| D65 (6500K) 기준 보정 | P0 | 업계 표준 화이트 포인트 |
| 피부 영역 제외 AWB | P0 | 피부색 왜곡 방지 |
| 보정 신뢰도 제공 | P0 | 분석 가중치 조절 |
| 원본 보존 옵션 | P1 | 사용자 비교 |
| 실시간 처리 < 200ms | P1 | UX |

## 결정 (Decision)

**Gray World + Von Kries + Skin-Aware AWB 3단계 파이프라인**을 구현합니다.

### 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    CIE-3 조명 보정 파이프라인                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  입력 이미지 (RGB)                                               │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │ Stage 1: 피부 영역 검출 (YCbCr)         │                   │
│  │   └── Cb ∈ [77, 127], Cr ∈ [133, 173]  │                   │
│  │   └── 피부 마스크 생성                   │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │ Stage 2: Gray World AWB (비피부 영역)   │                   │
│  │   └── R_gain = 128 / R_avg             │                   │
│  │   └── G_gain = 128 / G_avg             │                   │
│  │   └── B_gain = 128 / B_avg             │                   │
│  │   └── 비피부 < 10% → 전체 영역 사용     │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │ Stage 3: CCT 추정 (McCamy 공식)         │                   │
│  │   └── RGB → XYZ → (x, y)               │                   │
│  │   └── CCT = 449n³ + 3525n² + 6823n + 5520 │                │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │ Stage 4: Von Kries 색순응 변환          │                   │
│  │   └── RGB → XYZ → LMS (Bradford)       │                   │
│  │   └── D65 기준 스케일링                 │                   │
│  │   └── LMS → XYZ → RGB                  │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │ Stage 5: 신뢰도 계산                    │                   │
│  │   └── gain 범위 체크 (0.7 ~ 1.4)        │                   │
│  │   └── CCT 차이 체크 (|CCT - 6500|)      │                   │
│  │   └── 비피부 비율 체크                   │                   │
│  └─────────────────────────────────────────┘                   │
│       │                                                         │
│       ▼                                                         │
│  보정된 이미지 + 메타데이터                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 핵심 알고리즘

#### 1. 피부 영역 검출 (YCbCr)

```typescript
// YCbCr 색공간에서 피부색 범위
const SKIN_CB_MIN = 77;
const SKIN_CB_MAX = 127;
const SKIN_CR_MIN = 133;
const SKIN_CR_MAX = 173;

function isSkinPixel(cb: number, cr: number): boolean {
  return cb >= SKIN_CB_MIN && cb <= SKIN_CB_MAX &&
         cr >= SKIN_CR_MIN && cr <= SKIN_CR_MAX;
}
```

#### 2. Gray World AWB

```typescript
// 비피부 영역의 평균 RGB → 중간 회색(128) 기준 보정
const R_gain = 128 / R_avg_nonSkin;
const G_gain = 128 / G_avg_nonSkin;
const B_gain = 128 / B_avg_nonSkin;

// Gain 클램핑 (극단적 보정 방지)
const GAIN_MIN = 0.5;
const GAIN_MAX = 2.0;
```

#### 3. McCamy CCT 공식

```typescript
// RGB → XYZ → xy → CCT
// n = (x - 0.3320) / (0.1858 - y)
// CCT = 449n³ + 3525n² + 6823n + 5520

function estimateCCT(x: number, y: number): number {
  const n = (x - 0.3320) / (0.1858 - y);
  return 449 * n ** 3 + 3525 * n ** 2 + 6823 * n + 5520;
}
```

#### 4. Von Kries 색순응 (Bradford Transform)

```typescript
// Bradford 변환 행렬
const BRADFORD_MATRIX = [
  [0.8951, 0.2664, -0.1614],
  [-0.7502, 1.7135, 0.0367],
  [0.0389, -0.0685, 1.0296],
];

// D65 기준 (6500K)
const D65_XYZ = { X: 0.95047, Y: 1.0, Z: 1.08883 };

function vonKriesAdaptation(xyz: XYZ, sourceWhite: XYZ): XYZ {
  const sourceLMS = xyzToLMS(sourceWhite);
  const d65LMS = xyzToLMS(D65_XYZ);

  const scale = {
    L: d65LMS.L / sourceLMS.L,
    M: d65LMS.M / sourceLMS.M,
    S: d65LMS.S / sourceLMS.S,
  };

  const lms = xyzToLMS(xyz);
  const adaptedLMS = {
    L: lms.L * scale.L,
    M: lms.M * scale.M,
    S: lms.S * scale.S,
  };

  return lmsToXYZ(adaptedLMS);
}
```

### 신뢰도 계산

| 조건 | 신뢰도 감소 |
|------|------------|
| Gain 범위 이탈 (< 0.7 또는 > 1.4) | -20% |
| CCT 차이 > 2000K | -15% |
| 비피부 영역 < 10% | -25% |
| 비피부 영역 < 5% | 보정 스킵, 원본 반환 |

```typescript
interface AWBResult {
  correctedImage: ImageData;
  originalCCT: number;
  targetCCT: number;  // 6500 (D65)
  gains: { R: number; G: number; B: number };
  confidence: number;  // 0.0 ~ 1.0
  skinRatio: number;
  nonSkinRatio: number;
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **전체 영역 Gray World** | 구현 단순 | 피부색 왜곡 | `UX` - 피부색 보정 문제 |
| **Retinex 알고리즘** | 국소 조명 대응 | 계산 비용 높음, 과보정 | `PERFORMANCE` - 500ms+ |
| **딥러닝 AWB** | 높은 정확도 | 모델 크기, 추론 시간 | `SCALE` - 클라이언트 배포 어려움 |
| **카메라 EXIF 활용** | 정확한 CCT | EXIF 없는 이미지 다수 | `COMPATIBILITY` - 범용성 부족 |
| **Skin-Aware Gray World + Von Kries** ✅ | 피부 보존, 균형 | 구현 복잡도 | **채택** |

### 색공간 선택

| 색공간 | 피부 검출 | 색순응 | 선택 |
|--------|----------|--------|------|
| RGB | 불안정 | 불가 | ❌ |
| HSV | 조명 민감 | 불가 | ❌ |
| YCbCr | 조명 불변, 피부 범위 명확 | 불가 | ✅ 피부 검출 |
| XYZ | 불편 | 색순응 표준 | ✅ 색순응 |
| LMS | 불편 | Bradford 변환 | ✅ Von Kries |

## 결과 (Consequences)

### 긍정적 결과

- **PC-1 정확도 향상**: 조명 편차로 인한 웜/쿨 오분류 감소
- **S-1 일관성**: 다양한 조명에서 일관된 피부 상태 평가
- **피부색 보존**: Skin-Aware로 피부 톤 왜곡 최소화
- **신뢰도 기반 가중치**: 보정 품질에 따른 분석 조정

### 부정적 결과

- **처리 시간 증가**: ~100-150ms 추가
- **구현 복잡도**: 색공간 변환 행렬 다수
- **극단적 조명 한계**: CCT 2000K 이하 또는 12000K 이상 부정확

### 리스크

- **피부 오검출**: 피부색과 유사한 배경(베이지 벽 등) → 비피부 비율 감소
- **혼합 조명**: 창가 형광등 환경 → 단일 CCT로 표현 불가
- **플래시 조명**: 국소 과노출 → Gray World 왜곡

### 완화 전략

- **피부 오검출**: 얼굴 영역 ROI와 교차 검증 (CIE-4 연동)
- **혼합 조명**: "균일한 조명에서 촬영" 가이드 강화
- **플래시**: 과노출 영역 제외 로직 추가

## 구현 가이드

### 파일 구조

```
lib/image/
├── awb/
│   ├── index.ts              # 공개 API
│   ├── types.ts              # 타입 정의
│   ├── internal/
│   │   ├── skin-detector.ts  # YCbCr 피부 검출
│   │   ├── gray-world.ts     # Gray World AWB
│   │   ├── cct-estimator.ts  # McCamy CCT
│   │   ├── von-kries.ts      # 색순응 변환
│   │   ├── color-space.ts    # RGB↔XYZ↔LMS
│   │   └── confidence.ts     # 신뢰도 계산
│   └── __tests__/
│       └── awb.test.ts
```

### 공개 API

```typescript
// lib/image/awb/index.ts
export { correctWhiteBalance, type AWBResult } from './internal/pipeline';
export { estimateCCT, type CCTResult } from './internal/cct-estimator';
export { detectSkinRegions, type SkinMask } from './internal/skin-detector';
```

### 사용 예시

```typescript
import { correctWhiteBalance } from '@/lib/image/awb';

const result = await correctWhiteBalance(imageData, {
  targetCCT: 6500,  // D65
  preserveSkin: true,
  minNonSkinRatio: 0.1,
});

if (result.confidence < 0.5) {
  console.warn('Low AWB confidence, using original image');
  return originalImage;
}

return result.correctedImage;
```

## 테스트 시나리오

| 시나리오 | 입력 | 예상 결과 |
|---------|------|----------|
| 정상 자연광 | CCT ~6000K | 보정 최소, confidence > 0.9 |
| 백열등 | CCT ~2700K | B_gain > 1.3, confidence > 0.7 |
| 형광등 | CCT ~4000K | 중간 보정, confidence > 0.8 |
| 얼굴 클로즈업 | skinRatio > 90% | 원본 반환, confidence 경고 |
| 혼합 조명 | 불균일 | confidence < 0.6, 경고 로그 |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 이미지 처리](../principles/image-processing.md) - 색공간, AWB 이론
- [원리: 색채학](../principles/color-science.md) - CIE 색공간, 색온도

### 관련 ADR
- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - CIE 파이프라인 아키텍처
- [ADR-026: 색공간 HSL 결정](./ADR-026-color-space-hsl-decision.md) - 색공간 선택
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - 신뢰도 기반 폴백

### 관련 스펙
- [SDD-CIE-3-AWB-CORRECTION](../specs/SDD-CIE-3-AWB-CORRECTION.md) - 상세 구현 스펙

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-CIE-3-AWB-CORRECTION](../specs/SDD-CIE-3-AWB-CORRECTION.md) | ✅ 작성 완료 | AWB 알고리즘 상세 |

---

**Author**: Claude Code
**Reviewed by**: -
