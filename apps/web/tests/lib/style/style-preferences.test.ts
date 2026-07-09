/**
 * lib/style/style-preferences 순수 로직 테스트
 * - 신체정보 배너 분기 / 맞춤 아이템 빈 상태 분기 / 선호 스타일 옵션
 */

import { describe, it, expect } from 'vitest';
import {
  STYLE_PREFERENCE_OPTIONS,
  shouldShowMeasurementBanner,
  getMatchedItemsEmptyState,
} from '@/lib/style';

describe('STYLE_PREFERENCE_OPTIONS', () => {
  it('5~7종의 선호 스타일 옵션을 제공한다', () => {
    expect(STYLE_PREFERENCE_OPTIONS.length).toBeGreaterThanOrEqual(5);
    expect(STYLE_PREFERENCE_OPTIONS.length).toBeLessThanOrEqual(7);
  });

  it('각 옵션은 영문 value와 한글 label을 가진다', () => {
    for (const opt of STYLE_PREFERENCE_OPTIONS) {
      expect(opt.value).toMatch(/^[a-z]+$/);
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });
});

describe('shouldShowMeasurementBanner', () => {
  it('확인 중(null)이면 배너를 숨긴다', () => {
    expect(shouldShowMeasurementBanner(null, null)).toBe(false);
  });

  it('측정값 API가 있음(true)이면 배너를 숨긴다', () => {
    expect(shouldShowMeasurementBanner(true, null)).toBe(false);
  });

  it('체형 분석에 키가 있으면 재사용하고 배너를 숨긴다 (중복 입력 방지)', () => {
    expect(shouldShowMeasurementBanner(false, 170)).toBe(false);
  });

  it('어떤 소스에도 키가 없을 때만 배너를 표시한다', () => {
    expect(shouldShowMeasurementBanner(false, null)).toBe(true);
    expect(shouldShowMeasurementBanner(false, 0)).toBe(true);
  });
});

describe('getMatchedItemsEmptyState', () => {
  it('분석 전에는 체형 분석으로 유도한다', () => {
    const state = getMatchedItemsEmptyState(false, false);
    expect(state.ctaHref).toBe('/analysis/body');
    expect(state.message).not.toContain('준비하고');
  });

  it('분석 후 옷장이 있으면 옷장 코디로 안내한다 (가짜 로딩 문구 없음)', () => {
    const state = getMatchedItemsEmptyState(true, true);
    expect(state.ctaHref).toBe('/closet/recommend');
    // "준비하고 있어요" 같은 가짜 로딩 암시 금지
    expect(state.message).not.toContain('준비하고 있어요');
  });

  it('분석 후 옷장이 비어있으면 옷장 등록으로 안내한다', () => {
    const state = getMatchedItemsEmptyState(true, false);
    expect(state.ctaHref).toBe('/closet/add/batch');
  });
});
