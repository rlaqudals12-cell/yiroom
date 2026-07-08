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
