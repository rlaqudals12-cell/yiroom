# ADR-076: 홈 화면 3-State 리디자인

> **상태**: 제안됨 (Proposed)
> **날짜**: 2026-03-07
> **결정자**: 개발팀

## 맥락 (Context)

Phase P3+ 완료 후 홈 화면에 위젯 6개+(온보딩 체크리스트, Daily Capsule, 크로스 모듈 인사이트, 대시보드 통계 등)가 동시 노출되어 사용자 혼란을 유발함.

200명 가상 사용자 시뮬레이션 결과:

- 48% 첫 화면 이탈 (현재)
- 43% "복잡하다" 반응
- 남성 사용자 60% 이탈

## 결정 (Decision)

홈 화면을 사용자의 **분석 완료 수**에 따라 3개 상태(State)로 분기한다.

### State 1: New User (분석 0개)

- 2지선다 CTA (피부 분석 / 퍼스널컬러) + 체형·운동 텍스트 링크
- Social Proof ("오늘 N명이 분석했어요")
- 설문 기반 간편 분석 대안 옵션

### State 2: Growing User (1~3개 완료)

- "나에 대해 N가지를 발견했어요" 프로그레스
- 완료된 분석 카드 (최대 2개)
- 인과 연결 다음 추천 ("봄웜톤에 맞는 코디를 추천하려면 체형 정보가 필요해요")
- 개인화 인사이트 1개

### State 3: Active User (4+개 완료)

- 오늘의 한 줄 제안 (날씨/시간/계절 기반)
- CCS 비교 맥락 (점수 + 상위 N% + 주간 변화)
- 선택적 상세 (탭하면 Daily Capsule 체크리스트)

## 대안 (Alternatives Considered)

### A. 위젯 순서만 변경 (기각)

- 근본 문제(정보 과다) 미해결
- 모든 사용자에게 동일한 화면

### B. 탭 기반 분리 (기각)

- Hick's Law 위반 (탭 선택 = 추가 결정)
- 핵심 가치가 즉시 보이지 않음

### C. 3-State 분기 (채택)

- 사용자 상태에 맞는 최적 경험
- Hick's Law 준수 (상태별 CTA 최소화)
- Progressive Disclosure 적용

## 근거 (Rationale)

### 디자인 원칙 기반

| 원칙                            | 적용                     |
| ------------------------------- | ------------------------ |
| Jobs: Focus                     | State별 CTA 1~2개만      |
| Rams: #10 As Little As Possible | 상태별 필요한 정보만     |
| Norman: 3 Emotional Levels      | State별 감정 목표 매핑   |
| Hick's Law                      | 선택지 최소화            |
| Zeigarnik Effect                | Growing State 프로그레스 |
| Peak-End Rule                   | 분석 완료 피크 경험      |

### 시뮬레이션 예측

| 지표            | 현재 | 개선 후 |
| --------------- | :--: | :-----: |
| 첫 분석 시작률  | 52%  |   91%   |
| "복잡하다" 반응 | 43%  |   7%    |
| 남성 이탈률     | 60%  |   15%   |
| 14일 리텐션     | 15%  |   29%   |

## 구현 계획

1. `docs/principles/ux-design.md` — 완료
2. 이 ADR — 완료
3. SDD 스펙 작성 — 다음
4. 구현 — 스펙 확정 후

## 영향 (Impact)

### 수정 대상

- `apps/web/app/(main)/home/page.tsx` — State 분기 로직
- `apps/web/app/(main)/home/_components/` — State별 컴포넌트 신규
- 기존 위젯 컴포넌트 — 재사용 (Active State에서)

### 데이터 의존성

- 분석 완료 수: `user_stats` 또는 각 분석 테이블 카운트
- 날씨 데이터: 기존 날씨 API 재사용
- CCS 점수: `lib/capsule/scoring.ts` 재사용

## 관련 문서

- [원칙: UX 디자인](../principles/ux-design.md) — 6대 UX 원칙
- [원칙: 디자인 시스템](../principles/design-system.md) — 컴포넌트/색상
- [ADR-069: 캡슐 에코시스템](ADR-069-capsule-ecosystem-architecture.md) — Daily Capsule

---

**Version**: 1.0 | **Created**: 2026-03-07
