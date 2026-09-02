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
  PINNED_VERDICT_MODEL: 'gemini-verdict-test',
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

  it('PC-1 자가보고를 원래 문항 의미로 보존하되 시각 관찰 우선 제한을 함께 보낸다', async () => {
    generateContentMock.mockResolvedValue({ text: '{}' });

    await analyzePersonalColor({
      frontImageBase64: imageBase64,
      selfReport: {
        skinAppearance: 'warm',
        veinAppearance: 'cool',
        jewelryPreference: 'neutral',
        sunReaction: 'warm',
        whitePreference: 'cool',
      },
    });

    const request = generateContentMock.mock.calls[0]?.[0] as
      | {
          contents?: Array<{ text?: string }>;
          model?: string;
          config?: { temperature?: number };
        }
      | undefined;
    const prompt = request?.contents?.[0]?.text ?? '';
    expect(request?.model).toBe('gemini-verdict-test');
    expect(request?.config?.temperature).toBe(0);
    expect(prompt).toContain('피부가 보이는 경향: 노르스름하거나 복숭아빛으로 보여요');
    expect(prompt).toContain('손목 혈관 자가 관찰: 파란색이나 보라색에 가까워요');
    expect(prompt).toContain('액세서리 선호: 둘 다 잘 어울려요');
    expect(prompt).toContain('햇빛 반응 자가보고: 금방 태닝되고 잘 타요');
    expect(prompt).toContain('흰색 계열 선호: 순백색이 더 잘 어울려요');
    expect(prompt).toContain('이미지에서 관찰한 피부·눈·입술·대비를 우선한다');
    expect(prompt).toContain('자가보고만으로 analysisEvidence를 채우지 않는다');
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
