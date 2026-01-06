import { describe, it, expect } from 'vitest';
import { parseVoiceInput, parseVoiceTranscript } from '@/lib/nutrition/voice-parser';

describe('parseVoiceInput', () => {
  it('parses Korean food names', () => {
    const result = parseVoiceInput('비빔밥 먹었어');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('비빔밥');
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
});
    expect(result.inferredMealType).toBe("breakfast");
  });

  it("returns usedMock flag as true", () => {
