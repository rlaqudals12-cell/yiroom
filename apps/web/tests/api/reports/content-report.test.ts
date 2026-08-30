import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuthProtect = vi.fn();
const mockSubmitContentReport = vi.fn();

vi.mock('@clerk/nextjs/server', () => ({
  auth: {
    protect: () => mockAuthProtect(),
  },
}));

vi.mock('@/lib/content-report/server', () => ({
  submitContentReport: (...args: unknown[]) => mockSubmitContentReport(...args),
}));

async function callPOST(body: unknown, rawBody?: string): Promise<Response> {
  const { POST } = await import('@/app/api/reports/route');
  return POST(
    new NextRequest('http://localhost/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawBody ?? JSON.stringify(body),
    })
  );
}

describe('POST /api/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthProtect.mockResolvedValue({ userId: 'user_123' });
    mockSubmitContentReport.mockResolvedValue({ id: 'report_123' });
  });

  it('인증된 사용자의 AI 생성물 신고를 구조화된 성공 봉투로 접수한다', async () => {
    const response = await callPOST({
      targetType: 'coach_message',
      targetId: ' message_123 ',
      reason: 'inappropriate_content',
      description: ' 불쾌한 표현이 있어요. ',
      contentExcerpt: ' 신고할 답변 ',
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { reportId: 'report_123' },
    });
    expect(mockSubmitContentReport).toHaveBeenCalledWith('user_123', {
      targetType: 'coach_message',
      targetId: 'message_123',
      reason: 'inappropriate_content',
      description: '불쾌한 표현이 있어요.',
      contentExcerpt: '신고할 답변',
    });
  });

  it('로그인하지 않은 요청은 Clerk protect 가드에서 저장 전에 차단한다', async () => {
    const authError = new Error('Clerk not found');
    mockAuthProtect.mockRejectedValue(authError);

    const response = await callPOST({
      targetType: 'analysis_result',
      targetId: 'analysis_123',
      reason: 'misinformation',
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authenticated user is required',
        userMessage: '로그인 후 신고해 주세요.',
      },
    });
    expect(mockAuthProtect).toHaveBeenCalledTimes(1);
    expect(mockSubmitContentReport).not.toHaveBeenCalled();
  });

  it.each([
    [{ targetType: 'posture', targetId: '1', reason: 'other' }],
    [{ targetType: 'twin_result', targetId: '', reason: 'other' }],
    [{ targetType: 'twin_result', targetId: '1', reason: 'unknown' }],
    [
      {
        targetType: 'analysis_result',
        targetId: '1',
        reason: 'other',
        contentExcerpt: '가'.repeat(2001),
      },
    ],
    [{ targetType: 'analysis_result', targetId: '1', reason: 'other', unexpected: true }],
  ])('허용 목록 밖 신고 입력을 400으로 거절한다: %o', async (body) => {
    const response = await callPOST(body);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(mockSubmitContentReport).not.toHaveBeenCalled();
  });

  it('깨진 JSON은 정중한 오류 봉투로 거절한다', async () => {
    const response = await callPOST(null, '{');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: {
        code: 'INVALID_JSON',
        userMessage: '신고 내용을 확인해 주세요.',
      },
    });
  });

  it('저장 실패를 성공으로 위장하지 않는다', async () => {
    mockSubmitContentReport.mockRejectedValue(new Error('database unavailable'));

    const response = await callPOST({
      targetType: 'twin_result',
      targetId: 'twin_123',
      reason: 'other',
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: 'REPORT_SUBMISSION_FAILED',
        message: 'Failed to persist content report',
        userMessage: '신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      },
    });
  });
});
