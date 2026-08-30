import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => ({ from: mockFrom }),
}));

describe('submitContentReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: { id: 'report_123' }, error: null });
  });

  it('기존 RLS 적용 feedback 운영 큐에 대상 식별자와 AI 출력 스냅샷을 저장한다', async () => {
    const { submitContentReport } = await import('@/lib/content-report/server');

    const result = await submitContentReport('user_123', {
      targetType: 'analysis_result',
      targetId: 'analysis_123',
      reason: 'misinformation',
      description: '분석 근거가 맞지 않아요.',
      contentExcerpt: '분석 결과 일부',
    });

    expect(result).toEqual({ id: 'report_123' });
    expect(mockFrom).toHaveBeenCalledWith('feedback');
    expect(mockSelect).toHaveBeenCalledWith('id');

    const inserted = mockInsert.mock.calls[0]?.[0] as {
      clerk_user_id: string;
      type: string;
      title: string;
      content: string;
      status: string;
    };
    expect(inserted).toMatchObject({
      clerk_user_id: 'user_123',
      type: 'other',
      title: '[AI 생성물 신고] 분석 결과',
      status: 'pending',
    });
    expect(JSON.parse(inserted.content)).toEqual({
      schemaVersion: 1,
      targetType: 'analysis_result',
      targetId: 'analysis_123',
      reason: 'misinformation',
      description: '분석 근거가 맞지 않아요.',
      contentExcerpt: '분석 결과 일부',
    });
  });

  it('선택 입력이 없으면 명시적인 null로 저장한다', async () => {
    const { submitContentReport } = await import('@/lib/content-report/server');

    await submitContentReport('user_123', {
      targetType: 'twin_result',
      targetId: 'twin_123',
      reason: 'other',
    });

    const inserted = mockInsert.mock.calls[0]?.[0] as { content: string };
    expect(JSON.parse(inserted.content)).toMatchObject({
      description: null,
      contentExcerpt: null,
    });
  });

  it('DB 오류를 호출부로 전달해 거짓 성공을 막는다', async () => {
    const databaseError = { code: '42501', message: 'permission denied' };
    mockSingle.mockResolvedValue({ data: null, error: databaseError });
    const { submitContentReport } = await import('@/lib/content-report/server');

    await expect(
      submitContentReport('user_123', {
        targetType: 'coach_message',
        targetId: 'message_123',
        reason: 'other',
      })
    ).rejects.toBe(databaseError);
  });
});
