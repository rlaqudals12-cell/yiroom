import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockRequireAdminOrThrow = vi.fn();
const mockGetAllFeedbacks = vi.fn();
const mockUpdateFeedbackStatus = vi.fn();

vi.mock('@/lib/admin/auth', () => ({
  requireAdminOrThrow: () => mockRequireAdminOrThrow(),
}));

vi.mock('@/lib/api/feedback', () => ({
  getAllFeedbacks: (...args: unknown[]) => mockGetAllFeedbacks(...args),
  updateFeedbackStatus: (...args: unknown[]) => mockUpdateFeedbackStatus(...args),
}));

describe('/api/admin/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminOrThrow.mockResolvedValue(undefined);
    mockUpdateFeedbackStatus.mockResolvedValue(true);
  });

  it('관리자에게 다른 사용자의 type=other AI 생성물 신고를 노출한다', async () => {
    const aiReport = {
      id: 'report_123',
      clerkUserId: 'reporter_123',
      type: 'other',
      title: '[AI 생성물 신고] 코치 메시지',
      content: JSON.stringify({
        targetType: 'coach_message',
        targetId: 'message_123',
        reason: 'inappropriate_content',
      }),
      status: 'pending',
    };
    mockGetAllFeedbacks.mockResolvedValue([aiReport]);
    const { GET } = await import('@/app/api/admin/feedback/route');

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ feedbacks: [aiReport] });
    expect(mockRequireAdminOrThrow).toHaveBeenCalledTimes(1);
    expect(mockGetAllFeedbacks).toHaveBeenCalledTimes(1);
  });

  it('관리자 권한이 없으면 전체 운영 큐를 노출하지 않는다', async () => {
    mockRequireAdminOrThrow.mockRejectedValue(new Error('Unauthorized: Admin access required'));
    const { GET } = await import('@/app/api/admin/feedback/route');

    const response = await GET();

    expect(response.status).toBe(403);
    expect(mockGetAllFeedbacks).not.toHaveBeenCalled();
  });

  it('상태 변경도 관리자 권한 뒤에서만 처리한다', async () => {
    const { PATCH } = await import('@/app/api/admin/feedback/route');
    const request = new NextRequest('http://localhost/api/admin/feedback', {
      method: 'PATCH',
      body: JSON.stringify({ feedbackId: 'report_123', status: 'resolved' }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mockRequireAdminOrThrow).toHaveBeenCalledTimes(1);
    expect(mockUpdateFeedbackStatus).toHaveBeenCalledWith('report_123', 'resolved', undefined);
  });
});
