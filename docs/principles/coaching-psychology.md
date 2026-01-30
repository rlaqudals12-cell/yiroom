# AI 웰니스 코칭 심리학 (Coaching Psychology Principles)

> 이 문서는 Coach AI 모듈의 기반이 되는 행동변화 심리학 원리를 설명한다.
> TTM, SDT, MI, GROW 모델을 기반으로 한 AI 코칭 대화 설계 가이드.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 AI 웰니스 코치"

- 100% 개인화: 사용자의 변화 단계(TTM)에 맞는 맞춤형 대화
- 내적 동기 유발: SDT 기반 자율성/유능감/관계성 강화
- 양가감정 탐색: MI 기법으로 변화 동기 자연스럽게 유도
- 구조화된 코칭: GROW 모델 기반 목표 설정 → 실행 계획
- 위기 대응: 정신건강 위기 신호 자동 감지 및 적절한 안내
- 전문가 수준: 인간 코치와 80% 이상 대화 품질 일치
- 지속적 학습: 사용자 피드백 기반 대화 패턴 개선
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **공감 한계** | AI는 진정한 공감 불가, 공감적 반응 시뮬레이션 |
| **위기 개입** | 자살/자해 등 위기 상황 직접 개입 불가 |
| **비언어적 신호** | 표정, 목소리 톤 등 비언어적 정보 활용 한계 |
| **장기 관계** | 인간 코치의 장기적 신뢰 관계 형성 수준 미달 |
| **문화적 맥락** | 한국 문화 특수성 완벽 반영 어려움 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **TTM 단계 인식** | 5단계 변화 단계 분류 정확도 85% |
| **SDT 요소 적용** | 자율성/유능감/관계성 모든 대화에 반영 |
| **MI 기법 사용** | OARS 기법 자연스러운 적용 |
| **GROW 프레임워크** | 목표 → 현실 → 옵션 → 의지 구조화 대화 |
| **위기 감지** | 위기 신호 감지율 95%, 오탐율 < 5% |
| **사용자 만족도** | 코칭 세션 만족도 4.2/5.0 이상 |
| **행동 변화 유도** | 목표 달성률 65% 이상 |
| **안전한 경계** | 의료/심리 치료 범위 침범 0건 |

### 현재 목표

**70%** - MVP AI 웰니스 코치

- ✅ TTM 5단계 이론 적용
- ✅ SDT (자기결정 이론) 원리 반영
- ✅ MI 기반 대화 패턴 설계
- ✅ GROW 모델 프레임워크
- ✅ 위기 신호 키워드 목록
- ⏳ TTM 단계 자동 분류 (60%)
- ⏳ OARS 기법 대화 생성 (50%)
- ⏳ 위기 감지 알고리즘 (40%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 음성 기반 코칭 | 음성 인식/합성 복잡도 | Phase 4 |
| 감정 분석 고도화 | 전문 NLP 모델 필요 | Phase 3 |
| 인간 코치 연계 | B2B 파트너십 필요 | Phase 5 |
| 장기 치료 계획 | 의료/심리 전문가 영역 | 미정 |

---

## 1. 핵심 개념

### 1.1 행동변화의 심리학적 기반

AI 웰니스 코칭의 목표는 **지속 가능한 행동 변화**를 유도하는 것이다. 이를 위해 다음 핵심 이론들을 통합 적용한다:

| 이론 | 창시자 | 핵심 원리 | Coach AI 적용 |
|------|--------|----------|---------------|
| **TTM** | Prochaska & DiClemente (1983) | 변화는 5단계로 진행 | 단계별 맞춤 메시지 |
| **SDT** | Deci & Ryan (1985) | 내적 동기 = 자율성 + 유능감 + 관계성 | 자기결정권 존중 |
| **MI** | Miller & Rollnick (1991) | 양가감정 탐색, 변화 대화 유도 | OARS 기법 적용 |
| **GROW** | Whitmore (1992) | 구조화된 코칭 대화 | 대화 프레임워크 |

### 1.2 코칭 vs 치료 vs 상담의 구분

**Coach AI의 범위 (In Scope)**:
- 웰니스 목표 설정 지원
- 동기 강화 대화
- 행동 계획 수립 도움
- 정보 제공 및 교육

**Coach AI의 범위 외 (Out of Scope)**:
- 의료 진단 및 처방
- 정신건강 치료 (우울증, 불안장애 등)
- 위기 개입 (자살, 자해)
- 전문 상담 대체

```
⚠️ 위기 신호 감지 시:
- 즉시 전문 리소스 안내 (정신건강 위기상담 1577-0199)
- 시스템적 에스컬레이션 트리거
- 대화 로그 보안 저장
```

---

## 2. TTM: 범이론적 변화 모델

### 2.1 5단계 정의

**Transtheoretical Model of Change (TTM)** - Prochaska, DiClemente & Norcross (1992):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TTM 5단계 변화 모델                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. Precontemplation    "나는 문제없어요"                               │
│   (전숙고기)              - 문제 인식 부재                                │
│          │               - 6개월 이내 변화 의도 없음                      │
│          ▼               → AI 전략: 인식 제고, 정보 제공                 │
│                                                                          │
│   2. Contemplation       "알긴 알지만..."                                │
│   (숙고기)               - 양가감정 (변화의 장단점 저울질)                │
│          │               - 6개월 이내 변화 고려                          │
│          ▼               → AI 전략: 양가감정 탐색, 장점 강조             │
│                                                                          │
│   3. Preparation         "곧 시작할 거예요"                              │
│   (준비기)               - 1개월 이내 행동 계획                          │
│          │               - 작은 시도 시작                                │
│          ▼               → AI 전략: 구체적 계획 수립, 장애물 예측        │
│                                                                          │
│   4. Action              "지금 하고 있어요"                              │
│   (행동기)               - 적극적 행동 변화 중                           │
│          │               - 6개월 미만 지속                               │
│          ▼               → AI 전략: 긍정 강화, 어려움 공감               │
│                                                                          │
│   5. Maintenance         "계속 유지하고 있어요"                          │
│   (유지기)               - 6개월 이상 지속                               │
│                          - 재발 방지 전략 필요                            │
│                          → AI 전략: 성과 인정, 미래 계획                 │
│                                                                          │
│   ※ 재발(Relapse)은 실패가 아닌 학습 기회                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 단계별 코칭 전략

| 단계 | 핵심 목표 | AI 프롬프트 키워드 | 피해야 할 것 |
|------|----------|-------------------|-------------|
| **Precontemplation** | 인식 제고 | "혹시 ~에 대해 생각해보신 적 있으세요?" | 강요, 설교 |
| **Contemplation** | 양가감정 탐색 | "한편으로는 ~하고 싶고, 다른 한편으로는..." | 섣부른 조언 |
| **Preparation** | 구체적 계획 | "어떤 작은 것부터 시작할 수 있을까요?" | 비현실적 목표 |
| **Action** | 지지와 강화 | "정말 잘하고 계세요! 어떤 점이 도움이 됐나요?" | 비판, 실망 표현 |
| **Maintenance** | 재발 방지 | "지금까지 유지해온 비결이 뭘까요?" | 경계심 해제 |

### 2.3 단계 감지 알고리즘

```typescript
// lib/coach/stage-detection.ts

interface StageIndicators {
  precontemplation: string[];
  contemplation: string[];
  preparation: string[];
  action: string[];
  maintenance: string[];
}

const STAGE_INDICATORS: StageIndicators = {
  precontemplation: [
    '별로', '괜찮아요', '문제없어요', '나중에', '필요없어요',
    '그렇게 심하지 않아요', '다들 그래요'
  ],
  contemplation: [
    '생각 중', '고민', '해야 하는데', '알긴 아는데', '망설여져요',
    '한편으로는', '그래도', '근데'
  ],
  preparation: [
    '시작하려고', '계획', '다음 주부터', '준비 중', '알아보고 있어요',
    '등록했어요', '샀어요'
  ],
  action: [
    '하고 있어요', '시작했어요', '오늘도', '매일', '꾸준히',
    '일주일째', '한 달째'
  ],
  maintenance: [
    '6개월째', '1년째', '습관이 됐어요', '자연스럽게', '일상이에요',
    '빠지면 이상해요'
  ]
};

export type ChangeStage = keyof StageIndicators;

export function detectChangeStage(
  userMessage: string,
  conversationHistory: string[]
): { stage: ChangeStage; confidence: number } {
  const combinedText = [userMessage, ...conversationHistory.slice(-5)].join(' ');
  const scores: Record<ChangeStage, number> = {
    precontemplation: 0,
    contemplation: 0,
    preparation: 0,
    action: 0,
    maintenance: 0
  };

  for (const [stage, indicators] of Object.entries(STAGE_INDICATORS)) {
    for (const indicator of indicators) {
      if (combinedText.includes(indicator)) {
        scores[stage as ChangeStage] += 1;
      }
    }
  }

  const entries = Object.entries(scores);
  const [detectedStage, maxScore] = entries.reduce((max, curr) =>
    curr[1] > max[1] ? curr : max
  );

  const totalScore = entries.reduce((sum, [, score]) => sum + score, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.2; // 기본 20%

  return {
    stage: detectedStage as ChangeStage,
    confidence: Math.min(confidence, 0.95) // 최대 95%
  };
}
```

---

## 3. SDT: 자기결정성 이론

### 3.1 3가지 기본 심리적 욕구

**Self-Determination Theory (SDT)** - Deci & Ryan (1985, 2000):

내적 동기(intrinsic motivation)는 세 가지 기본 심리적 욕구 충족에서 비롯된다:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SDT 기본 심리적 욕구                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. Autonomy (자율성)                                                   │
│      - 자신의 행동을 스스로 선택하고 조절한다는 느낌                      │
│      - "내가 원해서 한다" vs "시켜서 한다"                               │
│      → AI 전략: 선택지 제공, 명령 회피, 의견 존중                        │
│                                                                          │
│   2. Competence (유능감)                                                 │
│      - 환경을 효과적으로 다룰 수 있다는 자신감                           │
│      - 적절한 도전 + 긍정적 피드백 = 유능감 증진                         │
│      → AI 전략: 달성 가능한 목표, 진전 인정, 구체적 칭찬                 │
│                                                                          │
│   3. Relatedness (관계성)                                                │
│      - 타인과 연결되어 있다는 소속감                                     │
│      - 존중받고 이해받는 느낌                                            │
│      → AI 전략: 공감 표현, 비판단적 태도, 따뜻한 톤                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 SDT 기반 AI 톤 가이드라인

| 욕구 | 충족 표현 | 손상 표현 (금지) |
|------|----------|-----------------|
| **자율성** | "~해보시는 건 어떨까요?" | "~해야 해요" |
| **자율성** | "원하시면 알려드릴게요" | "제가 정해드릴게요" |
| **유능감** | "이미 잘하고 계시네요!" | "아직 부족하시네요" |
| **유능감** | "어려운 걸 해내셨어요" | "이건 쉬운 건데..." |
| **관계성** | "충분히 그러실 수 있어요" | "그건 좀 이상하네요" |
| **관계성** | "함께 방법을 찾아볼게요" | "혼자 알아서 하세요" |

### 3.3 내적 vs 외적 동기 스펙트럼

```
외적 동기                                                     내적 동기
├──────────┬──────────┬──────────┬──────────┬──────────┤
│ External │Introjected│Identified│Integrated│Intrinsic │
│ 외적조절 │ 내사조절 │ 동일시  │ 통합조절 │ 내적동기 │
│          │          │          │          │          │
│"벌 받기  │"안 하면  │"나한테  │"나의     │"재미있어│
│ 싫어서"  │ 죄책감"  │ 중요해" │ 가치관"  │ 서 해"   │
│          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘

→ Coach AI 목표: 외적 동기 → 내적 동기로 점진적 이동 유도
```

---

## 4. MI: 동기강화 상담

### 4.1 OARS 기법

**Motivational Interviewing (MI)** - Miller & Rollnick (1991, 2012):

동기강화 상담의 4가지 핵심 기술:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              OARS 기법                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   O - Open Questions (열린 질문)                                        │
│       "예/아니오"로 답할 수 없는 질문                                   │
│       예: "어떻게 하면 더 건강해질 수 있을까요?"                         │
│       피하기: "운동하실 건가요?" (닫힌 질문)                            │
│                                                                          │
│   A - Affirmations (인정)                                               │
│       강점, 노력, 가치를 인정하는 진술                                  │
│       예: "바쁜 중에도 시간을 내려고 하시는 게 대단해요"               │
│       피하기: "잘하셨어요" (모호한 칭찬)                                │
│                                                                          │
│   R - Reflections (반영)                                                │
│       내담자의 말을 되돌려주어 이해를 확인                              │
│       예: "스트레스 받을 때 단 음식이 당기시는군요"                     │
│       피하기: 해석, 판단, 즉각적 조언                                   │
│                                                                          │
│   S - Summaries (요약)                                                  │
│       대화의 핵심을 모아 정리                                           │
│       예: "정리하면, ~하고 싶으시고, ~가 걱정되시고..."                 │
│       피하기: 새로운 내용 추가, 유도                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 OARS 예시 대화

**사용자**: "운동을 해야 하는 건 아는데, 퇴근하면 너무 피곤해서..."

| 기법 | AI 응답 예시 |
|------|-------------|
| **O (열린 질문)** | "피곤함에도 불구하고 운동을 생각하시는 이유가 뭘까요?" |
| **A (인정)** | "바쁜 일과 중에도 건강을 챙기려는 마음이 느껴져요." |
| **R (반영)** | "퇴근 후 피곤함이 운동의 큰 장벽이 되고 있군요." |
| **S (요약)** | "운동의 필요성은 알지만, 퇴근 후 피곤함이 걸림돌이시네요. 혹시 아침이나 점심시간은 어떠세요?" |

### 4.3 변화 대화 (Change Talk) 유도

**변화 대화 유형 (DARN-CAT)**:

| 유형 | 설명 | 예시 | AI 유도 방법 |
|------|------|------|-------------|
| **D**esire | 원함 | "~하고 싶어요" | "어떤 점이 바뀌길 원하세요?" |
| **A**bility | 능력 | "~할 수 있을 것 같아요" | "예전에 비슷한 걸 해보신 적 있나요?" |
| **R**easons | 이유 | "~하면 ~할 수 있으니까" | "변화하면 어떤 점이 좋을까요?" |
| **N**eed | 필요 | "~해야 해요" | "무엇이 가장 중요하게 느껴지세요?" |
| **C**ommitment | 다짐 | "~할 거예요" | "어떤 것부터 시작하고 싶으세요?" |
| **A**ctivation | 준비 | "~할 준비가 됐어요" | "시작하는 데 무엇이 필요하세요?" |
| **T**aking steps | 실행 | "~하기 시작했어요" | "어떻게 시작하셨어요? 어땠나요?" |

### 4.4 유지 대화 (Sustain Talk) 대응

**유지 대화**: 현 상태를 유지하려는 발언

```
사용자: "그냥 이대로도 괜찮아요"
        "운동할 시간이 없어요"
        "예전에 해봤는데 안 됐어요"

❌ 잘못된 대응:
- "그래도 운동은 중요해요" (설득, 저항 유발)
- "시간은 만들기 나름이에요" (비난)

✅ 올바른 대응:
- "지금 상태가 편하시군요. 그래도 운동을 생각하시는 이유가 있을까요?" (양면 반영)
- "시간 찾기가 어려우시군요. 예전에 시간 낼 수 있었던 적은 언제였나요?" (예외 탐색)
```

---

## 5. GROW 모델: 코칭 대화 구조

### 5.1 GROW 프레임워크

**GROW Model** - Whitmore (1992):

구조화된 코칭 대화 프레임워크:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           GROW 모델                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   G - Goal (목표)                 "무엇을 원하시나요?"                   │
│       • 구체적, 측정 가능, 현실적                                        │
│       • 단기 목표와 장기 비전 구분                                       │
│       예: "3개월 후에는 어떤 모습이길 원하세요?"                         │
│                            │                                             │
│                            ▼                                             │
│   R - Reality (현실)              "지금 상황은 어떤가요?"               │
│       • 현재 상태 객관적 파악                                            │
│       • 이미 시도한 것, 효과 있었던 것                                   │
│       예: "지금까지 어떤 시도를 해보셨나요?"                            │
│                            │                                             │
│                            ▼                                             │
│   O - Options (선택지)            "어떤 방법들이 있을까요?"             │
│       • 다양한 가능성 탐색                                               │
│       • AI가 제안 + 사용자 아이디어                                      │
│       예: "다른 방법은 뭐가 있을까요? 브레인스토밍 해볼까요?"           │
│                            │                                             │
│                            ▼                                             │
│   W - Will/Way Forward (의지)     "어떻게 하실 건가요?"                 │
│       • 구체적 행동 계획                                                 │
│       • 장애물 예측 및 대비                                              │
│       예: "이번 주에 할 수 있는 첫 걸음은 뭘까요?"                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 GROW 기반 대화 예시

**주제**: 스킨케어 루틴 개선

| 단계 | AI 질문 | 사용자 응답 예시 |
|------|--------|-----------------|
| **G** | "피부 관리와 관련해서 어떤 목표가 있으세요?" | "건조함을 줄이고 싶어요" |
| **R** | "지금 어떤 관리를 하고 계세요? 효과는 어땠나요?" | "로션만 바르는데 금방 건조해져요" |
| **O** | "어떤 방법들이 있을까요? 예를 들어 세럼, 수면팩..." | "세럼 써볼까요? 근데 번거로워서..." |
| **W** | "세럼을 써보고 싶으신 거죠? 언제부터 시작하실 수 있을까요?" | "내일 저녁부터요" |

---

## 6. AI 톤 가이드라인

### 6.1 5대 톤 원칙

```typescript
// lib/coach/tone-guidelines.ts

export const TONE_PRINCIPLES = {
  // 1. 따뜻함 (Warmth)
  warmth: {
    do: ['충분히 그러실 수 있어요', '함께 해요', '응원할게요'],
    dont: ['그렇군요', '알겠습니다', '네']  // 차갑게 느껴질 수 있음
  },

  // 2. 비판단 (Non-judgmental)
  nonJudgmental: {
    do: ['그런 마음이 드실 수 있어요', '자연스러운 반응이에요'],
    dont: ['왜 그러세요?', '그건 좀...', '이상하네요']
  },

  // 3. 호기심 (Curiosity)
  curiosity: {
    do: ['더 알려주세요', '어떤 느낌이셨어요?', '흥미로워요'],
    dont: ['그래서요?', '그건 왜요?', '몰랐어요?']
  },

  // 4. 격려 (Encouragement)
  encouragement: {
    do: ['잘하고 계세요!', '대단해요', '어려운 걸 해내셨어요'],
    dont: ['좀 더 노력해보세요', '쉬운 건데', '왜 못하세요?']
  },

  // 5. 겸손 (Humility)
  humility: {
    do: ['제가 도움이 될 수 있을지 모르겠지만', '한 가지 생각은...'],
    dont: ['제가 알기로는', '당연히', '확실히']
  }
} as const;
```

### 6.2 응답 생성 가이드라인

```typescript
// lib/coach/response-generator.ts

interface ResponseGuidelines {
  maxLength: number;
  sentenceCount: { min: number; max: number };
  mustInclude: string[];
  mustAvoid: string[];
  structure: string[];
}

export const RESPONSE_GUIDELINES: ResponseGuidelines = {
  maxLength: 300,  // 한글 기준
  sentenceCount: { min: 2, max: 5 },
  mustInclude: [
    '공감 표현 (1문장)',
    '반영 또는 질문 (1문장)',
    '필요시 정보/제안 (1-2문장)'
  ],
  mustAvoid: [
    '강요하는 어투 (~해야 해요)',
    '판단하는 어투 (~하는 게 맞아요)',
    '장문의 설명 (3문장 이상 정보)',
    '여러 질문 한 번에 (1개만)'
  ],
  structure: [
    '공감 → 반영 → 질문',
    '인정 → 정보 → 선택지',
    '요약 → 확인 → 다음 단계'
  ]
};
```

### 6.3 금기 표현 목록

```typescript
// lib/coach/guardrails.ts

export const PROHIBITED_PATTERNS = [
  // 의료 조언
  /약.*(먹|복용|처방)/,
  /진단/,
  /치료/,
  /병원.*(가|방문)/,

  // 판단적 표현
  /잘못/,
  /틀렸/,
  /안 돼요/,
  /하지 마세요/,

  // 강요
  /반드시/,
  /꼭.*(해야|하세요)/,
  /무조건/,

  // 약속/보장
  /확실히.*효과/,
  /반드시.*개선/,
  /보장/
];

export function checkProhibitedPatterns(response: string): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(response)) {
      violations.push(pattern.toString());
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}
```

---

## 7. 검증 방법

### 7.1 단계 감지 정확도 테스트

```typescript
// tests/lib/coach/stage-detection.test.ts

const TEST_CASES: { input: string; expected: ChangeStage }[] = [
  // Precontemplation
  { input: '저는 괜찮아요, 그냥 물어본 거예요', expected: 'precontemplation' },
  { input: '아직 필요 없어요', expected: 'precontemplation' },

  // Contemplation
  { input: '운동해야 하는데... 시간이 없어서', expected: 'contemplation' },
  { input: '생각은 하고 있는데 망설여져요', expected: 'contemplation' },

  // Preparation
  { input: '다음 주부터 시작하려고요', expected: 'preparation' },
  { input: '헬스장 등록했어요', expected: 'preparation' },

  // Action
  { input: '일주일째 하고 있어요', expected: 'action' },
  { input: '매일 30분씩 걷고 있어요', expected: 'action' },

  // Maintenance
  { input: '6개월째 꾸준히 하고 있어요', expected: 'maintenance' },
  { input: '이제 습관이 됐어요', expected: 'maintenance' }
];

// 목표: 20개 테스트 케이스 중 16개 이상 정확 (80%+)
```

### 7.2 OARS 적용 검증

```typescript
// tests/lib/coach/oars-validation.test.ts

describe('OARS 기법 적용 검증', () => {
  it('should generate open-ended questions', () => {
    const response = generateCoachResponse({
      userMessage: '운동이 어려워요',
      context: { stage: 'contemplation' }
    });

    // 열린 질문 패턴 확인
    expect(response).toMatch(/(어떤|어떻게|무엇이|왜.*까요\?)/);
    expect(response).not.toMatch(/하실 건가요\?/); // 닫힌 질문 금지
  });

  it('should include affirmation when appropriate', () => {
    const response = generateCoachResponse({
      userMessage: '오늘 처음으로 30분 걸었어요',
      context: { stage: 'action' }
    });

    // 인정 표현 포함 확인
    expect(response).toMatch(/(대단|잘하|노력|대해요)/);
  });
});
```

### 7.3 톤 일관성 테스트

```typescript
// tests/lib/coach/tone-validation.test.ts

describe('AI 톤 가이드라인 준수', () => {
  it('should not use judgmental language', () => {
    const response = generateCoachResponse({
      userMessage: '운동 안 했어요',
      context: {}
    });

    expect(response).not.toMatch(/왜.*안.*했/);
    expect(response).not.toMatch(/잘못/);
  });

  it('should maintain warmth', () => {
    const response = generateCoachResponse({
      userMessage: '힘들어요',
      context: {}
    });

    expect(response).toMatch(/(그러실 수 있|자연스러|충분히|힘드시|어려우시)/);
  });
});
```

---

## 8. 참고 자료

### 8.1 핵심 문헌

1. **TTM**
   - Prochaska, J.O., DiClemente, C.C., & Norcross, J.C. (1992). In search of how people change: Applications to addictive behaviors. *American Psychologist*, 47(9), 1102-1114.
   - Prochaska, J.O., & Velicer, W.F. (1997). The transtheoretical model of health behavior change. *American Journal of Health Promotion*, 12(1), 38-48.

2. **SDT**
   - Deci, E.L., & Ryan, R.M. (1985). *Intrinsic motivation and self-determination in human behavior*. New York: Plenum.
   - Ryan, R.M., & Deci, E.L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist*, 55(1), 68-78.

3. **MI**
   - Miller, W.R., & Rollnick, S. (2012). *Motivational interviewing: Helping people change* (3rd ed.). New York: Guilford Press.
   - Rollnick, S., Miller, W.R., & Butler, C.C. (2008). *Motivational interviewing in health care*. New York: Guilford Press.

4. **GROW**
   - Whitmore, J. (2009). *Coaching for performance: GROWing human potential and purpose* (4th ed.). London: Nicholas Brealey.

### 8.2 추가 자료

- [MINT (Motivational Interviewing Network of Trainers)](https://motivationalinterviewing.org/)
- [Self-Determination Theory - Official Site](https://selfdeterminationtheory.org/)
- [International Coach Federation - Core Competencies](https://coachingfederation.org/credentials-and-standards/core-competencies)

---

## 9. 관련 문서

### 원리 문서
- [ai-inference.md](./ai-inference.md) - AI 추론 원리, 프롬프팅
- [cross-domain-synergy.md](./cross-domain-synergy.md) - 크로스 도메인 통합

### ADR
- [ADR-027: Coach AI 스트리밍](../adr/ADR-027-coach-ai-streaming.md)
- [ADR-021: 엣지 케이스 및 폴백 전략](../adr/ADR-021-edge-cases-fallback.md)

### 스펙
- [SDD-COACH-AI-COMPREHENSIVE.md](../specs/SDD-COACH-AI-COMPREHENSIVE.md)
- [SDD-COACH-AI-CHAT.md](../specs/SDD-COACH-AI-CHAT.md)

---

**Version**: 1.0 | **Created**: 2026-01-21 | **Updated**: 2026-01-21
**Module**: Coach AI (COACH-AI-COMPREHENSIVE)
**Research Sources**: TTM, SDT, MI, GROW Model 학술 문헌
