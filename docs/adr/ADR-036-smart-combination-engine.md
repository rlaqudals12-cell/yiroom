# ADR-036: Smart Combination Engine (V1/V2/V3)

## 상태

`accepted`

## 날짜

2026-01-22 (Updated: 2026-01-22)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"AI가 사용자의 모든 분석 결과와 행동을 이해하여, 필요할 때 선제적으로 완벽한 추천을 제공하는 상태"

- **완전 개인화**: 7개 도메인 데이터 100% 활용한 맞춤 추천
- **선제적 추천**: 일정, 날씨, 패턴 기반 능동적 제안
- **자연어 설명**: 모든 추천에 대해 "왜"를 이해하기 쉽게 설명
- **실시간 학습**: 피드백 즉시 반영, 지속적 개선

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 콜드 스타트 | 신규 사용자 데이터 부족으로 초기 추천 품질 제한 |
| AI 비용 | LLM 호출 당 비용, 대규모 확장 시 비용 급증 |
| 데이터 의존성 | 충분한 피드백 데이터 없이 학습 불가 |
| 도메인 복잡도 | 7개 도메인 조합 시 ~7.8억 가지 이론적 조합 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 추천 클릭률 (CTR) | > 30% | 0% | V1 출시 후 측정 |
| 추천 관련성 (설문) | > 90% | 0% | 사용자 피드백 |
| 구매 전환율 | > 15% | 0% | V2+ 목표 |
| NPS | > 70 | 0 | V3 목표 |
| 재방문율 | > 80% | 0% | V3 목표 |

### 현재 목표: 70%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| LLM Only 추천 | 비용, 지연, 일관성 (HIGH_COST) | 비용 절감 후 |
| 협업 필터링 | 초기 데이터 부족 (DATA_DEPENDENCY) | MAU 5만+ |
| 순수 ML 모델 | 콜드 스타트 문제 (COLD_START) | V2 피드백 축적 후 |
| Foundation Model 통합 | 구현 복잡도 (HIGH_COMPLEXITY) | V3 장기 목표 |

---

## 맥락 (Context)

이룸은 7개 도메인(PC, S, C, W, N, P, O)의 분석 결과를 통합하여 개인화된 추천을 제공해야 합니다.

### 문제점

1. **조합 폭발**: 7개 도메인의 이론적 조합 수가 ~7.8억에 달함
2. **다중 시너지**: 도메인 간 시너지(S×N=95%, C×W=95% 등)를 활용해야 함
3. **충돌 해결**: 도메인 간 추천이 충돌할 때 안전하게 해결 필요
4. **진화 경로**: MVP에서 시작해 AI 컨시어지까지 점진적 진화 필요

### 요구사항

- **V1 (즉시)**: 규칙 기반, 빠른 출시, 투명한 로직
- **V2 (3개월 후)**: 피드백 학습, 개인화 향상
- **V3 (1년 후)**: AI 기반, 선제적 추천, 자연어 설명

### 산업 동향 (2025-2026)

> AI 기반 추천 시스템 시장은 **2025년 $24.4억 → 2029년 $36.2억**으로 성장 전망
> — [Shaped Blog](https://www.shaped.ai/blog/ai-powered-recommendation-engines)

| 트렌드 | 설명 | 적용 |
|--------|------|------|
| **Foundation Model 통합** | Netflix가 수백 개 모델 → 단일 모델 | V3 장기 목표 |
| **Semi-personalized Bandits** | Deezer: 클러스터별 Bandit이 전체 개인화보다 효과적 | V2 권장 |
| **XAI 필수화** | 설명 없는 AI 투자는 낭비 (McKinsey) | V1부터 적용 |

## 결정 (Decision)

**3단계 진화 아키텍처** 채택: V1(규칙) → V2(학습) → V3(AI)

### 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│              Smart Combination Engine 진화 로드맵                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  V1: 3-3-3 Rule Engine (MVP)                                    │
│  ├── N×M 시너지 매트릭스                                         │
│  ├── Top 3 시너지 → Top 3 추천/시너지 → Top 3 최종               │
│  ├── 우선순위 기반 충돌 해결                                     │
│  └── 템플릿 기반 설명                                            │
│                                                                  │
│                         ↓ (피드백 데이터 1000+)                  │
│                                                                  │
│  V2: Learning Combination Engine (3개월 후)                      │
│  ├── V1 + 피드백 수집 (👍/👎, 구매)                              │
│  ├── Contextual Bandits (UCB 알고리즘)                           │
│  ├── 동적 시너지 가중치                                          │
│  └── 유사 사용자 클러스터링                                      │
│                                                                  │
│                         ↓ (행동 데이터 10000+)                   │
│                                                                  │
│  V3: AI Wellness Concierge (1년 후)                              │
│  ├── V2 + 딥 프로필 (분석+행동+맥락)                             │
│  ├── LLM 기반 추론                                               │
│  ├── 선제적 추천 (캘린더, 날씨 연동)                             │
│  └── 자연어 설명 생성                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### V1: 3-3-3 Rule Engine

```typescript
/**
 * 3-3-3 규칙:
 * 1. Top 3 시너지 조합 선택
 * 2. 각 조합에서 Top 3 추천 생성
 * 3. 최종 Top 3 선별 (충돌 해결, 중복 제거)
 */

interface V1Engine {
  // 입력
  profile: UserProfile;
  items: Item[];
  synergyMatrix: number[][];

  // 처리
  selectTopSynergies(profile: UserProfile): Synergy[];
  generateRecommendations(synergy: Synergy): Recommendation[];
  resolveConflicts(candidates: Recommendation[]): Recommendation[];

  // 출력
  recommendations: Recommendation[];  // 최대 3개
  explanations: string[];             // 템플릿 기반
}

// 충돌 해결 우선순위
const PRIORITY_HIERARCHY = {
  health_safety: 100,      // 건강/안전 (절대 우선)
  medical_warning: 90,     // 의료 경고
  domain_expertise: 80,    // 도메인 전문성
  user_preference: 70,     // 사용자 선호
  general: 50,             // 일반
};
```

### V2: Learning Combination Engine

#### 핵심 결정: Semi-personalized Bandits 채택

> **Deezer 사례 (2025)**: k-means로 100개 사용자 클러스터 → 클러스터별 Bandit 학습
> 결과: **전체 개인화보다 효과적** (적은 데이터로 빠른 수렴)
> — [Eugene Yan](https://eugeneyan.com/writing/bandits/)

> **Apple 사례 (2025)**: Two-Layer Bandit → 사용자 참여 **2배 이상 증가**
> — [Apple ML Research](https://machinelearning.apple.com/research/two-layer-bandit)

**이룸 V2 적용**:
- 사용자를 피부타입×퍼스널컬러 조합으로 ~100개 클러스터 구성
- 클러스터별 별도 Bandit 학습 → 피드백 효율 극대화

```typescript
interface V2Engine extends V1Engine {
  // 추가 입력
  feedbackHistory: FeedbackEvent[];
  userSegment: UserSegment;  // ~100개 클러스터

  // 추가 처리
  collectFeedback(recId: string, action: FeedbackAction): void;
  updateBandits(arm: Arm, reward: number): void;
  adjustWeights(segment: UserSegment, metrics: Metrics): void;

  // 개선된 출력
  recommendations: Recommendation[];   // 개인화 향상
  explorationItems: Recommendation[];  // 탐색 추천
}

// 피드백 이벤트
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

// UCB 알고리즘
function ucbSelect(arms: Arm[], totalTrials: number): Arm {
  const c = Math.sqrt(2);

  const scores = arms.map(arm => {
    if (arm.trials === 0) return Infinity;
    const exploitation = arm.totalReward / arm.trials;
    const exploration = c * Math.sqrt(Math.log(totalTrials) / arm.trials);
    return exploitation + exploration;
  });

  return arms[argmax(scores)];
}
```

### V3: AI Wellness Concierge

#### 장기 목표: Foundation Model 접근 (Netflix 참고)

> **Netflix Foundation Model (2025)**: 수백 개의 특화 모델 → 단일 Foundation Model 통합
> Transformer 기반 Sparse Attention, "단기 행동이 아닌 장기 의도" 학습
> — [Netflix Tech Blog](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39)

**이룸 V3 진화 방향**:
- V2부터 Embedding Store 도입 → 버전 호환성 확보
- 장기적으로 모듈별 특화 모델 → 통합 모델 고려

```typescript
interface V3Engine extends V2Engine {
  // 딥 프로필 (장기 의도 학습)
  deepProfile: {
    analyses: AllAnalysisResults;
    behaviors: BehaviorLog[];
    preferences: LearnedPreferences;
    history: RecommendationHistory[];
    context: CurrentContext;
  };

  // LLM 추론
  reason(query: string, profile: DeepProfile): Promise<ReasoningResult>;
  predictNeeds(profile: DeepProfile, calendar: CalendarEvent[]): Promise<ProactiveRec[]>;
  generateNaturalExplanation(rec: Recommendation): Promise<string>;

  // 대화형 인터페이스
  chat(message: string, conversationId: string): Promise<ChatResponse>;
}

// 선제적 추천 예시
interface ProactiveRecommendation {
  trigger: 'calendar_event' | 'weather' | 'time_based' | 'pattern';
  recommendation: Recommendation;
  timing: Date;
  message: string;  // "내일 면접이시네요! 이 룩은 어떠세요?"
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **순수 규칙 기반** | 투명, 빠른 구현 | 개인화 제한 | `LOW_PERSONALIZATION` - 장기 경쟁력 부족 |
| **순수 ML 기반** | 높은 정확도 | 콜드 스타트, 설명 불가 | `COLD_START` - 초기 사용자 문제 |
| **LLM Only** | 유연함 | 비용, 지연, 일관성 | `HIGH_COST` - MVP에 부적합 |
| **협업 필터링** | 발견성 좋음 | 데이터 필요 | `DATA_DEPENDENCY` - 초기에 불가 |
| **3단계 하이브리드 (선택)** | 점진적 진화, 각 단계 장점 | 복잡도 | ✅ 채택 |

## 결과 (Consequences)

### 긍정적 결과

- **점진적 진화**: MVP → 학습 → AI로 리스크 최소화
- **데이터 축적**: V1부터 피드백 수집하여 V2/V3 준비
- **설명 가능**: 모든 버전에서 추천 이유 제공
- **안전 우선**: 충돌 해결에서 건강/안전 항상 최우선

### 부정적 결과

- **구현 복잡도**: 3개 버전 모두 설계 필요
- **마이그레이션**: V1→V2→V3 전환 비용

### 리스크 완화

| 리스크 | 완화 방안 |
|--------|----------|
| V2 콜드 스타트 | V1 규칙 백업 유지 |
| V3 비용 | 캐싱, 요약 프롬프트 |
| 데이터 부족 | V1에서 피드백 UI 필수 포함 |

## 구현 가이드

### 파일 구조

```
lib/recommendation/
├── index.ts                    # 공개 API (Barrel Export)
├── types.ts                    # 공유 타입
├── v1/
│   ├── engine.ts               # 3-3-3 Rule Engine
│   ├── synergy-matrix.ts       # N×M 시너지 매트릭스
│   ├── conflict-resolver.ts    # 충돌 해결
│   └── template-explainer.ts   # 템플릿 설명 생성
├── v2/
│   ├── engine.ts               # Learning Engine
│   ├── feedback-collector.ts   # 피드백 수집
│   ├── bandit.ts               # UCB 알고리즘
│   └── weight-adjuster.ts      # 동적 가중치
├── v3/
│   ├── engine.ts               # AI Concierge Engine
│   ├── deep-profile.ts         # 딥 프로필
│   ├── llm-reasoner.ts         # LLM 추론
│   └── proactive-recommender.ts# 선제적 추천
└── internal/
    ├── utils.ts                # 내부 유틸리티
    └── constants.ts            # 상수
```

### DB 스키마 (V1부터 준비)

```sql
-- 피드백 테이블 (V2 준비)
CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  recommendation_id UUID NOT NULL,
  action TEXT NOT NULL,  -- view, click, like, dislike, purchase, return
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 추천 이력 (V2/V3)
CREATE TABLE recommendation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  recommendations JSONB NOT NULL,  -- 추천 목록
  synergies JSONB,                 -- 사용된 시너지
  version TEXT NOT NULL,           -- v1, v2, v3
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_feedback" ON recommendation_feedback
  FOR ALL USING (clerk_user_id = auth.get_user_id());

ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_history" ON recommendation_history
  FOR ALL USING (clerk_user_id = auth.get_user_id());
```

### API 엔드포인트

```typescript
// V1: 추천 조회
GET /api/recommendations
  ?domains=PC,S,C
  &limit=3

// V2: 피드백 제출
POST /api/recommendations/feedback
  { recommendationId, action, context }

// V3: 대화형 추천
POST /api/recommendations/chat
  { message, conversationId }
```

### 성공 지표

| 버전 | 지표 | 목표 |
|------|------|------|
| V1 | 추천 클릭률 (CTR) | > 15% |
| V1 | 추천 관련성 (설문) | > 70% |
| V2 | CTR 개선 | +30% vs V1 |
| V2 | 구매 전환율 | > 5% |
| V3 | NPS | > 50 |
| V3 | 재방문율 | > 60% |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 개인화 엔진](../principles/personalization-engine.md) ← 핵심 알고리즘, XAI 실증 데이터
- [원리: 크로스도메인 시너지](../principles/cross-domain-synergy.md) ← N×M 매트릭스

### 관련 ADR
- [ADR-032: Smart Matching](./ADR-032-smart-matching.md) - Phase J 제품 매칭
- [ADR-027: Coach AI Streaming](./ADR-027-coach-ai-streaming.md) - AI 코치 연동
- [ADR-011: Cross-Module Data Flow](./ADR-011-cross-module-data-flow.md) - 프로필 조립

### 리서치
- [RECOMMENDATION-ENGINE-RESEARCH.md](../research/claude-ai-research/RECOMMENDATION-ENGINE-RESEARCH.md) v2.0 ← 웹 검색 기반 검증 완료

### 스펙
- [SDD-SMART-COMBINATION-ENGINE.md](../specs/SDD-SMART-COMBINATION-ENGINE.md)

---

## 참고 자료 (외부 출처)

### 산업 Tech Blog

| 회사 | 주제 | URL |
|------|------|-----|
| **Netflix** | Foundation Model for Personalization | [Link](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39) |
| **Apple** | Two-Layer Bandit (2x 참여 증가) | [Link](https://machinelearning.apple.com/research/two-layer-bandit) |
| **McKinsey** | AI 신뢰와 설명 가능성 | [Link](https://www.mckinsey.com/capabilities/quantumblack/our-insights/building-ai-trust-the-key-role-of-explainability) |

### 기술 블로그

| 저자 | 주제 | URL |
|------|------|-----|
| Eugene Yan | Bandits 실전 사례 (Spotify, Deezer, Twitter, Yahoo) | [Link](https://eugeneyan.com/writing/bandits/) |
| Shaped | AI 추천 시스템 트렌드 (시장 규모 $24.4B→$36.2B) | [Link](https://www.shaped.ai/blog/ai-powered-recommendation-engines) |

---

**Author**: Claude Code
**Reviewed by**: -
**Version**: 1.1 | **Updated**: 2026-01-22 (웹 리서치 기반 업데이트)
