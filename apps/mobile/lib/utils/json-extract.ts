/**
 * AI 응답에서 JSON 객체를 안전하게 추출하는 유틸리티
 *
 * /\{[\s\S]*\}/ 정규식 대신 문자열 인덱싱으로 구현하여
 * ReDoS(Regular Expression Denial of Service) 취약점을 방지한다.
 *
 * @module lib/utils/json-extract
 * @see docs/adr/ADR-007-mock-fallback-strategy.md
 */

/**
 * 텍스트에서 첫 번째 JSON 객체({...})를 추출한다.
 * 정규식 없이 문자열 탐색으로 O(n) 보장.
 *
 * @param text - AI 응답 텍스트
 * @returns 추출된 JSON 문자열 또는 null
 */
export function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.substring(start, end + 1);
}

/**
 * 텍스트에서 JSON 객체를 추출하고 파싱한다.
 *
 * @param text - AI 응답 텍스트
 * @returns 파싱된 객체 또는 null
 */
export function extractAndParseJson<T>(text: string): T | null {
  const jsonStr = extractJsonObject(text);
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * 마크다운 코드 블록(```json ... ```) 내 JSON을 추출한다.
 * 코드 블록이 없으면 일반 JSON 추출을 시도한다.
 *
 * @param text - AI 응답 텍스트 (코드 블록 포함 가능)
 * @returns 추출된 JSON 문자열 또는 null
 */
export function extractJsonFromCodeBlock(text: string): string | null {
  // 코드 블록 경계 찾기 (정규식 대신 문자열 탐색)
  const blockStart = text.indexOf('```');
  if (blockStart !== -1) {
    const contentStart = text.indexOf('\n', blockStart);
    if (contentStart !== -1) {
      const blockEnd = text.indexOf('```', contentStart);
      if (blockEnd !== -1) {
        const content = text.substring(contentStart + 1, blockEnd).trim();
        // 코드 블록 내에서 JSON 객체 추출
        if (content.startsWith('{')) {
          return content;
        }
        return extractJsonObject(content);
      }
    }
  }

  // 코드 블록이 없으면 직접 JSON 추출
  return extractJsonObject(text);
}
