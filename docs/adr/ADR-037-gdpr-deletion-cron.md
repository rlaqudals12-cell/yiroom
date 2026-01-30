# ADR-037: GDPR 삭제 Cron 전략

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"GDPR/PIPA 법률을 100% 준수하면서, 사용자에게는 실수 복구 기회를 제공하고, 운영팀에게는 완전 자동화된 삭제 프로세스"

- **법적 완전 준수**: PIPA 5일 이내 하드 삭제, GDPR 1개월 이내 처리
- **사용자 보호**: 30일 유예 기간, 복구 가능, 알림 발송
- **완전 자동화**: 인적 개입 없이 Cron Job으로 자동 처리
- **감사 가능**: 불변 감사 로그로 컴플라이언스 증명

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 법적 기한 | PIPA 5일은 법정 기한 - 단축 불가 |
| Clerk 의존성 | Clerk API 호출 실패 시 재시도 필요 |
| 대량 삭제 | 동시 대량 탈퇴 시 배치 처리 필요 |
| 감사 로그 보관 | 2년 이상 보관 요구로 스토리지 비용 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| PIPA 5일 준수율 | 100% | 0% | 구현 후 측정 |
| 복구 요청 처리율 | 100% (30일 내) | 0% | 유예 기간 내 |
| Cron 성공률 | 99.9% | 0% | 재시도 포함 |
| 알림 발송률 | 100% (7/3/1일 전) | 0% | 이메일 + 푸시 |

### 현재 목표: 90%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 즉시 삭제 | 실수 복구 불가 (UX) | - |
| Soft Delete만 | PIPA 위반 (LEGAL_ISSUE) | - |
| 수동 삭제 | 확장성 부족 (SCALE) | - |
| 실시간 Clerk 동기화 | 배치 처리로 충분 (ALT_SUFFICIENT) | 동기화 이슈 발생 시 |

---

## 맥락 (Context)

이룸 서비스는 얼굴 이미지, 신체 데이터 등 민감한 개인정보를 수집합니다. 한국 개인정보보호법(PIPA)과 GDPR 준수를 위해 다음이 필요합니다:

### 법적 요구사항

| 법률 | 조항 | 요구사항 |
|------|------|---------|
| **PIPA 제21조** | 개인정보 파기 | 보유기간 경과/목적 달성 시 **지체없이 파기** |
| **PIPA 시행령** | 파기 기한 | **5일 이내** (근무일 기준) |
| **PIPA 제58조의2** | 파기 방법 | **복구 불가능한 방법** (하드 삭제) |
| **GDPR Article 17** | 잊힐 권리 | 삭제 요청 시 **1개월 이내** 처리 |
| **GDPR Article 7(3)** | 동의 철회 | 동의 철회 = 삭제 트리거 |

### 현재 상태

기존에 3개의 Cron Job이 개별적으로 구현되어 있습니다:
- `cleanup-images`: 30일 미접속 사용자 이미지 익명화
- `cleanup-consents`: 만료된 이미지 저장 동의 정리
- `cleanup-audit-logs`: 오래된 감사 로그 정리

**문제점**:
1. 탈퇴 사용자 데이터 하드 삭제 프로세스 미통합
2. PIPA 5일 기준 명시적 적용 부재
3. Clerk 계정 삭제 동기화 미구현
4. 삭제 전 알림 시스템 부재

## 결정 (Decision)

**3단계 삭제 Cron 시스템**을 구현합니다:

```
┌─────────────────────────────────────────────────────────────────┐
│                    GDPR 삭제 프로세스 플로우                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 삭제 요청 (사용자 → API)                                    │
│     └── deletion_requested_at = NOW()                          │
│     └── deletion_scheduled_at = NOW() + 30일 (유예기간)        │
│                           ↓                                     │
│  2. 알림 Cron (삭제 7일/3일/1일 전)                             │
│     └── 이메일 + 푸시 알림                                      │
│     └── 복구 가능성 안내                                        │
│                           ↓                                     │
│  3. Soft Delete Cron (예정일 도래)                              │
│     └── deleted_at = NOW()                                      │
│     └── 사용자 접근 차단                                        │
│     └── 관련 테이블 cascade soft delete                         │
│                           ↓                                     │
│  4. Hard Delete Cron (PIPA 5일 경과)                            │
│     └── 모든 개인정보 완전 삭제                                  │
│     └── Clerk deleteUser API 호출                               │
│     └── 불변 감사 로그 기록                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cron Job 스케줄

| Cron Job | 시간 (UTC) | 시간 (KST) | 목적 |
|----------|-----------|-----------|------|
| `deletion-reminder` | 00:00 | 09:00 | 삭제 예정 알림 발송 |
| `soft-delete-users` | 03:00 | 12:00 | Soft Delete 실행 |
| `hard-delete-users` | 04:00 | 13:00 | Hard Delete 실행 |

### 삭제 대상 테이블

```typescript
const DELETION_TABLES = [
  // 민감 분석 데이터 (P0)
  'personal_color_assessments',
  'skin_analyses',
  'body_analyses',
  'hair_analyses',
  'posture_assessments',
  'user_body_measurements',

  // 건강/운동 데이터
  'workout_logs',
  'meal_records',
  'daily_nutrition_summary',
  'water_intake_logs',

  // 소셜 데이터
  'friendships',
  'feed_posts',
  'post_likes',
  'post_comments',
  'product_reviews',

  // 사용자 설정
  'user_preferences',
  'user_notification_settings',
  'user_push_tokens',
  'user_badges',
  'user_levels',

  // 마지막: users 테이블
  'users',
] as const;
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **단일 Cron Job** | 구현 단순 | 장애 시 전체 영향 | `RISK` - 단일 실패점 |
| **즉시 삭제** | 법적 위험 최소화 | 복구 불가 | `UX` - 실수 복구 불가 |
| **Soft Delete만** | 복구 가능 | PIPA 위반 | `LEGAL_ISSUE` - 하드 삭제 필수 |
| **수동 삭제** | 세밀한 제어 | 확장성 부재 | `SCALE` - MAU 증가 시 불가 |
| **30일 유예 + 5일 삭제** ✅ | 복구 기회 + 법적 준수 | 구현 복잡도 | **채택** |

## 결과 (Consequences)

### 긍정적 결과

- **법적 준수**: PIPA 5일 기준 명시적 준수
- **사용자 보호**: 30일 유예 기간으로 실수 복구 가능
- **투명성**: 삭제 전 7일/3일/1일 알림
- **감사 가능**: 불변 감사 로그로 컴플라이언스 증명

### 부정적 결과

- **구현 복잡도**: 3개 Cron Job 관리 필요
- **스토리지**: 30일간 soft-deleted 데이터 보관
- **Clerk 의존성**: Clerk API 호출 실패 시 재시도 필요

### 리스크

- **Clerk API 실패**: 재시도 큐 + 수동 처리 fallback 필요
- **대량 삭제**: 배치 처리 (20명/회) + 타임아웃 관리
- **감사 로그 용량**: 2년 보관 → 주기적 아카이빙 필요

## 구현 가이드

### 1. 데이터베이스 스키마

```sql
-- users 테이블 확장
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  deletion_requested_at TIMESTAMPTZ,
  deletion_scheduled_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ;

-- 삭제 감사 로그 (불변)
CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- REQUESTED, REMINDER_SENT, SOFT_DELETED, HARD_DELETED
  performed_at TIMESTAMPTZ DEFAULT now(),
  details JSONB,
  is_permanent BOOLEAN DEFAULT true
);

-- 감사 로그 수정 방지 트리거
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_permanent = true THEN
    RAISE EXCEPTION 'Cannot modify permanent audit log';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_deletion_audit_update
  BEFORE UPDATE OR DELETE ON deletion_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

### 2. Hard Delete 함수

```sql
CREATE OR REPLACE FUNCTION hard_delete_user(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_clerk_user_id TEXT;
BEGIN
  -- Clerk ID 저장 (API 호출용)
  SELECT clerk_user_id INTO v_clerk_user_id
  FROM users WHERE id = p_user_id;

  -- 의존성 순서대로 삭제
  DELETE FROM user_body_measurements WHERE user_id = p_user_id;
  DELETE FROM personal_color_assessments WHERE user_id = p_user_id;
  DELETE FROM skin_analyses WHERE user_id = p_user_id;
  DELETE FROM body_analyses WHERE user_id = p_user_id;
  -- ... (모든 테이블)

  -- 마지막: users 삭제
  DELETE FROM users WHERE id = p_user_id;

  -- 감사 로그 (불변)
  INSERT INTO deletion_audit_log (user_id, action, details)
  VALUES (p_user_id, 'HARD_DELETED', jsonb_build_object(
    'clerk_user_id', v_clerk_user_id,
    'tables_deleted', (SELECT count(*) FROM DELETION_TABLES)
  ));
END;
$$ LANGUAGE plpgsql;
```

### 3. Cron Route Handler

```typescript
// app/api/cron/hard-delete-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { clerkClient } from '@clerk/nextjs/server';

const BATCH_SIZE = 20;
const PIPA_GRACE_DAYS = 5;

export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // PIPA 5일 경과한 soft-deleted 사용자 조회
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PIPA_GRACE_DAYS);

  const { data: users, error } = await supabase
    .from('users')
    .select('id, clerk_user_id')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoffDate.toISOString())
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let deleted = 0;
  let failed = 0;

  for (const user of users ?? []) {
    try {
      // 1. Supabase 하드 삭제
      await supabase.rpc('hard_delete_user', { p_user_id: user.id });

      // 2. Clerk 계정 삭제
      if (user.clerk_user_id) {
        await clerkClient.users.deleteUser(user.clerk_user_id);
      }

      deleted++;
    } catch (err) {
      console.error(`Failed to delete user ${user.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    deleted,
    failed,
    remaining: (users?.length ?? 0) - deleted - failed,
  });
}
```

### 4. Vercel Cron 설정

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/deletion-reminder",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/soft-delete-users",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/hard-delete-users",
      "schedule": "0 4 * * *"
    }
  ]
}
```

## 테스트 시나리오

| 시나리오 | 입력 | 예상 결과 |
|---------|------|----------|
| 삭제 요청 | 사용자 탈퇴 버튼 | deletion_scheduled_at = NOW() + 30일 |
| 알림 발송 | 삭제 7일 전 | 이메일 + 푸시 알림 |
| Soft Delete | 예정일 도래 | deleted_at 설정, 접근 차단 |
| Hard Delete | PIPA 5일 경과 | 모든 데이터 삭제, Clerk 동기화 |
| 복구 | 유예 기간 내 요청 | deletion_* 필드 NULL |
| Clerk 실패 | API 타임아웃 | 재시도 큐 등록 |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 법적 준수](../principles/legal-compliance.md) - PIPA/GDPR 기준

### 리서치 문서
- [리서치: N-3-R1-GDPR-개인정보보호법](../research/claude-ai-research/N-3-R1-GDPR-개인정보보호법.md)

### 관련 ADR
- [ADR-022: 연령 확인](./ADR-022-age-verification.md) - 법적 준수 전략
- [ADR-023: 이용약관 플로우](./ADR-023-terms-agreement-flow.md)
- [ADR-025: 감사 로깅](./ADR-025-audit-logging.md)

### 관련 스펙
- [SDD-N-1-AGE-VERIFICATION](../specs/SDD-N-1-AGE-VERIFICATION.md) - 참조 구현 패턴
- [SDD-AUDIT-LOGGING](../specs/SDD-AUDIT-LOGGING.md)

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-GDPR-DELETION-CRON](../specs/SDD-GDPR-DELETION-CRON.md) | 📝 작성 예정 | Cron Job 상세 스펙 |

---

**Author**: Claude Code
**Reviewed by**: -
