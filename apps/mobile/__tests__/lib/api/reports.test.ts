import {
  ContentReportApiError,
  submitContentReport,
} from '../../../lib/api/reports';

function response(body: unknown, ok = true, status = 201): Response {
  return { ok, status, json: jest.fn().mockResolvedValue(body) } as unknown as Response;
}

describe('AI 콘텐츠 신고 API client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('Bearer 인증과 모바일 헤더로 신고를 웹 저장 정본에 접수한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({ success: true, data: { reportId: 'report-1' } })
    );

    await expect(
      submitContentReport(
        {
          targetType: 'coach_message',
          targetId: 'message-1',
          reason: 'misinformation',
          description: '내용이 사실과 달라요.',
          contentExcerpt: 'AI 답변',
        },
        'token-1',
        'https://api.example.test/'
      )
    ).resolves.toEqual({ reportId: 'report-1' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/reports',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-1',
          'x-yiroom-client': 'mobile',
        },
      })
    );
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      targetType: 'coach_message',
      targetId: 'message-1',
      reason: 'misinformation',
    });
  });

  it('서버 오류 봉투의 사용자 문구와 코드를 보존한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response(
        {
          success: false,
          error: {
            code: 'REPORT_STORAGE_FAILED',
            message: 'insert failed',
            userMessage: '신고를 접수하지 못했어요.',
          },
        },
        false,
        500
      )
    );

    const error = await submitContentReport(
      { targetType: 'twin_result', targetId: 'twin-1', reason: 'other' },
      'token-1',
      'https://api.example.test'
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ContentReportApiError);
    expect(error).toMatchObject({
      status: 500,
      code: 'REPORT_STORAGE_FAILED',
      message: '신고를 접수하지 못했어요.',
    });
  });

  it('성공 봉투에 reportId가 없으면 완료로 위장하지 않는다', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response({ success: true, data: {} }));

    await expect(
      submitContentReport(
        { targetType: 'analysis_result', targetId: 'row-1', reason: 'other' },
        'token-1',
        'https://api.example.test'
      )
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
});
