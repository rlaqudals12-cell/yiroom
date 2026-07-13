/**
 * 소비자 눈높이 라벨 헬퍼 (5축 원시 영문값 → 사용자 언어 라벨)
 *
 * @module lib/analysis/integrated/labels
 * @description
 *   DB에 저장된 원시 영문값(season='Autumn', undertone='Warm', skin_type='combination',
 *   face_shape='oval' 등)을 사용자 대면 라벨로 변환하는 공용 헬퍼.
 *   여러 파일(persona-composer, action-plan, curation, 결과 페이지 요약 카드)에
 *   흩어져 있던 매핑을 한 곳으로 모아 영문 라벨 누수를 일소한다.
 *
 *   i18n(2026-07): 각 함수는 optional `locale`(기본 'ko')을 받아 4언어 라벨을 반환한다.
 *   함수 이름의 'Ko' 접미사는 하위호환을 위해 유지(호출부 다수) — locale 파라미터만 추가했다.
 *   기본값 'ko' → 라벨 미갱신 호출처(및 프롬프트 입력)는 기존과 100% 동일(회귀 0).
 *
 *   번역 출처(중복 번역 금지·표기 일원화): season/skinType은 messages/*.json의 정본
 *   (analysisEntry.season, skinAnalysisUI.cleanserTypeCard0~4)과 동일 텍스트를 재사용한다.
 *   lib 순수 함수는 next-intl t()를 쓸 수 없으므로 평문 Record로 복제한다.
 *   undertone/faceShape/12톤은 기존 번역이 없어 신규 작성(자국어 자연 표기).
 *
 *   왜 순수 함수 모듈인가: 서버(action-plan/curation)와 클라이언트(요약 카드)에서
 *   모두 import 하므로 사이드이펙트/의존성 없는 순수 매핑만 둔다.
 *   (OutputLocale은 `import type`이라 런타임에 @google/genai를 클라이언트로 끌어오지 않는다.)
 *
 * @see .claude/rules/quality-improvement-cycles.md — Cycle 2 "전문 용어 0개"
 */

import type { OutputLocale } from '@/lib/gemini/client';
// PC-2 12톤 한국어 라벨은 personal-color-v2가 정본(SSOT) — 한국어는 여기서 재정의하지 않고 재사용(이원화 금지).
// types.ts는 순수 상수/타입만 담아 사이드이펙트가 없으므로 클라이언트 요약 카드에서 import 해도 안전.
import { TWELVE_TONE_LABELS } from '@/lib/analysis/personal-color-v2/types';

/** 라벨 언어 (통합 분석 options.locale / Gemini OutputLocale과 동일 taxonomy) */
type Locale = OutputLocale;

/** 계절 원시값(spring/Spring 등) → 시즌 라벨. ko/en/ja/zh는 messages 정본 재사용. */
const SEASON: Record<Locale, Record<string, string>> = {
  ko: { spring: '봄 웜톤', summer: '여름 쿨톤', autumn: '가을 웜톤', winter: '겨울 쿨톤' },
  en: {
    spring: 'Spring Warm',
    summer: 'Summer Cool',
    autumn: 'Autumn Warm',
    winter: 'Winter Cool',
  },
  ja: { spring: '春ウォーム', summer: '夏クール', autumn: '秋ウォーム', winter: '冬クール' },
  zh: { spring: '春暖色调', summer: '夏冷色调', autumn: '秋暖色调', winter: '冬冷色调' },
};

/** 계절만 짧게 (봄/여름/가을/겨울). 현재 ko 전용 호출처만 존재 — 기존 동작 유지. */
const SEASON_SHORT_KO: Record<string, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

/** 언더톤 원시값(warm/Warm/cool/neutral) → 라벨 (신규 번역) */
const UNDERTONE: Record<Locale, Record<string, string>> = {
  ko: { warm: '웜톤', cool: '쿨톤', neutral: '뉴트럴' },
  en: { warm: 'Warm', cool: 'Cool', neutral: 'Neutral' },
  ja: { warm: 'ウォーム', cool: 'クール', neutral: 'ニュートラル' },
  zh: { warm: '暖色调', cool: '冷色调', neutral: '中性色调' },
};

/** 피부 타입 원시값(영문) → 라벨. messages skinAnalysisUI.cleanserTypeCard0~4 정본 재사용. */
const SKIN_TYPE: Record<Locale, Record<string, string>> = {
  ko: { dry: '건성', oily: '지성', combination: '복합성', normal: '중성', sensitive: '민감성' },
  en: {
    dry: 'Dry',
    oily: 'Oily',
    combination: 'Combination',
    normal: 'Normal',
    sensitive: 'Sensitive',
  },
  ja: {
    dry: '乾燥肌',
    oily: '脂性肌',
    combination: '混合肌',
    normal: '普通肌',
    sensitive: '敏感肌',
  },
  zh: { dry: '干性', oily: '油性', combination: '混合性', normal: '中性', sensitive: '敏感性' },
};

/** 얼굴형 원시값(영문) → 라벨 (신규 번역) */
const FACE_SHAPE: Record<Locale, Record<string, string>> = {
  ko: {
    oval: '계란형',
    round: '둥근형',
    square: '각진형',
    heart: '하트형',
    oblong: '긴 얼굴형',
    diamond: '다이아몬드형',
  },
  en: {
    oval: 'Oval',
    round: 'Round',
    square: 'Square',
    heart: 'Heart',
    oblong: 'Oblong',
    diamond: 'Diamond',
  },
  ja: {
    oval: '卵型',
    round: '丸型',
    square: '四角型',
    heart: 'ハート型',
    oblong: '面長',
    diamond: 'ひし型',
  },
  zh: {
    oval: '鹅蛋脸',
    round: '圆脸',
    square: '方脸',
    heart: '心形脸',
    oblong: '长脸',
    diamond: '菱形脸',
  },
};

/**
 * 12톤 라벨 — 비ko 언어만 (ko는 TWELVE_TONE_LABELS SSOT 재사용, 이원화 금지).
 * 퍼스널컬러 업계 표준 영문 명칭(라이트/트루/브라이트/뮤티드/딥) 기반 신규 번역.
 */
const TONE: Record<Exclude<Locale, 'ko'>, Record<string, string>> = {
  en: {
    'light-spring': 'Light Spring',
    'true-spring': 'True Spring',
    'bright-spring': 'Bright Spring',
    'light-summer': 'Light Summer',
    'true-summer': 'True Summer',
    'muted-summer': 'Muted Summer',
    'muted-autumn': 'Muted Autumn',
    'true-autumn': 'True Autumn',
    'deep-autumn': 'Deep Autumn',
    'deep-winter': 'Deep Winter',
    'true-winter': 'True Winter',
    'bright-winter': 'Bright Winter',
  },
  ja: {
    'light-spring': 'ライトスプリング',
    'true-spring': 'トゥルースプリング',
    'bright-spring': 'ブライトスプリング',
    'light-summer': 'ライトサマー',
    'true-summer': 'トゥルーサマー',
    'muted-summer': 'ミュートサマー',
    'muted-autumn': 'ミュートオータム',
    'true-autumn': 'トゥルーオータム',
    'deep-autumn': 'ディープオータム',
    'deep-winter': 'ディープウィンター',
    'true-winter': 'トゥルーウィンター',
    'bright-winter': 'ブライトウィンター',
  },
  zh: {
    'light-spring': '浅春型',
    'true-spring': '暖春型',
    'bright-spring': '亮春型',
    'light-summer': '浅夏型',
    'true-summer': '冷夏型',
    'muted-summer': '柔夏型',
    'muted-autumn': '柔秋型',
    'true-autumn': '暖秋型',
    'deep-autumn': '深秋型',
    'deep-winter': '深冬型',
    'true-winter': '冷冬型',
    'bright-winter': '亮冬型',
  },
};

/** 골격 라벨(스트레이트/웨이브/내추럴) → 짧은 풀이 병기 (초보자용, ko 전용 — 프롬프트 입력 컨텍스트) */
const BODY_DESC_KO: Record<string, string> = {
  스트레이트: '직선이 깔끔한 스트레이트',
  웨이브: '곡선이 부드러운 웨이브',
  내추럴: '골격감이 자연스러운 내추럴',
};

/** 메이크업 피니시 원시값 → 한국어 (기존 curation/베이스 카드 표기와 동일, ko 전용) */
const FINISH_KO: Record<string, string> = {
  dewy: '듀이',
  satin: '사틴',
  matte: '매트',
  'semi-matte': '세미매트',
};

/** 베이스 커버력 원시값 → 한국어 (ko 전용) */
const COVERAGE_KO: Record<string, string> = {
  light: '라이트',
  medium: '미디엄',
  full: '풀',
};

/** ko 전용 매핑 (locale 파라미터 없는 헬퍼용). 매칭 실패 시 원본 반환. */
function mapKo(map: Record<string, string>, raw: string | null | undefined): string {
  if (!raw) return '';
  return map[raw.toLowerCase()] ?? raw;
}

/** locale별 매핑 (locale 미지정/미지원 시 ko 폴백). 매칭 실패 시 원본 반환. */
function mapLocalized(
  byLocale: Record<Locale, Record<string, string>>,
  raw: string | null | undefined,
  locale: Locale
): string {
  if (!raw) return '';
  const map = byLocale[locale] ?? byLocale.ko;
  return map[raw.toLowerCase()] ?? raw;
}

/** "가을 웜톤" (season 원시값 → 라벨). 매칭 실패 시 원본 반환. */
export function seasonKo(raw: string | null | undefined, locale: Locale = 'ko'): string {
  return mapLocalized(SEASON, raw, locale);
}

/** "가을" (계절만 짧게, ko 전용). */
export function seasonShortKo(raw: string | null | undefined): string {
  return mapKo(SEASON_SHORT_KO, raw);
}

/** "웜톤" (undertone/tone 원시값 → 라벨). */
export function undertoneKo(raw: string | null | undefined, locale: Locale = 'ko'): string {
  return mapLocalized(UNDERTONE, raw, locale);
}

/** "복합성" (skin_type 원시값 → 라벨). */
export function skinTypeKo(raw: string | null | undefined, locale: Locale = 'ko'): string {
  return mapLocalized(SKIN_TYPE, raw, locale);
}

/** "계란형" (face_shape 원시값 → 라벨). */
export function faceShapeKo(raw: string | null | undefined, locale: Locale = 'ko'): string {
  return mapLocalized(FACE_SHAPE, raw, locale);
}

/** "곡선이 부드러운 웨이브" (골격 한국어 라벨 → 풀이 병기, ko 전용). 이미 풀이가 없으면 원본. */
export function bodyDescKo(label: string | null | undefined): string {
  if (!label) return '';
  return BODY_DESC_KO[label] ?? label;
}

/**
 * "트루 스프링" (12톤 원시값 true-spring 등 → 라벨). PC 결과 페이지와 동일 정본 표기.
 * ko는 TWELVE_TONE_LABELS(SSOT) 재사용, 비ko는 TONE 테이블 → 미지원 시 ko SSOT 폴백. 매칭 실패 시 원본.
 */
export function toneKo(raw: string | null | undefined, locale: Locale = 'ko'): string {
  if (!raw) return '';
  const key = raw.toLowerCase();
  // TWELVE_TONE_LABELS는 Record<TwelveTone,string> — 임의 문자열 key 조회를 위해 폭넓은 타입으로 조회.
  const koLabel = (TWELVE_TONE_LABELS as Record<string, string>)[key];
  if (locale === 'ko') return koLabel ?? raw;
  return TONE[locale]?.[key] ?? koLabel ?? raw;
}

/** "세미매트" (메이크업 피니시 원시값 → 한국어, ko 전용). */
export function finishKo(raw: string | null | undefined): string {
  return mapKo(FINISH_KO, raw);
}

/** "미디엄" (베이스 커버력 원시값 → 한국어, ko 전용). */
export function coverageKo(raw: string | null | undefined): string {
  return mapKo(COVERAGE_KO, raw);
}
