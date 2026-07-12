/**
 * 소비자 눈높이 라벨 헬퍼 (5축 원시 영문값 → 한국어)
 *
 * @module lib/analysis/integrated/labels
 * @description
 *   DB에 저장된 원시 영문값(season='Autumn', undertone='Warm', skin_type='combination',
 *   face_shape='oval' 등)을 사용자 대면 한국어로 변환하는 공용 헬퍼.
 *   여러 파일(persona-composer, action-plan, curation, 결과 페이지 요약 카드)에
 *   흩어져 있던 매핑을 한 곳으로 모아 영문 라벨 누수를 일소한다.
 *
 *   왜 순수 함수 모듈인가: 서버(action-plan/curation)와 클라이언트(요약 카드)에서
 *   모두 import 하므로 사이드이펙트/의존성 없는 순수 매핑만 둔다.
 *
 * @see .claude/rules/quality-improvement-cycles.md — Cycle 2 "전문 용어 0개"
 */

// PC-2 12톤 한국어 라벨은 personal-color-v2가 정본(SSOT) — 여기서 재정의하지 않고 재사용(이원화 금지).
// types.ts는 순수 상수/타입만 담아 사이드이펙트가 없으므로 클라이언트 요약 카드에서 import 해도 안전.
import { TWELVE_TONE_LABELS } from '@/lib/analysis/personal-color-v2/types';

/** 계절 원시값(spring/Spring 등) → 한국어 "봄 웜톤" */
const SEASON_KO: Record<string, string> = {
  spring: '봄 웜톤',
  summer: '여름 쿨톤',
  autumn: '가을 웜톤',
  winter: '겨울 쿨톤',
};

/** 계절만 짧게 (봄/여름/가을/겨울) */
const SEASON_SHORT_KO: Record<string, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

/** 언더톤 원시값(warm/Warm/cool/neutral) → 한국어 */
const UNDERTONE_KO: Record<string, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

/** 피부 타입 원시값(영문) → 한국어 */
const SKIN_TYPE_KO: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  sensitive: '민감성',
};

/** 얼굴형 원시값(영문) → 한국어 */
const FACE_SHAPE_KO: Record<string, string> = {
  oval: '계란형',
  round: '둥근형',
  square: '각진형',
  heart: '하트형',
  oblong: '긴 얼굴형',
  diamond: '다이아몬드형',
};

/** 골격 라벨(스트레이트/웨이브/내추럴) → 짧은 풀이 병기 (초보자용) */
const BODY_DESC_KO: Record<string, string> = {
  스트레이트: '직선이 깔끔한 스트레이트',
  웨이브: '곡선이 부드러운 웨이브',
  내추럴: '골격감이 자연스러운 내추럴',
};

/** 메이크업 피니시 원시값 → 한국어 (기존 curation/베이스 카드 표기와 동일) */
const FINISH_KO: Record<string, string> = {
  dewy: '듀이',
  satin: '사틴',
  matte: '매트',
  'semi-matte': '세미매트',
};

/** 베이스 커버력 원시값 → 한국어 */
const COVERAGE_KO: Record<string, string> = {
  light: '라이트',
  medium: '미디엄',
  full: '풀',
};

function mapKo(map: Record<string, string>, raw: string | null | undefined): string {
  if (!raw) return '';
  return map[raw.toLowerCase()] ?? raw;
}

/** "가을 웜톤" (season 원시값 → 한국어). 매칭 실패 시 원본 반환. */
export function seasonKo(raw: string | null | undefined): string {
  return mapKo(SEASON_KO, raw);
}

/** "가을" (계절만 짧게). */
export function seasonShortKo(raw: string | null | undefined): string {
  return mapKo(SEASON_SHORT_KO, raw);
}

/** "웜톤" (undertone/tone 원시값 → 한국어). */
export function undertoneKo(raw: string | null | undefined): string {
  return mapKo(UNDERTONE_KO, raw);
}

/** "복합성" (skin_type 원시값 → 한국어). */
export function skinTypeKo(raw: string | null | undefined): string {
  return mapKo(SKIN_TYPE_KO, raw);
}

/** "계란형" (face_shape 원시값 → 한국어). */
export function faceShapeKo(raw: string | null | undefined): string {
  return mapKo(FACE_SHAPE_KO, raw);
}

/** "곡선이 부드러운 웨이브" (골격 한국어 라벨 → 풀이 병기). 이미 풀이가 없으면 원본. */
export function bodyDescKo(label: string | null | undefined): string {
  if (!label) return '';
  return BODY_DESC_KO[label] ?? label;
}

/** "트루 스프링" (12톤 원시값 true-spring 등 → 한국어). PC 결과 페이지와 동일 정본 표기. 매칭 실패 시 원본. */
export function toneKo(raw: string | null | undefined): string {
  return mapKo(TWELVE_TONE_LABELS, raw);
}

/** "세미매트" (메이크업 피니시 원시값 → 한국어). */
export function finishKo(raw: string | null | undefined): string {
  return mapKo(FINISH_KO, raw);
}

/** "미디엄" (베이스 커버력 원시값 → 한국어). */
export function coverageKo(raw: string | null | undefined): string {
  return mapKo(COVERAGE_KO, raw);
}
