# DB 마이그레이션 원리

> 이 문서는 Supabase 스키마 변경의 기반이 되는 기본 원리를 설명한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"무중단 완벽 마이그레이션 시스템"

- Zero-Downtime: 모든 마이그레이션이 서비스 중단 없이 실행
- 100% Reversibility: 모든 변경이 완벽히 롤백 가능
- Idempotency: 동일 마이그레이션 N회 실행 = 1회 실행
- Auto-Validation: 마이그레이션 전후 자동 무결성 검증
- Shadow Testing: 프로덕션 영향 없이 마이그레이션 시뮬레이션
- Self-Healing: 실패 시 자동 롤백 및 복구
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **테이블 잠금** | DDL 연산 시 테이블 잠금 불가피 (pg_repack 필요) |
| **데이터 마이그레이션 시간** | 대용량 테이블 변환 O(n) 시간 복잡도 |
| **역함수 부재** | DROP 연산의 완전 복구 불가능 |
| **트랜잭션 크기** | 대규모 UPDATE의 WAL 크기 제한 |
| **동시성 충돌** | 스키마 변경 중 DML 충돌 가능 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **Safety Score** | ≥ 95% (가역 연산 비율) |
| **Downtime** | 0초 (Zero-Downtime Migration) |
| **Idempotency** | 100% (모든 마이그레이션 멱등) |
| **Rollback Time** | < 5분 (모든 롤백 즉시 실행) |
| **Test Coverage** | 100% (로컬 테스트 + 스테이징 검증) |
| **RLS 정책** | 100% (모든 테이블 RLS 적용) |
| **Impact Analysis** | 자동 (영향 범위 자동 계산) |

### 현재 목표

**85%** - MVP 마이그레이션 시스템

- ✅ DFA 기반 스키마 상태 관리
- ✅ 멱등성 보장 (IF NOT EXISTS)
- ✅ ACID 트랜잭션 적용
- ✅ 롤백 스크립트 템플릿
- ✅ RLS 정책 필수 규칙
- ⏳ Zero-Downtime Migration (70%)
- ⏳ 자동 영향 분석 (50%)
- ⏳ Shadow Testing (30%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Blue-Green DB | 인프라 비용 2배 | Phase 4 (대규모 확장 시) |
| Online Schema Change (pt-osc) | PostgreSQL 미지원 | 대안: pg_repack |
| 자동 롤백 시스템 | 복잡도, 오탐 위험 | Phase 3 (모니터링 안정화 후) |
| Multi-Region Replication | 비용, 복잡도 | 글로벌 확장 시점 |

---

## 1. 핵심 개념

### 1.1 마이그레이션 (Migration)

데이터베이스 스키마의 버전 관리 메커니즘. 스키마 변경을 코드화하여 추적 가능하고, 재현 가능하며, 롤백 가능하게 만드는 과정.

```
마이그레이션 = 스키마 변경의 원자적 단위
```

### 1.2 스키마 진화 (Schema Evolution)

애플리케이션 요구사항 변화에 따라 데이터베이스 구조가 점진적으로 변화하는 과정. 데이터 무결성을 유지하면서 구조를 변경해야 한다.

### 1.3 CAP 정리와 마이그레이션

분산 시스템에서 Consistency(일관성), Availability(가용성), Partition tolerance(분할 내성) 중 두 가지만 보장 가능하다는 원리.

| 속성 | 마이그레이션 적용 |
|------|------------------|
| Consistency | 트랜잭션 내 스키마 변경 보장 |
| Availability | 다운타임 최소화 전략 |
| Partition | 롤백 계획 필수 |

---

## 2. 수학적/물리학적 기반

### 2.1 상태 기계 (State Machine)

스키마는 결정론적 유한 상태 기계(Deterministic Finite Automaton, DFA)로 모델링된다.

**형식적 정의**:

```
DFA = (Q, Σ, δ, q₀, F)

Q  = 스키마 상태 집합 {S₀, S₁, S₂, ..., Sₙ}
Σ  = 마이그레이션 연산 집합 {CREATE, ALTER, DROP, ...}
δ  = 전이 함수: Q × Σ → Q
q₀ = 초기 상태 (빈 스키마)
F  = 최종 상태 (현재 프로덕션 스키마)
```

**전이 함수 표현**:

```
S₀ → M₁ → S₁ → M₂ → S₂ → ... → Sₙ

S = 스키마 상태
M = 마이그레이션 함수
δ(Sᵢ, Mᵢ₊₁) = Sᵢ₊₁
```

각 마이그레이션 `M`은 결정론적 함수로, 동일한 입력(이전 상태)에서 항상 동일한 출력(다음 상태)을 생성해야 한다.

### 2.2 멱등성 (Idempotency)

마이그레이션은 멱등적이어야 한다:

**수학적 정의**:

```
∀S ∈ Q: M(M(S)) = M(S)
```

**멱등성 검증 공식**:

```
Idempotent(M) ⟺ ∀S: effect(M, S) = effect(M, effect(M, S))

where effect(M, S) = 마이그레이션 M 적용 후 상태
```

이를 보장하기 위해 `IF NOT EXISTS`, `IF EXISTS` 조건문 사용:

```sql
CREATE TABLE IF NOT EXISTS users (...);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
```

### 2.3 역함수 존재 (Reversibility)

안전한 마이그레이션은 역함수가 존재해야 한다:

**수학적 정의**:

```
∀M ∈ Σ, ∃M⁻¹: M⁻¹(M(S)) = S
```

**가역성 분류**:

| 연산 | 가역성 | 역함수 |
|------|--------|--------|
| CREATE TABLE | 완전 가역 | DROP TABLE |
| ADD COLUMN (nullable) | 완전 가역 | DROP COLUMN |
| ADD COLUMN (NOT NULL + DEFAULT) | 부분 가역 | DROP COLUMN (기존 데이터 손실 가능) |
| DROP COLUMN | 비가역 | 불가능 (데이터 손실) |
| DROP TABLE | 비가역 | 불가능 (데이터 손실) |

**데이터 손실 연산 안전 지표**:

```
SafetyScore(M) = (ReversibleOps / TotalOps) × 100%

목표: SafetyScore ≥ 90%
```

### 2.4 마이그레이션 안전성 메트릭

**1. 다운타임 추정 공식**:

```
Downtime(M) = LockTime(M) + ExecutionTime(M)

LockTime = f(TableSize, LockType)
ExecutionTime = O(RowCount) for data migrations
             = O(1) for schema-only changes
```

**2. 롤백 시간 추정**:

```
RollbackTime(M) = ExecutionTime(M⁻¹) + VerificationTime

VerificationTime = Σ(ConstraintCheckTime) for all affected constraints
```

**3. 영향 범위 지표**:

```
ImpactScope(M) = AffectedTables × AffectedColumns × DependentViews

Risk Level:
- Low: ImpactScope ≤ 3
- Medium: 3 < ImpactScope ≤ 10
- High: ImpactScope > 10
```

### 2.5 트랜잭션 ACID 보장

마이그레이션은 ACID 속성을 준수해야 한다:

| 속성 | 정의 | 마이그레이션 적용 |
|------|------|------------------|
| **Atomicity** | 전체 성공 또는 전체 실패 | BEGIN/COMMIT 블록 |
| **Consistency** | 제약조건 유지 | 마이그레이션 후 모든 FK/CHECK 통과 |
| **Isolation** | 동시 실행 격리 | SERIALIZABLE 레벨 권장 |
| **Durability** | 영구 저장 보장 | WAL(Write-Ahead Log) 활용 |

**일관성 검증 공식**:

```
Consistent(S) ⟺ ∀C ∈ Constraints: C(S) = true

마이그레이션 후 검증:
∀M: Consistent(S) → Consistent(M(S))
```

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

**원리**: 스키마 변경은 원자적이고 롤백 가능해야 한다.

**알고리즘**:

```
1. 마이그레이션 스크립트 작성
2. 로컬 환경에서 테스트
3. 롤백 스크립트 준비
4. 스테이징 환경 적용
5. 프로덕션 배포
6. 검증 쿼리 실행
7. (실패 시) 롤백 실행
```

### 3.2 알고리즘 → 코드

**파일 구조**:

```
supabase/migrations/
├── 20260115_add_user_levels.sql      # 전방 마이그레이션
├── 20260115_create_audit_logs.sql
└── rollback/
    ├── 20260115_add_user_levels_rollback.sql
    └── 20260115_create_audit_logs_rollback.sql
```

**전방 마이그레이션 템플릿**:

```sql
-- Migration: [기능명]
-- Purpose: [목적]
-- Date: YYYY-MM-DD
-- Rollback: rollback/YYYYMMDD_xxx_rollback.sql

BEGIN;

-- 1. 테이블/컬럼 변경
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. 인덱스 (CONCURRENTLY로 잠금 최소화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_level
  ON users(level);

-- 3. RLS 정책
CREATE POLICY IF NOT EXISTS "user_level_select"
  ON users FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

COMMIT;
```

**롤백 스크립트**:

```sql
-- Rollback for: 20260115_add_user_levels.sql

BEGIN;

DROP POLICY IF EXISTS "user_level_select" ON users;
DROP INDEX IF EXISTS idx_users_level;
ALTER TABLE users DROP COLUMN IF EXISTS level;

COMMIT;
```

---

## 4. 검증 방법

### 4.1 마이그레이션 전 체크리스트

```markdown
□ 로컬 Supabase에서 마이그레이션 테스트 완료
□ 롤백 스크립트 작성 완료
□ API 코드와 스키마 동기화 확인
□ RLS 정책 추가됨
□ 인덱스 필요 여부 검토
□ 기존 데이터 영향 분석
```

### 4.2 자동화 검증

```bash
# 로컬 테스트
npx supabase start
npx supabase db push

# 스키마 차이 확인
npx supabase db diff

# 마이그레이션 상태
npx supabase migration list
```

### 4.3 원리 준수 검증

| 원리 | 검증 방법 |
|------|----------|
| 멱등성 | 같은 마이그레이션 2회 실행 시 오류 없음 |
| 역함수 | 롤백 후 원래 상태로 복원 확인 |
| 원자성 | 트랜잭션 내 실행, 부분 실패 없음 |
| 데이터 무결성 | 마이그레이션 후 제약조건 위반 없음 |

---

## 5. 변경 유형별 전략

### 5.1 안전한 변경 (Type 2)

되돌릴 수 있는 변경:

| 변경 | 전략 |
|------|------|
| 테이블 추가 | `CREATE TABLE IF NOT EXISTS` |
| 컬럼 추가 (nullable) | `ADD COLUMN IF NOT EXISTS` |
| 인덱스 추가 | `CREATE INDEX CONCURRENTLY` |
| RLS 정책 추가 | `CREATE POLICY IF NOT EXISTS` |

### 5.2 위험한 변경 (Type 1)

되돌릴 수 없는 변경:

| 변경 | 완화 전략 |
|------|----------|
| 컬럼 삭제 | 2단계: rename → 2주 후 drop |
| 테이블 삭제 | 백업 필수, 별도 승인 |
| 타입 변경 | 새 컬럼 추가 → 마이그레이션 → 구 컬럼 삭제 |
| NOT NULL 추가 | 기본값 설정 후 변경 |

---

## 6. RLS 정책 원리

### 6.1 최소 권한 원칙

```sql
-- 기본: 본인 데이터만 접근
CREATE POLICY "user_own_data"
  ON [table] FOR ALL
  USING (clerk_user_id = auth.get_user_id());
```

### 6.2 JWT 기반 사용자 식별

```sql
CREATE OR REPLACE FUNCTION auth.get_user_id()
RETURNS TEXT AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  );
$$ LANGUAGE SQL STABLE;
```

---

## 7. 관련 문서

### 규칙
- [db-migration-rules.md](../../.claude/rules/db-migration-rules.md) - 구체적 규칙 및 템플릿

### ADR
- [ADR-004: 인증 전략](../adr/ADR-004-auth-strategy.md) - Clerk + Supabase 통합
- [ADR-008: Repository-Service 계층](../adr/ADR-008-repository-service-layer.md)

### 스펙
- [SDD-DB-MIGRATION-MANAGEMENT](../specs/SDD-DB-MIGRATION-MANAGEMENT.md)

---

## 8. 참고 자료

### 8.1 학술 자료

| 주제 | 저자 | 출처 | DOI/링크 |
|------|------|------|----------|
| **Finite Automata Theory** | Hopcroft, Ullman | Introduction to Automata Theory (1979) | ISBN: 978-0201029888 |
| **ACID Properties** | Haerder, Reuter | ACM Computing Surveys (1983) | DOI: 10.1145/289.291 |
| **CAP Theorem** | Eric Brewer | PODC 2000 Keynote | DOI: 10.1145/343477.343502 |
| **Database Refactoring** | Ambler, Sadalage | Refactoring Databases (2006) | ISBN: 978-0321293534 |
| **Schema Evolution** | Curino et al. | SIGMOD 2008 | DOI: 10.1145/1376616.1376698 |

### 8.2 기술 문서

- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL Write-Ahead Logging](https://www.postgresql.org/docs/current/wal-intro.html)

### 8.3 패턴 참고

- [Database Refactoring Patterns - Martin Fowler](https://martinfowler.com/books/refactoringDatabases.html)
- [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)
- [Zero-Downtime Migrations](https://stripe.com/blog/online-migrations)

---

**Version**: 2.0 | **Created**: 2026-01-21 | **Updated**: 2026-01-22

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 2.0 | 2026-01-22 | P3 준수 - DFA 형식 정의, 안전성 메트릭, ACID 검증 공식, 학술 인용 추가 |
| 1.0 | 2026-01-21 | 초기 버전 |
