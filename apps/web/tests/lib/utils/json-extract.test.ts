/**
 * JSON 추출 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  extractJsonObject,
  extractAndParseJson,
  extractJsonFromCodeBlock,
} from '@/lib/utils/json-extract';

describe('extractJsonObject', () => {
  it('텍스트에서 JSON 객체를 추출한다', () => {
    const text = 'Here is the result: {"name": "test", "value": 42}';
    expect(extractJsonObject(text)).toBe('{"name": "test", "value": 42}');
  });

  it('순수 JSON 문자열을 그대로 반환한다', () => {
    const text = '{"key": "value"}';
    expect(extractJsonObject(text)).toBe('{"key": "value"}');
  });

  it('중첩 객체를 포함한 JSON을 추출한다', () => {
    const text = 'result: {"outer": {"inner": true}}';
    expect(extractJsonObject(text)).toBe('{"outer": {"inner": true}}');
  });

  it('JSON이 없으면 null을 반환한다', () => {
    expect(extractJsonObject('no json here')).toBeNull();
  });

  it('빈 문자열은 null을 반환한다', () => {
    expect(extractJsonObject('')).toBeNull();
  });

  it('여는 중괄호만 있으면 null을 반환한다', () => {
    expect(extractJsonObject('only { here')).toBeNull();
  });

  it('닫는 중괄호만 있으면 null을 반환한다', () => {
    expect(extractJsonObject('only } here')).toBeNull();
  });

  it('닫는 중괄호가 여는 중괄호보다 먼저 나오면 null을 반환한다', () => {
    // lastIndexOf('}') 가 indexOf('{') 보다 작거나 같은 경우
    expect(extractJsonObject('}')).toBeNull();
  });
});

describe('extractAndParseJson', () => {
  it('JSON을 추출하고 파싱한다', () => {
    const text = 'response: {"skinType": "oily", "score": 75}';
    const result = extractAndParseJson<{ skinType: string; score: number }>(text);
    expect(result).toEqual({ skinType: 'oily', score: 75 });
  });

  it('배열 값이 있는 JSON을 파싱한다', () => {
    const text = '{"colors": ["red", "blue"]}';
    const result = extractAndParseJson<{ colors: string[] }>(text);
    expect(result?.colors).toEqual(['red', 'blue']);
  });

  it('JSON이 없으면 null을 반환한다', () => {
    expect(extractAndParseJson('no json')).toBeNull();
  });

  it('잘못된 JSON은 null을 반환한다', () => {
    const text = '{invalid json content}';
    expect(extractAndParseJson(text)).toBeNull();
  });

  it('빈 문자열은 null을 반환한다', () => {
    expect(extractAndParseJson('')).toBeNull();
  });
});

describe('extractJsonFromCodeBlock', () => {
  it('마크다운 코드 블록에서 JSON을 추출한다', () => {
    const text = '결과입니다:\n```json\n{"type": "dry"}\n```';
    expect(extractJsonFromCodeBlock(text)).toBe('{"type": "dry"}');
  });

  it('언어 태그 없는 코드 블록에서도 추출한다', () => {
    const text = '```\n{"value": 100}\n```';
    expect(extractJsonFromCodeBlock(text)).toBe('{"value": 100}');
  });

  it('코드 블록이 없으면 일반 JSON 추출을 시도한다', () => {
    const text = 'plain text with {"key": "val"} inside';
    expect(extractJsonFromCodeBlock(text)).toBe('{"key": "val"}');
  });

  it('코드 블록 내부에 JSON이 없어도 extractJsonObject로 폴백한다', () => {
    const text = '```\nsome plain text {"a":1}\n```';
    const result = extractJsonFromCodeBlock(text);
    expect(result).toBe('{"a":1}');
  });

  it('빈 문자열은 null을 반환한다', () => {
    expect(extractJsonFromCodeBlock('')).toBeNull();
  });

  it('코드 블록만 있고 JSON이 없으면 null을 반환한다', () => {
    const text = '```\njust text no json\n```';
    expect(extractJsonFromCodeBlock(text)).toBeNull();
  });
});
