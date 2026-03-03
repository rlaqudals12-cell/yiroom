# ADR-073: One-Button Daily 엔진

## 상태

**제안** (2026-03-03)

## 컨텍스트

캡슐 에코시스템의 핵심 UX는 "아침에 1탭으로 오늘의 루틴을 확인하고 실행"하는 것이다.
의사결정 과학(P-3)에 따르면 결정 횟수가 증가할수록 품질이 하락하며,
습관 형성(P-4) Hook Model에서 "투자(Investment)" 단계는 1탭 이하로 설계해야 한다.
현재 이룸은 모듈별 추천이 분산되어 사용자가 직접 조합해야 한다.

### 문제

- 9모듈 각각 별도 추천 → 의사결정 피로 (Baumeister, 1998)
- 아침 준비 시간 제한 (평균 15분) → 긴 탐색 불가
- 캡슐 미활용 시 DAU/MAU 20% 미만 예상 (업계 평균)

## 결정

### 1. Daily Capsule 생성 파이프라인

```
매일 새벽 4시 (사용자 시간대) 또는 첫 앱 오픈 시:

Step 1: BeautyProfile 로드
  → beauty_profiles 테이블에서 최신 프로필 (updated_at 기준)
  → AI 분석 미포함: curate()는 규칙 기반 필터링, AI는 분석 모듈에서만 사용

Step 2: 컨텍스트 수집
  → 요일, 계절, 날씨(향후), 최근 사용 이력

Step 3: CapsuleEngine<T>.curate() 호출
  → 각 활성 모듈에서 오늘의 추천 1-3개 생성
  → C1 원칙: 모듈별 Optimal_N 적용

Step 4: 크로스 모듈 호환성 검사
  → ADR-071 CCS 계산 → CCS < 70 아이템 교체

Step 5: Safety 필터링 (반드시 CCS 후 실행)
  → ADR-070 안전성 파이프라인 통과
  → BLOCK 아이템 제외 → 대체 아이템 선택 (curate 후보에서)
  → 대체 아이템도 CCS ≥ 70 확인

Step 6: Daily Capsule 조립
  → 최종 추천 패키지 생성 + 캐싱

출력: DailyCapsule {
  date: string;
  items: CapsuleItem[];     // 오늘의 추천
  score: number;            // 전체 CCS
  alternates: CapsuleItem[]; // 교체 옵션
  estimatedTime: number;     // 예상 실행 시간 (분)
}
```

### 2. UI 패턴: Progressive Disclosure

```
Level 0 — 원버튼 (기본):
  "오늘의 루틴 시작" 버튼 1개
  → 탭 시 순차 실행 가이드 표시

Level 1 — 요약 카드:
  아이콘 + 제품명 + 실행 체크박스
  → 3초 이내 파악 가능

Level 2 — 상세 (펼치기):
  왜 이 제품인지 설명 + 대안 스왑
  → "더 알아보기"로 진입

Default Effect 적용:
  추천 그대로 수락 → 1탭
  변경하고 싶을 때만 추가 조작
```

### 3. Hook Model 사이클

```
1. Trigger (계기):
   - 외부: 아침 알림 (시간대 최적화, 일 1회)
   - 내부: "아침에 뭐 바르지?" → 앱 열기 (목표)

2. Action (행동):
   - "오늘의 루틴 시작" 1탭
   - BJ Fogg B=MAP: Motivation(추천 신뢰) × Ability(1탭) × Prompt(알림)

3. Variable Reward (가변 보상):
   - 매일 다른 조합 (로테이션 C4)
   - 호환성 점수 시각화 (게이미피케이션)
   - 누적 Streak 표시

4. Investment (투자):
   - 완료 체크 → 사용 이력 축적
   - 피드백("좋았어요/별로에요") → 개인화 정밀도 향상
   - 축적 데이터 = 이탈 비용 증가
```

### 4. 캐싱 및 성능

```
캐싱 전략:
  - Daily Capsule: 1일 TTL (날짜 기준)
  - BeautyProfile: 분석 완료 시 갱신
  - CCS 점수: 캡슐 변경 시 재계산

성능 목표:
  - 첫 로드: < 500ms (캐시 히트)
  - 생성: < 3s (캐시 미스, 서버 계산)
  - 오프라인: AsyncStorage 캐시 표시
```

## 대안

| 대안                   | 장점                | 단점                 | 기각 이유        |
| ---------------------- | ------------------- | -------------------- | ---------------- |
| 모듈별 개별 추천 유지  | 구현 비용 없음      | 의사결정 피로        | 핵심 문제 미해결 |
| AI 챗봇 기반 루틴 제안 | 유연한 대화         | 아침에 대화 비실용적 | 시간 제약 부적합 |
| 주간 계획 일괄 생성    | 일간 생성 부담 없음 | 당일 컨텍스트 미반영 | 적시성 부족      |

## 결과

### 장점

- 의사결정 1탭으로 축소 → 결정 피로 제거
- Hook Model 4단계 완전 설계 → DAU 목표 달성 전략
- Progressive Disclosure로 초보자/전문가 모두 만족
- CapsuleEngine\<T\>.curate() 재사용

### 단점

- Daily Capsule 생성 로직 복잡 (5단계 파이프라인)
- 개인화 정밀도가 BeautyProfile 완성도에 의존

## 관련 문서

- [P-3: decision-science.md](../principles/decision-science.md) — 의사결정 피로, Default Effect
- [P-4: habit-formation.md](../principles/habit-formation.md) — Hook Model, B=MAP
- [P-1: capsule-principle.md](../principles/capsule-principle.md) — C1 큐레이션, C4 로테이션
- [ADR-069: 캡슐 아키텍처](./ADR-069-capsule-ecosystem-architecture.md) — CapsuleEngine
- [ADR-071: 크로스 모듈 스코어링](./ADR-071-cross-module-scoring.md) — CCS 계산

---

**Version**: 1.0 | **Created**: 2026-03-03
