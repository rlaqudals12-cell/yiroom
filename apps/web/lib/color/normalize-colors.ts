/**
 * 퍼스널컬러 팔레트의 저장 형상을 UI 공통 형상으로 정규화한다.
 *
 * 왜: 단독 분석은 `{ hex, name }[]`, 통합 분석은 `string[]`을 저장하므로
 * 소비처가 한쪽 형상만 단언하면 사용자의 실제 베스트 컬러가 조용히 사라진다.
 */

export interface NormalizedColor {
  hex: string;
  name: string;
}

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function normalizeColor(item: unknown): NormalizedColor | null {
  let hex: string | null = null;
  let name = '';

  if (typeof item === 'string') {
    hex = item.trim();
  } else if (typeof item === 'object' && item !== null) {
    const color = item as { hex?: unknown; color?: unknown; name?: unknown };
    if (typeof color.hex === 'string') hex = color.hex.trim();
    else if (typeof color.color === 'string') hex = color.color.trim();
    if (typeof color.name === 'string') name = color.name.trim();
  }

  if (!hex || !HEX_PATTERN.test(hex)) return null;
  return { hex, name };
}

export function normalizeColors(raw: unknown, max = Number.POSITIVE_INFINITY): NormalizedColor[] {
  if (!Array.isArray(raw) || max <= 0) return [];

  return raw
    .map(normalizeColor)
    .filter((color): color is NormalizedColor => color !== null)
    .slice(0, max);
}
