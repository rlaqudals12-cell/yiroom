# 크로스 도메인 시너지 원리 (Cross-Domain Synergy)

> 이 문서는 다중 도메인 분석의 시너지 효과와 N×M 조합 원리를 설명한다.
> COMBO-* 시리즈, CAPSULE-MULTI-DOMAIN 모듈의 기반이 되는 원리이다.
>
> **소스 리서치**: COMBO-1~10, CAPSULE-MULTI-DOMAIN

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 통합 웰니스 분석 시스템"

- 모든 도메인 연결: 7개 분석 도메인(PC/S/C/W/N/P/O)의 완벽한 상호 연계
- 시너지 극대화: 개별 분석 합 대비 150% 이상의 통합 가치 제공
- 실시간 연동: 한 도메인 변화가 관련 도메인에 자동 반영
- 개인화 인사이트: "피부 상태 + 영양 + 운동" 종합 권장 제공
- 학습 기반 가중치: 사용자 피드백 기반 시너지 계수 동적 조정
- 캡슐 통합: 다중 도메인 결과를 하나의 액션 플랜으로 압축
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **인과관계 증명** | 도메인 간 상관관계는 확인, 인과관계는 증명 어려움 |
| **시간차 반영** | 영양 변화 → 피부 개선은 2-4주 지연 |
| **개인차** | 동일 조합의 시너지 효과가 개인마다 상이 |
| **데이터 의존** | 다중 도메인 분석에는 충분한 사용자 데이터 필요 |
| **복잡도** | N×M 조합은 기하급수적 복잡도 증가 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **도메인 커버리지** | 7개 도메인 100% 연계 |
| **시너지 매트릭스** | 21개 조합(7C2) 시너지 계수 정의 |
| **통합 점수** | 개별 합 대비 시너지 계수 > 1.3 |
| **실시간 연동** | 도메인 변경 시 5분 이내 관련 도메인 업데이트 |
| **권장 통합** | 3개 이상 도메인 결합 권장 제공 |
| **사용자 만족** | 통합 권장 만족도 4.2/5.0 이상 |

### 현재 목표

**65%** - MVP 크로스 도메인 시너지

- ✅ 7개 도메인 정의 및 분류
- ✅ N×M 시너지 매트릭스 설계
- ✅ 상위 시너지 조합 식별 (S×P, S×N, C×W)
- ✅ 도메인 간 의존성 그래프
- ⏳ 시너지 계수 동적 조정 (40%)
- ⏳ 통합 인사이트 생성 (50%)
- ⏳ 캡슐 액션 플랜 (30%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 7개 이상 도메인 | 현재 도메인 안정화 우선 | Phase 4 |
| ML 기반 시너지 학습 | 충분한 데이터 수집 필요 | Phase 3 |
| 실시간 도메인 동기화 | 인프라 복잡도 | Phase 4 |

---

## 1. 핵심 개념

### 1.1 크로스 도메인 시너지란?

단일 도메인 분석보다 다중 도메인 통합 분석이 더 큰 가치를 제공하는 현상.

```
가치(피부) + 가치(영양) < 가치(피부 × 영양)

시너지 계수 = 가치(통합) / Σ 가치(개별)
시너지 계수 > 1.0 이면 시너지 존재
```

### 1.2 도메인 정의

이룸의 분석 도메인:

| 도메인 | 코드 | 설명 | 분석 요소 |
|--------|------|------|----------|
| 퍼스널컬러 | PC | 피부톤/색조 분석 | 웜/쿨톤, 시즌 |
| 피부 | S | 피부 상태 분석 | 유형, 문제, 수분도 |
| 체형 | C | 신체 비율 분석 | 체형 유형, 비율 |
| 자세 | W | 자세 분석 | 불균형, 각도 |
| 영양 | N | 영양 상태 분석 | 결핍, 균형 |
| 시술 | P | 시술 추천 | 레이저, 주사 등 |
| 구강 | O | 구강 분석 | 치아, 스마일 |

### 1.3 N×M 조합 매트릭스

```
         PC    S     C     W     N     P     O
PC       -    90    70    40    60    85    50
S       90     -    50    30    95    98    40
C       70    50     -    95    70    60    30
W       40    30    95     -    60    50    20
N       60    95    70    60     -    80    75
P       85    98    60    50    80     -    60
O       50    40    30    20    75    60     -

값: 시너지 점수 (0-100)
대각선: 동일 도메인 (해당 없음)
```

**최고 시너지 조합 (P0):**
- S × P (98): 피부 × 시술
- S × N (95): 피부 × 영양
- C × W (95): 체형 × 자세

---

## 2. 수학적 기반

### 2.1 시너지 계산

```typescript
interface DomainAnalysis {
  domain: string;
  score: number;
  recommendations: string[];
}

interface SynergyResult {
  combinedScore: number;
  synergyFactor: number;
  crossRecommendations: string[];
}

function calculateSynergy(
  domain1: DomainAnalysis,
  domain2: DomainAnalysis,
  synergyMatrix: number[][]
): SynergyResult {
  const baseSynergy = synergyMatrix[domain1.domain][domain2.domain] / 100;

  // 개별 점수 가중 평균
  const individualValue = (domain1.score + domain2.score) / 2;

  // 시너지 적용
  const combinedScore = individualValue * (1 + baseSynergy * 0.5);

  // 시너지 계수
  const synergyFactor = combinedScore / individualValue;

  // 교차 추천 생성
  const crossRecommendations = generateCrossRecommendations(
    domain1.recommendations,
    domain2.recommendations,
    baseSynergy
  );

  return {
    combinedScore,
    synergyFactor,
    crossRecommendations,
  };
}
```

### 2.2 충돌 해결

도메인 간 추천이 충돌할 때 해결 규칙:

```typescript
interface Recommendation {
  id: string;
  domain: string;
  action: string;
  priority: number;
  conflicts?: string[];  // 충돌하는 추천 ID
}

function resolveConflicts(
  recommendations: Recommendation[]
): Recommendation[] {
  const resolved: Recommendation[] = [];
  const conflictGroups = groupByConflicts(recommendations);

  for (const group of conflictGroups) {
    if (group.length === 1) {
      resolved.push(group[0]);
    } else {
      // 우선순위 규칙:
      // 1. 건강/안전 관련 우선
      // 2. 도메인 전문성 점수
      // 3. 사용자 선호도
      const winner = selectByPriority(group);
      resolved.push(winner);

      // 충돌 사유 기록
      logConflictResolution(group, winner);
    }
  }

  return resolved;
}

// 우선순위 계층
const PRIORITY_HIERARCHY = [
  'health_safety',       // 건강/안전 최우선
  'medical_guidance',    // 의료 가이드
  'domain_expertise',    // 도메인 전문성
  'user_preference',     // 사용자 선호
  'general',             // 일반
];
```

### 2.3 가치 정량화

```typescript
interface ValueMetrics {
  accuracy: number;        // 추천 정확도
  relevance: number;       // 사용자 관련성
  actionability: number;   // 실행 가능성
  uniqueness: number;      // 교차 분석 고유 인사이트
}

function quantifyValue(
  singleDomainValue: number,
  crossDomainValue: number
): { synergyValue: number; percentage: number } {
  const synergyValue = crossDomainValue - singleDomainValue;
  const percentage = (synergyValue / singleDomainValue) * 100;

  return { synergyValue, percentage };
}
```

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

**다중 도메인 분석 파이프라인:**

```
1. 개별 도메인 분석
   └── PC-1, S-1, C-1, ... 병렬 실행

2. 시너지 계산
   └── 도메인 쌍별 시너지 점수 계산

3. 교차 추천 생성
   └── 시너지 높은 조합 우선
   └── 충돌 해결

4. 통합 결과 구성
   └── 개별 결과 + 교차 인사이트
```

### 3.2 알고리즘 → 코드

```typescript
interface MultiDomainAnalysis {
  individual: Map<string, DomainAnalysis>;
  synergies: SynergyResult[];
  integrated: IntegratedResult;
}

async function analyzeMultipleDomains(
  image: string,
  domains: string[]
): Promise<MultiDomainAnalysis> {
  // 1. 병렬 개별 분석
  const individualResults = await Promise.all(
    domains.map(domain => analyzeDomain(image, domain))
  );

  const individual = new Map(
    domains.map((d, i) => [d, individualResults[i]])
  );

  // 2. 시너지 계산 (상위 3개 조합)
  const synergies: SynergyResult[] = [];
  const pairs = generatePairs(domains);

  for (const [d1, d2] of pairs) {
    const synergy = calculateSynergy(
      individual.get(d1)!,
      individual.get(d2)!,
      SYNERGY_MATRIX
    );
    synergies.push({ domains: [d1, d2], ...synergy });
  }

  // 시너지 순 정렬
  synergies.sort((a, b) => b.synergyFactor - a.synergyFactor);

  // 3. 통합 결과
  const integrated = integrateResults(
    individual,
    synergies.slice(0, 3)  // 상위 3개 시너지
  );

  return { individual, synergies, integrated };
}
```

### 3.3 캡슐 알고리즘

최소 제품 세트(캡슐) 생성:

```typescript
interface CapsuleKit {
  essentials: Product[];      // 필수 (3-5개)
  recommended: Product[];     // 권장 (3-5개)
  optional: Product[];        // 선택 (2-3개)
  totalBudget: number;
  synergyScore: number;
}

function generateCapsule(
  analyses: MultiDomainAnalysis,
  budget: 'low' | 'medium' | 'high'
): CapsuleKit {
  const products = collectRecommendedProducts(analyses);

  // 호환성 매트릭스
  const compatibility = calculateProductCompatibility(products);

  // 예산 내 최대 시너지 조합 (배낭 문제 변형)
  const budgetLimit = BUDGET_LIMITS[budget];
  const optimal = optimizeForSynergy(products, compatibility, budgetLimit);

  return {
    essentials: optimal.slice(0, 4),
    recommended: optimal.slice(4, 8),
    optional: optimal.slice(8, 11),
    totalBudget: calculateTotalPrice(optimal),
    synergyScore: calculateOverallSynergy(optimal, compatibility),
  };
}
```

---

## 4. 검증 방법

### 4.1 시너지 검증

| 검증 항목 | 기준 | 방법 |
|----------|------|------|
| 시너지 계수 | > 1.1 | A/B 테스트 |
| 충돌 해결 | 안전 우선 | 전문가 검토 |
| 사용자 만족 | NPS > 50 | 설문 조사 |

### 4.2 테스트

```typescript
describe('CrossDomainSynergy', () => {
  it('should produce synergy > 1.0 for high-synergy pairs', async () => {
    const result = await analyzeMultipleDomains(testImage, ['S', 'N']);

    const skinNutritionSynergy = result.synergies.find(
      s => s.domains.includes('S') && s.domains.includes('N')
    );

    expect(skinNutritionSynergy?.synergyFactor).toBeGreaterThan(1.0);
  });

  it('should resolve conflicts safely', () => {
    const conflicting = [
      { id: 'a', action: 'apply_retinol', priority: 2 },
      { id: 'b', action: 'apply_aha', priority: 1, conflicts: ['a'] },
    ];

    const resolved = resolveConflicts(conflicting);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe('a');  // 높은 우선순위
  });
});
```

---

## 5. N×M 조합 상세

### 5.1 P0 우선순위 조합

#### COMBO-SKIN-PROCEDURE (S × P)

```
시너지 점수: 98

시너지 요소:
- 피부 상태 → 시술 효과 예측
- 시술 전후 스킨케어 연계
- 피부 타입별 시술 금기 필터링

교차 인사이트:
- "건성 피부는 레이저 시술 후 회복이 느릴 수 있어요"
- "여드름 피부는 리프팅보다 스킨부스터를 먼저 고려하세요"
```

#### COMBO-BODY-EXERCISE (C × W)

```
시너지 점수: 95

시너지 요소:
- 체형 특성 → 맞춤 운동 선택
- 자세 불균형 → 교정 운동 우선
- 체형 목표 → 운동 계획 최적화

교차 인사이트:
- "거북목이 있어 어깨 운동 전 목 스트레칭이 필요해요"
- "골반 전방경사로 스쿼트 시 폼 주의가 필요해요"
```

### 5.2 P1 우선순위 조합

#### COMBO-PC-SKINCARE (PC × S)

```
시너지 점수: 90

시너지 요소:
- 피부톤 → 톤업 제품 선택
- 시즌 → 파운데이션/립 추천
- 피부 상태 → 메이크업 주의사항

교차 인사이트:
- "쿨톤 + 건성 피부는 핑크빛 수분 크림이 잘 어울려요"
- "웜톤 + 지성 피부는 매트한 코랄 립이 좋아요"
```

---

## 6. 관련 문서

| 문서 | 도메인 | 관계 |
|------|--------|------|
| [color-science.md](./color-science.md) | PC | 퍼스널컬러 분석 |
| [skin-physiology.md](./skin-physiology.md) | S | 피부 분석 |
| [body-mechanics.md](./body-mechanics.md) | C | 체형 분석 |
| [exercise-physiology.md](./exercise-physiology.md) | W | 운동/자세 분석 |
| [nutrition-science.md](./nutrition-science.md) | N | 영양 분석 |
| [skin-procedures.md](./skin-procedures.md) | P | 시술 추천 |
| [oral-health.md](./oral-health.md) | O | 구강 분석 |

---

## 7. 참고 자료

### 논문
- Kim, J. et al. (2022). "Multi-modal Beauty Recommendation Systems"
- Zhang, L. (2021). "Cross-domain Knowledge Transfer in AI"

### 시스템 설계
- Netflix. (2019). "Personalization & Recommendation"
- Spotify. (2020). "Multi-signal Recommendations"

---

## 8. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-011](../adr/ADR-011-cross-module-data-flow.md) | 크로스 모듈 데이터 플로우 | 모듈 간 데이터 연계 |
| [ADR-027](../adr/ADR-027-coach-ai-streaming.md) | AI 코치 스트리밍 | 컨텍스트 주입, 다중 분석 통합 |

---

**Version**: 1.0 | **Created**: 2026-01-18
**관련 모듈**: COMBO-*, CAPSULE-MULTI-DOMAIN
