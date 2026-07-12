/**
 * 소비자 눈높이 라벨 헬퍼 (5축 원시 영문값 → 한국어) — 모바일 정본
 *
 * @module lib/integrated/labels
 * @description
 *   API 응답(AxisData)의 원시 영문값(season='spring', undertone='warm',
 *   skin_type='combination', face_shape='oval', tone='true-spring', bodyType='W' 등)을
 *   사용자 대면 한국어로 변환하는 공용 헬퍼. action-plan/cross-insights/curation이
 *   문구를 자체 조립하며 영문/코드 원값을 그대로 노출하던 누수를 일소한다.
 *
 * ⚠️ 동기화 계약 (표기 변경 시 반드시 양쪽 수정):
 *   이 파일은 웹 정본 apps/web/lib/analysis/integrated/labels.ts 의 한국어 표기를
 *   **문자 단위로 미러**한다. 12톤 라벨은 웹·모바일 공통 SSOT
 *   `@/lib/analysis/personal-color-v2/types`(TWELVE_TONE_LABELS)를 그대로 재사용한다.
 *   @yiroom/shared 승격 전까지는 웹·모바일이 각자 정본을 두므로, 한 쪽의 표기를 바꾸면
 *   반드시 반대쪽도 함께 갱신해야 한다. (웹 ↔ 모바일 상호 참조)
 *
 * 왜 순수 함수 모듈인가: 조립 로직(서버 응답 가공)과 클라이언트 카드 모두에서 import 하므로
 *   사이드이펙트/의존성 없는 순수 매핑만 둔다.
 *
 * @see apps/web/lib/analysis/integrated/labels.ts (웹 정본)
 */

// PC-2 12톤 한국어 라벨은 personal-color-v2가 정본(SSOT) — 여기서 재정의하지 않고 재사용(이원화 금지).
// types.ts는 순수 상수/타입만 담아 사이드이펙트가 없으므로 조립/카드 어디서 import 해도 안전.
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

/**
 * 체형 코드/영문 → 사용자 대면 표기.
 * - 골격 3형(브랜드 코드 S/W/N): "W(웨이브)"처럼 브랜드 코드 + 한글 병기.
 *   한글 라벨은 웹 체형 결과 페이지 정본(BODY_TYPE3_LABELS: S=스트레이트·W=웨이브·N=내추럴)과 동일.
 * - 7형/5형(hourglass/inverted-triangle 등): 웹 getBodyShapeLabel과 동일하게 한글형으로.
 * - 매핑에 없는 값: 원값 통과(지어내기 금지).
 */
const BODY_TYPE_KO: Record<string, string> = {
  // 골격 3형 — 브랜드 코드 + 한글 병기
  s: 'S(스트레이트)',
  w: 'W(웨이브)',
  n: 'N(내추럴)',
  // 7형 (lib/body BODY_SHAPE7_LABELS)
  hourglass: '모래시계형',
  pear: '배형',
  invertedtriangle: '역삼각형',
  'inverted-triangle': '역삼각형',
  inverted_triangle: '역삼각형',
  apple: '사과형',
  rectangle: '직사각형',
  trapezoid: '사다리꼴형',
  oval: '타원형',
  // body-v2 5형 추가 표기
  triangle: '삼각형',
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

/**
 * 원시값(unknown) → 한국어 매핑. 모바일 AxisData의 필드는 `unknown`이므로 내부에서 문자열화한다.
 * null/undefined/빈 문자열 → '' 반환, 매칭 실패 시 원본 문자열 통과(지어내기 금지).
 */
function mapKo(map: Record<string, string>, raw: unknown): string {
  if (raw == null) return '';
  const s = String(raw);
  if (s === '') return '';
  return map[s.toLowerCase()] ?? s;
}

/** "가을 웜톤" (season 원시값 → 한국어). 매칭 실패 시 원본 반환. */
export function seasonKo(raw: unknown): string {
  return mapKo(SEASON_KO, raw);
}

/** "가을" (계절만 짧게). */
export function seasonShortKo(raw: unknown): string {
  return mapKo(SEASON_SHORT_KO, raw);
}

/** "웜톤" (undertone/tone 원시값 → 한국어). */
export function undertoneKo(raw: unknown): string {
  return mapKo(UNDERTONE_KO, raw);
}

/** "복합성" (skin_type 원시값 → 한국어). */
export function skinTypeKo(raw: unknown): string {
  return mapKo(SKIN_TYPE_KO, raw);
}

/** "계란형" (face_shape 원시값 → 한국어). */
export function faceShapeKo(raw: unknown): string {
  return mapKo(FACE_SHAPE_KO, raw);
}

/** "곡선이 부드러운 웨이브" (골격 한국어 라벨 → 풀이 병기). 이미 풀이가 없으면 원본. */
export function bodyDescKo(label: unknown): string {
  return mapKo(BODY_DESC_KO, label);
}

/** "W(웨이브)" (체형 코드/영문 → 브랜드 코드+한글 병기 또는 한글형). 매칭 실패 시 원본. */
export function bodyTypeKo(raw: unknown): string {
  return mapKo(BODY_TYPE_KO, raw);
}

/** "트루 스프링" (12톤 원시값 true-spring 등 → 한국어). PC 결과 페이지와 동일 정본 표기. 매칭 실패 시 원본. */
export function toneKo(raw: unknown): string {
  return mapKo(TWELVE_TONE_LABELS, raw);
}

/** "세미매트" (메이크업 피니시 원시값 → 한국어). */
export function finishKo(raw: unknown): string {
  return mapKo(FINISH_KO, raw);
}

/** "미디엄" (베이스 커버력 원시값 → 한국어). */
export function coverageKo(raw: unknown): string {
  return mapKo(COVERAGE_KO, raw);
}
