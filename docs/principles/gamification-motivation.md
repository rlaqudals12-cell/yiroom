# 게이미피케이션 동기부여 원리

> 이 문서는 크로스도메인 챌린지 시스템의 기반이 되는 동기부여 원리를 설명한다.

## 1. 핵심 개념

### 1.1 크로스도메인 시너지

단일 도메인(뷰티만, 운동만) 활동보다 여러 도메인을 조합한 활동이
더 높은 지속률과 만족도를 보인다.

이룸의 "통합 웰니스" 철학: 외모(뷰티) + 신체(운동) + 내면(영양/웰니스)을
하나의 자기관리 루틴으로 연결한다.

### 1.2 목표 설정 이론 (Goal-Setting Theory)

Locke & Latham (1990):

- **구체적 목표**가 "최선을 다하라"보다 효과적
- **난이도 조절**: 너무 쉬우면 동기 저하, 너무 어려우면 포기
- **피드백**: 진행 상황 시각화가 동기를 유지

→ 크로스도메인 챌린지: 도메인별 구체적 횟수 + 난이도 3단계 + 진행률 시각화

### 1.3 자기결정 이론 (Self-Determination Theory)

Deci & Ryan (2000):

- **자율성**: 사용자가 챌린지를 선택
- **유능감**: 달성 시 XP 보상 + 레벨업
- **관계성**: (향후) 소셜 챌린지로 확장

---

## 2. 수학적 기반

### 2.1 XP 보상 공식

```
XP = baseXP × difficultyMultiplier × (1 + bonusPercent/100)

difficultyMultiplier:
  easy   = 1.0
  medium = 1.5
  hard   = 2.5
```

### 2.2 진행률 계산

```
도메인별: progress[d] = min(actual[d], target[d]) / target[d]
전체: overallProgress = sum(min(actual[d], target[d])) / sum(target[d])
```

min() 클램핑으로 초과 달성이 다른 도메인 미달을 보상하지 않음
→ 모든 도메인 균형 있는 참여를 유도

### 2.3 레벨 게이트

```
available(userLevel) = challenges.filter(c => c.minLevel <= userLevel)
```

초보자에게 hard 챌린지를 노출하지 않아 좌절감 방지

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

| 원리        | 알고리즘                                  |
| ----------- | ----------------------------------------- |
| 구체적 목표 | DomainRequirement: domain + count + label |
| 난이도 조절 | minLevel 게이트 + easy/medium/hard 분류   |
| 피드백      | overallPercent + domainProgress 배열      |
| 균형 유도   | min() 클램핑으로 초과 달성 불인정         |

### 3.2 알고리즘 → 코드

- `calculateCrossDomainProgress()`: 도메인별 진행 추적
- `calculateOverallProgress()`: 전체 진행률 (0-100)
- `buildCrossDomainView()`: UI 소비용 통합 객체
- `getIncompleteDomainMessages()`: 잔여 횟수 안내

---

## 4. 검증 방법

### 4.1 원리 준수 검증

- targetCount = sum(requirements.count) 무결성 테스트
- min() 클램핑으로 current ≤ target 보장 테스트
- 레벨 게이트 필터링 테스트 (level 1에서 hard 미노출)
- 25개 단위 테스트로 모든 경로 커버

---

## 5. 참고 자료

- Locke, E. A., & Latham, G. P. (1990). "A Theory of Goal Setting and Task Performance"
- Deci, E. L., & Ryan, R. M. (2000). "Self-Determination Theory and the Facilitation of Intrinsic Motivation"
- Deterding, S. et al. (2011). "From Game Design Elements to Gamefulness"
- 이룸 원리: [habit-formation.md](./habit-formation.md), [cross-domain-synergy.md](./cross-domain-synergy.md)

---

**Version**: 1.0 | **Created**: 2026-03-15
**관련 모듈**: `lib/gamification/cross-domain-challenges.ts`
**관련 ADR**: [ADR-091](../adr/ADR-091-cross-domain-challenge-system.md)
