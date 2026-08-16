/**
 * HEX 색상값 → 한국어 색상명 변환 (HSL 기반)
 *
 * 웹 `apps/web/lib/utils/color-names.ts`의 모바일 포팅 (2026-08 드레이핑 패리티).
 * 사용자에게 "#FF9A8B" 같은 기계값을 노출하지 않기 위한 표시용 유틸리티.
 * 웹과 동일한 경계값을 쓰므로 같은 hex는 웹·앱에서 같은 이름이 된다.
 */

import { classifyByRange } from './conditional-helpers';

export function getKoreanColorName(hex: string): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized.slice(0, 6);

  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) / 255;

  // 무채색 판정 (채도가 거의 없으면 명도만으로 이름 결정)
  if (s < 0.1) {
    if (l > 0.9) return '화이트';
    if (l > 0.7) return '라이트 그레이';
    if (l > 0.3) return '그레이';
    return '차콜';
  }

  // 색상(Hue) 계산
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }

  // 명도에 따른 접두사
  const prefix =
    classifyByRange(
      l,
      [
        { max: 0.35, result: '딥 ' },
        { max: 0.75, result: '' },
      ],
      '라이트 '
    ) ?? '';

  if (h < 15 || h >= 345) return `${prefix}레드`;
  if (h < 30) return `${prefix}코랄`;
  if (h < 45) return `${prefix}오렌지`;
  if (h < 60) return `${prefix}골드`;
  if (h < 75) return `${prefix}옐로`;
  if (h < 150) return `${prefix}그린`;
  if (h < 195) return `${prefix}민트`;
  if (h < 240) return `${prefix}블루`;
  if (h < 270) return `${prefix}퍼플`;
  if (h < 300) return `${prefix}바이올렛`;
  if (h < 330) return `${prefix}핑크`;
  return `${prefix}로즈`;
}
