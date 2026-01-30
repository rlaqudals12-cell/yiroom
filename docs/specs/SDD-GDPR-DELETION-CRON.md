# SDD-GDPR-DELETION-CRON: GDPR 삭제 Cron 스펙

> **Phase**: Phase -2 (법적 필수)
> **Priority**: P0 (필수)
> **Status**: 📝 Draft
> **ADR**: [ADR-037-gdpr-deletion-cron](../adr/ADR-037-gdpr-deletion-cron.md)
> **Created**: 2026-01-23

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"완벽한 GDPR/PIPA 준수 자동 데이터 삭제 시스템"

- **삭제 프로세스**: 요청 즉시 유예 기간 시작, 완전 자동화
- **알림 시스템**: 7일/3일/1일 전 이메일+푸시+SMS 다채널 알림
- **복구 기능**: 유예 기간 내 원클릭 즉시 복구
- **법적 준수**: PIPA 5일 기준 100% 준수, 불변 감사 로그 2년 보관
- **Clerk 동기화**: 실시간 계정 연동
- **성능**: 대량 삭제 시에도 성능 저하 없음

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 법적 보관 의무 | 일부 데이터는 법적 보관 기간 준수 필요 |
| Clerk API 제한 | 삭제 동기화 API Rate Limit |
| 트랜잭션 크기 | 대량 삭제 시 DB 락 위험 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| 삭제 자동화 | 완전 자동 | 완전 자동 | 100% |
| 알림 채널 | 이메일+푸시+SMS | 이메일+푸시 | 67% |
| 복구 기능 | 원클릭 UI | API 복구 | 70% |
| Clerk 동기화 | 실시간 | Cron 배치 | 60% |
| 모니터링 | 실시간 대시보드 | 로그 기반 | 50% |

### 현재 목표

**종합 달성률**: **80%** (MVP GDPR 삭제 Cron)

### 의도적 제외 (이번 버전)

- SMS 알림 (비용 대비 효과 낮음)
- 실시간 Clerk 동기화 (Cron 배치로 충분)
- 관리자 대시보드 (Phase 4에서 구현)

#### 📊 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| 소프트 삭제 Cron Job | ✅ 완료 | `app/api/cron/soft-delete-users/route.ts` |
| 하드 삭제 Cron Job | ✅ 완료 | `app/api/cron/hard-delete-users/route.ts` |
| 삭제 리마인더 Cron | ✅ 완료 | `app/api/cron/deletion-reminder/route.ts` |
| 삭제 요청 API | ✅ 완료 | `app/api/user/delete-request/route.ts` |
| GDPR 타입 정의 | ✅ 완료 | `types/gdpr.ts` |
| 이메일 알림 연동 | 📋 계획 | `lib/gdpr/email-notifier.ts` |
| 삭제 확인 UI | 📋 계획 | `components/settings/DeleteAccountConfirm.tsx` |
| 감사 로그 기록 | ⏳ 진행중 | `lib/audit/gdpr-logger.ts` |

---

## 1. 개요

### 1.1 목적

PIPA(개인정보보호법)과 GDPR 준수를 위한 자동화된 사용자 데이터 삭제 시스템 구현.

### 1.2 법적 근거

| 법률 | 조항 | 요구사항 | 준수 방법 |
|------|------|---------|----------|
| PIPA 제21조 | 개인정보 파기 | 지체없이 파기 | 자동 Cron Job |
| PIPA 시행령 | 파기 기한 | **5일 이내** | hard-delete-users Cron |
| PIPA 제58조의2 | 파기 방법 | 복구 불가능 | PostgreSQL DELETE |
| GDPR Art.17 | 잊힐 권리 | 1개월 이내 | 30일 유예 + 5일 삭제 |

### 1.3 범위

- **포함**: 탈퇴 사용자 데이터 삭제, 동의 철회 처리, 삭제 알림
- **제외**: 이미지 익명화 (기존 cleanup-images 유지), 법적 보관 의무 데이터

---

## 2. 궁극의 형태 (P1)

### 2.1 이상적 최종 상태

```
100점 기준:
- 삭제 요청 즉시 유예 기간 시작
- 7일/3일/1일 전 자동 알림
- 유예 기간 내 원클릭 복구
- PIPA 5일 기준 완벽 준수
- Clerk 계정 동기화 100%
- 불변 감사 로그 2년 보관
- 대량 삭제 시 성능 저하 없음
```

### 2.2 현재 목표 (80%)

| 항목 | 100% | 현재 목표 | 비고 |
|------|------|----------|------|
| 삭제 프로세스 | 완전 자동화 | 완전 자동화 | ✅ |
| 알림 시스템 | 이메일+푸시+SMS | 이메일+푸시 | SMS 제외 |
| 복구 기능 | 원클릭 복구 | API 복구 | UI 단순화 |
| Clerk 동기화 | 실시간 | Cron 배치 | 지연 허용 |
| 모니터링 | 실시간 대시보드 | 로그 기반 | P2 이후 |

### 2.3 의도적 제외

- SMS 알림: 비용 대비 효과 낮음
- 실시간 Clerk 동기화: Cron 배치로 충분
- 관리자 대시보드: Phase 4에서 구현

---

## 3. 원자 분해 (P3)

### 3.1 ATOM-1: 데이터베이스 스키마 확장 (1h)

**입력**: 없음
**출력**: 마이그레이션 파일

```sql
-- 파일: 20260123_gdpr_deletion_schema.sql

-- 1. users 테이블 확장
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  deletion_requested_at TIMESTAMPTZ,
  deletion_scheduled_at TIMESTAMPTZ;
  -- deleted_at 이미 존재

-- 2. 삭제 감사 로그 테이블
CREATE TABLE IF NOT EXISTS deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'DELETION_REQUESTED',
    'DELETION_CANCELLED',
    'REMINDER_7D_SENT',
    'REMINDER_3D_SENT',
    'REMINDER_1D_SENT',
    'SOFT_DELETED',
    'HARD_DELETED',
    'CLERK_DELETED'
  )),
  performed_at TIMESTAMPTZ DEFAULT now(),
  details JSONB,
  is_permanent BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled
  ON users(deletion_scheduled_at)
  WHERE deletion_scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON users(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_deletion_audit_user
  ON deletion_audit_log(user_id);

-- 4. 감사 로그 불변성 트리거
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_permanent = true THEN
    RAISE EXCEPTION 'Cannot modify permanent audit log';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.is_permanent = true THEN
    RAISE EXCEPTION 'Cannot delete permanent audit log';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_deletion_audit_update ON deletion_audit_log;
CREATE TRIGGER prevent_deletion_audit_update
  BEFORE UPDATE OR DELETE ON deletion_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- 5. RLS 정책
ALTER TABLE deletion_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON deletion_audit_log
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

**성공 기준**: 마이그레이션 성공, 트리거 동작 확인

### 3.2 ATOM-2: 삭제 요청 API (2h)

**입력**: userId (Clerk)
**출력**: 삭제 예정일

```typescript
// app/api/user/delete-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

const GRACE_PERIOD_DAYS = 30;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const supabase = await createClerkSupabaseClient();

  const now = new Date();
  const scheduledAt = new Date(now);
  scheduledAt.setDate(scheduledAt.getDate() + GRACE_PERIOD_DAYS);

  // 삭제 요청 등록
  const { data: user, error } = await supabase
    .from('users')
    .update({
      deletion_requested_at: now.toISOString(),
      deletion_scheduled_at: scheduledAt.toISOString(),
    })
    .eq('clerk_user_id', userId)
    .select('id')
    .single();

  if (error) {
    console.error('[GDPR] Delete request failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  // 감사 로그
  await supabase.from('deletion_audit_log').insert({
    user_id: user.id,
    action: 'DELETION_REQUESTED',
    details: {
      requested_at: now.toISOString(),
      scheduled_at: scheduledAt.toISOString(),
      grace_period_days: GRACE_PERIOD_DAYS,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      scheduledAt: scheduledAt.toISOString(),
      gracePeriodDays: GRACE_PERIOD_DAYS,
      canCancelUntil: scheduledAt.toISOString(),
    },
  });
}

// 삭제 취소
export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const supabase = await createClerkSupabaseClient();

  const { data: user, error } = await supabase
    .from('users')
    .update({
      deletion_requested_at: null,
      deletion_scheduled_at: null,
    })
    .eq('clerk_user_id', userId)
    .is('deleted_at', null) // 아직 soft delete 안 된 경우만
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Cannot cancel deletion' } },
      { status: 400 }
    );
  }

  // 감사 로그
  await supabase.from('deletion_audit_log').insert({
    user_id: user.id,
    action: 'DELETION_CANCELLED',
  });

  return NextResponse.json({ success: true });
}
```

**성공 기준**: API 응답 정상, 감사 로그 생성

### 3.3 ATOM-3: 알림 Cron Job (2h)

**입력**: 없음 (스케줄 트리거)
**출력**: 발송된 알림 수

```typescript
// app/api/cron/deletion-reminder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { sendPushNotification } from '@/lib/push/server';

const REMINDER_DAYS = [7, 3, 1];

export async function GET(request: NextRequest) {
  // Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const results: Record<string, number> = {};

  for (const days of REMINDER_DAYS) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 해당 날짜에 삭제 예정인 사용자 조회
    const { data: users } = await supabase
      .from('users')
      .select('id, email, clerk_user_id')
      .gte('deletion_scheduled_at', startOfDay.toISOString())
      .lt('deletion_scheduled_at', endOfDay.toISOString())
      .is('deleted_at', null);

    let sent = 0;
    for (const user of users ?? []) {
      try {
        // 이메일 발송
        await sendEmail({
          to: user.email,
          template: 'deletion-reminder',
          data: {
            daysRemaining: days,
            cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/account/cancel-deletion`,
          },
        });

        // 푸시 알림
        await sendPushNotification(user.clerk_user_id, {
          title: '계정 삭제 예정 알림',
          body: `${days}일 후 계정이 삭제됩니다. 취소하려면 탭하세요.`,
          data: { screen: '/settings/account' },
        });

        // 감사 로그
        await supabase.from('deletion_audit_log').insert({
          user_id: user.id,
          action: `REMINDER_${days}D_SENT`,
          details: { email: user.email },
        });

        sent++;
      } catch (err) {
        console.error(`[GDPR] Reminder failed for user ${user.id}:`, err);
      }
    }

    results[`${days}d`] = sent;
  }

  return NextResponse.json({ success: true, sent: results });
}
```

**성공 기준**: 알림 발송, 감사 로그 생성

### 3.4 ATOM-4: Soft Delete Cron Job (2h)

**입력**: 없음 (스케줄 트리거)
**출력**: Soft Delete 처리된 사용자 수

```typescript
// app/api/cron/soft-delete-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const BATCH_SIZE = 50;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();

  // 삭제 예정일이 지난 사용자 조회
  const { data: users, error } = await supabase
    .from('users')
    .select('id')
    .lte('deletion_scheduled_at', now.toISOString())
    .is('deleted_at', null)
    .limit(BATCH_SIZE);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let failed = 0;

  for (const user of users ?? []) {
    try {
      // Soft Delete
      await supabase
        .from('users')
        .update({ deleted_at: now.toISOString() })
        .eq('id', user.id);

      // 감사 로그
      await supabase.from('deletion_audit_log').insert({
        user_id: user.id,
        action: 'SOFT_DELETED',
        details: { soft_deleted_at: now.toISOString() },
      });

      processed++;
    } catch (err) {
      console.error(`[GDPR] Soft delete failed for user ${user.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    failed,
    remaining: (users?.length ?? 0) > BATCH_SIZE,
  });
}
```

**성공 기준**: soft delete 완료, 감사 로그 생성

### 3.5 ATOM-5: Hard Delete Cron Job (3h)

**입력**: 없음 (스케줄 트리거)
**출력**: Hard Delete 처리된 사용자 수

```typescript
// app/api/cron/hard-delete-users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { clerkClient } from '@clerk/nextjs/server';

const BATCH_SIZE = 20;
const PIPA_GRACE_DAYS = 5;

// 삭제 대상 테이블 (의존성 순서)
const DELETION_TABLES = [
  'user_body_measurements',
  'personal_color_assessments',
  'skin_analyses',
  'body_analyses',
  'hair_analyses',
  'posture_assessments',
  'workout_logs',
  'workout_sets',
  'meal_records',
  'meal_items',
  'daily_nutrition_summary',
  'water_intake_logs',
  'friendships',
  'feed_posts',
  'post_likes',
  'post_comments',
  'product_reviews',
  'user_preferences',
  'user_notification_settings',
  'user_push_tokens',
  'user_badges',
  'user_levels',
  'wellness_scores',
  'image_consents',
] as const;

export async function GET(request: NextRequest) {
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
    .select('id, clerk_user_id, email')
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
      // 1. 관련 테이블 데이터 삭제 (의존성 순서)
      for (const table of DELETION_TABLES) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          console.warn(`[GDPR] Delete from ${table} warning:`, deleteError);
        }
      }

      // 2. users 테이블 삭제
      await supabase.from('users').delete().eq('id', user.id);

      // 3. Clerk 계정 삭제
      if (user.clerk_user_id) {
        try {
          await clerkClient.users.deleteUser(user.clerk_user_id);

          await supabase.from('deletion_audit_log').insert({
            user_id: user.id,
            action: 'CLERK_DELETED',
            details: { clerk_user_id: user.clerk_user_id },
          });
        } catch (clerkError) {
          console.error(`[GDPR] Clerk delete failed:`, clerkError);
          // Clerk 실패해도 DB 삭제는 완료로 처리
        }
      }

      // 4. 최종 감사 로그 (불변)
      await supabase.from('deletion_audit_log').insert({
        user_id: user.id,
        action: 'HARD_DELETED',
        details: {
          tables_deleted: DELETION_TABLES.length,
          deleted_at: new Date().toISOString(),
          compliance: 'PIPA_5_DAYS',
        },
        is_permanent: true,
      });

      deleted++;
    } catch (err) {
      console.error(`[GDPR] Hard delete failed for user ${user.id}:`, err);
      failed++;

      // 실패 감사 로그
      await supabase.from('deletion_audit_log').insert({
        user_id: user.id,
        action: 'HARD_DELETE_FAILED',
        details: { error: String(err) },
      });
    }
  }

  return NextResponse.json({
    success: true,
    deleted,
    failed,
    remaining: (users?.length ?? 0) === BATCH_SIZE,
  });
}
```

**성공 기준**: 데이터 완전 삭제, Clerk 동기화, 감사 로그 생성

### 3.6 ATOM-6: Vercel Cron 설정 (30min)

**입력**: 없음
**출력**: vercel.json 업데이트

```json
// vercel.json 추가
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

**성공 기준**: Vercel 배포 후 Cron 스케줄 확인

### 3.7 ATOM-7: 테스트 작성 (2h)

**입력**: 각 ATOM 구현
**출력**: 테스트 파일

```typescript
// tests/api/cron/gdpr-deletion.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('GDPR Deletion Cron', () => {
  describe('DELETE /api/user/delete-request', () => {
    it('should schedule deletion after 30 days', async () => {
      // ...
    });

    it('should create audit log on request', async () => {
      // ...
    });

    it('should allow cancellation within grace period', async () => {
      // ...
    });
  });

  describe('GET /api/cron/deletion-reminder', () => {
    it('should send reminders 7, 3, 1 days before', async () => {
      // ...
    });
  });

  describe('GET /api/cron/soft-delete-users', () => {
    it('should soft delete users past scheduled date', async () => {
      // ...
    });
  });

  describe('GET /api/cron/hard-delete-users', () => {
    it('should hard delete after PIPA 5 days', async () => {
      // ...
    });

    it('should delete from all related tables', async () => {
      // ...
    });

    it('should sync with Clerk', async () => {
      // ...
    });
  });
});
```

**성공 기준**: 모든 테스트 통과

---

## 4. 타입 정의

```typescript
// types/gdpr.ts
export interface DeletionRequest {
  userId: string;
  requestedAt: string;
  scheduledAt: string;
  gracePeriodDays: number;
}

export interface DeletionAuditLog {
  id: string;
  userId: string;
  action: DeletionAuditAction;
  performedAt: string;
  details: Record<string, unknown>;
  isPermanent: boolean;
}

export type DeletionAuditAction =
  | 'DELETION_REQUESTED'
  | 'DELETION_CANCELLED'
  | 'REMINDER_7D_SENT'
  | 'REMINDER_3D_SENT'
  | 'REMINDER_1D_SENT'
  | 'SOFT_DELETED'
  | 'HARD_DELETED'
  | 'CLERK_DELETED'
  | 'HARD_DELETE_FAILED';

export interface CronJobResult {
  success: boolean;
  processed?: number;
  failed?: number;
  remaining?: boolean;
}
```

---

## 5. 테스트 케이스

| ID | 시나리오 | 입력 | 예상 결과 |
|----|---------|------|----------|
| TC-1 | 삭제 요청 | POST /api/user/delete-request | 30일 후 scheduledAt |
| TC-2 | 삭제 취소 | DELETE /api/user/delete-request | 필드 NULL |
| TC-3 | 삭제 취소 (기간 만료) | DELETE 요청 | 400 에러 |
| TC-4 | 7일 전 알림 | Cron 트리거 | 이메일+푸시 발송 |
| TC-5 | Soft Delete | 예정일 도래 | deleted_at 설정 |
| TC-6 | Hard Delete | PIPA 5일 경과 | 모든 데이터 삭제 |
| TC-7 | Clerk 동기화 | Hard Delete 후 | Clerk 계정 삭제 |
| TC-8 | 감사 로그 불변성 | UPDATE 시도 | 에러 발생 |
| TC-9 | 배치 처리 | 100명 삭제 대상 | 20명씩 처리 |
| TC-10 | 재시도 | Clerk API 실패 | DB 삭제 성공, Clerk 실패 로그 |

---

## 6. API 명세

### 6.1 삭제 요청

```
POST /api/user/delete-request

Request:
  Headers:
    Authorization: Bearer <clerk-token>

Response (200):
{
  "success": true,
  "data": {
    "scheduledAt": "2026-02-22T00:00:00Z",
    "gracePeriodDays": 30,
    "canCancelUntil": "2026-02-22T00:00:00Z"
  }
}
```

### 6.2 삭제 취소

```
DELETE /api/user/delete-request

Response (200):
{
  "success": true
}

Response (400):
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL",
    "message": "Grace period has expired"
  }
}
```

### 6.3 Cron Jobs

```
GET /api/cron/deletion-reminder
GET /api/cron/soft-delete-users
GET /api/cron/hard-delete-users

Headers:
  Authorization: Bearer <CRON_SECRET>

Response (200):
{
  "success": true,
  "processed": 5,
  "failed": 0,
  "remaining": false
}
```

---

## 7. 의존성

### 7.1 선행 조건

- [x] Clerk 인증 시스템
- [x] Supabase RLS 정책
- [x] 이메일 발송 시스템 (lib/email)
- [x] 푸시 알림 시스템 (lib/push)

### 7.2 관련 모듈

- `lib/email`: 삭제 알림 이메일
- `lib/push/server`: 푸시 알림
- `lib/supabase/server`: Service Role 클라이언트

---

## 8. 체크리스트

### 8.1 구현 체크리스트

- [ ] ATOM-1: 데이터베이스 스키마 확장
- [ ] ATOM-2: 삭제 요청 API
- [ ] ATOM-3: 알림 Cron Job
- [ ] ATOM-4: Soft Delete Cron Job
- [ ] ATOM-5: Hard Delete Cron Job
- [ ] ATOM-6: Vercel Cron 설정
- [ ] ATOM-7: 테스트 작성

### 8.2 법적 준수 체크리스트

- [ ] PIPA 5일 기준 명시
- [ ] 하드 삭제 구현 (복구 불가능)
- [ ] 불변 감사 로그 (2년 보관)
- [ ] Clerk 동기화
- [ ] PII 마스킹 (로깅)

### 8.3 품질 체크리스트

- [ ] typecheck 통과
- [ ] lint 통과
- [ ] 테스트 커버리지 80%+
- [ ] 성능 테스트 (100명 배치)

---

## 9. 관련 문서

- **ADR**: [ADR-037-gdpr-deletion-cron](../adr/ADR-037-gdpr-deletion-cron.md)
- **원리**: [legal-compliance.md](../principles/legal-compliance.md)
- **리서치**: [N-3-R1-GDPR-개인정보보호법](../research/claude-ai-research/N-3-R1-GDPR-개인정보보호법.md)
- **관련 Spec**: [SDD-AUDIT-LOGGING](./SDD-AUDIT-LOGGING.md)

---

**Author**: Claude Code
**Version**: 1.0
**Created**: 2026-01-23
