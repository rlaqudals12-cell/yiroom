# ADR-080: Identity-First Result Framing

## 상태

`accepted`

## 날짜

2026-03-09

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 분석 결과가 MBTI처럼 '나는 ○○ 타입'으로 자기 정체성을 강화한다"

- 7개 분석 모듈이 일관된 타입 라벨 체계를 가짐
- 사용자가 점수보다 타입 라벨을 먼저 인식
- 소셜 공유 시 "나는 봄 웜톤이야"처럼 정체성 기반 바이럴
- 점수는 보조 지표로 유지 (바이럴 + 성취감 모두 확보)
```

### 물리적 한계

| 항목             | 한계                                     |
| ---------------- | ---------------------------------------- |
| AI 분석 정확도   | 이미지 품질에 따라 타입 분류 정확도 변동 |
| 타입 분류 세분화 | 과도한 세분화는 인지 부담 증가           |

### 100점 기준

- 7/7 모듈에 타입 라벨 존재
- 타입 라벨이 히어로 섹션 최상단에 배치
- 점수는 타입 라벨 하단 보조 지표
- 공유 데이터에 타입 라벨 포함

### 현재 목표: 100%

- 5/7 모듈 이미 완료 → S-1, OH-1 추가로 7/7 달성

### 의도적 제외

| 제외 항목        | 이유                | 재검토 시점       |
| ---------------- | ------------------- | ----------------- |
| 타입별 커뮤니티  | 사용자 수 부족      | MAU 5K+           |
| 타입 호환성 매칭 | 소셜 기능 고도화 시 | 소셜 모듈 확장 시 |

## 1. 맥락 (Context)

이룸의 7개 분석 모듈 중 5개는 이미 타입 라벨을 1순위로 표시:

| 모듈            | 타입 라벨       | 소스 필드            |
| --------------- | --------------- | -------------------- |
| PC-1 퍼스널컬러 | "봄 웜톤"       | `season` + `subType` |
| C-1 체형        | "S 타입"        | `bodyType`           |
| H-1 헤어        | "타원형"        | `faceShape`          |
| M-1 메이크업    | "웜톤 + 하트형" | compound             |
| A-1 자세        | "일자형"        | `postureType`        |

S-1(피부)과 OH-1(구강)만 점수 중심으로 표시되어 사용자 경험 불일치 발생.

120명 페르소나 시뮬레이션에서:

- 일반 소비자 그룹: "피부 분석은 내가 무슨 타입인지 안 알려줘서 아쉽다"
- 인플루언서 그룹: "MBTI처럼 타입으로 공유하면 바이럴 효과 높아질 것"
- 투자자 그룹: "타입 기반 커뮤니티 확장 가능성 보임"

## 2. 결정 (Decision)

**타입 라벨 1순위 + 점수 2순위** 패턴을 7개 모듈에 일관 적용한다.

### S-1 피부 타입 라벨 체계

`skinType` + 주요 고민(dominant concern)을 조합한 복합 라벨:

| skinType    | dominant concern | 라벨                  |
| ----------- | ---------------- | --------------------- |
| dry         | hydration 낮음   | "수분 부족 건성 타입" |
| oily        | oiliness 높음    | "유분 과다 지성 타입" |
| combination | 차이 큼          | "밸런스 복합성 타입"  |
| normal      | 양호             | "균형 잡힌 정상 타입" |
| sensitive   | sensitivity 높음 | "고민감 민감성 타입"  |

### OH-1 구강 타입 라벨 체계

`brightness` + `gumHealthStatus`를 조합:

| brightness         | gumHealth       | 라벨                  |
| ------------------ | --------------- | --------------------- |
| very_bright/bright | healthy         | "건강 밝은 미소 타입" |
| medium             | healthy         | "내추럴 미소 타입"    |
| dark/very_dark     | healthy         | "미백 관심 미소 타입" |
| \*                 | mild_gingivitis | "잇몸 케어 미소 타입" |
| \*                 | moderate+       | "집중 케어 필요 타입" |

### 히어로 섹션 레이아웃 (공통 패턴)

```
┌──────────────────────┐
│  [타입 라벨]          │  ← 1순위: 큰 텍스트
│  "민감 건성 타입"      │
│                      │
│    ┌────┐            │
│    │ 78 │            │  ← 2순위: 점수 원형
│    └────┘            │
│  피부 바이탈리티 점수   │
└──────────────────────┘
```

## 3. 대안 (Alternatives Considered)

| 대안                        | 장점           | 단점                     | 제외 사유                    |
| --------------------------- | -------------- | ------------------------ | ---------------------------- |
| 점수 제거, 타입만           | 간결함         | 바이럴 약화, 성취감 감소 | 사용자가 점수 기반 공유 원함 |
| 현상 유지                   | 변경 없음      | S-1/OH-1 불일치 지속     | UX 일관성 훼손               |
| 점수 1순위 유지 + 타입 추가 | 기존 구조 유지 | 타입 라벨 인식도 낮음    | 정체성 강화 효과 미약        |

## 4. 결과 (Consequences)

### 긍정적 결과

- 7/7 모듈 UX 일관성 달성
- MBTI식 바이럴 공유 가능 ("나는 민감 건성 타입!")
- 타입 기반 제품 추천 확장 용이

### 부정적 결과

- S-1/OH-1 기존 사용자에게 UI 변화 발생

### 리스크

- 타입 라벨이 의학적 진단으로 오해될 수 있음 → AI 고지 면책으로 대응 (이미 구현됨)

## 5. 구현 가이드

```typescript
// S-1: lib/analysis/skin-v2/identity-label.ts
export function generateSkinIdentityLabel(
  skinType: SkinTypeV2,
  scoreBreakdown: { hydration: number; elasticity: number; clarity: number; tone: number }
): string;

// OH-1: lib/analysis/oral-health/identity-label.ts
export function generateOralHealthIdentityLabel(
  brightness?: string,
  gumHealthStatus?: GumHealthStatus
): string;
```

## 7. 관련 문서

- [ADR-081: AI Framing Principle](./ADR-081-ai-framing-principle.md)
- [원리: 색채학](../principles/color-science.md)
- [원리: 피부 생리학](../principles/skin-physiology.md)

---

**Author**: Claude Code
**Reviewed by**: -
