'use client';

/**
 * 제품함 페이지
 * - 사용자가 스캔한 제품 목록 표시
 * - 상태별 필터링 지원
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShelfList } from '@/components/scan/shelf/ShelfList';

export default function ShelfPage() {
  const router = useRouter();

  return (
    <div data-testid="shelf-page" className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-muted rounded-lg"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-lg">내 제품함</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/scan')} className="gap-2">
            <ScanLine className="w-4 h-4" />
            스캔
          </Button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6">
        {/* 제품함 vs 찜 혼동 방지 — 위시리스트 페이지와 대칭 안내 (IA-2) */}
        <p className="mb-5 text-sm text-muted-foreground">
          지금 쓰고 있는 제품을 담아두는 곳이에요. 담으면 맞춤 루틴에 반영돼요. 사고 싶은 제품은{' '}
          <Link href="/wishlist" className="text-primary underline underline-offset-2">
            위시리스트
          </Link>
          에 담아 두세요.
        </p>
        <ShelfList />
      </div>
    </div>
  );
}
