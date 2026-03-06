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

## 8. 참고 자료

- Steve Jobs: Simplicity, Focus ("Say No to 1000 things"), Design = Function
- Dieter Rams: 10 Principles (특히 #5 Unobtrusive, #10 As Little As Possible)
- Don Norman: 3 Levels of Emotional Design (Visceral/Behavioral/Reflective)
- Apple HIG 2025: Clarity, Deference, Depth, Consistency
- Laws of UX: lawsofux.com
- Noom: Progressive Disclosure + Social Proof at abandonment points

---

**Version**: 1.0 | **Created**: 2026-03-07
**관련 규칙**: [00-first-principles.md](../../.claude/rules/00-first-principles.md) - P4 단순화
**관련 문서**: [design-system.md](./design-system.md) - 컴포넌트/색상 시스템
