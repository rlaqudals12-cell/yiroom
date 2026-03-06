# UX 디자인 원칙

> 이룸 프로젝트의 사용자 경험 설계 기반 원리
> **적용 대상**: 모든 UI/UX 의사결정

---

## 1. 핵심 철학

```
"분석 도구가 아니라, 나를 아는 동반자"

사용자는 분석을 하러 오는 게 아니라
자신에게 맞는 답을 찾으러 온다.
```

---

## 2. 디자인 원칙 (6대 원칙)

### P-UX1: 하나의 행동 (One Action)

> Steve Jobs — "Focus is about saying no to 1,000 things"

- 한 화면에서 사용자에게 요구하는 행동은 **1개**
- CTA(Call to Action)가 2개 이상이면 Hick's Law에 의해 결정 지연
- 보조 행동은 시각적으로 약하게 처리 (텍스트 링크, 작은 폰트)

```
적용 기준:
- Primary CTA: 화면당 최대 1개 (버튼)
- Secondary: 텍스트 링크 또는 하단 배치
- Tertiary: 스크롤 아래에 배치
```

### P-UX2: 정보가 아닌 행동 (Action over Information)

> Don Norman — Behavioral Level of Emotional Design

- 분석 결과를 수치로 나열하지 않고 **"다음에 할 일"**로 전환
- 숫자보다 맥락이 있는 문장을 우선
- 상세 수치는 "더 보기"로 숨김 (Progressive Disclosure)

```
Bad:  "수분도: 65, 유분: 45, 민감도: 30"
Good: "볼이 당기는 복합성 피부예요. 아침엔 수분 세럼을 추천해요."
```

### P-UX3: 매번 다른 이유 (Dynamic Value)

> Zeigarnik Effect + Peak-End Rule

- 앱을 열 때마다 **오늘의 맥락**(날씨, 시간, 계절)에 맞는 제안
- 고정된 대시보드가 아니라 동적으로 변하는 홈
- 피크 경험(분석 완료 순간)에 감정적 보상 제공

```
적용: 날씨 API + 시간대 + 사용자 데이터 → 개인화 한 줄 제안
```

### P-UX4: 최소 디자인 (As Little As Possible)

> Dieter Rams — Principle #10: "Good design is as little design as possible"

- 콘텐츠가 주인공, UI는 투명해야 함 (Apple HIG: Deference)
- 장식적 요소(그라데이션, 아이콘 과다, 배지) 최소화
- 여백으로 고급감과 가독성 확보
- 색상은 브랜드 컬러 1개 + 뉴트럴

```
적용 기준:
- 카드 간 간격: 최소 20px (gap-5)
- 한 화면 정보 블록: 5개 이하 (Miller's Law 7±2)
- 강조색: CTA에만 사용
```

### P-UX5: 발견의 기쁨 (Joy of Discovery)

> Don Norman — Reflective Level + Zeigarnik Effect

- 프로그레스를 "의무"가 아닌 "발견"으로 프레이밍
- "2/5 완료"가 아니라 "나에 대해 2가지를 발견했어요"
- 다음 분석의 이유를 이전 결과와 인과 연결

```
Bad:  "체형 분석 해보기"
Good: "봄웜톤에 맞는 코디를 추천하려면 체형 정보가 필요해요"
```

### P-UX6: 장벽 제거 (Zero Friction)

> Fitts' Law + Noom Progressive Disclosure

- CTA 버튼은 엄지 닿는 곳에 (모바일 하단)
- 사진 거부감 → 설문 대안 항상 제공
- 회원가입 전 가치를 먼저 보여주기
- 이탈 시점에 사회적 증거 삽입 ("오늘 127명이 분석했어요")

---

## 3. 3-State 홈 모델

사용자의 분석 완료 수에 따라 홈 화면이 자동으로 전환:

| State       | 조건       | 핵심 요소                   | 감정 목표                       |
| ----------- | ---------- | --------------------------- | ------------------------------- |
| **New**     | 분석 0개   | Single CTA + Social Proof   | "와, 깔끔하다" (Visceral)       |
| **Growing** | 1~3개 완료 | 발견 프로그레스 + 인과 추천 | "더 알고 싶다" (Behavioral)     |
| **Active**  | 4+ 완료    | 오늘의 제안 + CCS 비교      | "없으면 불편한 앱" (Reflective) |

---

## 4. 사용자 언어 규칙

### 톤

- 해요체 통일 ("~해요", "~이에요")
- 전문 용어 0개 (사용자 대면 텍스트)
- 따뜻하고 초대하는 톤, 명령적 톤 금지

### 에러 메시지

- 기술 용어 금지 (`err.message` 직접 노출 금지)
- 사용자가 **다음에 할 행동**을 알려주는 메시지
- 예: "네트워크 연결을 확인하고 다시 시도해주세요"

### 빈 상태 (Empty State)

- "데이터가 없습니다" 금지
- 가치 제안 + CTA: "아직 분석 결과가 없어요. 피부 분석부터 시작해볼까요?"

---

## 5. 감정 설계 (Norman's 3 Levels)

### Visceral (첫인상)

- 미니멀 레이아웃, 충분한 여백
- 브랜드 컬러의 따뜻함
- 로딩 시 스켈레톤 (깜빡임 없음)

### Behavioral (사용성)

- 목표까지 최대 5단계 이내
- 2탭 이내 원하는 정보 접근
- 명확한 피드백 (체크 애니메이션, 진행 표시)

### Reflective (의미)

- "이 앱이 나를 안다" 느낌 — 개인화 인사이트
- 시간이 지날수록 깊어지는 분석 — "지난주보다 수분도 5% 올랐어요"
- 공유 가치 — 분석 결과를 SNS에 공유하고 싶은 결과 카드

---

## 6. Laws of UX 적용표

| 법칙              | 이룸 적용               | 위반 시 결과        |
| ----------------- | ----------------------- | ------------------- |
| **Hick's Law**    | 화면당 CTA 1개          | 선택 마비, 이탈     |
| **Fitts' Law**    | Primary CTA 크고 가까이 | 클릭률 저하         |
| **Miller's Law**  | 정보 블록 5개 이하      | 인지 과부하         |
| **Peak-End Rule** | 분석 완료 = 피크 경험   | 재방문 동기 없음    |
| **Zeigarnik**     | 미완성 프로그레스       | 다음 분석 동기 없음 |
| **Jakob's Law**   | 익숙한 패턴 사용        | 학습 비용           |

---

## 7. 체크리스트

### 새 화면 설계 시

- [ ] Primary CTA가 1개인가?
- [ ] 정보 블록이 5개 이하인가?
- [ ] 수치보다 행동 제안이 먼저인가?
- [ ] 로딩/에러/빈 상태 3종이 있는가?
- [ ] 전문 용어가 없는가?
- [ ] 모바일에서 엄지로 주요 버튼 닿는가?

### 기존 화면 개선 시

- [ ] 장식적 요소를 줄일 수 있는가?
- [ ] 여백을 늘릴 수 있는가?
- [ ] CTA 수를 줄일 수 있는가?

---

## 8. 시각화 원칙 (Visualization Principles)

> 분석 결과를 사용자가 직관적으로 이해할 수 있도록 시각적으로 전달하는 원칙

### V1: Progressive Disclosure (점진적 노출)

> NNGroup Research: 모바일에서 3-4 depth가 최적

정보를 한 번에 보여주지 않고 4단계로 나눠 사용자가 원하는 깊이까지만 탐색:

| Layer | 역할                  | 요소                                | 사용자 행동 |
| ----- | --------------------- | ----------------------------------- | ----------- |
| 0     | Emotional Hook        | 종합 점수 + 한 문장 요약            | 훑어보기    |
| 1     | Concern Overview      | 시각 카드 그리드 (한눈에 전체 파악) | 스캔 (3초)  |
| 2     | Deep Metrics          | 데이터 상세 + 동년배 비교           | 탭하여 확인 |
| 3     | Scientific Background | 과학적 근거 + 성분 정보             | 펼쳐서 읽기 |

```
적용:
- Layer 0 -> 항상 표시
- Layer 1 -> 기본 표시 (ConcernCard 그리드)
- Layer 2 -> 탭/클릭으로 진입 (Sheet/Collapsible)
- Layer 3 -> 추가 펼침 (Collapsible 내부)
```

### V2: Strengths-First (강점 우선)

> Positive Psychology: 강점 기반 피드백이 행동 변화 유도에 효과적

분석 결과를 점수 높은 순(좋은 항목 먼저)으로 정렬:

- 사용자가 먼저 긍정적 항목을 확인 -> 자존감 유지
- 관리 필요 항목은 자연스럽게 뒤에 배치 -> 방어적 반응 감소
- "전부 나쁘다" 느낌 방지 -> 앱 재방문 동기 유지

```
정렬 기준: score 내림차순
- 85+ (좋음) -> 먼저 표시
- 50-84 (보통) -> 중간
- <50 (관리 필요) -> 나중
```

### V3: Triple Encoding (삼중 인코딩)

> WCAG 2.1 SC 1.4.1: 색상만으로 정보를 전달하지 않는다

심각도/상태를 색상 + 아이콘 + 텍스트 라벨 3가지로 동시 전달:

| 상태      | 색상    | 아이콘      | 텍스트      |
| --------- | ------- | ----------- | ----------- |
| 좋음      | emerald | CheckCircle | "좋음"      |
| 보통      | amber   | Minus       | "보통"      |
| 관리 필요 | rose    | AlertCircle | "관리 필요" |

- 적록 색맹 사용자도 아이콘+텍스트로 구분 가능
- 색상은 보조 수단, 절대 유일한 전달 채널이 되지 않음

### V4: Concern Card 패턴 (시각적 개요 카드)

분석 메트릭을 카드 단위로 시각화하여 한눈에 전체 그림을 파악:

```
+------------------+
|  [아이콘]         |  <- Phase A: Lucide 아이콘 + 그라디언트 배경
|  라벨    점수     |     Phase B: Gemini 생성 일러스트 (후속)
|  [심각도 배지]    |
|  한 줄 팁         |
+------------------+
```

**설계 원리**:

- 카드 1개 = 메트릭 1개 (1:1 매핑)
- 2열 그리드 (모바일 375px 기준, 카드 ~163px > WCAG 44px 터치 타겟)
- 탭 시 기존 MetricDetailCard Sheet로 드릴다운 (Layer 2 진입)
- 크로스-모듈 재사용: Skin(8), Body(6), Hair(5), Makeup(4), Oral(4)

### V5: Information Chunking (정보 청킹)

> Miller's Law (7+-2): 한 번에 처리 가능한 정보 단위는 7개 이하

개별 항목이 많아도 **의미 단위(청크)**로 묶으면 인지 부담 감소:

| 청크         | 블록 수           | 내용                           |
| ------------ | ----------------- | ------------------------------ |
| A: 첫인상    | 3                 | 종합점수 + Best/Focus + 활력도 |
| B: 고민 개요 | 1 (내부 N개 카드) | ConcernCard 그리드             |
| C: 시각화    | 1                 | PhotoOverlay / SkinMap         |
| D: 인사이트  | 1                 | AI 인사이트 텍스트             |
| E: 실행      | 3                 | 성분 + 루틴 + 추천제품         |
| F: 신뢰      | 2                 | 근거 요약 + AI 고지            |

총 **6개 청크** -> Miller's Law 준수

ConcernCard 그리드 내부에 8개 카드가 있어도, 하나의 시각 청크로 인식됨.
MetricBarGaugeList는 Collapsible(기본 접힘)로 래핑하여 화면 노출 블록 수 통제.

---

## 9. 참고 자료

- Steve Jobs: Simplicity, Focus ("Say No to 1000 things"), Design = Function
- Dieter Rams: 10 Principles (특히 #5 Unobtrusive, #10 As Little As Possible)
- Don Norman: 3 Levels of Emotional Design (Visceral/Behavioral/Reflective)
- Apple HIG 2025: Clarity, Deference, Depth, Consistency
- Laws of UX: lawsofux.com
- Noom: Progressive Disclosure + Social Proof at abandonment points
- NNGroup: Progressive Disclosure in Mobile (3-4 depth optimal)
- WCAG 2.1 SC 1.4.1: Use of Color (triple encoding)

---

**Version**: 1.1 | **Created**: 2026-03-07 | **Updated**: 2026-03-07 V1-V5 시각화 원칙 추가
**관련 규칙**: [00-first-principles.md](../../.claude/rules/00-first-principles.md) - P4 단순화
**관련 문서**: [design-system.md](./design-system.md) - 컴포넌트/색상 시스템
