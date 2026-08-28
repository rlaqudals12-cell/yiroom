import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/api/biometric-consent', () => ({
  requireBiometricConsent: vi.fn(),
}));
vi.mock('@/lib/api/image-consent', () => ({
  checkImageConsent: vi.fn(),
}));

const serviceClient = { from: vi.fn() };
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => serviceClient,
}));

import { requireBiometricConsent } from '@/lib/api/biometric-consent';
import { checkImageConsent } from '@/lib/api/image-consent';
import { queueTwinCleanupAfterRollbackFailure, requireTwinConsent } from '@/lib/api/twin-consent';

describe('requireTwinConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireBiometricConsent).mockResolvedValue(null);
    vi.mocked(checkImageConsent).mockResolvedValue({ hasConsent: true, consentId: 'consent-1' });
  });

  it('글로벌 생체동의가 없으면 저장 동의를 조회하지 않고 403을 반환한다', async () => {
    const denied = NextResponse.json({ error: 'biometric required' }, { status: 403 });
    vi.mocked(requireBiometricConsent).mockResolvedValueOnce(denied);

    const response = await requireTwinConsent('user-1');

    expect(response).toBe(denied);
    expect(checkImageConsent).not.toHaveBeenCalled();
  });

  it('생체동의와 활성 twin 저장동의가 모두 있을 때만 통과한다', async () => {
    await expect(requireTwinConsent('user-1')).resolves.toBeNull();
    expect(checkImageConsent).toHaveBeenCalledWith(serviceClient, 'user-1', 'twin');
  });

  it('twin 저장동의가 없으면 403으로 막는다', async () => {
    vi.mocked(checkImageConsent).mockResolvedValueOnce({ hasConsent: false, consentId: null });

    const response = await requireTwinConsent('user-1');

    expect(response?.status).toBe(403);
  });

  it('저장동의 조회가 예외를 던져도 fail-closed로 403을 반환한다', async () => {
    vi.mocked(checkImageConsent).mockRejectedValueOnce(new Error('db unavailable'));

    const response = await requireTwinConsent('user-1');

    expect(response?.status).toBe(403);
  });
});

describe('queueTwinCleanupAfterRollbackFailure', () => {
  it('철회된 twin 동의 행만 cleanup 대기로 되돌린다', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'consent-1' }, error: null });
    const chain = {
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle,
    };
    chain.eq.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    const update = vi.fn().mockReturnValue(chain);
    serviceClient.from.mockReturnValueOnce({ update });

    await expect(queueTwinCleanupAfterRollbackFailure('user-1')).resolves.toBe(true);
    expect(serviceClient.from).toHaveBeenCalledWith('image_consents');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        cleanup_reconciled_at: null,
        retention_until: expect.any(String),
        withdrawal_at: expect.any(String),
      })
    );
    expect(chain.eq).toHaveBeenCalledWith('clerk_user_id', 'user-1');
    expect(chain.eq).toHaveBeenCalledWith('analysis_type', 'twin');
    expect(chain.eq).toHaveBeenCalledWith('consent_given', false);
  });

  it('재동의 경합으로 false 행이 없으면 cleanup 상태를 덮지 않는다', async () => {
    const chain = {
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    chain.eq.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    serviceClient.from.mockReturnValueOnce({ update: vi.fn().mockReturnValue(chain) });

    await expect(queueTwinCleanupAfterRollbackFailure('user-1')).resolves.toBe(false);
  });
});
