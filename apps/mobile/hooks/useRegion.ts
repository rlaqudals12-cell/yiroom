'use client';

/**
 * 지역 관리 훅
 * - 현재 지역 감지/저장/변경
 * - 지역별 어필리에이트 파트너 조회
 */

import { useState, useEffect, useCallback } from 'react';
import {
  detectRegion,
  saveRegion,
  clearSavedRegion,
  hasUserSelectedRegion,
  getRegionInfo,
  getAffiliateRegions,
  SUPPORTED_REGIONS,
  type SupportedRegion,
  type RegionInfo,
} from '@/lib/region';
import {
  createRegionalDeeplinks,
  getRegionalPartners,
  type GlobalPartnerName,
  type GlobalDeeplinkResult,
} from '@/lib/affiliate/global-links';

export interface UseRegionReturn {
  /** 현재 지역 코드 */
  region: SupportedRegion;
  /** 현재 지역 정보 */
  regionInfo: RegionInfo;
  /** 사용자가 직접 선택했는지 여부 */
  isUserSelected: boolean;
  /** 지원 지역 목록 */
  supportedRegions: SupportedRegion[];
  /** 어필리에이트 지원 지역 목록 */
  affiliateRegions: SupportedRegion[];
  /** 현재 지역의 파트너 목록 */
  partners: GlobalPartnerName[];
  /** 지역 변경 */
  setRegion: (region: SupportedRegion) => void;
  /** 자동 감지로 초기화 */
  resetRegion: () => void;
  /** 제품 검색 딥링크 생성 */
  getProductLinks: (query: string, subId?: string) => GlobalDeeplinkResult[];
}

export function useRegion(): UseRegionReturn {
  const [region, setRegionState] = useState<SupportedRegion>('KR');
  const [isUserSelected, setIsUserSelected] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsClient(true);
    const detectedRegion = detectRegion();
    setRegionState(detectedRegion);
    setIsUserSelected(hasUserSelectedRegion());
  }, []);

  // 지역 변경 (localStorage에 저장)
  const setRegion = useCallback((newRegion: SupportedRegion) => {
    saveRegion(newRegion);
    setRegionState(newRegion);
    setIsUserSelected(true);
  }, []);

  // 자동 감지로 초기화
  const resetRegion = useCallback(() => {
    clearSavedRegion();
    const detectedRegion = detectRegion();
    setRegionState(detectedRegion);
    setIsUserSelected(false);
  }, []);

  // 제품 검색 딥링크 생성
  const getProductLinks = useCallback(
    (query: string, subId?: string): GlobalDeeplinkResult[] => {
      return createRegionalDeeplinks(region, query, subId);
    },
    [region]
  );

  // 현재 지역 정보
  const regionInfo = getRegionInfo(region);
  const partners = isClient ? getRegionalPartners(region) : [];
  const affiliateRegions = getAffiliateRegions();

  return {
    region,
    regionInfo,
    isUserSelected,
    supportedRegions: SUPPORTED_REGIONS,
    affiliateRegions,
    partners,
    setRegion,
    resetRegion,
    getProductLinks,
  };
}
