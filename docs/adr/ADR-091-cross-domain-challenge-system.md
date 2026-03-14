# ADR-091: 크로스도메인 챌린지 시스템

## 상태

`accepted`

## 날짜

2026-03-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

뷰티·운동·영양·웰니스 도메인을 조합한 멀티도메인 챌린지로,
사용자가 단일 도메인에 머무르지 않고 통합적 자기관리를 실천하도록 동기부여한다.

### 물리적 한계

| 항목        | 한계                                            |
| ----------- | ----------------------------------------------- |
| 도메인 수   | 현재 4개 (beauty, workout, nutrition, wellness) |
| 챌린지 기간 | 7-30일 (너무 길면 이탈, 짧으면 의미 없음)       |
| XP 밸런스   | 단일 도메인 챌린지와의 보상 균형 유지 필요      |

### 100점 기준

| 지표               | 100점 기준                | 현재   | 비고                         |
| ------------------ | ------------------------- | ------ | ---------------------------- |
| 챌린지 수          | 5개 이상                  | ✅ 5개 | easy 1 + medium 3 + hard 1   |
| 난이도 분포        | easy/medium/hard 3단계    | ✅     | 레벨 게이트 포함             |
| 도메인별 진행 추적 | 4개 도메인 독립 추적      | ✅     | calculateCrossDomainProgress |
| 미완료 안내        | 도메인별 잔여 횟수 메시지 | ✅     | getIncompleteDomainMessages  |
| 소셜 연동          | 친구와 챌린지 공유/경쟁   | -      | 향후                         |

### 현재 목표: 75%

### 의도적 제외

| 제외 항목        | 이유                     | 재검토 시점    |
| ---------------- | ------------------------ | -------------- |
| 소셜 챌린지      | 소셜 모듈(#5) 고도화 후  | 배치 3         |
| 동적 챌린지 생성 | AI 코칭(#6) 연동 후      | 배치 1 완료 후 |
| 시즌 챌린지      | 콘텐츠 운영 체계 구축 후 | MAU 1만+       |

## 1. 맥락 (Context)

기존 게이미피케이션 모듈(#9)은 단일 도메인 챌린지만 지원했다.
경쟁사 분석에서 "크로스 도메인 활동 연계"가 리텐션 핵심 요소로 확인되었고,
이룸의 "통합 웰니스" 철학과도 부합한다.

기존 `lib/gamification/challenges.ts`의 `ChallengeDefinition` 타입을 확장하여
도메인별 세부 요구 조건(requirements)을 추가한다.

## 2. 결정 (Decision)

`lib/gamification/cross-domain-challenges.ts` 모듈을 신규 작성하여:

1. **CrossDomainChallengeDefinition** 타입: `ChallengeDefinition` 확장 + `requirements: DomainRequirement[]`
2. **5개 사전 정의 챌린지**: 트리플 스타트, 주간 균형, 뷰티+영양, 활력 웰니스, 토탈 마스터
3. **도메인별 진행률 계산**: `calculateCrossDomainProgress()` — 도메인별 current/target/completed
4. **전체 진행률**: `calculateOverallProgress()` — 0-100% 단일 값
5. **뷰 빌더**: `buildCrossDomainView()` — UI 소비용 통합 객체
6. **필터/조회**: 레벨 게이트 + 완료 제외 필터

기존 challenges.ts의 `calculateChallengeXp()` 함수를 재사용하여 XP 계산 일관성을 유지한다.

## 3. 대안 (Alternatives Considered)

| 대안                 | 장점        | 단점                      | 제외 사유         |
| -------------------- | ----------- | ------------------------- | ----------------- |
| challenges.ts에 통합 | 파일 하나   | 560줄+ 비대화, SRP 위반   | P3 원자 분해 위반 |
| DB 기반 동적 챌린지  | 운영 유연성 | 오버엔지니어링, DB 의존성 | P4 단순화 위반    |
| 별도 패키지 분리     | 재사용성    | 모노레포 내 불필요한 분리 | P4 단순화 위반    |

## 4. 결과 (Consequences)

### 긍정적

- 기존 ChallengeDefinition 인터페이스 확장으로 호환성 유지
- targetCount = requirements.reduce(sum) 검증으로 데이터 무결성
- 25개 테스트 통과, 순수 함수 기반

### 부정적

- 챌린지 추가 시 코드 수정 필요 (정적 정의)

### 리스크

- XP 밸런스 조정 필요 시 기존 사용자 진행 데이터와 충돌 가능

## 5. 구현 가이드

```typescript
// lib/gamification/cross-domain-challenges.ts
import {
  CROSS_DOMAIN_CHALLENGES,
  buildCrossDomainView,
  getAvailableCrossDomainChallenges,
} from '@/lib/gamification';

// 사용자 레벨에 맞는 챌린지 조회
const available = getAvailableCrossDomainChallenges(userLevel, completedIds);

// 챌린지 진행 뷰 생성
const view = buildCrossDomainView(challenge, { beauty: 3, workout: 1, nutrition: 5 });
// → { challengeId, name, domainProgress, overallPercent, allCompleted, xpReward }
```

## 6. 관련 문서

- [원리: 습관 형성](../principles/habit-formation.md) ← 동기부여 이론적 기초
- [원리: 크로스 도메인 시너지](../principles/cross-domain-synergy.md) ← 도메인 간 연계 원리
- [ADR-046: OH-1 구강건강 분석](./ADR-046-oral-health-analysis.md) ← 챌린지 시스템 참고

---

**Author**: Claude Code
**Reviewed by**: -
