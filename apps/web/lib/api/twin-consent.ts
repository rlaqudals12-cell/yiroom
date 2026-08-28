import type { NextResponse } from 'next/server';

import { requireBiometricConsent } from '@/lib/api/biometric-consent';
import { forbiddenError } from '@/lib/api/error-response';
import { checkImageConsent } from '@/lib/api/image-consent';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 얼굴에서 파생된 AI 아바타의 처리·저장 동의를 함께 확인한다.
 * 조회 실패나 만료는 동의로 추정하지 않고 403으로 닫는다.
 */
export async function requireTwinConsent(userId: string): Promise<NextResponse | null> {
  const biometricDenied = await requireBiometricConsent(userId);
  if (biometricDenied) return biometricDenied;

  try {
    const supabase = createServiceRoleClient();
    const { hasConsent } = await checkImageConsent(supabase, userId, 'twin');
    if (hasConsent) return null;
  } catch {
    // checkImageConsent도 fail-closed지만, 예외가 경계를 빠져나와도 저장을 허용하지 않는다.
  }

  return forbiddenError(
    'AI 아바타 저장 동의가 필요합니다. 만들기 화면에서 저장 범위를 확인하고 동의해주세요.'
  );
}

/**
 * 저장 직후 동의 상실을 확인했지만 즉시 롤백이 실패한 경우 cleanup cron에 재시도를 맡긴다.
 * 재동의와 경합해 활성 행이 된 경우는 덮지 않는다.
 */
export async function queueTwinCleanupAfterRollbackFailure(userId: string): Promise<boolean> {
  const pendingAt = new Date().toISOString();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('image_consents')
      .update({
        withdrawal_at: pendingAt,
        retention_until: pendingAt,
        cleanup_reconciled_at: null,
      })
      .eq('clerk_user_id', userId)
      .eq('analysis_type', 'twin')
      .eq('consent_given', false)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      console.error('[Twin Consent] Failed to queue cleanup after rollback failure');
      return false;
    }
    return true;
  } catch {
    console.error('[Twin Consent] Cleanup queue update threw');
    return false;
  }
}
