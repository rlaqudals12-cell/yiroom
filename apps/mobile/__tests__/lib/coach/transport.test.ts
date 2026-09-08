import { decodeCoachHistory, encodeCoachHistory } from '@yiroom/shared';
import { sendCoachMessage, getMockResponse } from '../../../lib/coach';
jest.mock('../../../lib/i18n', () => ({ getLocale: () => 'ja' }));
jest.mock('../../../lib/api/base-url', () => ({ getApiBaseUrl: () => 'https://example.test' }));
describe('coach transport metadata', () => {
  it.each(['model_unavailable', 'timeout', 'error'] as const)(
    'preserves %s from API and history',
    async (fallbackReason) => {
      const response = {
        message: '一般案内',
        usedFallback: true,
        confidence: 'low',
        fallbackReason,
        suggestedQuestions: [],
      };
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ success: true, data: response }) });
      expect(await sendCoachMessage('肌', [], 'token')).toEqual(response);
      expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).locale).toBe('ja');
      expect(
        decodeCoachHistory(
          encodeCoachHistory([], { usedFallback: true, confidence: 'low', fallbackReason })
        )
      ).toMatchObject({ usedFallback: true, confidence: 'low', fallbackReason });
    }
  );
  it('reads legacy array records', () => {
    expect(decodeCoachHistory(['보습'])).toEqual({ suggestedQuestions: ['보습'] });
  });
  it('labels offline fallback honestly', () => {
    expect(getMockResponse('피부')).toMatchObject({
      usedFallback: true,
      confidence: 'low',
      fallbackReason: 'error',
    });
  });
});
