# 구현 코드 vs 스펙 동기화 분석 보고서

> 생성일: 2026-01-16
> 목적: 실제 구현과 스펙 문서 간의 차이점 분석 및 동기화 계획

---

## 1. 연령 확인 (Age Verification)

### 스펙 vs 구현 비교

| 항목 | SDD-N-1-AGE-VERIFICATION | 실제 구현 | 상태 |
|------|--------------------------|----------|------|
| 핵심 함수 | `isAge14OrOlder()` | `isMinor()`, `verifyAge()` | ⚠️ 이름 다름 |
| 나이 계산 | `calculateAge()` | `calculateAge()` | ✅ 일치 |
| 유효성 검증 | - | `isValidBirthDate()` | 📝 스펙 누락 |
| 차단 화면 | `AgeBlockScreen` 컴포넌트 | `/age-restricted` 페이지 | ⚠️ 구조 다름 |
| 입력 UI | `BirthDateSelector` 컴포넌트 | `/complete-profile` 통합 | ⚠️ 구조 다름 |
| Provider | - | `AgeVerificationProvider` | 📝 스펙 누락 |
| 미들웨어 | - | `middleware.ts` | 📝 스펙 누락 |

### 결론

**실제 구현이 스펙보다 완성도 높음** - 스펙 업데이트 필요

### 동기화 액션

```
[ ] SDD-N-1-AGE-VERIFICATION.md 업데이트:
    - isMinor(), verifyAge() 함수 반영
    - isValidBirthDate() 추가
    - AgeVerificationProvider 추가
    - /complete-profile, /age-restricted 라우트 반영
    - 테스트 파일 경로 업데이트
```

---

## 2. AI 투명성 (AI Transparency)

### 스펙 vs 구현 비교

| 항목 | SDD-AI-TRANSPARENCY | 실제 구현 | 상태 |
|------|---------------------|----------|------|
| AIBadge variant | `default`, `mock` | `default`, `small`, `inline`, `card` | ⚠️ 불일치 |
| Mock 표시 | `variant="mock"` | 미구현 | ❌ 스펙 미구현 |
| 면책 고지 | `AIDisclaimer` (type별) | `AITransparencyNotice` | ⚠️ 이름/구조 다름 |
| MockDataNotice | 별도 컴포넌트 | 미구현 | ❌ 스펙 미구현 |
| 분석 타입별 문구 | skin, color, body, nutrition | 단일 문구만 | ⚠️ 축소 구현 |

### 결론

**스펙이 구현보다 상세함** - 코드 보강 또는 스펙 현실화 필요

### 동기화 액션 (2가지 옵션)

**옵션 A: 스펙에 맞춰 코드 보강**
```
[ ] AIBadge에 mock variant 추가
[ ] AIDisclaimer 컴포넌트 신규 생성 (type별 면책 문구)
[ ] MockDataNotice 컴포넌트 신규 생성
```

**옵션 B: 구현에 맞춰 스펙 현실화** (권장)
```
[ ] SDD-AI-TRANSPARENCY.md 업데이트:
    - variant: default, small, inline, card
    - AITransparencyNotice (compact 모드)
    - Mock 표시는 Phase 2로 연기
```

---

## 3. 감사 로그 (Audit Logging)

### 스펙 vs 구현 비교

| 항목 | SDD-AUDIT-LOGGING | 실제 구현 | 상태 |
|------|-------------------|----------|------|
| 테이블명 | `audit_logs` | `audit_logs` | ✅ 일치 |
| 이벤트 컬럼 | `event_type` | `action` | ⚠️ 이름 다름 |
| 레벨 컬럼 | `event_level` | 미구현 | ❌ 스펙 미구현 |
| 메타데이터 | `metadata` JSONB | `details` JSONB | ⚠️ 이름 다름 |
| 사용자 ID | `clerk_user_id` | `performed_by` | ⚠️ 이름 다름 |
| 수행자 타입 | - | `performed_by_type` | 📝 구현에 추가됨 |
| 함수 시그니처 | `logAudit(supabase, type, meta)` | `logAuditEvent(event)` | ⚠️ 다름 |
| PII 마스킹 | `redactPII()` 필수 | ✅ `lib/utils/redact-pii.ts` | ✅ 완전 구현 |
| 자동 삭제 | Cron Job 정의 | 미확인 | ⚠️ 확인 필요 |

### 실제 구현 스키마 (추론)

```sql
audit_logs (
  id UUID,
  action TEXT,              -- 이벤트 타입
  details JSONB,            -- 메타데이터
  target_user_id TEXT,
  target_table TEXT,
  target_record_id TEXT,
  performed_by TEXT,        -- 수행자 ID
  performed_by_type TEXT,   -- user/admin/system/cron
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ
)
```

### 결론

**스키마 구조 차이 있음** - 스펙을 실제 구현에 맞춰 업데이트 필요

### 동기화 액션

```
[ ] SDD-AUDIT-LOGGING.md 업데이트:
    - 스키마를 실제 구현에 맞춤
    - logAuditEvent() 함수 시그니처 반영
    - 헬퍼 함수들 문서화 (logUserLogin, logAnalysisCreate 등)
    - PII 마스킹은 Phase 2로 연기 (또는 구현 필요)
```

```
[x] lib/utils/redact-pii.ts - 이미 구현됨 (433줄, 완전한 구현)
    - sanitizeForLogging() - 객체 전체 마스킹
    - redactPii.auto() - 필드별 자동 마스킹
    - sanitizeError() - 에러 객체 마스킹
[ ] logAuditEvent에서 sanitizeForLogging 적용 권장
```

---

## 4. 약관 동의 (Terms Agreement)

### 스펙 vs 구현 비교

| 항목 | SDD-LEGAL-SUPPORT | 실제 구현 | 상태 |
|------|-------------------|----------|------|
| API 라우트 | `/api/agreement` | `/api/agreement` | ✅ 일치 |
| 테이블 | `user_agreements` | `user_agreements` | ✅ 일치 |
| 필수 동의 | terms, privacy | terms, privacy | ✅ 일치 |
| 선택 동의 | marketing | marketing | ✅ 일치 |
| 버전 관리 | terms_version, privacy_version | 구현됨 | ✅ 일치 |
| 가드 컴포넌트 | - | `AgreementGuard` | 📝 스펙 누락 |
| 철회 기록 | - | marketing_withdrawn_at | 📝 스펙 누락 |

### 결론

**대부분 일치, 일부 스펙 보강 필요**

### 동기화 액션

```
[ ] SDD-LEGAL-SUPPORT.md 업데이트:
    - AgreementGuard 컴포넌트 추가
    - marketing_withdrawn_at 컬럼 추가
    - API 엔드포인트 상세화 (GET/POST/PATCH)
```

---

## 종합 우선순위

| 순위 | 작업 | 영향도 | 난이도 |
|------|------|--------|--------|
| 1 | PII 마스킹 구현 (redact-pii.ts) | 높음 (법적) | 낮음 |
| 2 | SDD-AUDIT-LOGGING 업데이트 | 중간 | 낮음 |
| 3 | SDD-N-1-AGE-VERIFICATION 업데이트 | 낮음 | 낮음 |
| 4 | SDD-AI-TRANSPARENCY 업데이트 | 낮음 | 낮음 |
| 5 | SDD-LEGAL-SUPPORT 업데이트 | 낮음 | 낮음 |

---

## 권장 액션

### 즉시 실행 (P0) ✅ 완료

1. **PII 마스킹 유틸리티** - ✅ 이미 구현됨
   - `lib/utils/redact-pii.ts` (433줄)
   - 감사 로그 연동은 선택적 개선사항

### 문서 업데이트 (P1)

2. **스펙 문서 4개 업데이트** - 실제 구현에 맞춤
   - 구현이 스펙보다 완성도 높은 경우: 스펙 업데이트
   - 스펙이 구현보다 상세한 경우: Phase 2로 연기 명시

### 선택적 구현 (P2)

3. **AI 투명성 Mock 표시** - ADR-007 연계
4. **분석 타입별 면책 문구** - UX 개선

---

**Version**: 1.0 | **Created**: 2026-01-16
