/**
 * C-2 + C-3: VITA 셰이드→fill 색상 + 잇몸 건강→색상 매핑
 *
 * @description 치아/잇몸 시각화용 색상 변환 유틸리티
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.6
 */

import type { VitaShade, GumHealthStatus } from '@/types/oral-health';

// VITA Classical 16색 + Bleached 3색 → hex 매핑
const VITA_SHADE_HEX: Record<VitaShade, string> = {
  // Bleached (매우 밝은 미백)
  '0M1': '#F5F0E8',
  '0M2': '#F0EBE0',
  '0M3': '#EBE5D8',
  // B 계열 (적황색 - 가장 밝은 순)
  B1: '#E8DFC8',
  B2: '#DED4B8',
  B3: '#CFC4A4',
  B4: '#BFB494',
  // A 계열 (적갈색)
  A1: '#E4D8C0',
  A2: '#D8CCB0',
  A3: '#C8BCA0',
  'A3.5': '#BEB294',
  A4: '#B0A488',
  // C 계열 (회색)
  C1: '#D8D0C0',
  C2: '#CCC4B4',
  C3: '#BCB4A4',
  C4: '#ACA498',
  // D 계열 (적회색)
  D2: '#D4C8B4',
  D3: '#C0B4A0',
  D4: '#B8AC98',
};

// 잇몸 건강 상태별 색상
const GUM_STATUS_COLORS: Record<GumHealthStatus, { fill: string; label: string }> = {
  healthy: { fill: '#F5A0B3', label: '건강' },
  mild_gingivitis: { fill: '#E88A9F', label: '경미한 염증' },
  moderate_gingivitis: { fill: '#D4667D', label: '중등도 염증' },
  severe_inflammation: { fill: '#C0445C', label: '심한 염증' },
};

/**
 * VITA 셰이드를 fill 색상으로 변환
 */
export function getToothFillColor(shade: VitaShade): {
  toothFill: string;
  shadeName: string;
  brightness: 'very_bright' | 'bright' | 'medium' | 'dark';
} {
  const toothFill = VITA_SHADE_HEX[shade] ?? '#D8CCB0';

  // 밝기 분류 (셰이드명 기반 간이 분류)
  const isBleached = shade.startsWith('0M');
  const isB1OrA1 = shade === 'B1' || shade === 'A1';
  const isDark = ['A4', 'C4', 'D4', 'B4', 'C3', 'D3'].includes(shade);

  let brightness: 'very_bright' | 'bright' | 'medium' | 'dark';
  if (isBleached) brightness = 'very_bright';
  else if (isB1OrA1) brightness = 'bright';
  else if (isDark) brightness = 'dark';
  else brightness = 'medium';

  return { toothFill, shadeName: shade, brightness };
}

/**
 * 잇몸 건강 상태를 fill 색상으로 변환
 */
export function getGumFillColor(status: GumHealthStatus): {
  gumFill: string;
  statusLabel: string;
} {
  const color = GUM_STATUS_COLORS[status] ?? GUM_STATUS_COLORS.healthy;
  return { gumFill: color.fill, statusLabel: color.label };
}

/**
 * 미백 목표 프로그레스 (현재→목표 비율)
 */
export function getWhiteningProgress(currentShade: VitaShade, targetShade: VitaShade): number {
  // 밝기 순서 기반 진행도 계산 (간이)
  const order: VitaShade[] = [
    '0M1',
    '0M2',
    '0M3',
    'B1',
    'A1',
    'B2',
    'D2',
    'A2',
    'C1',
    'C2',
    'D4',
    'A3',
    'D3',
    'B3',
    'A3.5',
    'B4',
    'C3',
    'A4',
    'C4',
  ];
  const currentIdx = order.indexOf(currentShade);
  const targetIdx = order.indexOf(targetShade);

  if (currentIdx === -1 || targetIdx === -1) return 0;
  if (currentIdx <= targetIdx) return 100; // 이미 목표 도달

  const total = currentIdx - targetIdx;
  return Math.round(((currentIdx - targetIdx) / Math.max(total, 1)) * 100);
}

export { VITA_SHADE_HEX, GUM_STATUS_COLORS };
