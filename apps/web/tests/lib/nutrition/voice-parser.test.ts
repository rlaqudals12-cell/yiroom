import { describe, it, expect } from 'vitest';
import {
  parseVoiceInput,
  parseVoiceTranscript,
  generateMockVoiceParseResult,
} from '@/lib/nutrition/voice-parser';

describe('parseVoiceInput', () => {
  it('parses Korean food names', () => {
    const result = parseVoiceInput('비빔밥 먹었어');
    expect(result.length).toBeGreaterThanOrEqual(1);
    // 비빔밥이 파싱 결과에 포함되어 있는지 확인
    const bibimbap = result.find((item) => item.name === '비빔밥');
    expect(bibimbap).toBeDefined();
  });

  it('parses multiple foods', () => {
    const result = parseVoiceInput('김치찌개랑 밥 먹었어');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('parseVoiceTranscript', () => {
  it('returns complete result object', () => {
    const result = parseVoiceTranscript('점심에 비빔밥 먹었어');
    expect(result).toHaveProperty('parsedItems');
    expect(result).toHaveProperty('inferredMealType');
  });

  it('infers meal type from context', () => {
    const result = parseVoiceTranscript('아침에 토스트 먹었어');
    expect(result.inferredMealType).toBe('breakfast');
  });

  it('returns usedMock flag as true', () => {
    const result = parseVoiceTranscript('라면');
    expect(result.usedMock).toBe(true);
  });
});

describe('generateMockVoiceParseResult', () => {
  it('generates mock result', () => {
    const result = generateMockVoiceParseResult('치킨 먹었어');
    expect(result.originalText).toBe('치킨 먹었어');
    expect(result.parsedItems.length).toBeGreaterThan(0);
  });
});
