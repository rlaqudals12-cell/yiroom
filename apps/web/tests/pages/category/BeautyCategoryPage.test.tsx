/**
 * BeautyCategoryPage 테스트
 * @description 뷰티 카테고리 페이지 테스트
 *
 * [기능 제거] 기존 카테고리 페이지 UI(제품 목록/필터/정렬/제품 카드/카테고리별 표시)는
 * 가짜(mock) 제품만 표시하는 orphan 라우트여서 제거되고, /beauty로의 리다이렉트만 남음
 * (app/(main)/beauty/category/[slug]/page.tsx 참조).
 * 이에 따라 아래 구 UI 테스트 14건(렌더링 4, 네비게이션 3, 매칭률 필터 1, 정렬 2,
 * 제품 카드 2, 카테고리별 표시 2)은 삭제하고, 현행 동작인 리다이렉트만 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Next.js 라우터 모킹 — redirect는 실제 Next.js처럼 예외를 던져 렌더링을 중단시킨다
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useParams: () => ({ slug: 'skincare' }),
}));

import BeautyCategoryPage from '@/app/(main)/beauty/category/[slug]/page';

describe('BeautyCategoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('리다이렉트', () => {
    it('구 카테고리 라우트 접근 시 /beauty로 리다이렉트한다', () => {
      // redirect()는 예외를 던지므로 렌더링 자체가 중단된다
      // (React가 렌더 에러 시 재시도하므로 호출 횟수는 1회 이상일 수 있음 — 호출 여부와 인자만 검증)
      expect(() => render(<BeautyCategoryPage />)).toThrow('NEXT_REDIRECT:/beauty');
      expect(mockRedirect).toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledWith('/beauty');
    });
  });
});
