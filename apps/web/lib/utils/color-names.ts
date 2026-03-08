import { classifyByRange } from './conditional-helpers';

/**
 * HEX 색상값 → 한국어 색상명 변환 (HSL 기반)
 * DrapeSimulator에서 추출한 공유 유틸리티
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
export function getKoreanColorName(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)) / 255;

  // 무채색 판정
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

  // 채도+명도에 따른 접두사
  const prefix = classifyByRange(
    l,
    [
      { max: 0.35, result: '딥 ' },
      { max: 0.75, result: '' },
    ],
    '라이트 '
  )!;

  // 색상명 매핑
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
