# 개인화 엔진 원리 (Personalization Engine)

> 이 문서는 Smart Combination Engine의 기반이 되는 개인화 원리를 설명한다.
>
> **소스 리서치**: [RECOMMENDATION-ENGINE-RESEARCH.md](../research/claude-ai-research/RECOMMENDATION-ENGINE-RESEARCH.md) (v2.0)
> **관련 원리**: [cross-domain-synergy.md](./cross-domain-synergy.md)
>
> **핵심 인용**: Netflix Foundation Model (2025), Deezer Semi-personalized Bandits, Apple Two-Layer Bandit

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"Level 5 선제적 개인화 시스템"

- Level 5 개인화: 미래 필요 예측 기반 선제적 추천
- 7.8억 조합 처리: 계층적 필터링으로 실시간 최적 조합 도출
- 콜드 스타트 해결: 신규 사용자도 의미 있는 추천 제공
- 탐색-활용 균형: Multi-Armed Bandit으로 최적 추천 학습
- 실시간 맥락 반영: 시간, 날씨, 이벤트 등 맥락 반영
- 설명 가능 추천: "왜 이 제품인지" 근거 제공
- 피드백 루프: 사용자 반응 기반 지속 개선
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **데이터 희소성** | 신규 사용자/아이템 데이터 부족 |
| **조합 폭발** | 7개 도메인 조합 시 7.8억 경우의 수 |
| **실시간 연산** | 모든 조합 실시간 평가 불가 |
| **선호도 변화** | 사용자 선호는 시간에 따라 변화 |
| **프라이버시** | 과도한 개인화는 프라이버시 침해 우려 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **개인화 수준** | Level 4+ (맥락 인식 기반) |
| **추천 정확도** | Precision@10 > 0.3 |
| **콜드 스타트** | 신규 사용자 3분 이내 의미 있는 추천 |
| **응답 시간** | 추천 API < 500ms (p95) |
| **피드백 반영** | 클릭/구매 24시간 이내 모델 반영 |
| **설명 가능성** | 모든 추천에 1줄 이상 근거 |
| **사용자 만족도** | 추천 만족도 4.0/5.0 이상 |

### 현재 목표

**60%** - MVP 개인화 엔진

- ✅ 5단계 개인화 수준 정의
- ✅ 조합 폭발 해결 원리 (계층적 필터링)
- ✅ 콜드 스타트 전략 설계
- ✅ Multi-Armed Bandit 이론 이해
- ⏳ 계층적 필터링 구현 (50%)
- ⏳ 콜드 스타트 처리 (40%)
- ⏳ 피드백 루프 구축 (30%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Level 5 선제적 예측 | 충분한 이력 데이터 필요 | Phase 5 |
| 실시간 맥락 반영 | 외부 API 의존성 | Phase 3 |
| ML 기반 개인화 | 데이터 축적 후 | Phase 4 |
| A/B 테스트 자동화 | 인프라 구축 필요 | Phase 3 |

---

## 1. 핵심 개념

### 1.1 개인화(Personalization)란?

사용자의 특성, 행동, 맥락을 이해하여 **각 개인에게 최적화된 경험**을 제공하는 것.

```
개인화 수준 = f(프로필 깊이, 행동 데이터, 맥락 이해)

Level 0: 동일 추천 (비개인화)
Level 1: 세그먼트 기반 (건성 피부 그룹)
Level 2: 개인 프로필 기반 (내 피부 타입 + 고민)
Level 3: 행동 학습 기반 (클릭, 구매 패턴)
Level 4: 맥락 인식 기반 (시간, 날씨, 이벤트)
Level 5: 선제적 예측 (미래 필요 예측)
```

### 1.2 조합 복잡도

이룸의 7개 도메인 조합:

| 도메인 | 변수 | 경우의 수 |
|--------|------|----------|
| PC (퍼스널컬러) | 4 × 3 | 12 |
| S (피부) | 5 × 8 | 40 |
| C (체형) | 3 × 5 | 15 |
| W (자세) | 6 × 3 | 18 |
| N (영양) | 10 × 4 | 40 |
| P (시술) | 20 × 5 | 100 |
| O (구강) | 5 × 3 | 15 |

**이론적 조합**: 12 × 40 × 15 × 18 × 40 × 100 × 15 ≈ **7.8억**

### 1.3 조합 폭발 해결 원리

#### 계층적 필터링 (Hierarchical Filtering)

```
7.8억 조합
    │
    ▼ (1단계: 주요 도메인만)
10,000 조합 (PC × S × C)
    │
    ▼ (2단계: 시너지 Top 3)
30 조합
    │
    ▼ (3단계: 추천 Top 3/조합)
9 후보
    │
    ▼ (4단계: 충돌 해결 + 중복 제거)
3 최종 추천
```

#### N×M 시너지 매트릭스

도메인 쌍별 시너지 점수를 미리 계산:

```
         PC    S     C     W     N     P     O
PC       -    90    70    40    60    85    50
S       90     -    50    30    95    98    40
C       70    50     -    95    70    60    30
W       40    30    95     -    60    50    20
N       60    95    70    60     -    80    75
P       85    98    60    50    80     -    60
O       50    40    30    20    75    60     -
```

---

## 2. 수학적 기반

### 2.1 시너지 점수 계산

```
시너지(A, B) = 기본점수(A,B) × 프로필적합도(user) × 맥락보정(context)

기본점수: 시너지 매트릭스에서 조회 (0-100)
프로필적합도: 사용자 프로필 완성도 (0-1)
맥락보정: 시간, 계절, 이벤트 반영 (0.8-1.2)
```

### 2.2 추천 점수 (Recommendation Score)

```typescript
// V1: 규칙 기반
function calculateRecommendationScore(
  item: Item,
  profile: UserProfile,
  synergies: Synergy[]
): number {
  // 1. 도메인 매칭 점수 (0-50)
  const domainScore = calculateDomainMatch(item, profile);

  // 2. 시너지 보너스 (0-30)
  const synergyBonus = synergies
    .filter(s => s.relevantTo(item))
    .reduce((sum, s) => sum + s.score * 0.1, 0);

  // 3. 인기도 보정 (0-20)
  const popularityScore = calculatePopularity(item);

  return Math.min(100, domainScore + synergyBonus + popularityScore);
}
```

### 2.3 Contextual Bandit 공식 (V2)

UCB (Upper Confidence Bound) 알고리즘:

```
선택점수(arm, t) = 기대보상(arm) + c × √(ln(t) / N(arm))

기대보상: 해당 arm의 평균 보상
c: 탐색 계수 (보통 √2)
t: 총 시행 횟수
N(arm): 해당 arm 시행 횟수
```

```typescript
function ucbSelect(arms: Arm[], totalTrials: number): Arm {
  const c = Math.sqrt(2);

  const scores = arms.map(arm => {
    if (arm.trials === 0) return Infinity; // 미시도 arm 우선

    const exploitation = arm.totalReward / arm.trials;
    const exploration = c * Math.sqrt(Math.log(totalTrials) / arm.trials);

    return exploitation + exploration;
  });

  return arms[argmax(scores)];
}
```

#### 프로덕션 검증 사례 (2025)

| 회사 | 전략 | 결과 | 출처 |
|------|------|------|------|
| **Deezer** | Semi-personalized Bandits | 100개 클러스터로 분리 → 전체 개인화보다 효과적 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Apple** | Two-Layer Bandit | 사용자 참여 **2배 이상 증가** | [Apple ML](https://machinelearning.apple.com/research/two-layer-bandit) |
| **Spotify** | ε-greedy | 100개 관련 아이템 사전 필터링 후 탐색 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Twitter** | Warm-start | 500 epoch 사전 학습이 100 epoch보다 효과적 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |

> **이룸 V2 권장**: Deezer 사례 참고하여 **Semi-personalized Bandit** 채택
> - 사용자를 피부타입×퍼스널컬러 조합으로 ~100개 클러스터 구성
> - 클러스터별 별도 Bandit 학습 → 피드백 효율 극대화
> - 전체 개인화보다 적은 데이터로 빠른 수렴

### 2.4 설명 우선순위 점수

```
설명가치(reason) = 영향력(reason) × 신뢰도(reason) × 명확성(reason)

영향력: 추천 결정에 미친 영향 (0-1)
신뢰도: 과학적/전문적 근거 (0-1)
명확성: 사용자 이해 용이성 (0-1)
```

---

## 3. 구현 도출

### 3.1 V1: 3-3-3 Rule Engine

```typescript
/**
 * 3-3-3 규칙 엔진
 *
 * 1. Top 3 시너지 조합 선택
 * 2. 각 조합에서 Top 3 추천 생성
 * 3. 최종 Top 3 선별 (중복 제거, 충돌 해결)
 */
interface RuleEngine {
  // 단계 1: 시너지 조합 선택
  selectTopSynergies(
    profile: UserProfile,
    matrix: SynergyMatrix
  ): Synergy[];

  // 단계 2: 조합별 추천 생성
  generateRecommendations(
    synergy: Synergy,
    profile: UserProfile,
    items: Item[]
  ): Recommendation[];

  // 단계 3: 최종 선별
  finalizeRecommendations(
    candidates: Recommendation[],
    constraints: Constraint[]
  ): Recommendation[];
}
```

#### 3-3-3 알고리즘

```typescript
async function recommend333(
  profile: UserProfile,
  items: Item[]
): Promise<Recommendation[]> {
  // 1. 사용자 도메인 분석 결과 조회
  const domains = await getUserDomains(profile.userId);

  // 2. Top 3 시너지 조합 계산
  const synergies = calculateTopSynergies(domains, SYNERGY_MATRIX, 3);

  // 3. 각 시너지별 Top 3 추천
  const candidates: Recommendation[] = [];

  for (const synergy of synergies) {
    const recs = items
      .map(item => ({
        item,
        score: calculateRecommendationScore(item, profile, [synergy]),
        synergy,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    candidates.push(...recs);
  }

  // 4. 충돌 해결 및 최종 Top 3
  const resolved = resolveConflicts(candidates);
  const deduplicated = removeDuplicates(resolved);
  const final = deduplicated.slice(0, 3);

  // 5. 설명 생성
  return final.map(rec => ({
    ...rec,
    explanation: generateExplanation(rec, profile),
  }));
}
```

### 3.2 V2: Learning Engine

```typescript
interface LearningEngine extends RuleEngine {
  // 피드백 수집
  collectFeedback(
    recommendationId: string,
    action: FeedbackAction,
    context: FeedbackContext
  ): void;

  // Bandit 업데이트
  updateBandit(
    arm: RecommendationArm,
    reward: number
  ): void;

  // 동적 가중치 조정
  adjustWeights(
    segment: UserSegment,
    metrics: PerformanceMetrics
  ): void;
}

// 피드백 기반 보상 계산
function calculateReward(action: FeedbackAction): number {
  const rewards: Record<FeedbackAction, number> = {
    view: 0.1,
    click: 0.3,
    like: 0.5,
    purchase: 1.0,
    return: -0.5,
    dislike: -0.3,
  };

  return rewards[action] ?? 0;
}
```

### 3.3 V3: AI Concierge Engine

> **Netflix Foundation Model (2025) 인사이트**: 수백 개의 특화 모델을 단일 Foundation Model로 통합.
> Transformer 기반 Sparse Attention, Multi-Token Prediction으로 "단기 행동이 아닌 장기 의도" 학습.
> — [Netflix Tech Blog](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39)

```typescript
interface ConciergeEngine extends LearningEngine {
  // 딥 프로필 (Netflix 참고: 장기 의도 학습)
  deepProfile: {
    analyses: AllAnalysisResults;
    behaviors: BehaviorLog[];
    preferences: LearnedPreferences;
    history: RecommendationHistory[];
    context: CurrentContext;
  };

  // LLM 기반 추론
  async reason(
    query: string,
    profile: DeepProfile
  ): Promise<ReasoningResult>;

  // 선제적 추천 (맥락 이해)
  async predictNeeds(
    profile: DeepProfile,
    calendar: CalendarEvent[]
  ): Promise<ProactiveRecommendation[]>;

  // 자연어 설명 생성
  async generateNaturalExplanation(
    recommendation: Recommendation,
    profile: DeepProfile
  ): Promise<string>;
}
```

#### V3 장기 진화 방향 (Netflix 사례 참고)

- **Embedding Store**: V2부터 임베딩 버전 관리로 호환성 확보
- **Foundation Model**: 모듈별 특화 모델 → 단일 통합 모델 (1년 후 고려)
- **Multi-Token Prediction**: "다음 상호작용"이 아닌 "다음 n개 상호작용" 예측

---

## 4. 충돌 해결 원리

### 4.1 우선순위 계층

```typescript
const PRIORITY_HIERARCHY = {
  health_safety: 100,      // 건강/안전 (절대 우선)
  medical_warning: 90,     // 의료 경고
  domain_expertise: 80,    // 도메인 전문성
  user_preference: 70,     // 사용자 선호
  general: 50,             // 일반
};
```

### 4.2 충돌 유형 및 해결

| 충돌 유형 | 예시 | 해결 규칙 |
|----------|------|----------|
| **성분 충돌** | 레티놀 + AHA | 건강 우선 → 분리 사용 권장 |
| **목표 충돌** | 체중 감량 vs 근육 증가 | 사용자 선택 요청 |
| **시간 충돌** | 아침 운동 vs 저녁 스킨케어 | 병렬 가능 → 둘 다 유지 |
| **예산 충돌** | 고가 제품 다수 | 예산 내 최적화 |

### 4.3 충돌 해결 알고리즘

```typescript
function resolveConflicts(
  recommendations: Recommendation[]
): Recommendation[] {
  const conflictGroups = findConflictGroups(recommendations);
  const resolved: Recommendation[] = [];

  for (const group of conflictGroups) {
    if (group.length === 1) {
      resolved.push(group[0]);
      continue;
    }

    // 우선순위로 정렬
    const sorted = group.sort(
      (a, b) => PRIORITY_HIERARCHY[b.priority] - PRIORITY_HIERARCHY[a.priority]
    );

    // 최고 우선순위 선택
    const winner = sorted[0];
    resolved.push(winner);

    // 충돌 로그 기록
    logConflictResolution({
      winner,
      losers: sorted.slice(1),
      reason: `Priority: ${winner.priority}`,
    });
  }

  return resolved;
}
```

---

## 5. 설명 생성 원리

### 5.0 XAI 효과성 (실증 데이터)

> **핵심 인사이트**: 설명 가능한 AI는 사용자 신뢰와 전환율을 유의미하게 높인다.

#### 신뢰도 연구 (2025)

| 지표 | XAI 적용 | 미적용 | 차이 | 출처 |
|------|---------|--------|------|------|
| 사용자 신뢰도 | **M=4.1** | M=3.2 | p<.001 | [SSRN 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189) |
| 투명성 인식 | **M=4.3** | M=2.9 | p<.001 | [SSRN 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189) |
| CTR 개선 | +7.8% | baseline | - | [MDPI 2025](https://www.mdpi.com/2504-2289/9/5/124) |
| 사용자 참여 | +8.3% | baseline | - | [MDPI 2025](https://www.mdpi.com/2504-2289/9/5/124) |

> "사용자가 AI가 생성한 정보를 신뢰하지 않으면 AI 투자는 낭비된다."
> — [McKinsey 2026](https://www.mckinsey.com/capabilities/quantumblack/our-insights/building-ai-trust-the-key-role-of-explainability)

#### 메타 분석 결론 (90개 연구)

> 설명 가능성과 신뢰도 간 **통계적으로 유의하지만 중간 수준의 양의 상관관계**.
> 설명 가능성만으로는 부족하고, **윤리적 안전장치, 사용자 참여, 도메인 특화 고려**가 필요.
> — [arXiv 2025](https://arxiv.org/pdf/2504.12529)

### 5.1 설명 구조

```typescript
interface Explanation {
  primary: string;      // 주요 이유 (1문장)
  supporting: string[]; // 부가 이유 (2-3개)
  confidence: number;   // 신뢰도 (0-1)
  source: ExplanationSource;
}

type ExplanationSource =
  | 'profile_match'      // 프로필 매칭
  | 'synergy'            // 시너지 효과
  | 'similar_users'      // 유사 사용자
  | 'expert'             // 전문가 의견
  | 'ai_reasoning';      // AI 추론
```

### 5.2 템플릿 기반 (V1)

```typescript
const EXPLANATION_TEMPLATES = {
  skinType: {
    pattern: '{skinType} 피부에 적합한 {benefit}',
    examples: [
      '건성 피부에 적합한 고보습 성분',
      '지성 피부에 적합한 유분 조절',
    ],
  },
  synergy: {
    pattern: '{domain1}과 {domain2}의 시너지로 {effect}',
    examples: [
      '피부와 영양의 시너지로 안쪽부터 수분 공급',
    ],
  },
  season: {
    pattern: '{season} 타입에 어울리는 {recommendation}',
    examples: [
      '봄 웜톤에 어울리는 코랄 립 컬러',
    ],
  },
};

function generateTemplateExplanation(
  rec: Recommendation,
  profile: UserProfile
): string {
  const template = selectBestTemplate(rec, profile);
  return fillTemplate(template, { rec, profile });
}
```

### 5.3 LLM 기반 (V3)

```typescript
async function generateLLMExplanation(
  rec: Recommendation,
  profile: DeepProfile
): Promise<string> {
  const prompt = `
당신은 뷰티/웰니스 전문 컨설턴트입니다.

사용자 프로필:
- 피부: ${profile.analyses.skin?.skinType}, 고민: ${profile.analyses.skin?.concerns?.join(', ')}
- 퍼스널컬러: ${profile.analyses.personalColor?.season}
- 체형: ${profile.analyses.body?.type}

추천 제품: ${rec.item.name}
매칭 이유: ${JSON.stringify(rec.matchReasons)}

위 정보를 바탕으로, 왜 이 제품이 사용자에게 적합한지
따뜻하고 전문적인 톤으로 2문장으로 설명해주세요.
이모지는 사용하지 마세요.
`;

  const response = await gemini.generateContent(prompt);
  return response.text;
}
```

---

## 6. 검증 방법

### 6.1 정확도 검증

| 지표 | V1 목표 | V2 목표 | V3 목표 |
|------|--------|--------|--------|
| 추천 클릭률 (CTR) | > 15% | > 20% | > 30% |
| 추천 관련성 (설문) | > 70% | > 80% | > 90% |
| 구매 전환율 | > 3% | > 5% | > 8% |

### 6.2 테스트 케이스

```typescript
describe('RecommendationEngine', () => {
  describe('V1: 3-3-3 Rule Engine', () => {
    it('should return exactly 3 recommendations', async () => {
      const result = await recommend333(testProfile, testItems);
      expect(result).toHaveLength(3);
    });

    it('should prioritize high-synergy combinations', async () => {
      const profile = createProfile({ skinType: 'dry' });
      const result = await recommend333(profile, testItems);

      // S×N (95) 또는 S×P (98) 시너지 포함 확인
      const hasSkinSynergy = result.some(
        r => r.synergy.domains.includes('S')
      );
      expect(hasSkinSynergy).toBe(true);
    });

    it('should resolve conflicts by priority', async () => {
      const conflicting = [
        createRec({ priority: 'health_safety', item: itemA }),
        createRec({ priority: 'user_preference', item: itemB, conflictsWith: [itemA.id] }),
      ];

      const resolved = resolveConflicts(conflicting);

      expect(resolved).toHaveLength(1);
      expect(resolved[0].item.id).toBe(itemA.id);
    });
  });

  describe('V2: Learning Engine', () => {
    it('should update arm rewards on feedback', () => {
      const engine = new LearningEngine();
      const arm = engine.getArm('rec_123');

      engine.collectFeedback('rec_123', 'purchase', {});

      expect(arm.totalReward).toBeGreaterThan(0);
      expect(arm.trials).toBe(1);
    });

    it('should explore new items with UCB', () => {
      const engine = new LearningEngine();

      // 모든 arm에 시행 기록 없으면 무작위 선택
      const arms = [
        { id: 'a', trials: 0, totalReward: 0 },
        { id: 'b', trials: 0, totalReward: 0 },
      ];

      const selected = engine.ucbSelect(arms, 0);
      expect(['a', 'b']).toContain(selected.id);
    });
  });
});
```

### 6.3 원리 준수 검증

원리 문서와 구현 간 일관성을 보장하기 위한 검증 방법:

| 원리 | 검증 방법 | 테스트 케이스 |
|------|----------|--------------|
| **3-3-3 Rule** | 추천 개수 제한 확인 | `expect(result.recommendations.length).toBeLessThanOrEqual(3)` |
| **시너지 매트릭스 대칭성** | 대각선 0, A↔B 대칭 | `expect(SYNERGY_MATRIX[a][b]).toBe(SYNERGY_MATRIX[b][a])` |
| **충돌 우선순위** | health_safety > user_preference | `expect(winner.priority).toBe('health_safety')` |
| **점수 범위** | 0-100 내 유지 | `expect(score).toBeGreaterThanOrEqual(0).toBeLessThanOrEqual(100)` |

```typescript
// 원리 준수 검증 테스트
describe('Principle Compliance', () => {
  describe('Synergy Matrix Invariants', () => {
    it('should have symmetric values (A→B = B→A)', () => {
      const domains: Domain[] = ['PC', 'S', 'C', 'W', 'N', 'P', 'O'];

      for (const d1 of domains) {
        for (const d2 of domains) {
          expect(SYNERGY_MATRIX[d1][d2]).toBe(SYNERGY_MATRIX[d2][d1]);
        }
      }
    });

    it('should have zero diagonal (self-synergy)', () => {
      const domains: Domain[] = ['PC', 'S', 'C', 'W', 'N', 'P', 'O'];

      for (const d of domains) {
        expect(SYNERGY_MATRIX[d][d]).toBe(0);
      }
    });

    it('should have values between 0 and 100', () => {
      const domains: Domain[] = ['PC', 'S', 'C', 'W', 'N', 'P', 'O'];

      for (const d1 of domains) {
        for (const d2 of domains) {
          expect(SYNERGY_MATRIX[d1][d2]).toBeGreaterThanOrEqual(0);
          expect(SYNERGY_MATRIX[d1][d2]).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe('Priority Hierarchy Invariants', () => {
    it('should always prioritize health_safety', () => {
      const priorities = Object.entries(PRIORITY_HIERARCHY);

      const healthPriority = PRIORITY_HIERARCHY.health_safety;
      for (const [key, value] of priorities) {
        if (key !== 'health_safety') {
          expect(value).toBeLessThan(healthPriority);
        }
      }
    });
  });

  describe('3-3-3 Rule Invariants', () => {
    it('should never exceed 3 final recommendations', async () => {
      const largeItemSet = Array(100).fill(null).map(() => createItem());
      const input = createEngineInput({ items: largeItemSet, limit: 3 });

      const result = await recommend(input);

      expect(result.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should use at most 3 synergy combinations', async () => {
      const input = createEngineInput({});

      const result = await recommend(input);

      expect(result.usedSynergies.length).toBeLessThanOrEqual(3);
    });
  });
});
```

### 6.4 수학적 검증

#### 점수 계산 검증

```typescript
describe('Score Calculation Verification', () => {
  it('should correctly apply synergy formula', () => {
    // 시너지(A, B) = 기본점수(A,B) × 프로필적합도(user) × 맥락보정(context)
    const baseScore = SYNERGY_MATRIX['S']['N'];  // 95
    const profileCompleteness = 0.8;
    const contextMultiplier = 1.1;

    const expected = baseScore * profileCompleteness * contextMultiplier;
    const actual = calculateSynergyScore('S', 'N', testProfile, testContext);

    expect(actual).toBeCloseTo(expected, 2);
  });

  it('should correctly weight domain vs synergy vs popularity', () => {
    // totalScore = domainScore(0-50) + synergyBonus(0-30) + popularityScore(0-20)
    const domainScore = 45;
    const synergyBonus = 25;
    const popularityScore = 15;

    const expected = 85;
    const actual = domainScore + synergyBonus + popularityScore;

    expect(actual).toBe(expected);
    expect(actual).toBeLessThanOrEqual(100);
  });

  it('should cap individual score components', () => {
    const item = createItem({
      suitableSkinTypes: ['dry', 'normal', 'sensitive'],  // 완벽 매치
      targetConcerns: ['dehydration', 'wrinkles', 'dullness', 'pores'],
      popularity: 'high',
      rating: 5.0,
      reviewCount: 10000,
    });

    const result = calculateDomainScore({ item, profile: testProfile });

    // 각 컴포넌트는 최대값을 초과할 수 없음
    expect(result.breakdown.skinMatch).toBeLessThanOrEqual(30);
    expect(result.breakdown.concernMatch).toBeLessThanOrEqual(30);
    expect(result.total).toBeLessThanOrEqual(50);
  });
});
```

### 6.5 품질 게이트 (Quality Gates)

구현 전 체크리스트:

| Gate | 검증 항목 | 통과 기준 |
|------|----------|----------|
| **G1** | 시너지 매트릭스 대칭성 | 모든 쌍 대칭 |
| **G2** | 충돌 규칙 완전성 | 모든 성분 충돌 정의 |
| **G3** | 점수 범위 | 0-100 내 |
| **G4** | 3-3-3 제한 | 위반 0건 |
| **G5** | 설명 템플릿 커버리지 | 모든 카테고리 포함 |
| **G6** | Cold Start 처리 | 신규 사용자 추천 반환 |
| **G7** | 에러 복구 | 빈 결과라도 반환 |

```typescript
// CI/CD 품질 게이트
describe('Quality Gates', () => {
  it('G1: Synergy matrix is symmetric', () => { /* ... */ });
  it('G2: All ingredient conflicts are defined', () => { /* ... */ });
  it('G3: All scores are within 0-100 range', () => { /* ... */ });
  it('G4: 3-3-3 rule is never violated', () => { /* ... */ });
  it('G5: Explanation templates cover all categories', () => { /* ... */ });
  it('G6: Cold start returns recommendations', () => { /* ... */ });
  it('G7: Error recovery returns empty result', () => { /* ... */ });
});
```

---

## 7. V1/V2/V3 진화 경로

### 7.1 데이터 요구사항

| 버전 | 필수 데이터 | 수집 기간 |
|------|------------|----------|
| V1 | 프로필, 시너지 매트릭스 | 즉시 |
| V2 | V1 + 피드백 로그 1000+ | 1-3개월 |
| V3 | V2 + 행동 시퀀스 10000+ | 6-12개월 |

### 7.2 기능 진화

```
V1 (규칙)                V2 (학습)                V3 (AI)
───────────────────────────────────────────────────────────
고정 가중치         →   동적 가중치          →   실시간 조정
템플릿 설명         →   템플릿 + 유사 사용자  →   자연어 생성
요청 시 추천        →   푸시 알림            →   선제적 추천
프로필 기반         →   프로필 + 행동        →   멀티모달 이해
```

---

## 8. Cold Start 해결 전략

### 8.1 Cold Start 유형

| 유형 | 문제 | 이룸 해당 상황 |
|------|------|---------------|
| **User Cold Start** | 새 사용자 선호 알 수 없음 | 신규 가입 |
| **Item Cold Start** | 새 아이템 평가 데이터 없음 | 새 제품 등록 |

### 8.2 해결 전략 (2025 연구)

| 전략 | 방법 | 출처 |
|------|------|------|
| **Hybrid Approach** | CF + Content-Based 결합 | [Wikipedia](https://en.wikipedia.org/wiki/Cold_start_(recommender_systems)) |
| **Active Learning** | 결정 트리 기반 선택적 평가 요청 | [Nature 2025](https://www.nature.com/articles/s41598-025-09708-2) |
| **Social Login** | 소셜 미디어 프로필 연동 | 산업 관행 |

> "간단하고 설명 가능한 휴리스틱으로 시작하라. '당신 지역에서 가장 인기 있는'이라는 추천도 유효하고 종종 효과적인 cold-start 전략이다. 데이터가 쌓이면 복잡성을 추가하라."
> — [Medium 2025](https://medium.com/@khayyam.h/the-cold-start-problem-my-hybrid-approach-to-starting-from-zero-8beadd4135f0)

### 8.3 이룸 V1 Cold Start 전략

```typescript
// 신규 사용자 판별
function isNewUser(user: User): boolean {
  return user.analysisCount < 2 && user.feedbackCount < 5;
}

// Cold Start 추천
function getColdStartRecommendations(user: User): Recommendation[] {
  // 1. 온보딩 설문 기반 (피부타입, 관심사)
  if (user.onboardingAnswers) {
    return getOnboardingBasedRecommendations(user.onboardingAnswers);
  }

  // 2. 인기 제품 추천 (Fallback)
  return getPopularRecommendations({
    category: user.preferredCategory,
    limit: 3,
  });
}

// Warm ↔ Cold 자동 전환
function getRecommendations(user: User): Recommendation[] {
  if (isNewUser(user)) {
    return getColdStartRecommendations(user);
  }
  return getPersonalizedRecommendations(user);  // V1 3-3-3 Rule
}
```

---

## 9. 관련 문서

### 원리 문서
- [cross-domain-synergy.md](./cross-domain-synergy.md) - N×M 시너지 매트릭스
- [coaching-psychology.md](./coaching-psychology.md) - TTM 기반 코칭

### ADR
- [ADR-032: Smart Matching](../adr/ADR-032-smart-matching.md) - Phase J 매칭
- [ADR-036: Smart Combination Engine](../adr/ADR-036-smart-combination-engine.md) - V1/V2/V3

### 스펙
- [SDD-SMART-COMBINATION-ENGINE](../specs/SDD-SMART-COMBINATION-ENGINE.md)

### 리서치
- [RECOMMENDATION-ENGINE-RESEARCH.md](../research/claude-ai-research/RECOMMENDATION-ENGINE-RESEARCH.md)

---

## 10. 참고 자료

### 논문 및 학술 자료 (2024-2026)

| 주제 | 출처 | URL |
|------|------|-----|
| XAI와 신뢰도 관계 (n=450) | SSRN 2025 | [Link](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189) |
| XAI 메타 분석 (90개 연구) | arXiv 2025 | [Link](https://arxiv.org/pdf/2504.12529) |
| 적응형 학습 모듈 (CTR +7.8%) | MDPI 2025 | [Link](https://www.mdpi.com/2504-2289/9/5/124) |
| FIT (Two-Tower 개선) | ACM SIGIR 2025 | [Link](https://dl.acm.org/doi/10.1145/3726302.3729881) |
| Multi-objective Bandits | Nature 2025 | [Link](https://www.nature.com/articles/s41598-025-89920-2) |
| Cold Start Hybrid 접근 | Frontiers 2024 | [Link](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2024.1404391/full) |

### 산업 Tech Blog

| 회사 | 주제 | URL |
|------|------|-----|
| **Netflix** | Foundation Model for Personalization | [Tech Blog](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39) |
| **Apple** | Two-Layer Bandit Optimization | [ML Research](https://machinelearning.apple.com/research/two-layer-bandit) |
| **Meta** | Instagram Explore 스케일링 | [Engineering](https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/) |
| **McKinsey** | AI 신뢰와 설명 가능성 | [Insights](https://www.mckinsey.com/capabilities/quantumblack/our-insights/building-ai-trust-the-key-role-of-explainability) |

### 기술 블로그

| 저자 | 주제 | URL |
|------|------|-----|
| Eugene Yan | Bandits 실전 사례 (Spotify, Deezer, Twitter) | [Blog](https://eugeneyan.com/writing/bandits/) |
| Shaped | Two-Tower 딥다이브 | [Blog](https://www.shaped.ai/blog/the-two-tower-model-for-recommendation-systems-a-deep-dive) |

### 클래식 논문

- Covington, P. et al. (2016). "Deep Neural Networks for YouTube Recommendations"
- Li, L. et al. (2010). "A Contextual-Bandit Approach to Personalized News Article Recommendation"

---

**Version**: 2.1 | **Created**: 2026-01-22 | **Updated**: 2026-01-22
**변경 이력**: v2.1 - 검증 방법 상세화 (6.3 원리 준수 검증, 6.4 수학적 검증, 6.5 품질 게이트 추가) | v2.0 - 웹 리서치 기반 업데이트 (XAI 실증 데이터, 업계 사례, Cold Start, 실제 출처)
**소스 리서치**: [RECOMMENDATION-ENGINE-RESEARCH.md](../research/claude-ai-research/RECOMMENDATION-ENGINE-RESEARCH.md) v2.0
**관련 모듈**: Smart Combination Engine V1/V2/V3
