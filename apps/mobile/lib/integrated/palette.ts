/**
 * 통합분석 퍼스널컬러 축 → 개인화 팔레트 추출
 *
 * 왜: 서버(웹 정본)는 PersonalColorAxisData.palette(hex 배열)를 내려주지만
 * 기존 모바일 결과 화면은 이를 렌더하지 않고 버렸다 (4계절 하드코딩 팔레트만 표시).
 * "나만의 컬러 팔레트" 리스팅 클레임을 분석 직후 화면에서 충족시키기 위한 배선 유틸.
 *
 * @see apps/web/lib/analysis/integrated/types.ts PersonalColorAxisData.palette
 * @see docs/PLAY-STORE-LISTING-DRAFT.md 심층 감사 2차
 */

import type { AxisResult, AxisData } from '@/lib/api';

/** #RGB / #RRGGBB / #RRGGBBAA 형식만 통과 (서버 값 방어적 검증) */
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * 퍼스널컬러 축 결과에서 개인화 팔레트 hex 배열을 추출한다.
 * 축 실패·palette 부재·비정상 값이면 빈 배열 (화면은 렌더 생략).
 */
export function extractPalette(pc: AxisResult<AxisData>): string[] {
  if (!pc.success) return [];
  const raw = pc.data.palette;
  if (!Array.isArray(raw)) return [];
  return raw.filter((c): c is string => typeof c === 'string' && HEX_COLOR_PATTERN.test(c));
}
