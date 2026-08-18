import { getLatestAnalysisDetails } from '@/lib/api/analysis-history';

const fetchMock = jest.fn();

describe('analysis history API client', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('인증 웹 API의 최신 details만 반환한다', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        analyses: [{ details: { skinType: 'dry' } }],
      }),
    });

    await expect(
      getLatestAnalysisDetails('token', 'skin', 'https://api.example.com')
    ).resolves.toEqual({ skinType: 'dry' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/api/analysis/history?type=skin&limit=1&period=all',
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer token',
          'x-yiroom-client': 'mobile',
        },
      }
    );
  });
});
