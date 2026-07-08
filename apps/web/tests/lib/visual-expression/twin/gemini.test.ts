/**
 * 표현 레이어 — 트윈 이미지 생성/프롬프트 테스트 (ADR-115)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// @google/genai 모킹 — generateContent를 테스트별로 제어
const { mockGenerateContent } = vi.hoisted(() => ({ mockGenerateContent: vi.fn() }));
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';

const FACE = 'data:image/jpeg;base64,AAAABBBBCCCC';

async function load() {
  return import('@/lib/visual-expression/twin/internal/gemini');
}

describe('트윈 프롬프트 — 미화 금지 고정', () => {
  it('TWIN_PROMPT에 "이목구비를 실제와 다르게 만들지 마세요" 미화 금지 문구가 포함된다', async () => {
    const { TWIN_PROMPT } = await load();
    expect(TWIN_PROMPT).toContain('이목구비를 실제와 다르게 만들지 마세요');
    expect(TWIN_PROMPT).toContain('전신');
    expect(TWIN_PROMPT).toContain('스튜디오');
  });

  it('TWIN_COMPOSE_PROMPT도 미화 금지 문구를 포함한다', async () => {
    const { TWIN_COMPOSE_PROMPT } = await load();
    expect(TWIN_COMPOSE_PROMPT).toContain('이목구비를 실제와 다르게 만들지 마세요');
  });

  it('buildTwinPrompt는 체형 제약을 문장으로 주입한다', async () => {
    const { buildTwinPrompt, TWIN_PROMPT } = await load();
    const withConstraint = buildTwinPrompt({ bodyTypeLabel: '스트레이트' });
    expect(withConstraint).toContain('스트레이트');
    expect(withConstraint).toContain('체형');
    // 제약이 없으면 기본 프롬프트 그대로
    expect(buildTwinPrompt()).toBe(TWIN_PROMPT);
  });
});

describe('generateTwinImage', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    delete process.env.FORCE_MOCK_AI;
  });
  afterEach(() => {
    delete process.env.FORCE_MOCK_AI;
  });

  it('이미지가 반환되면 raw base64 + mime를 반환한다', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        { content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'ZZZZ' } }] } },
      ],
    });
    const { generateTwinImage } = await load();
    const result = await generateTwinImage({ faceImageBase64: FACE });
    expect(result).toEqual({ data: 'ZZZZ', mimeType: 'image/png' });
  });

  it('이미지가 반환되지 않으면 null을 반환한다(가짜 생성 금지)', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: '이미지 없음' }] } }],
    });
    const { generateTwinImage } = await load();
    expect(await generateTwinImage({ faceImageBase64: FACE })).toBeNull();
  });

  it('SDK 오류 시 null을 반환한다', async () => {
    mockGenerateContent.mockRejectedValue(new Error('boom'));
    const { generateTwinImage } = await load();
    expect(await generateTwinImage({ faceImageBase64: FACE })).toBeNull();
  });

  it('FORCE_MOCK_AI=true면 모델 호출 없이 고정 플레이스홀더를 반환한다', async () => {
    process.env.FORCE_MOCK_AI = 'true';
    const { generateTwinImage, PLACEHOLDER_PNG_BASE64 } = await load();
    const result = await generateTwinImage({ faceImageBase64: FACE });
    expect(result?.data).toBe(PLACEHOLDER_PNG_BASE64);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
