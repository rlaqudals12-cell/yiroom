/**
 * 통합 결과 5축 요약 — 저장 원시값(raw/enum)을 사용자 대면 ko 문구로
 *
 * @module lib/integrated/axis-summary
 * @description
 *   결과 페이지 "내 정체성 5축" 요약 카드용. 기존 페이지 로컬 함수들이 저장 원시값
 *   ('muted-summer'·'cool'·'combination'·'S'·'oval')을 그대로 노출하던 결함 수리
 *   (적대 리뷰 2026-07-23). 해석 계약은 E+ 카드와 동일한 lib/share/axis-labels 재사용:
 *   payload(camelCase)·raw row(snake_case/image_analysis.tone/대문자 season) 양형태 해석,
 *   미해석 영문값은 '-'가 아니라 해당 부분 생략(원시 영문 노출 금지 — 지어내지 않음).
 */

import { toneHeroLabelKo } from '@yiroom/shared';

import type { AxisData } from '@/lib/api';
import {
  SKIN_TYPE_KO,
  BODY_TYPE_KO,
  FACE_SHAPE_KO,
  UNDERTONE_KO,
  pick,
  nestedTone,
  toKoLabel,
} from '@/lib/share/axis-labels';

/** 실패 축 표기 */
const NOT_ANALYZED = '분석 미완료';
/** 성공 축인데 저장값을 하나도 해석 못 한 경우 — 원시 영문 대신 정직한 일반 문구 */
const ANALYZED_NO_DETAIL = '분석 완료';

/** 숫자 방어 — number 또는 숫자 문자열만 정수 점수로 (그 외 null) */
function toScore(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** 퍼스널컬러: "뮤티드 서머 / 쿨톤" — 12톤 우선, 없으면 4계절(대문자 season 소문자화) 폴백 */
export function pcSummary(data: AxisData | null): string {
  if (!data) return NOT_ANALYZED;
  const tone = pick(data, 'tone', 'tone') ?? nestedTone(data);
  const season = pick(data, 'season', 'season')?.toLowerCase() ?? null;
  const toneLabel = toneHeroLabelKo(tone, season);
  // 웹 undertoneKo와 동일하게 대소문자 무시 (DB에 'Warm' 변형 존재)
  const undertoneRaw = pick(data, 'undertone', 'undertone');
  const undertoneLabel = toKoLabel(undertoneRaw?.toLowerCase() ?? null, UNDERTONE_KO);
  const parts = [toneLabel, undertoneLabel].filter((p): p is string => p !== null);
  return parts.length > 0 ? parts.join(' / ') : ANALYZED_NO_DETAIL;
}

/** 피부: "복합성 · 82점" — 미해석 타입/점수는 해당 부분 생략 */
export function skinSummary(data: AxisData | null): string {
  if (!data) return NOT_ANALYZED;
  const type = toKoLabel(pick(data, 'skinType', 'skin_type'), SKIN_TYPE_KO);
  const score = toScore(data.overallScore ?? data.overall_score);
  const parts: string[] = [];
  if (type) parts.push(type);
  if (score !== null) parts.push(`${score}점`);
  return parts.length > 0 ? parts.join(' · ') : ANALYZED_NO_DETAIL;
}

/** 체형: "스트레이트" (S/W/N·7형 enum → ko) */
export function bodySummary(data: AxisData | null): string {
  if (!data) return NOT_ANALYZED;
  return toKoLabel(pick(data, 'bodyType', 'body_type'), BODY_TYPE_KO) ?? ANALYZED_NO_DETAIL;
}

/** 헤어: "계란형" — 맵 값에 이미 '형' 포함(기존 `${...}형` 이중 접미 제거) */
export function hairSummary(data: AxisData | null): string {
  if (!data) return NOT_ANALYZED;
  return toKoLabel(pick(data, 'faceShape', 'face_shape'), FACE_SHAPE_KO) ?? ANALYZED_NO_DETAIL;
}

/** 메이크업: 자유 텍스트 추천이라 맵 불요 — 양형태 키만 해석 */
export function makeupSummary(data: AxisData | null): string {
  if (!data) return NOT_ANALYZED;
  const rec = pick(data, 'baseRecommendation', 'base_recommendation');
  return (rec ?? '추천 있음').slice(0, 28);
}
