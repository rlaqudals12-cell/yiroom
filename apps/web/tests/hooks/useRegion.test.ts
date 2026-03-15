import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockDetectRegion, mockSaveRegion, mockClearSavedRegion, mockHasUserSelectedRegion } =
  vi.hoisted(() => ({
    mockDetectRegion: vi.fn(),
    mockSaveRegion: vi.fn(),
    mockClearSavedRegion: vi.fn(),
    mockHasUserSelectedRegion: vi.fn(),
  }));

vi.mock('@/lib/region', () => ({
  detectRegion: () => mockDetectRegion(),
  saveRegion: (r: string) => mockSaveRegion(r),
  clearSavedRegion: () => mockClearSavedRegion(),
  hasUserSelectedRegion: () => mockHasUserSelectedRegion(),
  getRegionInfo: (r: string) => ({
    code: r,
    name: r === 'KR' ? '한국' : 'Unknown',
    currency: 'KRW',
  }),
  getAffiliateRegions: () => ['KR', 'US'],
  SUPPORTED_REGIONS: ['KR', 'US', 'JP'],
}));

vi.mock('@/lib/affiliate/global-links', () => ({
  createRegionalDeeplinks: vi.fn().mockReturnValue([]),
  getRegionalPartners: vi.fn().mockReturnValue([]),
}));

import { useRegion } from '@/hooks/useRegion';

describe('useRegion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetectRegion.mockReturnValue('KR');
    mockHasUserSelectedRegion.mockReturnValue(false);
  });

  it('기본 지역이 KR이다', () => {
    const { result } = renderHook(() => useRegion());
    expect(result.current.region).toBe('KR');
  });

  it('supportedRegions가 반환된다', () => {
    const { result } = renderHook(() => useRegion());
    expect(result.current.supportedRegions).toEqual(['KR', 'US', 'JP']);
  });

  it('affiliateRegions가 반환된다', () => {
    const { result } = renderHook(() => useRegion());
    expect(result.current.affiliateRegions).toEqual(['KR', 'US']);
  });

  it('setRegion으로 지역을 변경한다', () => {
    const { result } = renderHook(() => useRegion());

    act(() => {
      result.current.setRegion('US');
    });

    expect(result.current.region).toBe('US');
    expect(result.current.isUserSelected).toBe(true);
    expect(mockSaveRegion).toHaveBeenCalledWith('US');
  });

  it('resetRegion으로 자동 감지로 초기화한다', () => {
    const { result } = renderHook(() => useRegion());

    act(() => {
      result.current.setRegion('JP');
    });
    expect(result.current.isUserSelected).toBe(true);

    act(() => {
      result.current.resetRegion();
    });

    expect(result.current.isUserSelected).toBe(false);
    expect(mockClearSavedRegion).toHaveBeenCalled();
  });

  it('regionInfo가 올바르게 반환된다', () => {
    const { result } = renderHook(() => useRegion());
    expect(result.current.regionInfo.code).toBe('KR');
    expect(result.current.regionInfo.name).toBe('한국');
  });

  it('getProductLinks가 함수로 반환된다', () => {
    const { result } = renderHook(() => useRegion());
    expect(result.current.getProductLinks).toBeInstanceOf(Function);
  });
});
