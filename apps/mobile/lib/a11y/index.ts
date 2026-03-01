/**
 * 접근성 (a11y) 유틸리티
 *
 * @module lib/a11y
 * @description 스크린 리더, 컬러 대비, 접근성 라벨, 신뢰도 유틸
 */

import { AccessibilityInfo, AccessibilityRole, Platform } from 'react-native';

// ---- 도메인 유틸리티 re-export ----

export {
  announceAnalysisComplete,
  announceAnalysisProgress,
  announceError,
  announceAchievement,
  announceGoalComplete,
  announceDataLoaded,
} from './screen-reader-utils';

export {
  getConfidenceLevel,
  getConfidenceLevelInfo,
  getConfidenceColorKey,
  getConfidenceA11yLabel,
} from './confidence-utils';
export type { ConfidenceLevel, ConfidenceLevelInfo } from './confidence-utils';

// 대비율 검증은 lib/theme/contrast에서 정식 export
// 하위호환: 기존 import 경로 유지
export {
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  getRelativeLuminance,
} from '../theme/contrast';

// ---- 접근성 속성 생성 ----

interface A11yProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

/**
 * 버튼 접근성 속성
 */
export function buttonA11y(label: string, hint?: string, disabled?: boolean): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'button',
    accessibilityState: { disabled },
  };
}

/**
 * 링크 접근성 속성
 */
export function linkA11y(label: string, hint?: string): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint || '탭하여 이동',
    accessibilityRole: 'link',
  };
}

/**
 * 이미지 접근성 속성
 */
export function imageA11y(description: string): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: description,
    accessibilityRole: 'image',
  };
}

/**
 * 헤더 접근성 속성
 */
export function headerA11y(text: string): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: text,
    accessibilityRole: 'header',
  };
}

/**
 * 체크박스 접근성 속성
 */
export function checkboxA11y(label: string, checked: boolean, hint?: string): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint || (checked ? '선택됨, 탭하여 해제' : '선택 안됨, 탭하여 선택'),
    accessibilityRole: 'checkbox',
    accessibilityState: { checked },
  };
}

/**
 * 스위치 접근성 속성
 */
export function switchA11y(label: string, checked: boolean, hint?: string): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint || (checked ? '켜짐, 탭하여 끄기' : '꺼짐, 탭하여 켜기'),
    accessibilityRole: 'switch',
    accessibilityState: { checked },
  };
}

/**
 * 슬라이더 접근성 속성
 */
export function sliderA11y(
  label: string,
  value: number,
  min: number,
  max: number,
  unit?: string
): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'adjustable',
    accessibilityValue: {
      min,
      max,
      now: value,
      text: unit ? `${value}${unit}` : `${value}`,
    },
  };
}

/**
 * 프로그레스 접근성 속성
 */
export function progressA11y(label: string, value: number, max: number = 100): A11yProps {
  const percentage = Math.round((value / max) * 100);
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${percentage}% 완료`,
    accessibilityRole: 'progressbar',
    accessibilityValue: {
      min: 0,
      max,
      now: value,
      text: `${percentage}%`,
    },
  };
}

/**
 * 탭 접근성 속성
 */
export function tabA11y(label: string, selected: boolean, index: number, total: number): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${index + 1}/${total} 탭`,
    accessibilityHint: selected ? '현재 선택됨' : '탭하여 선택',
    accessibilityRole: 'tab',
    accessibilityState: { selected },
  };
}

/**
 * 리스트 아이템 접근성 속성
 */
export function listItemA11y(
  label: string,
  index: number,
  total: number,
  hint?: string
): A11yProps {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${index + 1}/${total}`,
    accessibilityHint: hint,
    accessibilityRole: 'none',
  };
}

// ---- 접근성 상태 확인 ----

/**
 * 스크린 리더 활성화 여부
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  return AccessibilityInfo.isScreenReaderEnabled();
}

/**
 * 모션 감소 설정 여부
 */
export async function isReduceMotionEnabled(): Promise<boolean> {
  return AccessibilityInfo.isReduceMotionEnabled();
}

/**
 * 굵은 텍스트 설정 여부 (iOS)
 */
export async function isBoldTextEnabled(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AccessibilityInfo.isBoldTextEnabled();
}

/**
 * 접근성 설정 리스너
 */
export function addScreenReaderListener(callback: (enabled: boolean) => void): () => void {
  const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', callback);
  return () => subscription.remove();
}

// ---- 접근성 포커스 ----

/**
 * 요소로 포커스 이동 (스크린 리더)
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}

/**
 * 스크린 리더 포커스 이동
 */
export function setAccessibilityFocus(reactTag: number): void {
  AccessibilityInfo.setAccessibilityFocus(reactTag);
}
