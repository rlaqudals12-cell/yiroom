/**
 * Gemini 클라이언트 수리 검증 (적대적 리뷰 1~3)
 *
 * 1. parseJsonResponse: ```json 펜스/산문으로 감싼 응답도 파싱(조용한 Mock 강등 방지)
 * 2. 분석 타임아웃 상수 = 30초 (3초 상시 초과 → 전 시도 abort 문제 해소)
 * 3. 모델이 URL로 스레딩되고 기본값이 gemini-3.5-flash (구모델 하드코딩 제거)
 */

describe('Gemini 클라이언트 — parseJsonResponse (견고한 파싱)', () => {
  let parseJsonResponse: <T>(text: string) => T;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-key';
    delete process.env.EXPO_PUBLIC_GEMINI_MODEL;
    jest.isolateModules(() => {
      parseJsonResponse = require('@/lib/gemini/client').parseJsonResponse;
    });
  });

  it('```json 코드 펜스로 감싼 응답을 파싱한다', () => {
    const fenced = '```json\n{"season":"winter","confidence":0.9}\n```';
    expect(parseJsonResponse(fenced)).toEqual({ season: 'winter', confidence: 0.9 });
  });

  it('앞뒤 산문으로 감싼 응답에서도 JSON 객체를 추출해 파싱한다', () => {
    const prose = '분석 결과입니다: {"skinType":"combination"} 이상입니다.';
    expect(parseJsonResponse(prose)).toEqual({ skinType: 'combination' });
  });

  it('펜스 없는 순수 JSON도 파싱한다', () => {
    expect(parseJsonResponse('{"a":1}')).toEqual({ a: 1 });
  });

  it('JSON이 없으면 원문 일부를 담은 에러를 throw한다(진단 가능)', () => {
    expect(() => parseJsonResponse('전혀 JSON 아님')).toThrow(/JSON/);
    expect(() => parseJsonResponse('전혀 JSON 아님')).toThrow(/전혀 JSON 아님/);
  });
});

describe('Gemini 클라이언트 — callGeminiAPI (모델 URL·타임아웃)', () => {
  let callGeminiAPI: (prompt: string, imageBase64?: string, model?: string) => Promise<string>;
  const originalFetch = global.fetch;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-key';
    delete process.env.EXPO_PUBLIC_GEMINI_MODEL;
    jest.isolateModules(() => {
      callGeminiAPI = require('@/lib/gemini/client').callGeminiAPI;
    });
  });

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: '{"ok":1}' }] } }] }),
    }) as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('기본 모델(gemini-3.5-flash) 엔드포인트로 호출한다', async () => {
    await callGeminiAPI('프롬프트');
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/models/gemini-3.5-flash:generateContent');
    expect(url).not.toContain('gemini-1.5-flash');
  });

  it('model 인자를 URL로 스레딩한다(무시하지 않음)', async () => {
    await callGeminiAPI('프롬프트', undefined, 'my-custom-model');
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('/models/my-custom-model:generateContent');
  });

  it('분석 타임아웃을 30초로 설정한다(3초 아님)', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    await callGeminiAPI('프롬프트');
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 3000);
    setTimeoutSpy.mockRestore();
  });
});
