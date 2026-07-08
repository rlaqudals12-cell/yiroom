'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Settings, Bell } from 'lucide-react';
import { FadeInUp } from '@/components/animations';

/**
 * 알림 페이지
 *
 * 실제 알림 수집/저장 경로가 아직 없어 정직한 빈 상태만 표시한다.
 * (이전 버전의 mock 알림 6건은 가짜 데이터라 제거 — 정직 원칙)
 * 알림 인프라가 연결되면 목록 렌더링을 복원한다.
 */
export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background" data-testid="notifications-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="뒤로가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">알림</h1>
          </div>
          <button
            onClick={() => router.push('/profile/settings?tab=notifications')}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            aria-label="알림 설정"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 본문 — 빈 상태 */}
      <div className="px-4 py-4">
        <FadeInUp>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">아직 알림이 없어요</p>
            <p className="text-sm text-muted-foreground mt-1">
              새로운 소식이 생기면 여기에서 알려드릴게요
            </p>
          </div>
        </FadeInUp>
      </div>
    </div>
  );
}
