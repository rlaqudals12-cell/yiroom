# ADR-086: 모바일 격차 해소 — Thin Client 이식 전략

> **상태**: accepted
> **날짜**: 2026-03-11
> **관련**: ADR-016 (웹-모바일 동기화), ADR-027 (코치 AI 스트리밍), ADR-030 (영양 모듈), ADR-032 (스마트 매칭)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

웹과 모바일이 동일한 사용자 경험을 제공하는 상태. 모든 핵심 기능이 양 플랫폼에서 일관되게 동작하며, 의도적 비대칭(관리자 패널=웹 전용, 헬스킷 연동=모바일 전용)만 존재.

### 100점 기준

| 지표                    | 100점 기준                           | 현재 | 비고                        |
| ----------------------- | ------------------------------------ | ---- | --------------------------- |
| 기능 동기화율           | 100% (의도적 비대칭 제외)            | 92%  | 7건 격차                    |
| API 엔드포인트 커버리지 | 모바일에서 모든 사용자 API 호출 가능 | ~85% | 채팅/선반/영양온보딩 미연결 |
| 사용자 체감 격차        | 0건                                  | 7건  | 핵심 플로우 누락            |

### 현재 목표: 97%

7건 격차 해소 후 동기화율 92% → 97%+ 달성. 의도적 비대칭 제외 시 실질 100%.

### 의도적 제외

| 제외 항목               | 이유                          | 재검토 시점 |
| ----------------------- | ----------------------------- | ----------- |
| 관리자 패널 모바일 이식 | 웹 전용 기능, 사용 빈도 극소  | MAU 1만+    |
| 서버사이드 분석 엔진    | Gemini API 호출은 웹 API 위임 | -           |
| E2E 테스트              | Detox 도입은 별도 ADR         | 앱 출시 후  |

## 1. 맥락 (Context)

웹-모바일 원자적 동기화율 분석(20개 카테고리) 결과 전체 92% 달성 확인.
사용자 체감 격차 7건 발견:

| #   | 격차              | 영향도 | 참조 모델                   |
| --- | ----------------- | ------ | --------------------------- |
| 1   | 채팅 (Chat)       | 높음   | 코치 채팅 UI                |
| 2   | 영양 온보딩       | 높음   | 운동 온보딩 3-Step          |
| 3   | 웰니스 lib        | 중간   | 기존 calculateWellnessScore |
| 4   | 뷰티 카테고리     | 중간   | 기존 뷰티 탭 필터           |
| 5   | 선반 스캔         | 중간   | 바코드 스캔 패턴            |
| 6   | 영양 result       | 높음   | 운동 온보딩 결과            |
| 7   | 리더보드 카테고리 | 낮음   | 기존 단일 리더보드          |

## 2. 결정 (Decision)

### 2.1 Thin Client 아키텍처 유지

모바일은 웹 API의 thin client로 유지. 비즈니스 로직을 모바일에 복제하지 않고 API 호출로 위임.

```
모바일 UI → API 호출 (API_BASE_URL) → 웹 서버 → Supabase/Gemini
```

### 2.2 패턴 복제 전략 (Pattern Replication)

기존 모바일에서 검증된 패턴을 복제하여 격차를 해소:

| 격차          | 복제할 기존 패턴               | 변경점                             |
| ------------- | ------------------------------ | ---------------------------------- |
| 채팅          | `useCoach.ts` + `(coach)/`     | API endpoint만 `/api/chat`로 변경  |
| 영양 온보딩   | `(workout)/onboarding/` 3-Step | 입력 필드를 영양 도메인으로        |
| 영양 result   | 운동 온보딩 결과 화면          | BMR/TDEE/매크로 표시               |
| 뷰티 카테고리 | `(tabs)/beauty.tsx` 필터       | 카테고리 전용 `[slug]` 라우트 추가 |
| 선반 스캔     | `(inventory)/barcode-scan.tsx` | 제품함 목록/상세 화면 추가         |
| 웰니스 lib    | `lib/wellness/index.ts`        | calculator, queries, types 분리    |
| 리더보드      | `(social)/leaderboard/`        | 5탭 세그먼트 컨트롤 추가           |

### 2.3 워크스트림 병합

7건 격차를 4개 워크스트림으로 효율화:

- **WS-A**: 채팅 모바일 이식 (사용자 영향 최고)
- **WS-B**: 영양 온보딩 + result (온보딩 패턴 복제)
- **WS-C**: 뷰티 카테고리 + 선반 스캔 + 웰니스 lib (3개 소규모 병합)
- **WS-D**: 리더보드 카테고리 확장 (기존 화면 수정)

## 3. 대안 (Alternatives)

### A. 공유 패키지(packages/shared)에 비즈니스 로직 이동

모바일과 웹이 동일 비즈니스 로직을 `packages/shared`에서 import.

**기각 이유**: React Native 환경에서 Node.js API 의존성 충돌 위험. 현재 shared는 타입/유틸만 포함하며 이 수준이 적절.

### B. 모바일 전용 BFF (Backend-for-Frontend)

모바일 전용 API 서버 구축.

**기각 이유**: 인프라 복잡도 증가. 현재 웹 API가 모바일 요청을 충분히 처리 가능. MAU 증가 시 재검토.

### C. React Native for Web 통합

하나의 코드베이스로 웹+모바일.

**기각 이유**: 기존 Next.js 16 웹 앱의 SEO/SSR 이점 손실. 이미 90%+ 구현 완료 상태에서 전환 비용 과다.

## 4. 결과 (Consequences)

### 긍정적

- 동기화율 92% → 97%+ 달성
- 기존 검증된 패턴 재사용으로 안정성 확보
- 동일 Supabase 테이블/RLS 정책으로 데이터 일관성 유지

### 부정적

- 모바일 lib 파일 증가 (~21개 신규)
- 패턴 복제로 인한 일부 코드 중복 (추후 shared 이동 가능)

### 중립

- 테스트 ~22개 추가 (유지보수 부담 ≈ 품질 보장)

## 5. 관련 문서

- [원리: nutrition-science](../principles/nutrition-science.md) — 영양 온보딩 기반
- [원리: coaching-psychology](../principles/coaching-psychology.md) — 채팅 AI 기반
- [원리: gamification-theory](../principles/gamification-theory.md) — 리더보드 기반
- [원리: color-science](../principles/color-science.md) — 뷰티 카테고리 기반
- [원리: cosmetic-chemistry](../principles/cosmetic-chemistry.md) — 선반 스캔 기반
- [스펙: SDD-COACH-AI-CHAT](../specs/SDD-COACH-AI-CHAT.md) — 채팅 스펙
- [스펙: SDD-N1-NUTRITION](../specs/SDD-N1-NUTRITION.md) — 영양 스펙
- [ADR-016: 웹-모바일 동기화](./ADR-016-web-mobile-sync.md) — 동기화 기반 결정
- [ADR-027: 코치 AI 스트리밍](./ADR-027-coach-ai-streaming.md) — 채팅 아키텍처

---

**Version**: 1.0 | **Created**: 2026-03-11
