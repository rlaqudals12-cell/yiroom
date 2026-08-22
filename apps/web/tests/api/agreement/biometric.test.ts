import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, mockRevoke, mockAudit } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRevoke: vi.fn(),
  mockAudit: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({ auth: mockAuth }));
vi.mock('@/lib/supabase/service-role', () => ({ createServiceRoleClient: vi.fn(() => ({})) }));
vi.mock('@/lib/api/biometric-withdrawal', () => ({
  revokeBiometricConsentAndPurge: mockRevoke,
}));
vi.mock('@/lib/audit/logger', () => ({ logConsentRevoke: mockAudit }));

const { DELETE } = await import('@/app/api/agreement/biometric/route');

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/agreement/biometric', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('DELETE /api/agreement/biometric', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockAudit.mockResolvedValue(true);
    mockRevoke.mockResolvedValue({
      consentRevoked: true,
      imagesDeleted: 3,
      databaseTargetsCleared: 11,
      fullyPurged: true,
      failedTargets: [],
    });
  });

  it('미인증 요청은 파기를 시작하지 않고 표준 401 봉투를 반환한다', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await DELETE(makeRequest({ confirm: true }));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'User not authenticated',
        userMessage: '로그인이 필요합니다.',
      },
    });
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it('명시적 철회 확인이 없으면 400을 반환한다', async () => {
    const response = await DELETE(makeRequest({ confirm: false }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it('모든 파기가 끝나면 삭제 개수와 완료 상태를 반환한다', async () => {
    const response = await DELETE(makeRequest({ confirm: true }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        consentRevoked: true,
        imagesDeleted: 3,
        databaseTargetsCleared: 11,
        fullyPurged: true,
      },
    });
    expect(mockAudit).toHaveBeenCalledWith(
      'user-1',
      'biometric',
      expect.objectContaining({ fullyPurged: true, imagesDeleted: 3 })
    );
  });

  it('일부 이미지 파기 실패는 성공으로 위장하지 않고 재시도 가능한 500 봉투로 반환한다', async () => {
    mockRevoke.mockResolvedValue({
      consentRevoked: true,
      imagesDeleted: 2,
      databaseTargetsCleared: 10,
      fullyPurged: false,
      failedTargets: ['storage:integrated-sessions'],
    });

    const response = await DELETE(makeRequest({ confirm: true }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('PARTIAL_PURGE_ERROR');
    expect(json.error.details).toEqual({
      consentRevoked: true,
      imagesDeleted: 2,
      databaseTargetsCleared: 10,
      fullyPurged: false,
    });
    expect(JSON.stringify(json)).not.toContain('integrated-sessions');
  });

  it('감사 로그 저장 실패가 실제 파기 완료 상태를 뒤집지 않는다', async () => {
    mockAudit.mockResolvedValue(false);

    const response = await DELETE(makeRequest({ confirm: true }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.fullyPurged).toBe(true);
  });
});
