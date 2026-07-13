/**
 * Persona Composer 테스트 (ADR-104 체크리스트 #1)
 *
 * @see lib/analysis/integrated/internal/persona-composer.ts
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Gemini client mock
const mockGenerateContent = vi.fn();
const mockIsAvailable = vi.fn();
const mockParseJson = vi.fn();

vi.mock('@/lib/gemini/client', () => ({
  generateContent: (...args: unknown[]) => mockGenerateContent(...args),
  isGeminiAvailable: () => mockIsAvailable(),
  parseJsonResponse: (text: string) => mockParseJson(text),
  // buildPrompt가 출력 언어 지시문 주입에 사용 — 실제 구현과 동일하게 언어별 한 줄 반환
  outputLanguageDirective: (locale: string = 'ko') =>
    ({
      ko: '한국어로 자연스럽게 작성해주세요.',
      en: 'Write naturally in English.',
      ja: '自然な日本語で記述してください。',
      zh: '请用自然的中文书写。',
    })[locale] ?? '한국어로 자연스럽게 작성해주세요.',
}));

import { composePersona } from '@/lib/analysis/integrated/internal/persona-composer';
import type {
  AxisResult,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
} from '@/lib/analysis/integrated';

// ============================================
// Fixtures
// ============================================

const pcSuccess: AxisResult<PersonalColorAxisData> = {
  success: true,
  usedFallback: false,
  data: {
    season: 'spring',
    tone: 'light-spring',
    undertone: 'warm',
    confidence: 88,
  },
};

const skinSuccess: AxisResult<SkinAxisData> = {
  success: true,
  usedFallback: false,
  data: { skinType: 'combination', overallScore: 78 },
};

const bodySuccess: AxisResult<BodyAxisData> = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'hourglass' },
};

const hairSuccess: AxisResult<HairAxisData> = {
  success: true,
  usedFallback: false,
  data: { faceShape: 'oval' },
};

const makeupSuccess: AxisResult<MakeupAxisData> = {
  success: true,
  usedFallback: false,
  data: { baseRecommendation: '코랄 듀이 베이스 추천' },
};

const failedAxis: AxisResult<never> = {
  success: false,
  error: {
    code: 'AI_TIMEOUT',
    message: 'timeout',
    userMessage: '타임아웃',
    retryable: true,
  },
};

function allFailed() {
  return {
    personalColor: failedAxis as AxisResult<PersonalColorAxisData>,
    skin: failedAxis as AxisResult<SkinAxisData>,
    body: failedAxis as AxisResult<BodyAxisData>,
    hair: failedAxis as AxisResult<HairAxisData>,
    makeup: failedAxis as AxisResult<MakeupAxisData>,
  };
}

function allSuccess() {
  return {
    personalColor: pcSuccess,
    skin: skinSuccess,
    body: bodySuccess,
    hair: hairSuccess,
    makeup: makeupSuccess,
  };
}

// ============================================
// Tests
// ============================================

describe('composePersona', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockIsAvailable.mockReset();
    mockParseJson.mockReset();
    delete process.env.FORCE_MOCK_AI;
  });

  afterEach(() => {
    delete process.env.FORCE_MOCK_AI;
  });

  it('성공 축 0개면 null 반환', async () => {
    const result = await composePersona(allFailed());
    expect(result).toBeNull();
  });

  it('성공 축 1개면 Gemini 호출 없이 Mock fallback', async () => {
    mockIsAvailable.mockReturnValue(true);
    const result = await composePersona({
      ...allFailed(),
      personalColor: pcSuccess,
    });
    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('FORCE_MOCK_AI=true면 Gemini 건너뛰고 Mock', async () => {
    process.env.FORCE_MOCK_AI = 'true';
    const result = await composePersona(allSuccess());
    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('Gemini 미가용이면 Mock fallback', async () => {
    mockIsAvailable.mockReturnValue(false);
    const result = await composePersona(allSuccess());
    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
  });

  it('성공 축 2개+ && Gemini 가용 → Gemini 호출, 파싱 성공 시 usedFallback: false', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        oneLine: '봄볕에 피는 꽃',
        narrative: '따뜻한 색을 품은 사람. 복합성 피부에 어울려요.',
        keyInsights: ['a', 'b', 'c'],
      }),
    });
    mockParseJson.mockImplementation((text: string) => JSON.parse(text));

    const result = await composePersona(allSuccess());
    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(false);
    expect(result?.oneLine).toBe('봄볕에 피는 꽃');
    expect(result?.keyInsights).toHaveLength(3);
    expect(mockGenerateContent).toHaveBeenCalledOnce();
  });

  it('Gemini 응답 파싱 실패 시 Mock fallback', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateContent.mockResolvedValue({ text: '{ invalid' });
    mockParseJson.mockImplementation(() => {
      throw new Error('parse fail');
    });

    const result = await composePersona(allSuccess());
    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
  });

  it('Gemini 응답 유효성 검사 실패 시 (oneLine 빈 문자열) Mock fallback', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ oneLine: '', narrative: 'abc', keyInsights: [] }),
    });
    mockParseJson.mockImplementation((text: string) => JSON.parse(text));

    const result = await composePersona(allSuccess());
    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
  });

  it('Gemini throw 시 Mock fallback (orchestrator 보호)', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateContent.mockRejectedValue(new Error('network'));

    const result = await composePersona(allSuccess());
    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
  });

  it('Mock fallback은 전문 용어에 풀이를 병기한다 (듀이 → 듀이(촉촉한 광))', async () => {
    // 2축 성공 + FORCE_MOCK → generateMockPersona 경로
    process.env.FORCE_MOCK_AI = 'true';
    const result = await composePersona({
      ...allFailed(),
      personalColor: pcSuccess,
      skin: skinSuccess, // combination(비지성) → 듀이 마무리
    });
    expect(result?.usedFallback).toBe(true);
    const text = [result?.oneLine, result?.narrative, ...(result?.keyInsights ?? [])].join(' ');
    // 전문 용어에 괄호 풀이 병기
    expect(text).toMatch(/듀이\(촉촉한 광\)/);
    // 12톤은 PC 결과 페이지와 동일한 한국어 정본 라벨로 (light-spring이 아니라 라이트 스프링)
    expect(text).toContain('라이트 스프링');
    // 풀이 없는 영문 원시 용어 노출 금지 (12톤 원시값 spring 포함)
    expect(text).not.toMatch(/combination|oval|dewy|spring/i);
  });

  it('locale 전달 시 프롬프트에 해당 언어 지시문·언어별 글자수(en 45자) 주입', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ oneLine: 'a', narrative: 'bcd', keyInsights: ['1', '2', '3'] }),
    });
    mockParseJson.mockImplementation((text: string) => JSON.parse(text));

    await composePersona(allSuccess(), 'en');
    const prompt = mockGenerateContent.mock.calls[0][0].contents as string;
    expect(prompt).toContain('Write naturally in English.');
    expect(prompt).toContain('최대 45characters'); // en 글자수 재보정
    // en에는 ko 전용 "영문 용어 회피" 예시가 없어야 함
    expect(prompt).not.toContain('골격감이 자연스러운(내추럴)');
  });

  it('locale 기본값 ko는 프롬프트 글자수·한국어 지시문 유지 (회귀 0)', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ oneLine: 'a', narrative: 'bcd', keyInsights: ['1', '2', '3'] }),
    });
    mockParseJson.mockImplementation((text: string) => JSON.parse(text));

    await composePersona(allSuccess());
    const prompt = mockGenerateContent.mock.calls[0][0].contents as string;
    expect(prompt).toContain('한국어로 자연스럽게 작성해주세요.');
    expect(prompt).toContain('최대 20자');
    expect(prompt).toContain('골격감이 자연스러운(내추럴)'); // ko 전용 규칙 유지
  });

  it('keyInsights가 3개 초과면 3개로 잘림', async () => {
    mockIsAvailable.mockReturnValue(true);
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        oneLine: 'a',
        narrative: 'bcd',
        keyInsights: ['1', '2', '3', '4', '5'],
      }),
    });
    mockParseJson.mockImplementation((text: string) => JSON.parse(text));

    const result = await composePersona(allSuccess());
    expect(result?.keyInsights).toHaveLength(3);
  });
});
