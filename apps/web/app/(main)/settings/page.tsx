'use client';

import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { NotificationSettings } from '@/components/notifications';

/**
 * 설정 페이지
 * 알림, 계정 등 앱 설정 관리
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" />
              설정
            </h1>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 알림 설정 */}
        <NotificationSettings />

        {/* 추가 설정 섹션 (필요시 확장) */}
        {/* <AccountSettings /> */}
        {/* <AppearanceSettings /> */}
      </div>
    </div>
  );
}
