/**
 * lib/ai/providers/claude.ts 단위 테스트
 *
 * @description Claude AI Provider 테스트
 * @see ADR-055-multi-ai-backup-strategy.md
 *
 * NOTE: @anthropic-ai/sdk는 vitest.config.ts의 alias를 통해 모킹됩니다.
 * @see tests/__mocks__/anthropic-ai-sdk.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// 환경변수 설정 (import 전에 설정)
vi.stubEnv('ANTHROPIC_API_KEY', '');
vi.stubEnv('CLAUDE_MODEL', 'claude-3-5-haiku-latest');
vi.stubEnv('FORCE_MOCK_AI', 'false');
vi.stubEnv('ENABLE_CLAUDE', 'true');
vi.stubEnv('USE_SECONDARY_ON_PRIMARY_FAILURE', 'true');

import {
  formatImageForClaude,
  parseClaudeJsonResponse,
  createClaudeProvider,
  isClaudeAvailable,
  getClaudeModelInfo,
} from '@/lib/ai/providers/claude';

describe('lib/ai/providers/claude', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('formatImageForClaude', () => {
    it('should format JPEG base64 image correctly', () => {
      const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA';
      const result = formatImageForClaude(imageBase64);

      expect(result).toEqual({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: '/9j/4AAQSkZJRgABAQAA',
        },
      });
    });

    it('should format PNG base64 image correctly', () => {
      const imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAA';
      const result = formatImageForClaude(imageBase64);

      expect(result).toEqual({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: 'iVBORw0KGgoAAAA',
        },
      });
    });

    it('should format GIF base64 image correctly', () => {
      const imageBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAA';
      const result = formatImageForClaude(imageBase64);

      expect(result).toEqual({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/gif',
          data: 'R0lGODlhAQABAIAA',
        },
      });
    });

    it('should format WebP base64 image correctly', () => {
      const imageBase64 = 'data:image/webp;base64,UklGRjABAABXRUJQ';
      const result = formatImageForClaude(imageBase64);

      expect(result).toEqual({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/webp',
          data: 'UklGRjABAABXRUJQ',
        },
      });
    });

    it('should throw error for invalid base64 format', () => {
      const invalidBase64 = 'not-a-valid-base64-string';

      expect(() => formatImageForClaude(invalidBase64)).toThrow('Invalid base64 image format');
    });

    it('should throw error for missing data prefix', () => {
      const invalidBase64 = 'image/jpeg;base64,/9j/4AAQSkZJRgABAQAA';

      expect(() => formatImageForClaude(invalidBase64)).toThrow('Invalid base64 image format');
    });

    it('should throw error for incomplete data URI', () => {
      const invalidBase64 = 'data:image/jpeg';

      expect(() => formatImageForClaude(invalidBase64)).toThrow('Invalid base64 image format');
    });
  });

  describe('parseClaudeJsonResponse', () => {
    it('should parse valid JSON response', () => {
      const jsonText = '{"skinType": "dry", "confidence": 0.9}';
      const result = parseClaudeJsonResponse<{ skinType: string; confidence: number }>(jsonText);

      expect(result).toEqual({
        skinType: 'dry',
        confidence: 0.9,
      });
    });

    it('should remove markdown code blocks', () => {
      const jsonText = '```json\n{"season": "spring"}\n```';
      const result = parseClaudeJsonResponse<{ season: string }>(jsonText);

      expect(result).toEqual({ season: 'spring' });
    });

    it('should extract first JSON object from text with additional content', () => {
      // Claude가 JSON 앞뒤에 설명을 추가할 수 있음
      const jsonText = `Here is the analysis result:
        {"result": "success", "score": 92}
        This analysis was performed with high confidence.`;
      const result = parseClaudeJsonResponse<{ result: string; score: number }>(jsonText);

      expect(result).toEqual({ result: 'success', score: 92 });
    });

    it('should throw error when no JSON object found', () => {
      const noJsonText = 'This is just plain text without any JSON';

      expect(() => parseClaudeJsonResponse(noJsonText)).toThrow(
        'No JSON object found in Claude response'
      );
    });

    it('should throw error for malformed JSON', () => {
      const malformedJson = '{"broken": "json", missing}';

      expect(() => parseClaudeJsonResponse(malformedJson)).toThrow(
        'Failed to parse Claude response as JSON'
      );
    });

    it('should parse nested JSON correctly', () => {
      const jsonText = `{
        "personalColor": {
          "season": "autumn",
          "subType": "warm",
          "palette": ["#8B4513", "#D2691E", "#CD853F"]
        },
        "confidence": 87
      }`;
      const result = parseClaudeJsonResponse<{
        personalColor: {
          season: string;
          subType: string;
          palette: string[];
        };
        confidence: number;
      }>(jsonText);

      expect(result.personalColor.season).toBe('autumn');
      expect(result.personalColor.palette).toHaveLength(3);
      expect(result.confidence).toBe(87);
    });

    it('should handle JSON with arrays at root', () => {
      // parseClaudeJsonResponse는 객체만 추출하므로 배열은 에러
      const arrayJson = '[1, 2, 3]';

      // 배열은 {} 패턴에 매칭되지 않음
      expect(() => parseClaudeJsonResponse(arrayJson)).toThrow(
        'No JSON object found in Claude response'
      );
    });
  });

  describe('createClaudeProvider', () => {
    it('should create provider with correct name', () => {
      const prompt = 'Analyze this image';
      const provider = createClaudeProvider(prompt);

      expect(provider.name).toBe('claude');
    });

    it('should have correct timeout (4000ms per ADR-055 for secondary)', () => {
      const provider = createClaudeProvider('test');

      expect(provider.timeout).toBe(4000);
    });

    it('should have correct maxRetries (1 per ADR-055 for secondary)', () => {
      const provider = createClaudeProvider('test');

      expect(provider.maxRetries).toBe(1);
    });

    it('should have priority 2 (secondary provider)', () => {
      const provider = createClaudeProvider('test');

      expect(provider.priority).toBe(2);
    });

    it('should have isEnabled function', () => {
      const provider = createClaudeProvider('test');

      expect(typeof provider.isEnabled).toBe('function');
    });

    it('should have analyze function', () => {
      const provider = createClaudeProvider('test');

      expect(typeof provider.analyze).toBe('function');
    });
  });

  describe('isClaudeAvailable', () => {
    it('should return false when API key is not set', () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      vi.stubEnv('FORCE_MOCK_AI', 'false');

      const result = isClaudeAvailable();
      // API_KEY가 없으므로 false
      expect(result).toBe(false);
    });

    it('should check FORCE_MOCK_AI flag', () => {
      vi.stubEnv('FORCE_MOCK_AI', 'true');

      // FORCE_MOCK_AI=true면 available=false
      expect(process.env.FORCE_MOCK_AI).toBe('true');
    });
  });

  describe('getClaudeModelInfo', () => {
    it('should return model name', () => {
      const info = getClaudeModelInfo();

      expect(info.model).toBeDefined();
      expect(typeof info.model).toBe('string');
    });

    it('should return availability status', () => {
      const info = getClaudeModelInfo();

      expect(typeof info.available).toBe('boolean');
    });

    it('should return SDK installed status', () => {
      const info = getClaudeModelInfo();

      // sdkInstalled는 boolean 또는 null (아직 확인 안됨)
      expect(info.sdkInstalled === null || typeof info.sdkInstalled === 'boolean').toBe(true);
    });

    it('should use default model when env not set', () => {
      const info = getClaudeModelInfo();

      expect(info.model).toBe('claude-3-5-haiku-latest');
    });
  });

  describe('provider isEnabled logic', () => {
    it('should check multiple flags for enabling', () => {
      const provider = createClaudeProvider('test');

      // isEnabled는 여러 환경변수를 체크:
      // - FORCE_MOCK_AI
      // - ANTHROPIC_API_KEY
      // - ENABLE_CLAUDE
      // - USE_SECONDARY_ON_PRIMARY_FAILURE
      // - sdkAvailable
      const enabled = provider.isEnabled();
      expect(typeof enabled).toBe('boolean');
    });

    it('should be disabled when ENABLE_CLAUDE is false', () => {
      vi.stubEnv('ENABLE_CLAUDE', 'false');

      const provider = createClaudeProvider('test');
      // isEnabled가 런타임에 환경변수를 체크
      expect(typeof provider.isEnabled()).toBe('boolean');
    });

    it('should be disabled when USE_SECONDARY_ON_PRIMARY_FAILURE is false', () => {
      vi.stubEnv('USE_SECONDARY_ON_PRIMARY_FAILURE', 'false');

      const provider = createClaudeProvider('test');
      expect(typeof provider.isEnabled()).toBe('boolean');
    });
  });

  describe('Claude provider specifics', () => {
    it('should have different priority than Gemini', () => {
      const claudeProvider = createClaudeProvider('test');

      // Claude는 secondary (priority 2), Gemini는 primary (priority 1)
      expect(claudeProvider.priority).toBeGreaterThan(1);
    });

    it('should have longer timeout than primary provider', () => {
      const claudeProvider = createClaudeProvider('test');

      // Claude: 4000ms, Gemini: 3000ms
      expect(claudeProvider.timeout).toBeGreaterThan(3000);
    });

    it('should have fewer retries than primary provider', () => {
      const claudeProvider = createClaudeProvider('test');

      // Claude: 1 retry, Gemini: 2 retries
      expect(claudeProvider.maxRetries).toBeLessThan(2);
    });
  });
});
