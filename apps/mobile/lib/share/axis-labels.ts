/**
 * 5축 원시값 해석 계약 — raw/enum → ko 라벨 공용 헬퍼 (E+ 공유카드·통합 결과 요약 공용)
 *
 * @module lib/share/axis-labels
 * @description
 *   card-data.ts(E+ 공유카드)의 비공개 헬퍼를 공용화한 모듈. 통합 결과의 축 데이터는
 *   두 형태로 들어온다 (적대 리뷰 2026-07-23에서 확인):
 *   ① 분석 직후 POST payload — camelCase(tone/season 소문자/skinType…)
 *   ② 재방문 Supabase raw row(useIntegratedSession 무변환 캐스팅) —
 *      tone은 image_analysis.tone JSONB, season은 DB CHECK로 'Summer' 대문자,
 *      필드는 skin_type 등 snake_case.
 *   pick/nestedTone이 양형태를 해석하고, toKoLabel이 영문 enum을 ko 라벨로 바꾼다.
 *
 *   계약(웹 labels.ts SSOT 미러): 미지 영문값은 null(원시 영문 화면 노출 금지 —
 *   지어내지 않음), 비ASCII 값은 이미 로케일된 표시값으로 간주해 통과.
 */

import type { AxisData } from '@/lib/api';

// 영문 enum → ko 라벨 (정본 = 웹 labels.ts SKIN_TYPE/FACE_SHAPE/UNDERTONE·body/mapper.ts BODY_SHAPE_LABELS)
export const SKIN_TYPE_KO: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  sensitive: '민감성',
};

export const BODY_TYPE_KO: Record<string, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
  hourglass: '모래시계형',
  pear: '배형',
  invertedTriangle: '역삼각형',
  apple: '사과형',
  rectangle: '직사각형',
  trapezoid: '사다리꼴형',
};

export const FACE_SHAPE_KO: Record<string, string> = {
  oval: '계란형',
  round: '둥근형',
  square: '각진형',
  heart: '하트형',
  oblong: '긴 얼굴형',
  diamond: '다이아몬드형',
};

export const UNDERTONE_KO: Record<string, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

/** 비어있지 않은 문자열 값만 (placeholder '-' 제외) */
export function cleanValue(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  return v.length > 0 && v !== '-' ? v : null;
}

/** camelCase(POST payload) 우선, snake_case(raw row) 폴백 */
export function pick(d: AxisData | null, camel: string, snake: string): string | null {
  return cleanValue(d?.[camel]) ?? cleanValue(d?.[snake]);
}

/** raw row의 image_analysis JSONB에서 12톤 추출 (웹 page.tsx extractNested 미러) */
export function nestedTone(d: AxisData | null): string | null {
  const ia = d?.image_analysis;
  if (typeof ia === 'object' && ia !== null) {
    return cleanValue((ia as Record<string, unknown>).tone);
  }
  return null;
}

/**
 * enum 값 → ko 라벨. 매핑이 없으면: 이미 한글이면 그대로, 영문이면 null(원시 영문 금지 — 지어내지 않음).
 */
export function toKoLabel(raw: string | null, map: Record<string, string>): string | null {
  if (!raw) return null;
  if (map[raw]) return map[raw];
  // 한글 등 비ASCII 값은 이미 로케일된 표시값으로 간주
  return /[^\x00-\x7F]/.test(raw) ? raw : null;
}
