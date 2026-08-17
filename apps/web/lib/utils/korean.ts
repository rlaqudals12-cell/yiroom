/**
 * 한국어 조사(助詞) 유틸 — 받침 유무로 은/는·이/가를 고른다.
 *
 * 왜 필요한가: 카테고리 이름을 문장에 끼워 넣는 안내 문구는 이름마다 받침이 달라
 * 조사를 하드코딩하면 "상의은 1벌뿐이에요" 같은 비문이 나온다. 문구를 만드는 쪽이
 * 매번 판정하지 않도록 한 곳에 모은다.
 *
 * @module lib/utils/korean
 */

/** 한글 음절 영역(가~힣) */
const HANGUL_SYLLABLE_START = 0xac00;
const HANGUL_SYLLABLE_END = 0xd7a3;

/**
 * 마지막 글자에 받침(종성)이 있는지 판정.
 *
 * 한글 음절은 (초성×21 + 중성)×28 + 종성 구조라 (코드 - 0xAC00) % 28 이 0이면 받침 없음.
 * 한글 음절이 아닌 끝문자(영문·숫자·기호)는 발음 규칙이 갈리므로 받침 없음으로 본다
 * (조사 기본값은 '는'·'가').
 */
export function hasBatchim(word: string): boolean {
  if (word.length === 0) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < HANGUL_SYLLABLE_START || code > HANGUL_SYLLABLE_END) return false;
  return (code - HANGUL_SYLLABLE_START) % 28 !== 0;
}

/** 주격 조사(이/가) */
export function subjectParticle(word: string): '이' | '가' {
  return hasBatchim(word) ? '이' : '가';
}

/** 보조사(은/는) */
export function topicParticle(word: string): '은' | '는' {
  return hasBatchim(word) ? '은' : '는';
}

/** 단어 + 주격 조사 (예: '상의' → '상의가', '신발' → '신발이') */
export function withSubjectParticle(word: string): string {
  return `${word}${subjectParticle(word)}`;
}

/** 단어 + 보조사 (예: '상의' → '상의는', '신발' → '신발은') */
export function withTopicParticle(word: string): string {
  return `${word}${topicParticle(word)}`;
}

/**
 * 목적격 조사(을/를) — 끝의 괄호·숫자·기호를 건너뛰고 마지막 한글 음절의 받침으로 판정한다.
 *
 * 왜 스캔하는가: 목적격은 "복합성 피부 (컨디션 72점)"처럼 괄호 병기로 끝나는 문구 뒤에
 * 붙는 문장 조립에 쓰여, 마지막 문자만 보는 hasBatchim으로는 오판한다("…점)를" 비문).
 * 한글 음절이 아예 없으면 '를'(기본값).
 */
export function objectParticle(word: string): '을' | '를' {
  for (let i = word.length - 1; i >= 0; i--) {
    const code = word.charCodeAt(i);
    if (code >= HANGUL_SYLLABLE_START && code <= HANGUL_SYLLABLE_END) {
      return (code - HANGUL_SYLLABLE_START) % 28 !== 0 ? '을' : '를';
    }
  }
  return '를';
}
