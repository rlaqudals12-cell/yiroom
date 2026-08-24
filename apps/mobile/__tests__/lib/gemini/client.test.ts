/**
 * 모바일 Gemini 호환 유틸리티 검증
 *
 * 1. parseJsonResponse: ```json 펜스/산문으로 감싼 응답도 파싱(조용한 Mock 강등 방지)
 * 2. 공개 키가 주입돼도 모바일에서 Google AI 직접 호출을 만들지 않음
 */

describe('Gemini 클라이언트 — parseJsonResponse (견고한 파싱)', () => {
  let parseJsonResponse: <T>(text: string) => T;

  beforeAll(() => {
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

describe('Gemini 클라이언트 — 모바일 직접 호출 차단', () => {
  let callGeminiAPI: (prompt: string, imageBase64?: string, model?: string) => Promise<string>;
  let isGeminiAvailable: () => boolean;
  let validateGeminiConfig: () => boolean;
  const originalFetch = global.fetch;

  beforeAll(() => {
    // 빌드 환경에 과거 공개 키가 남아 있어도 런타임 소비가 되살아나면 안 된다.
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'test-key';
    jest.isolateModules(() => {
      const client = require('@/lib/gemini/client');
      callGeminiAPI = client.callGeminiAPI;
      isGeminiAvailable = client.isGeminiAvailable;
      validateGeminiConfig = client.validateGeminiConfig;
    });
  });

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  });

  it('공개 키가 있어도 네트워크 요청 없이 fail-closed한다', async () => {
    await expect(callGeminiAPI('프롬프트', 'base64-image')).rejects.toThrow(
      /이룸 서버 API/
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('공개 키 유무와 무관하게 직접 Gemini를 사용 불가로 판정한다', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(isGeminiAvailable()).toBe(false);
    expect(validateGeminiConfig()).toBe(false);
    warnSpy.mockRestore();
  });
});
