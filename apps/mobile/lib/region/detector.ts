/**
 * 지역 감지 유틸리티
 * - 브라우저 locale 기반 자동 감지
 * - 사용자 설정 저장/복원
 */

import type { SupportedRegion } from './config';
import { REGION_CONFIG } from './config';

const REGION_STORAGE_KEY = 'yiroom_user_region';

/**
 * 사용자 지역 감지
 * 1. localStorage 저장값 확인
 * 2. 브라우저 locale 기반 추론
 * 3. 기본값 반환
 */
export function detectRegion(): SupportedRegion {
  // 1. 저장된 설정 확인
  if (typeof window !== 'undefined') {
    const savedRegion = localStorage.getItem(REGION_STORAGE_KEY);
    if (savedRegion && savedRegion in REGION_CONFIG) {
      return savedRegion as SupportedRegion;
    }
  }

  // 2. 브라우저 locale 기반
  if (typeof navigator !== 'undefined') {
    const locale = navigator.language || (navigator.languages && navigator.languages[0]);
    if (locale) {
      const region = localeToRegion(locale);
      if (region) return region;
    }
  }

  // 3. 기본값
  return 'KR';
}

/**
 * locale 문자열을 지역 코드로 변환
 */
function localeToRegion(locale: string): SupportedRegion | null {
  const lowered = locale.toLowerCase();

  // 언어-지역 형식 (ko-KR, en-US)
  if (lowered.startsWith('ko')) return 'KR';
  if (lowered.startsWith('ja')) return 'JP';
  if (lowered.startsWith('zh')) return 'CN';
  if (lowered === 'en-us') return 'US';
  if (lowered.startsWith('en-gb') || lowered.startsWith('en-eu')) return 'EU';

  // 동남아 언어들
  if (
    lowered.startsWith('th') ||
    lowered.startsWith('vi') ||
    lowered.startsWith('id') ||
    lowered.startsWith('ms')
  ) {
    return 'SEA';
  }

  // 유럽 언어들
  if (
    lowered.startsWith('de') ||
    lowered.startsWith('fr') ||
    lowered.startsWith('es') ||
    lowered.startsWith('it')
  ) {
    return 'EU';
  }

  // 영어권은 미국으로
  if (lowered.startsWith('en')) return 'US';

  return null;
}

/**
 * 사용자 지역 설정 저장
 */
export function saveRegion(region: SupportedRegion): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REGION_STORAGE_KEY, region);
  }
}

/**
 * 저장된 지역 설정 제거
 */
export function clearSavedRegion(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(REGION_STORAGE_KEY);
  }
}

/**
 * 사용자가 지역을 직접 선택했는지 확인
 */
export function hasUserSelectedRegion(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REGION_STORAGE_KEY) !== null;
}
