# SDD-CROSS-DOMAIN: 크로스도메인 챌린지 시스템

> **Status**: implemented
> **Version**: 1.0 | **Date**: 2026-03-15
> **ADR**: [ADR-091](../adr/ADR-091-cross-domain-challenge-system.md)
> **원리**: [habit-formation.md](../principles/habit-formation.md), [cross-domain-synergy.md](../principles/cross-domain-synergy.md)

---

## 1. 개요

뷰티·운동·영양·웰니스 4개 도메인을 조합한 멀티도메인 챌린지 시스템.
단일 도메인 챌린지의 한계를 넘어 이룸의 "통합 웰니스" 철학을 게이미피케이션으로 구현한다.

### 궁극의 형태 (P1)

- **100점**: AI 기반 동적 챌린지 생성 + 소셜 경쟁 + 시즌 이벤트
- **현재 목표**: 75% (정적 5개 챌린지 + 진행 추적 + 뷰 빌더)
- **의도적 제외**: 소셜 챌린지, 동적 생성, 시즌 이벤트

---

## 2. 데이터 모델

### 2.1 챌린지 정의

```typescript
interface DomainRequirement {
  domain: 'beauty' | 'workout' | 'nutrition' | 'wellness';
  count: number;
  label: string; // UI 표시용
}

interface CrossDomainChallengeDefinition extends ChallengeDefinition {
  domain: 'cross';
  requirements: DomainRequirement[];
  // targetCount = sum(requirements.map(r => r.count))  ← 무결성 보장
}
```

### 2.2 진행 추적

```typescript
interface DomainProgress {
  domain: 'beauty' | 'workout' | 'nutrition' | 'wellness';
  current: number; // min(활동횟수, target)
  target: number;
  completed: boolean;
}

interface CrossDomainProgressView {
  challengeId: string;
  name: string;
  description: string;
  domainProgress: DomainProgress[];
  overallPercent: number; // 0-100
  allCompleted: boolean;
  xpReward: number;
}
```

---

## 3. 사전 정의 챌린지

| ID                      | 이름             | 난이도 | 요구 조건                   | 최소 레벨 | 기간 |
| ----------------------- | ---------------- | ------ | --------------------------- | --------- | ---- |
| cross-triple-start      | 트리플 스타트    | easy   | 뷰티1+운동1+영양1           | 1         | 7일  |
| cross-weekly-balance    | 주간 균형 케어   | medium | 운동3+식단5+뷰티3           | 3         | 7일  |
| cross-beauty-nutrition  | 안팎으로 케어    | medium | 뷰티1+영양7                 | 2         | 14일 |
| cross-active-wellness   | 활력 웰니스      | medium | 운동5+웰니스3               | 3         | 14일 |
| cross-total-care-master | 토탈 케어 마스터 | hard   | 뷰티5+운동12+영양20+웰니스4 | 5         | 30일 |

---

## 4. 핵심 로직

### 4.1 진행률 계산

```
도메인별: current = min(activityCounts[domain], requirement.count)
전체: overallPercent = round((sum(current) / sum(target)) * 100)
완료: allCompleted = every(dp => dp.completed)
```

### 4.2 레벨 게이트

```
available = challenges.filter(c => c.minLevel <= userLevel && !completedIds.includes(c.id))
```

### 4.3 XP 보상

기존 `calculateChallengeXp(difficulty, bonus)` 재사용:

- easy: 기본 XP + 75% 보너스
- medium: 기본 XP + 100% 보너스
- hard: 기본 XP + 150% 보너스

---

## 5. 파일 구조

```
lib/gamification/
├── index.ts                       # barrel export
├── challenges.ts                  # 기존 단일 도메인 (변경 없음)
└── cross-domain-challenges.ts     # 크로스도메인 (신규)

tests/lib/gamification/
└── cross-domain-challenges.test.ts  # 25개 테스트
```

---

## 6. 테스트 전략

| 레벨 | 대상                                | 테스트 수 |
| ---- | ----------------------------------- | --------- |
| 단위 | CROSS_DOMAIN_CHALLENGES 정의 무결성 | 6         |
| 단위 | calculateCrossDomainProgress        | 4         |
| 단위 | calculateOverallProgress            | 4         |
| 단위 | buildCrossDomainView                | 3         |
| 단위 | getCrossDomainChallengeById         | 2         |
| 단위 | getAvailableCrossDomainChallenges   | 4         |
| 단위 | getIncompleteDomainMessages         | 2         |

---

**Version**: 1.0 | **Created**: 2026-03-15
