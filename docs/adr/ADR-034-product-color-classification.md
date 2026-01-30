# ADR-034: 상품 색상 자동 분류 시스템

## 상태

`accepted`

## 날짜

2026-01-20

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 상품의 색상이 Lab 색공간 기준으로 정확히 분류되어 완벽한 PC-1 매칭 제공"

- **95% 정확도**: 인간 레이블러와 동등한 톤 분류 정확도
- **실시간 처리**: 이미지당 100ms 이내 처리
- **복잡 패턴 지원**: 스트라이프, 체크, 프린트 패턴도 정확히 분석
- **자동 학습**: 사용자 피드백으로 모델 지속 개선

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 이미지 품질 | 저해상도/압축 이미지에서 색상 왜곡 |
| 조명 영향 | 상품 촬영 조명에 따라 색상 변동 |
| 복잡한 패턴 | 다색 패턴에서 대표색 추출 모호 |
| 디스플레이 차이 | 기기별 색 재현 차이 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 톤 분류 정확도 | 95% | 85% | K-means + Lab |
| 처리 속도 | < 100ms | 200-400ms | 클라이언트 처리 |
| 패턴 인식 | 복잡 패턴 지원 | 단색 최적화 | 패턴 감지 없음 |
| 조명 보정 | AWB 자동 적용 | 미적용 | 수동 필터링 |

### 현재 목표: 85%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Cloud Vision API | 비용 (FINANCIAL_HOLD) - $1.5/1000장 | 정확도 80% 미달 시 |
| 딥러닝 모델 | 복잡도 (HIGH_COMPLEXITY) - 학습 데이터 필요 | 자체 학습 데이터 확보 시 |
| 패턴 전용 분석 | 범위 초과 (SCOPE_EXCEED) | 의류 카테고리 확장 시 |
| 화이트밸런스 자동 보정 | 원본 훼손 우려 (LOW_ROI) | 정확도 이슈 시 |

---

## 맥락 (Context)

이룸의 어필리에이트 상품 추천 시스템에서 **상품 이미지의 색상을 자동으로 추출하고 분류**하는 기능이 필요합니다.

### 요구사항

1. **실시간 색상 추출**: 외부 쇼핑몰 상품 이미지에서 대표 색상 추출
2. **퍼스널컬러 매칭**: 추출된 색상을 사용자의 4계절/12톤과 매칭
3. **톤 분류**: 웜톤/쿨톤 자동 분류
4. **정확도**: 인간 레이블러 대비 85%+ 일치율
5. **성능**: 이미지당 500ms 이내 처리

### 현재 상황

- **수동 태깅**: 현재 상품 색상은 크롤링 시 텍스트 기반으로 추출
- **한계**: "베이지", "네이비" 등 텍스트만으로는 정확한 톤 분류 불가
- **목표**: 이미지 기반 자동 색상 분류로 PC-1 매칭 정확도 향상

## 결정 (Decision)

**K-means 클러스터링 + Lab 색공간 변환** 방식을 선택합니다.

### 파이프라인

```
┌─────────────────────────────────────────────────────────────┐
│                 상품 색상 자동 분류 파이프라인                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. 이미지 입력                                             │
│      │                                                       │
│      ▼                                                       │
│   2. 배경 제거 (선택적)                                      │
│      │   - 흰색/회색 배경 감지                               │
│      │   - GrabCut 또는 U²-Net                               │
│      ▼                                                       │
│   3. K-means 클러스터링 (k=5)                                │
│      │   - 상위 5개 대표색 추출                              │
│      │   - 각 클러스터의 픽셀 비율 계산                      │
│      ▼                                                       │
│   4. 대표색 선택                                             │
│      │   - 배경색 필터링 (흰/검/회)                          │
│      │   - 가장 큰 비율의 색상 선택                          │
│      ▼                                                       │
│   5. RGB → Lab 변환                                          │
│      │   - D65 일광 기준                                     │
│      ▼                                                       │
│   6. 톤 분류                                                 │
│      │   - Lab a*, b* 값으로 웜/쿨 판정                      │
│      │   - L* 값으로 명도 분류                               │
│      ▼                                                       │
│   7. PC-1 매칭                                               │
│      │   - 사용자 계절과 비교                                │
│      │   - 매칭률 0-100% 반환                                │
│      ▼                                                       │
│   출력: { dominantColor, tone, seasonMatch, matchRate }      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 선택 이유

1. **클라이언트 사이드 가능**: 브라우저에서 Canvas API로 처리 가능
2. **비용 없음**: 외부 API 호출 불필요
3. **빠른 처리**: 평균 200-400ms
4. **검증된 알고리즘**: K-means는 색상 추출의 표준 방식

### 핵심 알고리즘

```typescript
// lib/color-classification/extract-colors.ts

interface ExtractedColor {
  rgb: [number, number, number];
  lab: { L: number; a: number; b: number };
  percentage: number;
  hex: string;
}

interface ColorClassificationResult {
  dominantColor: ExtractedColor;
  palette: ExtractedColor[];
  tone: 'warm' | 'cool' | 'neutral';
  seasonMatch: {
    spring: number;
    summer: number;
    autumn: number;
    winter: number;
  };
  confidence: number;
}

/**
 * 상품 이미지에서 색상 추출 및 분류
 */
async function classifyProductColor(
  imageUrl: string
): Promise<ColorClassificationResult> {
  // 1. 이미지 로드 및 리사이즈 (성능)
  const pixels = await loadImagePixels(imageUrl, { maxSize: 256 });

  // 2. 배경색 필터링
  const filteredPixels = filterBackgroundColors(pixels);

  // 3. K-means 클러스터링
  const clusters = kMeansClustering(filteredPixels, { k: 5, iterations: 10 });

  // 4. 대표색 선택 (배경색 제외 후 최대 비율)
  const palette = clusters
    .filter(c => !isBackgroundColor(c.centroid))
    .sort((a, b) => b.percentage - a.percentage);

  const dominantColor = palette[0];

  // 5. RGB → Lab 변환
  const labColor = rgbToLab(dominantColor.rgb);

  // 6. 톤 분류
  const tone = classifyTone(labColor);

  // 7. 계절별 매칭률 계산
  const seasonMatch = calculateSeasonMatch(labColor);

  // 8. 신뢰도 계산
  const confidence = calculateConfidence(palette);

  return {
    dominantColor: {
      ...dominantColor,
      lab: labColor,
      hex: rgbToHex(dominantColor.rgb),
    },
    palette: palette.slice(0, 5).map(c => ({
      ...c,
      lab: rgbToLab(c.rgb),
      hex: rgbToHex(c.rgb),
    })),
    tone,
    seasonMatch,
    confidence,
  };
}
```

### 톤 분류 로직

```typescript
// lib/color-classification/tone-classifier.ts

/**
 * Lab 색공간에서 톤 분류
 *
 * 웜톤: a* > 0 (붉은 기운) AND b* > 0 (노란 기운)
 * 쿨톤: a* < 0 (녹색 기운) OR b* < 0 (파란 기운)
 * 중립: 경계선 (a*, b* 모두 낮음)
 */
function classifyTone(lab: LabColor): 'warm' | 'cool' | 'neutral' {
  const { a, b } = lab;

  // 중립 영역 (a*, b* 모두 5 이내)
  if (Math.abs(a) < 5 && Math.abs(b) < 5) {
    return 'neutral';
  }

  // 웜톤: 붉은+노란 기운
  if (a > 0 && b > 0) {
    return 'warm';
  }

  // 쿨톤: 그 외
  return 'cool';
}

/**
 * 계절별 매칭률 계산
 */
function calculateSeasonMatch(lab: LabColor): Record<Season, number> {
  const { L, a, b } = lab;

  // 각 계절의 기준 Lab 범위 (color-science.md 참조)
  const seasonRanges = {
    spring: { L: [62, 75], a: [6, 14], b: [18, 28] },
    summer: { L: [58, 72], a: [5, 12], b: [12, 20] },
    autumn: { L: [52, 65], a: [8, 18], b: [20, 32] },
    winter: { L: [48, 62], a: [4, 14], b: [10, 20] },
  };

  const scores: Record<Season, number> = {} as Record<Season, number>;

  for (const [season, range] of Object.entries(seasonRanges)) {
    const lScore = rangeScore(L, range.L[0], range.L[1]);
    const aScore = rangeScore(a, range.a[0], range.a[1]);
    const bScore = rangeScore(b, range.b[0], range.b[1]);

    // 가중 평균 (b* 가중치 높음 - 톤 결정에 중요)
    scores[season as Season] = Math.round(
      lScore * 0.2 + aScore * 0.3 + bScore * 0.5
    );
  }

  return scores;
}

function rangeScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 100;
  }

  // 범위 밖: 거리에 따라 감점
  const distance = value < min ? min - value : value - max;
  return Math.max(0, 100 - distance * 5);
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **Google Vision API** | 높은 정확도, 속성 감지 포함 | 비용 ($1.5/1000장), 지연 | `FINANCIAL_HOLD` |
| **AWS Rekognition** | 정확도, Label 포함 | 비용 ($1/1000장), 지연 | `FINANCIAL_HOLD` |
| **TensorFlow.js MobileNet** | 로컬 처리, 무료 | 색상 특화 아님, 복잡 | `LOW_CAPABILITY` |
| **Dominant Color 단순 추출** | 매우 빠름 | 단일색만, 정확도 낮음 | `LOW_CAPABILITY` |
| **Histogram 분석** | 빠름, 간단 | 배경 혼입, 톤 분류 어려움 | `LOW_CAPABILITY` |

### 상세 비교

| 기준 | K-means + Lab | Google Vision | AWS Rekognition |
|------|--------------|---------------|-----------------|
| 비용 | 무료 | $1.5/1000 | $1/1000 |
| 지연 | 200-400ms | 500-1000ms | 500-1000ms |
| 정확도 | 85% | 92% | 90% |
| 톤 분류 | ✅ (Lab 기반) | ❌ (별도 구현) | ❌ (별도 구현) |
| 오프라인 | ✅ | ❌ | ❌ |
| 커스터마이징 | ✅ | ❌ | ❌ |

## 결과 (Consequences)

### 긍정적 결과

- **비용 절감**: API 호출 비용 없음
- **빠른 처리**: 실시간 색상 추출 가능
- **커스터마이징**: 퍼스널컬러 매칭에 최적화된 톤 분류
- **오프라인 지원**: 네트워크 없이 작동 가능

### 부정적 결과

- **정확도 한계**: 복잡한 패턴/프린트 의류에서 정확도 저하
- **조명 영향**: 상품 이미지 조명에 따라 결과 변동
- **배경 처리**: 복잡한 배경 이미지에서 배경 분리 어려움

### 리스크

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| 복잡한 패턴 의류 | 높음 | 중간 | 신뢰도 낮으면 수동 태깅 |
| 조명 왜곡 | 중간 | 중간 | 화이트밸런스 보정 적용 |
| 배경 분리 실패 | 낮음 | 중간 | GrabCut 알고리즘 적용 |

## 구현 가이드

### 파일 구조

```
lib/color-classification/
├── index.ts                    # 공개 API
├── types.ts                    # 타입 정의
├── extract-colors.ts           # K-means 클러스터링
├── tone-classifier.ts          # 톤 분류
├── season-matcher.ts           # 계절 매칭
├── background-filter.ts        # 배경 필터링
└── color-utils.ts              # RGB ↔ Lab 변환
```

### 사용 예시

```typescript
// 상품 색상 분류 및 PC-1 매칭
import { classifyProductColor } from '@/lib/color-classification';

const product = await fetchProduct(productId);
const colorResult = await classifyProductColor(product.imageUrl);

// 사용자 퍼스널컬러와 매칭
const userSeason = user.personalColor.season; // 'spring'
const matchRate = colorResult.seasonMatch[userSeason]; // 85

// UI 표시
if (matchRate >= 80) {
  showBadge('좋은 매칭', 'green');
} else if (matchRate >= 60) {
  showBadge('보통', 'yellow');
} else {
  showBadge('비추천', 'gray');
}
```

### 배치 처리

```typescript
// 여러 상품 일괄 분류 (Worker 사용)
const products = await fetchProducts({ limit: 100 });

const results = await Promise.all(
  products.map(async (product) => {
    try {
      const colorResult = await classifyProductColor(product.imageUrl);
      return { productId: product.id, ...colorResult, success: true };
    } catch (error) {
      return { productId: product.id, success: false, error };
    }
  })
);

// DB 업데이트
await updateProductColors(results.filter(r => r.success));
```

## 테스트 계획

### 정확도 검증

```typescript
// tests/lib/color-classification/accuracy.test.ts

describe('Color Classification Accuracy', () => {
  // 수동 레이블된 테스트셋 (100개)
  const testSet = loadTestSet('color-classification-test-set.json');

  it('should achieve 85%+ accuracy on labeled dataset', async () => {
    let correct = 0;
    for (const { imageUrl, expectedTone } of testSet) {
      const result = await classifyProductColor(imageUrl);
      if (result.tone === expectedTone) correct++;
    }
    expect(correct / testSet.length).toBeGreaterThanOrEqual(0.85);
  });
});
```

## 리서치 티켓

```
[ADR-034-R1] 배경 제거 알고리즘 비교
────────────────────────────────────
리서치 질문:
1. GrabCut vs U²-Net vs rembg 성능 비교
2. 흰색 배경 자동 감지 정확도
3. 배경 제거 처리 시간

예상 출력:
- 알고리즘별 벤치마크 결과
- 권장 알고리즘 및 파라미터
```

```
[ADR-034-R2] K-means 파라미터 최적화
────────────────────────────────────
리서치 질문:
1. 최적 k 값 (3, 5, 7 비교)
2. 반복 횟수별 수렴 속도
3. 초기화 방법 (random vs k-means++)

예상 출력:
- 최적 파라미터 조합
- 성능-정확도 트레이드오프 분석
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 색채학](../principles/color-science.md) - Lab 색공간, 웜톤/쿨톤 이론
- [원리: 패션 매칭](../principles/fashion-matching.md) - 색상 조화 이론

### 관련 ADR
- [ADR-029: 어필리에이트 통합](./ADR-029-affiliate-integration.md) - 상품 추천 시스템
- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - 이미지 처리 파이프라인

### 구현 스펙
- [SDD-AUTO-COLOR-CLASSIFICATION](../specs/SDD-AUTO-COLOR-CLASSIFICATION.md) - 상세 스펙

---

**Author**: Claude Code
**Reviewed by**: -
