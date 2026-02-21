/**
 * Gemini 모듈 유틸리티 함수
 */
import type { PersonalColorSeason } from '@yiroom/shared';

import type { TrafficLight } from './types';

/**
 * 4계절 대표 색상 팔레트
 */
export function getSeasonColors(season: PersonalColorSeason): string[] {
  const colorMap: Record<PersonalColorSeason, string[]> = {
    Spring: ['#FFB6C1', '#FFDAB9', '#FFA07A', '#F0E68C', '#98FB98'],
    Summer: ['#E6E6FA', '#DDA0DD', '#B0C4DE', '#F0FFFF', '#FFC0CB'],
    Autumn: ['#8B4513', '#DAA520', '#BC8F8F', '#CD853F', '#556B2F'],
    Winter: ['#000000', '#FFFFFF', '#4169E1', '#DC143C', '#800080'],
  };
  return colorMap[season];
}

/**
 * 스톱라이트 값 검증
 */
export function validateTrafficLight(value: string): TrafficLight {
  if (value === 'green' || value === 'yellow' || value === 'red') {
    return value;
  }
  return 'yellow';
}

/**
 * 신뢰도 기반 피드백 메시지 생성
 */
export function getConfidenceFeedback(confidence: number): {
  level: 'high' | 'medium' | 'low';
  message: string;
  color: string;
} {
  if (confidence >= 0.85) {
    return {
      level: 'high',
      message: '높은 정확도로 인식됨',
      color: '#22c55e',
    };
  } else if (confidence >= 0.65) {
    return {
      level: 'medium',
      message: '확인이 필요할 수 있어요',
      color: '#eab308',
    };
  } else {
    return {
      level: 'low',
      message: '정확도가 낮아요. 수정해주세요',
      color: '#ef4444',
    };
  }
}
