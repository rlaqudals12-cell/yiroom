/**
 * PC-2: Gemini 프롬프트 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/prompts
 * @description 프롬프트 생성 및 JSON 파싱 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PERSONAL_COLOR_SYSTEM_PROMPT,
  generateAnalysisPrompt,
  generateDrapingPrompt,
  generateMakeupRecommendationPrompt,
  generateStylingRecommendationPrompt,
  extractJsonFromResponse,
  validateToneValue,
  validateLabRange,
  validateAnalysisResult,
} from '@/lib/analysis/personal-color-v2/prompts';
import type { TwelveTone } from '@/lib/analysis/personal-color-v2/types';

describe('PERSONAL_COLOR_SYSTEM_PROMPT 상수', () => {
  it('시스템 프롬프트가 정의되어 있다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toBeDefined();
    expect(typeof PERSONAL_COLOR_SYSTEM_PROMPT).toBe('string');
  });

  it('역할 설명이 포함되어 있다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('퍼스널컬러 분석가');
  });

  it('12톤 시스템 설명이 포함되어 있다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('12톤 시스템');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('Spring');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('Summer');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('Autumn');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('Winter');
  });

  it('분석 기준이 포함되어 있다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('피부톤 밝기');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('채도');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('언더톤');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('ITA');
  });

  it('출력 형식 지시가 포함되어 있다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('JSON');
  });

  it('Lab 색공간 언급이 포함되어 있다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('Lab 색공간');
  });

  it('서브타입이 포함되어 있다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('light-spring');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('true-spring');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('bright-spring');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('muted-summer');
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).toContain('deep-autumn');
  });
});

describe('generateAnalysisPrompt', () => {
  describe('기본 동작', () => {
    it('옵션 없이 호출 시 프롬프트를 반환한다', () => {
      const prompt = generateAnalysisPrompt();

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('분석 요청 섹션이 포함된다', () => {
      const prompt = generateAnalysisPrompt();

      expect(prompt).toContain('분석 요청');
      expect(prompt).toContain('퍼스널컬러');
    });

    it('분석 항목이 포함된다', () => {
      const prompt = generateAnalysisPrompt();

      expect(prompt).toContain('이마');
      expect(prompt).toContain('볼');
      expect(prompt).toContain('턱');
      expect(prompt).toContain('Lab 색공간');
      expect(prompt).toContain('언더톤');
      expect(prompt).toContain('12톤 분류');
      expect(prompt).toContain('신뢰도');
    });

    it('출력 JSON 형식이 포함된다', () => {
      const prompt = generateAnalysisPrompt();

      expect(prompt).toContain('출력 JSON 형식');
      expect(prompt).toContain('"tone"');
      expect(prompt).toContain('"season"');
      expect(prompt).toContain('"confidence"');
      expect(prompt).toContain('"measuredLab"');
    });
  });

  describe('includeDetailedAnalysis 옵션', () => {
    it('true일 때 상세 분석 항목이 포함된다', () => {
      const prompt = generateAnalysisPrompt({ includeDetailedAnalysis: true });

      expect(prompt).toContain('머리카락 색상');
      expect(prompt).toContain('눈 색상');
      expect(prompt).toContain('대비 레벨');
      expect(prompt).toContain('채도 레벨');
      expect(prompt).toContain('명도 레벨');
      expect(prompt).toContain('detailedAnalysis');
    });

    it('false일 때 상세 분석 항목이 제외된다', () => {
      const prompt = generateAnalysisPrompt({ includeDetailedAnalysis: false });

      expect(prompt).not.toContain('detailedAnalysis');
    });

    it('기본값은 true이다', () => {
      const defaultPrompt = generateAnalysisPrompt();
      const explicitPrompt = generateAnalysisPrompt({ includeDetailedAnalysis: true });

      expect(defaultPrompt).toContain('detailedAnalysis');
    });
  });

  describe('주의사항 포함', () => {
    it('JSON 외 텍스트 금지 주의사항이 포함된다', () => {
      const prompt = generateAnalysisPrompt();

      expect(prompt).toContain('JSON 외 다른 텍스트 출력 금지');
    });

    it('톤 값 제한 주의사항이 포함된다', () => {
      const prompt = generateAnalysisPrompt();

      expect(prompt).toContain('12톤 중 하나만');
    });

    it('confidence 설명이 포함된다', () => {
      const prompt = generateAnalysisPrompt();

      expect(prompt).toContain('confidence');
      expect(prompt).toContain('70');
    });
  });
});

describe('generateDrapingPrompt', () => {
  describe('기본 동작', () => {
    it('색상 목록으로 프롬프트를 생성한다', () => {
      const colors = ['#FF5733', '#33FF57', '#3357FF'];
      const prompt = generateDrapingPrompt(colors);

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('전달된 색상이 프롬프트에 포함된다', () => {
      const colors = ['#FF5733', '#33FF57'];
      const prompt = generateDrapingPrompt(colors);

      expect(prompt).toContain('#FF5733');
      expect(prompt).toContain('#33FF57');
    });

    it('번호가 매겨진 색상 목록이 포함된다', () => {
      const colors = ['#FF5733', '#33FF57'];
      const prompt = generateDrapingPrompt(colors);

      expect(prompt).toContain('1. #FF5733');
      expect(prompt).toContain('2. #33FF57');
    });
  });

  describe('분석 기준 포함', () => {
    it('조화도 분석 기준이 포함된다', () => {
      const prompt = generateDrapingPrompt(['#FF5733']);

      expect(prompt).toContain('조화도');
    });

    it('밝기 효과 분석 기준이 포함된다', () => {
      const prompt = generateDrapingPrompt(['#FF5733']);

      expect(prompt).toContain('밝아 보이는지');
      expect(prompt).toContain('어두워 보이는지');
    });

    it('균일성 분석 기준이 포함된다', () => {
      const prompt = generateDrapingPrompt(['#FF5733']);

      expect(prompt).toContain('균일해 보이는지');
      expect(prompt).toContain('불균일해 보이는지');
    });
  });

  describe('출력 형식', () => {
    it('JSON 출력 형식이 포함된다', () => {
      const prompt = generateDrapingPrompt(['#FF5733']);

      expect(prompt).toContain('출력 JSON 형식');
      expect(prompt).toContain('harmonyScore');
      expect(prompt).toContain('brightnessEffect');
      expect(prompt).toContain('bestColor');
      expect(prompt).toContain('worstColor');
    });
  });

  describe('빈 배열 처리', () => {
    it('빈 배열이 전달되어도 프롬프트가 생성된다', () => {
      const prompt = generateDrapingPrompt([]);

      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('테스트 색상');
    });
  });
});

describe('generateMakeupRecommendationPrompt', () => {
  describe('기본 동작', () => {
    it('톤에 대한 메이크업 추천 프롬프트를 생성한다', () => {
      const prompt = generateMakeupRecommendationPrompt('true-spring');

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('톤과 한국어 라벨이 포함된다', () => {
      const prompt = generateMakeupRecommendationPrompt('true-spring');

      expect(prompt).toContain('트루 스프링');
      expect(prompt).toContain('true-spring');
    });
  });

  describe('추천 항목', () => {
    it('립 컬러 추천이 포함된다', () => {
      const prompt = generateMakeupRecommendationPrompt('true-spring');

      expect(prompt).toContain('립 컬러');
    });

    it('아이섀도 추천이 포함된다', () => {
      const prompt = generateMakeupRecommendationPrompt('true-spring');

      expect(prompt).toContain('아이섀도');
    });

    it('블러쉬 추천이 포함된다', () => {
      const prompt = generateMakeupRecommendationPrompt('true-spring');

      expect(prompt).toContain('블러쉬');
    });

    it('하이라이터 추천이 포함된다', () => {
      const prompt = generateMakeupRecommendationPrompt('true-spring');

      expect(prompt).toContain('하이라이터');
    });
  });

  describe('출력 형식', () => {
    it('JSON 출력 형식이 포함된다', () => {
      const prompt = generateMakeupRecommendationPrompt('true-spring');

      expect(prompt).toContain('lipColors');
      expect(prompt).toContain('eyeshadowPalette');
      expect(prompt).toContain('blushColors');
      expect(prompt).toContain('highlighterTone');
    });
  });

  describe('모든 톤에 대해 동작', () => {
    const allTones: TwelveTone[] = [
      'light-spring', 'true-spring', 'bright-spring',
      'light-summer', 'true-summer', 'muted-summer',
      'muted-autumn', 'true-autumn', 'deep-autumn',
      'deep-winter', 'true-winter', 'bright-winter',
    ];

    it('모든 12톤에 대해 프롬프트를 생성한다', () => {
      for (const tone of allTones) {
        const prompt = generateMakeupRecommendationPrompt(tone);
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('generateStylingRecommendationPrompt', () => {
  describe('기본 동작', () => {
    it('톤에 대한 스타일링 추천 프롬프트를 생성한다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('톤과 한국어 라벨이 포함된다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(prompt).toContain('트루 오텀');
      expect(prompt).toContain('true-autumn');
    });
  });

  describe('추천 항목', () => {
    it('상의 추천이 포함된다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(prompt).toContain('상의');
    });

    it('하의 추천이 포함된다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(prompt).toContain('하의');
    });

    it('아우터 추천이 포함된다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(prompt).toContain('아우터');
    });

    it('악세서리 금속 추천이 포함된다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(prompt).toContain('악세서리');
      expect(prompt).toContain('gold');
      expect(prompt).toContain('silver');
    });

    it('피해야 할 컬러가 포함된다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(prompt).toContain('피해야');
    });
  });

  describe('출력 형식', () => {
    it('JSON 출력 형식이 포함된다', () => {
      const prompt = generateStylingRecommendationPrompt('true-autumn');

      expect(prompt).toContain('topColors');
      expect(prompt).toContain('bottomColors');
      expect(prompt).toContain('outerColors');
      expect(prompt).toContain('metalRecommendation');
      expect(prompt).toContain('avoidColors');
      expect(prompt).toContain('seasonalTips');
    });
  });
});

describe('extractJsonFromResponse', () => {
  describe('코드 블록 내 JSON 추출', () => {
    it('```json 블록에서 JSON을 추출한다', () => {
      const response = '```json\n{"tone": "true-spring"}\n```';
      const result = extractJsonFromResponse<{ tone: string }>(response);

      expect(result).toEqual({ tone: 'true-spring' });
    });

    it('``` 블록 (언어 없음)에서 JSON을 추출한다', () => {
      const response = '```\n{"tone": "true-spring"}\n```';
      const result = extractJsonFromResponse<{ tone: string }>(response);

      expect(result).toEqual({ tone: 'true-spring' });
    });

    it('코드 블록 앞뒤 텍스트가 있어도 추출한다', () => {
      const response = '분석 결과:\n```json\n{"tone": "true-spring"}\n```\n완료';
      const result = extractJsonFromResponse<{ tone: string }>(response);

      expect(result).toEqual({ tone: 'true-spring' });
    });
  });

  describe('순수 JSON 추출', () => {
    it('코드 블록 없이 순수 JSON을 파싱한다', () => {
      const response = '{"tone": "true-spring", "confidence": 85}';
      const result = extractJsonFromResponse<{ tone: string; confidence: number }>(response);

      expect(result).toEqual({ tone: 'true-spring', confidence: 85 });
    });

    it('앞뒤 텍스트가 있어도 JSON을 추출한다', () => {
      const response = '결과는 다음과 같습니다: {"tone": "true-spring"} 감사합니다.';
      const result = extractJsonFromResponse<{ tone: string }>(response);

      expect(result).toEqual({ tone: 'true-spring' });
    });
  });

  describe('복잡한 JSON 구조', () => {
    it('중첩된 객체를 파싱한다', () => {
      const response = '```json\n{"measuredLab": {"L": 68.5, "a": 10.2, "b": 22.8}}\n```';
      const result = extractJsonFromResponse<{ measuredLab: { L: number; a: number; b: number } }>(
        response
      );

      expect(result?.measuredLab.L).toBe(68.5);
      expect(result?.measuredLab.a).toBe(10.2);
      expect(result?.measuredLab.b).toBe(22.8);
    });

    it('배열이 포함된 JSON을 파싱한다', () => {
      const response = '{"colors": ["#FF5733", "#33FF57"]}';
      const result = extractJsonFromResponse<{ colors: string[] }>(response);

      expect(result?.colors).toEqual(['#FF5733', '#33FF57']);
    });
  });

  describe('에러 처리', () => {
    it('유효하지 않은 JSON에 대해 null을 반환한다', () => {
      const response = '이것은 JSON이 아닙니다.';
      const result = extractJsonFromResponse(response);

      expect(result).toBeNull();
    });

    it('빈 문자열에 대해 null을 반환한다', () => {
      const result = extractJsonFromResponse('');

      expect(result).toBeNull();
    });

    it('깨진 JSON에 대해 null을 반환한다', () => {
      const response = '{"tone": "true-spring"'; // 닫는 괄호 없음
      const result = extractJsonFromResponse(response);

      expect(result).toBeNull();
    });
  });
});

describe('validateToneValue', () => {
  describe('유효한 톤 검증', () => {
    const validTones: TwelveTone[] = [
      'light-spring', 'true-spring', 'bright-spring',
      'light-summer', 'true-summer', 'muted-summer',
      'muted-autumn', 'true-autumn', 'deep-autumn',
      'deep-winter', 'true-winter', 'bright-winter',
    ];

    it('모든 유효한 톤에 대해 해당 톤을 반환한다', () => {
      for (const tone of validTones) {
        expect(validateToneValue(tone)).toBe(tone);
      }
    });
  });

  describe('유효하지 않은 톤 검증', () => {
    it('유효하지 않은 문자열에 대해 null을 반환한다', () => {
      expect(validateToneValue('invalid-tone')).toBeNull();
      expect(validateToneValue('spring')).toBeNull();
      expect(validateToneValue('warm')).toBeNull();
    });

    it('빈 문자열에 대해 null을 반환한다', () => {
      expect(validateToneValue('')).toBeNull();
    });

    it('대소문자가 다른 경우 null을 반환한다', () => {
      expect(validateToneValue('True-Spring')).toBeNull();
      expect(validateToneValue('TRUE-SPRING')).toBeNull();
    });

    it('공백이 포함된 경우 null을 반환한다', () => {
      expect(validateToneValue('true spring')).toBeNull();
      expect(validateToneValue(' true-spring')).toBeNull();
    });
  });
});

describe('validateLabRange', () => {
  describe('유효한 Lab 값 검증', () => {
    it('정상 범위의 Lab 값에 대해 true를 반환한다', () => {
      expect(validateLabRange({ L: 50, a: 0, b: 0 })).toBe(true);
      expect(validateLabRange({ L: 0, a: -128, b: -128 })).toBe(true);
      expect(validateLabRange({ L: 100, a: 127, b: 127 })).toBe(true);
    });

    it('경계값에서 true를 반환한다', () => {
      expect(validateLabRange({ L: 0, a: 0, b: 0 })).toBe(true);
      expect(validateLabRange({ L: 100, a: 0, b: 0 })).toBe(true);
      expect(validateLabRange({ L: 50, a: -128, b: 127 })).toBe(true);
    });
  });

  describe('유효하지 않은 Lab 값 검증', () => {
    it('L이 범위를 벗어나면 false를 반환한다', () => {
      expect(validateLabRange({ L: -1, a: 0, b: 0 })).toBe(false);
      expect(validateLabRange({ L: 101, a: 0, b: 0 })).toBe(false);
    });

    it('a가 범위를 벗어나면 false를 반환한다', () => {
      expect(validateLabRange({ L: 50, a: -129, b: 0 })).toBe(false);
      expect(validateLabRange({ L: 50, a: 128, b: 0 })).toBe(false);
    });

    it('b가 범위를 벗어나면 false를 반환한다', () => {
      expect(validateLabRange({ L: 50, a: 0, b: -129 })).toBe(false);
      expect(validateLabRange({ L: 50, a: 0, b: 128 })).toBe(false);
    });
  });

  describe('타입 검증', () => {
    it('숫자가 아닌 값에 대해 false를 반환한다', () => {
      expect(validateLabRange({ L: '50' as unknown as number, a: 0, b: 0 })).toBe(false);
      expect(validateLabRange({ L: 50, a: null as unknown as number, b: 0 })).toBe(false);
      expect(validateLabRange({ L: 50, a: 0, b: undefined as unknown as number })).toBe(false);
    });

    it('누락된 필드에 대해 false를 반환한다', () => {
      expect(validateLabRange({ a: 0, b: 0 } as { L?: number; a: number; b: number })).toBe(false);
      expect(validateLabRange({ L: 50, b: 0 } as { L: number; a?: number; b: number })).toBe(false);
    });
  });
});

describe('validateAnalysisResult', () => {
  describe('유효한 결과 검증', () => {
    it('필수 필드가 모두 있는 경우 true를 반환한다', () => {
      const validResult = {
        tone: 'true-spring',
        confidence: 85,
        measuredLab: { L: 68, a: 10, b: 22 },
      };

      expect(validateAnalysisResult(validResult)).toBe(true);
    });

    it('추가 필드가 있어도 true를 반환한다', () => {
      const resultWithExtra = {
        tone: 'true-spring',
        confidence: 85,
        measuredLab: { L: 68, a: 10, b: 22 },
        season: 'spring',
        extra: 'field',
      };

      expect(validateAnalysisResult(resultWithExtra)).toBe(true);
    });
  });

  describe('유효하지 않은 tone 검증', () => {
    it('tone이 없으면 false를 반환한다', () => {
      const result = {
        confidence: 85,
        measuredLab: { L: 68, a: 10, b: 22 },
      };

      expect(validateAnalysisResult(result)).toBe(false);
    });

    it('유효하지 않은 tone이면 false를 반환한다', () => {
      const result = {
        tone: 'invalid-tone',
        confidence: 85,
        measuredLab: { L: 68, a: 10, b: 22 },
      };

      expect(validateAnalysisResult(result)).toBe(false);
    });
  });

  describe('유효하지 않은 confidence 검증', () => {
    it('confidence가 없으면 false를 반환한다', () => {
      const result = {
        tone: 'true-spring',
        measuredLab: { L: 68, a: 10, b: 22 },
      };

      expect(validateAnalysisResult(result)).toBe(false);
    });

    it('confidence가 숫자가 아니면 false를 반환한다', () => {
      const result = {
        tone: 'true-spring',
        confidence: '85',
        measuredLab: { L: 68, a: 10, b: 22 },
      };

      expect(validateAnalysisResult(result)).toBe(false);
    });

    it('confidence가 범위를 벗어나면 false를 반환한다', () => {
      expect(
        validateAnalysisResult({
          tone: 'true-spring',
          confidence: -1,
          measuredLab: { L: 68, a: 10, b: 22 },
        })
      ).toBe(false);

      expect(
        validateAnalysisResult({
          tone: 'true-spring',
          confidence: 101,
          measuredLab: { L: 68, a: 10, b: 22 },
        })
      ).toBe(false);
    });
  });

  describe('유효하지 않은 measuredLab 검증', () => {
    it('measuredLab이 없으면 false를 반환한다', () => {
      const result = {
        tone: 'true-spring',
        confidence: 85,
      };

      expect(validateAnalysisResult(result)).toBe(false);
    });

    it('measuredLab의 Lab 값이 범위를 벗어나면 false를 반환한다', () => {
      const result = {
        tone: 'true-spring',
        confidence: 85,
        measuredLab: { L: 150, a: 10, b: 22 },
      };

      expect(validateAnalysisResult(result)).toBe(false);
    });
  });

  describe('null/undefined 입력 처리', () => {
    it('null에 대해 false를 반환한다', () => {
      expect(validateAnalysisResult(null)).toBe(false);
    });

    it('undefined에 대해 false를 반환한다', () => {
      expect(validateAnalysisResult(undefined)).toBe(false);
    });

    it('비객체에 대해 false를 반환한다', () => {
      expect(validateAnalysisResult('string')).toBe(false);
      expect(validateAnalysisResult(123)).toBe(false);
      expect(validateAnalysisResult([])).toBe(false);
    });
  });
});
