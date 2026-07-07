import { describe, it, expect, vi, beforeEach } from 'vitest';

// @google/genai mock
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream,
    },
  })),
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
    BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE',
  },
}));

describe('Gemini Client Adapter', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key';
    delete process.env.FORCE_MOCK_AI;
  });

  describe('isGeminiAvailable', () => {
    it('should return true when API key exists and FORCE_MOCK_AI is not set', async () => {
      const { isGeminiAvailable } = await import('@/lib/gemini/client');
      expect(isGeminiAvailable()).toBe(true);
    });

    it('should return false when FORCE_MOCK_AI is true', async () => {
      process.env.FORCE_MOCK_AI = 'true';
      const { isGeminiAvailable } = await import('@/lib/gemini/client');
      expect(isGeminiAvailable()).toBe(false);
    });

    it('should return false when API key is missing', async () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      const { isGeminiAvailable } = await import('@/lib/gemini/client');
      expect(isGeminiAvailable()).toBe(false);
    });
  });

  describe('generateContent', () => {
    it('should return text from response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Hello from Gemini' });

      const { generateContent } = await import('@/lib/gemini/client');
      const result = await generateContent({ contents: 'Say hello' });

      expect(result.text).toBe('Hello from Gemini');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.5-flash',
          contents: 'Say hello',
        })
      );
    });

    it('should use custom model when specified', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'response' });

      const { generateContent } = await import('@/lib/gemini/client');
      await generateContent({
        model: 'gemini-2.0-flash',
        contents: 'test',
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-2.0-flash' })
      );
    });

    it('should pass config (temperature, maxOutputTokens)', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'response' });

      const { generateContent } = await import('@/lib/gemini/client');
      await generateContent({
        contents: 'test',
        config: { temperature: 0.1, maxOutputTokens: 4096 },
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            temperature: 0.1,
            maxOutputTokens: 4096,
          }),
        })
      );
    });

    it('should handle null text gracefully', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });

      const { generateContent } = await import('@/lib/gemini/client');
      const result = await generateContent({ contents: 'test' });

      expect(result.text).toBe('');
    });
  });

  describe('generateContentStream', () => {
    it('should yield text chunks', async () => {
      // 비동기 이터레이터 mock
      const chunks = [{ text: 'Hello ' }, { text: 'World' }, { text: '' }];
      mockGenerateContentStream.mockResolvedValue(
        (async function* () {
          for (const chunk of chunks) yield chunk;
        })()
      );

      const { generateContentStream } = await import('@/lib/gemini/client');
      const result: string[] = [];

      for await (const text of generateContentStream({ contents: 'stream test' })) {
        result.push(text);
      }

      // 빈 텍스트 청크는 건너뜀
      expect(result).toEqual(['Hello ', 'World']);
    });
  });

  describe('formatImageForGemini', () => {
    it('should extract base64 from data URL', async () => {
      const { formatImageForGemini } = await import('@/lib/gemini/client');
      const result = formatImageForGemini('data:image/jpeg;base64,/9j/4AAQ');

      expect(result).toEqual({
        inlineData: {
          mimeType: 'image/jpeg',
          data: '/9j/4AAQ',
        },
      });
    });

    it('should throw for raw base64 without data: prefix', async () => {
      const { formatImageForGemini } = await import('@/lib/gemini/client');

      expect(() => formatImageForGemini('/9j/4AAQ')).toThrow('Invalid base64 image format');
    });

    it('should detect PNG mime type', async () => {
      const { formatImageForGemini } = await import('@/lib/gemini/client');
      const result = formatImageForGemini('data:image/png;base64,iVBOR');

      expect(result.inlineData?.mimeType).toBe('image/png');
    });
  });

  describe('parseJsonResponse', () => {
    it('should parse clean JSON', async () => {
      const { parseJsonResponse } = await import('@/lib/gemini/client');
      const result = parseJsonResponse<{ name: string }>('{"name": "test"}');
      expect(result).toEqual({ name: 'test' });
    });

    it('should strip markdown json code block', async () => {
      const { parseJsonResponse } = await import('@/lib/gemini/client');
      const result = parseJsonResponse<{ a: number }>('```json\n{"a": 1}\n```');
      expect(result).toEqual({ a: 1 });
    });

    it('should strip plain markdown code block', async () => {
      const { parseJsonResponse } = await import('@/lib/gemini/client');
      const result = parseJsonResponse<{ b: boolean }>('```\n{"b": true}\n```');
      expect(result).toEqual({ b: true });
    });
  });
});
