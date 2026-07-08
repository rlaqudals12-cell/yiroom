'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * 탭 상태를 URL 쿼리(?tab=)와 양방향 동기화하는 훅.
 *
 * 왜: 탭이 useState뿐이면 페이지를 벗어났다가 뒤로가기로 돌아올 때
 * 항상 첫 번째 탭으로 리셋된다. 탭 변경 시 router.replace로 쿼리를 갱신하고
 * (히스토리 오염 방지), 마운트/뒤로가기 시 쿼리에서 탭을 복원한다.
 *
 * - 무효한 쿼리 값은 defaultTab으로 폴백
 * - 기본 탭 선택 시에는 쿼리를 제거해 URL을 깨끗하게 유지
 * - 기존 쿼리 파라미터(q, source 등)는 복사 후 tab만 갱신하므로 보존됨
 */
export function useUrlTab<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
  paramKey = 'tab'
): [T, (tab: string) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawParam = searchParams?.get(paramKey) ?? null;
  const urlTab: T =
    rawParam !== null && (validTabs as readonly string[]).includes(rawParam)
      ? (rawParam as T)
      : defaultTab;

  const [activeTab, setActiveTabState] = useState<T>(urlTab);

  // 뒤로가기/외부 내비게이션으로 URL이 바뀌면 탭 상태도 따라간다
  useEffect(() => {
    setActiveTabState(urlTab);
  }, [urlTab]);

  const setActiveTab = useCallback(
    (tab: string) => {
      const next: T = (validTabs as readonly string[]).includes(tab) ? (tab as T) : defaultTab;
      setActiveTabState(next);

      // 기존 쿼리 파라미터 보존 — 복사 후 tab만 갱신
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (next === defaultTab) {
        params.delete(paramKey);
      } else {
        params.set(paramKey, next);
      }
      const qs = params.toString();
      // 히스토리 오염 방지를 위해 replace 사용, 탭 전환 시 스크롤 유지
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    },
    [validTabs, defaultTab, paramKey, searchParams, router]
  );

  return [activeTab, setActiveTab];
}
