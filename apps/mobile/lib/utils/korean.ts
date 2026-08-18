/**
 * 한국어 조사(助詞) 유틸 — 받침 유무로 은/는·이/가를 고른다.
 *
 * 왜 필요한가: 동적으로 조립하는 안내 문구가 "상의은"처럼 어색해지지 않도록
 * 조사 선택 규칙을 한곳에서 공유한다.
 */

const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;

export function hasBatchim(word: string): boolean {
  if (word.length === 0) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) return false;
  return (code - HANGUL_SYLLABLE_START) % 28 !== 0;
}

export function subjectParticle(word: string): '이' | '가' {
  return hasBatchim(word) ? '이' : '가';
}

export function topicParticle(word: string): '은' | '는' {
  return hasBatchim(word) ? '은' : '는';
}

export function withSubjectParticle(word: string): string {
  return `${word}${subjectParticle(word)}`;
}

export function withTopicParticle(word: string): string {
  return `${word}${topicParticle(word)}`;
}

export function objectParticle(word: string): '을' | '를' {
  for (let i = word.length - 1; i >= 0; i--) {
    const code = word.charCodeAt(i);
    if (code >= HANGUL_SYLLABLE_START && code <= HANGUL_SYLLABLE_END) {
      return (code - HANGUL_SYLLABLE_START) % 28 !== 0 ? '을' : '를';
    }
  }
  return '를';
}
