/**
 * 표현 레이어 — 자연 보정 (beautify) 테스트 (ADR-113)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// @google/genai 모킹 — generateContent를 테스트별로 제어
const { mockGenerateContent } = vi.hoisted(() => ({ mockGenerateContent: vi.fn() }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

// API_KEY는 모듈 import 시점에 env에서 캡처되므로 import 전에 설정
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';

const ORIGINAL = 'data:image/jpeg;base64,AAAABBBBCCCC';

async function loadModule() {
  return import('@/lib/visual-expression/internal/beautify');
}

describe('beautify — 프롬프트 고정', () => {
  it('보정 프롬프트에 이목구비·얼굴형·체형 변형 금지 문구가 포함된다', async () => {
    const { BEAUTIFY_PROMPT } = await loadModule();
    expect(BEAUTIFY_PROMPT).toContain('이목구비');
    expect(BEAUTIFY_PROMPT).toContain('얼굴형');
    expect(BEAUTIFY_PROMPT).toContain('체형');
    expect(BEAUTIFY_PROMPT).toContain('변형하지');
  });
});

describe('beautifyForShare', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });

  it('이미지가 반환되면 aiEdited:true 보정본을 반환한다', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        { content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'ZZZZ' } }] } },
      ],
    });
    const { beautifyForShare, BEAUTIFY_MODEL } = await loadModule();

    const result = await beautifyForShare({ imageBase64: ORIGINAL });

    expect('aiEdited' in result && result.aiEdited).toBe(true);
    expect(result.imageBase64).toBe('data:image/png;base64,ZZZZ');
    expect('model' in result && result.model).toBe(BEAUTIFY_MODEL);
  });

  it('이미지가 반환되지 않으면 원본을 그대로 반환하고 aiEdited가 없다(실패 은폐 금지)', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: '이미지 없음' }] } }],
    });
    const { beautifyForShare } = await loadModule();

    const result = await beautifyForShare({ imageBase64: ORIGINAL });

    expect(result.imageBase64).toBe(ORIGINAL);
    expect('aiEdited' in result).toBe(false);
  });

  it('SDK가 오류를 던지면 원본을 그대로 반환한다', async () => {
    mockGenerateContent.mockRejectedValue(new Error('boom'));
    const { beautifyForShare } = await loadModule();

    const result = await beautifyForShare({ imageBase64: ORIGINAL });

    expect(result.imageBase64).toBe(ORIGINAL);
    expect('aiEdited' in result).toBe(false);
  });

  it('data URL 형식이 아니면 원본을 그대로 반환한다', async () => {
    const { beautifyForShare } = await loadModule();
    const result = await beautifyForShare({ imageBase64: 'not-a-data-url' });
    expect(result.imageBase64).toBe('not-a-data-url');
    expect('aiEdited' in result).toBe(false);
  });
});
