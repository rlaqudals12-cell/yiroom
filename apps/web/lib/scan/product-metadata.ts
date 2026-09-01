/**
 * OCR 제품명에서 스캔 판정에 전달할 색 메타데이터를 보수적으로 고른다.
 * OCR 응답에 실제로 적힌 값만 보존하며 이름을 HEX로 변환하지 않는다.
 */

const COLOR_NAME_KEYWORDS = [
  'coral',
  'peach',
  'orange',
  'gold',
  'bronze',
  'warm',
  'pink',
  'berry',
  'mauve',
  'plum',
  'rose',
  'cool',
  '코랄',
  '피치',
  '복숭아',
  '오렌지',
  '주황',
  '골드',
  '금색',
  '브론즈',
  '웜',
  '살구',
  '테라코타',
  '핑크',
  '베리',
  '모브',
  '플럼',
  '자두',
  '로즈',
  '쿨',
  '라벤더',
] as const;

const EXACT_HEX_PATTERN = /#[0-9a-fA-F]{6}(?![0-9a-fA-F])/;
const SHORT_HEX_PATTERN = /#[0-9a-fA-F]{3}(?![0-9a-fA-F])/;

/** 제품명에 실제 표기된 정확한 HEX 또는 한·영 색 이름만 반환한다. */
export function detectScannedProductColor(productName?: string): string | undefined {
  if (!productName) return undefined;

  const exactHex = productName.match(EXACT_HEX_PATTERN)?.[0];
  if (exactHex) return exactHex.toUpperCase();
  if (SHORT_HEX_PATTERN.test(productName)) return undefined;

  const lowerName = productName.toLowerCase();
  return COLOR_NAME_KEYWORDS.find((keyword) => lowerName.includes(keyword.toLowerCase()));
}
