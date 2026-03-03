# 습관 형성 과학 (Habit Formation Science)

> 이 문서는 캡슐 생태계(Capsule Ecosystem)의 기반이 되는 습관 형성 원리를 설명한다.
> Nir Eyal의 Hook Model, BJ Fogg의 Tiny Habits, James Clear의 Atomic Habits를 통합 적용.
> **모듈**: 캡슐 시스템, 대시보드, Smart Reminder, 게이미피케이션 공통

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"무의식적 습관으로 정착된 일일 웰니스 루틴"

- 사용자가 아침에 자연스럽게 앱을 열고 '오늘의 캡슐'을 확인한다
- 추천 수락이 1탭으로 완료되며, 결과가 즉시 피드백된다
- 사용 데이터가 축적될수록 추천 정확도가 높아져 이탈 비용이 증가한다
- DAU 70%+ 사용자가 '무의식적 습관'으로 앱을 사용한다
- 외부 트리거(푸시) 없이도 내부 트리거(감정/상황)로 앱을 열게 된다
```

### 물리적 한계

| 항목               | 한계                                                      |
| ------------------ | --------------------------------------------------------- |
| **습관 형성 기간** | 평균 66일 소요 (Lally et al., 2010), 최소 18일~최대 254일 |
| **알림 피로**      | 과도한 푸시 알림은 역효과 — 일 2회 초과 시 이탈률 증가    |
| **동기 변동성**    | 내적 동기는 일간/주간 변동이 큼, 일정한 유지 불가능       |
| **개인차**         | 같은 전략이 모든 사용자에게 동일하게 작동하지 않음        |
| **플랫폼 제약**    | iOS/Android 알림 정책 차이, 배경 실행 제한                |

### 100점 기준

| 지표                   | 100점 기준                          |
| ---------------------- | ----------------------------------- |
| **DAU/MAU**            | 50% 이상 (업계 우수 기준 20%)       |
| **7일 리텐션**         | 50% 이상                            |
| **30일 리텐션**        | 30% 이상                            |
| **습관 루프 완료율**   | 일일 캡슐 수락률 70%                |
| **내부 트리거 비율**   | 60% 이상 (푸시 없이 자발적 앱 오픈) |
| **평균 세션 빈도**     | 주 4회 이상                         |
| **Streak 7일 달성률**  | 30%                                 |
| **Streak 30일 달성률** | 10%                                 |

### 현재 목표

**60%** - 캡슐 시스템 MVP 습관 루프

- Hook Model 4단계 사이클 설계
- BJ Fogg B=MAP 기반 최소 행동 설계
- James Clear의 4법칙 적용
- 기본 Streak/Badge 게이미피케이션
- Smart Reminder 기초 (시간대 최적화)

### 의도적 제외

| 제외 항목                   | 이유                       | 재검토 시점 |
| --------------------------- | -------------------------- | ----------- |
| 소셜 습관 공유              | 소셜 모듈 안정화 후 연계   | Phase M     |
| ML 기반 개인 최적 시간 예측 | 사용 데이터 충분히 축적 후 | MAU 1만+    |
| 습관 코칭 AI 대화           | Coach AI 모듈과 통합 필요  | Coach AI v2 |
| 외부 헬스 디바이스 연동     | 하드웨어 의존성 최소화     | Phase N     |

---

## 1. 핵심 개념

### 1.1 Nir Eyal의 Hook Model

**출처**: _Hooked: How to Build Habit-Forming Products_ (Eyal, 2014)

습관 형성 제품은 4단계 사이클을 반복하여 사용자의 **내부 트리거**를 형성한다:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Hook Model 4단계 사이클                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. Trigger (계기)                                                     │
│      → 사용자가 앱을 여는 이유                                          │
│      → 외부 트리거 (푸시, 알림) → 내부 트리거 (감정, 상황) 전환이 목표 │
│                           │                                             │
│                           ▼                                             │
│   2. Action (행동)                                                      │
│      → 보상을 기대하며 수행하는 최소 행동                               │
│      → Fogg's B=MAP: 동기(M) x 능력(A) x 프롬프트(P)                   │
│                           │                                             │
│                           ▼                                             │
│   3. Variable Reward (가변 보상)                                        │
│      → 예측 불가능한 보상이 도파민 분비를 극대화                        │
│      → 3가지 유형: Tribe(사회적), Hunt(자원), Self(성취)                │
│                           │                                             │
│                           ▼                                             │
│   4. Investment (투자)                                                  │
│      → 사용자가 서비스에 가치를 저장                                    │
│      → 데이터 축적 → 이탈 비용 증가 → 다음 트리거 준비                 │
│                                                                          │
│   순환: Trigger → Action → Reward → Investment → (다시 Trigger)        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**핵심 원리**: 외부 트리거 → 내부 트리거 전환

| 단계       | 초기 (1~2주)     | 중기 (3~6주)          | 정착 (7주+)      |
| ---------- | ---------------- | --------------------- | ---------------- |
| **트리거** | 푸시 알림 (외부) | 상황 기반 (아침 루틴) | 감정 기반 (내부) |
| **의존도** | 외부 트리거 80%  | 혼합 50:50            | 내부 트리거 60%+ |

### 1.2 BJ Fogg의 Tiny Habits

**출처**: _Tiny Habits: The Small Changes That Change Everything_ (Fogg, 2019)

행동 발생 조건을 공식으로 정의:

```
B = MAP

B (Behavior) = M (Motivation) x A (Ability) x P (Prompt)

- Motivation (동기): 행동하려는 욕구 — 변동성이 높음
- Ability (능력): 행동의 쉬운 정도 — 설계로 제어 가능
- Prompt (프롬프트): 행동을 촉발하는 신호 — 시의적절해야 함

핵심 통찰:
동기가 낮더라도 능력이 충분히 쉬우면 행동이 발생한다.
→ 행동을 극단적으로 쉽게 만드는 것이 핵심 전략
```

**Fogg Behavior Grid**:

```
     높은 동기 ┤  ★ 행동 발생 영역 ★
              │  ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
              │  ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱
     중간 동기 ┤  ╱╱╱ Action Line ╱╱
              │  ╱╱╱╱╱╱╱╱╱╱╱╱╱╱
     낮은 동기 ┤  ╱╱╱╱╱╱╱╱╱╱╱╱
              │
              └──────────────────────
                어려움 ←──── 능력 ────→ 쉬움

→ Action Line 위: 행동 발생
→ Action Line 아래: 행동 미발생
→ 능력을 높이면(오른쪽 이동) Action Line이 내려감
```

**Tiny Habits Recipe**:

```
"[기존 습관] 이후에, [새로운 작은 행동]을 하겠다"

이룸 적용:
"아침에 세안한 이후에, 이룸 앱을 열어 오늘의 캡슐을 확인하겠다"
"점심 식사 후에, 영양 기록 1탭을 누르겠다"
```

### 1.3 James Clear의 Atomic Habits

**출처**: _Atomic Habits: An Easy & Proven Way to Build Good Habits_ (Clear, 2018)

습관 형성의 4법칙과 습관 루프:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Atomic Habits: 습관 루프                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Cue (단서)                                                            │
│   → 행동을 촉발하는 환경 신호                                          │
│   → "아침에 핸드폰을 든다"                                             │
│                    │                                                    │
│                    ▼                                                    │
│   Craving (갈망)                                                        │
│   → 보상에 대한 기대가 만드는 동기                                     │
│   → "오늘 피부 점수가 궁금하다"                                        │
│                    │                                                    │
│                    ▼                                                    │
│   Response (반응)                                                       │
│   → 실제 수행하는 행동                                                  │
│   → "앱을 열고 캡슐을 확인한다"                                        │
│                    │                                                    │
│                    ▼                                                    │
│   Reward (보상)                                                         │
│   → 행동의 결과로 얻는 만족감                                          │
│   → "피부 점수 +5, 코디 호환도 92%"                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**4법칙 (Laws of Behavior Change)**:

| 법칙      | 원칙                          | 이룸 캡슐 적용                             |
| --------- | ----------------------------- | ------------------------------------------ |
| **1법칙** | 분명하게 만들어라 (Cue)       | 앱 아이콘 뱃지, 위젯에 "오늘의 캡슐" 표시  |
| **2법칙** | 매력적으로 만들어라 (Craving) | "오늘의 피부 점수", "코디 호환도" 미리보기 |
| **3법칙** | 쉽게 만들어라 (Response)      | 1탭으로 캡슐 수락, 2초 이내 완료           |
| **4법칙** | 만족스럽게 만들어라 (Reward)  | 즉각적 시각 피드백 + Streak 카운터 증가    |

### 1.4 세 이론의 통합 매핑

```
┌────────────────────────────────────────────────────────────────┐
│              Hook Model  ←→  Atomic Habits  ←→  Tiny Habits   │
├────────────────────────────────────────────────────────────────┤
│  Trigger          Cue + Craving        Prompt                 │
│  Action           Response             Behavior (B=MAP)       │
│  Variable Reward  Reward               Celebration            │
│  Investment       (습관 정체성 강화)    (Anchor → Habit)       │
└────────────────────────────────────────────────────────────────┘

통합 루프:
Trigger/Cue → Craving → Action (B=MAP) → Variable Reward → Investment
     ↑                                                          │
     └──────────────────────────────────────────────────────────┘
```

---

## 2. 과학적/심리학적 기반

### 2.1 도파민과 보상 예측 (Reward Prediction Error)

**이론**: Schultz et al. (1997), "A neural substrate of prediction and reward"

```
도파민 반응 = 실제 보상 - 예측 보상

Case 1: 실제 > 예측 → 도파민 ↑ (긍정적 서프라이즈)
  예: "피부 점수가 예상보다 +12 올랐어요!" → 다시 확인하고 싶음

Case 2: 실제 = 예측 → 도파민 → (기대대로)
  예: 매번 같은 피부 점수 → 습관 유지만, 강화 없음

Case 3: 실제 < 예측 → 도파민 ↓ (실망)
  예: 점수가 떨어졌지만 "개선 방법"이 함께 제공 → 실망 완화
```

**가변 보상(Variable Reward)이 중요한 이유**:

- 고정 보상은 예측 가능 → 도파민 반응 감소 → 무감각화 (Hedonic Adaptation)
- 가변 보상은 예측 불가능 → 도파민 반응 유지 → 반복 행동 강화

### 2.2 습관 형성의 신경과학 (Habit Loop)

**이론**: Duhigg (2012), _The Power of Habit_; Graybiel (2008), "Habits, Rituals, and the Evaluative Brain"

```
습관 형성 뇌 영역:

1단계 (의식적): 전전두엽 피질 (Prefrontal Cortex) 활성
   → 의사결정, 노력 필요, 에너지 소모 높음

2단계 (전환기): 전전두엽 → 기저핵 (Basal Ganglia) 이관
   → 반복에 의해 자동화 진행

3단계 (자동화): 기저핵 주도
   → 의식적 노력 불필요, 에너지 소모 최소
   → "습관화" 완료
```

**Chunking (청킹)**: 여러 행동이 하나의 자동 루틴으로 묶이는 현상

```
개별 행동: 앱 열기 → 캡슐 확인 → 수락 → 결과 보기
청킹 후: "아침 루틴" (하나의 자동 단위)
```

### 2.3 2분 규칙 (Two-Minute Rule)

**출처**: Clear (2018), Fogg (2019) 공통

```
모든 새 습관은 2분 이내로 시작할 수 있어야 한다.

원리:
- 뇌는 "시작"이 가장 큰 저항
- 시작만 하면 "진행 중 효과" (Endowed Progress Effect)로 계속하게 됨
- 작은 행동이 큰 행동의 "게이트웨이"

이룸 캡슐 적용:
- 캡슐 확인: 3초 (앱 열기 → 캡슐 카드 보기)
- 캡슐 수락: 1초 (탭 1회)
- 결과 확인: 5초 (피드백 화면)
→ 전체 최소 루프: 10초 이내
```

### 2.4 Endowed Progress Effect (부여된 진전 효과)

**이론**: Nunes & Dreze (2006), "The Endowed Progress Effect"

```
실험: 세차 스탬프 카드
- 카드 A: 8칸 중 0칸 완료 (0/8)
- 카드 B: 10칸 중 2칸 완료 (2/10) ← 실질 동일
→ 카드 B 완료율 34% 높음

원리:
이미 진행이 시작된 것처럼 보이면 완료 동기가 증가한다.

이룸 적용:
- 온보딩 완료 시: "웰니스 여정 1/7 완료!"
- 첫 분석 후: "프로필 40% 완성 — 피부 분석하면 70%!"
- Streak: "3일 연속! 7일까지 4일 남았어요"
```

### 2.5 Variable Reward의 3가지 유형

**이론**: Eyal (2014), based on Skinner's variable-ratio reinforcement

```
1. Rewards of the Tribe (사회적 보상)
   → 타인과의 연결, 소속감, 인정
   → 이룸: "같은 타입 사용자 중 상위 15%", 소셜 피드 좋아요

2. Rewards of the Hunt (자원 보상)
   → 물질적/정보적 자원 획득
   → 이룸: "오늘의 피부 점수 78점", "새 코디 추천 3개"

3. Rewards of the Self (자기 성취 보상)
   → 역량 입증, 완수감, 숙달
   → 이룸: "7일 연속 달성!", "피부 +12% 개선"
```

---

## 3. 캡슐 시스템 적용 설계

### 3.1 캡슐 DAU 루프 (Daily Active User Loop)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      캡슐 DAU 루프 설계                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ① Trigger: 아침 앱 오픈                                              │
│      ├── 외부: Smart Reminder 푸시 (08:00)                              │
│      ├── 내부: "오늘 피부 어떨까?" (아침 세안 후 감정)                  │
│      └── 환경: 홈화면 위젯 "오늘의 캡슐 대기 중"                       │
│                           │                                             │
│                           ▼                                             │
│   ② Action: One-Button Daily (1탭 수락)                                │
│      ├── 화면: "오늘의 캡슐" 카드 표시                                  │
│      ├── 내용: 스킨케어 루틴 + 코디 추천 + 영양 팁                     │
│      ├── 조작: [수락] 탭 1회 (2초 이내)                                 │
│      └── B=MAP: M(궁금함) x A(1탭) x P(카드 표시)                      │
│                           │                                             │
│                           ▼                                             │
│   ③ Variable Reward: 예측 불가능한 피드백                               │
│      ├── Hunt: "오늘의 피부 점수 82점" (매일 변동)                      │
│      ├── Hunt: "코디 호환도 94%" (날씨/일정 연동)                       │
│      ├── Self: "3일 연속 루틴 완수!" (Streak)                           │
│      └── Tribe: "같은 타입 사용자 평균보다 +8점" (비교)                 │
│                           │                                             │
│                           ▼                                             │
│   ④ Investment: 데이터 축적 → 추천 정확도 향상                         │
│      ├── 사용 패턴 학습 → 내일 캡슐이 더 정확해짐                      │
│      ├── 히스토리 축적 → "나만의 웰니스 데이터" 형성                    │
│      ├── Streak 증가 → 이탈 비용 증가                                   │
│      └── 다음 트리거 준비: "내일 피부 변화 기대"                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 캡슐 수락 행동의 B=MAP 분석

```
Behavior = Motivation x Ability x Prompt

┌──────────────────────────────────────────────────────┐
│ 요소        │ 현재 설계             │ 최적화 방향      │
├──────────────────────────────────────────────────────┤
│ Motivation  │ "오늘 피부/코디 궁금"  │ 가변 보상 강화   │
│   (M)       │ 중간 수준 (변동 있음) │ Craving 유도     │
├──────────────────────────────────────────────────────┤
│ Ability     │ 1탭 수락              │ 0-friction 목표  │
│   (A)       │ 매우 높음 (2초 이내)  │ 더 줄일 수 없음  │
├──────────────────────────────────────────────────────┤
│ Prompt      │ 푸시 + 위젯 + 홈카드  │ 상황 기반 최적화 │
│   (P)       │ 적시성 중요           │ ML 시간대 예측   │
└──────────────────────────────────────────────────────┘

전략: Ability를 극대화하여 Motivation이 낮은 날에도 행동 발생 유도
```

### 3.3 가변 보상 설계 (Variable Reward Matrix)

| 보상 유형        | 요소              | 변동 원인              | 빈도     |
| ---------------- | ----------------- | ---------------------- | -------- |
| **Hunt** (자원)  | 피부 점수 (0-100) | 실제 피부 상태 변화    | 매일     |
| **Hunt** (자원)  | 코디 호환도 (%)   | 날씨, 일정, 계절 변화  | 매일     |
| **Hunt** (자원)  | 새 제품 추천      | 신제품 입고, 시즌 변경 | 주 1-2회 |
| **Self** (성취)  | Streak 카운터     | 사용 연속일수          | 매일     |
| **Self** (성취)  | 뱃지 획득         | 특정 조건 달성         | 비정기   |
| **Self** (성취)  | 주간 개선률       | 분석 결과 비교         | 주 1회   |
| **Tribe** (사회) | 타입별 순위       | 동일 타입 사용자 비교  | 주 1회   |
| **Tribe** (사회) | 친구 활동 알림    | 친구 분석 완료         | 비정기   |

### 3.4 Investment 전략 (이탈 비용 설계)

```
데이터 축적에 의한 이탈 비용 곡선:

이탈 비용
    │
    │                           ╱ 높은 이탈 비용
    │                        ╱   (6개월+ 데이터)
    │                     ╱
    │                  ╱
    │              ╱       중간 이탈 비용
    │          ╱           (1-3개월 데이터)
    │      ╱
    │  ╱       낮은 이탈 비용
    │╱         (1주 이내)
    └──────────────────────────── 사용 기간

핵심: 사용 기간이 길어질수록 "나만의 웰니스 데이터"가 축적되어
      다른 앱으로 전환하기 어려워진다.
```

**Investment 요소**:

| 투자 항목          | 축적 방식      | 이탈 시 손실         |
| ------------------ | -------------- | -------------------- |
| 피부 변화 히스토리 | 매일/매주 분석 | 장기 추이 데이터     |
| 개인화된 추천 모델 | 사용 패턴 학습 | 정확도 높은 추천     |
| 웰니스 프로필      | 분석 결과 통합 | 퍼스널컬러+피부+체형 |
| Streak / 뱃지      | 꾸준한 사용    | 게이미피케이션 진전  |
| 코디 히스토리      | 매일 캡슐 수락 | 스타일 선호 학습     |

---

## 4. Smart Reminder 과학

### 4.1 최적 알림 타이밍

**이론**: Mehrotra et al. (2016), "My Phone and Me"; Pielot et al. (2017), "Beyond Interruptibility"

```
최적 알림 시점 결정 요소:

1. 상황 기반 (Context-Aware)
   - 아침 루틴 시간대 (개인별 학습)
   - 위치 기반 (집에 있을 때)
   - 이전 앱 사용 시간 패턴

2. 간격 기반 (Spaced Repetition)
   - 마지막 사용 후 적절한 간격
   - 망각 곡선(Ebbinghaus) 원리 적용:
     간격이 길수록 리마인더 효과 큼

3. 피로 방지 (Notification Fatigue)
   - 일 최대 2회 알림
   - 연속 무시 3회 시 빈도 자동 감소
   - 주말/공휴일 패턴 차별화
```

### 4.2 Spaced Repetition 알림 스케줄

```
Ebbinghaus 망각 곡선 기반 리마인더:

기억 유지율
100%│★
    │ ╲
 80%│  ╲  ★ (1일 후 리마인더 → 기억 복원)
    │   ╲╱ ╲
 60%│       ╲  ★ (3일 후 리마인더 → 기억 복원)
    │        ╲╱  ╲
 40%│              ╲  ★ (7일 후 리마인더)
    │               ╲╱
 20%│
    └──────────────────────── 시간

이룸 알림 간격:
- 신규 사용자: Day 1, 2, 4, 7, 14, 30
- 활성 사용자: 매일 아침 1회 (사용 시간대 학습)
- 이탈 위험: Day 3, 5, 7 (미사용 시)
- 복귀 유도: Day 14, 30, 60 (장기 미사용)
```

### 4.3 알림 메시지 설계 원칙

```
효과적 알림 = 구체적 가치 + 호기심 유발 + 행동 용이성

✅ 좋은 예:
"어제보다 피부 수분이 +8% 올라갔어요! 오늘도 확인해볼까요?"
→ 구체적 수치(가치) + 비교(호기심) + 질문(프롬프트)

"오늘의 캡슐이 준비됐어요. 코디 호환도가 궁금하지 않으세요?"
→ 준비 완료(가치) + 미지(호기심) + 질문(프롬프트)

"5일 연속 달성까지 딱 1일! 지금 확인하면 뱃지 획득!"
→ 근접 목표(가치) + 달성감(호기심) + 보상(프롬프트)

❌ 나쁜 예:
"이룸을 사용해주세요"
→ 가치 없음, 호기심 없음, 강요

"오늘 분석을 안 하셨어요"
→ 부정적 톤, 죄책감 유발
```

---

## 5. 게이미피케이션 심리학

### 5.1 진전 시각화 (Progress Visualization)

**이론**: Amabile & Kramer (2011), _The Progress Principle_

```
진전의 힘:
"사소한 승리(Small Wins)가 내적 동기를 가장 강력하게 강화한다"

- 큰 목표를 작은 단위로 분할
- 각 단위 완료 시 즉각적 시각 피드백
- 누적 진전을 항상 볼 수 있게

이룸 진전 요소:
┌──────────────────────────────────────────────────┐
│ 프로필 완성도        [████████░░░░░░░░] 70%      │
│ 이번 주 캡슐 수락    [●●●●●○○] 5/7               │
│ 피부 개선 추이        +15% (30일)                 │
│ 뱃지 컬렉션          12/30 획득                   │
└──────────────────────────────────────────────────┘
```

### 5.2 Streak 시스템 설계

**이론**: Cialdini (2006), _Influence_ - Commitment & Consistency Principle

```
일관성의 원칙:
"사람은 이전 행동과 일관되게 행동하려는 강한 욕구가 있다"
→ Streak가 길어질수록 "깨기 싫은" 심리가 강해짐

Streak 보상 체계:
┌─────────────────────────────────────────────┐
│ 기간        │ 보상                           │
├─────────────────────────────────────────────┤
│ 3일 연속    │ 브론즈 불꽃 아이콘             │
│ 7일 연속    │ 실버 불꽃 + 주간 인사이트       │
│ 14일 연속   │ 골드 불꽃 + 특별 뱃지           │
│ 30일 연속   │ 다이아몬드 불꽃 + 상세 리포트   │
│ 100일 연속  │ 레전드 불꽃 + 독점 기능         │
└─────────────────────────────────────────────┘

Streak 보호 메커니즘:
- Freeze 1회/월: Streak 깨짐 방지 (미리 사용)
- Grace Period: 자정까지 → 오전 3시까지 연장
```

### 5.3 뱃지 시스템 (Badge Psychology)

**이론**: Ryan & Deci (2000), SDT; Deterding et al. (2011), "Gamification"

```
뱃지 설계 원칙:

1. 유능감(Competence) 강화 뱃지
   - "피부 전문가" (피부 분석 10회)
   - "스타일 마스터" (코디 캡슐 30회 수락)
   - "7일 워리어" (Streak 7일)

2. 자율성(Autonomy) 강화 뱃지
   - "탐험가" (모든 분석 모듈 1회 이상)
   - "큐레이터" (내 코디 컬렉션 5개)

3. 관계성(Relatedness) 강화 뱃지
   - "인플루언서" (친구 3명 초대)
   - "공감왕" (소셜 피드 좋아요 50회)

⚠️ 주의: 과도한 외적 보상은 내적 동기를 훼손할 수 있음 (Overjustification Effect)
→ 뱃지는 "인정"이지 "보상"이 아님
→ 핵심 가치(웰니스 개선)가 항상 중심
```

### 5.4 Loss Aversion (손실 회피) 활용

**이론**: Kahneman & Tversky (1979), Prospect Theory

```
손실 회피:
"동일한 크기의 이득보다 손실이 약 2배 더 강하게 느껴진다"

이룸 적용 (윤리적 범위 내):
✅ 허용:
- "내일 분석하면 Streak 유지!" (Streak 손실 방지)
- "7일 기록이 쌓였어요. 계속 해볼까요?" (축적 가치 인지)

❌ 금지:
- "안 하면 데이터가 사라져요" (위협적 톤)
- "친구들이 앞서가고 있어요" (과도한 경쟁 유발)

원칙: 손실 회피는 "긍정적 프레이밍"으로만 활용
```

---

## 6. 구현 도출

### 6.1 원리 → 알고리즘

```
습관 형성 3-Phase 알고리즘:

Phase A: 외부 트리거 의존기 (Day 1-14)
├── Smart Reminder 활성: 매일 학습된 최적 시간에 푸시
├── Onboarding Progress: 부여된 진전 효과 (1/7 완료)
├── 첫 Streak 도전: 3일 연속 → 브론즈 뱃지
└── 가변 보상 강조: 매일 다른 피부 점수 + 코디 추천

Phase B: 혼합 트리거 전환기 (Day 15-45)
├── Smart Reminder 점진적 감소: 사용 패턴 안정 시 알림 축소
├── 내부 트리거 강화: "아침 루틴" 앵커링
├── Investment 가시화: "30일 데이터로 정확도 2배 향상"
└── 중기 Streak: 14일, 30일 목표 제시

Phase C: 내부 트리거 정착기 (Day 46+)
├── Smart Reminder 최소화: 미사용 시에만 복귀 알림
├── 자동화된 습관: 의식적 노력 없이 앱 오픈
├── 장기 Investment: "나만의 웰니스 데이터 6개월"
└── 유지 보상: 장기 뱃지, 연간 리포트
```

### 6.2 알고리즘 → 코드 설계

```typescript
// lib/capsule/habit-loop.ts

interface HabitPhase {
  phase: 'external' | 'mixed' | 'internal';
  daysSinceSignup: number;
  streakCount: number;
  reminderFrequency: 'high' | 'medium' | 'low';
  internalTriggerRatio: number; // 0-1
}

// 사용자 습관 단계 판정
function determineHabitPhase(
  daysSinceSignup: number,
  pushOpenRate: number, // 푸시로 앱 연 비율
  organicOpenRate: number // 자발적으로 앱 연 비율
): HabitPhase {
  const internalRatio = organicOpenRate / (pushOpenRate + organicOpenRate);

  if (daysSinceSignup <= 14 || internalRatio < 0.3) {
    return {
      phase: 'external',
      daysSinceSignup,
      streakCount: 0,
      reminderFrequency: 'high',
      internalTriggerRatio: internalRatio,
    };
  }

  if (daysSinceSignup <= 45 || internalRatio < 0.6) {
    return {
      phase: 'mixed',
      daysSinceSignup,
      streakCount: 0,
      reminderFrequency: 'medium',
      internalTriggerRatio: internalRatio,
    };
  }

  return {
    phase: 'internal',
    daysSinceSignup,
    streakCount: 0,
    reminderFrequency: 'low',
    internalTriggerRatio: internalRatio,
  };
}
```

```typescript
// lib/capsule/variable-reward.ts

interface VariableReward {
  type: 'tribe' | 'hunt' | 'self';
  title: string;
  value: string;
  surprise: boolean; // 예측 불가능한 보상인가
}

// 오늘의 가변 보상 생성
function generateDailyRewards(
  userProfile: UserProfile,
  todayAnalysis: DailyAnalysis,
  previousAnalysis: DailyAnalysis | null
): VariableReward[] {
  const rewards: VariableReward[] = [];

  // Hunt: 피부 점수 (매일 변동)
  rewards.push({
    type: 'hunt',
    title: '오늘의 피부 점수',
    value: `${todayAnalysis.skinScore}점`,
    surprise: false,
  });

  // Hunt: 변화 감지 (서프라이즈)
  if (previousAnalysis) {
    const delta = todayAnalysis.skinScore - previousAnalysis.skinScore;
    if (Math.abs(delta) >= 5) {
      rewards.push({
        type: 'hunt',
        title: delta > 0 ? '피부 개선 감지!' : '피부 변화 감지',
        value: `${delta > 0 ? '+' : ''}${delta}점`,
        surprise: true, // 예측 불가능
      });
    }
  }

  // Self: Streak (달성감)
  if (todayAnalysis.streakCount > 0 && todayAnalysis.streakCount % 7 === 0) {
    rewards.push({
      type: 'self',
      title: `${todayAnalysis.streakCount}일 연속 달성!`,
      value: getStreakBadge(todayAnalysis.streakCount),
      surprise: true,
    });
  }

  return rewards;
}
```

### 6.3 Smart Reminder 알고리즘

```typescript
// lib/reminder/smart-scheduler.ts

interface ReminderSchedule {
  time: string; // HH:mm
  message: string;
  priority: 'high' | 'medium' | 'low';
  type: 'morning' | 'streak' | 'reengagement' | 'weekly';
}

// 최적 알림 시간 계산
function calculateOptimalReminderTime(
  usageHistory: AppUsage[], // 최근 30일 사용 기록
  habitPhase: HabitPhase
): string {
  // 가장 빈번한 앱 오픈 시간대 (30분 단위)
  const hourCounts = new Map<number, number>();

  for (const usage of usageHistory) {
    const hour = new Date(usage.openedAt).getHours();
    const halfHour = Math.floor(hour * 2 + new Date(usage.openedAt).getMinutes() / 30);
    hourCounts.set(halfHour, (hourCounts.get(halfHour) ?? 0) + 1);
  }

  // 최빈 시간대의 30분 전에 알림 (프롬프트 역할)
  const peakSlot = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 16; // 기본 08:00

  const reminderSlot = Math.max(peakSlot - 1, 12); // 최소 06:00
  const hour = Math.floor(reminderSlot / 2);
  const minute = (reminderSlot % 2) * 30;

  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Spaced Repetition 기반 재참여 알림
function getReengagementSchedule(daysSinceLastUse: number): ReminderSchedule | null {
  const REENGAGEMENT_DAYS = [3, 5, 7, 14, 30, 60];

  if (REENGAGEMENT_DAYS.includes(daysSinceLastUse)) {
    return {
      time: '09:00',
      message: getReengagementMessage(daysSinceLastUse),
      priority: daysSinceLastUse <= 7 ? 'high' : 'medium',
      type: 'reengagement',
    };
  }

  return null;
}
```

---

## 7. 검증 방법

### 7.1 습관 루프 완성도 테스트

| 검증 항목           | 방법                   | 기준                                   |
| ------------------- | ---------------------- | -------------------------------------- |
| **Trigger 도달률**  | 푸시 알림 오픈율 측정  | Phase A: 15%+, B: 10%+, C: 자발적 60%+ |
| **Action 완료율**   | 캡슐 수락률 추적       | 전체 70%+                              |
| **Reward 만족도**   | 보상 후 세션 지속 시간 | 30초 이상 추가 탐색                    |
| **Investment 축적** | 월별 데이터 포인트 수  | 월 15개+ (주 4회)                      |
| **루프 순환율**     | 일 → 다음 일 복귀율    | Day 1→2: 60%, Day 7→8: 50%             |

### 7.2 B=MAP 균형 검증

```typescript
// tests/lib/capsule/habit-loop.test.ts

describe('Habit Loop B=MAP 검증', () => {
  it('Action이 2분 이내에 완료 가능해야 한다', () => {
    const startTime = Date.now();
    // 캡슐 로드 + 표시 + 수락 시뮬레이션
    const capsule = loadDailyCapsule(mockUser);
    const accepted = acceptCapsule(capsule.id);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000); // 2초 이내
    expect(accepted).toBe(true);
  });

  it('낮은 동기 상태에서도 행동이 가능해야 한다 (Ability 극대화)', () => {
    // 1탭으로 완료 가능한지 검증
    const requiredTaps = countRequiredTaps('capsule-accept');
    expect(requiredTaps).toBeLessThanOrEqual(1);
  });
});
```

### 7.3 가변 보상 다양성 검증

```typescript
// tests/lib/capsule/variable-reward.test.ts

describe('Variable Reward 다양성', () => {
  it('7일간 동일한 보상이 반복되지 않아야 한다', () => {
    const weekRewards: VariableReward[][] = [];

    for (let day = 0; day < 7; day++) {
      const rewards = generateDailyRewards(
        mockUser,
        mockAnalyses[day],
        day > 0 ? mockAnalyses[day - 1] : null
      );
      weekRewards.push(rewards);
    }

    // 서프라이즈 보상이 주 2회 이상
    const surpriseCount = weekRewards.flat().filter((r) => r.surprise).length;
    expect(surpriseCount).toBeGreaterThanOrEqual(2);
  });

  it('3가지 보상 유형(tribe/hunt/self)이 주간에 모두 포함', () => {
    const weekRewards = generateWeekRewards(mockUser, mockWeekData);
    const types = new Set(weekRewards.flat().map((r) => r.type));

    expect(types.has('tribe')).toBe(true);
    expect(types.has('hunt')).toBe(true);
    expect(types.has('self')).toBe(true);
  });
});
```

### 7.4 리텐션 메트릭 기준

| 지표            | 목표 | 경고  | 심각  |
| --------------- | ---- | ----- | ----- |
| D1 Retention    | 60%+ | < 50% | < 40% |
| D7 Retention    | 40%+ | < 30% | < 20% |
| D30 Retention   | 25%+ | < 15% | < 10% |
| DAU/MAU         | 30%+ | < 20% | < 15% |
| 캡슐 수락률     | 70%+ | < 50% | < 30% |
| Streak 7일 달성 | 25%+ | < 15% | < 10% |

---

## 8. 윤리적 고려 (Ethical Guardrails)

### 8.1 습관 형성 vs 중독

```
핵심 구분:
- 습관 형성: 사용자에게 가치를 제공하는 반복 행동 유도
- 중독: 사용자에게 해로운 강박적 사용 유발

이룸의 윤리 원칙:
1. 가치 중심: 모든 루프의 중심은 "웰니스 개선"
2. 자율성 존중: 알림 끄기/줄이기 쉽게 제공
3. 투명성: "왜 이 추천을 하는지" 항상 설명
4. 건강한 사용: 일 1회 캡슐이 최적, 과도한 사용 유도 안 함
5. 이탈 자유: 데이터 내보내기, 계정 삭제 쉽게 제공
```

### 8.2 Dark Pattern 금지 목록

```
❌ 절대 금지:
- Confirmshaming ("정말 포기하시겠어요?")
- Hidden unsubscribe (알림 해제 어렵게)
- Forced continuity (무의식적 과금)
- Social pressure ("친구들은 다 하고 있어요")
- Fake urgency ("지금 안 하면 혜택 사라짐")

✅ 윤리적 습관 설계:
- 긍정적 프레이밍 ("내일도 함께 해요!")
- 쉬운 알림 관리 (설정 1탭 접근)
- 투명한 데이터 사용 안내
- 자발적 선택 존중
```

---

## 9. 참고 자료

### 9.1 핵심 문헌

1. **Hook Model**
   - Eyal, N. (2014). _Hooked: How to Build Habit-Forming Products_. Portfolio/Penguin.
   - Eyal, N. (2019). _Indistractable: How to Control Your Attention and Choose Your Life_. Bloomsbury.

2. **Tiny Habits**
   - Fogg, B.J. (2019). _Tiny Habits: The Small Changes That Change Everything_. Houghton Mifflin Harcourt.
   - Fogg, B.J. (2009). A behavior model for persuasive design. _Proceedings of Persuasive '09_.

3. **Atomic Habits**
   - Clear, J. (2018). _Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones_. Avery.

4. **도파민과 보상**
   - Schultz, W., Dayan, P., & Montague, P.R. (1997). A neural substrate of prediction and reward. _Science_, 275(5306), 1593-1599.
   - Berridge, K.C., & Robinson, T.E. (2016). Liking, wanting, and the incentive-sensitization theory of addiction. _American Psychologist_, 71(8), 670.

5. **습관 형성 기간**
   - Lally, P., van Jaarsveld, C.H.M., Potts, H.W.W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. _European Journal of Social Psychology_, 40(6), 998-1009.

6. **진전 효과**
   - Nunes, J.C., & Dreze, X. (2006). The endowed progress effect: How artificial advancement increases effort. _Journal of Consumer Research_, 32(4), 504-512.
   - Amabile, T.M., & Kramer, S.J. (2011). _The Progress Principle_. Harvard Business Review Press.

7. **손실 회피**
   - Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. _Econometrica_, 47(2), 263-291.

8. **게이미피케이션**
   - Deterding, S., Dixon, D., Khaled, R., & Nacke, L. (2011). From game design elements to gamefulness. _MindTrek '11_.
   - Cialdini, R.B. (2006). _Influence: The Psychology of Persuasion_ (Revised Edition). Harper Business.

### 9.2 관련 이룸 문서

- [docs/HOOK-MODEL.md](../HOOK-MODEL.md) - Hook Model 설계서 v4.0 (실무 상세)
- [coaching-psychology.md](./coaching-psychology.md) - AI 코칭 심리학 (SDT, MI)
- [personalization-engine.md](./personalization-engine.md) - 개인화 추천 엔진 (3-3-3 Rule)
- [cross-domain-synergy.md](./cross-domain-synergy.md) - 크로스 도메인 시너지

### 9.3 관련 ADR / 스펙

| 문서               | 설명                                               |
| ------------------ | -------------------------------------------------- |
| docs/HOOK-MODEL.md | Hook Model 4단계 실무 설계, 모듈별 구현 체크리스트 |

---

**Version**: 1.0 | **Created**: 2026-03-03
**Module**: 캡슐 시스템, Smart Reminder, 게이미피케이션
**Research Sources**: Eyal (2014), Fogg (2019), Clear (2018), Schultz et al. (1997), Lally et al. (2010)
