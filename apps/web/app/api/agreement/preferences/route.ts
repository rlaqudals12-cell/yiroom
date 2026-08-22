import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getClientIp, logConsentGrant, logConsentRevoke } from '@/lib/audit';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const preferencePatchSchema = z
  .object({
    analyticsConsent: z.boolean().optional(),
    marketingConsent: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.analyticsConsent !== undefined || value.marketingConsent !== undefined, {
    message: 'At least one preference is required',
  });

interface ConsentPreferences {
  analyticsConsent: boolean;
  marketingConsent: boolean;
}

type PreferencePatch = z.infer<typeof preferencePatchSchema>;

function apiError(
  status: number,
  code: 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'DB_ERROR' | 'UNKNOWN_ERROR',
  message: string,
  userMessage: string,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, userMessage, ...(details ? { details } : {}) },
    },
    { status }
  );
}

function mapPreferences(row: Record<string, unknown> | null): ConsentPreferences {
  return {
    analyticsConsent: row?.analytics_agreed === true,
    marketingConsent: row?.marketing_agreed === true,
  };
}

function buildPreferenceUpdates(
  userId: string,
  patch: PreferencePatch,
  now: string
): Record<string, string | boolean | null> {
  const { analyticsConsent, marketingConsent } = patch;
  return {
    clerk_user_id: userId,
    ...(analyticsConsent !== undefined
      ? {
          analytics_agreed: analyticsConsent,
          analytics_agreed_at: analyticsConsent ? now : null,
          analytics_withdrawn_at: analyticsConsent ? null : now,
        }
      : {}),
    ...(marketingConsent !== undefined
      ? {
          marketing_agreed: marketingConsent,
          marketing_agreed_at: marketingConsent ? now : null,
          marketing_withdrawn_at: marketingConsent ? null : now,
        }
      : {}),
  };
}

async function logPreferenceChanges(
  request: NextRequest,
  userId: string,
  patch: PreferencePatch
): Promise<void> {
  const ip = getClientIp(request);
  const auditTasks: Promise<boolean>[] = [];
  if (patch.analyticsConsent !== undefined) {
    auditTasks.push(
      patch.analyticsConsent
        ? logConsentGrant(userId, 'analytics', undefined, ip)
        : logConsentRevoke(userId, 'analytics', undefined, ip)
    );
  }
  if (patch.marketingConsent !== undefined) {
    auditTasks.push(
      patch.marketingConsent
        ? logConsentGrant(userId, 'marketing', undefined, ip)
        : logConsentRevoke(userId, 'marketing', undefined, ip)
    );
  }
  // 감사 로그 실패는 동의 저장 성공을 뒤집지 않는다.
  await Promise.allSettled(auditTasks);
}

/** GET /api/agreement/preferences — 선택 동의 상태 조회 */
export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return apiError(401, 'AUTH_ERROR', 'User not authenticated', '로그인이 필요합니다.');
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('user_agreements')
      .select('analytics_agreed, marketing_agreed')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Agreement Preferences API] GET failed:', error.code ?? error.message);
      return apiError(
        500,
        'DB_ERROR',
        'Failed to fetch consent preferences',
        '동의 상태를 불러올 수 없습니다.'
      );
    }

    return NextResponse.json({ success: true, data: mapPreferences(data) });
  } catch (error) {
    console.error('[Agreement Preferences API] GET exception:', error);
    return apiError(
      500,
      'UNKNOWN_ERROR',
      'Internal server error',
      '동의 상태를 불러올 수 없습니다.'
    );
  }
}

/** PATCH /api/agreement/preferences — 분석·마케팅 선택 동의 저장 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return apiError(401, 'AUTH_ERROR', 'User not authenticated', '로그인이 필요합니다.');
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = preferencePatchSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        400,
        'VALIDATION_ERROR',
        'Invalid consent preferences',
        '동의 설정을 확인해주세요.',
        { issues: parsed.error.flatten() }
      );
    }

    const now = new Date().toISOString();
    const updates = buildPreferenceUpdates(userId, parsed.data, now);

    // 사용자별 한 행에 upsert하여 구계정의 누락 행도 선택 동의만 정직하게 생성한다.
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('user_agreements')
      .upsert(updates, { onConflict: 'clerk_user_id' })
      .select('analytics_agreed, marketing_agreed')
      .single();

    if (error || !data) {
      console.error(
        '[Agreement Preferences API] PATCH failed:',
        error?.code ?? error?.message ?? 'missing row'
      );
      return apiError(
        500,
        'DB_ERROR',
        'Failed to persist consent preferences',
        '동의 설정을 저장할 수 없습니다.'
      );
    }

    await logPreferenceChanges(request, userId, parsed.data);

    return NextResponse.json({ success: true, data: mapPreferences(data) });
  } catch (error) {
    console.error('[Agreement Preferences API] PATCH exception:', error);
    return apiError(
      500,
      'UNKNOWN_ERROR',
      'Internal server error',
      '동의 설정을 저장할 수 없습니다.'
    );
  }
}
