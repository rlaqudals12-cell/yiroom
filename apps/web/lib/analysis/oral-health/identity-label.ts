/**
 * OH-1 구강건강 Identity Label 생성
 *
 * brightness + gumHealthStatus를 조합한 복합 라벨
 * @see docs/adr/ADR-080-identity-first-result-framing.md
 */

import type { GumHealthStatus } from '@/types/oral-health';

/** 밝기 수준 */
type Brightness = 'very_bright' | 'bright' | 'medium' | 'dark' | 'very_dark';

// 밝기별 수식어
const BRIGHTNESS_DESCRIPTORS: Record<Brightness, string> = {
  very_bright: '환한',
  bright: '밝은',
  medium: '내추럴',
  dark: '미백 관심',
  very_dark: '미백 집중',
};

// 잇몸 상태별 수식어 (healthy일 때는 밝기 기반, 그 외는 잇몸 기반)
const GUM_DESCRIPTORS: Record<Exclude<GumHealthStatus, 'healthy'>, string> = {
  mild_gingivitis: '잇몸 케어',
  moderate_gingivitis: '잇몸 집중 케어',
  severe_inflammation: '전문 케어 필요',
};

/**
 * OH-1 구강건강 정체성 라벨 생성
 *
 * @example
 * generateOralHealthIdentityLabel('bright', 'healthy')
 * // → "건강 밝은 미소 타입"
 *
 * generateOralHealthIdentityLabel('medium', 'mild_gingivitis')
 * // → "잇몸 케어 미소 타입"
 *
 * generateOralHealthIdentityLabel(undefined, undefined)
 * // → "미소 타입" (데이터 부족 시 기본값)
 */
export function generateOralHealthIdentityLabel(
  brightness?: string,
  gumHealthStatus?: GumHealthStatus
): string {
  // 잇몸 상태가 healthy가 아니면 잇몸 기반 라벨 우선
  if (gumHealthStatus && gumHealthStatus !== 'healthy') {
    const gumDescriptor = GUM_DESCRIPTORS[gumHealthStatus] ?? '케어';
    return `${gumDescriptor} 미소 타입`;
  }

  // healthy이거나 없으면 밝기 기반 라벨
  if (brightness && brightness in BRIGHTNESS_DESCRIPTORS) {
    const brightnessDescriptor = BRIGHTNESS_DESCRIPTORS[brightness as Brightness];
    // healthy + bright/very_bright → "건강 밝은"
    if (
      gumHealthStatus === 'healthy' &&
      (brightness === 'bright' || brightness === 'very_bright')
    ) {
      return `건강 ${brightnessDescriptor} 미소 타입`;
    }
    return `${brightnessDescriptor} 미소 타입`;
  }

  // 데이터 부족 시 기본값
  return '미소 타입';
}
