# ADR-025: 감사 로그 (Audit Logging)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 민감 작업이 추적 가능하고, 이상 패턴 자동 탐지"

- 로깅: 민감 작업 100% 기록
- 보관: 법정 보관기간 (5년) 준수
- 분석: 이상 패턴 자동 알림
- 조회: 관리자 대시보드
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 로깅 커버리지 | 민감 이벤트 100% |
| 보관 기간 | 5년 암호화 보관 |
| 이상 탐지 | 자동 알림 시스템 |

### 현재 달성률

**65%** - 기본 로깅 구현, 이상 탐지 미구현

---

## 상태

`accepted`

## 날짜

2026-01-16

## 맥락 (Context)

이룸은 민감한 개인정보(얼굴 이미지, 신체 정보, 건강 기록)를 처리합니다. 다음 이유로 감사 로그가 필요합니다:

1. **법적 요구**: 개인정보보호법 제29조 (개인정보 처리 기록 보관)
2. **보안 감사**: 비정상 접근 패턴 탐지
3. **분쟁 대응**: 데이터 접근/수정 이력 증빙
4. **디버깅**: 문제 발생 시 추적

### 로깅 대상

| 이벤트 | 민감도 | 로깅 필수 |
|--------|--------|----------|
| 로그인/로그아웃 | 중 | ✅ |
| 분석 결과 조회 | 상 | ✅ |
| 개인정보 수정 | 상 | ✅ |
| 개인정보 삭제 | 상 | ✅ |
| 동의 변경 | 상 | ✅ |
| API 호출 (일반) | 하 | ❌ |

## 결정 (Decision)

**Supabase 테이블 기반 감사 로그** 방식을 채택합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    감사 로그 아키텍처                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  이벤트 발생 (API/Server Component)                          │
│       ↓                                                      │
│  logAudit() 호출                                             │
│       ↓                                                      │
│  PII 마스킹 (redactPII)                                      │
│       ↓                                                      │
│  audit_logs 테이블 INSERT                                    │
│       ↓                                                      │
│  비동기 처리 (응답 지연 방지)                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 로그 레벨 정의

| 레벨 | 용도 | 보관 기간 |
|------|------|----------|
| `info` | 일반 정보 | 90일 |
| `warn` | 경고 (비정상 패턴) | 1년 |
| `error` | 오류 | 1년 |
| `security` | 보안 관련 | 3년 |

### 이벤트 타입 정의

```
auth.login              - 로그인
auth.logout             - 로그아웃
auth.login_failed       - 로그인 실패
user.profile_update     - 프로필 수정
user.profile_delete     - 프로필 삭제
user.data_access        - 개인정보 조회
user.agreement_change   - 동의 변경
analysis.skin           - 피부 분석
analysis.personal_color - 퍼스널컬러 분석
analysis.body           - 체형 분석
ai.result_displayed     - AI 결과 표시
security.rate_limit     - Rate Limit 도달
security.unauthorized   - 권한 없는 접근 시도
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 파일 로그 | 구현 간단 | 검색 어려움, 확장성 낮음 | `LOW_ROI` - 분석 불편 |
| 외부 서비스 (Datadog, Splunk) | 강력한 분석 | 비용 높음 | `FINANCIAL_HOLD` - MVP 과도 |
| console.log만 | 즉시 구현 | 보관/검색 불가 | `LEGAL_ISSUE` - 법적 요건 미충족 |

## 결과 (Consequences)

### 긍정적 결과

- **법적 준수**: 개인정보 처리 기록 보관 의무 충족
- **보안 강화**: 비정상 패턴 탐지 가능
- **분쟁 대응**: 증거 확보 가능
- **비용 효율**: Supabase 기본 제공 스토리지 활용

### 부정적 결과

- **성능 영향**: INSERT 추가 (비동기로 최소화)
- **스토리지 비용**: 로그 누적에 따른 비용

### 리스크

- 로그 테이블 용량 증가 → **90일 이상 로그 자동 삭제 Cron**
- PII 로깅 실수 → **redactPII 필수 적용, 코드 리뷰 체크**

## 구현 가이드

### DB 스키마

```sql
-- supabase/migrations/20260116_audit_logs.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT,                    -- NULL 허용 (비로그인 이벤트)
  event_type TEXT NOT NULL,              -- 'auth.login', 'user.data_access' 등
  event_level TEXT NOT NULL DEFAULT 'info',  -- 'info', 'warn', 'error', 'security'
  metadata JSONB DEFAULT '{}',           -- 추가 정보 (PII 마스킹됨)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_audit_logs_user ON audit_logs(clerk_user_id);
CREATE INDEX idx_audit_logs_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS: 관리자만 읽기 (일반 사용자 접근 불가)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 서비스 롤만 INSERT 허용 (클라이언트 직접 접근 불가)
CREATE POLICY "service_role_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);  -- service_role만 접근

CREATE POLICY "service_role_select" ON audit_logs
  FOR SELECT USING (true);  -- service_role만 접근
```

### PII 마스킹 유틸리티

```typescript
// lib/utils/redact-pii.ts
const PII_FIELDS = [
  'email', 'phone', 'birthDate', 'address',
  'faceImage', 'bodyImage', 'clerk_user_id'
];

export function redactPII(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data;

  if (Array.isArray(data)) {
    return data.map(redactPII);
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (PII_FIELDS.includes(key)) {
        return [key, '[REDACTED]'];
      }
      return [key, redactPII(value)];
    })
  );
}
```

### 감사 로그 함수

```typescript
// lib/audit/logger.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { redactPII } from '@/lib/utils/redact-pii';

type EventLevel = 'info' | 'warn' | 'error' | 'security';

interface AuditLogInput {
  eventType: string;
  eventLevel?: EventLevel;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(
  supabase: SupabaseClient,
  eventType: string,
  metadata?: Record<string, unknown>,
  options?: {
    eventLevel?: EventLevel;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    // PII 마스킹
    const sanitizedMetadata = redactPII(metadata ?? {});

    // 비동기로 INSERT (응답 지연 방지)
    supabase
      .from('audit_logs')
      .insert({
        event_type: eventType,
        event_level: options?.eventLevel ?? 'info',
        metadata: sanitizedMetadata,
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
      })
      .then(({ error }) => {
        if (error) {
          console.error('[AuditLog] Insert failed:', error);
        }
      });
  } catch (error) {
    // 로깅 실패가 메인 로직을 방해하지 않도록
    console.error('[AuditLog] Error:', error);
  }
}
```

### 사용 예시

```typescript
// API 라우트에서 사용
export async function POST(request: Request) {
  const { userId } = await auth();
  const supabase = createServiceRoleClient();

  // 분석 수행
  const result = await analyzeSkin(imageBase64);

  // 감사 로그 기록
  await logAudit(supabase, 'analysis.skin', {
    analysisId: result.id,
    skinType: result.skinType,
  });

  return Response.json(result);
}

// 보안 이벤트 로깅
await logAudit(supabase, 'security.rate_limit', {
  endpoint: '/api/analyze/skin',
  limitExceeded: true,
}, {
  eventLevel: 'warn',
  ipAddress: request.headers.get('x-forwarded-for') ?? '',
});
```

### 자동 삭제 Cron

```typescript
// app/api/cron/cleanup-audit-logs/route.ts
export async function GET(request: Request) {
  const supabase = createServiceRoleClient();

  // 90일 이전 info 레벨 로그 삭제
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const { error } = await supabase
    .from('audit_logs')
    .delete()
    .eq('event_level', 'info')
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - 감사 로그 보존 의무
- [원리: 보안 패턴](../principles/security-patterns.md) - 로깅 보안, PII 마스킹

### 관련 ADR/스펙
- [ADR-013: 에러 처리](./ADR-013-error-handling.md)
- [규칙: 보안 체크리스트](../../.claude/rules/security-checklist.md)

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-AUDIT-LOGGING](../specs/SDD-AUDIT-LOGGING.md) | ✅ 구현됨 | 감사 로그 스키마, logAudit 함수, Cron 정리 |

### 핵심 구현 파일

```
lib/audit/
└── logger.ts             # logAudit() 함수

lib/utils/
└── redact-pii.ts         # PII 마스킹

supabase/migrations/
└── 20260115_audit_logs_security.sql

app/api/cron/
└── cleanup-audit-logs/route.ts  # 90일 정리
```

---

**Author**: Claude Code
**Reviewed by**: -
