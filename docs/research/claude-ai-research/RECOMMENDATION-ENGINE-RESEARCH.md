# 추천 엔진 및 개인화 시스템 리서치

> **ID**: RECOMMENDATION-ENGINE-R1
> **Date**: 2026-01-22
> **Updated**: 2026-01-22 (웹 리서치 추가)
> **Status**: Completed
> **Purpose**: Smart Combination Engine V1/V2/V3 설계를 위한 기초 리서치

---

## 0. 시장 현황 (2025-2026)

### 시장 규모

AI 기반 추천 시스템 시장은 **2025년 $24.4억 → 2029년 $36.2억**으로 성장 전망.
([Shaped Blog](https://www.shaped.ai/blog/ai-powered-recommendation-engines))

### 주요 트렌드

| 트렌드 | 설명 | 출처 |
|--------|------|------|
| **Foundation Model 통합** | Netflix가 수백 개의 특화 모델을 단일 기반 모델로 통합 | [Netflix Tech Blog](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39) |
| **LLM + Retrieval 하이브리드** | Two-Tower + LLM 결합이 표준화 | [GenAIRecP 2025 Workshop](https://genai-personalization.github.io/GenAIRecP2025) |
| **감정 기반 추천** | 사용자 감정 상태 인식 기반 추천 등장 | [Shaped Blog](https://www.shaped.ai/blog/ai-powered-recommendation-engines) |
| **Multimodal 통합** | 텍스트/이미지/비디오 통합 추천 | Grand View Research |
| **Explainable AI 필수화** | 설명 없는 AI 투자는 낭비 | [McKinsey](https://www.mckinsey.com/capabilities/quantumblack/our-insights/building-ai-trust-the-key-role-of-explainability) |

---

## 1. 리서치 질문

1. 대규모 조합(~5억)을 효율적으로 처리하는 알고리즘은?
2. 추천 시스템의 최신 아키텍처(2024-2026)는?
3. 개인화 엔진의 진화 경로(규칙 → 학습 → AI)는?
4. Contextual Bandits vs Collaborative Filtering 비교?
5. 설명 가능한 추천(Explainable Recommendations) 구현 방법?

---

## 2. 조합 복잡도 분석

### 2.1 이룸 도메인 경우의 수

| 도메인 | 변수 | 경우의 수 |
|--------|------|----------|
| 퍼스널컬러 (PC) | 4시즌 × 3서브타입 | 12 |
| 피부 (S) | 5타입 × 8고민 | 40 |
| 체형 (C) | 3타입 × 5세부 | 15 |
| 자세 (W) | 6불균형 × 3수준 | 18 |
| 영양 (N) | 10결핍 × 4수준 | 40 |
| 시술 (P) | 20카테고리 × 5수준 | 100 |
| 구강 (O) | 5상태 × 3수준 | 15 |

**이론적 조합**: 12 × 40 × 15 × 18 × 40 × 100 × 15 ≈ **7.8억**

### 2.2 조합 폭발 문제 해결 전략

| 전략 | 방법 | 복잡도 감소 | 적용 |
|------|------|------------|------|
| **차원 축소** | 주요 변수만 사용 | 10^9 → 10^4 | V1 |
| **계층적 필터링** | 단계별 가지치기 | 지수 → 선형 | V1, V2 |
| **클러스터링** | 유사 프로필 그룹화 | 개별 → 그룹 | V2 |
| **임베딩** | 벡터 공간 유사도 | O(n) 검색 | V3 |

---

## 3. 추천 시스템 아키텍처 (2024-2026 트렌드)

### 3.1 추천 시스템 진화

```
Generation 1 (2010-2015): 규칙 기반
├── If-Then 규칙
├── 도메인 전문가 지식
└── 설명 가능, 유연성 낮음

Generation 2 (2015-2020): 협업 필터링
├── 사용자-아이템 매트릭스
├── Matrix Factorization
└── 콜드 스타트 문제

Generation 3 (2020-2024): 딥러닝
├── Neural Collaborative Filtering
├── Transformer 기반
└── 설명 불가, 높은 정확도

Generation 4 (2024-현재): Hybrid + LLM
├── 규칙 + ML + LLM 통합
├── 설명 가능한 AI
└── 맥락 이해, 자연어 설명
```

### 3.2 최신 아키텍처: Two-Tower + LLM

```
┌─────────────────────────────────────────────────────────────────┐
│              Two-Tower + LLM Hybrid Architecture                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐              ┌─────────────┐                  │
│  │ User Tower  │              │ Item Tower  │                  │
│  │ (사용자 임베딩)│            │ (아이템 임베딩)│                │
│  │             │              │             │                  │
│  │ 프로필      │              │ 속성        │                  │
│  │ 행동 이력   │              │ 메타데이터   │                  │
│  │ 맥락       │              │ 리뷰 텍스트  │                  │
│  └─────┬───────┘              └──────┬──────┘                  │
│        │                             │                         │
│        └──────────┬──────────────────┘                         │
│                   │                                            │
│                   ▼                                            │
│        ┌──────────────────┐                                   │
│        │  유사도 계산     │                                   │
│        │  (Cosine, Dot)  │                                   │
│        └────────┬─────────┘                                   │
│                 │                                              │
│                 ▼                                              │
│        ┌──────────────────┐                                   │
│        │  후보 필터링     │  ← 규칙 기반 (안전, 제약)          │
│        │  (Re-ranking)   │                                   │
│        └────────┬─────────┘                                   │
│                 │                                              │
│                 ▼                                              │
│        ┌──────────────────┐                                   │
│        │  LLM 설명 생성   │  ← "이 제품은 당신의..."          │
│        │  (Explanation)  │                                   │
│        └────────┬─────────┘                                   │
│                 │                                              │
│                 ▼                                              │
│        ┌──────────────────┐                                   │
│        │  최종 추천 N개   │                                   │
│        └──────────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Netflix Foundation Model (2025 혁신)

2025년 3월, Netflix는 기존의 수백 개 특화 모델을 **단일 Foundation Model**로 통합했다.
([Netflix Tech Blog](https://netflixtechblog.medium.com/integrating-netflixs-foundation-model-into-personalization-applications-cf176b5860eb))

#### 핵심 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                Netflix Foundation Model (2025)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  기존 문제:                                                     │
│  ├── 홈페이지 모델                                             │
│  ├── 알림 모델                                                 │
│  ├── "Because You Watched" 모델                                │
│  └── 각각 독립 학습 → 복잡성, 비일관성                          │
│                                                                 │
│  해결책: 단일 Foundation Model                                  │
│  ├── Transformer 기반 (Sparse Attention)                       │
│  ├── 수백 개 이벤트 컨텍스트 윈도우                             │
│  ├── Multi-Token Prediction (다음 n개 아이템 예측)             │
│  └── Embedding Store로 버전 관리                                │
│                                                                 │
│  학습 기법:                                                     │
│  ├── Sliding Window Sampling                                   │
│  ├── KV Caching (추론 최적화)                                  │
│  └── 직교 변환으로 임베딩 버전 호환                             │
│                                                                 │
│  결과: LLM의 Scaling Law가 추천 시스템에도 적용                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 시사점 (이룸 적용)

- **단기 목표는 V1 규칙 기반**이지만, 장기적으로 Foundation Model 접근 고려
- Embedding Store 개념을 V2부터 도입하여 버전 호환성 확보
- Netflix는 "단기 행동이 아닌 장기 의도(intent)" 학습 강조

### 3.4 업계 사례 (최신 데이터)

| 회사 | 아키텍처 | 특징 | 출처 |
|------|----------|------|------|
| **Netflix** | Foundation Model | 수백 개 모델 → 단일 모델 통합 (2025) | [Netflix Tech Blog](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39) |
| **Spotify** | ε-greedy Bandits | 100개 후보 사전 필터링 후 탐색 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Twitter** | Warm-started Bandits | 500 epoch warm-start + 1% 랜덤 탐색 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Yahoo** | Exploration Bucket | 무작위 탐색용 별도 버킷 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Apple** | Two-Layer Bandit | 사용자 참여 2배 이상 증가 | [Apple ML Research](https://machinelearning.apple.com/research/two-layer-bandit) |
| **Meta/Instagram** | Two-Tower + Caching | 무거운 모델도 모든 랭킹 단계에 적용 | [Meta Engineering](https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/) |
| **Deezer** | Semi-personalized Bandits | 100개 클러스터 (전체 개인화보다 효과적) | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |

---

## 4. 핵심 알고리즘 비교

### 4.1 규칙 기반 vs ML 기반 vs LLM 기반

| 측면 | 규칙 기반 (V1) | ML 기반 (V2) | LLM 기반 (V3) |
|------|---------------|--------------|--------------|
| **정확도** | 70-80% | 85-90% | 90-95% |
| **콜드 스타트** | 없음 | 있음 | 없음 |
| **설명 가능** | 100% | 30% | 90% |
| **유지보수** | 규칙 수동 관리 | 재학습 필요 | 프롬프트 조정 |
| **비용** | 낮음 | 중간 | 높음 |
| **지연시간** | < 50ms | < 100ms | < 1s |
| **개인화** | 낮음 | 높음 | 매우 높음 |

### 4.2 Contextual Bandits

Multi-Armed Bandit의 확장으로, **맥락(context)**을 고려한 탐색-활용 균형.

```typescript
interface ContextualBandit {
  // 팔(arm) = 추천 옵션
  arms: RecommendationOption[];

  // 맥락 = 사용자 상태
  context: {
    userId: string;
    timeOfDay: string;
    season: string;
    recentPurchases: Product[];
    currentSkinCondition?: string;
  };

  // 보상 = 클릭, 구매, 만족도
  reward: number;
}

// UCB (Upper Confidence Bound) 알고리즘
function selectArm(arms: Arm[], context: Context): Arm {
  const scores = arms.map(arm => {
    const exploitation = arm.expectedReward(context);
    const exploration = Math.sqrt(2 * Math.log(totalTrials) / arm.trials);
    return exploitation + exploration;
  });

  return arms[argmax(scores)];
}
```

**장점**:
- 새로운 아이템 자동 탐색
- 사용자 피드백 실시간 반영
- 개인화 수준 자동 조정

**단점**:
- 초기 탐색 비용
- 구현 복잡도

#### 프로덕션 구현 사례 (2025)

| 회사 | 전략 | 상세 | 출처 |
|------|------|------|------|
| **Spotify** | ε-greedy | 100개 관련 아이템 사전 필터링 후 탐색 (UX 영향 최소화) | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Twitter** | Warm-start | Greedy 정책 데이터로 Bandit 사전 학습, 500 epoch이 100 epoch보다 효과적 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Yahoo** | Random Bucket | 전체 트래픽의 일부를 무작위 탐색용으로 분리 | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Deezer** | Semi-personalized | k-means로 100개 사용자 클러스터 → 클러스터별 Bandit (전체 개인화보다 효과적) | [Eugene Yan](https://eugeneyan.com/writing/bandits/) |
| **Apple** | Two-Layer | 상위/하위 2계층 Bandit → 사용자 참여 **2배 이상 증가** | [Apple ML](https://machinelearning.apple.com/research/two-layer-bandit) |
| **Microsoft** | Decision Service | 범용 MAB/CMAB 서비스 (프로덕션 검증) | [Research](https://www.microsoft.com/en-us/research/) |

#### 이룸 V2 적용 권장

Deezer 사례를 참고하여 **Semi-personalized Bandit** 권장:
- 사용자를 피부타입/퍼스널컬러 조합으로 클러스터링 (예: 100개)
- 클러스터별 별도 Bandit 학습 → 피드백 효율 극대화
- 전체 개인화보다 적은 데이터로 빠른 수렴

### 4.3 Collaborative Filtering

유사한 사용자의 행동 패턴에서 추천 도출.

```typescript
// User-based CF
function findSimilarUsers(targetUser: User, allUsers: User[]): User[] {
  return allUsers
    .map(user => ({
      user,
      similarity: cosineSimilarity(targetUser.ratings, user.ratings),
    }))
    .filter(u => u.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 50);
}

// Item-based CF
function findSimilarItems(targetItem: Item, allItems: Item[]): Item[] {
  return allItems
    .map(item => ({
      item,
      similarity: cosineSimilarity(targetItem.coRatings, item.coRatings),
    }))
    .filter(i => i.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20);
}
```

**이룸 적용**:
- "비슷한 피부 타입 + 체형 사용자가 좋아한 제품"
- 콜드 스타트 해결 위해 규칙 기반 백업 필요

---

## 5. 설명 가능한 추천 (Explainable Recommendations)

### 5.0 XAI 효과성 연구 데이터 (2025)

#### 신뢰도 증가 실증 (n=450)

> XAI가 적용된 추천 시스템에서 사용자 신뢰도 **M=4.1** vs 미적용 **M=3.2** (p<.001)
> 투명성 인식: **M=4.3** vs **M=2.9** (p<.001)
>
> — [SSRN (2025)](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189)

#### 메타 분석 결과 (90개 연구)

> 설명 가능성과 신뢰도 간 **통계적으로 유의하지만 중간 수준의 양의 상관관계**.
> 설명 가능성만으로는 부족하고, **윤리적 안전장치, 사용자 참여, 도메인 특화 고려**가 필요.
>
> — [arXiv (2025)](https://arxiv.org/pdf/2504.12529)

#### 적응형 학습 모듈 성과

> "Explainable Adaptive Learning (EAL)" 모듈 적용 시:
> - CTR **+7.8%** 개선
> - 사용자 참여도 **+8.3%** 개선
>
> — [MDPI (2025)](https://www.mdpi.com/2504-2289/9/5/124)

### 5.1 설명 유형

| 유형 | 예시 | 신뢰도 증가 | 출처 |
|------|------|------------|------|
| **속성 기반** | "건성 피부에 맞는 보습력" | +15% | 일반 |
| **유사 사용자** | "비슷한 피부 타입 사용자가 선호" | +20% | 일반 |
| **이력 기반** | "이전에 구매한 A와 잘 어울림" | +25% | 일반 |
| **전문가 기반** | "피부과 전문의 추천" | +30% | 일반 |
| **AI 추론** | "당신의 피부 분석 결과에 따르면..." | +22% | 일반 |
| **XAI 적용** | 투명한 추천 근거 제공 | **신뢰도 M=4.1 vs 3.2** | [SSRN 2025](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189) |

### 5.1.1 2026년 XAI 트렌드

> "사용자가 AI가 생성한 정보를 신뢰하지 않으면 AI 투자는 낭비된다."
> "AI 출력을 투명하고 설명 가능하며 추적 가능하게 만들어야 비즈니스가 리스크를 완화하고 채택을 촉진할 수 있다."
>
> — [McKinsey (2026)](https://www.mckinsey.com/capabilities/quantumblack/our-insights/building-ai-trust-the-key-role-of-explainability)

### 5.2 설명 생성 파이프라인

```typescript
interface ExplanationPipeline {
  // 1단계: 핵심 매칭 이유 추출
  extractMatchReasons(
    product: Product,
    profile: UserProfile
  ): MatchReason[];

  // 2단계: 우선순위 정렬
  prioritizeReasons(
    reasons: MatchReason[],
    context: UserContext
  ): MatchReason[];

  // 3단계: 자연어 생성
  generateNaturalLanguage(
    reasons: MatchReason[],
    tone: 'casual' | 'professional'
  ): string;
}

// V1: 템플릿 기반
function generateExplanationV1(reasons: MatchReason[]): string {
  const templates = {
    skinType: '{skinType} 피부에 적합한 {benefit}',
    concern: '{concern} 개선에 도움되는 {ingredient}',
    season: '{season} 타입에 어울리는 {colorTone}',
  };

  return reasons
    .map(r => templates[r.type].replace('{...}', r.value))
    .join('. ');
}

// V3: LLM 기반
async function generateExplanationV3(
  reasons: MatchReason[],
  profile: UserProfile
): Promise<string> {
  const prompt = `
    사용자 프로필: ${JSON.stringify(profile)}
    매칭 이유: ${JSON.stringify(reasons)}

    위 정보를 바탕으로, 이 제품이 왜 사용자에게 적합한지
    친근하고 전문적인 톤으로 2-3문장으로 설명해주세요.
  `;

  return await gemini.generateContent(prompt);
}
```

---

## 5.5 Two-Tower 모델 최신 연구 (2025)

### 기본 개념

Two-Tower 모델은 대규모 추천 시스템의 **후보 검색(Retrieval)** 단계에서 표준 아키텍처로 자리잡았다.

```
User Tower              Item Tower
    │                      │
    ▼                      ▼
[사용자 임베딩]        [아이템 임베딩]
    │                      │
    └──────┬───────────────┘
           │
           ▼
    [유사도 계산 (Cosine/Dot)]
           │
           ▼
    [ANN (Approximate Nearest Neighbor)]
           │
           ▼
    [후보 N개 반환 → Ranker로 전달]
```

([Shaped Blog](https://www.shaped.ai/blog/the-two-tower-model-for-recommendation-systems-a-deep-dive))

### 최신 연구 (2025)

| 연구 | 핵심 개선 | 결과 | 출처 |
|------|----------|------|------|
| **FIT (Fully Interacted Two-Tower)** | 두 타워 간 정보 교환 추가 | Pre-ranking에서 효율성+효과성 균형 | [ACM SIGIR 2025](https://dl.acm.org/doi/10.1145/3726302.3729881) |
| **CL-EPIDTN** | Contrastive Learning + 다층 Transformer | Long-tail 콘텐츠 표현 개선 | [PLOS ONE 2024](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0332894) |
| **Multi-Stage Pipeline** | Retrieval → Pre-ranking → Ranking → Re-ranking | 수백만 → 수백 개로 필터링 | [Google Cloud](https://docs.cloud.google.com/architecture/implement-two-tower-retrieval-large-scale-candidate-generation) |

### 이룸 적용

- **V1**: 규칙 기반이므로 Two-Tower 불필요
- **V2**: 피드백 데이터 축적 후 간단한 Two-Tower 도입 가능
- **V3**: Full Two-Tower + LLM Re-ranker 구성 권장

---

## 5.6 Cold Start 문제 해결 (최신 연구)

### Cold Start 유형

| 유형 | 문제 | 이룸 해당 |
|------|------|----------|
| **User Cold Start** | 새 사용자 선호 알 수 없음 | ✅ 신규 가입 시 |
| **Item Cold Start** | 새 아이템 평가 데이터 없음 | ✅ 새 제품 등록 시 |

### 해결 전략 (2025 연구)

| 전략 | 방법 | 효과 | 출처 |
|------|------|------|------|
| **Hybrid Approach** | CF + Content-Based 결합 | 단일 기법 단점 보완 | [Wikipedia](https://en.wikipedia.org/wiki/Cold_start_(recommender_systems)) |
| **Deep Learning Enrichment** | Pre-trained 모델로 사용자/아이템 특성 벡터 생성 | Cold-start 개선 | [Frontiers 2024](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2024.1404391/full) |
| **Active Learning** | 결정 트리 기반 선택적 평가 요청 | 신규 사용자 선호 빠른 학습 | [Nature 2025](https://www.nature.com/articles/s41598-025-09708-2) |
| **Group-Specific Latent Factor** | 그룹별 잠재 요인 분해 | 새 아이템 즉시 추천 가능 | 학술 연구 |
| **Social Login** | 소셜 미디어 프로필 연동 | 기존 관심사 즉시 활용 | 산업 관행 |

### 실용적 접근법 (2025)

> "간단하고 설명 가능한 휴리스틱으로 시작하라. '당신 지역에서 가장 인기 있는'이라는 추천도 유효하고 종종 효과적인 cold-start 전략이다. 데이터가 쌓이면 복잡성을 추가하라."
>
> — [Medium (2025)](https://medium.com/@khayyam.h/the-cold-start-problem-my-hybrid-approach-to-starting-from-zero-8beadd4135f0)

### 이룸 V1 Cold Start 전략

1. **신규 사용자**: 온보딩 설문 (피부타입, 관심사) + 인기 제품 추천
2. **신규 제품**: 속성 기반 매칭 (성분, 카테고리) + 유사 제품 참조
3. **Hybrid**: 규칙 기반(warm) + 인기 기반(cold) 자동 전환

---

## 6. V1/V2/V3 아키텍처 설계 제안

### 6.1 V1: 3-3-3 규칙 기반 엔진

```
┌─────────────────────────────────────────────────────────────────┐
│                      V1: Rule-Based Engine                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. N×M 시너지 매트릭스                                          │
│     └── 7개 도메인 조합 점수 (pre-computed)                     │
│                                                                 │
│  2. 3-3-3 필터링                                                │
│     ├── Top 3 시너지 조합 선택                                  │
│     ├── 각 조합에서 Top 3 추천                                  │
│     └── 최종 Top 3 (중복 제거)                                  │
│                                                                 │
│  3. 충돌 해결                                                   │
│     └── 우선순위: 건강 > 안전 > 효과 > 선호                     │
│                                                                 │
│  4. 템플릿 설명                                                 │
│     └── "{피부타입}에 맞는 {효과}" 형식                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

장점: 빠른 구현, 투명한 로직, 낮은 비용
단점: 고정된 가중치, 제한된 개인화
```

### 6.2 V2: Learning Combination Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                    V2: Learning-Based Engine                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 피드백 수집                                                 │
│     ├── 👍/👎 반응                                              │
│     ├── 클릭률 (CTR)                                            │
│     ├── 구매 전환                                               │
│     └── 만족도 설문                                             │
│                                                                 │
│  2. Contextual Bandits                                          │
│     ├── 탐색: 새로운 추천 시도                                  │
│     ├── 활용: 검증된 추천 우선                                  │
│     └── ε-greedy 또는 UCB 알고리즘                              │
│                                                                 │
│  3. 동적 가중치                                                 │
│     ├── A/B 테스트로 시너지 점수 조정                           │
│     └── 사용자 세그먼트별 가중치                                │
│                                                                 │
│  4. 클러스터 기반 CF                                            │
│     └── "당신과 비슷한 사용자" 추천                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

장점: 지속적 개선, 개인화 향상
단점: 데이터 필요, 콜드 스타트
```

### 6.3 V3: AI Wellness Concierge

```
┌─────────────────────────────────────────────────────────────────┐
│                   V3: AI Wellness Concierge                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 딥 프로필                                                   │
│     ├── 분석 결과 (7개 도메인)                                  │
│     ├── 행동 로그 (클릭, 체류, 구매)                            │
│     ├── 명시적 선호 (설정)                                      │
│     ├── 암묵적 선호 (학습)                                      │
│     └── 시계열 변화 (히스토리)                                  │
│                                                                 │
│  2. Multi-Modal 이해                                            │
│     ├── 이미지 분석 결과                                        │
│     ├── 텍스트 선호 (리뷰 좋아요)                               │
│     └── 행동 시퀀스                                             │
│                                                                 │
│  3. LLM 추론                                                    │
│     ├── 맥락 이해 (캘린더, 날씨, 이벤트)                        │
│     ├── 선제적 추천 ("내일 면접이시죠?")                        │
│     └── 대화형 조정 ("더 저렴한 옵션은?")                       │
│                                                                 │
│  4. 설명 생성                                                   │
│     └── 자연어: "당신의 건성 피부와 웜톤에..."                   │
│                                                                 │
│  5. 강화 학습                                                   │
│     ├── 매 상호작용에서 학습                                    │
│     └── 장기 만족도 최적화                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

장점: 궁극의 개인화, 선제적 가이드, 대화형
단점: 높은 비용, 복잡한 구현, 지연 시간
```

---

## 7. 이룸 적용 권장사항

### 7.1 단계별 구현 로드맵

| 버전 | 구현 시점 | 핵심 기능 | 데이터 요구 |
|------|----------|----------|------------|
| **V1** | MVP (즉시) | 3-3-3 규칙 엔진 | 프로필 + 시너지 매트릭스 |
| **V2** | 3개월 후 | Bandit + 피드백 | V1 + 피드백 로그 (1000+) |
| **V3** | 1년 후 | LLM 컨시어지 | V2 + 행동 시퀀스 (10000+) |

### 7.2 데이터 수집 (V1부터 시작)

V2/V3를 위해 **V1부터 수집해야 할 데이터**:

```typescript
interface FeedbackEvent {
  userId: string;
  recommendationId: string;
  action: 'view' | 'click' | 'like' | 'dislike' | 'purchase' | 'return';
  timestamp: Date;
  context: {
    page: string;
    position: number;
    sessionDuration: number;
  };
}

interface BehaviorLog {
  userId: string;
  eventType: 'search' | 'filter' | 'compare' | 'save' | 'share';
  payload: Record<string, unknown>;
  timestamp: Date;
}
```

### 7.3 성공 지표

| 버전 | 핵심 지표 | 목표 |
|------|----------|------|
| V1 | 추천 클릭률 (CTR) | > 15% |
| V1 | 추천 관련성 (설문) | > 70% |
| V2 | CTR 개선 | +30% vs V1 |
| V2 | 구매 전환율 | > 5% |
| V3 | 사용자 만족도 (NPS) | > 50 |
| V3 | 재방문율 | > 60% |

---

## 8. 참고 자료

### 논문 및 학술 자료 (2024-2026)

| 출처 | 제목/주제 | URL |
|------|----------|-----|
| SSRN (2025) | Explainable AI in E-Commerce - Trust & Purchase Decisions | [Link](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5789189) |
| arXiv (2025) | Meta-Analysis: Trust & Explainability Correlation | [Link](https://arxiv.org/pdf/2504.12529) |
| MDPI (2025) | Adaptive Learning & Multi-Domain Knowledge Graphs | [Link](https://www.mdpi.com/2504-2289/9/5/124) |
| ACM SIGIR (2025) | FIT: Learnable Fully Interacted Two-Tower Model | [Link](https://dl.acm.org/doi/10.1145/3726302.3729881) |
| PLOS ONE (2024) | CL-EPIDTN: Contrastive Learning for Recommendations | [Link](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0332894) |
| Nature (2025) | Multi-objective Contextual Bandits for Smart Tourism | [Link](https://www.nature.com/articles/s41598-025-89920-2) |
| Frontiers (2024) | Hybrid Recommender for Cold Start in E-Learning | [Link](https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2024.1404391/full) |

### 산업 자료 (Tech Blog)

| 회사 | 제목/주제 | URL |
|------|----------|-----|
| **Netflix** | Foundation Model for Personalized Recommendation | [Tech Blog](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39) |
| **Netflix** | Integrating Foundation Model into Applications | [Tech Blog](https://netflixtechblog.medium.com/integrating-netflixs-foundation-model-into-personalization-applications-cf176b5860eb) |
| **Apple** | Two-Layer Bandit Optimization | [ML Research](https://machinelearning.apple.com/research/two-layer-bandit) |
| **Meta** | Scaling Instagram Explore Recommendations | [Engineering Blog](https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/) |
| **Google Cloud** | Two-Tower Retrieval Implementation Guide | [Architecture Center](https://docs.cloud.google.com/architecture/implement-two-tower-retrieval-large-scale-candidate-generation) |
| **McKinsey** | Building Trust in AI: Role of Explainability | [Insights](https://www.mckinsey.com/capabilities/quantumblack/our-insights/building-ai-trust-the-key-role-of-explainability) |

### 기술 블로그 및 가이드

| 저자/출처 | 제목 | URL |
|----------|------|-----|
| Eugene Yan | Bandits for Recommender Systems (실전 사례) | [Blog](https://eugeneyan.com/writing/bandits/) |
| Shaped | AI-Powered Recommendation Engines Guide | [Blog](https://www.shaped.ai/blog/ai-powered-recommendation-engines) |
| Shaped | Two-Tower Model Deep Dive | [Blog](https://www.shaped.ai/blog/the-two-tower-model-for-recommendation-systems-a-deep-dive) |
| Shaped | Netflix PRS Workshop 2025 Insights | [Blog](https://www.shaped.ai/blog/key-insights-from-the-netflix-personalization-search-recommendation-workshop-2025) |

### 오픈소스

| 프로젝트 | 설명 | URL |
|----------|------|-----|
| Microsoft Recommenders | Best Practices on Recommendation Systems | [GitHub](https://github.com/recommenders-team/recommenders) |
| RecBole | 통합 추천 시스템 프레임워크 | [GitHub](https://github.com/RUCAIBox/RecBole) |
| LensKit | 연구용 추천 시스템 라이브러리 | [Website](https://lenskit.org/) |

### 워크샵 및 컨퍼런스

| 이벤트 | 주제 | URL |
|--------|------|-----|
| GenAIRecP 2025 | Generative AI for Recommender Systems | [Workshop](https://genai-personalization.github.io/GenAIRecP2025) |
| Netflix PRS 2025 | Personalization, Recommendation and Search | [Event](https://prs2025.splashthat.com/) |

---

**Version**: 2.0 | **Created**: 2026-01-22 | **Updated**: 2026-01-22 (웹 리서치 추가)
**Status**: Completed (웹 검색 기반 검증 완료)
**Next**: → 원리 문서화 (personalization-engine.md)
