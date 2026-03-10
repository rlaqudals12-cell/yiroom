# ADR-083: ConnectionAwareness 아키텍처

## 상태

`accepted`

## 날짜

- **결정일**: 2026-03-07
- **문서 작성일**: 2026-03-10

## 궁극의 형태 (P1)

### 이상적 최종 상태

모든 교차 모듈 연결에 대해 사용자별 내재화 수준을 실시간 추적하고,
설명 깊이를 자동 조절하며, 장기 미사용 시 역행(forgetting curve)을 반영.

### 현재 목표: 70%

### 의도적 제외

- 시간 기반 역행 (ConnectionAwareness Phase C, MAU 100+ 이후)
- AI 기반 개인화 임계값 조정 (Phase D, MAU 1K+ 이후)
- insight-bridge 매핑 6개 모듈만 지원 (personal_color, face, skin, body, hair, oral_health). makeup, workout, nutrition, fashion은 해당 분석 모듈의 교차 인사이트가 정의된 후 추가

## 맥락 (Context)

이룸의 핵심 철학은 "통합된 자기 이해"이다. 9개 분석 모듈(퍼스널컬러, 피부, 체형, 헤어, 메이크업, 구강건강, 운동, 영양, 패션)이 각각 독립된 분석 결과를 제공하지만, 모듈 간 **인과 연결**("A라서 B")의 이해도를 추적하는 시스템이 없었다.

### 해결해야 할 문제

1. 사용자가 "봄 웜톤이라서 코랄 립이 어울린다"는 연결을 처음 본 것인지, 이미 충분히 내재화한 것인지 알 수 없음
2. 모든 사용자에게 동일한 깊이의 설명을 제공 → 숙련 사용자에게는 과도, 신규 사용자에게는 부족
3. 캡슐/인사이트 시스템이 교차 모듈 연결을 생성하지만, 내재화 진행도를 측정할 수 없음

### 제약 조건

- RLS 필수 (clerk_user_id 기반, 개인 데이터 격리)
- Supabase PostgreSQL (기존 인프라 활용)
- 프론트엔드 성능 영향 최소화 (노출 기록은 비동기)

## 결정 (Decision)

### 4단계 내재화 상태 모델

학습 이론(Bloom's Taxonomy + Conscious Competence Model)에서 파생된 4단계 모델:

| 상태           | 의미        | 전이 조건                      | UI 설명 깊이              |
| -------------- | ----------- | ------------------------------ | ------------------------- |
| `exposed`      | 처음 접함   | exposure ≥ 1                   | `full` — 상세 설명 + "왜" |
| `recognized`   | 인식됨      | exposure ≥ 3 AND confirmed ≥ 1 | `brief` — 핵심만          |
| `internalized` | 내재화됨    | exposure ≥ 5 AND confirmed ≥ 3 | `minimal` — 한 줄         |
| `independent`  | 자립적 판단 | exposure ≥ 7 AND confirmed ≥ 5 | `none` — 생략             |

**대안 1: 3단계 모델** (노출→인식→자립) — 기각. 내재화와 자립의 구분이 필요. 내재화 단계에서 가끔 리마인더가 유익함.

**대안 2: 연속 점수 모델** (0~100 점수) — 기각. 상태 기반이 UI 분기가 명확하고, ExplanationDepth 매핑이 단순함.

**대안 3: 시간 기반 모델** (마지막 노출 후 경과 시간) — 기각. 빈도가 아닌 횟수+확인이 내재화의 더 나은 지표. 시간 경과로 역행(잊음)은 Phase C에서 고려.

### DB-level 상태 추적 (vs 클라이언트 계산)

**결정**: 상태를 DB 컬럼으로 저장하고, expose/confirm 시 서버에서 전이 계산.

**이유**:

- 피드/캡슐 조회 시 상태별 필터링이 필요 (`WHERE status = 'internalized'`)
- 인덱스 활용 가능 (`idx_connection_awareness_status`)
- 클라이언트에서 매번 계산하면 N+1 쿼리 발생

**대안**: 클라이언트에서 count 기반 실시간 계산 — 기각. 리스트 조회 시 성능 저하.

### 단일 API 엔드포인트 (POST /api/connection-awareness)

**결정**: action 파라미터로 분기하는 단일 엔드포인트.

```typescript
POST /api/connection-awareness
Body: { action: 'expose' | 'confirm' | 'stats' | 'connections', ...params }
```

**이유**:

- 4개 액션이 모두 같은 테이블을 대상으로 함
- 인증 로직 중복 제거
- 라우트 파일 수 최소화

**대안**: RESTful 분리 (`/expose`, `/confirm`, `/stats`) — 유효하나, 현재 규모에서는 과도한 분리.

### 3종 브릿지 패턴

모듈 ID 체계가 3가지 존재하므로 브릿지 함수로 변환:

| 시스템                   | 키 형식      | 예시             | 브릿지              |
| ------------------------ | ------------ | ---------------- | ------------------- |
| AnalysisModule (insight) | underscore   | `personal_color` | `insight-bridge.ts` |
| ConnectionModule         | kebab-case   | `personal-color` | (canonical)         |
| ModuleCode (capsule)     | abbreviation | `PC`             | `capsule-bridge.ts` |

**이유**: 기존 시스템의 ID 체계를 변경하면 영향 범위가 크므로, 어댑터 패턴으로 변환.

### 노출 추적 에러 정책

**결정**: Best-effort. expose/confirm 실패 시 사용자 플로우를 차단하지 않음.

**이유**: 내재화 추적은 보조 기능이며, 실패가 핵심 분석 결과 조회를 막아서는 안 됨. UI에서 expose 호출은 비동기 fire-and-forget 패턴으로 구현.

**대안**: 실패 시 로컬 큐에 저장 후 재시도 — Phase C에서 오프라인 지원 시 고려.

## 구현 요약

### 파일 구조

```
apps/web/lib/connection-awareness/
├── index.ts              # Barrel export (P8)
├── types.ts              # ConnectionStatus, ExplanationDepth 등
├── repository.ts         # DB CRUD + 상태 전이 계산
├── insight-bridge.ts     # Insight → ExposeRequest 변환 (6개 모듈)
└── capsule-bridge.ts     # ModuleCode → ExposeRequest 변환

apps/web/app/api/connection-awareness/route.ts  # 단일 API
supabase/migrations/20260307_connection_awareness.sql  # DDL
```

### UI 통합 포인트

- `ResultPageInsights` — 7개 분석 결과 페이지에서 자동 노출 추적
- `HomeDailyCapsuleWidget` — 캡슐 체크 시 confirm
- `InternalizationWidget` — 4-status 분포 시각화

### RLS 정책

```sql
-- SELECT/INSERT/UPDATE 모두 clerk_user_id = auth.get_user_id()
-- DELETE 정책 없음 (사용자 직접 삭제 불가, 계정 삭제 시 CASCADE)
```

## 결과 (Consequences)

### 긍정적

- 사용자 경험 개인화: 숙련도에 따라 설명 깊이 자동 조절
- 측정 가능한 성장: "내재화율 60%" 같은 구체적 지표 제공
- 확장 가능: Phase C/D에서 시각화, AI 개인화로 확장

### 부정적

- DB 호출 증가: 인사이트 표시마다 expose 호출 (비동기로 완화)
- 마이그레이션 필요: GFSA 후 `supabase db push` 실행 필요
- 상태 역행 미지원: 장기 미사용 시 "잊음" 로직은 ConnectionAwareness Phase C (MAU 100+)로 이연

### 리스크

- 전이 임계값(3/5/7)이 적절한지 실 사용 데이터로 검증 필요
- 연결 규칙 수가 많아지면 connectionId 관리 복잡도 증가

## 관련 문서

- [원리: connection-awareness-spec.md](../principles/connection-awareness-spec.md) — 데이터 모델 + API 스펙
- [원리: yiroom-philosophy.md](../principles/yiroom-philosophy.md) — Section 3 "연결과 내재화"
- [원리: measurement-framework.md](../principles/measurement-framework.md) — 내재화율 측정
- [DB 스키마: DATABASE-SCHEMA.md](../DATABASE-SCHEMA.md) — #41 connection_awareness
- [ADR-080: Identity-First Result Framing](./ADR-080-identity-first-result-framing.md) — 결과 프레이밍 원칙
- [ADR-081: AI Framing Principle](./ADR-081-ai-framing-principle.md) — AI 설명 프레이밍

---

**Version**: 1.0 | **Created**: 2026-03-10
