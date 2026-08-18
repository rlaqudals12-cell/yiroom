import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { generateContentMock } = vi.hoisted(() => ({
  generateContentMock: vi.fn(),
}));

vi.mock('@/lib/gemini/client', () => ({
  generateContent: generateContentMock,
  isGeminiAvailable: () => true,
  formatImageForGemini: (imageBase64: string) => ({
    inlineData: { data: imageBase64, mimeType: 'image/jpeg' },
  }),
  FAST_MODEL: 'gemini-fast-test',
  outputLanguageDirective: () => '',
}));

vi.mock('@/lib/utils/image-compression', () => ({
  compressBase64Image: (imageBase64: string) => Promise.resolve(imageBase64),
}));

vi.mock('@/lib/utils/logger', () => ({
  geminiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { analyzeBody, analyzePersonalColor } from '@/lib/gemini';

describe('Gemini 단독 분석 실행 예산', () => {
  const imageBase64 = 'data:image/jpeg;base64,test-image';

  beforeEach(() => {
    vi.useFakeTimers();
    generateContentMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('PC-1 실패 시 최초 호출과 재시도 2회를 합쳐 3번만 호출한다', async () => {
    generateContentMock.mockRejectedValue(new Error('temporary Gemini failure'));

    const captured = analyzePersonalColor(imageBase64).then(
      () => null,
      (error: unknown) => error
    );

    await vi.runAllTimersAsync();

    expect(await captured).toBeInstanceOf(Error);
    expect(generateContentMock).toHaveBeenCalledTimes(3);
  });

  it('C-1 단일 이미지의 4초 정상 응답을 타임아웃시키지 않는다', async () => {
    generateContentMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                text: JSON.stringify({
                  bodyType: 'S',
                  bodyTypeLabel: '스트레이트',
                }),
              }),
            4000
          );
        })
    );

    const captured = analyzeBody(imageBase64).then(
      (value) => ({ value, error: null }),
      (error: unknown) => ({ value: null, error })
    );

    await vi.advanceTimersByTimeAsync(4000);
    const outcome = await captured;

    expect(outcome.error).toBeNull();
    expect(outcome.value).toMatchObject({ bodyType: 'S', bodyTypeLabel: '스트레이트' });
    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });
});
